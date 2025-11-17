import type { Course, Section } from '@/types'
import apiClient from './client'

export const courseService = {
  async getCourses(): Promise<Course[]> {
    const response = await apiClient.get('/courses')
    return response.data
  },

  async getCourseById(courseId: string | number): Promise<Course | null> {
    try {
      const response = await apiClient.get(`/courses/${courseId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async getSectionsByCourse(courseId: string | number): Promise<Section[]> {
    const response = await apiClient.get(`/courses/${courseId}/sections`)
    return response.data
  },

  async getSectionById(sectionId: string | number, courseId: string | number): Promise<Section | null> {
    try {
      const response = await apiClient.get(`/courses/${courseId}/sections/${sectionId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },
}

