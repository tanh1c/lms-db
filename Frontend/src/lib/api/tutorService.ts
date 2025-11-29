import type { Course, Quiz, Assignment, User } from '@/types'
import type { SectionDetail } from './studentService'
import apiClient from './client'

// Course with Sections Interface (same as student)
export interface CourseWithSections extends Course {
  Sections: Array<{
    Section_ID: string
    Semester: string
  }>
}

// Tutor Dashboard Statistics
export interface TutorDashboardStatistics {
  total_courses: number
  total_students: number
  pending_assignments: number
  pending_quizzes: number
  completion_rate: number
}

// Tutor Course Section
export interface TutorCourseSection {
  Section_ID: string
  Semester: string
  StudentCount: number
}

// Tutor Course with statistics
export interface TutorCourse extends Course {
  SectionCount: number
  StudentCount: number
  AssignmentCount: number
  PendingAssignments: number
  Sections: TutorCourseSection[]
}

// Grading Activity Data
export interface GradingActivityData {
  month: string
  Graded: number
  Pending: number
}

// Grade Component by Course
export interface GradeComponent {
  course_name: string
  Course_ID: string
  final_grade: number
  midterm_grade: number
  quiz_grade: number
  assignment_grade: number
}

// Average Student GPA
export interface AverageStudentGPA {
  average_gpa: number
  total_students: number
  total_courses: number
  rank: number
}

// Top Tutor Entry
export interface TopTutorEntry {
  rank: number
  first_name: string
  last_name: string
  course: number
  hour: number
  point: number
  trend: 'up' | 'down'
}

// Student Grade Entry
export interface StudentGradeEntry {
  University_ID: number
  First_Name: string
  Last_Name: string
  Email: string | null
  Major: string | null
  Current_degree: string | null
  Assessment_ID: number | null
  Quiz_Grade: number | null
  Assignment_Grade: number | null
  Midterm_Grade: number | null
  Final_Grade: number | null
  Status: string | null
  GPA: number | null
}

