import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { courseService } from '@/lib/api/courseService'
import { adminService, type Statistics } from '@/lib/api/adminService'
import { ROUTES } from '@/constants/routes'
import type { Course } from '@/types'
import { BookOpen, Users, Settings, BarChart3, ChevronDown, Edit2, ChevronLeft, ChevronRight, TrendingUp, Plus, FileText, AlertCircle, Zap, GraduationCap, UserCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart'
import { useNeoBrutalismMode, getNeoBrutalismCardClasses, getNeoBrutalismStatCardClasses, getNeoBrutalismTextClasses } from '@/lib/utils/theme-utils'
import { cn } from '@/lib/utils'
import '@/lib/animations/gsap-setup'

// Figma assets URLs
const imgProfilePicture = "https://www.figma.com/api/mcp/asset/3c99bdb9-fc77-4a11-92f6-351812a3d9bf"
const imgVerificationIcon = "https://www.figma.com/api/mcp/asset/757dafdc-d5a2-4914-af02-10eb336d23e4"

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [topStudents, setTopStudents] = useState<any[]>([])
  const [topTutors, setTopTutors] = useState<any[]>([])
  const [loadingTopPerformers, setLoadingTopPerformers] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
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
        const [coursesData, statsData] = await Promise.all([
          courseService.getCourses().catch((error) => {
            console.error('Error fetching courses:', error)
            return []
          }),
          adminService.getStatistics().catch((error) => {
            console.error('Error fetching statistics:', error)
            console.error('Error details:', error.response?.data || error.message)
            // Return null instead of default 0s to indicate error
            return null
          }),
        ])
        setCourses(coursesData || [])
        setStatistics(statsData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  useEffect(() => {
    const loadTopPerformers = async () => {
      if (!user) return
      
      try {
        setLoadingTopPerformers(true)
        const [studentsData, tutorsData] = await Promise.all([
          adminService.getTopStudents(3).catch((error) => {
            console.error('Error fetching top students:', error)
            return []
          }),
          adminService.getTopTutors(3).catch((error) => {
            console.error('Error fetching top tutors:', error)
            return []
          }),
        ])
        setTopStudents(studentsData || [])
        setTopTutors(tutorsData || [])
      } catch (error) {
        console.error('Error loading top performers:', error)
      } finally {
        setLoadingTopPerformers(false)
      }
    }

    loadTopPerformers()
  }, [user])

  // Use statistics if available, otherwise calculate from courses or show 0
  const totalUsers = statistics ? statistics.total_users : 0
  const totalCourses = statistics ? statistics.total_courses : (courses.length || 0)
  const totalStudents = statistics ? statistics.total_students : 0
  const totalTutors = statistics ? statistics.total_tutors : 0
  const totalAdmins = statistics ? statistics.total_admins : 0
  const completionRate = statistics 
    ? Math.round((statistics.completed_assignments / Math.max(statistics.total_assignments, 1)) * 100)
    : 0
  const systemStatus = t('dashboard.active')

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('common.loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  const handleCalendarNavigation = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    // Get the first week's days (may include previous month's days)
    const days: (number | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  const calendarDays = getCalendarDays()
  const today = new Date()
  const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()
  const todayDate = today.getDate()

  // Format month and year for display
  const monthYearString = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Chart data for system stats
  const chartData = [
    { month: 'Jan', Users: 420, Courses: 45 },
    { month: 'Feb', Users: 435, Courses: 47 },
    { month: 'Mar', Users: 450, Courses: 48 },
    { month: 'Apr', Users: 460, Courses: 50 },
    { month: 'May', Users: 464, Courses: 50 },
  ]

  // Chart config với dark mode support
  const chartConfig = {
    Users: {
      label: t('dashboard.chartUsers'),
      color: '#3bafa8',
    },
    Courses: {
      label: t('dashboard.chartCourses'),
      color: '#ff9053',
    },
  } satisfies ChartConfig


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
                  {user?.First_Name?.[0] || 'A'}
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
            {user?.First_Name} {user?.Last_Name || 'Admin'}
          </p>
          <p className={cn(
            "text-sm text-black dark:text-gray-300 font-medium",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>{t('dashboard.administrator')}</p>
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
            "text-sm font-semibold text-black dark:text-white capitalize",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
          )}>{monthYearString}</span>
          <ChevronRight 
            className="w-4 h-4 cursor-pointer text-[#676767] dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleCalendarNavigation('next')
            }}
          />
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div 
              key={i} 
              className={cn(
                "w-8 h-8 flex items-center justify-center text-[9.712px] text-center text-[#676767] dark:text-gray-400 font-medium",
                i === 1 ? 'text-[#d2edfd] dark:text-[#3bafa8]' : ''
              )}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="w-8 h-8" />
            }
            const isToday = isCurrentMonth && day === todayDate
            return (
              <div
                key={day}
                className={cn(
                  "w-8 h-8 flex items-center justify-center text-[10px] font-medium transition-all cursor-pointer",
                  neoBrutalismMode
                    ? isToday
                      ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-black dark:bg-white text-white dark:text-black shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,251,235,1)] rounded-none"
                      : "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#1a1a1a] text-[#676767] dark:text-gray-400 rounded-none hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                    : `rounded-full transition-colors ${
                        isToday
                          ? 'bg-black dark:bg-white text-white dark:text-black' 
                          : 'text-[#676767] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
                      }`
                )}
              >
                {day}
              </div>
            )
          })}
        </div>
      </Card>

    </>
  )

  return (
    <DashboardLayout showRightSidebar={true} rightSidebarContent={rightSidebarContent}>
      <div ref={containerRef} className="space-y-6">
        {/* Stats Cards */}
        <div className="flex gap-5 mb-6">
            <Card 
              className={cn(
                "flex-1 p-6 cursor-pointer transition-all",
                getNeoBrutalismStatCardClasses(neoBrutalismMode),
                !neoBrutalismMode && "hover:shadow-lg dark:hover:shadow-xl"
              )}
              onClick={() => navigate(ROUTES.USERS_MANAGEMENT)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#85878d] dark:text-gray-400 font-medium mb-1">{t('dashboard.totalUsers')}</p>
                  <p className={cn("text-3xl font-bold text-black dark:text-white", getNeoBrutalismTextClasses(neoBrutalismMode, 'bold'))}>{totalUsers}</p>
                  {statistics && (
                    <p className="text-xs text-[#85878d] dark:text-gray-400 mt-1">
                      {totalStudents} {t('admin.student')} • {totalTutors} {t('admin.tutor')} • {totalAdmins} {t('admin.admin')}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-[#e1e2f6] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </Card>

            <Card 
              className={cn(
                "flex-1 p-6 cursor-pointer transition-all",
                getNeoBrutalismStatCardClasses(neoBrutalismMode),
                !neoBrutalismMode && "hover:shadow-lg dark:hover:shadow-xl"
              )}
              onClick={() => navigate(ROUTES.ADMIN_COURSES)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#85878d] dark:text-gray-400 font-medium mb-1">{t('dashboard.totalCourses')}</p>
                  <p className={cn("text-3xl font-bold text-black dark:text-white", getNeoBrutalismTextClasses(neoBrutalismMode, 'bold'))}>{totalCourses}</p>
                </div>
                <div className="w-12 h-12 bg-[#f8efe2] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </Card>

            <Card 
              className={cn(
                "flex-1 p-6 cursor-pointer transition-all",
                getNeoBrutalismStatCardClasses(neoBrutalismMode),
                !neoBrutalismMode && "hover:shadow-lg dark:hover:shadow-xl"
              )}
              onClick={() => navigate(ROUTES.ADMIN_ASSIGNMENTS)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#85878d] dark:text-gray-400 font-medium mb-1">{t('dashboard.completionRate')}</p>
                  <p className={cn("text-3xl font-bold text-black dark:text-white", getNeoBrutalismTextClasses(neoBrutalismMode, 'bold'))}>{completionRate}%</p>
                  {statistics && (
                    <p className="text-xs text-[#85878d] dark:text-gray-400 mt-1">
                      {statistics.completed_assignments} / {statistics.total_assignments} {t('dashboard.completed')}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-[#eff7e2] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            <Card 
              className={cn(
                "flex-1 p-6 cursor-pointer transition-all",
                getNeoBrutalismStatCardClasses(neoBrutalismMode),
                !neoBrutalismMode && "hover:shadow-lg dark:hover:shadow-xl"
              )}
              onClick={() => {
                if (statistics && statistics.pending_assessments > 0) {
                  navigate(ROUTES.ADMIN_ASSIGNMENTS)
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#85878d] dark:text-gray-400 font-medium mb-1">
                    {statistics && statistics.pending_assessments > 0 ? t('dashboard.pendingAssessments') : t('dashboard.systemStatus')}
                  </p>
                  <p className={cn("text-3xl font-bold text-black dark:text-white", getNeoBrutalismTextClasses(neoBrutalismMode, 'bold'))}>
                    {statistics && statistics.pending_assessments > 0 ? statistics.pending_assessments : systemStatus}
                  </p>
                  {statistics && statistics.pending_assessments > 0 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {t('dashboard.requiresAttention')}
                    </p>
                  )}
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  statistics && statistics.pending_assessments > 0 
                    ? "bg-[#fef3e2] dark:bg-[#2a2a2a]" 
                    : "bg-[#e1e2f6] dark:bg-[#2a2a2a]"
                )}>
                  {statistics && statistics.pending_assessments > 0 ? (
                    <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  ) : (
                  <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
              </div>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-3 gap-5 mb-6">
          {/* Quick Actions */}
          <Card className={cn("col-span-1 p-6", getNeoBrutalismStatCardClasses(neoBrutalismMode))}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-[#3bafa8] dark:text-[#3bafa8]" />
              <h3 className={cn(
                "text-lg font-semibold text-black dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>{t('dashboard.quickActions')}</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate(ROUTES.ADMIN_COURSES)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 transition-all text-left",
                  neoBrutalismMode
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,251,235,1)]"
                    : "bg-[#f8f8f8] dark:bg-[#1a1a1a] rounded-lg hover:bg-[#e5e7e9] dark:hover:bg-[#2a2a2a] transition-colors"
                )}
              >
                <div className="w-10 h-10 bg-[#e1e2f6] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-semibold text-black dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{t('dashboard.quickActionCreateCourse')}</p>
                  <p className={cn(
                    "text-xs text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>{t('dashboard.quickActionCreateCourseDesc')}</p>
                </div>
              </button>

              <button
                onClick={() => navigate(ROUTES.USERS_MANAGEMENT)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 transition-all text-left",
                  neoBrutalismMode
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,251,235,1)]"
                    : "bg-[#f8f8f8] dark:bg-[#1a1a1a] rounded-lg hover:bg-[#e5e7e9] dark:hover:bg-[#2a2a2a] transition-colors"
                )}
              >
                <div className="w-10 h-10 bg-[#f8efe2] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-semibold text-black dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{t('dashboard.quickActionManageUsers')}</p>
                  <p className={cn(
                    "text-xs text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>{t('dashboard.quickActionManageUsersDesc')}</p>
                </div>
              </button>

              <button
                onClick={() => navigate(ROUTES.ADMIN_ASSIGNMENTS)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 transition-all text-left",
                  neoBrutalismMode 
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,251,235,1)]"
                    : "bg-[#f8f8f8] dark:bg-[#1a1a1a] rounded-lg hover:bg-[#e5e7e9] dark:hover:bg-[#2a2a2a] transition-colors"
                )}
              >
                <div className="w-10 h-10 bg-[#eff7e2] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-semibold text-black dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{t('dashboard.quickActionViewAssignments')}</p>
                  <p className={cn(
                    "text-xs text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>{t('dashboard.quickActionViewAssignmentsDesc')}</p>
                    </div>
              </button>
                  </div>
          </Card>

          {/* Top Performers */}
          <div className="col-span-2 grid grid-cols-2 gap-5">
            {/* Top Students */}
            <Card className={cn("p-4", getNeoBrutalismStatCardClasses(neoBrutalismMode))}>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className={cn(
                  "text-base font-semibold text-black dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>{t('admin.topStudents')}</h3>
              </div>
              {loadingTopPerformers ? (
                <div className="flex items-center justify-center py-8">
                  <div className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>{t('common.loading')}</div>
                </div>
              ) : topStudents.length > 0 ? (
                <div className="space-y-3">
                  {topStudents.map((student: any, index: number) => (
                    <div key={student.University_ID} className={cn(
                      "p-3 border rounded-lg",
                      neoBrutalismMode 
                        ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                        : "border-[#e5e7e7] dark:border-[#333]"
                    )}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-7 h-7 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0",
                          neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : "rounded-full"
                        )}>
                          <span className={cn(
                            "text-xs font-bold text-blue-600 dark:text-blue-400",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>#{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "text-sm font-semibold truncate",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {student.Last_Name} {student.First_Name}
                          </div>
                          <div className={cn(
                            "text-xs text-[#85878d] dark:text-gray-400 truncate",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                          )}>
                            ID: {student.University_ID}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={cn(
                  "text-center text-[#85878d] dark:text-gray-400 py-4",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>{t('admin.noData')}</p>
              )}
            </Card>

            {/* Top Tutors */}
            <Card className={cn("p-4", getNeoBrutalismStatCardClasses(neoBrutalismMode))}>
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className={cn(
                  "text-base font-semibold text-black dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>{t('admin.topTutors')}</h3>
              </div>
              {loadingTopPerformers ? (
                <div className="flex items-center justify-center py-8">
                  <div className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>{t('common.loading')}</div>
                </div>
              ) : topTutors.length > 0 ? (
                <div className="space-y-3">
                  {topTutors.map((tutor: any, index: number) => (
                    <div key={tutor.University_ID} className={cn(
                      "p-3 border rounded-lg",
                      neoBrutalismMode 
                        ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                        : "border-[#e5e7e7] dark:border-[#333]"
                    )}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-7 h-7 bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0",
                          neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : "rounded-full"
                        )}>
                          <span className={cn(
                            "text-xs font-bold text-green-600 dark:text-green-400",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>#{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "text-sm font-semibold truncate",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {tutor.Last_Name} {tutor.First_Name}
                          </div>
                          <div className={cn(
                            "text-xs text-[#85878d] dark:text-gray-400 truncate",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                          )}>
                            ID: {tutor.University_ID}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={cn(
                  "text-center text-[#85878d] dark:text-gray-400 py-4",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>{t('admin.noData')}</p>
              )}
            </Card>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="flex gap-4 mb-6">
            {/* System Growth Chart */}
            <Card className={cn("flex-1 p-6", getNeoBrutalismStatCardClasses(neoBrutalismMode))}>
              <h3 className={cn(
                "text-xl font-semibold text-black dark:text-white mb-4",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>{t('dashboard.systemGrowth')}</h3>
              <ChartContainer config={chartConfig} className="h-[305px] w-full">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-[#e5e7e7] dark:stroke-[#333]" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tick={{ fill: '#95969c', fontSize: 12, fontWeight: 600 }}
                    className="dark:[&>text]:fill-gray-400"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#85878d', fontSize: 12 }}
                    className="dark:[&>text]:fill-gray-400"
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="Users" stackId="a" fill="var(--color-Users)">
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-users-${index}`} 
                        radius={entry.Courses === 0 ? 10 : ([0, 0, 10, 10] as any)} 
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="Courses" stackId="a" fill="var(--color-Courses)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </Card>

            {/* System Performance */}
            <Card className={cn("w-[288px] p-6 flex-shrink-0", getNeoBrutalismStatCardClasses(neoBrutalismMode))}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 bg-[#45a8a3]",
                    neoBrutalismMode ? "rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] border border-[#1a1a1a] dark:border-[#FFFBEB]" : "rounded"
                  )}></div>
                  <span className={cn(
                    "text-xs font-semibold text-[#42404c] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{t('dashboard.performance')}</span>
                </div>
                <div className={cn(
                  "bg-[#eff1f3] dark:bg-[#2a2a2a] px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all",
                  neoBrutalismMode
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,251,235,1)]"
                    : "rounded hover:bg-[#e5e7e9] dark:hover:bg-[#333] transition-colors"
                )}>
                  <span className={cn(
                    "text-xs font-semibold text-[#424252] dark:text-gray-300",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{t('dashboard.monthly')}</span>
                  <ChevronDown className="w-3 h-3 text-[#424252] dark:text-gray-300" />
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#eff1f3"
                      strokeWidth="10"
                      className="dark:stroke-[#333]"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#45a8a3"
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 50 * (completionRate / 100)} ${2 * Math.PI * 50}`}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - completionRate / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={cn(
                        "text-3xl font-bold text-black dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>{completionRate}%</div>
                      <div className={cn(
                        "text-xs text-[#83868e] dark:text-gray-400 mt-1",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('dashboard.completion')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-sm text-[#83868e] dark:text-gray-400 font-medium",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>{t('dashboard.progress')}</span>
                    <span className={cn(
                      "text-sm font-semibold text-black dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{completionRate}%</span>
                  </div>
                  <div className={cn(
                    "w-full h-2 bg-[#eff1f3] dark:bg-[#333] overflow-hidden",
                    neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : "rounded-full"
                  )}>
                    <div 
                      className={cn(
                        "h-full bg-gradient-to-r from-[#45a8a3] to-[#3bafa8] transition-all duration-500",
                        neoBrutalismMode ? "rounded-none" : "rounded-full"
                      )}
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <p className={cn(
                  "text-lg text-[#83868e] dark:text-gray-400 font-medium",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('dashboard.usersLabel')}: <span className={cn(
                    "text-black dark:text-white font-bold text-xl",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{totalUsers}</span>
                </p>
                <div className={cn(
                  "flex items-center justify-center gap-1.5 text-[#3bafa8] text-xs font-medium",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  <TrendingUp className="w-3 h-3" />
                  <span>{t('dashboard.systemStatus')}: {t('dashboard.active')}</span>
                </div>
              </div>
            </Card>
          </div>
      </div>
    </DashboardLayout>
  )
}
