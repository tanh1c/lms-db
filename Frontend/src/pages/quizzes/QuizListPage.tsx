import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { quizService } from '@/lib/api/quizService'
import { courseService } from '@/lib/api/courseService'
import { useAuth } from '@/context/AuthProvider'
import type { Quiz, Course } from '@/types'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import { HelpCircle, Clock, Calendar, CheckCircle2, XCircle, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import '@/lib/animations/gsap-setup'

interface QuizWithCourse extends Quiz {
  course?: Course
}

export default function QuizListPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState<QuizWithCourse[]>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const neoBrutalismMode = useNeoBrutalismMode()

  useGSAP(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current.children, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
      })
    }
  }, { scope: containerRef })

  useEffect(() => {
    const loadQuizzes = async () => {
      if (!user) return
      
      try {
        const data = await quizService.getQuizzes(user.University_ID)
        
        // Data already includes Course_Name from backend
        const quizzesWithCourses: QuizWithCourse[] = data.map(quiz => ({
          ...quiz,
          course: quiz.Course_Name ? {
            Course_ID: quiz.Course_ID,
            Name: quiz.Course_Name
          } as Course : undefined,
        }))
        
        // Sort by status (Not Taken first), then by end date
        quizzesWithCourses.sort((a, b) => {
          const statusOrder = { 'Not Taken': 0, 'In Progress': 1, 'Submitted': 2, 'Failed': 3, 'Passed': 4 }
          const statusA = statusOrder[a.status_display as keyof typeof statusOrder] ?? 5
          const statusB = statusOrder[b.status_display as keyof typeof statusOrder] ?? 5
          
          if (statusA !== statusB) {
            return statusA - statusB
          }
          
          const endDateA = a.End_Date ? new Date(a.End_Date).getTime() : 0
          const endDateB = b.End_Date ? new Date(b.End_Date).getTime() : 0
          return endDateA - endDateB
        })
        
        setQuizzes(quizzesWithCourses)
      } catch (error) {
        console.error('Error loading quizzes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadQuizzes()
  }, [user])

  const getStatusBadge = (quiz: Quiz) => {
    if (!quiz.Start_Date || !quiz.End_Date) {
      return { text: t('quizzes.notStarted'), variant: 'secondary' as const, icon: Clock }
    }
    const now = new Date()
    const startDate = new Date(quiz.Start_Date)
    const endDate = new Date(quiz.End_Date)

    if (now < startDate) {
      return { text: t('quizzes.notStarted'), variant: 'secondary' as const, icon: Clock }
    }
    if (now > endDate) {
      return { text: t('quizzes.ended'), variant: 'secondary' as const, icon: XCircle }
    }

    switch (quiz.completion_status) {
      case 'Passed':
        return { text: t('quizzes.passed'), variant: 'default' as const, icon: CheckCircle2 }
      case 'Failed':
        return { text: t('quizzes.failed'), variant: 'destructive' as const, icon: XCircle }
      case 'Submitted':
      case 'In Progress':
        return { text: t('quizzes.submitted'), variant: 'default' as const, icon: CheckCircle2 }
      default:
        return { text: t('quizzes.notTaken'), variant: 'secondary' as const, icon: Clock }
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('common.loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={t('quizzes.title')} 
      subtitle={t('quizzes.subtitle')}
    >
      <div ref={containerRef} className="space-y-4">
        {quizzes.map((quiz) => {
          const status = getStatusBadge(quiz)
          const StatusIcon = status.icon
          const canTake = quiz.completion_status === 'Not Taken' || quiz.completion_status === 'In Progress'
          const now = new Date()
          const startDate = quiz.Start_Date ? new Date(quiz.Start_Date) : null
          const endDate = quiz.End_Date ? new Date(quiz.End_Date) : null
          const isAvailable = startDate && endDate && now >= startDate && now <= endDate
          const diff = endDate ? endDate.getTime() - now.getTime() : 0
          const daysLeft = endDate ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0
          const hoursLeft = endDate ? Math.ceil(diff / (1000 * 60 * 60)) : 0

          return (
            <Card 
              key={quiz.Assessment_ID} 
              className={cn(
                getNeoBrutalismCardClasses(neoBrutalismMode),
                !neoBrutalismMode && "hover:shadow-lg transition-shadow"
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "w-12 h-12 bg-[#e1e2f6] dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0",
                      neoBrutalismMode 
                        ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                        : "rounded-lg"
                    )}>
                      <HelpCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className={cn(
                          "text-lg text-[#1f1d39] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>{t('quizzes.quiz')} {quiz.Assessment_ID}</CardTitle>
                        {quiz.course && (
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            neoBrutalismMode 
                              ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                              : "border-[#e5e7e7] dark:border-[#333]"
                          )}>
                            <BookOpen className="h-3 w-3 mr-1" />
                            {quiz.course.Name || `Course ${quiz.Course_ID}`}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className={cn(
                        "text-sm text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{quiz.content}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={status.variant} className={cn(
                    "flex items-center gap-1",
                    neoBrutalismMode && "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  )}>
                    <StatusIcon className="h-3 w-3" />
                    <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{status.text}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={cn(
                  "p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800",
                  neoBrutalismMode 
                    ? "border-4 border-orange-600 dark:border-orange-400 rounded-none shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] dark:shadow-[4px_4px_0px_0px_rgba(251,146,60,1)]"
                    : "rounded-lg"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <span className={cn(
                      "font-semibold text-orange-700 dark:text-orange-300",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{t('quizzes.deadline')}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "text-orange-800 dark:text-orange-200 font-medium",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {endDate ? format(endDate, 'EEEE, MMMM dd, yyyy HH:mm') : 'N/A'}
                      </span>
                      {endDate && startDate && now < endDate && now >= startDate && (
                        <Badge variant="outline" className={cn(
                          "border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300",
                          neoBrutalismMode && "border-4 rounded-none shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] dark:shadow-[4px_4px_0px_0px_rgba(251,146,60,1)]"
                        )}>
                          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>
                            {daysLeft === 0 
                              ? hoursLeft > 0 
                                ? `${hoursLeft} ${hoursLeft > 1 ? t('assignments.hoursLeft') : t('assignments.hourLeft')}`
                                : t('assignments.dueToday')
                              : `${daysLeft} ${daysLeft > 1 ? t('assignments.daysLeft') : t('assignments.dayLeft')}`}
                          </span>
                        </Badge>
                      )}
                      {endDate && now > endDate && (
                        <Badge variant="destructive" className={cn(
                          neoBrutalismMode && "border-4 border-red-600 dark:border-red-400 rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:shadow-[4px_4px_0px_0px_rgba(248,113,113,1)]"
                        )}>
                          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('quizzes.closed')}</span>
                        </Badge>
                      )}
                      {startDate && now < startDate && (
                        <Badge variant="secondary" className={cn(
                          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                          neoBrutalismMode && "border-4 border-blue-600 dark:border-blue-400 rounded-none shadow-[4px_4px_0px_0px_rgba(37,99,235,1)] dark:shadow-[4px_4px_0px_0px_rgba(96,165,250,1)]"
                        )}>
                          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>
                            {t('quizzes.starts')} {format(startDate, 'MMM dd, yyyy')}
                          </span>
                        </Badge>
                      )}
                    </div>
                    {startDate && endDate && (
                      <div className="text-orange-700 dark:text-orange-300 text-xs">
                        {t('quizzes.available')}: {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#85878d] dark:text-gray-400" />
                    <span className="text-[#676767] dark:text-gray-300">{t('quizzes.timeLimit')}: {quiz.Time_limits}</span>
                  </div>
                  <div className="text-sm text-[#85878d] dark:text-gray-400">
                    {t('courses.passScore')}: {quiz.pass_score}
                  </div>
                  {quiz.Weight && (
                    <div className="text-sm text-[#85878d] dark:text-gray-400">
                      {t('courses.weight')}: {(quiz.Weight * 100).toFixed(0)}%
                    </div>
                  )}
                  {quiz.score !== null && quiz.score !== undefined && quiz.score > 0 && (
                    <div className="text-sm font-semibold text-[#1f1d39] dark:text-white">
                      {t('quizzes.yourScore')}: {quiz.score.toFixed(2)}/{quiz.pass_score || 0}
                    </div>
                  )}
                </div>
                {quiz.score !== null && quiz.score !== undefined && (
                  <div className={cn(
                    "p-3 rounded-lg mb-4",
                    quiz.score >= (quiz.pass_score || 0)
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
                    neoBrutalismMode 
                      ? quiz.score >= (quiz.pass_score || 0)
                        ? "border-4 border-green-600 dark:border-green-400 rounded-none shadow-[4px_4px_0px_0px_rgba(34,197,94,1)] dark:shadow-[4px_4px_0px_0px_rgba(74,222,128,1)]"
                        : "border-4 border-red-600 dark:border-red-400 rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:shadow-[4px_4px_0px_0px_rgba(248,113,113,1)]"
                      : "rounded-lg"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-semibold",
                        quiz.score >= (quiz.pass_score || 0)
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {t('quizzes.yourScore')}: {quiz.score.toFixed(2)} / {quiz.pass_score || 10}
                      </span>
                      {quiz.completion_status && (
                        <Badge className={cn(
                          quiz.completion_status === 'Passed'
                            ? "bg-green-500 text-white"
                            : quiz.completion_status === 'Failed'
                            ? "bg-red-500 text-white"
                            : "bg-blue-500 text-white"
                        )}>
                          {quiz.completion_status}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  {canTake && isAvailable ? (
                    <Button
                      onClick={() => {
                        const url = ROUTES.QUIZ_TAKE.replace(':quizId', quiz.Assessment_ID.toString())
                        const params = new URLSearchParams()
                        if (quiz.Course_ID) params.set('courseId', quiz.Course_ID.toString())
                        if (quiz.Section_ID) params.set('sectionId', quiz.Section_ID.toString())
                        navigate(`${url}?${params.toString()}`)
                      }}
                      className={cn(
                        neoBrutalismMode 
                          ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "hover:bg-gray-800 dark:hover:bg-gray-200")
                          : "bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black"
                      )}
                    >
                      <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('quizzes.takeQuiz')}</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = ROUTES.QUIZ_TAKE.replace(':quizId', quiz.Assessment_ID.toString())
                        const params = new URLSearchParams()
                        if (quiz.Course_ID) params.set('courseId', quiz.Course_ID.toString())
                        if (quiz.Section_ID) params.set('sectionId', quiz.Section_ID.toString())
                        navigate(`${url}?${params.toString()}`)
                      }}
                      className={cn(
                        neoBrutalismMode 
                          ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline', "hover:bg-gray-50 dark:hover:bg-[#2a2a2a]")
                          : "border-[#e5e7e7] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                      )}
                    >
                      <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('quizzes.reviewQuiz') || 'Review Quiz'}</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {quizzes.length === 0 && (
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardContent className="py-10 text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-3 text-[#85878d] dark:text-gray-400 opacity-50" />
              <p className={cn(
                "text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>{t('quizzes.noQuizzesAvailable')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

