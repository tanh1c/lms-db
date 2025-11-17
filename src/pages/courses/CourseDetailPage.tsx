import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { courseService } from '@/lib/api/courseService'
import { quizService } from '@/lib/api/quizService'
import { gradeService } from '@/lib/api/gradeService'
import { studentService } from '@/lib/api/studentService'
import { useAuth } from '@/context/AuthProvider'
import type { Course, Section, Quiz, Assessment, User } from '@/types'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import { ArrowLeft, BookOpen, Users, Award, Calendar, GraduationCap, BarChart3, Clock } from 'lucide-react'
import CourseContentCard from '@/components/courses/CourseContentCard'
import { format } from 'date-fns'

export default function CourseDetailPage() {
  const { t } = useTranslation()
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [, setGrades] = useState<Assessment[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const neoBrutalismMode = useNeoBrutalismMode()

  useEffect(() => {
    const loadData = async () => {
      if (!courseId || !user) return
      
      try {
        const courseIdNum = parseInt(courseId)
        const [courseData, sectionsData, quizzesData, gradesData, studentsData] = await Promise.all([
          courseService.getCourseById(courseIdNum),
          courseService.getSectionsByCourse(courseIdNum),
          quizService.getQuizzesByCourse(user.University_ID, courseIdNum),
          gradeService.getGradeByCourse(user.University_ID, courseIdNum),
          studentService.getStudentsByCourse(courseIdNum),
        ])
        
        setCourse(courseData)
        setSections(sectionsData)
        setQuizzes(quizzesData)
        setGrades(gradesData)
        setStudents(studentsData)
      } catch (error) {
        console.error('Error loading course:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId, user])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('common.loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-[#85878d]">{t('courses.courseNotFound')}</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={course.Name}
      subtitle={`Course ID: ${course.Course_ID}`}
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.COURSES)}
          className={cn(
            "mb-4",
            neoBrutalismMode
              ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
              : "border border-[#e5e7e7] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
          )}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('courses.backToCourses')}</span>
        </Button>

        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-12 h-12 bg-[#e1e2f6] dark:bg-purple-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className={cn(
                  "text-2xl text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>{course.Name}</CardTitle>
                <CardDescription className={cn(
                  "text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>{t('courses.courseId')}: {course.Course_ID}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className={cn(
                "flex items-center gap-3 p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a]",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <Award className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                <div>
                  <p className={cn(
                    "text-sm font-medium text-[#676767] dark:text-gray-400 mb-1",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>{t('courses.credits')}</p>
                  <p className={cn(
                    "text-lg font-semibold text-[#1f1d39] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{course.Credit} {t('courses.credits')}</p>
                </div>
              </div>
              {course.Start_Date && (
                <div className={cn(
                  "flex items-center gap-3 p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a]",
                  neoBrutalismMode 
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                    : "rounded-lg"
                )}>
                  <Calendar className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                  <div>
                    <p className={cn(
                      "text-sm font-medium text-[#676767] dark:text-gray-400 mb-1",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>{t('courses.startDate')}</p>
                    <p className={cn(
                      "text-lg font-semibold text-[#1f1d39] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{new Date(course.Start_Date).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardContent className="pt-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className={cn(
                "grid w-full grid-cols-3 bg-gray-100 dark:bg-[#2a2a2a]",
                neoBrutalismMode && "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
              )}>
                <TabsTrigger 
                  value="overview" 
                  className={cn(
                    "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]",
                    neoBrutalismMode && "data-[state=active]:border-4 data-[state=active]:border-[#1a1a1a] dark:data-[state=active]:border-[#FFFBEB] data-[state=active]:rounded-none data-[state=active]:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:data-[state=active]:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}
                >
                  {t('courses.overview')}
                </TabsTrigger>
                <TabsTrigger 
                  value="grades"
                  className={cn(
                    "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]",
                    neoBrutalismMode && "data-[state=active]:border-4 data-[state=active]:border-[#1a1a1a] dark:data-[state=active]:border-[#FFFBEB] data-[state=active]:rounded-none data-[state=active]:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:data-[state=active]:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}
                >
                  {t('courses.grades')}
                </TabsTrigger>
                <TabsTrigger 
                  value="competencies"
                  className={cn(
                    "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]",
                    neoBrutalismMode && "data-[state=active]:border-4 data-[state=active]:border-[#1a1a1a] dark:data-[state=active]:border-[#FFFBEB] data-[state=active]:rounded-none data-[state=active]:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:data-[state=active]:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}
                >
                  {t('courses.competencies')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="space-y-6">
                  <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center",
                          neoBrutalismMode 
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                            : "rounded-lg"
                        )}>
                          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className={cn(
                            "text-xl text-[#1f1d39] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                          )}>{t('courses.courseContent')}</CardTitle>
                          <CardDescription className={cn(
                            "text-[#85878d] dark:text-gray-400",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                          )}>
                            {t('courses.courseMaterials')}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CourseContentCard courseId={course.Course_ID} />
                    </CardContent>
                  </Card>

                  <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 bg-[#f8efe2] dark:bg-orange-900/30 flex items-center justify-center",
                          neoBrutalismMode 
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                            : "rounded-lg"
                        )}>
                          <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <CardTitle className={cn(
                            "text-xl text-[#1f1d39] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                          )}>{t('courses.sections')}</CardTitle>
                          <CardDescription className={cn(
                            "text-[#85878d] dark:text-gray-400",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                          )}>{t('courses.sectionsList')}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {sections.length > 0 ? (
                        <div className="space-y-3">
                          {sections.map((section) => (
                            <div
                              key={section.Section_ID}
                              className={cn(
                                "flex items-center justify-between p-4 cursor-pointer transition-all",
                                neoBrutalismMode
                                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                                  : "border border-[#e5e7e7] dark:border-[#333] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                              )}
                              onClick={() => navigate(ROUTES.SECTION_DETAIL
                                .replace(':courseId', courseId!)
                                .replace(':sectionId', section.Section_ID.toString())
                              )}
                            >
                              <div>
                                <p className={cn(
                                  "font-semibold text-[#1f1d39] dark:text-white",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                )}>{t('courses.section')} {section.Section_ID}</p>
                                <p className={cn(
                                  "text-sm text-[#85878d] dark:text-gray-400",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>{t('courses.semester')}: {section.Semester}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={cn(
                                  neoBrutalismMode
                                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                                    : "border border-[#e5e7e7] dark:border-[#333]"
                                )}
                              >
                                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('courses.viewDetails')}</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={cn(
                          "text-sm text-[#85878d] dark:text-gray-400 text-center py-4",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>{t('courses.noSectionsAvailable')}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="grades" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className={cn(
                      "text-lg font-semibold text-[#1f1d39] dark:text-white mb-4",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                    )}>{t('courses.quizGrades')}</h3>
                    {quizzes.length > 0 ? (
                      <div className="space-y-3">
                        {quizzes.map((quiz) => {
                          const passed = quiz.score >= quiz.pass_score
                          const statusColors = {
                            'Passed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                            'Submitted': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                            'Failed': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                            'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                            'Not Taken': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                          }
                          const statusColor = statusColors[quiz.completion_status] || statusColors['Not Taken']

                          return (
                            <div
                              key={quiz.Assessment_ID}
                              className={cn(
                                "p-4 bg-white dark:bg-[#1a1a1a] transition-all",
                                neoBrutalismMode
                                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                                  : "border border-[#e5e7e7] dark:border-[#333] rounded-xl hover:shadow-sm transition-shadow"
                              )}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <BarChart3 className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                                    <h4 className={cn(
                                      "font-semibold text-[#1f1d39] dark:text-white",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>{quiz.content}</h4>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-[#85878d] dark:text-gray-400 ml-8">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{quiz.Time_limits}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{t('courses.passScore')}: {quiz.pass_score}</span>
                                    {quiz.Weight && (
                                      <>
                                        <span>•</span>
                                        <span>{t('courses.weight')}: {(quiz.Weight * 100).toFixed(0)}%</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {quiz.completion_status !== 'Not Taken' && (
                                    <div className="text-right">
                                      <div className={`text-2xl font-bold ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {quiz.score.toFixed(1)}
                                      </div>
                                      <div className="text-xs text-[#85878d] dark:text-gray-400">/ 10</div>
                                    </div>
                                  )}
                                  <Badge className={statusColor}>
                                    {quiz.completion_status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="ml-8 text-xs text-[#85878d] dark:text-gray-400">
                                {format(new Date(quiz.Start_Date), 'MMM dd, yyyy')} - {format(new Date(quiz.End_Date), 'MMM dd, yyyy')}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#85878d] dark:text-gray-400">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>{t('courses.noQuizGrades')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="competencies" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className={cn(
                      "text-lg font-semibold text-[#1f1d39] dark:text-white mb-4",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                    )}>{t('courses.studentsInCourse')}</h3>
                    {students.length > 0 ? (
                      <div className="space-y-3">
                        {students.map((student) => (
                          <div
                            key={student.University_ID}
                            className={cn(
                              "p-4 bg-white dark:bg-[#1a1a1a] transition-all",
                              neoBrutalismMode
                                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                                : "border border-[#e5e7e7] dark:border-[#333] rounded-xl hover:shadow-sm transition-shadow"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0",
                                neoBrutalismMode 
                                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                                  : "rounded-full"
                              )}>
                                <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <h4 className={cn(
                                  "font-semibold text-[#1f1d39] dark:text-white",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                )}>
                                  {student.First_Name} {student.Last_Name}
                                </h4>
                                <div className="flex items-center gap-4 mt-1 text-sm text-[#85878d] dark:text-gray-400">
                                  <span>ID: {student.University_ID}</span>
                                  {student.Email && (
                                    <>
                                      <span>•</span>
                                      <span>{student.Email}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#85878d] dark:text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>{t('courses.noStudentsEnrolled')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

