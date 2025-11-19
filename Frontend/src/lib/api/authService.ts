import type { User, UserRole } from '@/types'
import apiClient from './client'
import { mockUsers } from '@/data/mock/users'

interface LoginResult {
  success: boolean
  user?: User
  role?: UserRole
  error?: string
}

// Helper function to determine role from University_ID
function getUserRole(universityId: number): UserRole {
  if (universityId >= 100000 && universityId < 200000) {
    return 'student'
  } else if (universityId >= 200000 && universityId < 3000000) {
    return 'tutor'
  } else if (universityId >= 3000000) {
    return 'admin'
  }
  return 'student'
}

// Fallback login using mock data
function fallbackLogin(universityId: string): LoginResult {
  const id = parseInt(universityId, 10)
  
  // Check if it's one of the default IDs
  const defaultIds = [100001, 200001, 3000001]
  if (!defaultIds.includes(id)) {
    // Try to find in mockUsers
    const mockUser = mockUsers.find(u => u.University_ID === id)
    if (!mockUser) {
      return {
        success: false,
        error: 'Mã số sinh viên/giảng viên không tồn tại',
      }
    }
    
    return {
      success: true,
      user: mockUser,
      role: getUserRole(id),
    }
  }
  
  // Default users
  const defaultUsers: Record<number, User> = {
    100001: {
      University_ID: 100001,
      First_Name: 'Huy-chan',
      Last_Name: 'Phan Tien',
      Email: 'xoai.non@hcmut.edu.vn',
      Phone_Number: '0999999999',
      Address: '497 Hoa Hao, District 10, HCMC',
      National_ID: '079200000000',
    },
    200001: {
      University_ID: 200001,
      First_Name: 'David',
      Last_Name: 'Wilson',
      Email: 'david.wilson@hcmut.edu.vn',
      Phone_Number: '8405555555',
      Address: '789 Le Hong Phong, District 5, HCMC',
      National_ID: '079555555555',
    },
    3000001: {
      University_ID: 3000001,
      First_Name: 'Admin',
      Last_Name: 'User',
      Email: 'admin@hcmut.edu.vn',
      Phone_Number: '0900000001',
      Address: 'HCMC',
      National_ID: '079000000001',
    },
  }
  
  const user = defaultUsers[id]
  if (!user) {
    return {
      success: false,
      error: 'Mã số không hợp lệ',
    }
  }
  
  return {
    success: true,
    user,
    role: getUserRole(id),
  }
}

export const authService = {
  async login(universityId: string, password: string): Promise<LoginResult> {
    try {
      const response = await apiClient.post('/auth/login', {
        universityId: parseInt(universityId, 10),
        password,
      })
      
      // Backend returns: { success: true, user: {...}, role: 'student'|'tutor'|'admin' }
      if (response.data.success && response.data.user && response.data.role) {
        return {
          success: true,
          user: response.data.user,
          role: response.data.role,
        }
      }
      
      return {
        success: false,
        error: response.data.error || 'Đăng nhập thất bại',
      }
    } catch (error: any) {
      // Check if it's a network error or backend unavailable
      const isNetworkError = 
        !error.response || 
        error.code === 'ECONNABORTED' || 
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('timeout')
      
      if (isNetworkError) {
        console.warn('Backend unavailable, using fallback login')
        // Fallback to mock data
        return fallbackLogin(universityId)
      }
      
      // Other API errors
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập',
      }
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, clear local storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  },

  async getCurrentUser(universityId: string): Promise<User | null> {
    try {
      const response = await apiClient.get('/auth/me', {
        params: { universityId },
      })
      return response.data.user || null
    } catch (error: any) {
      // Check if it's a network error
      const isNetworkError = 
        !error.response || 
        error.code === 'ECONNABORTED' || 
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error')
      
      if (isNetworkError) {
        console.warn('Backend unavailable, using fallback user data')
        // Fallback to mock data
        const id = parseInt(universityId, 10)
        const mockUser = mockUsers.find(u => u.University_ID === id)
        return mockUser || null
      }
      
      console.error('Get current user error:', error)
      return null
    }
  },
}

