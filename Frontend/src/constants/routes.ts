export const ROUTES = {
  // Auth
  LOGIN: '/login',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  STUDENT_DASHBOARD: '/dashboard/student',
  TUTOR_DASHBOARD: '/dashboard/tutor',
  ADMIN_DASHBOARD: '/dashboard/admin',
  
  // Courses
  COURSES: '/courses',
  COURSE_DETAIL: '/courses/:courseId',
  SECTION_DETAIL: '/courses/:courseId/sections/:sectionId',
  
  // Assignments
  ASSIGNMENTS: '/assignments',
  ASSIGNMENT_DETAIL: '/assignments/:assignmentId',
  ASSIGNMENT_SUBMIT: '/assignments/:assignmentId/submit',
  
  // Quizzes
  QUIZZES: '/quizzes',
  QUIZ_TAKE: '/quizzes/:quizId/take',
  QUIZ_RESULT: '/quizzes/:quizId/result',
  
  // Grades
  GRADES: '/grades',
  GRADE_DETAIL: '/grades/:courseId',
  
  // Schedule
  SCHEDULE: '/schedule',
  
  // Profile
  PROFILE: '/profile',
  SETTINGS: '/settings',
  
  // Admin
  USERS_MANAGEMENT: '/admin/users',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_COURSE_DETAIL: '/admin/courses/:courseId',
  ADMIN_SECTIONS: '/admin/sections',
  ADMIN_ASSIGNMENTS: '/admin/assignments',
  ADMIN_QUIZZES: '/admin/quizzes',
  ADMIN_ASSESSMENTS: '/admin/assessments',
} as const
