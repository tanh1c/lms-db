import type { Assessment } from '@/types'
import apiClient from './client'

export const gradeService = {
  async getGrades(userId: number): Promise<Assessment[]> {
    const response = await apiClient.get(`/grades/user/${userId}`)
    return response.data
  },

  async getGradeByCourse(userId: number, courseId: string | number): Promise<Assessment[]> {
    const allGrades = await this.getGrades(userId)
    return allGrades.filter(g => g.Course_ID === courseId)
  },
}

