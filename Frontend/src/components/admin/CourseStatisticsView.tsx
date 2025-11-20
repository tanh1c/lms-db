import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type CourseStatistics } from '@/lib/api/adminService'
import { BarChart3, Users, CheckCircle, Clock, TrendingUp, FileText, HelpCircle, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import { useTranslation } from 'react-i18next'

interface CourseStatisticsViewProps {
  courseId: string
  statistics: CourseStatistics
}

export default function CourseStatisticsView({ statistics }: CourseStatisticsViewProps) {
  const { t } = useTranslation()
  const neoBrutalismMode = useNeoBrutalismMode()

  const enrollmentRate = statistics.TotalEnrolledStudents > 0
    ? ((statistics.ApprovedStudents / statistics.TotalEnrolledStudents) * 100).toFixed(1)
    : '0'

  const completionRate = statistics.TotalAssignments > 0
    ? ((statistics.TotalSubmissions / statistics.TotalAssignments) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* Enrollment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                  : "rounded-lg"
              )}>
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-sm text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('admin.totalEnrolled')}
                </p>
                <p className={cn(
                  "text-2xl font-bold text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {statistics.TotalEnrolledStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 bg-green-100 dark:bg-green-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                  : "rounded-lg"
              )}>
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-sm text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('admin.approved')}
                </p>
                <p className={cn(
                  "text-2xl font-bold text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {statistics.ApprovedStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                  : "rounded-lg"
              )}>
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-sm text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('admin.pending')}
                </p>
                <p className={cn(
                  "text-2xl font-bold text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {statistics.PendingStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Statistics */}
      <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
        <CardHeader>
          <CardTitle className={cn(
            "text-xl text-[#1f1d39] dark:text-white",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
          )}>
            {t('admin.gradeStatistics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className={cn(
                "text-sm text-[#85878d] dark:text-gray-400 mb-2",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.averageGrade')}
              </p>
              <p className={cn(
                "text-3xl font-bold text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {statistics.AverageFinalGrade !== null ? statistics.AverageFinalGrade.toFixed(2) : 'N/A'}
              </p>
            </div>
            <div>
              <p className={cn(
                "text-sm text-[#85878d] dark:text-gray-400 mb-2",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.minGrade')}
              </p>
              <p className={cn(
                "text-3xl font-bold text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {statistics.MinFinalGrade !== null ? statistics.MinFinalGrade.toFixed(2) : 'N/A'}
              </p>
            </div>
            <div>
              <p className={cn(
                "text-sm text-[#85878d] dark:text-gray-400 mb-2",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.maxGrade')}
              </p>
              <p className={cn(
                "text-3xl font-bold text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {statistics.MaxFinalGrade !== null ? statistics.MaxFinalGrade.toFixed(2) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <CardTitle className={cn(
              "text-lg text-[#1f1d39] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
            )}>
              {t('admin.activitySummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className={cn(
                    "text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.assignments')}
                  </span>
                </div>
                <span className={cn(
                  "font-semibold text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {statistics.TotalAssignments}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className={cn(
                    "text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.quizzes')}
                  </span>
                </div>
                <span className={cn(
                  "font-semibold text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {statistics.TotalQuizzes}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Send className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className={cn(
                    "text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.submissions')}
                  </span>
                </div>
                <span className={cn(
                  "font-semibold text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {statistics.TotalSubmissions}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <CardTitle className={cn(
              "text-lg text-[#1f1d39] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
            )}>
              {t('admin.rates')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.approvalRate')}
                  </span>
                  <span className={cn(
                    "text-sm font-semibold text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>
                    {enrollmentRate}%
                  </span>
                </div>
                <div className={cn(
                  "h-2 bg-gray-200 dark:bg-gray-700 overflow-hidden",
                  neoBrutalismMode 
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                    : "rounded-full"
                )}>
                  <div 
                    className="h-full bg-blue-600 dark:bg-blue-400 transition-all"
                    style={{ width: `${enrollmentRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.completionRate')}
                  </span>
                  <span className={cn(
                    "text-sm font-semibold text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>
                    {completionRate}%
                  </span>
                </div>
                <div className={cn(
                  "h-2 bg-gray-200 dark:bg-gray-700 overflow-hidden",
                  neoBrutalismMode 
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                    : "rounded-full"
                )}>
                  <div 
                    className="h-full bg-green-600 dark:bg-green-400 transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section and Tutor Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                  : "rounded-lg"
              )}>
                <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-sm text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('admin.totalSections')}
                </p>
                <p className={cn(
                  "text-2xl font-bold text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {statistics.TotalSections}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                  : "rounded-lg"
              )}>
                <TrendingUp className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-sm text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('admin.totalTutors')}
                </p>
                <p className={cn(
                  "text-2xl font-bold text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {statistics.TotalTutors}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

