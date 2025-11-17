import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { gradeService } from '@/lib/api/gradeService'
import { courseService } from '@/lib/api/courseService'
import { useAuth } from '@/context/AuthProvider'
import type { Assessment, Course } from '@/types'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismTextClasses,
  getNeoBrutalismStatCardClasses
} from '@/lib/utils/theme-utils'
import { BarChart3, TrendingUp, BookOpen } from 'lucide-react'
import '@/lib/animations/gsap-setup'

export default function GradeOverviewPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [grades, setGrades] = useState<Assessment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
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
    const loadData = async () => {
      if (!user) return
      
      try {
        const [gradesData, coursesData] = await Promise.all([
          gradeService.getGrades(user.University_ID),
          courseService.getCourses(),
        ])
        
        setGrades(gradesData)
        setCourses(coursesData)
      } catch (error) {
        console.error('Error loading grades:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[#1f1d39] dark:text-white">{t('common.loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  const averageGrade = grades.length > 0
    ? (grades.reduce((sum, g) => sum + g.Grade, 0) / grades.length).toFixed(2)
    : 'N/A'

  const getCourseName = (courseId: number) => {
    return courses.find(c => c.Course_ID === courseId)?.Name || `Course ${courseId}`
  }

  const groupedGrades = grades.reduce((acc, grade) => {
    const courseId = grade.Course_ID
    if (!acc[courseId]) {
      acc[courseId] = []
    }
    acc[courseId].push(grade)
    return acc
  }, {} as Record<number, Assessment[]>)

  return (
    <DashboardLayout 
      title={t('grades.title')} 
      subtitle={t('grades.subtitle')}
    >
      <div ref={containerRef} className="space-y-6">
        <div className="grid gap-5 md:grid-cols-3">
          <Card className={getNeoBrutalismStatCardClasses(neoBrutalismMode)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-sm font-medium text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>{t('grades.averageGrade')}</CardTitle>
              <div className={cn(
                "w-10 h-10 bg-[#e1e2f6] dark:bg-purple-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-3xl font-bold text-[#1f1d39] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>{averageGrade}</div>
              <p className={cn(
                "text-xs text-[#85878d] dark:text-gray-400 mt-1",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>{t('grades.totalGrades')} {grades.length} {t('grades.grades')}</p>
            </CardContent>
          </Card>

          <Card className={getNeoBrutalismStatCardClasses(neoBrutalismMode)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-sm font-medium text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>{t('grades.totalCourses')}</CardTitle>
              <div className={cn(
                "w-10 h-10 bg-[#f8efe2] dark:bg-orange-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <BookOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-3xl font-bold text-[#1f1d39] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>{Object.keys(groupedGrades).length}</div>
              <p className={cn(
                "text-xs text-[#85878d] dark:text-gray-400 mt-1",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>{t('grades.coursesWithGrades')}</p>
            </CardContent>
          </Card>

          <Card className={getNeoBrutalismStatCardClasses(neoBrutalismMode)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-sm font-medium text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>{t('grades.totalGrades')}</CardTitle>
              <div className={cn(
                "w-10 h-10 bg-[#eff7e2] dark:bg-green-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-3xl font-bold text-[#1f1d39] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>{grades.length}</div>
              <p className={cn(
                "text-xs text-[#85878d] dark:text-gray-400 mt-1",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>{t('grades.totalAssessments')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedGrades).map(([courseId, courseGrades]) => {
            const courseAvg = (courseGrades.reduce((sum, g) => sum + g.Grade, 0) / courseGrades.length).toFixed(2)
            return (
              <Card 
                key={courseId} 
                className={cn(
                  getNeoBrutalismCardClasses(neoBrutalismMode),
                  !neoBrutalismMode && "hover:shadow-lg transition-shadow"
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={cn(
                        "text-lg text-[#1f1d39] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>{getCourseName(parseInt(courseId))}</CardTitle>
                      <CardDescription className={cn(
                        "text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('courses.courseId')}: {courseId}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-2xl font-bold text-[#1f1d39] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>{courseAvg}</div>
                      <p className={cn(
                        "text-sm text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('grades.averageGrade')}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {courseGrades.map((grade) => (
                      <div 
                        key={grade.Assessment_ID} 
                        className={cn(
                          "flex items-center justify-between p-3 transition-all",
                          neoBrutalismMode
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                            : "rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                        )}
                      >
                        <div>
                          <p className={cn(
                            "font-semibold text-[#1f1d39] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>{t('grades.assessment')} {grade.Assessment_ID}</p>
                          <p className={cn(
                            "text-sm text-[#85878d] dark:text-gray-400",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                          )}>
                            {t('grades.status')}: {grade.Status}
                          </p>
                        </div>
                        <div className={cn(
                          "text-lg font-bold text-[#3bafa8] dark:text-teal-400",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>{grade.Grade.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-4",
                      neoBrutalismMode 
                        ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline', "hover:bg-gray-50 dark:hover:bg-[#2a2a2a]")
                        : "border-[#e5e7e7] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                    )}
                    onClick={() => navigate(ROUTES.GRADE_DETAIL.replace(':courseId', courseId))}
                  >
                    <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('courses.viewDetails')}</span>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {grades.length === 0 && (
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardContent className="py-10 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-[#85878d] dark:text-gray-400 opacity-50" />
              <p className={cn(
                "text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>{t('grades.noGradesAvailable')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

