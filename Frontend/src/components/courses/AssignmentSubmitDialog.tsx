import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import type { ContentItem } from './ContentEditorDialog'

interface AssignmentSubmitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: ContentItem
  onSubmit: (file: File) => Promise<void>
  existingSubmission?: {
    fileName: string
    submittedAt: string
    fileUrl: string
  }
}

export default function AssignmentSubmitDialog({
  open,
  onOpenChange,
  assignment,
  onSubmit,
  existingSubmission,
}: AssignmentSubmitDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!assignment.assignment) return null

  const deadline = new Date(assignment.assignment.deadline)
  const now = new Date()
  const isOverdue = now > deadline
  const canSubmit = !isOverdue || existingSubmission // Can resubmit even if overdue if already submitted

  const handleSubmit = async () => {
    if (!selectedFile && !existingSubmission) {
      alert('Vui lòng chọn file để nộp bài')
      return
    }

    if (selectedFile) {
      setIsSubmitting(true)
      try {
        await onSubmit(selectedFile)
        setSelectedFile(null)
        onOpenChange(false)
      } catch (error) {
        console.error('Error submitting assignment:', error)
        alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-[#1a1a1a] border-[#e5e7e7] dark:border-[#333] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#211c37] dark:text-white text-xl">
            {assignment.title || 'Assignment'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {assignment.assignment.instructions || 'Nộp bài assignment của bạn'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Assignment Details */}
          <div className="space-y-3 p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a] rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#211c37] dark:text-white">Max Score:</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{assignment.assignment.maxScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#211c37] dark:text-white">Deadline:</span>
              <span className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {format(deadline, 'dd/MM/yyyy HH:mm')}
                {isOverdue && ' (Đã hết hạn)'}
              </span>
            </div>
            {assignment.assignment.acceptedFormat && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#211c37] dark:text-white">Format được chấp nhận:</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{assignment.assignment.acceptedFormat}</span>
              </div>
            )}
          </div>

          {/* Assignment File Download */}
          {assignment.assignment.attachment && (
            <div className="p-4 border border-[#e5e7e7] dark:border-[#333] rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Label className="text-sm font-medium text-[#211c37] dark:text-white mb-2 block">
                Đề bài:
              </Label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {assignment.assignment.attachment.fileName}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(assignment.assignment?.attachment?.fileUrl, '_blank')}
                  className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                >
                  Tải xuống
                </Button>
              </div>
            </div>
          )}

          {/* Existing Submission */}
          {existingSubmission && (
            <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                  Đã nộp bài:
                </Label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 dark:text-green-300">{existingSubmission.fileName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(existingSubmission.fileUrl, '_blank')}
                    className="text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                  >
                    Xem
                  </Button>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Nộp lúc: {format(new Date(existingSubmission.submittedAt), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="submission-file" className="text-[#211c37] dark:text-white">
              File nộp bài {existingSubmission && '(Nộp lại)'}:
            </Label>
            <div className="relative">
              <input
                id="submission-file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Validate file format if specified
                    if (assignment.assignment?.acceptedFormat) {
                      const formats = assignment.assignment.acceptedFormat.split(',').map(f => f.trim().toLowerCase())
                      const fileExt = file.name.split('.').pop()?.toLowerCase()
                      if (fileExt && !formats.includes(fileExt)) {
                        alert(`File format không hợp lệ. Chỉ chấp nhận: ${assignment.assignment.acceptedFormat}`)
                        return
                      }
                    }
                    setSelectedFile(file)
                  }
                }}
                className="hidden"
                disabled={!canSubmit || isSubmitting}
              />
              <label
                htmlFor="submission-file"
                className={`
                  flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg 
                  cursor-pointer transition-colors
                  ${!canSubmit || isSubmitting
                    ? 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#2a2a2a] cursor-not-allowed opacity-50'
                    : 'border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] hover:border-[#3bafa8] dark:hover:border-[#3bafa8]'
                  }
                `}
              >
                <Upload className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-[#211c37] dark:text-white">
                  {selectedFile ? selectedFile.name : 'Chọn file nộp bài'}
                </span>
              </label>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="h-6 w-6 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFile(null)
              onOpenChange(false)
            }}
            disabled={isSubmitting}
            className="border-[#e5e7e7] dark:border-[#333]"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={(!selectedFile && !existingSubmission) || !canSubmit || isSubmitting}
            className="bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
          >
            {isSubmitting ? 'Đang nộp...' : existingSubmission ? 'Nộp lại' : 'Nộp bài'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

