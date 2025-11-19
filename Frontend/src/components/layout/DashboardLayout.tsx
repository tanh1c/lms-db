import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/themeStore'
import { useNeoBrutalismMode, getNeoBrutalismTextClasses } from '@/lib/utils/theme-utils'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  BarChart3,
  Calendar,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  showRightSidebar?: boolean
  rightSidebarContent?: ReactNode
}

export default function DashboardLayout({ 
  children, 
  title,
  subtitle,
  showRightSidebar = false,
  rightSidebarContent
}: DashboardLayoutProps) {
  const { role, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useThemeStore()
  const neoBrutalismMode = useNeoBrutalismMode()

  const isActiveRoute = (path: string) => {
    // Special handling for admin users route
    if (path === '/admin/users') {
      return location.pathname.includes('/admin/users')
    }
    // For other routes, check exact match or if pathname starts with the route
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  const getNavItems = () => {
    switch (role) {
      case 'student':
        return [
          { title: 'Dashboard', href: ROUTES.STUDENT_DASHBOARD, icon: LayoutDashboard },
          { title: 'Courses', href: ROUTES.COURSES, icon: BookOpen },
          { title: 'Assignments', href: ROUTES.ASSIGNMENTS, icon: FileText },
          { title: 'Quizzes', href: ROUTES.QUIZZES, icon: HelpCircle },
          { title: 'Grades', href: ROUTES.GRADES, icon: BarChart3 },
          { title: 'Schedule', href: ROUTES.SCHEDULE, icon: Calendar },
          { title: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
        ]
      case 'tutor':
        return [
          { title: 'Dashboard', href: ROUTES.TUTOR_DASHBOARD, icon: LayoutDashboard },
          { title: 'My Courses', href: ROUTES.COURSES, icon: BookOpen },
          { title: 'Grading', href: ROUTES.ASSIGNMENTS, icon: FileText },
          { title: 'Schedule', href: ROUTES.SCHEDULE, icon: Calendar },
          { title: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
        ]
      case 'admin':
        return [
          { title: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
          { title: 'Users', href: ROUTES.USERS_MANAGEMENT, icon: Users },
          { title: 'Courses', href: ROUTES.ADMIN_COURSES, icon: BookOpen },
          { title: 'Assignments', href: ROUTES.ADMIN_ASSIGNMENTS, icon: FileText },
          { title: 'Quizzes', href: ROUTES.ADMIN_QUIZZES, icon: HelpCircle },
          { title: 'Assessments', href: ROUTES.ADMIN_ASSESSMENTS, icon: BarChart3 },
          { title: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()
  const mainNavItem = navItems[0]
  const subNavItems = navItems.slice(1)

  return (
    <div className={cn(
      "min-h-screen",
      neoBrutalismMode ? "bg-[#FFFBEB] dark:bg-[#1a1a1a]" : "bg-white dark:bg-[#0f0f0f]"
    )}>
      <div className="flex">
        {/* Left Sidebar */}
        <aside className={cn(
          "w-[280px] min-h-screen p-8 flex-shrink-0",
          neoBrutalismMode
            ? "bg-white dark:bg-[#2a2a2a] border-r-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_0px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_0px_0px_0px_rgba(255,251,235,1)]"
            : "bg-[#f5f7f9] dark:bg-[#1a1a1a] rounded-bl-[30px] rounded-tl-[30px]"
        )}>
          {/* Logo */}
          <div className={cn(
            "flex items-center gap-3 mb-16",
            neoBrutalismMode && "pb-4 border-b-4 border-[#1a1a1a] dark:border-[#FFFBEB]"
          )}>
            <div className={cn(
              "p-2",
              neoBrutalismMode && "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#1a1a1a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
            )}>
              <img 
                src="/HCMCUT.png" 
                alt="HCMUT Logo" 
                className="w-[41px] h-[41px] object-contain"
              />
            </div>
            <span className={cn(
              "text-[27.532px] font-semibold text-black dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
            )}>LMS</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-8">
            {/* Main Nav Item */}
            {mainNavItem && (
              <Link
                to={mainNavItem.href}
                className={cn(
                  "px-4 py-3 flex items-center gap-3 transition-all",
                  neoBrutalismMode
                    ? isActiveRoute(mainNavItem.href)
                      ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-black dark:bg-white text-white dark:text-black rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                      : "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] text-[#131123] dark:text-gray-300 rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                    : cn(
                        "rounded-[11px] transition-colors",
                        isActiveRoute(mainNavItem.href)
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "bg-transparent text-[#131123] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                      )
                )}
              >
                <mainNavItem.icon className="w-8 h-8" />
                <span className={cn(
                  "font-medium text-base",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>{mainNavItem.title}</span>
              </Link>
            )}

            {/* Sub Nav Items */}
            {subNavItems.length > 0 && (
              <div className={cn(
                "space-y-8",
                neoBrutalismMode ? "pl-0" : "pl-4"
              )}>
                {subNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = isActiveRoute(item.href)
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "px-4 py-3 flex items-center gap-3 transition-all",
                        neoBrutalismMode
                          ? isActive
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-black dark:bg-white text-white dark:text-black rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                            : "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] text-[#131123] dark:text-gray-300 rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                          : cn(
                              "rounded-[11px] transition-colors",
                              isActive
                                ? "bg-black dark:bg-white text-white dark:text-black"
                                : "bg-transparent text-[#131123] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                            )
                      )}
                    >
                      <Icon className="w-6 h-6" />
                      <span className={cn(
                        "font-medium text-base",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <div className={cn(
              "pt-8 mt-8",
              neoBrutalismMode
                ? "border-t-4 border-[#1a1a1a] dark:border-[#FFFBEB]"
                : "border-t border-gray-200 dark:border-[#333]"
            )}>
              <button
                onClick={toggleDarkMode}
                className={cn(
                  "w-full px-4 py-3 flex items-center gap-3 transition-all text-[#131123] dark:text-gray-300",
                  neoBrutalismMode
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                    : "rounded-[11px] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                )}
              >
                {darkMode ? (
                  <>
                    <Sun className="w-6 h-6" />
                    <span className={cn(
                      "font-medium text-base",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-6 h-6" />
                    <span className={cn(
                      "font-medium text-base",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* Logout Button */}
            <div className="pt-4">
              <button
                onClick={handleLogout}
                className={cn(
                  "w-full px-4 py-3 flex items-center gap-3 transition-all text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300",
                  neoBrutalismMode
                    ? "border-4 border-red-600 dark:border-red-400 bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:shadow-[4px_4px_0px_0px_rgba(248,113,113,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(248,113,113,1)]"
                    : "rounded-[11px] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                )}
              >
                <LogOut className="w-6 h-6" />
                <span className={cn(
                  "font-medium text-base",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 min-w-0">
          {(title || subtitle) && (
            <div className="mb-8">
              {title && (
                <h1 className={cn(
                  "text-2xl font-semibold text-[#211c37] dark:text-white mb-2",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className={cn(
                  "text-[#85878d] dark:text-gray-400 text-sm font-medium",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </main>

        {/* Right Sidebar - Optional */}
        {showRightSidebar && rightSidebarContent && (
          <aside className={cn(
            "w-[280px] p-6 flex-shrink-0",
            neoBrutalismMode
              ? "bg-white dark:bg-[#2a2a2a] border-l-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[-8px_0px_0px_0px_rgba(26,26,26,1)] dark:shadow-[-8px_0px_0px_0px_rgba(255,251,235,1)]"
              : "bg-white dark:bg-[#1a1a1a] border-l border-[#e7eae9] dark:border-[#333]"
          )}>
            {rightSidebarContent}
          </aside>
        )}
      </div>
    </div>
  )
}

