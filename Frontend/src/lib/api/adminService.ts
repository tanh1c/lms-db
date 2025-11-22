import apiClient from './client'

// Statistics
export interface Statistics {
  total_users: number
  total_students: number
  total_tutors: number
  total_admins: number
  total_courses: number
  total_sections: number
  total_assignments: number
  total_quizzes: number
  total_submissions: number
  pending_assessments: number
}

// Course
export interface AdminCourse {
  Course_ID: string
  Name: string
  Credit: number | null
  Start_Date: string | null
  SectionCount?: number
  StudentCount?: number
  TutorCount?: number
}

export interface CourseDetails {
  Course_ID: string
  Name: string
  Credit: number | null
  Start_Date: string | null
  TotalSections: number
  TotalStudents: number
  TotalTutors: number
  TotalAssignments: number
  TotalQuizzes: number
  AverageFinalGrade: number | null
}

export interface CourseSection {
  Section_ID: string
  Course_ID: string
  Semester: string
  StudentCount: number
  TutorCount: number
  TutorNames: string | null
  RoomCount: number
  RoomsInfo: string | null  // Building name and room number details
}

export interface CourseStudent {
  University_ID: number
  First_Name: string
  Last_Name: string
  Email: string
  Major: string
  Current_degree: string | null
  Section_ID: string
  Semester: string
  Assessment_ID: number
  Registration_Date: string | null
  Potential_Withdrawal_Date: string | null
  Status: string
  Final_Grade: number | null
  Midterm_Grade: number | null
  Quiz_Grade: number | null
  Assignment_Grade: number | null
}

export interface CourseTutor {
  University_ID: number
  First_Name: string
  Last_Name: string
  Email: string
  TutorName: string
  Academic_Rank: string | null
  Department_Name: string | null
  Section_ID: string
  Semester: string
  Role_Specification: string | null
  Timestamp: string | null
  StudentCount: number
}

export interface CourseStatistics {
  TotalEnrolledStudents: number
  ApprovedStudents: number
  PendingStudents: number
  AverageFinalGrade: number | null
  MinFinalGrade: number | null
  MaxFinalGrade: number | null
  TotalAssignments: number
  TotalQuizzes: number
  TotalSubmissions: number
  TotalSections: number
  TotalTutors: number
}

export interface CourseEnrollmentTrend {
  Semester: string
  EnrolledStudents: number
  SectionCount: number
  AverageGrade: number | null
}

// Section
export interface Section {
  Section_ID: string
  Course_ID: string
  Semester: string
}

// Assignment
export interface AdminAssignment {
  University_ID: number
  Section_ID: string
  Course_ID: string
  Course_Name?: string
  Semester: string
  Assessment_ID: number
  MaxScore: number | null
  accepted_specification: string | null
  submission_deadline: string
  instructions: string | null
}

// Quiz
export interface AdminQuiz {
  University_ID: number
  Section_ID: string
  Course_ID: string
  Course_Name?: string
  Semester: string
  Assessment_ID: number
  Grading_method: string | null
  pass_score: number | null
  Time_limits: string | null
  Start_Date: string
  End_Date: string
  content: string
  types: string | null
  Weight: number | null
  Correct_answer: string
}

// Student
export interface AdminStudent {
  University_ID: number
  First_Name: string
  Last_Name: string
  Email: string
  Phone_Number: string | null
  Address: string | null
  National_ID: string | null
  Major: string
  Current_degree: string | null
}

// Tutor
export interface AdminTutor {
  University_ID: number
  First_Name: string
  Last_Name: string
  Email: string
  Phone_Number: string | null
  Address: string | null
  National_ID: string | null
  Name: string
  Academic_Rank: string | null
  Details: string | null
  Issuance_Date: string | null
  Department_Name: string | null
}

// Admin
export interface AdminUser {
  University_ID: number
  First_Name: string
  Last_Name: string
  Email: string
  Phone_Number: string | null
  Address: string | null
  National_ID: string | null
  Type: string
}

