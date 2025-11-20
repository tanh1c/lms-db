import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { courseService } from '@/lib/api/courseService'
import type { Course } from '@/types'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismInputClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismCourseCardClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import { 
  BookOpen, 
  Calendar, 
  Award, 
  Search, 
  Filter,
  Users,
  ArrowRight,
  PlayCircle
} from 'lucide-react'

export default function CourseListPage() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'enrolled' | 'available'>('all')
  const navigate = useNavigate()
  const neoBrutalismMode = useNeoBrutalismMode()

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await courseService.getCourses()
        setCourses(data)
      } catch (error) {
        console.error('Error loading courses:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  // Filter courses based on search and filter
  const filteredCourses = courses.filter((course) => {
    const courseName = course.Name || ''
    const matchesSearch = courseName
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[#211c37] dark:text-white">{t('common.loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <div>
            <h1 className={cn(
              "text-3xl font-bold text-[#211c37] dark:text-white mb-2",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
            )}>
              {t('courses.myCourses')}
            </h1>
            <p className={cn(
              "text-[#85878d] dark:text-gray-400",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
            )}>
              {t('courses.exploreCourses')}
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#85878d] dark:text-gray-400" />
              <Input
                placeholder={t('courses.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-12 h-12 bg-white dark:bg-[#1a1a1a] text-[#211c37] dark:text-white",
                  getNeoBrutalismInputClasses(neoBrutalismMode)
                )}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('all')}
                className={cn(
                  "h-12 px-6",
                  selectedFilter === 'all'
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary')
                    : getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline', "text-[#211c37] dark:text-white hover:bg-gray-50 dark:hover:bg-[#2a2a2a]")
                )}
              >
                <Filter className="w-4 h-4 mr-2" />
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('courses.all')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              return (
                <Card
                  key={course.Course_ID}
                  className={cn(
                    "group relative overflow-hidden flex flex-col h-full",
                    getNeoBrutalismCourseCardClasses(neoBrutalismMode, neoBrutalismMode ? "" : "shadow-none hover:shadow-2xl dark:hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1")
                  )}
                  onClick={() => navigate(ROUTES.COURSE_DETAIL.replace(':courseId', course.Course_ID.toString()))}
                >
                  {/* Simple Header */}
                  <div className={cn(
                    "relative h-24 overflow-hidden",
                    neoBrutalismMode 
                      ? "bg-white dark:bg-[#2a2a2a] border-b-4 border-[#1a1a1a] dark:border-[#FFFBEB]"
                      : "bg-[#f5f7f9] dark:bg-[#2a2a2a]"
                  )}>
                    <div className="absolute top-4 right-4">
                      <Badge className={cn(
                        "bg-black dark:bg-white text-white dark:text-black",
                        neoBrutalismMode ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]" : "border-0"
                      )}>
                        <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{course.Credit} {t('courses.credits')}</span>
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <div className={cn(
                        "w-12 h-12 bg-white dark:bg-[#1a1a1a] flex items-center justify-center",
                        neoBrutalismMode 
                          ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                          : "rounded-xl border border-[#e5e7e7] dark:border-[#333]"
                      )}>
                        <BookOpen className="w-6 h-6 text-[#211c37] dark:text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div>
                      <h3 className={cn(
                        "text-xl font-bold text-[#211c37] dark:text-white mb-2 line-clamp-2 transition-colors",
                        !neoBrutalismMode && "group-hover:text-[#3bafa8] dark:group-hover:text-[#3bafa8]",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>
                        {course.Name}
                      </h3>
                      <p className={cn(
                        "text-sm text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        {t('courses.courseCode')}: {course.Course_ID}
                      </p>
                    </div>

                    {/* Course Info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-[#676767] dark:text-gray-400">
                        <Award className="w-4 h-4" />
                        <span>{course.Credit} {t('courses.credits')}</span>
                      </div>
                      {course.Start_Date && (
                        <div className="flex items-center gap-2 text-[#676767] dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(course.Start_Date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[#676767] dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>120 {t('courses.students')}</span>
                      </div>
                    </div>

                    {/* Progress Bar (Mock) */}
                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#85878d] dark:text-gray-400">{t('courses.progress')}</span>
                        <span className="font-semibold text-[#211c37] dark:text-white">0%</span>
                      </div>
                      <div className={cn(
                        "h-2 bg-[#eff1f3] dark:bg-[#333] overflow-hidden",
                        neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : "rounded-full"
                      )}>
                        <div 
                          className={cn(
                            "h-full bg-gradient-to-r from-[#3bafa8] to-[#45a8a3] transition-all duration-500",
                            neoBrutalismMode ? "rounded-none" : "rounded-full"
                          )}
                          style={{ width: '0%' }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(ROUTES.COURSE_DETAIL.replace(':courseId', course.Course_ID.toString()))
                      }}
                      className={cn(
                        "w-full h-11 group/btn",
                        neoBrutalismMode 
                          ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "hover:bg-gray-800 dark:hover:bg-gray-200")
                          : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl"
                      )}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <PlayCircle className="w-4 h-4" />
                        <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('courses.viewDetails')}</span>
                        <ArrowRight className={cn(
                          "w-4 h-4 transition-transform",
                          !neoBrutalismMode && "group-hover/btn:translate-x-1"
                        )} />
                      </span>
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <div className="py-16 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-[#85878d] dark:text-gray-400" />
              <p className={cn(
                "text-lg font-semibold text-[#211c37] dark:text-white mb-2",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {searchQuery ? t('courses.noCoursesFound') : t('courses.noCoursesYet')}
              </p>
              <p className={cn(
                "text-sm text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {searchQuery 
                  ? t('courses.tryDifferentKeyword')
                  : t('courses.coursesWillAppear')}
              </p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

