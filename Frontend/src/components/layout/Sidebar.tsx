import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthProvider'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  BarChart3,
  Calendar,
  Users,
  Settings,
} from 'lucide-react'

interface NavItem {
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const studentNavItems: NavItem[] = [
  { titleKey: 'sidebar.dashboard', href: ROUTES.STUDENT_DASHBOARD, icon: LayoutDashboard },
  { titleKey: 'sidebar.courses', href: ROUTES.COURSES, icon: BookOpen },
  { titleKey: 'sidebar.assignments', href: ROUTES.ASSIGNMENTS, icon: FileText },
  { titleKey: 'sidebar.quizzes', href: ROUTES.QUIZZES, icon: HelpCircle },
  { titleKey: 'sidebar.grades', href: ROUTES.GRADES, icon: BarChart3 },
  { titleKey: 'sidebar.schedule', href: ROUTES.SCHEDULE, icon: Calendar },
]

const tutorNavItems: NavItem[] = [
  { titleKey: 'sidebar.dashboard', href: ROUTES.TUTOR_DASHBOARD, icon: LayoutDashboard },
  { titleKey: 'sidebar.myCourses', href: ROUTES.COURSES, icon: BookOpen },
  { titleKey: 'sidebar.schedule', href: ROUTES.SCHEDULE, icon: Calendar },
]

const adminNavItems: NavItem[] = [
  { titleKey: 'sidebar.dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
  { titleKey: 'sidebar.users', href: ROUTES.USERS_MANAGEMENT, icon: Users },
  { titleKey: 'sidebar.courses', href: ROUTES.ADMIN_COURSES, icon: BookOpen },
  { titleKey: 'sidebar.assignments', href: ROUTES.ADMIN_ASSIGNMENTS, icon: FileText },
  { titleKey: 'sidebar.quizzes', href: ROUTES.ADMIN_QUIZZES, icon: HelpCircle },
  { titleKey: 'sidebar.settings', href: ROUTES.SETTINGS, icon: Settings },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const location = useLocation()

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'student':
        return studentNavItems
      case 'tutor':
        return tutorNavItems
      case 'admin':
        return adminNavItems
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <>
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
        <div className="flex-1 flex flex-col min-h-0 border-r bg-background">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {t(item.titleKey)}
                </Link>
              )
            })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  )
}

