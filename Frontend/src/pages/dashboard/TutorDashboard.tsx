import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { courseService } from '@/lib/api/courseService'
import { assignmentService } from '@/lib/api/assignmentService'
import { ROUTES } from '@/constants/routes'
import type { Course, Assignment } from '@/types'
import { Search, Bell, BookOpen, Users, FileCheck, ChevronDown, Check, Edit2, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart'
import { useNeoBrutalismMode, getNeoBrutalismCardClasses, getNeoBrutalismInputClasses, getNeoBrutalismStatCardClasses, getNeoBrutalismCourseCardClasses, getNeoBrutalismTextClasses } from '@/lib/utils/theme-utils'
import { cn } from '@/lib/utils'
import '@/lib/animations/gsap-setup'

// Figma assets URLs
const imgProfilePicture = "https://www.figma.com/api/mcp/asset/3c99bdb9-fc77-4a11-92f6-351812a3d9bf"
const imgVerificationIcon = "https://www.figma.com/api/mcp/asset/757dafdc-d5a2-4914-af02-10eb336d23e4"

export default function TutorDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
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
        const [coursesData, assignmentsData] = await Promise.all([
          courseService.getCourses(),
          assignmentService.getAssignments(user.University_ID),
        ])
        
        setCourses(coursesData)
        setAssignments(assignmentsData)
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

  const pendingGrading = assignments.length // Mock: Count all assignments as pending grading
  const totalStudents = 120 // Mock data
  const totalCourses = courses.length

  // Mock course cards data
  const cardConfigs = [
    { 
      color: 'bg-[#e1e2f6]', 
      iconBg: 'bg-[#fcf9ff]', 
      icon: '< >',
      iconColor: 'text-purple-600'
    },
    { 
      color: 'bg-[#f8efe2]', 
      iconBg: 'bg-[#faf5ec]', 
      icon: '↑',
      iconColor: 'text-orange-600'
    },
    { 
      color: 'bg-[#eff7e2]', 
      iconBg: 'bg-[#f6fbee]', 
      icon: '~',
      iconColor: 'text-green-600'
    },
  ]

  const fallbackCourses = [
    { title: 'Web Development', courseId: 1 },
    { title: 'Database Systems', courseId: 2 },
    { title: 'Software Engineering', courseId: 3 },
  ]

  const courseCards = courses.length > 0
    ? courses.slice(0, 3).map((course, index) => ({
        ...cardConfigs[index] || cardConfigs[0],
        title: course.Name,
        courseId: course.Course_ID,
      }))
    : fallbackCourses.map((course, index) => ({
        ...cardConfigs[index] || cardConfigs[0],
        ...course,
      }))

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`${ROUTES.COURSES}?search=${encodeURIComponent(searchQuery)}`)
    } else {
      navigate(ROUTES.COURSES)
    }
  }

  const handleCourseClick = (courseId: number) => {
    navigate(ROUTES.COURSE_DETAIL.replace(':courseId', courseId.toString()))
  }

  const handleTodoClick = (_todo: typeof todos[0]) => {
    navigate(ROUTES.ASSIGNMENTS)
  }

  const handleCalendarNavigation = (_direction: 'prev' | 'next') => {
    navigate(ROUTES.SCHEDULE)
  }

  // Chart data for grading activity
  const chartData = [
    { month: 'Jan', Graded: 45, Pending: 12 },
    { month: 'Feb', Graded: 52, Pending: 8 },
    { month: 'Mar', Graded: 38, Pending: 15 },
    { month: 'Apr', Graded: 61, Pending: 5 },
    { month: 'May', Graded: 48, Pending: 10 },
  ]

  // Chart config với dark mode support
  const chartConfig = {
    Graded: {
      label: t('dashboard.chartGraded'),
      color: '#3bafa8',
    },
    Pending: {
      label: t('dashboard.chartPending'),
      color: '#ff9053',
    },
  } satisfies ChartConfig

  // Calendar days
  const calendarDays = [24, 25, 26, 27, 28, 29, 30]

  // Mock todo list for tutor
  const todos = [
    { id: 1, text: t('dashboard.todoGradeAssignment'), category: t('dashboard.todoGrading'), time: '09:00 AM', checked: false },
    { id: 2, text: t('dashboard.todoReviewQuizSubmissions'), category: t('dashboard.todoGrading'), time: '10:30 AM', checked: false },
    { id: 3, text: t('dashboard.todoPrepareLectureMaterials'), category: t('dashboard.todoTeaching'), time: '02:00 PM', checked: false },
    { id: 4, text: t('dashboard.todoStudentConsultation'), category: t('dashboard.todoMeeting'), time: '03:30 PM', checked: false },
    { id: 5, text: t('dashboard.todoUpdateCourseSyllabus'), category: t('dashboard.todoAdmin'), time: '04:50 PM', checked: true },
  ]

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
                  {user?.First_Name?.[0] || 'T'}
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
            {user?.First_Name} {user?.Last_Name || 'Tutor'}
          </p>
          <p className={cn(
            "text-sm text-black dark:text-gray-300 font-medium",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>{t('dashboard.instructor')}</p>
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
          )}>{t('dashboard.december2021')}</span>
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
                  ? day === 25
                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-black dark:bg-white text-white dark:text-black shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,251,235,1)] rounded-none"
                    : "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#1a1a1a] text-[#676767] dark:text-gray-400 rounded-none hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                  : `rounded-full transition-colors ${
                      day === 25 
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

      {/* To Do List */}
      <div>
        <h3 className={cn(
          "text-lg font-semibold text-black dark:text-white text-center mb-4",
          getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
        )}>{t('dashboard.tasks')}</h3>
        <div className="space-y-3">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={cn(
                "flex gap-3 items-start cursor-pointer p-2 transition-all",
                neoBrutalismMode
                  ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                  : "hover:bg-gray-50 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
              )}
              onClick={() => handleTodoClick(todo)}
            >
              <div
                className={cn(
                  "w-[18px] h-[18px] border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all",
                  neoBrutalismMode
                    ? todo.checked
                      ? "border-[#1a1a1a] dark:border-[#FFFBEB] bg-[#3bafa8] dark:bg-[#3bafa8] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                      : "border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#1a1a1a] rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    : `rounded transition-colors ${
                        todo.checked
                          ? 'bg-[#3bafa8] border-[#3bafa8]'
                          : 'border-[#676767] dark:border-gray-500 hover:border-[#3bafa8]'
                      }`
                )}
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                {todo.checked && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold text-[#42404c] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold'),
                    todo.checked && 'line-through'
                  )}
                >
                  {todo.text}
                </p>
                {todo.category && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-sm text-[#676767] dark:text-gray-400 font-medium",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>{todo.category}</span>
                    <span className="text-[#676767] dark:text-gray-400">•</span>
                    <span className={cn(
                      "text-sm font-semibold text-[#fe764b]",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{todo.time}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <DashboardLayout showRightSidebar={true} rightSidebarContent={rightSidebarContent}>
      <div ref={containerRef} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className={cn(
                "text-2xl font-semibold text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                  {t('dashboard.hello')} {user?.First_Name || 'Tutor'} 👋
              </h1>
            </div>
            <p className={cn(
              "text-[#85878d] dark:text-gray-400 text-sm font-medium",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
            )}>{t('dashboard.overview')}</p>
          </div>
          <div className="flex items-center gap-5">
            <form onSubmit={handleSearch} className="relative">
              <Input
                placeholder={t('dashboard.searchPlaceholder')}
                className={cn(
                  "w-[322px] pl-4 pr-10 h-12 text-[#211c37] dark:text-white",
                  getNeoBrutalismInputClasses(neoBrutalismMode)
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                <Search className="w-6 h-6 text-[#85878d] dark:text-gray-400" />
              </button>
            </form>
            <div className="relative">
              <Link
                to={ROUTES.ASSIGNMENTS}
                className={cn(
                  "w-12 h-12 flex items-center justify-center cursor-pointer transition-all",
                  neoBrutalismMode
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                    : "border border-[#e7eae9] dark:border-[#333] bg-white dark:bg-[#1a1a1a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                )}
              >
                <Bell className="w-6 h-6 text-[#85878d] dark:text-gray-400" />
              </Link>
              {pendingGrading > 0 && (
                <div className={cn(
                  "absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-[#1a1a1a]",
                  neoBrutalismMode ? "rounded-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]" : "rounded-full"
                )}></div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-5 mb-6">
          <Card className={cn("flex-1 p-6", getNeoBrutalismStatCardClasses(neoBrutalismMode))}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#85878d] dark:text-gray-400 font-medium mb-1">{t('dashboard.totalCourses')}</p>
                <p className={cn("text-3xl font-bold text-black dark:text-white", getNeoBrutalismTextClasses(neoBrutalismMode, 'bold'))}>{totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-[#e1e2f6] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className={cn("flex-1 p-6", getNeoBrutalismStatCardClasses(neoBrutalismMode))}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#85878d] dark:text-gray-400 font-medium mb-1">{t('dashboard.totalStudents')}</p>
                <p className={cn("text-3xl font-bold text-black dark:text-white", getNeoBrutalismTextClasses(neoBrutalismMode, 'bold'))}>{totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-[#f8efe2] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className={cn("flex-1 p-6", getNeoBrutalismStatCardClasses(neoBrutalismMode))}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#85878d] dark:text-gray-400 font-medium mb-1">{t('dashboard.pendingGrading')}</p>
                <p className="text-3xl font-bold text-black dark:text-white">{pendingGrading}</p>
              </div>
              <div className="w-12 h-12 bg-[#eff7e2] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Course Cards */}
        <div className="flex gap-5 mb-6">
          {courseCards.map((course, index) => (
            <Card
              key={index}
              className={cn(
                neoBrutalismMode 
                  ? getNeoBrutalismCourseCardClasses(neoBrutalismMode, "h-[177px] relative overflow-hidden flex-shrink-0 w-[240px]")
                  : `${course.color} dark:bg-[#2a2a2a] border-0 dark:border-[#333] h-[177px] relative overflow-hidden flex-shrink-0 w-[240px] cursor-pointer hover:shadow-lg dark:hover:shadow-xl transition-shadow`,
                !neoBrutalismMode && course.color
              )}
              onClick={() => handleCourseClick(course.courseId)}
            >
              <div className="p-4 h-full flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  <div className={`${course.iconBg} dark:bg-[#1a1a1a] w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold ${course.iconColor} dark:text-white`}>
                    {course.icon}
                  </div>
                  <h3 className="font-semibold text-[#1f1d39] dark:text-white text-base">{course.title}</h3>
                </div>
                <div className={`${course.iconBg} dark:bg-[#1a1a1a] rounded-[11px] px-6 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#1f1d39] dark:text-gray-300" />
                    <span className="text-[10px] font-semibold text-[#1f1d39] dark:text-gray-300">24</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300 dark:bg-[#444]"></div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#1f1d39] dark:text-gray-300" />
                    <span className="text-[10px] font-semibold text-[#1f1d39] dark:text-gray-300">8</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300 dark:bg-[#444]"></div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#1f1d39] dark:text-gray-300" />
                    <span className="text-[10px] font-semibold text-[#1f1d39] dark:text-gray-300">5</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="flex gap-4 mb-6">
          {/* Grading Activity Chart */}
          <Card className={cn("flex-1 p-6", getNeoBrutalismStatCardClasses(neoBrutalismMode))}>
            <h3 className={cn(
              "text-xl font-semibold text-black dark:text-white mb-4",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
            )}>{t('dashboard.gradingActivity')}</h3>
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
                  <Bar dataKey="Graded" stackId="a" fill="var(--color-Graded)">
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-graded-${index}`} 
                        {...(entry.Pending === 0 ? { radius: 10 } : { radius: [0, 0, 10, 10] as any })} 
                      />
                    ))}
                  </Bar>
                <Bar dataKey="Pending" stackId="a" fill="var(--color-Pending)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </Card>

          {/* Performance Summary */}
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
                    strokeDasharray={`${2 * Math.PI * 50 * 0.85} ${2 * Math.PI * 50}`}
                    strokeDashoffset={2 * Math.PI * 50 * 0.15}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={cn(
                      "text-3xl font-bold text-black dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>85%</div>
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
                  )}>85%</span>
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
                    style={{ width: '85%' }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className={cn(
                "text-lg text-[#83868e] dark:text-gray-400 font-medium",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('dashboard.courses')}: <span className={cn(
                  "text-black dark:text-white font-bold text-xl",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>{totalCourses}</span>
              </p>
              <div className={cn(
                "flex items-center justify-center gap-1.5 text-[#3bafa8] text-xs font-medium",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
              )}>
                <TrendingUp className="w-3 h-3" />
                <span>{t('dashboard.activeTeaching')}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
