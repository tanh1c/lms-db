import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { studentService, type StudentDashboardStatistics, type LeaderboardEntry, type GradeComponent } from '@/lib/api/studentService'
import { ROUTES } from '@/constants/routes'
import type { Course } from '@/types'
import { Trophy, Edit2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart'
import { useNeoBrutalismMode, getNeoBrutalismCardClasses, getNeoBrutalismStatCardClasses, getNeoBrutalismCourseCardClasses, getNeoBrutalismTextClasses } from '@/lib/utils/theme-utils'
import { cn } from '@/lib/utils'
import '@/lib/animations/gsap-setup'

// Figma assets URLs
const imgProfilePicture = "https://www.figma.com/api/mcp/asset/3c99bdb9-fc77-4a11-92f6-351812a3d9bf"
const imgVerificationIcon = "https://www.figma.com/api/mcp/asset/757dafdc-d5a2-4914-af02-10eb336d23e4"

export default function StudentDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [statistics, setStatistics] = useState<StudentDashboardStatistics | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [gradeComponents, setGradeComponents] = useState<GradeComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
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
        const [coursesData, statsData, leaderboardData, gradeComponentsData] = await Promise.all([
          studentService.getStudentCourses(user.University_ID).catch(() => []),
          studentService.getDashboardStatistics(user.University_ID).catch(() => null),
          studentService.getLeaderboard(5).catch(() => []),
          studentService.getGradeComponents(user.University_ID).catch(() => []),
        ])
        
        setCourses(coursesData)
        setStatistics(statsData)
        setLeaderboard(leaderboardData)
        setGradeComponents(gradeComponentsData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
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
          <div className="text-lg">{t('common.loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  const gpa = statistics?.average_grade 
    ? statistics.average_grade.toFixed(2)
    : '0.00'

  // Calculate GPA percentage for circular progress (GPA out of 10)
  const gpaPercentage = statistics?.average_grade ? (statistics.average_grade / 10) * 100 : 0

  // Course card colors - extended palette for more courses
  const courseCardColors = [
    { color: 'bg-[#e1e2f6]', iconBg: 'bg-[#fcf9ff]', icon: '< >', iconColor: 'text-purple-600' },
    { color: 'bg-[#f8efe2]', iconBg: 'bg-[#faf5ec]', icon: '↑', iconColor: 'text-orange-600' },
    { color: 'bg-[#eff7e2]', iconBg: 'bg-[#f6fbee]', icon: '~', iconColor: 'text-green-600' },
    { color: 'bg-[#e2f0f6]', iconBg: 'bg-[#f0f9ff]', icon: '{}', iconColor: 'text-blue-600' },
    { color: 'bg-[#f6e2f0]', iconBg: 'bg-[#fef0f9]', icon: '()', iconColor: 'text-pink-600' },
    { color: 'bg-[#e2f6f0]', iconBg: 'bg-[#f0fef9]', icon: '[]', iconColor: 'text-teal-600' },
    { color: 'bg-[#f6f0e2]', iconBg: 'bg-[#fef9f0]', icon: '//', iconColor: 'text-amber-600' },
    { color: 'bg-[#f0e2f6]', iconBg: 'bg-[#f9f0fe]', icon: '**', iconColor: 'text-violet-600' },
  ]

  // Pagination: 8 courses per page (2 rows x 4 columns)
  const coursesPerPage = 8
  const totalPages = Math.ceil(courses.length / coursesPerPage)
  const startIndex = (currentPage - 1) * coursesPerPage
  const endIndex = startIndex + coursesPerPage
  const currentCourses = courses.slice(startIndex, endIndex)
  
  // Fill to always have 8 cards (2 rows x 4 columns)
  const displayCourses = Array.from({ length: 8 }, (_, index) => 
    currentCourses[index] || null
  )


  const handleCourseClick = (courseId: number) => {
    navigate(ROUTES.COURSE_DETAIL.replace(':courseId', courseId.toString()))
  }


  const handleCalendarNavigation = (_direction: 'prev' | 'next') => {
    // Navigate to schedule page
    navigate(ROUTES.SCHEDULE)
  }

  // Prepare grade components chart data
  const gradeChartData = gradeComponents.slice(0, 10).map((course) => ({
    course: course.course_name.length > 15 ? course.course_name.substring(0, 15) + '...' : course.course_name,
    'Final Grade': course.final_grade,
    'Midterm': course.midterm_grade,
    'Quiz': course.quiz_grade,
    'Assignment': course.assignment_grade,
  }))

  // Chart config với dark mode support
  const chartConfig = {
    'Final Grade': {
      label: 'Final Grade',
      color: '#45a8a3',
    },
    'Midterm': {
      label: 'Midterm',
      color: '#ff9053',
    },
    'Quiz': {
      label: 'Quiz',
      color: '#3bafa8',
    },
    'Assignment': {
      label: 'Assignment',
      color: '#8b5cf6',
    },
  } satisfies ChartConfig

  // Calendar - Get current month and days
  const now = new Date()
  const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const currentDay = now.getDate()
  
  // Get first day of current week (Monday)
  const firstDayOfWeek = new Date(now)
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday
  firstDayOfWeek.setDate(diff)
  
  // Generate 7 days starting from Monday of current week
  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(firstDayOfWeek)
    date.setDate(firstDayOfWeek.getDate() + i)
    return date.getDate()
  })

  // Right Sidebar Content
  const rightSidebarContent = (
    <>
      {/* Profile */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn(
            "text-lg font-semibold text-black dark:text-white",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
          )}>{t('dashboard.profile')}</h3>
          <Link
            to={ROUTES.PROFILE}
            className={cn(
              "w-14 h-14 flex items-center justify-center cursor-pointer transition-all",
              neoBrutalismMode
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                : "border border-[#e7eae9] dark:border-[#333] bg-white dark:bg-[#1a1a1a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
            )}
          >
            <Edit2 className="w-6 h-6 text-[#85878d] dark:text-gray-400" />
          </Link>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <div className={cn(
              "w-[101px] h-[101px] bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 shadow-lg",
              neoBrutalismMode
                ? "border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,251,235,1)]"
                : "rounded-full border-white dark:border-[#1a1a1a]"
            )}>
              {imgProfilePicture ? (
                <img src={imgProfilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#3bafa8] to-[#ff9053] flex items-center justify-center text-white text-2xl font-bold">
                  {user?.First_Name?.[0] || 'M'}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5">
              <img src={imgVerificationIcon} alt="Verified" className="w-full h-full" />
            </div>
          </div>
          <p className={cn(
            "font-semibold text-lg text-black dark:text-white mb-1",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
          )}>
            {user?.Last_Name || ''} {user?.First_Name || 'Maietry'}
          </p>
          <p className={cn(
            "text-sm text-black dark:text-gray-300 font-medium",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>{t('dashboard.collegeStudent')}</p>
        </div>
      </div>

      {/* Calendar */}
      <Card 
        className={cn(
          "p-4 mb-6 cursor-pointer",
          neoBrutalismMode
            ? getNeoBrutalismCardClasses(neoBrutalismMode, "hover:translate-x-1 hover:translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,251,235,1)] transition-all")
            : "bg-[#f8f8f8] dark:bg-[#1a1a1a] border-0 rounded-3xl hover:shadow-md dark:hover:shadow-lg transition-shadow"
        )}
        onClick={() => navigate(ROUTES.SCHEDULE)}
      >
        <div className="flex items-center justify-between mb-4">
          <ChevronLeft 
            className="w-4 h-4 cursor-pointer text-[#676767] dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors" 
            onClick={(e) => {
              e.stopPropagation()
              handleCalendarNavigation('prev')
            }}
          />
          <span className={cn(
            "text-sm font-semibold text-black dark:text-white",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
          )}>{currentMonth}</span>
          <ChevronRight 
            className="w-4 h-4 cursor-pointer text-[#676767] dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleCalendarNavigation('next')
            }}
          />
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2 text-[9.712px] text-center text-[#676767] dark:text-gray-400 font-medium">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className={i === 1 ? 'text-[#d2edfd] dark:text-[#3bafa8]' : ''}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => (
            <div
              key={day}
              className={cn(
                "w-8 h-8 flex items-center justify-center text-[10px] font-medium transition-all cursor-pointer",
                neoBrutalismMode
                  ? day === currentDay
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-black dark:bg-white text-white dark:text-black shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,251,235,1)] rounded-none"
                    : "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#1a1a1a] text-[#676767] dark:text-gray-400 rounded-none hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                  : `rounded-full transition-colors ${
                      day === currentDay 
                        ? 'bg-black dark:bg-white text-white dark:text-black' 
                        : 'text-[#676767] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
                    }`
              )}
            >
              {day}
            </div>
          ))}
        </div>
      </Card>

      {/* Leaderboard */}
      <div>
        <h3 className={cn(
          "text-lg font-semibold text-black dark:text-white text-center mb-4",
          getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
        )}>{t('dashboard.leaderBoard')}</h3>
        {leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((item) => (
              <div
                key={item.rank}
                className={cn(
                  "flex items-center gap-2 p-2 transition-all",
                  neoBrutalismMode
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                    : "hover:bg-gray-50 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                )}
                onClick={() => navigate(ROUTES.GRADES)}
              >
                <div className={cn(
                  "w-6 h-6 flex items-center justify-center text-xs font-semibold text-black dark:text-white flex-shrink-0",
                  neoBrutalismMode
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-[#f5f7fb] dark:bg-[#2a2a2a] rounded-none shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,251,235,1)]"
                    : "bg-[#f5f7fb] dark:bg-[#2a2a2a] rounded"
                )}>
                  {item.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-semibold text-black dark:text-white truncate",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>
                    {item.last_name} {item.first_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-xs text-[#676767] dark:text-gray-400",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {item.course} {t('dashboard.courses')}
                    </span>
                    <span className="text-[#676767] dark:text-gray-400">•</span>
                    <span className={cn(
                      "text-xs font-semibold text-[#3bafa8]",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {item.point.toFixed(2)}
                    </span>
                  </div>
                </div>
                {item.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(
            "text-center py-4 text-[#676767] dark:text-gray-400 text-sm",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>
            {t('dashboard.noLeaderboardData')}
          </div>
        )}
      </div>
    </>
  )

  return (
    <DashboardLayout showRightSidebar={true} rightSidebarContent={rightSidebarContent}>
      <div ref={containerRef} className="space-y-6">

        {/* Analytics Section */}
        <div className="flex gap-4 mb-6">
            {/* Grade Components Chart */}
            <Card className={cn(
              "flex-1 p-6",
              getNeoBrutalismStatCardClasses(neoBrutalismMode)
            )}>
              <h3 className={cn(
                "text-xl font-semibold text-black dark:text-white mb-4",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>{t('dashboard.gradeComponents')}</h3>
              {gradeChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[305px] w-full">
                  <BarChart data={gradeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-[#e5e7e7] dark:stroke-[#333]" />
                    <XAxis
                      dataKey="course"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: '#95969c', fontSize: 11, fontWeight: 600 }}
                      className="dark:[&>text]:fill-gray-400"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#85878d', fontSize: 12 }}
                      className="dark:[&>text]:fill-gray-400"
                      domain={[0, 10]}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="Final Grade" fill="#45a8a3" />
                    <Bar dataKey="Midterm" fill="#ff9053" />
                    <Bar dataKey="Quiz" fill="#db81aa" />
                    <Bar dataKey="Assignment" fill="#8b5cf6" />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className={cn(
                  "flex items-center justify-center h-[305px] text-[#676767] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('dashboard.noGradeData')}
                </div>
              )}
            </Card>

            {/* Performance */}
            <Card className={cn(
              "w-[288px] p-6 flex-shrink-0",
              getNeoBrutalismStatCardClasses(neoBrutalismMode)
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 bg-[#45a8a3]",
                    neoBrutalismMode ? "rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] border border-[#1a1a1a] dark:border-[#FFFBEB]" : "rounded"
                  )}></div>
                  <span className={cn(
                    "text-xs font-semibold text-[#42404c] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{t('dashboard.gpa')}</span>
                </div>
              </div>
              
              {/* Simple Circular Progress */}
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#eff1f3"
                      strokeWidth="10"
                      className="dark:stroke-[#333]"
                    />
                    {/* Progress circle - based on GPA (out of 10) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#45a8a3"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - gpaPercentage / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={cn(
                        "text-3xl font-bold text-black dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>{gpa}</div>
                      <div className={cn(
                        "text-xs text-[#83868e] dark:text-gray-400 mt-1",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('dashboard.outOf10')}</div>
                    </div>
                  </div>
                </div>
                
                {/* Course Count */}
                <div className="w-full text-center">
                  <span className={cn(
                    "text-sm text-[#83868e] dark:text-gray-400 font-medium",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>{t('dashboard.courses')}: </span>
                  <span className={cn(
                    "text-sm font-semibold text-black dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{statistics?.total_courses || 0}</span>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <p className={cn(
                  "text-lg text-[#83868e] dark:text-gray-400 font-medium",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('dashboard.yourPoint')}: <span className={cn(
                    "text-black dark:text-white font-bold text-xl",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{gpa}</span>
                </p>
                {statistics?.leaderboard_rank && statistics.leaderboard_rank > 0 && (
                  <div className={cn(
                    "flex items-center justify-center gap-1.5 text-[#3bafa8] text-xs font-medium",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>
                    <Trophy className="w-3 h-3" />
                    <span>{statistics.leaderboard_rank}{statistics.leaderboard_rank === 1 ? 'st' : statistics.leaderboard_rank === 2 ? 'nd' : statistics.leaderboard_rank === 3 ? 'rd' : 'th'} {t('dashboard.inLeaderboard')}</span>
                  </div>
                )}
              </div>
          </Card>
        </div>

        {/* Course Cards - Grid Layout 2 rows x 4 columns (fixed 8 cards) */}
        <div className="mb-6">
          {courses.length > 0 ? (
            <>
              <div className="grid grid-cols-4 gap-5 mb-4">
                {displayCourses.map((course, index) => {
                  if (!course) {
                    // Empty card placeholder
                    return (
                      <Card
                        key={`empty-${index}`}
                        className={cn(
                          neoBrutalismMode 
                            ? getNeoBrutalismCourseCardClasses(neoBrutalismMode, "h-[177px] relative overflow-hidden opacity-0 pointer-events-none")
                            : "bg-transparent dark:bg-transparent border-0 h-[177px] relative overflow-hidden pointer-events-none"
                        )}
                      >
                        <div className="p-4 h-full"></div>
                      </Card>
                    )
                  }
                  
                  const cardConfig = courseCardColors[index % courseCardColors.length]
                  return (
                    <Card
                      key={course.Course_ID}
                      className={cn(
                        neoBrutalismMode 
                          ? getNeoBrutalismCourseCardClasses(neoBrutalismMode, "h-[177px] relative overflow-hidden")
                          : `${cardConfig.color} dark:bg-[#2a2a2a] border-0 dark:border-[#333] h-[177px] relative overflow-hidden cursor-pointer hover:shadow-lg dark:hover:shadow-xl transition-shadow`,
                        !neoBrutalismMode && cardConfig.color
                      )}
                      onClick={() => handleCourseClick(course.Course_ID)}
                    >
                      <div className="p-4 h-full flex flex-col justify-between">
                        {/* Course ID in top right corner */}
                        <div className="flex justify-between items-start">
                          <div className={cn(
                            cardConfig.iconBg,
                            "dark:bg-[#1a1a1a] w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold",
                            cardConfig.iconColor,
                            "dark:text-white"
                          )}>
                            {cardConfig.icon}
                          </div>
                          <span className={cn(
                            "text-xs font-semibold text-[#1f1d39] dark:text-gray-300",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {course.Course_ID}
                          </span>
                        </div>
                        
                        {/* Course Name and Credits */}
                        <div className="flex-1 flex flex-col justify-end">
                          <h3 className="font-semibold text-[#1f1d39] dark:text-white text-base mb-1 line-clamp-2">
                            {course.Name}
                          </h3>
                          <p className="text-xs text-[#676767] dark:text-gray-400">
                            {t('dashboard.credits')}: {course.Credit}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={cn(
                      "px-4 py-2 flex items-center gap-2 transition-all",
                      neoBrutalismMode
                        ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] disabled:opacity-50 disabled:cursor-not-allowed hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,251,235,1)]"
                        : "bg-[#eff1f3] dark:bg-[#2a2a2a] rounded-lg hover:bg-[#e5e7e9] dark:hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed",
                      currentPage === 1 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4 text-[#424252] dark:text-gray-300" />
                    <span className={cn(
                      "text-sm font-semibold text-[#424252] dark:text-gray-300",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{t('common.previous')}</span>
                  </button>
                  
                  <span className={cn(
                    "text-sm font-semibold text-[#424252] dark:text-gray-300",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>
                    {t('common.page')} {currentPage} {t('common.of')} {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={cn(
                      "px-4 py-2 flex items-center gap-2 transition-all",
                      neoBrutalismMode
                        ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] disabled:opacity-50 disabled:cursor-not-allowed hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,251,235,1)]"
                        : "bg-[#eff1f3] dark:bg-[#2a2a2a] rounded-lg hover:bg-[#e5e7e9] dark:hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed",
                      currentPage === totalPages && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-semibold text-[#424252] dark:text-gray-300",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{t('common.next')}</span>
                    <ChevronRight className="w-4 h-4 text-[#424252] dark:text-gray-300" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={cn(
              "text-center py-8 text-[#676767] dark:text-gray-400",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
            )}>
              {t('dashboard.noCourses')}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
