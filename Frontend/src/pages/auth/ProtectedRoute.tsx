import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import { ROUTES } from '@/constants/routes'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === 'student') {
      return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />
    } else if (role === 'tutor') {
      return <Navigate to={ROUTES.TUTOR_DASHBOARD} replace />
    } else if (role === 'admin') {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />
    }
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <>{children}</>
}

