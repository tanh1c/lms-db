import type { User, UserRole } from '@/types'
import apiClient from './client'

interface LoginResult {
  success: boolean
  user?: User
  role?: UserRole
  error?: string
}

export const authService = {
  async login(universityId: string, password: string): Promise<LoginResult> {
    try {
      const response = await apiClient.post('/auth/login', {
        universityId,
        password,
      })
      return response.data
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Đã xảy ra lỗi khi đăng nhập',
      }
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  async getCurrentUser(universityId: string): Promise<User | null> {
    try {
      const response = await apiClient.get('/auth/me', {
        params: { universityId },
      })
      return response.data.user || null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },
}

