import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthProvider'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ContentEditorDialog, { type ContentItem, type ContentType } from './ContentEditorDialog'
import AssignmentSubmitDialog from './AssignmentSubmitDialog'
import QuizTakeDialog from './QuizTakeDialog'
import { ChevronRight, Edit2, FileText, BookOpen, HelpCircle, ClipboardList, Plus, Link as LinkIcon, Bell, Trash2, Download, Upload, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface CourseContent {
  id: string
  title: string
  icon: React.ReactNode
  contentType?: ContentType
}

const CONTENT_SECTIONS: CourseContent[] = [
  {
    id: 'general',
    title: 'General',
    icon: <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
    contentType: 'announcement',
  },
  {
    id: 'assignment',
    title: 'Assignment',
    icon: <ClipboardList className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
    contentType: 'assignment',
  },
  {
    id: 'slides',
    title: 'Slides',
    icon: <BookOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
    contentType: 'pdf',
  },
  {
    id: 'quiz',
    title: 'Quiz',
    icon: <HelpCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
    contentType: 'quiz',
  },
  {
    id: 'exercises',
    title: 'In-class Exercises/ Homeworks',
    icon: <ClipboardList className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
    contentType: 'assignment',
  },
]

interface CourseContentCardProps {
  courseId: number
}

export default function CourseContentCard({ courseId }: CourseContentCardProps) {
  const { role, user } = useAuth()
  const isTutor = role === 'tutor' || role === 'admin'
  const isStudent = role === 'student'
  const [contents, setContents] = useState<Record<string, ContentItem[]>>({})
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentSectionId, setCurrentSectionId] = useState<string>('')
  
  // Assignment submission
  const [submittingAssignment, setSubmittingAssignment] = useState<ContentItem | null>(null)
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Record<string, {
    fileName: string
    submittedAt: string
    fileUrl: string
  }>>({})
  
  // Quiz taking
  const [takingQuiz, setTakingQuiz] = useState<ContentItem | null>(null)
  const [quizResults, setQuizResults] = useState<Record<string, {
    score: number
    answers: Record<number, number>
    submittedAt: string
  }>>({})

  const storageKey = `course-content-${courseId}`
  const submissionStorageKey = `course-submissions-${courseId}-${user?.University_ID || ''}`
  const quizResultStorageKey = `course-quiz-results-${courseId}-${user?.University_ID || ''}`

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Convert old format to new format if needed
        const converted: Record<string, ContentItem[]> = {}
        Object.keys(parsed).forEach((sectionId) => {
          if (Array.isArray(parsed[sectionId])) {
            converted[sectionId] = parsed[sectionId]
          } else if (typeof parsed[sectionId] === 'string') {
            // Old format - convert to new format
            converted[sectionId] = [{
              id: Date.now().toString(),
              type: 'announcement',
              sectionId,
              title: '',
              content: parsed[sectionId],
              createdAt: new Date().toISOString(),
            }]
          }
        })
        setContents(converted)
      } catch (e) {
        console.error('Failed to load course content:', e)
      }
    }
    
    // Load submissions and quiz results for students
    if (isStudent) {
      const savedSubmissions = localStorage.getItem(submissionStorageKey)
      if (savedSubmissions) {
        try {
          setAssignmentSubmissions(JSON.parse(savedSubmissions))
        } catch (e) {
          console.error('Failed to load submissions:', e)
        }
      }
      
      const savedQuizResults = localStorage.getItem(quizResultStorageKey)
      if (savedQuizResults) {
        try {
          setQuizResults(JSON.parse(savedQuizResults))
        } catch (e) {
          console.error('Failed to load quiz results:', e)
        }
      }
    }
  }, [courseId, storageKey, submissionStorageKey, quizResultStorageKey, isStudent])

  const handleExpandAll = () => {
    if (expandedItems.length === CONTENT_SECTIONS.length) {
      setExpandedItems([])
    } else {
      setExpandedItems(CONTENT_SECTIONS.map((s) => s.id))
    }
  }

  const handleAddContent = (sectionId: string) => {
    setCurrentSectionId(sectionId)
    setEditingContent(null)
    setIsDialogOpen(true)
  }

  const handleEditContent = (sectionId: string, content: ContentItem) => {
    setCurrentSectionId(sectionId)
    setEditingContent(content)
    setIsDialogOpen(true)
  }

  const handleDeleteContent = (sectionId: string, contentId: string) => {
    if (confirm('Are you sure you want to delete this content?')) {
      const updated = {
        ...contents,
        [sectionId]: (contents[sectionId] || []).filter((c) => c.id !== contentId),
      }
      setContents(updated)
      localStorage.setItem(storageKey, JSON.stringify(updated))
    }
  }

  const handleSaveContent = (content: ContentItem) => {
    const sectionContents = contents[content.sectionId] || []
    const existingIndex = sectionContents.findIndex((c) => c.id === content.id)

    const updated = {
      ...contents,
      [content.sectionId]:
        existingIndex >= 0
          ? sectionContents.map((c, i) => (i === existingIndex ? content : c))
          : [...sectionContents, content],
    }

    setContents(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setIsDialogOpen(false)
    setEditingContent(null)
    setCurrentSectionId('')
  }

  const handleSubmitAssignment = async (assignment: ContentItem, file: File) => {
    // In real app, upload file to server and get file URL
    const fileUrl = URL.createObjectURL(file)
    
    const submission = {
      fileName: file.name,
      submittedAt: new Date().toISOString(),
      fileUrl,
    }
    
    const updated = {
      ...assignmentSubmissions,
      [assignment.id]: submission,
    }
    
    setAssignmentSubmissions(updated)
    localStorage.setItem(submissionStorageKey, JSON.stringify(updated))
  }

  const handleSubmitQuiz = async (quiz: ContentItem, answers: Record<number, number>) => {
    if (!quiz.quiz) return { score: 0, correctAnswers: 0, totalQuestions: 0 }
    
    // Calculate score
    let correctAnswers = 0
    quiz.quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++
      }
    })
    
    const totalQuestions = quiz.quiz.questions.length
    const score = (correctAnswers / totalQuestions) * 10
    
    const result = {
      score,
      answers,
      submittedAt: new Date().toISOString(),
    }
    
    const updated = {
      ...quizResults,
      [quiz.id]: result,
    }
    
    setQuizResults(updated)
    localStorage.setItem(quizResultStorageKey, JSON.stringify(updated))
    
    return { score, correctAnswers, totalQuestions }
  }

  const renderContentItem = (content: ContentItem) => {
    if (content.type === 'announcement') {
      return (
        <div className="p-4 border border-[#e5e7e7] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] space-y-3">
          {content.title && (
            <h4 className="font-semibold text-[#1f1d39] dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {content.title}
            </h4>
          )}
          {content.content && (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {content.content}
            </p>
          )}
          {content.links && content.links.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Links:</p>
              <div className="flex flex-wrap gap-2">
                {content.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(content.createdAt), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
      )
    }

    if (content.type === 'quiz') {
      const result = quizResults[content.id]
      const passed = result ? result.score >= (content.quiz?.passScore || 0) : false

      return (
        <div className="p-4 border border-[#e5e7e7] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h4 className="font-semibold text-[#1f1d39] dark:text-white flex-1">Quiz</h4>
            <Badge variant="outline" className="ml-auto">Pass: {content.quiz?.passScore}/10</Badge>
            {result && (
              <Badge 
                variant={passed ? "outline" : "destructive"}
                className={passed 
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                  : ""
                }
              >
                {result.score.toFixed(1)}/10
              </Badge>
            )}
          </div>
          {content.quiz && (
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Questions: {content.quiz.questions.length}</p>
              <p>Time Limit: {content.quiz.timeLimit}</p>
              {result && (
                <p className={`text-sm font-medium ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {passed ? '✓ Đạt' : '✗ Không đạt'}
                </p>
              )}
            </div>
          )}
          {isStudent && (
            <div className="mt-3 pt-3 border-t border-[#e5e7e7] dark:border-[#333]">
              <Button
                onClick={() => setTakingQuiz(content)}
                variant={result ? "outline" : "default"}
                className={result 
                  ? "w-full border-[#e5e7e7] dark:border-[#333]"
                  : "w-full bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                }
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                {result ? 'Xem kết quả' : 'Làm bài'}
              </Button>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(content.createdAt), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
      )
    }

    if (content.type === 'pdf') {
      return (
        <div className="p-4 border border-[#e5e7e7] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h4 className="font-semibold text-[#1f1d39] dark:text-white flex-1">{content.title}</h4>
          </div>
          {content.pdf && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Size: {(content.pdf.fileSize / 1024).toFixed(2)} KB</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(content.pdf?.fileUrl, '_blank')}
                className="border-[#e5e7e7] dark:border-[#333]"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(content.createdAt), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
      )
    }

    if (content.type === 'assignment') {
      const deadline = content.assignment ? new Date(content.assignment.deadline) : null
      const now = new Date()
      const isOverdue = deadline ? now > deadline : false
      const submission = assignmentSubmissions[content.id]
      const canSubmit = !isOverdue || submission // Can resubmit even if overdue

      return (
        <div className="p-4 border border-[#e5e7e7] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h4 className="font-semibold text-[#1f1d39] dark:text-white flex-1">{content.title}</h4>
            {submission && (
              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                Đã nộp
              </Badge>
            )}
            {isOverdue && !submission && (
              <Badge variant="destructive">Đã hết hạn</Badge>
            )}
          </div>
          {content.assignment && (
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Max Score: {content.assignment.maxScore}</p>
              <p className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                Deadline: {format(new Date(content.assignment.deadline), 'MMM dd, yyyy HH:mm')}
                {isOverdue && ' (Đã hết hạn)'}
              </p>
              {content.assignment.acceptedFormat && (
                <p>Format: {content.assignment.acceptedFormat}</p>
              )}
              {content.assignment.instructions && (
                <p className="text-xs whitespace-pre-wrap">{content.assignment.instructions}</p>
              )}
              {content.assignment.attachment && (
                <div className="mt-3 p-3 border border-[#e5e7e7] dark:border-[#333] rounded-lg bg-gray-50 dark:bg-[#2a2a2a]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-[#211c37] dark:text-white">
                          {content.assignment.attachment.fileName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(content.assignment.attachment.fileSize / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(content.assignment?.attachment?.fileUrl, '_blank')}
                      className="border-[#e5e7e7] dark:border-[#333]"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Tải xuống
                    </Button>
                  </div>
                </div>
              )}
              {isStudent && (
                <div className="mt-3 pt-3 border-t border-[#e5e7e7] dark:border-[#333]">
                  <Button
                    onClick={() => setSubmittingAssignment(content)}
                    disabled={!canSubmit}
                    className="w-full bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {submission ? 'Nộp lại' : 'Nộp bài'}
                  </Button>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(content.createdAt), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-3">
      <Accordion
        type="multiple"
        value={expandedItems}
        onValueChange={setExpandedItems}
        className="space-y-3"
      >
        {CONTENT_SECTIONS.map((section, index) => {
          const sectionContents = contents[section.id] || []
          const isEmpty = sectionContents.length === 0

          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              className={cn(
                "border border-gray-200 dark:border-[#333] rounded-xl bg-white dark:bg-[#1a1a1a] px-4 border-b-0",
                "hover:shadow-sm transition-shadow"
              )}
            >
              <div className="flex items-center justify-between">
                <AccordionTrigger className="flex-1 hover:no-underline py-4 [&>svg]:hidden">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <ChevronRight 
                        className={cn(
                          "h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-200",
                          expandedItems.includes(section.id) && "rotate-90"
                        )} 
                      />
                    </div>
                    <span className="font-semibold text-[#1f1d39] dark:text-white text-base">
                      {section.title}
                    </span>
                    {!isEmpty && (
                      <Badge variant="secondary" className="ml-2">
                        {sectionContents.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                
                {index === 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExpandAll()
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mr-4 font-medium"
                  >
                    {expandedItems.length === CONTENT_SECTIONS.length ? 'Collapse all' : 'Expand all'}
                  </button>
                )}

                {isTutor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddContent(section.id)
                    }}
                    className="ml-2 h-8 px-3 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                  >
                    <Plus className="h-4 w-4 mr-1 text-gray-600 dark:text-gray-400" />
                    Add
                  </Button>
                )}
              </div>

              <AccordionContent className="pb-4 pt-0">
                {isEmpty ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic ml-11">
                    No content available
                  </div>
                ) : (
                  <div className="space-y-3 ml-11">
                    {sectionContents.map((content) => (
                      <div key={content.id} className="group relative">
                        {renderContentItem(content)}
                        {isTutor && (
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditContent(section.id, content)}
                              className="h-7 w-7 p-0 bg-white dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333]"
                            >
                              <Edit2 className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContent(section.id, content.id)}
                              className="h-7 w-7 p-0 bg-white dark:bg-[#2a2a2a] hover:bg-red-100 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <ContentEditorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        sectionId={currentSectionId}
        sectionTitle={CONTENT_SECTIONS.find((s) => s.id === currentSectionId)?.title || ''}
        defaultContentType={CONTENT_SECTIONS.find((s) => s.id === currentSectionId)?.contentType || 'announcement'}
        initialContent={editingContent || undefined}
        onSave={handleSaveContent}
      />

      {/* Assignment Submit Dialog */}
      {submittingAssignment && (
        <AssignmentSubmitDialog
          open={!!submittingAssignment}
          onOpenChange={(open) => !open && setSubmittingAssignment(null)}
          assignment={submittingAssignment}
          onSubmit={async (file) => {
            await handleSubmitAssignment(submittingAssignment, file)
            setSubmittingAssignment(null)
          }}
          existingSubmission={submittingAssignment.id in assignmentSubmissions ? assignmentSubmissions[submittingAssignment.id] : undefined}
        />
      )}

      {/* Quiz Take Dialog */}
      {takingQuiz && (
        <QuizTakeDialog
          open={!!takingQuiz}
          onOpenChange={(open) => !open && setTakingQuiz(null)}
          quiz={takingQuiz}
          onSubmit={async (answers) => {
            return await handleSubmitQuiz(takingQuiz, answers)
          }}
          existingResult={takingQuiz.id in quizResults ? quizResults[takingQuiz.id] : undefined}
        />
      )}
    </div>
  )
}
