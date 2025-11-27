import type { User, Course } from '@/types'
import apiClient from './client'

// Student Dashboard Statistics
export interface StudentDashboardStatistics {
  total_courses: number
  total_assignments: number
  total_quizzes: number
  completed_assignments: number
  completed_quizzes: number
  average_grade: number
  total_study_hours: number
  progress_percentage: number
  leaderboard_rank: number
}

// Upcoming Task
export interface UpcomingTask {
  task_type: 'Assignment' | 'Quiz'
  task_id: number
  task_title: string
  deadline: string | null
  course_name: string
  course_id: string
  semester: string
  is_completed: boolean
  current_status: string | null
}

// Leaderboard Entry
export interface LeaderboardEntry {
  rank: number
  first_name: string
  last_name: string
  course: number
  hour: number
  point: number
  trend: 'up' | 'down'
}

// Activity Chart Data
export interface ActivityChartData {
  month: string
  Study: number
  Exams: number
}

// Grade Component by Course
export interface GradeComponent {
  course_name: string
  course_id: string
  semester: string
  final_grade: number
  midterm_grade: number
  quiz_grade: number
  assignment_grade: number
}

export const studentService = {
  async getStudentsByCourse(courseId: string | number): Promise<User[]> {
    const response = await apiClient.get(`/students/course/${courseId}`)
    return response.data
  },

  async getDashboardStatistics(universityId: number): Promise<StudentDashboardStatistics> {
    const response = await apiClient.get('/students/dashboard/statistics', {
      params: { university_id: universityId }
    })
    return response.data
  },

  async getUpcomingTasks(universityId: number, daysAhead: number = 7): Promise<UpcomingTask[]> {
    const response = await apiClient.get('/students/dashboard/upcoming-tasks', {
      params: { university_id: universityId, days_ahead: daysAhead }
    })
    return response.data
  },

  async getLeaderboard(topN: number = 10): Promise<LeaderboardEntry[]> {
    const response = await apiClient.get('/students/dashboard/leaderboard', {
      params: { top_n: topN }
    })
    return response.data
  },

  async getActivityChart(universityId: number, monthsBack: number = 5): Promise<ActivityChartData[]> {
    const response = await apiClient.get('/students/dashboard/activity-chart', {
      params: { university_id: universityId, months_back: monthsBack }
    })
    return response.data
  },

  async getGradeComponents(universityId: number): Promise<GradeComponent[]> {
    const response = await apiClient.get('/students/dashboard/grade-components', {
      params: { university_id: universityId }
    })
    return response.data
  },

  async getStudentCourses(universityId: number): Promise<Course[]> {
    const response = await apiClient.get('/students/dashboard/courses', {
      params: { university_id: universityId }
    })
    return response.data
  },
}