export const tutorService = {
  async getDashboardStatistics(universityId: number): Promise<TutorDashboardStatistics> {
    const response = await apiClient.get('/tutors/dashboard/statistics', {
      params: { university_id: universityId }
    })
    return response.data
  },

  async getCourses(universityId: number): Promise<TutorCourse[]> {
    const response = await apiClient.get('/tutors/dashboard/courses', {
      params: { university_id: universityId }
    })
    return response.data
  },

  async getGradingActivity(universityId: number, monthsBack: number = 5): Promise<GradingActivityData[]> {
    const response = await apiClient.get('/tutors/dashboard/grading-activity', {
      params: { 
        university_id: universityId,
        months_back: monthsBack
      }
    })
    return response.data
  },

  async getStudentGradeComponents(universityId: number): Promise<GradeComponent[]> {
    const response = await apiClient.get('/tutors/dashboard/student-grade-components', {
      params: { university_id: universityId }
    })
    return response.data
  },

  async getAverageStudentGPA(universityId: number): Promise<AverageStudentGPA> {
    const response = await apiClient.get('/tutors/dashboard/average-student-gpa', {
      params: { university_id: universityId }
    })
    return response.data
  },

  async getTopTutorsByStudentGPA(topN: number = 5): Promise<TopTutorEntry[]> {
    const response = await apiClient.get('/tutors/dashboard/top-tutors', {
      params: { top_n: topN }
    })
    return response.data
  },

  async getTutorCoursesWithSections(universityId: number): Promise<CourseWithSections[]> {
    const response = await apiClient.get('/tutors/courses/with-sections', {
      params: { university_id: universityId }
    })
    return response.data
  },

  async getTutorSectionDetail(universityId: number, sectionId: string, courseId: string): Promise<SectionDetail | null> {
    const response = await apiClient.get(`/tutors/section/${sectionId}/${courseId}/detail`, {
      params: { university_id: universityId }
    })
    return response.data
  },

  async getTutorSectionQuizzes(sectionId: string, courseId: string, semester: string): Promise<Quiz[]> {
    const response = await apiClient.get(`/tutors/section/${sectionId}/${courseId}/${semester}/quizzes`)
    return response.data
  },

  async getTutorSectionAssignments(sectionId: string, courseId: string, semester: string): Promise<Assignment[]> {
    const response = await apiClient.get(`/tutors/section/${sectionId}/${courseId}/${semester}/assignments`)
    return response.data
  },

  async getTutorSectionStudents(sectionId: string, courseId: string, semester: string): Promise<User[]> {
    const response = await apiClient.get(`/tutors/section/${sectionId}/${courseId}/${semester}/students`)
    return response.data
  },

  async getTutorSectionStudentGrades(sectionId: string, courseId: string, semester: string): Promise<StudentGradeEntry[]> {
    const response = await apiClient.get(`/tutors/section/${sectionId}/${courseId}/${semester}/student-grades`)
    return response.data
  },

  // Quiz CRUD
  async createQuiz(universityId: number, quiz: Omit<Quiz, 'QuizID' | 'Course_Name'>): Promise<Quiz> {
    const response = await apiClient.post('/tutors/quizzes', quiz, {
      params: { university_id: universityId }
    })
    return response.data.quiz
  },

  async updateQuiz(universityId: number, quizId: number, updates: Partial<Quiz>): Promise<Quiz> {
    const response = await apiClient.put(`/tutors/quizzes/${quizId}`, updates, {
      params: { university_id: universityId }
    })
    return response.data.quiz
  },

  async deleteQuiz(universityId: number, quizId: number): Promise<void> {
    await apiClient.delete(`/tutors/quizzes/${quizId}`, {
      params: { university_id: universityId }
    })
  },

  async getQuizAnswers(universityId: number, quizId: number): Promise<any[]> {
    const response = await apiClient.get(`/tutors/quizzes/${quizId}/answers`, {
      params: { university_id: universityId }
    })
    return response.data || []
  },

  // Assignment CRUD
  async createAssignment(universityId: number, assignment: Omit<Assignment, 'AssignmentID' | 'Course_Name'>): Promise<Assignment> {
    const response = await apiClient.post('/tutors/assignments', assignment, {
      params: { university_id: universityId }
    })
    return response.data.assignment
  },

  async updateAssignment(universityId: number, assignmentId: number, updates: Partial<Assignment>): Promise<Assignment> {
    const response = await apiClient.put(`/tutors/assignments/${assignmentId}`, updates, {
      params: { university_id: universityId }
    })
    return response.data.assignment
  },

  async deleteAssignment(universityId: number, assignmentId: number): Promise<void> {
    await apiClient.delete(`/tutors/assignments/${assignmentId}`, {
      params: { university_id: universityId }
    })
  },

  async getAssignmentSubmissions(universityId: number, assignmentId: number): Promise<any[]> {
    const response = await apiClient.get(`/tutors/assignments/${assignmentId}/submissions`, {
      params: { university_id: universityId }
    })
    return response.data || []
  },

  // Update scores
  async updateQuizAnswerScore(universityId: number, quizId: number, studentId: number, score: number): Promise<any> {
    const response = await apiClient.put(`/tutors/quizzes/${quizId}/answers/${studentId}`, 
      { score },
      { params: { university_id: universityId } }
    )
    return response.data.quiz_answer
  },

  async updateAssignmentSubmissionScore(universityId: number, assignmentId: number, studentId: number, score: number, comments?: string): Promise<any> {
    const response = await apiClient.put(`/tutors/assignments/${assignmentId}/submissions/${studentId}`, 
      { score, comments },
      { params: { university_id: universityId } }
    )
    return response.data.assignment_submission
  },

  async updateAssessmentGrades(universityId: number, assessmentId: number, grades: {
    Quiz_Grade?: number | null
    Assignment_Grade?: number | null
    Midterm_Grade?: number | null
    Final_Grade?: number | null
  }): Promise<any> {
    const response = await apiClient.put(`/tutors/assessments/${assessmentId}`, 
      grades,
      { params: { university_id: universityId } }
    )
    return response.data.assessment
  },
}

