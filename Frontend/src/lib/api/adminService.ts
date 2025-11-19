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
    const response = await apiClient.get('/admin/courses')
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

  // Assessments
  async getAssessments(): Promise<Assessment[]> {
    const response = await apiClient.get('/admin/assessments')
    return response.data
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
}

