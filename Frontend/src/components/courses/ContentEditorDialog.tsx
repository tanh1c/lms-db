import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Plus, X, Upload, Link as LinkIcon, FileText, HelpCircle, ClipboardList, Bell } from 'lucide-react'

export type ContentType = 'announcement' | 'quiz' | 'pdf' | 'assignment'

export interface ContentItem {
  id: string
  type: ContentType
  sectionId: string
  title?: string
  content?: string
  links?: Array<{ label: string; url: string }>
  quiz?: {
    questions: Array<{
      id: string
      question: string
      answers: string[]
      correctAnswer: number
    }>
    passScore: number
    timeLimit: string
  }
  pdf?: {
    fileName: string
    fileUrl: string
    fileSize: number
  }
  assignment?: {
    maxScore: number
    deadline: string
    acceptedFormat?: string
    instructions?: string
    attachment?: {
      fileName: string
      fileUrl: string
      fileSize: number
    }
  }
  createdAt: string
}

interface ContentEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionId: string
  sectionTitle: string
  defaultContentType?: ContentType
  initialContent?: ContentItem
  onSave: (content: ContentItem) => void
}

export default function ContentEditorDialog({
  open,
  onOpenChange,
  sectionId,
  sectionTitle,
  defaultContentType = 'announcement',
  initialContent,
  onSave,
}: ContentEditorDialogProps) {
  const [activeTab, setActiveTab] = useState<ContentType>(defaultContentType)
  
  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([])
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  
  // Quiz state
  const [questions, setQuestions] = useState<Array<{
    id: string
    question: string
    answers: string[]
    correctAnswer: number
  }>>([])
  const [passScore, setPassScore] = useState('5')
  const [timeLimit, setTimeLimit] = useState('01:00:00')
  
  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  
  // Assignment state
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [maxScore, setMaxScore] = useState('10')
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [acceptedFormat, setAcceptedFormat] = useState('')
  const [instructions, setInstructions] = useState('')
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null)

  useEffect(() => {
    if (!open) return

    if (initialContent) {
      // Editing existing content
      setActiveTab(initialContent.type)
      if (initialContent.type === 'announcement') {
        setAnnouncementTitle(initialContent.title || '')
        setAnnouncementContent(initialContent.content || '')
        setLinks(initialContent.links || [])
      } else if (initialContent.type === 'quiz') {
        setQuestions(initialContent.quiz?.questions || [])
        setPassScore(initialContent.quiz?.passScore.toString() || '5')
        setTimeLimit(initialContent.quiz?.timeLimit || '01:00:00')
      } else if (initialContent.type === 'assignment') {
        setAssignmentTitle(initialContent.title || '')
        setMaxScore(initialContent.assignment?.maxScore.toString() || '10')
        if (initialContent.assignment?.deadline) {
          setDeadline(new Date(initialContent.assignment.deadline))
        } else {
          setDeadline(undefined)
        }
        setAcceptedFormat(initialContent.assignment?.acceptedFormat || '')
        setInstructions(initialContent.assignment?.instructions || '')
        setAssignmentFile(null) // Reset file input, existing file will be shown separately
      } else if (initialContent.type === 'pdf') {
        // PDF cannot be edited, but we can show the file
        // In real app, you might want to allow re-upload
      }
    } else {
      // Creating new content
      setActiveTab(defaultContentType)
      // Reset all fields
      setAnnouncementTitle('')
      setAnnouncementContent('')
      setLinks([])
      setLinkLabel('')
      setLinkUrl('')
      setQuestions([])
      setPassScore('5')
      setTimeLimit('01:00:00')
      setPdfFile(null)
      setAssignmentTitle('')
      setMaxScore('10')
      setDeadline(undefined)
      setAcceptedFormat('')
      setInstructions('')
      setAssignmentFile(null)
    }
  }, [initialContent, open, defaultContentType])

  const handleAddLink = () => {
    if (linkLabel.trim() && linkUrl.trim()) {
      setLinks([...links, { label: linkLabel.trim(), url: linkUrl.trim() }])
      setLinkLabel('')
      setLinkUrl('')
    }
  }

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        question: '',
        answers: ['', '', '', ''],
        correctAnswer: 0,
      },
    ])
  }

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleUpdateQuestion = (id: string, field: string, value: string | number | string[]) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    )
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === 'application/pdf') {
        setPdfFile(file)
      } else {
        alert('Please select a PDF file')
      }
    }
  }

  const handleSave = () => {
    const contentItem: ContentItem = {
      id: initialContent?.id || Date.now().toString(),
      type: activeTab,
      sectionId,
      createdAt: initialContent?.createdAt || new Date().toISOString(),
    }

    if (activeTab === 'announcement') {
      if (!announcementTitle.trim() || !announcementContent.trim()) {
        alert('Please fill in title and content')
        return
      }
      contentItem.title = announcementTitle.trim()
      contentItem.content = announcementContent.trim()
      contentItem.links = links
    } else if (activeTab === 'quiz') {
      if (questions.length === 0) {
        alert('Please add at least one question')
        return
      }
      // Validate all questions have question text and at least 2 answers with correct answer selected
      const invalidQuestions = questions.filter((q) => {
        return !q.question.trim() || 
               q.answers.filter(a => a.trim()).length < 2 ||
               q.correctAnswer < 0 ||
               q.correctAnswer >= q.answers.length ||
               !q.answers[q.correctAnswer]?.trim()
      })
      if (invalidQuestions.length > 0) {
        alert('Please complete all questions with at least 2 answers and select a correct answer')
        return
      }
      contentItem.title = 'Quiz'
      contentItem.quiz = {
        questions: questions.map(q => ({
          ...q,
          answers: q.answers.filter(a => a.trim()) // Remove empty answers
        })),
        passScore: parseFloat(passScore),
        timeLimit,
      }
    } else if (activeTab === 'pdf') {
      if (!pdfFile) {
        alert('Please select a PDF file')
        return
      }
      contentItem.title = pdfFile.name
      contentItem.pdf = {
        fileName: pdfFile.name,
        fileUrl: URL.createObjectURL(pdfFile), // In real app, upload to server
        fileSize: pdfFile.size,
      }
    } else if (activeTab === 'assignment') {
      if (!assignmentTitle.trim() || !deadline || !maxScore) {
        alert('Please fill in all required fields (Title, Deadline, Max Score)')
        return
      }
      // Validate deadline is in the future
      if (deadline <= new Date()) {
        alert('Deadline must be in the future')
        return
      }
      contentItem.title = assignmentTitle.trim()
      
      // Handle file attachment
      let attachment = undefined
      if (assignmentFile) {
        attachment = {
          fileName: assignmentFile.name,
          fileUrl: URL.createObjectURL(assignmentFile), // In real app, upload to server
          fileSize: assignmentFile.size,
        }
      } else if (initialContent?.type === 'assignment' && initialContent.assignment?.attachment) {
        // Preserve existing attachment if no new file is uploaded
        attachment = initialContent.assignment.attachment
      }
      
      contentItem.assignment = {
        maxScore: parseFloat(maxScore),
        deadline: deadline.toISOString(),
        acceptedFormat: acceptedFormat.trim() || undefined,
        instructions: instructions.trim() || undefined,
        attachment,
      }
    }

    onSave(contentItem)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-[#1a1a1a] border-[#e5e7e7] dark:border-[#333] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#211c37] dark:text-white">
            {initialContent ? 'Edit' : 'Add'} Content - {sectionTitle}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Choose the type of content you want to add to this section
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-[#2a2a2a]">
            <TabsTrigger value="announcement" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]">
              <Bell className="h-4 w-4 mr-2" />
              Announcement
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]">
              <HelpCircle className="h-4 w-4 mr-2" />
              Quiz
            </TabsTrigger>
            <TabsTrigger value="pdf" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]">
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="assignment" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]">
              <ClipboardList className="h-4 w-4 mr-2" />
              Assignment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcement" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-title" className="text-[#211c37] dark:text-white">
                Title *
              </Label>
              <Input
                id="announcement-title"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Enter announcement title"
                className="border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-content" className="text-[#211c37] dark:text-white">
                Content *
              </Label>
              <Textarea
                id="announcement-content"
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="Enter announcement content..."
                className="min-h-[200px] border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#211c37] dark:text-white">Links</Label>
              <div className="flex gap-2">
                <Input
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Link label"
                  className="flex-1 border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white"
                />
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                  className="flex-1 border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white"
                />
                <Button type="button" onClick={handleAddLink} size="sm" variant="outline">
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {links.length > 0 && (
                <div className="space-y-2 mt-2">
                  {links.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded border border-[#e5e7e7] dark:border-[#333]">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          {link.label}
                        </a>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLink(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pass-score" className="text-[#211c37] dark:text-white">
                  Pass Score (0-10)
                </Label>
                <Input
                  id="pass-score"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={passScore}
                  onChange={(e) => setPassScore(e.target.value)}
                  className="border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-limit" className="text-[#211c37] dark:text-white">
                  Time Limit (HH:mm:ss)
                </Label>
                <Input
                  id="time-limit"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  placeholder="01:00:00"
                  className="border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[#211c37] dark:text-white">Questions</Label>
                <Button type="button" onClick={handleAddQuestion} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, qIndex) => (
                <div key={question.id} className="p-4 border border-[#e5e7e7] dark:border-[#333] rounded-lg bg-gray-50 dark:bg-[#2a2a2a] space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Question {qIndex + 1}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="h-6 w-6 p-0 text-red-600 dark:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#211c37] dark:text-white">Question</Label>
                    <Input
                      value={question.question}
                      onChange={(e) => handleUpdateQuestion(question.id, 'question', e.target.value)}
                      placeholder="Enter question..."
                      className="border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#211c37] dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#211c37] dark:text-white">Answers</Label>
                    {question.answers.map((answer, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswer === aIndex}
                          onChange={() => handleUpdateQuestion(question.id, 'correctAnswer', aIndex)}
                          className="h-4 w-4"
                        />
                        <Input
                          value={answer}
                          onChange={(e) => {
                            const newAnswers = [...question.answers]
                            newAnswers[aIndex] = e.target.value
                            handleUpdateQuestion(question.id, 'answers', newAnswers)
                          }}
                          placeholder={`Answer ${aIndex + 1}`}
                          className="flex-1 border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#211c37] dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No questions added yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pdf" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-file" className="text-[#211c37] dark:text-white">
                Upload PDF Document
              </Label>
              <div className="border-2 border-dashed border-[#e5e7e7] dark:border-[#333] rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfChange}
                  className="cursor-pointer border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white"
                />
                {pdfFile && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{pdfFile.name}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">{(pdfFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assignment" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="assignment-title" className="text-[#211c37] dark:text-white">
                Assignment Title *
              </Label>
              <Input
                id="assignment-title"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                placeholder="Enter assignment title"
                className="border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-score" className="text-[#211c37] dark:text-white">
                  Max Score *
                </Label>
                <Input
                  id="max-score"
                  type="number"
                  min="1"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-[#211c37] dark:text-white">
                  Deadline *
                </Label>
                <DateTimePicker
                  date={deadline}
                  onDateChange={setDeadline}
                  placeholder="Select deadline"
                  minDate={new Date()}
                  className="border-[#e5e7e7] dark:border-[#333]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accepted-format" className="text-[#211c37] dark:text-white">
                Accepted File Format
              </Label>
              <Input
                id="accepted-format"
                value={acceptedFormat}
                onChange={(e) => setAcceptedFormat(e.target.value)}
                placeholder="e.g., pdf, doc, docx"
                className="border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-[#211c37] dark:text-white">
                Instructions
              </Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter assignment instructions..."
                className="min-h-[150px] border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment-file" className="text-[#211c37] dark:text-white">
                Đề bài (File đính kèm)
              </Label>
              <div className="flex flex-col gap-2">
                {initialContent?.type === 'assignment' && initialContent.assignment?.attachment && !assignmentFile && (
                  <div className="p-3 border border-[#e5e7e7] dark:border-[#333] rounded-lg bg-gray-50 dark:bg-[#2a2a2a] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-[#211c37] dark:text-white">
                          {initialContent.assignment.attachment.fileName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(initialContent.assignment.attachment.fileSize / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <a
                      href={initialContent.assignment.attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Xem
                    </a>
                  </div>
                )}
                <div className="relative">
                  <input
                    id="assignment-file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setAssignmentFile(file)
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="assignment-file"
                    className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-[#e5e7e7] dark:border-[#333] rounded-lg bg-white dark:bg-[#2a2a2a] hover:border-[#3bafa8] dark:hover:border-[#3bafa8] cursor-pointer transition-colors"
                  >
                    <Upload className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-[#211c37] dark:text-white">
                      {assignmentFile ? assignmentFile.name : 'Chọn file đề bài'}
                    </span>
                  </label>
                </div>
                {assignmentFile && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                      {assignmentFile.name} ({(assignmentFile.size / 1024).toFixed(2)} KB)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssignmentFile(null)}
                      className="h-6 w-6 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#e5e7e7] dark:border-[#333]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
          >
            {initialContent ? 'Update' : 'Add'} Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

