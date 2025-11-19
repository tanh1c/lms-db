import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './constants/routes'
import LoginPage from './pages/auth/LoginPage'
import ProtectedRoute from './pages/auth/ProtectedRoute'
import StudentDashboard from './pages/dashboard/StudentDashboard'
import TutorDashboard from './pages/dashboard/TutorDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import { ThemeProvider } from './context/ThemeProvider'
import { AuthProvider } from './context/AuthProvider'
import ProfilePage from './pages/profile/ProfilePage'
import SettingsPage from './pages/profile/SettingsPage'
import CourseListPage from './pages/courses/CourseListPage'
import CourseDetailPage from './pages/courses/CourseDetailPage'
import AssignmentListPage from './pages/assignments/AssignmentListPage'
import AssignmentDetailPage from './pages/assignments/AssignmentDetailPage'
import AssignmentSubmitPage from './pages/assignments/AssignmentSubmitPage'
import QuizListPage from './pages/quizzes/QuizListPage'
import QuizTakePage from './pages/quizzes/QuizTakePage'
import QuizResultPage from './pages/quizzes/QuizResultPage'
import GradeOverviewPage from './pages/grades/GradeOverviewPage'
import GradeDetailPage from './pages/grades/GradeDetailPage'
import SchedulePage from './pages/schedule/SchedulePage'
import SectionPage from './pages/courses/SectionPage'
import UserManagementPage from './pages/admin/UserManagementPage'
import CourseManagementPage from './pages/admin/CourseManagementPage'
import AssignmentManagementPage from './pages/admin/AssignmentManagementPage'
import QuizManagementPage from './pages/admin/QuizManagementPage'
import AssessmentManagementPage from './pages/admin/AssessmentManagementPage'
import ErrorBoundary from './components/common/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          
          <Route
            path={ROUTES.STUDENT_DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.TUTOR_DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={['tutor']}>
                <TutorDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.ADMIN_DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.PROFILE}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.SETTINGS}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.COURSES}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <CourseListPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.COURSE_DETAIL}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <CourseDetailPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.ASSIGNMENTS}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <AssignmentListPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.ASSIGNMENT_DETAIL}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <AssignmentDetailPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.ASSIGNMENT_SUBMIT}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <AssignmentSubmitPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.QUIZZES}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <QuizListPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.QUIZ_TAKE}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <QuizTakePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.QUIZ_RESULT}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <QuizResultPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.GRADES}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <GradeOverviewPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.GRADE_DETAIL}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <GradeDetailPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.SCHEDULE}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <SchedulePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.SECTION_DETAIL}
            element={
              <ProtectedRoute allowedRoles={['student', 'tutor', 'admin']}>
                <SectionPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.USERS_MANAGEMENT}
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.ADMIN_COURSES}
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CourseManagementPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.ADMIN_ASSIGNMENTS}
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AssignmentManagementPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.ADMIN_QUIZZES}
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <QuizManagementPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.ADMIN_ASSESSMENTS}
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AssessmentManagementPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<Navigate to={ROUTES.STUDENT_DASHBOARD} replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

