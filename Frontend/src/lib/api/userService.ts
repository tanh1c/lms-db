import type { User, UserRole } from '@/types'
import apiClient from './client'

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await apiClient.get('/users')
    return response.data
  },

  async getUserById(universityId: number): Promise<User | null> {
    try {
      const response = await apiClient.get(`/users/${universityId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async getUsersByRole(role: UserRole): Promise<User[]> {
    const response = await apiClient.get(`/users/role/${role}`)
    return response.data
  },

  async createUser(user: Omit<User, 'role'>): Promise<User> {
    const response = await apiClient.post('/users', user)
    return response.data
  },

  async updateUser(universityId: number, updates: Partial<Omit<User, 'University_ID' | 'role'>>): Promise<User> {
    const response = await apiClient.put(`/users/${universityId}`, updates)
    return response.data
  },

  async deleteUser(universityId: number): Promise<void> {
    await apiClient.delete(`/users/${universityId}`)
  },
}