// Assessment
export interface Assessment {
  University_ID: number
  Student_Name: string
  Section_ID: string
  Course_ID: string
  Course_Name: string
  Semester: string
  Assessment_ID: number
  Registration_Date: string | null
  Potential_Withdrawal_Date: string | null
  Status: string
  Final_Grade: number | null
  Midterm_Grade: number | null
  Quiz_Grade: number | null
  Assignment_Grade: number | null
}

// Submission
export interface Submission {
  Submission_No: number
  University_ID: number
  Student_Name: string
  Section_ID: string
  Course_ID: string
  Course_Name: string
  Semester: string
  Assessment_ID: number
  accepted_specification: string | null
  late_flag_indicator: boolean | null
  SubmitDate: string | null
  attached_files: string | null
  status: string
}

// Review
export interface Review {
  Submission_No: number
  Student_ID: number
  Student_Name: string
  Tutor_ID: number
  Tutor_Name: string
  Tutor_Full_Name: string
  Score: number | null
  Comments: string | null
}

// Teaches
export interface Teaches {
  University_ID: number
  Tutor_Name: string
  Section_ID: string
  Course_ID: string
  Course_Name: string
  Semester: string
  Role_Specification: string | null
  Timestamp: string | null
}

// Building
export interface Building {
  Building_ID: number
  Building_Name: string
}

// Room
export interface Room {
  Room_ID: number
  Building_ID: number
  Building_Name: string
  Capacity: number | null
}

// Audit Log
export interface AuditLog {
  LogID: number
  timestamp: string | null
  affected_entities: string | null
  section_creation: string | null
  deadline_extensions: string | null
  grade_updates: string | null
  University_ID: number | null
  First_Name: string | null
  Last_Name: string | null
  Email: string | null
  User_Role: string | null
}

// Audit Log Statistics
export interface AuditLogStatistics {
  total_logs: number
  unique_users: number
  section_creations: number
  deadline_extensions: number
  grade_updates: number
  entity_changes: number
}

// Advanced Statistics
export interface GPAStatisticsByMajor {
  Major: string
  StudentCount: number
  AverageGPA: number
  MinGPA: number
  MaxGPA: number
  StdDevGPA: number
}

export interface GPAStatisticsByDepartment {
  Department_Name: string
  StudentCount: number
  AverageGPA: number
  MinGPA: number
  MaxGPA: number
  StdDevGPA: number
}

export interface CourseEnrollmentStatistics {
  Major: string
  TotalStudents: number
  TotalCourses: number
  TotalEnrollments: number
  AvgCoursesPerStudent: number
}

export interface CompletionRateStatistics {
  Type: 'Quiz' | 'Assignment'
  Total: number
  Completed: number
  Passed: number
  CompletionRate: number
  PassRate: number
}

export interface PerformanceOverTime {
  Period: string
  StudentCount: number
  CourseCount: number
  AverageGPA: number
  MinGPA: number
  MaxGPA: number
}

export interface TopStudent {
  University_ID: number
  First_Name: string
  Last_Name: string
  Major: string
  CumulativeGPA: number
  CourseCount: number
  TotalCredits: number
}

export interface TopTutor {
  University_ID: number
  First_Name: string
  Last_Name: string
  Department_Name: string | null
  Academic_Rank: string | null
  SectionCount: number
  StudentCount: number
  AverageStudentGPA: number | null
}

// Course Statistics
export interface CourseEnrollmentByCourse {
  Course_ID: string
  Course_Name: string
  Credit: number | null
  SectionCount: number
  StudentCount: number
  TutorCount: number
  AverageGrade: number | null
  ApprovedStudents: number
  PendingStudents: number
}

export interface CourseDistributionByCredit {
  Credit: number
  CourseCount: number
  TotalStudents: number
}

