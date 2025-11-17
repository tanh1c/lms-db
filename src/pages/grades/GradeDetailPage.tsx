import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { gradeService } from '@/lib/api/gradeService'
import { courseService } from '@/lib/api/courseService'
import type { Assessment, Course } from '@/types'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import { ArrowLeft, BarChart3, Calendar } from 'lucide-react'

export default function GradeDetailPage() {
  const { t } = useTranslation()
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [grades, setGrades] = useState<Assessment[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const neoBrutalismMode = useNeoBrutalismMode()

  useEffect(() => {
    const loadData = async () => {
      if (!courseId) return
      
      try {
        const courseData = await courseService.getCourseById(parseInt(courseId))
        setCourse(courseData)
        
        // In real app, get grades for this course
        // For now, use mock data
        const allGrades = await gradeService.getGrades(100001) // Mock user ID
        const courseGrades = allGrades.filter(g => g.Course_ID === parseInt(courseId))
        setGrades(courseGrades)
      } catch (error) {
        console.error('Error loading grade details:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId])

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

  return (
    <DashboardLayout 
      title={course?.Name || `Course ${courseId}`}
      subtitle={t('grades.gradeDetails')}
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.GRADES)}
          className={cn(
            "mb-4",
            neoBrutalismMode
              ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
              : "border border-[#e5e7e7] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
          )}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('grades.backToGrades')}</span>
        </Button>

        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 bg-[#e1e2f6] dark:bg-purple-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className={cn(
                  "text-2xl text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {course?.Name || `Course ${courseId}`}
                </CardTitle>
                <CardDescription className={cn(
                  "text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>{t('grades.gradeDetails')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(
              "flex items-center justify-between p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a]",
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                : "rounded-lg"
            )}>
              <span className={cn(
                "text-lg font-medium text-[#676767] dark:text-gray-300",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
              )}>{t('grades.averageGradeLabel')}:</span>
              <span className={cn(
                "text-2xl font-bold text-[#1f1d39] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>{averageGrade}</span>
            </div>

            <div className="space-y-3">
              {grades.map((grade) => (
                <Card key={grade.Assessment_ID} className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-semibold text-[#1f1d39] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>{t('grades.assessment')} {grade.Assessment_ID}</p>
                          <Badge
                            className={cn(
                              grade.Status === 'Approved'
                                ? 'bg-green-500 dark:bg-green-600 text-white'
                                : grade.Status === 'Rejected'
                                ? 'bg-red-500 dark:bg-red-600 text-white'
                                : 'bg-gray-500 dark:bg-gray-600 text-white',
                              neoBrutalismMode && "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                            )}
                          >
                            <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{grade.Status}</span>
                          </Badge>
                        </div>
                        <div className={cn(
                          "flex items-center gap-4 text-sm text-[#85878d] dark:text-gray-400",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(grade.Registration_Date).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-3xl font-bold text-[#3bafa8] dark:text-teal-400",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                        )}>{grade.Grade.toFixed(2)}</div>
                        <p className={cn(
                          "text-sm text-[#85878d] dark:text-gray-400",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>{t('grades.points')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {grades.length === 0 && (
              <div className="text-center py-8 text-[#85878d] dark:text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('grades.noGradesForCourse')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
