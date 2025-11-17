import type { Quiz } from '@/types'
import apiClient from './client'

export const quizService = {
  async getQuizzes(userId: number): Promise<Quiz[]> {
    const response = await apiClient.get(`/quizzes/user/${userId}`)
    return response.data
  },

  async getQuizById(quizId: number): Promise<Quiz | null> {
    try {
      const response = await apiClient.get(`/quizzes/${quizId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async getQuizzesByCourse(userId: number, courseId: string | number): Promise<Quiz[]> {
    const allQuizzes = await this.getQuizzes(userId)
    return allQuizzes.filter(q => q.Course_ID === courseId)
  },

  async submitQuiz(
    quizId: number,
    _answers: Record<string, string>
  ): Promise<{ success: boolean; score?: number; error?: string }> {
    // Note: This endpoint would need to be implemented in the backend
    // For now, returning a placeholder response
    return {
      success: false,
      error: 'Quiz submission endpoint not yet implemented',
    }
  },
}

