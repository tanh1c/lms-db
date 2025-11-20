import type { Assessment } from '@/types'
import apiClient from './client'

export const gradeService = {
  async getGrades(userId: number): Promise<Assessment[]> {
    const response = await apiClient.get(`/grades/user/${userId}`)
    const data = response.data

    // Backend currently returns placeholder object instead of an array.
    // Normalize so callers always receive an array to prevent runtime errors.
    if (Array.isArray(data)) {
      return data
    }

    if (Array.isArray(data?.data)) {
      return data.data
    }

    return []
  },

  async getGradeByCourse(userId: number, courseId: string | number): Promise<Assessment[]> {
    const allGrades = await this.getGrades(userId)
    return allGrades.filter(g => g.Course_ID === courseId)
  },
}

