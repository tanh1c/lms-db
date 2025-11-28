import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { assignmentService } from '@/lib/api/assignmentService'
import { courseService } from '@/lib/api/courseService'
import { useAuth } from '@/context/AuthProvider'
import type { Assignment, Course } from '@/types'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import { FileText, Calendar, Clock, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import '@/lib/animations/gsap-setup'

interface AssignmentWithCourse extends Assignment {
  course?: Course
}

export default function AssignmentListPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState<AssignmentWithCourse[]>([])
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
    const loadAssignments = async () => {
      if (!user) return
      
      try {
        const data = await assignmentService.getAssignments(user.University_ID)
        
        // Data already includes Course_Name and Section_ID from backend
        const assignmentsWithCourses: AssignmentWithCourse[] = data.map(assignment => ({
          ...assignment,
          course: assignment.Course_Name ? {
            Course_ID: assignment.Course_ID,
            Name: assignment.Course_Name
          } as Course : undefined,
        }))
        
        // Sort by deadline (earliest first), then by status (Not Started first)
        assignmentsWithCourses.sort((a, b) => {
          const statusOrder = { 'Not Started': 0, 'In Progress': 1, 'Submitted': 2, 'Overdue': 3 }
          const statusA = statusOrder[a.status_display as keyof typeof statusOrder] ?? 4
          const statusB = statusOrder[b.status_display as keyof typeof statusOrder] ?? 4
          
          if (statusA !== statusB) {
            return statusA - statusB
          }
          
          const deadlineA = a.submission_deadline ? new Date(a.submission_deadline).getTime() : 0
          const deadlineB = b.submission_deadline ? new Date(b.submission_deadline).getTime() : 0
          return deadlineA - deadlineB
        })
        
        setAssignments(assignmentsWithCourses)
      } catch (error) {
        console.error('Error loading assignments:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAssignments()
  }, [user])

  const getStatus = (deadline: string | null | undefined) => {
    if (!deadline) return { text: t('assignments.onTime'), variant: 'secondary' as const, color: 'bg-green-500' }
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diff = deadlineDate.getTime() - now.getTime()
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) return { text: t('assignments.overdue'), variant: 'destructive' as const, color: 'bg-red-500' }
    if (daysLeft <= 1) return { text: t('assignments.dueSoon'), variant: 'destructive' as const, color: 'bg-orange-500' }
    if (daysLeft <= 3) return { text: t('assignments.dueSoon'), variant: 'default' as const, color: 'bg-yellow-500' }
    return { text: t('assignments.onTime'), variant: 'secondary' as const, color: 'bg-green-500' }
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
      title={t('assignments.title')} 
      subtitle={t('assignments.subtitle')}
    >
      <div ref={containerRef} className="space-y-4">
        {assignments.map((assignment) => {
          if (!assignment.submission_deadline) return null
          const status = getStatus(assignment.submission_deadline)
          const deadlineDate = new Date(assignment.submission_deadline)
          const now = new Date()
          const diff = deadlineDate.getTime() - now.getTime()
          const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
          const hoursLeft = Math.ceil(diff / (1000 * 60 * 60))
          
          return (
            <Card 
              key={assignment.Assessment_ID} 
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
                      <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className={cn(
                          "text-lg text-[#1f1d39] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                          {t('assignments.assignment')} {assignment.Assessment_ID}
                        </CardTitle>
                        {assignment.course && (
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            neoBrutalismMode 
                              ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                              : "border-[#e5e7e7] dark:border-[#333]"
                          )}>
                            <BookOpen className="h-3 w-3 mr-1" />
                            {assignment.course.Name || `Course ${assignment.Course_ID}`}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className={cn(
                        "text-sm text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        {assignment.instructions || t('assignments.noInstructions')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={cn(
                    `${status.color} text-white`,
                    neoBrutalismMode && "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  )}>
                    <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{status.text}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={cn(
                  "p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
                  neoBrutalismMode 
                    ? "border-4 border-red-600 dark:border-red-400 rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:shadow-[4px_4px_0px_0px_rgba(248,113,113,1)]"
                    : "rounded-lg"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className={cn(
                      "font-semibold text-red-700 dark:text-red-300",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{t('assignments.deadline')}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={cn(
                      "text-red-800 dark:text-red-200 font-medium",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {format(deadlineDate, 'EEEE, MMMM dd, yyyy HH:mm')}
                    </span>
                    {daysLeft >= 0 && (
                      <Badge variant="outline" className={cn(
                        "border-red-300 dark:border-red-700 text-red-700 dark:text-red-300",
                        neoBrutalismMode && "border-4 rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:shadow-[4px_4px_0px_0px_rgba(248,113,113,1)]"
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
                    {daysLeft < 0 && (
                      <Badge variant="destructive" className={cn(
                        neoBrutalismMode && "border-4 border-red-600 dark:border-red-400 rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:shadow-[4px_4px_0px_0px_rgba(248,113,113,1)]"
                      )}>
                        <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>
                          {Math.abs(daysLeft)} {Math.abs(daysLeft) > 1 ? t('assignments.daysOverdue') : t('assignments.dayOverdue')}
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#85878d] dark:text-gray-400" />
                    <span className="text-[#676767] dark:text-gray-300">{t('assignments.maxScore')}: {assignment.MaxScore}</span>
                  </div>
                  {assignment.accepted_specification && (
                    <div className="text-sm text-[#85878d] dark:text-gray-400">
                      {t('assignments.format')}: {assignment.accepted_specification}
                    </div>
                  )}
                </div>
                {assignment.score !== null && assignment.score !== undefined && (
                  <div className={cn(
                    "p-3 rounded-lg",
                    "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
                    neoBrutalismMode 
                      ? "border-4 border-green-600 dark:border-green-400 rounded-none shadow-[4px_4px_0px_0px_rgba(34,197,94,1)] dark:shadow-[4px_4px_0px_0px_rgba(74,222,128,1)]"
                      : "rounded-lg"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-semibold text-green-700 dark:text-green-300",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {t('assignments.score')}: {assignment.score.toFixed(2)} / {assignment.MaxScore || 10}
                      </span>
                      {assignment.SubmitDate && (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          ({t('assignments.submittedOn')} {new Date(assignment.SubmitDate).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {assignment.Assessment_ID && (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = ROUTES.ASSIGNMENT_SUBMIT.replace(':assignmentId', assignment.Assessment_ID!.toString())
                        const params = new URLSearchParams()
                        if (assignment.Course_ID) params.set('courseId', assignment.Course_ID.toString())
                        if (assignment.Section_ID) params.set('sectionId', assignment.Section_ID.toString())
                        navigate(`${url}?${params.toString()}`)
                      }}
                      className={cn(
                        neoBrutalismMode 
                          ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline', "hover:bg-gray-50 dark:hover:bg-[#2a2a2a]")
                          : "border-[#e5e7e7] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                      )}
                    >
                      <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>
                        {assignment.status_display === 'Submitted' ? t('assignments.viewSubmission') || 'View Submission' : t('assignments.submit')}
                      </span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {assignments.length === 0 && (
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardContent className="py-10 text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 text-[#85878d] dark:text-gray-400 opacity-50" />
              <p className={cn(
                "text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>{t('assignments.noAssignmentsAvailable')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

