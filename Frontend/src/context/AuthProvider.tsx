import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  role: UserRole | null
  login: (user: User, role: UserRole) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, role, login, logout } = useAuthStore()

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

