import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  role: UserRole | null
  token: string | null
  rememberMe: boolean
  login: (user: User, role: UserRole, token: string, rememberMe?: boolean) => void
  logout: () => void
  setToken: (token: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      role: null,
      token: null,
      rememberMe: false,
      login: (user: User, role: UserRole, token: string, rememberMe: boolean = false) => {
        // Store token in localStorage
        if (rememberMe) {
          localStorage.setItem('auth_token', token)
        } else {
          sessionStorage.setItem('auth_token', token)
        }
        set({
          user,
          isAuthenticated: true,
          role,
          token,
          rememberMe,
        })
      },
      logout: () => {
        // Clear tokens
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth_token')
        set({
          user: null,
          isAuthenticated: false,
          role: null,
          token: null,
          rememberMe: false,
        })
      },
      setToken: (token: string | null) => {
        set({ token })
        if (token) {
          const rememberMe = localStorage.getItem('auth_token') !== null
          if (rememberMe) {
            localStorage.setItem('auth_token', token)
          } else {
            sessionStorage.setItem('auth_token', token)
          }
        }
      },
    }),
    {
      name: 'lms-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

