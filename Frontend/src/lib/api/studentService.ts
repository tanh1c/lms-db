import type { User } from '@/types'
import apiClient from './client'

export const studentService = {
  async getStudentsByCourse(courseId: string | number): Promise<User[]> {
    const response = await apiClient.get(`/students/course/${courseId}`)
    return response.data
  },
}

