import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { studentService, type CourseWithSections as StudentCourseWithSections } from '@/lib/api/studentService'
import { tutorService, type CourseWithSections as TutorCourseWithSections } from '@/lib/api/tutorService'
import { useAuth } from '@/context/AuthProvider'
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
  Award, 
  Search, 
  Filter,
  Users,
  ArrowRight,
  PlayCircle
} from 'lucide-react'

export default function CourseListPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [courses, setCourses] = useState<(StudentCourseWithSections | TutorCourseWithSections)[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'enrolled' | 'available'>('all')
  const navigate = useNavigate()
  const neoBrutalismMode = useNeoBrutalismMode()

  // Color palettes for course card backgrounds
  const courseCardColors = [
    { bg: 'bg-[#e1e2f6]', iconBg: 'bg-[#fcf9ff]', iconColor: 'text-purple-600' },
    { bg: 'bg-[#f8efe2]', iconBg: 'bg-[#faf5ec]', iconColor: 'text-orange-600' },
    { bg: 'bg-[#eff7e2]', iconBg: 'bg-[#f6fbee]', iconColor: 'text-green-600' },
    { bg: 'bg-[#e2f0f6]', iconBg: 'bg-[#f0f9ff]', iconColor: 'text-blue-600' },
    { bg: 'bg-[#f6e2f0]', iconBg: 'bg-[#fef0f9]', iconColor: 'text-pink-600' },
    { bg: 'bg-[#e2f6f0]', iconBg: 'bg-[#f0fef9]', iconColor: 'text-teal-600' },
    { bg: 'bg-[#f6f0e2]', iconBg: 'bg-[#fef9f0]', iconColor: 'text-amber-600' },
    { bg: 'bg-[#f0e2f6]', iconBg: 'bg-[#f9f0fe]', iconColor: 'text-violet-600' },
    { bg: 'bg-[#ffe2e2]', iconBg: 'bg-[#fff0f0]', iconColor: 'text-red-600' },
    { bg: 'bg-[#e2ffe2]', iconBg: 'bg-[#f0fff0]', iconColor: 'text-emerald-600' },
    { bg: 'bg-[#e2e2ff]', iconBg: 'bg-[#f0f0ff]', iconColor: 'text-indigo-600' },
    { bg: 'bg-[#fff2e2]', iconBg: 'bg-[#fffaf0]', iconColor: 'text-yellow-600' },
    { bg: 'bg-[#e2f2ff]', iconBg: 'bg-[#f0f9ff]', iconColor: 'text-cyan-600' },
    { bg: 'bg-[#ffe2f2]', iconBg: 'bg-[#fff0f9]', iconColor: 'text-rose-600' },
    { bg: 'bg-[#f2ffe2]', iconBg: 'bg-[#f9fff0]', iconColor: 'text-lime-600' },
    { bg: 'bg-[#f2e2ff]', iconBg: 'bg-[#f9f0ff]', iconColor: 'text-fuchsia-600' },
  ]

  useEffect(() => {
    const loadCourses = async () => {
      if (!user) return
      
      try {
        let data
        if (user.role === 'tutor') {
          data = await tutorService.getTutorCoursesWithSections(user.University_ID)
        } else {
          data = await studentService.getStudentCoursesWithSections(user.University_ID)
        }
        setCourses(data)
      } catch (error) {
        console.error('Error loading courses:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [user])

  // Filter courses based on search and filter
  const filteredCourses = courses.filter((course) => {
    const courseName = course.Name || ''
    const matchesSearch = courseName
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Group courses by semester
  const coursesBySemester = filteredCourses.reduce((acc, course) => {
    if (course.Sections && course.Sections.length > 0) {
      course.Sections.forEach((section) => {
        const semester = section.Semester
        if (!acc[semester]) {
          acc[semester] = []
        }
        // Check if course already added for this semester
        const existingCourse = acc[semester].find(c => c.Course_ID === course.Course_ID)
        if (!existingCourse) {
          // Create a copy of course with only sections for this semester
          acc[semester].push({
            ...course,
            Sections: course.Sections.filter(s => s.Semester === semester)
          })
        } else {
          // Add section to existing course if not already present
          const sectionExists = existingCourse.Sections.some((s: { Section_ID: string }) => s.Section_ID === section.Section_ID)
          if (!sectionExists) {
            existingCourse.Sections.push(section)
          }
        }
      })
    }
    return acc
  }, {} as Record<string, (StudentCourseWithSections | TutorCourseWithSections)[]>)

  // Sort semesters (newest first)
  const sortedSemesters = Object.keys(coursesBySemester).sort((a, b) => {
    // Sort by semester string (e.g., "2024-2025.2" > "2024-2025.1")
    return b.localeCompare(a)
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

        {/* Courses by Semester */}
        {sortedSemesters.length > 0 ? (
          <div className="space-y-8">
            {sortedSemesters.map((semester, semesterIndex) => {
              const semesterCourses = coursesBySemester[semester]
              return (
                <div key={semester} className="space-y-4">
                  {/* Semester Header */}
                  <div className={cn(
                    "flex items-center gap-3 pb-2 border-b-2",
                    neoBrutalismMode 
                      ? "border-[#1a1a1a] dark:border-[#FFFBEB]"
                      : "border-[#e5e7e7] dark:border-[#333]"
                  )}>
                    <div className={cn(
                      "w-10 h-10 bg-[#3bafa8] dark:bg-[#3bafa8]/30 flex items-center justify-center",
                      neoBrutalismMode 
                        ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                        : "rounded-lg"
                    )}>
                      <Award className="h-5 w-5 text-white dark:text-[#3bafa8]" />
                    </div>
                    <div>
                      <h2 className={cn(
                        "text-2xl font-bold text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>
                        {t('courses.semester')}: {semester}
                      </h2>
                      <p className={cn(
                        "text-sm text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        {semesterCourses.length} {semesterCourses.length === 1 ? (t('courses.course') || 'course') : (t('courses.courses') || 'courses')}
                      </p>
                    </div>
                  </div>

                  {/* Courses Grid for this Semester */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {semesterCourses.map((course, courseIndex) => {
                      const cardConfig = courseCardColors[(semesterIndex * 10 + courseIndex) % courseCardColors.length]
                      return (
                        <Card
                          key={`${semester}-${course.Course_ID}`}
                          className={cn(
                            "group relative overflow-hidden flex flex-col h-full",
                            getNeoBrutalismCourseCardClasses(neoBrutalismMode, neoBrutalismMode ? "" : "shadow-none hover:shadow-2xl dark:hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1")
                          )}
                          onClick={() => {
                            // Navigate to first section if available, otherwise to course detail
                            if (course.Sections && course.Sections.length > 0) {
                              const firstSection = course.Sections[0]
                              navigate(ROUTES.SECTION_DETAIL
                                .replace(':courseId', course.Course_ID.toString())
                                .replace(':sectionId', firstSection.Section_ID)
                              )
                            } else {
                              navigate(ROUTES.COURSE_DETAIL.replace(':courseId', course.Course_ID.toString()))
                            }
                          }}
                        >
                          {/* Simple Header */}
                          <div className={cn(
                            "relative h-24 overflow-hidden",
                            neoBrutalismMode 
                              ? "bg-white dark:bg-[#2a2a2a] border-b-4 border-[#1a1a1a] dark:border-[#FFFBEB]"
                              : `${cardConfig.bg} dark:bg-[#2a2a2a]`
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
                                `w-12 h-12 ${cardConfig.iconBg} dark:bg-[#1a1a1a] flex items-center justify-center`,
                                neoBrutalismMode 
                                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                                  : "rounded-xl border border-[#e5e7e7] dark:border-[#333]"
                              )}>
                                <BookOpen className={cn("w-6 h-6", cardConfig.iconColor, "dark:text-white")} />
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-6 space-y-4 flex-1 flex flex-col">
                            <div>
                              <h3 className={cn(
                                "text-xl font-bold text-[#211c37] dark:text-white mb-2 transition-colors",
                                !neoBrutalismMode && "group-hover:text-[#3bafa8] dark:group-hover:text-[#3bafa8]",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                              )}
                              style={{ 
                                minHeight: '3.5rem',
                                display: 'flex',
                                alignItems: 'flex-start',
                                lineHeight: '1.75rem'
                              }}>
                                <span className="line-clamp-2">{course.Name}</span>
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
                              {course.Sections && course.Sections.length > 0 && (
                                <div className="flex items-center gap-2 text-[#676767] dark:text-gray-400">
                                  <Users className="w-4 h-4" />
                                  <span>
                                    {course.Sections.length === 1 
                                      ? `${t('courses.section')} ${course.Sections[0].Section_ID}`
                                      : `${course.Sections.length} ${t('courses.sections')}`
                                    }
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                // Navigate to first section if available, otherwise to course detail
                                if (course.Sections && course.Sections.length > 0) {
                                  const firstSection = course.Sections[0]
                                  navigate(ROUTES.SECTION_DETAIL
                                    .replace(':courseId', course.Course_ID.toString())
                                    .replace(':sectionId', firstSection.Section_ID)
                                  )
                                } else {
                                  navigate(ROUTES.COURSE_DETAIL.replace(':courseId', course.Course_ID.toString()))
                                }
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
                </div>
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

