import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { adminService, type CourseDetails, type CourseSection, type CourseStudent, type CourseTutor, type CourseStatistics } from '@/lib/api/adminService'
import { ArrowLeft, BookOpen, Users, GraduationCap, BarChart3, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import CourseStatisticsView from '@/components/admin/CourseStatisticsView'

export default function CourseDetailPage() {
  const { t } = useTranslation()
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null)
  const [sections, setSections] = useState<CourseSection[]>([])
  const [students, setStudents] = useState<CourseStudent[]>([])
  const [, setTutors] = useState<CourseTutor[]>([])
  const [statistics, setStatistics] = useState<CourseStatistics | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const neoBrutalismMode = useNeoBrutalismMode()

  useEffect(() => {
    if (courseId) {
      loadCourseData()
    }
  }, [courseId])

  const loadCourseData = async () => {
    if (!courseId) return
    
    try {
      setLoading(true)
      const [details, sectionsData, studentsData, tutorsData, statsData] = await Promise.all([
        adminService.getCourseDetails(courseId),
        adminService.getCourseSections(courseId),
        adminService.getCourseStudents(courseId),
        adminService.getCourseTutors(courseId),
        adminService.getCourseStatistics(courseId),
      ])
      
      setCourseDetails(details)
      setSections(sectionsData)
      setStudents(studentsData)
      setTutors(tutorsData)
      setStatistics(statsData)
    } catch (error) {
      console.error('Error loading course data:', error)
      alert(t('admin.errorLoadingCourseData'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#3bafa8]" />
        </div>
      </DashboardLayout>
    )
  }

  if (!courseDetails) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className={getNeoBrutalismTextClasses(neoBrutalismMode, 'body')}>{t('admin.courseNotFound')}</p>
          <Button
            onClick={() => navigate('/admin/courses')}
            className={cn(
              "mt-4",
              neoBrutalismMode 
                ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary')
                : ""
            )}
          >
            {t('admin.backToCourses')}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/courses')}
              className={cn(
                neoBrutalismMode 
                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                  : ""
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('admin.back')}
            </Button>
            <div>
              <h1 className={cn(
                "text-3xl font-bold text-[#211c37] dark:text-white mb-2",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {courseDetails.Name}
              </h1>
              <p className={cn(
                "text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.courseId')}: {courseDetails.Course_ID}
              </p>
            </div>
          </div>
        </div>

        {/* Course Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center",
                  neoBrutalismMode 
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                    : "rounded-lg"
                )}>
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.sections')}
                  </p>
                  <p className={cn(
                    "text-2xl font-bold text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {courseDetails.TotalSections}
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
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.students')}
                  </p>
                  <p className={cn(
                    "text-2xl font-bold text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {courseDetails.TotalStudents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center",
                  neoBrutalismMode 
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                    : "rounded-lg"
                )}>
                  <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.tutors')}
                  </p>
                  <p className={cn(
                    "text-2xl font-bold text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {courseDetails.TotalTutors}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center",
                  neoBrutalismMode 
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                    : "rounded-lg"
                )}>
                  <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.avgGrade')}
                  </p>
                  <p className={cn(
                    "text-2xl font-bold text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {courseDetails.AverageFinalGrade ? courseDetails.AverageFinalGrade.toFixed(2) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn(
            "grid w-full grid-cols-4",
            neoBrutalismMode 
              ? "bg-white dark:bg-[#2a2a2a] border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
              : "bg-gray-100 dark:bg-[#2a2a2a]"
          )}>
            <TabsTrigger value="overview" className={cn(
              neoBrutalismMode 
                ? "data-[state=active]:bg-[#3bafa8] data-[state=active]:text-white rounded-none"
                : "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]"
            )}>
              {t('admin.overview')}
            </TabsTrigger>
            <TabsTrigger value="sections" className={cn(
              neoBrutalismMode 
                ? "data-[state=active]:bg-[#3bafa8] data-[state=active]:text-white rounded-none"
                : "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]"
            )}>
              {t('admin.sections')} ({sections.length})
            </TabsTrigger>
            <TabsTrigger value="students" className={cn(
              neoBrutalismMode 
                ? "data-[state=active]:bg-[#3bafa8] data-[state=active]:text-white rounded-none"
                : "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]"
            )}>
              {t('admin.students')} ({students.length})
            </TabsTrigger>
            <TabsTrigger value="statistics" className={cn(
              neoBrutalismMode 
                ? "data-[state=active]:bg-[#3bafa8] data-[state=active]:text-white rounded-none"
                : "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]"
            )}>
              {t('admin.statistics')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
              <CardHeader>
                <CardTitle className={cn(
                  "text-xl text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {t('admin.courseInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={cn(
                      "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('admin.courseId')}
                    </p>
                    <p className={cn(
                      "font-semibold text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {courseDetails.Course_ID}
                    </p>
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('admin.courseName')}
                    </p>
                    <p className={cn(
                      "font-semibold text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {courseDetails.Name}
                    </p>
                  </div>
                  {courseDetails.Credit && (
                    <div>
                      <p className={cn(
                        "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        {t('admin.credit')}
                      </p>
                      <p className={cn(
                        "font-semibold text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {courseDetails.Credit}
                      </p>
                    </div>
                  )}
                  {courseDetails.Start_Date && (
                    <div>
                      <p className={cn(
                        "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        {t('admin.startDate')}
                      </p>
                      <p className={cn(
                        "font-semibold text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {new Date(courseDetails.Start_Date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={cn(
                        "text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        {t('admin.assignments')}
                      </span>
                      <span className={cn(
                        "font-semibold text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {courseDetails.TotalAssignments}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={cn(
                        "text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        {t('admin.quizzes')}
                      </span>
                      <span className={cn(
                        "font-semibold text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {courseDetails.TotalQuizzes}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4 mt-4">
            {sections.length > 0 ? (
              <div className="grid gap-4">
                {sections.map((section) => (
                  <Card key={`${section.Section_ID}-${section.Semester}`} className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className={cn(
                              "font-semibold text-lg text-[#211c37] dark:text-white",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                            )}>
                              {t('admin.section')} {section.Section_ID}
                            </h3>
                            <Badge className={cn(
                              neoBrutalismMode 
                                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                : ""
                            )}>
                              {section.Semester}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className={cn(
                                "text-[#85878d] dark:text-gray-400",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>
                                {t('admin.students')}
                              </p>
                              <p className={cn(
                                "font-semibold text-[#211c37] dark:text-white",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                              )}>
                                {section.StudentCount}
                              </p>
                            </div>
                            <div>
                              <p className={cn(
                                "text-[#85878d] dark:text-gray-400",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>
                                {t('admin.tutors')}
                              </p>
                              <p className={cn(
                                "font-semibold text-[#211c37] dark:text-white",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                              )}>
                                {section.TutorCount}
                              </p>
                            </div>
                            <div>
                              <p className={cn(
                                "text-[#85878d] dark:text-gray-400",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>
                                {t('admin.rooms')}
                              </p>
                              <p className={cn(
                                "font-semibold text-[#211c37] dark:text-white",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                              )}>
                                {section.RoomCount}
                              </p>
                            </div>
                            {section.TutorNames && (
                              <div>
                                <p className={cn(
                                  "text-[#85878d] dark:text-gray-400",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {t('admin.tutorNames')}
                                </p>
                                <p className={cn(
                                  "text-xs text-[#211c37] dark:text-white",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {section.TutorNames}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                <CardContent className="pt-6 text-center py-12">
                  <p className={cn(
                    "text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.noSections')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-4 mt-4">
            {students.length > 0 ? (
              <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                <CardHeader>
                  <CardTitle className={cn(
                    "text-xl text-[#1f1d39] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {t('admin.enrolledStudents')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={cn(
                          "border-b",
                          neoBrutalismMode 
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB]"
                            : "border-[#e5e7e7] dark:border-[#333]"
                        )}>
                          <th className={cn(
                            "text-left py-3 px-4 text-sm font-semibold text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.student')}
                          </th>
                          <th className={cn(
                            "text-left py-3 px-4 text-sm font-semibold text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.section')}
                          </th>
                          <th className={cn(
                            "text-left py-3 px-4 text-sm font-semibold text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.status')}
                          </th>
                          <th className={cn(
                            "text-left py-3 px-4 text-sm font-semibold text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.finalGrade')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={`${student.University_ID}-${student.Section_ID}-${student.Semester}`} className={cn(
                            "border-b",
                            neoBrutalismMode 
                              ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB]"
                              : "border-[#e5e7e7] dark:border-[#333]"
                          )}>
                            <td className="py-3 px-4">
                              <div>
                                <p className={cn(
                                  "font-semibold text-[#211c37] dark:text-white",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                )}>
                                  {student.First_Name} {student.Last_Name}
                                </p>
                                <p className={cn(
                                  "text-xs text-[#85878d] dark:text-gray-400",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {student.University_ID} • {student.Major}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className={cn(
                                  "text-sm text-[#211c37] dark:text-white",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {student.Section_ID}
                                </p>
                                <p className={cn(
                                  "text-xs text-[#85878d] dark:text-gray-400",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {student.Semester}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={cn(
                                student.Status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                student.Status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                                neoBrutalismMode 
                                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                  : ""
                              )}>
                                {student.Status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <p className={cn(
                                "font-semibold text-[#211c37] dark:text-white",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                              )}>
                                {student.Final_Grade !== null ? student.Final_Grade.toFixed(2) : 'N/A'}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                <CardContent className="pt-6 text-center py-12">
                  <p className={cn(
                    "text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.noStudents')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4 mt-4">
            {statistics && (
              <CourseStatisticsView courseId={courseId || ''} statistics={statistics} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

