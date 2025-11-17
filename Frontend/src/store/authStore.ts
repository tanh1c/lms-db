import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  role: UserRole | null
  login: (user: User, role: UserRole) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      role: null,
      login: (user: User, role: UserRole) =>
        set({
          user,
          isAuthenticated: true,
          role,
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          role: null,
        }),
    }),
    {
      name: 'lms-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

