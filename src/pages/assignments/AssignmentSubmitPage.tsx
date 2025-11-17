import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { assignmentService } from '@/lib/api/assignmentService'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'
import { ArrowLeft, Upload, CheckCircle2 } from 'lucide-react'

export default function AssignmentSubmitPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !assignmentId || !user) return

    setSubmitting(true)
    try {
      const result = await assignmentService.submitAssignment(
        parseInt(assignmentId),
        file,
        user.University_ID
      )
      if (result.success) {
        setSubmitted(true)
        setTimeout(() => {
          navigate(ROUTES.ASSIGNMENTS)
        }, 2000)
      } else {
        alert(result.error || 'Failed to submit assignment')
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <Card className="max-w-md mx-auto border border-[#e5e7e7] rounded-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-[#1f1d39]">Submission Successful!</h2>
              <p className="text-[#85878d]">Redirecting...</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Submit Assignment"
      subtitle="Upload your assignment file"
    >
      <div className="space-y-6 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.ASSIGNMENTS)}
          className="mb-4 border border-[#e5e7e7] hover:bg-gray-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assignments
        </Button>

        <Card className="border border-[#e5e7e7] rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl text-[#1f1d39]">Submit Assignment</CardTitle>
            <CardDescription className="text-[#85878d]">Upload your assignment file</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file" className="text-[#676767]">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                  className="cursor-pointer border-[#e5e7e7]"
                />
                {file && (
                  <p className="text-sm text-[#85878d]">
                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={!file || submitting}
                  className="flex-1 bg-black hover:bg-gray-800 text-white"
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(ROUTES.ASSIGNMENTS)}
                  className="border-[#e5e7e7] hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

