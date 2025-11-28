import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { assignmentService } from '@/lib/api/assignmentService'
import type { AdminAssignment } from '@/lib/api/adminService'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'
import { ArrowLeft, Upload, CheckCircle2, FileText, Clock, Award, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismTextClasses,
  getNeoBrutalismButtonClasses
} from '@/lib/utils/theme-utils'

export default function AssignmentSubmitPage() {
  const { t } = useTranslation()
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const neoBrutalismMode = useNeoBrutalismMode()
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [assignment, setAssignment] = useState<AdminAssignment | null>(null)
  const [submissionData, setSubmissionData] = useState<{
    score: number | null
    SubmitDate: string | null
    status: string | null
    submission_status_display: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Get courseId and sectionId from URL params for navigation back
  const courseId = searchParams.get('courseId')
  const sectionId = searchParams.get('sectionId')

  useEffect(() => {
    const loadAssignment = async () => {
      if (!assignmentId) return
      
      try {
        setLoading(true)
        // Try to get assignment by AssignmentID first
        try {
            const assignmentData = await assignmentService.getAssignmentById(parseInt(assignmentId), user?.University_ID, sectionId || undefined, courseId || undefined)
            if (assignmentData && assignmentData.AssignmentID) {
              // Convert Assignment to AdminAssignment format
              setAssignment({
                AssignmentID: assignmentData.AssignmentID,
                Course_ID: assignmentData.Course_ID?.toString() || courseId || '',
                Semester: assignmentData.Semester || '',
                MaxScore: assignmentData.MaxScore || null,
                accepted_specification: assignmentData.accepted_specification || null,
                submission_deadline: assignmentData.submission_deadline || null,
                instructions: assignmentData.instructions || null,
                TaskURL: assignmentData.TaskURL || null,
                Course_Name: assignmentData.Course_Name || undefined,
              })
              // Set submission data if available
              if (assignmentData.SubmitDate || assignmentData.score !== null || assignmentData.submission_status_display) {
                setSubmissionData({
                  score: assignmentData.score ?? null,
                  SubmitDate: assignmentData.SubmitDate ?? null,
                  status: assignmentData.status ?? null,
                  submission_status_display: assignmentData.submission_status_display ?? null,
                })
              }
              setLoading(false)
              return
            }
        } catch (e) {
          console.log('Assignment not found by AssignmentID, trying Assessment_ID...')
        }
        
        // If not found by AssignmentID, try to get by Assessment_ID using assignmentService
        // This will use the new GetAssignmentByAssessmentID procedure
        if (user?.University_ID) {
          try {
            const assignmentData = await assignmentService.getAssignmentById(
              parseInt(assignmentId),
              user.University_ID,
              sectionId || undefined,
              courseId || undefined
            )
            if (assignmentData && assignmentData.AssignmentID) {
              // Convert Assignment to AdminAssignment format
              setAssignment({
                AssignmentID: assignmentData.AssignmentID,
                Course_ID: assignmentData.Course_ID?.toString() || courseId || '',
                Semester: assignmentData.Semester || '',
                MaxScore: assignmentData.MaxScore || null,
                accepted_specification: assignmentData.accepted_specification || null,
                submission_deadline: assignmentData.submission_deadline || null,
                instructions: assignmentData.instructions || null,
                TaskURL: assignmentData.TaskURL || null,
                Course_Name: assignmentData.Course_Name || undefined,
              })
              // Set submission data if available
              if (assignmentData.SubmitDate || assignmentData.score !== null || assignmentData.submission_status_display) {
                setSubmissionData({
                  score: assignmentData.score ?? null,
                  SubmitDate: assignmentData.SubmitDate ?? null,
                  status: assignmentData.status ?? null,
                  submission_status_display: assignmentData.submission_status_display ?? null,
                })
              }
              setLoading(false)
              return
            }
          } catch (e) {
            console.error('Error loading assignment by Assessment_ID:', e)
          }
        }
        
        // If still not found, set to null but still show the form
        setAssignment(null)
      } catch (error) {
        console.error('Error loading assignment:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAssignment()
  }, [assignmentId, courseId, sectionId, user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }
  
  const handleBack = () => {
    // Navigate back to course section if courseId and sectionId are available
    if (courseId && sectionId) {
      navigate(ROUTES.SECTION_DETAIL
        .replace(':courseId', courseId)
        .replace(':sectionId', sectionId)
      )
    } else {
      // Fallback to assignments list
      navigate(ROUTES.ASSIGNMENTS)
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
          handleBack()
        }, 2000)
      } else {
        alert(result.error || t('assignmentSubmit.failedToSubmit'))
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      alert(t('errors.submissionFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="flex justify-center">
          <Card className={cn(
            "max-w-md w-full",
            getNeoBrutalismCardClasses(neoBrutalismMode)
          )}>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto" />
                <h2 className={cn(
                  "text-2xl font-bold text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>{t('assignmentSubmit.submissionSuccessful')}</h2>
                <p className={cn(
                  "text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>{t('assignmentSubmit.redirecting')}</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className={cn(
            "text-[#85878d] dark:text-gray-400",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>{t('common.loading')}</p>
        </div>
      </DashboardLayout>
    )
  }

  const deadline = assignment?.submission_deadline ? new Date(assignment.submission_deadline) : null
  const isOverdue = deadline && deadline < new Date()

  const timeRemaining = deadline ? Math.max(0, Math.floor((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null

  return (
    <DashboardLayout 
      title={t('assignmentSubmit.title')}
      subtitle={t('assignmentSubmit.subtitle')}
    >
      <div className="flex justify-center">
        <div className="w-full max-w-7xl space-y-6">
        <Button
          variant="ghost"
            onClick={handleBack}
            className={cn(
              "mb-4",
              neoBrutalismMode
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                : "border border-[#e5e7e7] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
            )}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
            {courseId && sectionId ? t('assignmentSubmit.backToCourse') : t('assignmentSubmit.backToAssignments')}
        </Button>

          {/* Two Column Layout: Left (Assignment Info) + Right (Submit Form) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Assignment Information & Submission Status */}
            <div className="lg:col-span-2 space-y-6">

        {/* Assignment Information Card */}
        {assignment && (
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0",
                  neoBrutalismMode
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none bg-[#e1e2f6] dark:bg-[#3bafa8]/20"
                    : "bg-[#e1e2f6] dark:bg-[#3bafa8]/20"
                )}>
                  <FileText className="h-7 w-7 text-purple-600 dark:text-[#3bafa8]" />
                </div>
                <div className="flex-1">
                  <CardTitle className={cn(
                    "text-xl text-[#1f1d39] dark:text-white mb-1",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {assignment.instructions || t('assignments.assignment')}
                  </CardTitle>
                  {assignment.Course_Name && (
                    <CardDescription className={cn(
                      "text-[#85878d] dark:text-gray-400",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {assignment.Course_Name} • {assignment.Semester}
                    </CardDescription>
                  )}
                </div>
                {deadline && (
                  <div className={cn(
                    "flex flex-col items-end gap-1 px-3 py-2 rounded-lg",
                    isOverdue
                      ? "bg-red-50 dark:bg-red-900/20"
                      : timeRemaining !== null && timeRemaining <= 3
                      ? "bg-yellow-50 dark:bg-yellow-900/20"
                      : "bg-green-50 dark:bg-green-900/20",
                    neoBrutalismMode && "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                  )}>
                  {isOverdue ? (
                    <Badge variant="destructive" className="text-xs">
                      {t('assignments.overdue')}
                    </Badge>
                  ) : timeRemaining !== null && timeRemaining <= 3 ? (
                    <Badge className="bg-yellow-500 text-white text-xs">
                      {timeRemaining === 0 ? t('assignments.dueToday') : `${timeRemaining} ${t('assignments.daysLeft')}`}
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500 text-white text-xs">
                      {timeRemaining !== null ? `${timeRemaining} ${t('assignments.daysLeft')}` : ''}
                    </Badge>
                  )}
                </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {assignment.MaxScore && (
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    "bg-gray-50 dark:bg-[#1a1a1a]",
                    neoBrutalismMode
                      ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : "border border-[#e5e7e7] dark:border-[#333]"
                  )}>
                    <Award className="h-5 w-5 text-[#3bafa8] dark:text-[#3bafa8] flex-shrink-0" />
                    <div>
                      <p className={cn(
                        "text-xs text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('assignments.maxScore')}</p>
                      <p className={cn(
                        "text-base font-semibold text-[#1f1d39] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>{assignment.MaxScore} {t('assignments.points') || 'points'}</p>
                    </div>
                  </div>
                )}
                {deadline && (
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    "bg-gray-50 dark:bg-[#1a1a1a]",
                    neoBrutalismMode
                      ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : "border border-[#e5e7e7] dark:border-[#333]"
                  )}>
                    <Clock className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isOverdue ? "text-red-600 dark:text-red-400" : "text-[#3bafa8] dark:text-[#3bafa8]"
                    )} />
                    <div>
                      <p className={cn(
                        "text-xs text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('assignments.deadline')}</p>
                      <p className={cn(
                        "text-sm font-semibold",
                        isOverdue 
                          ? "text-red-600 dark:text-red-400"
                          : "text-[#1f1d39] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {format(deadline, 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
                {assignment.accepted_specification && (
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    "bg-gray-50 dark:bg-[#1a1a1a]",
                    neoBrutalismMode
                      ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : "border border-[#e5e7e7] dark:border-[#333]"
                  )}>
                    <FileText className="h-5 w-5 text-[#3bafa8] dark:text-[#3bafa8] flex-shrink-0" />
                    <div>
                      <p className={cn(
                        "text-xs text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('assignments.format')}</p>
                      <p className={cn(
                        "text-sm font-semibold text-[#1f1d39] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>{assignment.accepted_specification}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {assignment.instructions && (
                <div className={cn(
                  "p-4 rounded-lg",
                  "bg-blue-50 dark:bg-blue-900/10",
                  neoBrutalismMode
                    ? "border-2 border-blue-600 dark:border-blue-400 rounded-none"
                    : "border border-blue-200 dark:border-blue-800"
                )}>
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className={cn(
                      "text-sm font-semibold text-blue-900 dark:text-blue-300",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{t('assignments.instructions') || 'Instructions'}</p>
                  </div>
                  <p className={cn(
                    "text-sm text-[#1f1d39] dark:text-white whitespace-pre-wrap leading-relaxed",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>{assignment.instructions}</p>
                </div>
              )}
              
              {assignment.TaskURL && (
                <div className={cn(
                  "pt-4 border-t",
                  "border-[#e5e7e7] dark:border-[#333]"
                )}>
                  <p className={cn(
                    "text-xs text-[#85878d] dark:text-gray-400 mb-2",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>{t('admin.taskURL')}</p>
                  <a
                    href={assignment.TaskURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 text-sm transition-all",
                      "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
                      neoBrutalismMode
                        ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                        : "border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    <span>{t('admin.viewTask') || t('admin.taskURL')}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submission Status Card (if already submitted) */}
        {submissionData && submissionData.submission_status_display && submissionData.submission_status_display !== 'Not Submitted' && (
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                  neoBrutalismMode
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none bg-green-100 dark:bg-green-900/20"
                    : "bg-green-100 dark:bg-green-900/20"
                )}>
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className={cn(
                    "text-xl text-[#1f1d39] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>{t('assignmentSubmit.submitted') || 'Assignment Submitted'}</CardTitle>
                  <CardDescription className={cn(
                    "text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {submissionData.SubmitDate 
                      ? `${t('assignmentSubmit.submittedOn') || 'Submitted on'}: ${format(new Date(submissionData.SubmitDate), 'MMM dd, yyyy HH:mm')}`
                      : t('assignmentSubmit.submitted') || 'Submitted'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submissionData.score !== null && (
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-lg",
                    "bg-blue-50 dark:bg-blue-900/20",
                    neoBrutalismMode
                      ? "border-2 border-blue-600 dark:border-blue-400 rounded-none"
                      : "border border-blue-200 dark:border-blue-800"
                  )}>
                    <Award className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div>
                      <p className={cn(
                        "text-xs text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('assignments.score') || 'Score'}</p>
                      <p className={cn(
                        "text-2xl font-bold text-blue-600 dark:text-blue-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {submissionData.score.toFixed(2)} / {assignment?.MaxScore || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
                {submissionData.SubmitDate && (
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-lg",
                    "bg-gray-50 dark:bg-[#1a1a1a]",
                    neoBrutalismMode
                      ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : "border border-[#e5e7e7] dark:border-[#333]"
                  )}>
                    <Clock className="h-6 w-6 text-[#3bafa8] dark:text-[#3bafa8] flex-shrink-0" />
                    <div>
                      <p className={cn(
                        "text-xs text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('assignmentSubmit.submittedOn') || 'Submitted On'}</p>
                      <p className={cn(
                        "text-base font-semibold text-[#1f1d39] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {format(new Date(submissionData.SubmitDate), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
            </div>

            {/* Right Column: Submit Form */}
            <div className="lg:col-span-1">
              <Card className={cn(
                getNeoBrutalismCardClasses(neoBrutalismMode),
                "sticky top-6"
              )}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                neoBrutalismMode
                  ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none bg-[#3bafa8]/10 dark:bg-[#3bafa8]/20"
                  : "bg-[#3bafa8]/10 dark:bg-[#3bafa8]/20"
              )}>
                <Upload className="h-6 w-6 text-[#3bafa8] dark:text-[#3bafa8]" />
              </div>
              <div>
                <CardTitle className={cn(
                  "text-xl text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {submissionData && submissionData.submission_status_display && submissionData.submission_status_display !== 'Not Submitted'
                    ? t('assignmentSubmit.resubmit') || 'Resubmit Assignment'
                    : t('assignmentSubmit.title')}
                </CardTitle>
                <CardDescription className={cn(
                  "text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {submissionData && submissionData.submission_status_display && submissionData.submission_status_display !== 'Not Submitted'
                    ? t('assignmentSubmit.resubmitDescription') || 'Upload a new file to replace your previous submission'
                    : t('assignmentSubmit.subtitle')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file" className={cn(
                  "text-[#676767] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>{t('assignmentSubmit.selectFile')}</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                  className={cn(
                    "cursor-pointer",
                    neoBrutalismMode
                      ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : "border-[#e5e7e7] dark:border-[#333]"
                  )}
                  accept={assignment?.accepted_specification || undefined}
                />
                {file && (
                  <div className={cn(
                    "p-3 rounded-lg",
                    "bg-green-50 dark:bg-green-900/20",
                    neoBrutalismMode
                      ? "border-2 border-green-600 dark:border-green-400 rounded-none"
                      : "border border-green-200 dark:border-green-800"
                  )}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <p className={cn(
                        "text-sm text-green-700 dark:text-green-300",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        <span className="font-semibold">{t('assignmentSubmit.selected')}:</span> {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                    </div>
                  </div>
                )}
                {!file && (
                  <div className={cn(
                    "p-3 rounded-lg text-xs",
                    "bg-gray-50 dark:bg-[#1a1a1a]",
                    neoBrutalismMode
                      ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : "border border-[#e5e7e7] dark:border-[#333]"
                  )}>
                    <p className={cn(
                      "text-[#85878d] dark:text-gray-400",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('assignmentSubmit.fileHint') || 'Please select a file to upload. Accepted formats: PDF, DOC, DOCX, ZIP'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={!file || submitting}
                  className={cn(
                    "flex-1",
                    neoBrutalismMode
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "hover:bg-gray-800 dark:hover:bg-gray-200")
                      : "bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  )}
                >
                  {submitting ? (
                    t('assignmentSubmit.submitting')
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {t('assignmentSubmit.submit')}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className={cn(
                    neoBrutalismMode
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline', "hover:bg-gray-50 dark:hover:bg-[#2a2a2a]")
                      : "border-[#e5e7e7] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                  )}
                >
                  {t('assignmentSubmit.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