export interface TopCourseByEnrollment {
  Course_ID: string
  Course_Name: string
  Credit: number | null
  StudentCount: number
  SectionCount: number
  TutorCount: number
  AverageGrade: number | null
  MinGrade: number | null
  MaxGrade: number | null
}

export interface CourseAverageGrade {
  Course_ID: string
  Course_Name: string
  Credit: number | null
  StudentCount: number
  AverageGPA: number | null
  AverageFinalGrade: number | null
  MinFinalGrade: number | null
  MaxFinalGrade: number | null
  StdDevFinalGrade: number | null
}

export interface CourseEnrollmentTrendOverTime {
  Period: string
  CourseCount: number
  SectionCount: number
  StudentCount: number
  TutorCount: number
  AverageGrade: number | null
}

export interface CourseStatusDistribution {
  Status: string
  StudentCount: number
  CourseCount: number
  SectionCount: number
}

export interface CourseActivityStatistics {
  Course_ID: string
  Course_Name: string
  Credit: number | null
  SectionCount: number
  StudentCount: number
  TotalAssignments: number
  TotalQuizzes: number
  TotalSubmissions: number
  SubmittedCount: number
  AverageGrade: number | null
}

export const adminService = {
  // Statistics
  async getStatistics(): Promise<Statistics> {
    // Use longer timeout for statistics as it may take time
    const response = await apiClient.get('/admin/statistics', {
      timeout: 10000, // 10 seconds for statistics query
    })
    return response.data
  },

  // Courses
  async getCourses(): Promise<AdminCourse[]> {
    const response = await apiClient.get('/admin/courses', {
      timeout: 10000, // 10 seconds for courses with statistics
    })
    return response.data
  },

  async createCourse(course: Omit<AdminCourse, 'Course_ID'> & { Course_ID: string }): Promise<AdminCourse> {
    const response = await apiClient.post('/admin/courses', course)
    return response.data.course
  },

  async updateCourse(courseId: string, updates: Partial<AdminCourse>): Promise<void> {
    await apiClient.put(`/admin/courses/${courseId}`, updates)
  },

  async deleteCourse(courseId: string): Promise<void> {
    await apiClient.delete(`/admin/courses/${courseId}`)
  },

  async searchCourses(params: {
    search?: string
    min_credit?: number
    max_credit?: number
    start_date_from?: string
    start_date_to?: string
    has_sections?: boolean
    has_students?: boolean
  }): Promise<AdminCourse[]> {
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append('search', params.search)
    if (params.min_credit !== undefined) queryParams.append('min_credit', params.min_credit.toString())
    if (params.max_credit !== undefined) queryParams.append('max_credit', params.max_credit.toString())
    if (params.start_date_from) queryParams.append('start_date_from', params.start_date_from)
    if (params.start_date_to) queryParams.append('start_date_to', params.start_date_to)
    if (params.has_sections !== undefined) queryParams.append('has_sections', params.has_sections.toString())
    if (params.has_students !== undefined) queryParams.append('has_students', params.has_students.toString())
    
    const response = await apiClient.get(`/admin/courses/search?${queryParams.toString()}`, {
      timeout: 10000, // 10 seconds for search queries
    })
    return response.data
  },

  async getCourseDetails(courseId: string): Promise<CourseDetails> {
    const response = await apiClient.get(`/admin/courses/${courseId}/details`)
    return response.data
  },

  async getCourseSections(courseId: string): Promise<CourseSection[]> {
    const response = await apiClient.get(`/admin/courses/${courseId}/sections`)
    return response.data
  },

  async getCourseStudents(courseId: string, params?: {
    section_id?: string
    semester?: string
    status?: string
  }): Promise<CourseStudent[]> {
    const queryParams = new URLSearchParams()
    if (params?.section_id) queryParams.append('section_id', params.section_id)
    if (params?.semester) queryParams.append('semester', params.semester)
    if (params?.status) queryParams.append('status', params.status)
    
    const response = await apiClient.get(`/admin/courses/${courseId}/students?${queryParams.toString()}`)
    return response.data
  },

  async getCourseTutors(courseId: string, params?: {
    section_id?: string
    semester?: string
  }): Promise<CourseTutor[]> {
    const queryParams = new URLSearchParams()
    if (params?.section_id) queryParams.append('section_id', params.section_id)
    if (params?.semester) queryParams.append('semester', params.semester)
    
    const response = await apiClient.get(`/admin/courses/${courseId}/tutors?${queryParams.toString()}`)
    return response.data
  },

  async getCourseStatistics(courseId: string): Promise<CourseStatistics> {
    const response = await apiClient.get(`/admin/courses/${courseId}/statistics`)
    return response.data
  },

  async getCoursesBySemester(semester: string): Promise<AdminCourse[]> {
    const response = await apiClient.get(`/admin/courses/by-semester/${semester}`)
    return response.data
  },

  async getCourseEnrollmentTrend(courseId: string, params?: {
    start_semester?: string
    end_semester?: string
  }): Promise<CourseEnrollmentTrend[]> {
    const queryParams = new URLSearchParams()
    if (params?.start_semester) queryParams.append('start_semester', params.start_semester)
    if (params?.end_semester) queryParams.append('end_semester', params.end_semester)
    
    const response = await apiClient.get(`/admin/courses/${courseId}/enrollment-trend?${queryParams.toString()}`)
    return response.data
  },

  // Sections
  async getSections(): Promise<Section[]> {
    const response = await apiClient.get('/admin/sections')
    return response.data
  },

  async createSection(section: Section): Promise<Section> {
    const response = await apiClient.post('/admin/sections', section)
    return response.data.section
  },

  async deleteSection(courseId: string, sectionId: string, semester: string): Promise<void> {
    await apiClient.delete(`/admin/sections/${courseId}/${sectionId}/${semester}`)
  },

  // Assignments
  async getAssignments(): Promise<AdminAssignment[]> {
    const response = await apiClient.get('/admin/assignments')
    return response.data
  },

  async createAssignment(assignment: Omit<AdminAssignment, 'Course_Name'>): Promise<AdminAssignment> {
    const response = await apiClient.post('/admin/assignments', assignment)
    return response.data.assignment
  },

  async updateAssignment(
    universityId: number,
    sectionId: string,
    courseId: string,
    semester: string,
    assessmentId: number,
    updates: Partial<AdminAssignment>
  ): Promise<void> {
    await apiClient.put(`/admin/assignments/${universityId}/${sectionId}/${courseId}/${semester}/${assessmentId}`, updates)
  },

  async deleteAssignment(
    universityId: number,
    sectionId: string,
    courseId: string,
    semester: string,
    assessmentId: number
  ): Promise<void> {
    await apiClient.delete(`/admin/assignments/${universityId}/${sectionId}/${courseId}/${semester}/${assessmentId}`)
  },

  // Quizzes
  async getQuizzes(): Promise<AdminQuiz[]> {
    const response = await apiClient.get('/admin/quizzes')
    return response.data
  },

  async createQuiz(quiz: Omit<AdminQuiz, 'Course_Name'>): Promise<AdminQuiz> {
    const response = await apiClient.post('/admin/quizzes', quiz)
    return response.data.quiz
  },

  async updateQuiz(
    universityId: number,
    sectionId: string,
    courseId: string,
    semester: string,
    assessmentId: number,
    updates: Partial<AdminQuiz>
  ): Promise<void> {
    await apiClient.put(`/admin/quizzes/${universityId}/${sectionId}/${courseId}/${semester}/${assessmentId}`, updates)
  },

  async deleteQuiz(
    universityId: number,
    sectionId: string,
    courseId: string,
    semester: string,
    assessmentId: number
  ): Promise<void> {
    await apiClient.delete(`/admin/quizzes/${universityId}/${sectionId}/${courseId}/${semester}/${assessmentId}`)
  },

  // Students
  async getStudents(): Promise<AdminStudent[]> {
    const response = await apiClient.get('/admin/students')
    return response.data
  },

  async createStudent(student: Omit<AdminStudent, 'University_ID'> & { University_ID: number; Password?: string }): Promise<AdminStudent> {
    const response = await apiClient.post('/admin/students', student)
    return response.data.student
  },

  async updateStudent(universityId: number, updates: Partial<AdminStudent>): Promise<void> {
    await apiClient.put(`/admin/students/${universityId}`, updates)
  },

  async deleteStudent(universityId: number): Promise<void> {
    await apiClient.delete(`/admin/students/${universityId}`)
  },

  // Tutors
  async getTutors(): Promise<AdminTutor[]> {
    const response = await apiClient.get('/admin/tutors')
    return response.data
  },

  async createTutor(tutor: Omit<AdminTutor, 'University_ID'> & { University_ID: number; Password?: string }): Promise<AdminTutor> {
    const response = await apiClient.post('/admin/tutors', tutor)
    return response.data.tutor
  },

  async updateTutor(universityId: number, updates: Partial<AdminTutor>): Promise<void> {
    await apiClient.put(`/admin/tutors/${universityId}`, updates)
  },

  async deleteTutor(universityId: number): Promise<void> {
    await apiClient.delete(`/admin/tutors/${universityId}`)
  },

  // Admins
  async getAdmins(): Promise<AdminUser[]> {
    const response = await apiClient.get('/admin/admins')
    return response.data
  },

  async createAdmin(admin: Omit<AdminUser, 'University_ID' | 'Type'> & { University_ID: number; Type?: string; Password?: string }): Promise<AdminUser> {
    const response = await apiClient.post('/admin/admins', admin)
    return response.data.admin
  },

  async updateAdmin(universityId: number, updates: Partial<AdminUser>): Promise<void> {
    await apiClient.put(`/admin/admins/${universityId}`, updates)
  },

  async deleteAdmin(universityId: number): Promise<void> {
    await apiClient.delete(`/admin/admins/${universityId}`)
  },

  // Update User Role
  async updateUserRole(
    universityId: number,
    newRole: 'student' | 'tutor' | 'admin',
    roleSpecificData?: {
      Major?: string
      Current_degree?: string
      Name?: string
      Academic_Rank?: string
      Details?: string
      Department_Name?: string
      Type?: string
    }
  ): Promise<any> {
    const response = await apiClient.put(`/admin/users/${universityId}/role`, {
      role: newRole,
      ...roleSpecificData,
    })
    return response.data.user
  },

  // Reset User Password
  async resetUserPassword(universityId: number): Promise<{ default_password: string }> {
    const response = await apiClient.post(`/admin/users/${universityId}/reset-password`)
    return response.data
  },

  // Get User Details
  async getUserDetails(universityId: number): Promise<any> {
    const response = await apiClient.get(`/admin/users/${universityId}/details`)
    return response.data.user
  },

  // Filter Users
  async filterUsers(filters: {
    role?: 'student' | 'tutor' | 'admin' | 'all'
    major?: string
    department?: string
    type?: string
    search?: string
  }): Promise<any[]> {
    const params = new URLSearchParams()
    if (filters.role && filters.role !== 'all') params.append('role', filters.role)
    if (filters.major) params.append('major', filters.major)
    if (filters.department) params.append('department', filters.department)
    if (filters.type) params.append('type', filters.type)
    if (filters.search) params.append('search', filters.search)
    
    const response = await apiClient.get(`/admin/users/filter?${params.toString()}`)
    return response.data
  },

  // Get Filter Options
  async getFilterOptions(): Promise<{
    majors: string[]
    departments: string[]
    admin_types: string[]
  }> {
    const response = await apiClient.get(`/admin/users/filter-options`)
    return response.data
  },

  // Assessments
  async getAssessments(): Promise<Assessment[]> {
    const response = await apiClient.get('/admin/assessments', {
      timeout: 30000, // 30 seconds for assessment query with JOINs
    })
    const data = response.data
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data
    }
    
    if (Array.isArray(data?.data)) {
      return data.data
    }
    
    // Return empty array if no data or error format
    console.warn('Unexpected assessment response format:', data)
    return []
  },

  async updateAssessmentGrade(
    universityId: number,
    sectionId: string,
    courseId: string,
    semester: string,
    assessmentId: number,
    grades: {
      Final_Grade?: number
      Midterm_Grade?: number
      Quiz_Grade?: number
      Assignment_Grade?: number
      Status?: string
    }
  ): Promise<void> {
    await apiClient.put(`/admin/assessments/${universityId}/${sectionId}/${courseId}/${semester}/${assessmentId}`, grades)
  },

  // Submissions
  async getSubmissions(): Promise<Submission[]> {
    const response = await apiClient.get('/admin/submissions')
    return response.data
  },

  // Reviews
  async getReviews(): Promise<Review[]> {
    const response = await apiClient.get('/admin/reviews')
    return response.data
  },

  async createReview(review: Omit<Review, 'Student_Name' | 'Tutor_Name' | 'Tutor_Full_Name'>): Promise<Review> {
    const response = await apiClient.post('/admin/reviews', review)
    return response.data.review
  },

  async updateReview(submissionNo: number, updates: { Score?: number; Comments?: string }): Promise<void> {
    await apiClient.put(`/admin/reviews/${submissionNo}`, updates)
  },

  // Teaches
  async getTeaches(): Promise<Teaches[]> {
    const response = await apiClient.get('/admin/teaches')
    return response.data
  },

  async createTeaches(teaches: Omit<Teaches, 'Tutor_Name' | 'Course_Name' | 'Timestamp'>): Promise<Teaches> {
    const response = await apiClient.post('/admin/teaches', teaches)
    return response.data.teaches
  },

  async deleteTeaches(universityId: number, sectionId: string, courseId: string, semester: string): Promise<void> {
    await apiClient.delete(`/admin/teaches/${universityId}/${sectionId}/${courseId}/${semester}`)
  },

  // Buildings
  async getBuildings(): Promise<Building[]> {
    const response = await apiClient.get('/admin/buildings')
    return response.data
  },

  async createBuilding(building: Omit<Building, 'Building_ID'>): Promise<Building> {
    const response = await apiClient.post('/admin/buildings', building)
    return response.data.building
  },

  // Rooms
  async getRooms(): Promise<Room[]> {
    const response = await apiClient.get('/admin/rooms')
    return response.data
  },

  async createRoom(room: Omit<Room, 'Room_ID' | 'Building_Name'>): Promise<Room> {
    const response = await apiClient.post('/admin/rooms', room)
    return response.data.room
  },

  // Audit Logs
  async getAuditLogs(params?: {
    start_date?: string
    end_date?: string
    university_id?: number
    page?: number
    page_size?: number
  }): Promise<{
    logs: AuditLog[]
    total_count: number
    page: number
    page_size: number
    total_pages: number
  }> {
    const response = await apiClient.get('/admin/audit-logs', { params })
    return response.data
  },

  async getAuditLogsByUser(
    universityId: number,
    params?: {
      start_date?: string
      end_date?: string
      page?: number
      page_size?: number
    }
  ): Promise<{
    logs: AuditLog[]
    total_count: number
    page: number
    page_size: number
    total_pages: number
  }> {
    const response = await apiClient.get(`/admin/audit-logs/${universityId}`, { params })
    return response.data
  },

  async getAuditLogStatistics(params?: {
    start_date?: string
    end_date?: string
  }): Promise<AuditLogStatistics> {
    const response = await apiClient.get('/admin/audit-logs/statistics', { params })
    return response.data
  },

  // Advanced Statistics & Analytics
  async getGPAStatisticsByMajor(): Promise<GPAStatisticsByMajor[]> {
    const response = await apiClient.get('/admin/statistics/gpa-by-major')
    return response.data
  },

  async getGPAStatisticsByDepartment(): Promise<GPAStatisticsByDepartment[]> {
    const response = await apiClient.get('/admin/statistics/gpa-by-department')
    return response.data
  },

  async getCourseEnrollmentStatistics(): Promise<CourseEnrollmentStatistics[]> {
    const response = await apiClient.get('/admin/statistics/course-enrollment')
    return response.data
  },

  async getCompletionRateStatistics(): Promise<CompletionRateStatistics[]> {
    const response = await apiClient.get('/admin/statistics/completion-rates')
    return response.data
  },

  async getPerformanceOverTime(groupBy: 'Semester' | 'Month' = 'Semester'): Promise<PerformanceOverTime[]> {
    const response = await apiClient.get('/admin/statistics/performance-over-time', {
      params: { group_by: groupBy }
    })
    return response.data
  },

  async getTopStudents(topN: number = 10): Promise<TopStudent[]> {
    const response = await apiClient.get('/admin/statistics/top-students', {
      params: { top_n: topN }
    })
    return response.data
  },

  async getTopTutors(topN: number = 10): Promise<TopTutor[]> {
    const response = await apiClient.get('/admin/statistics/top-tutors', {
      params: { top_n: topN }
    })
    return response.data
  },

  // Course Statistics & Analytics
  async getCourseEnrollmentByCourse(topN?: number): Promise<CourseEnrollmentByCourse[]> {
    const response = await apiClient.get('/admin/statistics/courses/enrollment-by-course', {
      params: topN ? { top_n: topN } : {},
      timeout: 15000, // 15 seconds for complex statistics queries
    })
    return response.data
  },

  async getCourseDistributionByCredit(): Promise<CourseDistributionByCredit[]> {
    const response = await apiClient.get('/admin/statistics/courses/distribution-by-credit', {
      timeout: 15000, // 15 seconds for complex statistics queries
    })
    return response.data
  },

  async getTopCoursesByEnrollment(topN: number = 10): Promise<TopCourseByEnrollment[]> {
    const response = await apiClient.get('/admin/statistics/courses/top-by-enrollment', {
      params: { top_n: topN },
      timeout: 15000, // 15 seconds for complex statistics queries
    })
    return response.data
  },

  async getCourseAverageGrade(minEnrollment: number = 1): Promise<CourseAverageGrade[]> {
    const response = await apiClient.get('/admin/statistics/courses/average-grade', {
      params: { min_enrollment: minEnrollment },
      timeout: 15000, // 15 seconds for complex statistics queries
    })
    return response.data
  },

  async getCourseEnrollmentTrendOverTime(groupBy: 'Semester' | 'Month' = 'Semester'): Promise<CourseEnrollmentTrendOverTime[]> {
    const response = await apiClient.get('/admin/statistics/courses/enrollment-trend', {
      params: { group_by: groupBy },
      timeout: 15000, // 15 seconds for complex statistics queries
    })
    return response.data
  },

  async getCourseStatusDistribution(): Promise<CourseStatusDistribution[]> {
    const response = await apiClient.get('/admin/statistics/courses/status-distribution', {
      timeout: 15000, // 15 seconds for complex statistics queries
    })
    return response.data
  },

  async getCourseActivityStatistics(topN?: number): Promise<CourseActivityStatistics[]> {
    const response = await apiClient.get('/admin/statistics/courses/activity', {
      params: topN ? { top_n: topN } : {},
      timeout: 15000, // 15 seconds for complex statistics queries
    })
    return response.data
  },
}

