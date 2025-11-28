import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { quizService } from '@/lib/api/quizService'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'
import { ArrowLeft, Clock, AlertCircle, ChevronLeft, ChevronRight, List, FileText } from 'lucide-react'
import type { QuizQuestion } from '@/lib/api/adminService'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode,
  getNeoBrutalismCardClasses, 
  getNeoBrutalismTextClasses,
  getNeoBrutalismButtonClasses
} from '@/lib/utils/theme-utils'

type ViewMode = 'full' | 'single'

export default function QuizTakePage() {
  const { t } = useTranslation()
  const { quizId } = useParams<{ quizId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const neoBrutalismMode = useNeoBrutalismMode()
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({}) // Format: { questionIndex: answerKey }
  const [timeLeft, setTimeLeft] = useState(3600) // 1 hour in seconds
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('single') // 'full' or 'single'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isQuizCompleted, setIsQuizCompleted] = useState(false) // Track if quiz is already completed
  
  // Get courseId and sectionId from URL params for navigation back
  const courseId = searchParams.get('courseId')
  const sectionId = searchParams.get('sectionId')

  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) return
      
      try {
        const data = await quizService.getQuizById(parseInt(quizId), user?.University_ID)
        setQuiz(data)
        if (data && data.Time_limits) {
          // Parse time limits (HH:MM:SS)
          const [hours, minutes, seconds] = data.Time_limits.split(':').map(Number)
          setTimeLeft(hours * 3600 + minutes * 60 + seconds)
        }
        
        // Parse Questions JSON if available
        if (data && data.Questions) {
          try {
            const parsedQuestions: QuizQuestion[] = JSON.parse(data.Questions)
            setQuestions(parsedQuestions)
            console.log('Loaded questions:', parsedQuestions.length)
          } catch (error) {
            console.error('Error parsing questions:', error)
            setQuestions([])
          }
        } else {
          setQuestions([])
        }
        
        // Check if quiz is already completed and load responses
        if (data && data.Responses && data.completion_status && 
            (data.completion_status === 'Passed' || data.completion_status === 'Failed' || data.completion_status === 'Submitted')) {
          setIsQuizCompleted(true)
          try {
            let parsedResponses: Record<string, string> = {}
            
            // Handle different response formats
            if (typeof data.Responses === 'string') {
              // Try to parse as JSON first
              try {
                parsedResponses = JSON.parse(data.Responses)
              } catch (jsonError) {
                // If not JSON, try comma-separated format: "A,B,B,D,A,C,D,B,D,C"
                const responsesArray = data.Responses.split(',')
                responsesArray.forEach((response: string, index: number) => {
                  parsedResponses[index.toString()] = response.trim()
                })
                console.log('Parsed comma-separated responses:', parsedResponses)
              }
            } else if (typeof data.Responses === 'object') {
              // Already an object
              parsedResponses = data.Responses
            }
            
            // Ensure all keys are strings to match questionKey format
            const normalizedResponses: Record<string, string> = {}
            Object.keys(parsedResponses).forEach(key => {
              normalizedResponses[key.toString()] = parsedResponses[key]
            })
            setAnswers(normalizedResponses)
            console.log('Loaded previous responses:', normalizedResponses)
          } catch (error) {
            console.error('Error parsing responses:', error, 'Responses:', data.Responses)
          }
        } else {
          setIsQuizCompleted(false)
        }
      } catch (error) {
        console.error('Error loading quiz:', error)
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [quizId, user?.University_ID])

  useEffect(() => {
    // Don't run timer if quiz is already completed (review mode)
    if (isQuizCompleted) {
      return
    }

    if (timeLeft <= 0) {
      handleSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isQuizCompleted])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSubmit = async () => {
    if (!quizId) return
    setSubmitting(true)
    
    try {
      // Convert answers to format expected by backend
      // Format: { questionIndex: answerKey } -> { "0": "A", "1": "B", ... }
      const result = await quizService.submitQuiz(parseInt(quizId), answers)
      if (result.success) {
        navigate(ROUTES.QUIZ_RESULT.replace(':quizId', quizId))
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setSubmitting(false)
    }
  }
  
  // Check if all questions are answered
  const allQuestionsAnswered = questions.length > 0 && questions.every((_, index) => answers[index.toString()] !== undefined)
  
  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }
  
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index)
    }
  }
  
  // Get question status (answered or not)
  const getQuestionStatus = (index: number) => {
    return answers[index.toString()] !== undefined ? 'answered' : 'unanswered'
  }

  // Check if answer is correct
  const isAnswerCorrect = (questionIndex: number) => {
    if (!isQuizCompleted) return null
    const question = questions[questionIndex]
    if (!question) return null
    const selectedAnswer = answers[questionIndex.toString()]
    const correctAnswer = question.correct
    return selectedAnswer === correctAnswer
  }

  // Get correct answer for a question
  const getCorrectAnswer = (questionIndex: number) => {
    const question = questions[questionIndex]
    return question?.correct || null
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('quizTake.loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!quiz) {
    return (
      <DashboardLayout>
        <div className="text-[#85878d]">{t('errors.quizNotFound')}</div>
      </DashboardLayout>
    )
  }

  const isTimeUp = timeLeft <= 0
  const isQuizDisabled = isQuizCompleted || isTimeUp || submitting

  return (
    <DashboardLayout 
      title={quiz.content || `Quiz ${quiz.Assessment_ID || quiz.QuizID || quizId}`}
      subtitle={t('quizTake.title')}
    >
      <div className="flex justify-center">
        <div className="w-full max-w-7xl">
          {/* Back Button */}
        <Button
          variant="ghost"
            onClick={() => {
              // Navigate back to course section if courseId and sectionId are available
              if (courseId && sectionId) {
                navigate(ROUTES.SECTION_DETAIL
                  .replace(':courseId', courseId)
                  .replace(':sectionId', sectionId)
                )
              } else if (quiz?.Course_ID && quiz?.Section_ID) {
                // Fallback: use quiz data if available
                navigate(ROUTES.SECTION_DETAIL
                  .replace(':courseId', quiz.Course_ID.toString())
                  .replace(':sectionId', quiz.Section_ID.toString())
                )
              } else {
                // Final fallback: go to quizzes list
                navigate(ROUTES.QUIZZES)
              }
            }}
            className={cn(
              "mb-4",
              neoBrutalismMode
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                : "border border-[#e5e7e7] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
            )}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
            {courseId && sectionId ? (t('quizTake.backToCourse') || 'Back to Course') : (t('quizTake.backToQuizzes') || 'Back to Quizzes')}
        </Button>

          {/* Main Layout: Left (Quiz Content) + Right (Info/Timer/Nav) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Quiz Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quiz Results Card (if completed) */}
              {isQuizCompleted && quiz && (
                <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
                    <CardTitle className={cn(
                      "text-xl text-[#1f1d39] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                    )}>
                      {t('quizTake.quizResults') || 'Quiz Results'}
                    </CardTitle>
                    <CardDescription className={cn(
                      "text-[#85878d] dark:text-gray-400",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('quizTake.quizCompleted') || 'You have already completed this quiz.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={cn(
                        "p-4 rounded-lg",
                        "bg-gray-50 dark:bg-[#1a1a1a]",
                        neoBrutalismMode
                          ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                          : "border border-[#e5e7e7] dark:border-[#333]"
                      )}>
                        <p className={cn(
                          "text-sm text-gray-600 dark:text-gray-400 mb-1",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>
                          {t('quizTake.score') || 'Score'}
                        </p>
                        <p className={cn(
                          "text-2xl font-bold",
                          quiz.score !== null && quiz.score !== undefined
                            ? (quiz.score >= (quiz.pass_score || 0) 
                                ? "text-green-600 dark:text-green-400" 
                                : "text-red-600 dark:text-red-400")
                            : "text-gray-600 dark:text-gray-400",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                          {quiz.score !== null && quiz.score !== undefined 
                            ? `${quiz.score.toFixed(2)} / ${quiz.pass_score || 10}` 
                            : t('quizTake.notGraded') || 'Not Graded'}
                        </p>
              </div>
                      <div className={cn(
                        "p-4 rounded-lg",
                        "bg-gray-50 dark:bg-[#1a1a1a]",
                        neoBrutalismMode
                          ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                          : "border border-[#e5e7e7] dark:border-[#333]"
                      )}>
                        <p className={cn(
                          "text-sm text-gray-600 dark:text-gray-400 mb-1",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>
                          {t('quizTake.status') || 'Status'}
                        </p>
                        <Badge 
                          className={cn(
                            "text-base px-3 py-1",
                            quiz.completion_status === 'Passed'
                              ? "bg-green-500 dark:bg-green-600 text-white"
                              : quiz.completion_status === 'Failed'
                              ? "bg-red-500 dark:bg-red-600 text-white"
                              : "bg-blue-500 dark:bg-blue-600 text-white"
                          )}
                        >
                          {quiz.completion_status === 'Passed' 
                            ? (t('quizTake.passed') || 'Passed')
                            : quiz.completion_status === 'Failed'
                            ? (t('quizTake.failed') || 'Failed')
                            : quiz.completion_status === 'Submitted'
                            ? (t('quizTake.submitted') || 'Submitted')
                            : quiz.completion_status || t('quizTake.unknown') || 'Unknown'}
                        </Badge>
              </div>
            </div>
                  </CardContent>
                </Card>
              )}

              {/* Quiz Content Card */}
              <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                <CardContent className="pt-6">
                  {isTimeUp && !isQuizCompleted && (
                    <div className={cn(
                      "flex items-center gap-2 p-4 mb-6",
                      "bg-red-50 dark:bg-red-900/20 border rounded-lg text-red-700 dark:text-red-400",
                      neoBrutalismMode
                        ? "border-4 border-red-600 dark:border-red-400 rounded-none"
                        : "border-red-200 dark:border-red-800"
                    )}>
                <AlertCircle className="h-5 w-5" />
                <span>{t('quizTake.timeUp')}</span>
              </div>
            )}

                  {isQuizCompleted && (
                    <div className={cn(
                      "flex items-center gap-2 p-4 mb-6",
                      "bg-blue-50 dark:bg-blue-900/20 border rounded-lg text-blue-700 dark:text-blue-400",
                      neoBrutalismMode
                        ? "border-4 border-blue-600 dark:border-blue-400 rounded-none"
                        : "border-blue-200 dark:border-blue-800"
                    )}>
                      <AlertCircle className="h-5 w-5" />
                      <span>{t('quizTake.quizAlreadyCompleted') || 'This quiz has already been completed. You can review your answers below.'}</span>
                    </div>
                  )}

                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>{t('quizTake.noQuestions') || 'No questions available for this quiz.'}</p>
                    </div>
                  ) : viewMode === 'single' ? (
                // Single Question View
                <div className="space-y-6">
                  {(() => {
                    const question = questions[currentQuestionIndex]
                    const questionKey = currentQuestionIndex.toString()
                    const selectedAnswer = answers[questionKey] || ''
                    
                    return (
                      <div className={cn(
                        "p-6 rounded-md",
                        "bg-gray-50 dark:bg-[#1a1a1a]",
                        neoBrutalismMode
                          ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                          : "border border-[#e5e7e7] dark:border-[#333]"
                      )}>
                        <div className="flex items-start gap-3 mb-6">
                          <Badge className="bg-[#3bafa8] text-white flex-shrink-0 text-lg px-4 py-2">
                            Q{currentQuestionIndex + 1}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            {question.question.vi && (
                              <p className="text-lg font-medium text-[#211c37] dark:text-white mb-3 break-words leading-relaxed">
                                {question.question.vi}
                              </p>
                            )}
                            {question.question.en && (
                              <p className="text-base text-gray-500 dark:text-gray-400 italic break-words leading-relaxed">
                                {question.question.en}
                              </p>
                            )}
                          </div>
              </div>

              <RadioGroup
                          value={selectedAnswer}
                onValueChange={(value) => {
                            if (!isQuizDisabled) {
                              setAnswers({ ...answers, [questionKey]: value })
                            }
                }}
                          disabled={isQuizDisabled}
              >
                <div className="space-y-3">
                            {Object.keys(question.answers).sort().map((option) => {
                              const answer = question.answers[option]
                              const isSelected = selectedAnswer === option
                              const isCorrect = isQuizCompleted && option === question.correct
                              const isWrong = isQuizCompleted && isSelected && option !== question.correct
                              return (
                                <div
                                  key={option}
                                    className={cn(
                                      "flex items-center space-x-3 p-4 transition-all relative",
                                      isCorrect
                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                        : isWrong
                                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                        : isSelected
                                        ? "border-[#3bafa8] bg-[#3bafa8]/10 dark:bg-[#3bafa8]/20"
                                        : "border-[#e5e7e7] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]",
                                      neoBrutalismMode
                                        ? isCorrect
                                          ? "border-2 border-green-500 dark:border-green-400 rounded-none"
                                          : isWrong
                                          ? "border-2 border-red-500 dark:border-red-400 rounded-none"
                                          : isSelected
                                          ? "border-2 border-[#3bafa8] dark:border-[#3bafa8] rounded-none"
                                          : "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                        : "border rounded-lg"
                                    )}
                                >
                                  <RadioGroupItem value={option} id={`q${currentQuestionIndex}-${option}`} />
                                  <Label
                                    htmlFor={`q${currentQuestionIndex}-${option}`}
                                    className={cn(
                                      "cursor-pointer flex-1 text-[#1f1d39] dark:text-white",
                                      isQuizDisabled && "cursor-default"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-lg">{option}.</span>
                                      {answer.vi && (
                                        <span className="text-base">{answer.vi}</span>
                                      )}
                                      {answer.en && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                                          ({answer.en})
                                        </span>
                                      )}
                                      <div className="ml-auto flex gap-2">
                                        {isQuizCompleted && isCorrect && (
                                          <Badge className="bg-green-500 text-white text-xs">
                                            {t('quizTake.correctAnswer') || 'Correct Answer'}
                                          </Badge>
                                        )}
                                        {isQuizCompleted && isSelected && !isCorrect && (
                                          <Badge className="bg-red-500 text-white text-xs">
                                            {t('quizTake.yourAnswer') || 'Your Answer'}
                                          </Badge>
                                        )}
                                        {isQuizCompleted && isSelected && isCorrect && (
                                          <Badge className="bg-[#3bafa8] text-white text-xs">
                                            {t('quizTake.yourAnswer') || 'Your Answer'}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              )
                            })}
                          </div>
                        </RadioGroup>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                // Full List View
                <div className={cn(
                  "max-h-[calc(100vh-300px)] overflow-y-auto rounded-md p-4",
                  neoBrutalismMode
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                    : "border border-[#e5e7e7] dark:border-[#333]"
                )}>
                  <div className="space-y-6">
                    {questions.map((question, qIndex) => {
                      const questionKey = qIndex.toString()
                      const selectedAnswer = answers[questionKey] || ''
                      
                      return (
                        <div
                          key={qIndex}
                          id={`question-${qIndex}`}
                          className={cn(
                            "p-4 rounded-md scroll-mt-4",
                            "bg-gray-50 dark:bg-[#1a1a1a]",
                            neoBrutalismMode
                              ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                              : "border border-[#e5e7e7] dark:border-[#333]"
                          )}
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <Badge className="bg-[#3bafa8] text-white flex-shrink-0 text-base px-3 py-1">
                              Q{qIndex + 1}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              {question.question.vi && (
                                <p className="text-base font-medium text-[#211c37] dark:text-white mb-2 break-words leading-relaxed">
                                  {question.question.vi}
                                </p>
                              )}
                              {question.question.en && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic break-words leading-relaxed">
                                  {question.question.en}
                                </p>
                              )}
                            </div>
                          </div>

                          <RadioGroup
                            value={selectedAnswer}
                            onValueChange={(value) => {
                              if (!isQuizDisabled) {
                                setAnswers({ ...answers, [questionKey]: value })
                              }
                            }}
                            disabled={isQuizDisabled}
                          >
                            <div className="space-y-2">
                              {Object.keys(question.answers).sort().map((option) => {
                                const answer = question.answers[option]
                                const isSelected = selectedAnswer === option
                                const isCorrect = isQuizCompleted && option === question.correct
                                const isWrong = isQuizCompleted && isSelected && option !== question.correct
                                return (
                                  <div
                                    key={option}
                                    className={cn(
                                      "flex items-center space-x-2 p-3 transition-all relative",
                                      isCorrect
                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                        : isWrong
                                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                        : isSelected
                                        ? "border-[#3bafa8] bg-[#3bafa8]/10 dark:bg-[#3bafa8]/20"
                                        : "border-[#e5e7e7] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]",
                                      neoBrutalismMode
                                        ? isCorrect
                                          ? "border-2 border-green-500 dark:border-green-400 rounded-none"
                                          : isWrong
                                          ? "border-2 border-red-500 dark:border-red-400 rounded-none"
                                          : isSelected
                                          ? "border-2 border-[#3bafa8] dark:border-[#3bafa8] rounded-none"
                                          : "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                        : "border rounded-lg"
                                    )}
                                  >
                                    <RadioGroupItem value={option} id={`q${qIndex}-${option}`} />
                                    <Label
                                      htmlFor={`q${qIndex}-${option}`}
                                      className={cn(
                                        "cursor-pointer flex-1 text-[#1f1d39] dark:text-white",
                                        isQuizDisabled && "cursor-default"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">{option}.</span>
                                        {answer.vi && (
                                          <span>{answer.vi}</span>
                                        )}
                                        {answer.en && (
                                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                                            ({answer.en})
                                          </span>
                                        )}
                                        <div className="ml-auto flex gap-2">
                                          {isQuizCompleted && isCorrect && (
                                            <Badge className="bg-green-500 text-white text-xs">
                                              {t('quizTake.correctAnswer') || 'Correct Answer'}
                                            </Badge>
                                          )}
                                          {isQuizCompleted && isSelected && !isCorrect && (
                                            <Badge className="bg-red-500 text-white text-xs">
                                              {t('quizTake.yourAnswer') || 'Your Answer'}
                                            </Badge>
                                          )}
                                          {isQuizCompleted && isSelected && isCorrect && (
                                            <Badge className="bg-[#3bafa8] text-white text-xs">
                                              {t('quizTake.yourAnswer') || 'Your Answer'}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                      </Label>
                    </div>
                                )
                              })}
                </div>
              </RadioGroup>
            </div>
                      )
                    })}
                  </div>
                </div>
              )}

                  {/* Submit Button (only show if not completed) */}
                  {!isQuizCompleted && (
                    <div className={cn(
                      "flex items-center justify-end pt-6 mt-6 border-t",
                      "border-[#e5e7e7] dark:border-[#333]"
                    )}>
              <Button
                onClick={handleSubmit}
                        disabled={isTimeUp || submitting || !allQuestionsAnswered}
                        className={cn(
                          "px-8",
                          neoBrutalismMode
                            ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "hover:bg-gray-800 dark:hover:bg-gray-200")
                            : "bg-black hover:bg-gray-800 text-white"
                        )}
              >
                {submitting ? t('quizTake.submitting') : t('quizTake.submitQuiz')}
              </Button>
            </div>
                  )}
          </CardContent>
        </Card>
            </div>

            {/* Right Column: Quiz Info, Timer, and Navigation */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quiz Info & Timer Card (only show if not in review mode) */}
              {!isQuizCompleted && (
                <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                  <CardHeader>
                    <CardTitle className={cn(
                      "text-xl text-[#1f1d39] dark:text-white mb-2",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                    )}>
                      {quiz.content || t('quizTake.quizInfo') || 'Quiz Info'}
                    </CardTitle>
                    <CardDescription className={cn(
                      "text-[#85878d] dark:text-gray-400",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('quizTake.passScore') || 'Pass Score'}: {quiz.pass_score || 'N/A'} • {t('quizTake.timeLimit') || 'Time Limit'}: {quiz.Time_limits ? `${parseInt(quiz.Time_limits.split(':')[0]) * 60 + parseInt(quiz.Time_limits.split(':')[1])} min` : 'N/A'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "flex flex-col items-center justify-center gap-3 px-6 py-6 rounded-lg",
                      isTimeUp 
                        ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" 
                        : "bg-gradient-to-br from-[#e0f7f5] to-[#b2e8e4] dark:from-[#3bafa8]/30 dark:to-[#2a8f88]/20 text-[#1a5f5a] dark:text-[#3bafa8]",
                      neoBrutalismMode
                        ? (isTimeUp
                            ? "border-4 border-red-600 dark:border-red-400 rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:shadow-[4px_4px_0px_0px_rgba(248,113,113,1)]"
                            : "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]")
                        : "border-2 border-[#3bafa8]/30 dark:border-[#3bafa8]/50"
                    )}>
                      <div className="flex items-center gap-3">
                        <Clock className={cn(
                          "h-8 w-8",
                          isTimeUp ? "text-red-600 dark:text-red-400" : "text-[#3bafa8] dark:text-[#3bafa8]"
                        )} />
                        <div className="text-center">
                          <p className={cn(
                            "text-xs mb-1",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                          )}>
                            {isTimeUp ? t('quizTake.timeUp') || 'Time\'s Up!' : t('quizTake.timeRemaining') || 'Time Remaining'}
                          </p>
                          <span className={cn(
                            "font-mono font-bold text-3xl tracking-wider",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {formatTime(timeLeft)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quiz Info Card (only show quiz info in review mode) */}
              {isQuizCompleted && (
                <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                  <CardHeader>
                    <CardTitle className={cn(
                      "text-xl text-[#1f1d39] dark:text-white mb-2",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                    )}>
                      {quiz.content || t('quizTake.quizInfo') || 'Quiz Info'}
                    </CardTitle>
                    <CardDescription className={cn(
                      "text-[#85878d] dark:text-gray-400",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('quizTake.passScore') || 'Pass Score'}: {quiz.pass_score || 'N/A'} • {t('quizTake.timeLimit') || 'Time Limit'}: {quiz.Time_limits ? `${parseInt(quiz.Time_limits.split(':')[0]) * 60 + parseInt(quiz.Time_limits.split(':')[1])} min` : 'N/A'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {/* View Mode Toggle and Navigation */}
              {questions.length > 0 && (
                <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* View Mode Toggle */}
                      <div>
                        <Label className="text-sm font-medium text-[#211c37] dark:text-white mb-2 block">
                          {t('quizTake.viewMode') || 'View Mode'}:
                        </Label>
                        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                          <TabsList className="w-full">
                            <TabsTrigger value="single" className="flex items-center gap-2 flex-1">
                              <FileText className="h-4 w-4" />
                              {t('quizTake.singleQuestion') || 'Single'}
                            </TabsTrigger>
                            <TabsTrigger value="full" className="flex items-center gap-2 flex-1">
                              <List className="h-4 w-4" />
                              {t('quizTake.fullList') || 'Full'}
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>
                            {t('quizTake.answered') || 'Answered'}: {Object.keys(answers).length} / {questions.length}
                          </span>
                          {viewMode === 'single' && (
                            <span className="font-semibold">
                              {currentQuestionIndex + 1} / {questions.length}
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
                          <div
                            className="bg-[#3bafa8] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Question Navigation (Both Single and Full List Mode) */}
                      {questions.length > 1 && (
                        <div className="space-y-4">
                          {/* Previous/Next Buttons (Only for Single Mode) */}
                          {viewMode === 'single' && (
                            <div className="flex items-center justify-between gap-2">
                              <Button
                                variant="outline"
                                onClick={goToPreviousQuestion}
                                disabled={currentQuestionIndex === 0 || isTimeUp || submitting}
                                className={cn(
                                  "flex items-center gap-2 flex-1",
                                  neoBrutalismMode
                                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                                    : ""
                                )}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                {t('quizTake.previous') || 'Previous'}
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={goToNextQuestion}
                                disabled={currentQuestionIndex === questions.length - 1 || isTimeUp || submitting}
                                className={cn(
                                  "flex items-center gap-2 flex-1",
                                  neoBrutalismMode
                                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                                    : ""
                                )}
                              >
                                {t('quizTake.next') || 'Next'}
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          {/* Question Numbers Navigation */}
                          <div>
                            <Label className={cn(
                              "text-sm font-medium text-[#211c37] dark:text-white mb-2 block",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                            )}>
                              {t('quizTake.questions') || 'Questions'}:
                            </Label>
                            <div className={cn(
                              "grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 rounded-md",
                              neoBrutalismMode
                                ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                : "border border-[#e5e7e7] dark:border-[#333]"
                            )}>
                              {questions.map((_, index) => {
                                const status = getQuestionStatus(index)
                                const isCurrent = viewMode === 'single' && index === currentQuestionIndex
                                const isAnswered = status === 'answered'
                                const isCorrect = isQuizCompleted ? isAnswerCorrect(index) : null
                                const isWrong = isQuizCompleted && isAnswered && isCorrect === false
                                return (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      goToQuestion(index)
                                      // In full list mode, scroll to the question
                                      if (viewMode === 'full') {
                                        const questionElement = document.getElementById(`question-${index}`)
                                        if (questionElement) {
                                          questionElement.scrollIntoView({ 
                                            behavior: 'smooth', 
                                            block: 'center',
                                            inline: 'nearest'
                                          })
                                        }
                                      }
                                    }}
                                    disabled={isTimeUp || submitting}
                                    className={cn(
                                      "w-10 h-10 text-sm font-medium transition-all",
                                      isCurrent
                                        ? (neoBrutalismMode
                                            ? "bg-[#3bafa8] text-white border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                                            : "bg-[#3bafa8] text-white ring-2 ring-[#3bafa8] ring-offset-1 rounded-md")
                                        : isWrong
                                        ? (neoBrutalismMode
                                            ? "bg-red-500 dark:bg-red-600 text-white border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,251,235,1)]"
                                            : "bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 rounded-md")
                                        : isAnswered && isCorrect === true
                                        ? (neoBrutalismMode
                                            ? "bg-green-500 dark:bg-green-600 text-white border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,251,235,1)]"
                                            : "bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700 rounded-md")
                                        : isAnswered
                                        ? (neoBrutalismMode
                                            ? "bg-green-500 dark:bg-green-600 text-white border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,251,235,1)]"
                                            : "bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700 rounded-md")
                                        : (neoBrutalismMode
                                            ? "bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,251,235,1)]"
                                            : "bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333] rounded-md"),
                                      isTimeUp || submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                    )}
                                  >
                                    {index + 1}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

