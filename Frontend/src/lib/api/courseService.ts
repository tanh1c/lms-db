import type { Course, Section } from '@/types'
import apiClient from './client'

export const courseService = {
  async getCourses(): Promise<Course[]> {
    const response = await apiClient.get('/courses')
    return response.data
  },

  async getCourseById(courseId: string | number): Promise<Course | null> {
    try {
      const response = await apiClient.get(`/courses/${courseId}`, {
        timeout: 15000, // 15 seconds for course detail query
      })
      const data = response.data
      
      // Handle different response formats
      if (data && typeof data === 'object' && 'Course_ID' in data) {
        return data
      }
      
      // If response has nested data
      if (data?.course) {
        return data.course
      }
      
      return null
    } catch (error: any) {
      console.error('Error fetching course:', error)
      if (error.response?.status === 404) {
        return null
      }
      // Log timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('Course fetch timeout - database query may be slow')
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

