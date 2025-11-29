import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { studentService, type SectionDetail } from '@/lib/api/studentService'
import { tutorService } from '@/lib/api/tutorService'
import { useAuth } from '@/context/AuthProvider'
import type { Quiz, Assessment, User, Assignment } from '@/types'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import { ArrowLeft, Users, BookOpen, Award, BarChart3, Clock, GraduationCap, FileText, Plus, Edit2, Trash2, Eye, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import CourseContentCard from '@/components/courses/CourseContentCard'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { StudentGradeEntry } from '@/lib/api/tutorService'
import { 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismInputClasses,
} from '@/lib/utils/theme-utils'

export default function SectionPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { courseId, sectionId } = useParams<{ courseId: string; sectionId: string }>()
  const navigate = useNavigate()
  const [sectionDetail, setSectionDetail] = useState<SectionDetail | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [grades, setGrades] = useState<Assessment | null>(null)
  const [students, setStudents] = useState<User[]>([])
  const [studentGrades, setStudentGrades] = useState<StudentGradeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof StudentGradeEntry | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' })
  const neoBrutalismMode = useNeoBrutalismMode()

  // Quiz dialog state
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [quizFormData, setQuizFormData] = useState({
    Grading_method: 'Highest Attemp',
    pass_score: '5',
    Time_limits: '',
    Start_Date: '',
    End_Date: '',
    content: '',
    types: '',
    Weight: '',
    Correct_answer: '',
  })
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [quizStartDate, setQuizStartDate] = useState<Date | undefined>(undefined)
  const [quizEndDate, setQuizEndDate] = useState<Date | undefined>(undefined)
  const [isSavingQuiz, setIsSavingQuiz] = useState(false)

  // Assignment dialog state
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [assignmentFormData, setAssignmentFormData] = useState({
    MaxScore: '10',
    accepted_specification: '',
    submission_deadline: undefined as Date | undefined,
    instructions: '',
    TaskURL: '',
  })
  const [isSavingAssignment, setIsSavingAssignment] = useState(false)

  // View scores/submissions dialogs
  const [viewingQuizScores, setViewingQuizScores] = useState<Quiz | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<any[]>([])
  const [loadingQuizAnswers, setLoadingQuizAnswers] = useState(false)
  const [viewingAssignmentSubmissions, setViewingAssignmentSubmissions] = useState<Assignment | null>(null)
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([])
  const [loadingAssignmentSubmissions, setLoadingAssignmentSubmissions] = useState(false)

  // Edit score dialogs
  const [editingQuizScore, setEditingQuizScore] = useState<{ answer: any; quiz: Quiz } | null>(null)
  const [editingAssignmentScore, setEditingAssignmentScore] = useState<{ submission: any; assignment: Assignment } | null>(null)
  const [editingAssessmentGrades, setEditingAssessmentGrades] = useState<{ grade: StudentGradeEntry } | null>(null)
  const [isSavingScore, setIsSavingScore] = useState(false)
  const [scoreFormData, setScoreFormData] = useState({
    quizScore: '',
    assignmentScore: '',
    assignmentComments: '',
    quizGrade: '',
    assignmentGrade: '',
    midtermGrade: '',
    finalGrade: '',
  })

  useEffect(() => {
    const loadData = async () => {
      if (!courseId || !sectionId || !user) return
      
      try {
        setLoading(true)
        let detail: SectionDetail | null = null
        
        // Load section detail based on role
        if (user.role === 'tutor') {
          detail = await tutorService.getTutorSectionDetail(user.University_ID, sectionId, courseId)
        } else {
          detail = await studentService.getStudentSectionDetail(user.University_ID, sectionId, courseId)
        }
        
        if (detail) {
          setSectionDetail(detail)
          // Load with correct semester based on role
          if (user.role === 'tutor') {
            const [quizzesReload, assignmentsReload, studentsReload, gradesReload] = await Promise.all([
              tutorService.getTutorSectionQuizzes(sectionId, courseId, detail.Semester).catch(() => []),
              tutorService.getTutorSectionAssignments(sectionId, courseId, detail.Semester).catch(() => []),
              tutorService.getTutorSectionStudents(sectionId, courseId, detail.Semester).catch(() => []),
              tutorService.getTutorSectionStudentGrades(sectionId, courseId, detail.Semester).catch(() => []),
            ])
            setQuizzes(removeDuplicateQuizzes(quizzesReload))
            setAssignments(removeDuplicateAssignments(assignmentsReload))
            setStudents(studentsReload)
            setStudentGrades(gradesReload)
            setGrades(null) // Tutors don't see individual student grades
          } else {
          const [quizzesReload, assignmentsReload, gradesReload, studentsReload] = await Promise.all([
            studentService.getStudentSectionQuizzes(user.University_ID, sectionId, courseId, detail.Semester).catch(() => []),
            studentService.getStudentSectionAssignments(user.University_ID, sectionId, courseId, detail.Semester).catch(() => []),
            studentService.getStudentSectionGrades(user.University_ID, sectionId, courseId, detail.Semester).catch(() => null),
            studentService.getStudentSectionStudents(sectionId, courseId, detail.Semester).catch(() => []),
          ])
           setQuizzes(removeDuplicateQuizzes(quizzesReload))
           setAssignments(removeDuplicateAssignments(assignmentsReload))
           setGrades(gradesReload)
           setStudents(studentsReload)
          }
        }
      } catch (error) {
        console.error('Error loading section:', error)
        setError(t('courses.errorLoadingSection') || 'Failed to load section details')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId, sectionId, user])

  // Helper functions to remove duplicates
  const removeDuplicateQuizzes = (quizzes: Quiz[]): Quiz[] => {
    const seen = new Set<number>()
    return quizzes.filter((quiz) => {
      const id = (quiz as any).QuizID || (quiz as any).Assessment_ID
      if (!id || seen.has(id)) {
        return false
      }
      seen.add(id)
      return true
    })
  }

  const removeDuplicateAssignments = (assignments: Assignment[]): Assignment[] => {
    const seen = new Set<number>()
    return assignments.filter((assignment) => {
      const id = (assignment as any).AssignmentID
      if (!id || seen.has(id)) {
        return false
      }
      seen.add(id)
      return true
    })
  }

  // Helper functions
  const timeToMinutes = (timeStr: string | null | undefined): string => {
    if (!timeStr) return ''
    try {
      const parts = timeStr.split(':')
      if (parts.length >= 2) {
        const hours = parseInt(parts[0]) || 0
        const minutes = parseInt(parts[1]) || 0
        return (hours * 60 + minutes).toString()
      }
    } catch (e) {
      console.error('Error converting time to minutes:', e)
    }
    return ''
  }

  // Sort handler for student grades table
  const handleSort = (key: keyof StudentGradeEntry) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Get sorted student grades
  const getSortedStudentGrades = (): StudentGradeEntry[] => {
    if (!sortConfig.key) return studentGrades

    return [...studentGrades].sort((a, b) => {
      const aVal = a[sortConfig.key!]
      const bVal = b[sortConfig.key!]

      // Handle null values
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      // Compare values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return 0
    })
  }

  const getSortIcon = (key: keyof StudentGradeEntry) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  const minutesToTime = (minutesStr: string): string => {
    if (!minutesStr || minutesStr.trim() === '') return ''
    try {
      const minutes = parseInt(minutesStr)
      if (isNaN(minutes) || minutes < 0) return ''
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`
    } catch (e) {
      console.error('Error converting minutes to time:', e)
      return ''
    }
  }

  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  const formatDateToLocalInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Quiz handlers
  const handleAddQuiz = () => {
    if (!sectionDetail || !user) return
    setEditingQuiz(null)
    setQuizStartDate(undefined)
    setQuizEndDate(undefined)
    setQuizFormData({
      Grading_method: 'Highest Attemp',
      pass_score: '5',
      Time_limits: '',
      Start_Date: '',
      End_Date: '',
      content: '',
      types: '',
      Weight: '',
      Correct_answer: '',
    })
    setQuizQuestions([])
    setIsQuizDialogOpen(true)
  }

  const handleEditQuiz = (quiz: Quiz) => {
    if (!sectionDetail || !user) return
    setEditingQuiz(quiz)
    setQuizStartDate(quiz.Start_Date ? new Date(quiz.Start_Date) : undefined)
    setQuizEndDate(quiz.End_Date ? new Date(quiz.End_Date) : undefined)
    setQuizFormData({
      Grading_method: (quiz as any).Grading_method || 'Highest Attemp',
      pass_score: (quiz as any).pass_score?.toString() || '5',
      Time_limits: timeToMinutes((quiz as any).Time_limits),
      Start_Date: quiz.Start_Date ? formatDateToLocalInput(new Date(quiz.Start_Date)) : '',
      End_Date: quiz.End_Date ? formatDateToLocalInput(new Date(quiz.End_Date)) : '',
      content: (quiz as any).content || '',
      types: (quiz as any).types || '',
      Weight: (quiz as any).Weight?.toString() || '',
      Correct_answer: (quiz as any).Correct_answer || '',
    })
    // Load questions if available
    if ((quiz as any).Questions) {
      try {
        const parsedQuestions = JSON.parse((quiz as any).Questions)
        setQuizQuestions(parsedQuestions)
      } catch (error) {
        console.error('Error parsing questions:', error)
        setQuizQuestions([])
      }
    } else {
      setQuizQuestions([])
    }
    setIsQuizDialogOpen(true)
  }

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!user || !sectionDetail) return
    if (!confirm(t('admin.confirmDelete') || 'Are you sure you want to delete this quiz?')) {
      return
    }

    try {
      await tutorService.deleteQuiz(user.University_ID, (quiz as any).QuizID)
      // Reload quizzes - clear first to avoid duplicates
      setQuizzes([])
      const reloaded = await tutorService.getTutorSectionQuizzes(sectionDetail.Section_ID, sectionDetail.Course_ID, sectionDetail.Semester)
      setQuizzes(removeDuplicateQuizzes(reloaded || []))
      alert(t('admin.deleteQuizSuccess') || 'Quiz deleted successfully')
    } catch (error: any) {
      console.error('Error deleting quiz:', error)
      alert(error?.response?.data?.error || error?.message || 'Failed to delete quiz')
    }
  }

  const handleSaveQuiz = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!sectionDetail || !user) return

    if (!quizFormData.content || !quizFormData.Correct_answer) {
      alert(t('admin.fillRequiredFields') || 'Please fill all required fields')
      return
    }

    if (!quizStartDate || !quizEndDate) {
      alert('Please select both start date and end date')
      return
    }

    if (quizStartDate >= quizEndDate) {
      alert('End date must be after start date')
      return
    }

    setIsSavingQuiz(true)
    try {
      const quizData: Omit<Quiz, 'QuizID' | 'Course_Name'> = {
        Section_ID: sectionDetail.Section_ID,
        Course_ID: sectionDetail.Course_ID,
        Semester: sectionDetail.Semester,
        Assessment_ID: 0, // Will be set by backend
        Grading_method: quizFormData.Grading_method,
        pass_score: quizFormData.pass_score ? parseFloat(quizFormData.pass_score) : 5,
        Time_limits: quizFormData.Time_limits ? minutesToTime(quizFormData.Time_limits) : undefined,
        Start_Date: formatDateToLocal(quizStartDate),
        End_Date: formatDateToLocal(quizEndDate),
        content: quizFormData.content,
        types: quizFormData.types || undefined,
        Weight: quizFormData.Weight ? parseFloat(quizFormData.Weight) : undefined,
        Correct_answer: quizFormData.Correct_answer,
        Questions: quizQuestions.length > 0 ? JSON.stringify(quizQuestions, null, 0) : undefined,
      }

      if (editingQuiz) {
        await tutorService.updateQuiz(user.University_ID, (editingQuiz as any).QuizID, quizData)
        alert(t('admin.updateQuizSuccess') || 'Quiz updated successfully')
      } else {
        await tutorService.createQuiz(user.University_ID, quizData)
        alert(t('admin.createQuizSuccess') || 'Quiz created successfully')
      }

      setIsQuizDialogOpen(false)
      // Reload quizzes - clear first to avoid duplicates
      setQuizzes([])
      const reloaded = await tutorService.getTutorSectionQuizzes(sectionDetail.Section_ID, sectionDetail.Course_ID, sectionDetail.Semester)
      setQuizzes(removeDuplicateQuizzes(reloaded || []))
    } catch (error: any) {
      console.error('Error saving quiz:', error)
      alert(error?.response?.data?.error || error?.message || 'Failed to save quiz')
    } finally {
      setIsSavingQuiz(false)
    }
  }

  const handleViewQuizScores = async (quiz: Quiz) => {
    if (!user) return
    setViewingQuizScores(quiz)
    setLoadingQuizAnswers(true)
    try {
      const answers = await tutorService.getQuizAnswers(user.University_ID, (quiz as any).QuizID)
      setQuizAnswers(answers)
    } catch (error: any) {
      console.error('Error loading quiz answers:', error)
      alert(error?.response?.data?.error || error?.message || 'Failed to load quiz answers')
      setQuizAnswers([])
    } finally {
      setLoadingQuizAnswers(false)
    }
  }

  // Assignment handlers
  const handleAddAssignment = () => {
    if (!sectionDetail || !user) return
    setEditingAssignment(null)
    setAssignmentFormData({
      MaxScore: '10',
      accepted_specification: '',
      submission_deadline: undefined,
      instructions: '',
      TaskURL: '',
    })
    setIsAssignmentDialogOpen(true)
  }

  const handleEditAssignment = (assignment: Assignment) => {
    if (!sectionDetail || !user) return
    setEditingAssignment(assignment)
    setAssignmentFormData({
      MaxScore: (assignment as any).MaxScore?.toString() || '10',
      accepted_specification: (assignment as any).accepted_specification || '',
      submission_deadline: (assignment as any).submission_deadline ? new Date((assignment as any).submission_deadline) : undefined,
      instructions: (assignment as any).instructions || '',
      TaskURL: (assignment as any).TaskURL || '',
    })
    setIsAssignmentDialogOpen(true)
  }

  const handleDeleteAssignment = async (assignment: Assignment) => {
    if (!user || !sectionDetail) return
    if (!confirm(t('admin.confirmDelete') || 'Are you sure you want to delete this assignment?')) {
      return
    }

    try {
      await tutorService.deleteAssignment(user.University_ID, (assignment as any).AssignmentID)
      // Reload assignments - clear first to avoid duplicates
      setAssignments([])
      const reloaded = await tutorService.getTutorSectionAssignments(sectionDetail.Section_ID, sectionDetail.Course_ID, sectionDetail.Semester)
      setAssignments(removeDuplicateAssignments(reloaded || []))
      alert(t('admin.deleteAssignmentSuccess') || 'Assignment deleted successfully')
    } catch (error: any) {
      console.error('Error deleting assignment:', error)
      alert(error?.response?.data?.error || error?.message || 'Failed to delete assignment')
    }
  }

  const handleSaveAssignment = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!sectionDetail || !user) return

    if (!assignmentFormData.submission_deadline) {
      alert('Please select a deadline')
      return
    }

    setIsSavingAssignment(true)
    try {
      const deadline = assignmentFormData.submission_deadline
      const year = deadline.getFullYear()
      const month = String(deadline.getMonth() + 1).padStart(2, '0')
      const day = String(deadline.getDate()).padStart(2, '0')
      const hours = String(deadline.getHours()).padStart(2, '0')
      const minutes = String(deadline.getMinutes()).padStart(2, '0')
      const formattedDeadline = `${year}-${month}-${day}T${hours}:${minutes}`

      const assignmentData = {
        Course_ID: sectionDetail.Course_ID,
        Semester: sectionDetail.Semester,
        MaxScore: assignmentFormData.MaxScore ? parseInt(assignmentFormData.MaxScore) : 10,
        accepted_specification: assignmentFormData.accepted_specification || undefined,
        submission_deadline: formattedDeadline,
        instructions: assignmentFormData.instructions || undefined,
        TaskURL: assignmentFormData.TaskURL || undefined,
      }

      if (editingAssignment) {
        await tutorService.updateAssignment(user.University_ID, (editingAssignment as any).AssignmentID, assignmentData)
        alert(t('admin.updateAssignmentSuccess') || 'Assignment updated successfully')
      } else {
        await tutorService.createAssignment(user.University_ID, assignmentData)
        alert(t('admin.createAssignmentSuccess') || 'Assignment created successfully')
      }

      setIsAssignmentDialogOpen(false)
      // Reload assignments - clear first to avoid duplicates
      setAssignments([])
      const reloaded = await tutorService.getTutorSectionAssignments(sectionDetail.Section_ID, sectionDetail.Course_ID, sectionDetail.Semester)
      setAssignments(removeDuplicateAssignments(reloaded || []))
    } catch (error: any) {
      console.error('Error saving assignment:', error)
      alert(error?.response?.data?.error || error?.message || 'Failed to save assignment')
    } finally {
      setIsSavingAssignment(false)
    }
  }

  const handleViewAssignmentSubmissions = async (assignment: Assignment) => {
    if (!user) return
    setViewingAssignmentSubmissions(assignment)
    setLoadingAssignmentSubmissions(true)
    try {
      const submissions = await tutorService.getAssignmentSubmissions(user.University_ID, (assignment as any).AssignmentID)
      setAssignmentSubmissions(submissions)
    } catch (error: any) {
      console.error('Error loading assignment submissions:', error)
      alert(error?.response?.data?.error || error?.message || 'Failed to load assignment submissions')
      setAssignmentSubmissions([])
    } finally {
      setLoadingAssignmentSubmissions(false)
    }
  }

  // Edit score handlers
  const handleEditQuizScore = (answer: any) => {
    if (!viewingQuizScores) return
    setEditingQuizScore({ answer, quiz: viewingQuizScores })
    setScoreFormData({ ...scoreFormData, quizScore: answer.score?.toString() || '' })
  }

  const handleEditAssignmentScore = (submission: any) => {
    if (!viewingAssignmentSubmissions) return
    setEditingAssignmentScore({ submission, assignment: viewingAssignmentSubmissions })
    setScoreFormData({ 
      ...scoreFormData, 
      assignmentScore: submission.score?.toString() || '',
      assignmentComments: submission.Comments || ''
    })
  }

  const handleEditAssessmentGrades = (grade: StudentGradeEntry) => {
    setEditingAssessmentGrades({ grade })
    setScoreFormData({
      ...scoreFormData,
      quizGrade: grade.Quiz_Grade?.toString() || '',
      assignmentGrade: grade.Assignment_Grade?.toString() || '',
      midtermGrade: grade.Midterm_Grade?.toString() || '',
      finalGrade: grade.Final_Grade?.toString() || '',
    })
  }

  const handleSaveQuizScore = async () => {
    if (!user || !editingQuizScore) return
    setIsSavingScore(true)
    try {
      await tutorService.updateQuizAnswerScore(
        user.University_ID,
        editingQuizScore.quiz.QuizID || (editingQuizScore.quiz as any).Assessment_ID,
        editingQuizScore.answer.University_ID,
        parseFloat(scoreFormData.quizScore)
      )
      // Reload quiz answers
      await handleViewQuizScores(editingQuizScore.quiz)
      // Reload student grades to update competencies tab
      if (sectionDetail) {
        const reloaded = await tutorService.getTutorSectionStudentGrades(sectionDetail.Section_ID, sectionDetail.Course_ID, sectionDetail.Semester)
        setStudentGrades(reloaded)
      }
      setEditingQuizScore(null)
      alert(t('admin.updateScoreSuccess') || 'Score updated successfully')
    } catch (error: any) {
      console.error('Error updating quiz score:', error)
      alert(error?.response?.data?.error || error?.message || 'Failed to update score')
    } finally {
      setIsSavingScore(false)
    }
  }

  const handleSaveAssignmentScore = async () => {
    if (!user || !editingAssignmentScore) return
    setIsSavingScore(true)
    try {
      await tutorService.updateAssignmentSubmissionScore(
        user.University_ID,
        (editingAssignmentScore.assignment as any).AssignmentID,
        editingAssignmentScore.submission.University_ID,
        parseFloat(scoreFormData.assignmentScore),
        scoreFormData.assignmentComments || undefined
      )
      // Reload assignment submissions
      await handleViewAssignmentSubmissions(editingAssignmentScore.assignment)
      // Reload student grades to update competencies tab
      if (sectionDetail) {
        const reloaded = await tutorService.getTutorSectionStudentGrades(sectionDetail.Section_ID, sectionDetail.Course_ID, sectionDetail.Semester)
        setStudentGrades(reloaded)
      }
      setEditingAssignmentScore(null)
      alert(t('admin.updateScoreSuccess') || 'Score updated successfully')
    } catch (error: any) {
      console.error('Error updating assignment score:', error)
      alert(error?.response?.data?.error || error?.message || 'Failed to update score')
    } finally {
      setIsSavingScore(false)
    }
  }

  const handleSaveAssessmentGrades = async () => {
    if (!user || !editingAssessmentGrades || !editingAssessmentGrades.grade.Assessment_ID) return
    setIsSavingScore(true)
    try {
      await tutorService.updateAssessmentGrades(
        user.University_ID,
        editingAssessmentGrades.grade.Assessment_ID,
        {
          Quiz_Grade: scoreFormData.quizGrade ? parseFloat(scoreFormData.quizGrade) : null,
          Assignment_Grade: scoreFormData.assignmentGrade ? parseFloat(scoreFormData.assignmentGrade) : null,
          Midterm_Grade: scoreFormData.midtermGrade ? parseFloat(scoreFormData.midtermGrade) : null,
          Final_Grade: scoreFormData.finalGrade ? parseFloat(scoreFormData.finalGrade) : null,
        }
      )
      // Reload student grades
      if (sectionDetail) {
        const reloaded = await tutorService.getTutorSectionStudentGrades(sectionDetail.Section_ID, sectionDetail.Course_ID, sectionDetail.Semester)
        setStudentGrades(reloaded)
      }
      setEditingAssessmentGrades(null)
      alert(t('admin.updateScoreSuccess') || 'Grades updated successfully')
    } catch (error: any) {
      console.error('Error updating assessment grades:', error)
      alert(error?.response?.data?.error || error?.message || 'Failed to update grades')
    } finally {
      setIsSavingScore(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('common.loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardContent className="py-8 text-center">
            <p className={cn(
              "text-lg font-semibold text-red-600 dark:text-red-400 mb-2",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
            )}>{error}</p>
            <Button
              onClick={() => navigate(ROUTES.COURSES)}
              className={cn(
                "mt-4",
                neoBrutalismMode
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : ""
              )}
            >
              {t('courses.backToCourses')}
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (!sectionDetail) {
    return (
      <DashboardLayout>
        <div className={cn(
          "text-[#85878d] dark:text-gray-400",
          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
        )}>{t('courses.sectionNotFound')}</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={`${t('courses.section')} ${sectionDetail.Section_ID} - ${sectionDetail.Course_Name}`}
      subtitle={`${t('courses.courseId')}: ${sectionDetail.Course_ID}`}
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.COURSES)}
          className={cn(
            "mb-4",
            neoBrutalismMode
              ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
              : "border border-[#e5e7e7] dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
          )}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('courses.backToCourses')}</span>
        </Button>

        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-12 h-12 bg-[#e1e2f6] dark:bg-purple-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className={cn(
                  "text-2xl text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>{sectionDetail.Course_Name}</CardTitle>
                <CardDescription className={cn(
                  "text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('courses.section')} {sectionDetail.Section_ID} • {t('courses.semester')}: {sectionDetail.Semester}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className={cn(
                "flex items-center gap-3 p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a]",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <Award className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                <div>
                  <p className={cn(
                    "text-sm font-medium text-[#676767] dark:text-gray-400 mb-1",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>{t('courses.credits')}</p>
                  <p className={cn(
                    "text-lg font-semibold text-[#1f1d39] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{sectionDetail.Credit} {t('courses.credits')}</p>
                </div>
              </div>
              {user?.role === 'tutor' && (
                <div className={cn(
                  "flex items-center gap-3 p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a]",
                  neoBrutalismMode 
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                    : "rounded-lg"
                )}>
                  <Users className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                  <div>
                    <p className={cn(
                      "text-sm font-medium text-[#676767] dark:text-gray-400 mb-1",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>{t('courses.students')}</p>
                    <p className={cn(
                      "text-lg font-semibold text-[#1f1d39] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{students.length} {t('courses.students')}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Overview, Grades, Competencies */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardContent className="pt-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className={cn(
                "grid w-full grid-cols-3 bg-gray-100 dark:bg-[#2a2a2a]",
                neoBrutalismMode && "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
              )}>
                <TabsTrigger 
                  value="overview" 
                  className={cn(
                    "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]",
                    neoBrutalismMode && "data-[state=active]:border-4 data-[state=active]:border-[#1a1a1a] dark:data-[state=active]:border-[#FFFBEB] data-[state=active]:rounded-none data-[state=active]:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:data-[state=active]:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}
                >
                  {t('courses.overview')}
                </TabsTrigger>
                <TabsTrigger 
                  value="grades" 
                  className={cn(
                    "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]",
                    neoBrutalismMode && "data-[state=active]:border-4 data-[state=active]:border-[#1a1a1a] dark:data-[state=active]:border-[#FFFBEB] data-[state=active]:rounded-none data-[state=active]:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:data-[state=active]:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}
                >
                  {t('courses.grades')}
                </TabsTrigger>
                <TabsTrigger 
                  value="competencies" 
                  className={cn(
                    "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]",
                    neoBrutalismMode && "data-[state=active]:border-4 data-[state=active]:border-[#1a1a1a] dark:data-[state=active]:border-[#FFFBEB] data-[state=active]:rounded-none data-[state=active]:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:data-[state=active]:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}
                >
                  {t('courses.competencies')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="space-y-6">
                  {/* Course Content */}
                  <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center",
                          neoBrutalismMode 
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                            : "rounded-lg"
                        )}>
                          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className={cn(
                            "text-xl text-[#1f1d39] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                          )}>{t('courses.courseContent')}</CardTitle>
                          <CardDescription className={cn(
                            "text-[#85878d] dark:text-gray-400",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                          )}>
                            {t('courses.courseMaterials')}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CourseContentCard 
                        courseId={parseInt(sectionDetail.Course_ID) || 0}
                        sectionId={sectionDetail.Section_ID}
                        quizzes={quizzes}
                        assignments={assignments}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="grades" className="space-y-6 mt-6">
                <div className="space-y-4">
                  {/* Quiz Grades / Quiz Overview for Tutor */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                    <h3 className={cn(
                        "text-lg font-semibold text-[#1f1d39] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>{user?.role === 'tutor' ? (t('courses.quizzes') || 'Quizzes') : t('courses.quizGrades')}</h3>
                      {user?.role === 'tutor' && sectionDetail && (
                        <Button
                          onClick={handleAddQuiz}
                          size="sm"
                          className={cn(
                            "bg-[#3bafa8] hover:bg-[#2a8d87] text-white",
                            neoBrutalismMode && "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                          )}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('admin.addQuiz') || 'Add Quiz'}
                        </Button>
                      )}
                    </div>
                    {quizzes.length > 0 ? (
                      <div className="space-y-3">
                        {quizzes.map((quiz: any) => {
                          const isTutor = user?.role === 'tutor'
                          const passed = quiz.score && quiz.pass_score && quiz.score >= quiz.pass_score
                          const statusDisplay = (quiz.status_display || quiz.completion_status || 'Not Taken') as string
                          const statusColors: Record<string, string> = {
                            'Passed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                            'Submitted': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                            'Failed': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                            'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                            'Not Taken': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                          }
                          const statusColor = statusColors[statusDisplay] || statusColors['Not Taken']

                          return (
                            <div
                              key={quiz.QuizID || quiz.Assessment_ID}
                              className={cn(
                                "p-4 bg-white dark:bg-[#1a1a1a] transition-all",
                                neoBrutalismMode
                                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                                  : "border border-[#e5e7e7] dark:border-[#333] rounded-xl hover:shadow-sm transition-shadow"
                              )}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <BarChart3 className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                                    <h4 className={cn(
                                      "font-semibold text-[#1f1d39] dark:text-white",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>{quiz.content}</h4>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-[#85878d] dark:text-gray-400 ml-8">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{quiz.Time_limits}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{t('courses.passScore')}: {quiz.pass_score}</span>
                                    {quiz.Weight && (
                                      <>
                                        <span>•</span>
                                        <span>{t('courses.weight')}: {(quiz.Weight * 100).toFixed(0)}%</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {isTutor ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-[#1f1d39] dark:text-white">
                                            {quiz.SubmissionCount || 0}
                                          </div>
                                          <div className="text-xs text-[#85878d] dark:text-gray-400">{t('courses.submissions') || 'Submissions'}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                            {quiz.PassedCount || 0}
                                          </div>
                                          <div className="text-xs text-[#85878d] dark:text-gray-400">{t('courses.passed') || 'Passed'}</div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleViewQuizScores(quiz)}
                                          className="ml-2"
                                        >
                                          <Eye className="h-4 w-4 mr-1" />
                                          {t('admin.showScore') || 'Scores'}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditQuiz(quiz)}
                                        >
                                          <Edit2 className="h-4 w-4 mr-1" />
                                          {t('admin.edit') || 'Edit'}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDeleteQuiz(quiz)}
                                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                          <Trash2 className="h-4 w-4 mr-1" />
                                          {t('admin.delete') || 'Delete'}
                                        </Button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                  {quiz.score !== null && quiz.score !== undefined && (
                                    <div className="text-right">
                                      <div className={`text-2xl font-bold ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {quiz.score.toFixed(1)}
                                      </div>
                                      <div className="text-xs text-[#85878d] dark:text-gray-400">/ 10</div>
                                    </div>
                                  )}
                                  <Badge className={statusColor}>
                                    {statusDisplay}
                                  </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                              {quiz.Start_Date && quiz.End_Date && (
                                <div className="ml-8 text-xs text-[#85878d] dark:text-gray-400">
                                  {format(new Date(quiz.Start_Date), 'MMM dd, yyyy')} - {format(new Date(quiz.End_Date), 'MMM dd, yyyy')}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#85878d] dark:text-gray-400">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>{t('courses.noQuizGrades')}</p>
                      </div>
                    )}
                  </div>

                  {/* Assignment Grades / Assignments Overview for Tutor */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                    <h3 className={cn(
                        "text-lg font-semibold text-[#1f1d39] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>{user?.role === 'tutor' ? (t('courses.assignments') || 'Assignments') : t('courses.assignmentGrades')}</h3>
                      {user?.role === 'tutor' && sectionDetail && (
                        <Button
                          onClick={handleAddAssignment}
                          size="sm"
                          className={cn(
                            "bg-[#3bafa8] hover:bg-[#2a8d87] text-white",
                            neoBrutalismMode && "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                          )}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('admin.addAssignment') || 'Add Assignment'}
                        </Button>
                      )}
                    </div>
                    {assignments.length > 0 ? (
                      <div className="space-y-3">
                        {assignments.map((assignment: any) => {
                          const isTutor = user?.role === 'tutor'
                          const statusDisplay = (assignment.status_display || assignment.status || 'Not Started') as string
                          const statusColors: Record<string, string> = {
                            'Submitted': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                            'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                            'Overdue': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                            'Not Started': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                          }
                          const statusColor = statusColors[statusDisplay] || statusColors['Not Started']

                          return (
                            <div
                              key={assignment.AssignmentID}
                              className={cn(
                                "p-4 bg-white dark:bg-[#1a1a1a] transition-all",
                                neoBrutalismMode
                                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                                  : "border border-[#e5e7e7] dark:border-[#333] rounded-xl hover:shadow-sm transition-shadow"
                              )}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <FileText className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                                    <h4 className={cn(
                                      "font-semibold text-[#1f1d39] dark:text-white",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>{assignment.instructions || t('courses.assignment')}</h4>
                                  </div>
                                  {assignment.submission_deadline && (
                                    <div className="ml-8 text-sm text-[#85878d] dark:text-gray-400">
                                      {t('courses.deadline')}: {format(new Date(assignment.submission_deadline), 'MMM dd, yyyy HH:mm')}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  {isTutor ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-[#1f1d39] dark:text-white">
                                            {assignment.SubmissionCount || 0}
                                          </div>
                                          <div className="text-xs text-[#85878d] dark:text-gray-400">{t('courses.submissions') || 'Submissions'}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                            {assignment.PendingCount || 0}
                                          </div>
                                          <div className="text-xs text-[#85878d] dark:text-gray-400">{t('courses.pending') || 'Pending'}</div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleViewAssignmentSubmissions(assignment)}
                                          className="ml-2"
                                        >
                                          <Eye className="h-4 w-4 mr-1" />
                                          {t('admin.showScore') || 'Submissions'}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditAssignment(assignment)}
                                        >
                                          <Edit2 className="h-4 w-4 mr-1" />
                                          {t('admin.edit') || 'Edit'}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDeleteAssignment(assignment)}
                                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                          <Trash2 className="h-4 w-4 mr-1" />
                                          {t('admin.delete') || 'Delete'}
                                        </Button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                  {assignment.score !== null && assignment.score !== undefined && (
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-[#1f1d39] dark:text-white">
                                        {assignment.score.toFixed(1)}
                                      </div>
                                      <div className="text-xs text-[#85878d] dark:text-gray-400">/ 10</div>
                                    </div>
                                  )}
                                  <Badge className={statusColor}>
                                    {statusDisplay}
                                  </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#85878d] dark:text-gray-400">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>{t('courses.noAssignmentGrades')}</p>
                      </div>
                    )}
                  </div>

                  {/* Overall Grades - Only for Students */}
                  {grades && user?.role !== 'tutor' && (
                    <div className="mt-6">
                      <h3 className={cn(
                        "text-lg font-semibold text-[#1f1d39] dark:text-white mb-4",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>{t('courses.overallGrades')}</h3>
                      <div className={cn(
                        "p-4 bg-white dark:bg-[#1a1a1a]",
                        neoBrutalismMode
                          ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                          : "border border-[#e5e7e7] dark:border-[#333] rounded-xl"
                      )}>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          {grades.Quiz_Grade !== null && grades.Quiz_Grade !== undefined && (
                            <div>
                              <p className={cn(
                                "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>{t('courses.quizGrade')}</p>
                              <p className={cn(
                                "text-xl font-bold text-[#1f1d39] dark:text-white",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                              )}>{grades.Quiz_Grade.toFixed(1)}</p>
                            </div>
                          )}
                          {grades.Assignment_Grade !== null && grades.Assignment_Grade !== undefined && (
                            <div>
                              <p className={cn(
                                "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>{t('courses.assignmentGrade')}</p>
                              <p className={cn(
                                "text-xl font-bold text-[#1f1d39] dark:text-white",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                              )}>{grades.Assignment_Grade.toFixed(1)}</p>
                            </div>
                          )}
                          {grades.Midterm_Grade !== null && grades.Midterm_Grade !== undefined && (
                            <div>
                              <p className={cn(
                                "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>{t('courses.midtermGrade')}</p>
                              <p className={cn(
                                "text-xl font-bold text-[#1f1d39] dark:text-white",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                              )}>{grades.Midterm_Grade.toFixed(1)}</p>
                            </div>
                          )}
                          {grades.Final_Grade !== null && grades.Final_Grade !== undefined && (
                            <div>
                              <p className={cn(
                                "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>{t('courses.finalGrade')}</p>
                              <p className={cn(
                                "text-xl font-bold text-[#1f1d39] dark:text-white",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                              )}>{grades.Final_Grade.toFixed(1)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="competencies" className="space-y-6 mt-6">
                <div className="space-y-4">
                  {user?.role === 'tutor' ? (
                    // Tutor view: Show grades table
                    <div>
                      <h3 className={cn(
                        "text-lg font-semibold text-[#1f1d39] dark:text-white mb-4",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>{t('courses.studentsInSection')}</h3>
                      {studentGrades.length > 0 ? (
                        <div className={cn(
                          "rounded-lg border overflow-hidden",
                          neoBrutalismMode
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                            : "border border-[#e5e7e7] dark:border-[#333]"
                        )}>
                          <Table>
                            <TableHeader>
                              <TableRow className={neoBrutalismMode ? "border-b-4 border-[#1a1a1a] dark:border-[#FFFBEB]" : ""}>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('Last_Name')}>
                                  <div className="flex items-center">
                                    {t('common.name') || 'Name'}
                                    {getSortIcon('Last_Name')}
                                  </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('University_ID')}>
                                  <div className="flex items-center">
                                    {t('courses.courseId') || 'ID'}
                                    {getSortIcon('University_ID')}
                                  </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('Quiz_Grade')}>
                                  <div className="flex items-center">
                                    {t('courses.quizGrade') || 'Quiz'}
                                    {getSortIcon('Quiz_Grade')}
                                  </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('Assignment_Grade')}>
                                  <div className="flex items-center">
                                    {t('courses.assignmentGrade') || 'Assignment'}
                                    {getSortIcon('Assignment_Grade')}
                                  </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('Midterm_Grade')}>
                                  <div className="flex items-center">
                                    {t('courses.midtermGrade') || 'Midterm'}
                                    {getSortIcon('Midterm_Grade')}
                                  </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('Final_Grade')}>
                                  <div className="flex items-center">
                                    {t('courses.finalGrade') || 'Final'}
                                    {getSortIcon('Final_Grade')}
                                  </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('GPA')}>
                                  <div className="flex items-center">
                                    {t('courses.gpa') || 'GPA'}
                                    {getSortIcon('GPA')}
                                  </div>
                                </TableHead>
                                <TableHead className="text-right">{t('common.actions') || 'Actions'}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getSortedStudentGrades().map((grade, index) => {
                                // Helper function to get grade color
                                const getGradeColor = (score: number | null | undefined): string => {
                                  if (score === null || score === undefined) return 'text-[#85878d] dark:text-gray-400'
                                  if (score >= 8) return 'text-green-600 dark:text-green-400 font-semibold'
                                  if (score >= 6.5) return 'text-blue-600 dark:text-blue-400'
                                  if (score >= 5) return 'text-yellow-600 dark:text-yellow-400'
                                  return 'text-red-600 dark:text-red-400'
                                }

                                return (
                                  <TableRow 
                                    key={grade.University_ID}
                                    className={cn(
                                      neoBrutalismMode 
                                        ? "border-b-2 border-[#1a1a1a] dark:border-[#FFFBEB]" 
                                        : "border-b",
                                      index % 2 === 0 
                                        ? "bg-white dark:bg-[#1a1a1a]" 
                                        : "bg-[#f5f7f9] dark:bg-[#2a2a2a]"
                                    )}
                                  >
                                    <TableCell className="font-medium">
                                      {grade.Last_Name} {grade.First_Name}
                                    </TableCell>
                                    <TableCell>{grade.University_ID}</TableCell>
                                    <TableCell className={getGradeColor(grade.Quiz_Grade)}>
                                      {grade.Quiz_Grade !== null && grade.Quiz_Grade !== undefined 
                                        ? grade.Quiz_Grade.toFixed(1) 
                                        : '-'}
                                    </TableCell>
                                    <TableCell className={getGradeColor(grade.Assignment_Grade)}>
                                      {grade.Assignment_Grade !== null && grade.Assignment_Grade !== undefined 
                                        ? grade.Assignment_Grade.toFixed(1) 
                                        : '-'}
                                    </TableCell>
                                    <TableCell className={getGradeColor(grade.Midterm_Grade)}>
                                      {grade.Midterm_Grade !== null && grade.Midterm_Grade !== undefined 
                                        ? grade.Midterm_Grade.toFixed(1) 
                                        : '-'}
                                    </TableCell>
                                    <TableCell className={getGradeColor(grade.Final_Grade)}>
                                      {grade.Final_Grade !== null && grade.Final_Grade !== undefined 
                                        ? grade.Final_Grade.toFixed(1) 
                                        : '-'}
                                    </TableCell>
                                    <TableCell className={cn("font-semibold", getGradeColor(grade.GPA))}>
                                      {grade.GPA !== null && grade.GPA !== undefined 
                                        ? grade.GPA.toFixed(2) 
                                        : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditAssessmentGrades(grade)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[#85878d] dark:text-gray-400">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>{t('courses.noStudentsEnrolled')}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Student view: Show student list
                  <div>
                    <h3 className={cn(
                      "text-lg font-semibold text-[#1f1d39] dark:text-white mb-4",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                    )}>{t('courses.studentsInSection')}</h3>
                    {students.length > 0 ? (
                      <div className="space-y-3">
                        {students.map((student) => (
                          <div
                            key={student.University_ID}
                            className={cn(
                              "p-4 bg-white dark:bg-[#1a1a1a] transition-all",
                              neoBrutalismMode
                                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                                : "border border-[#e5e7e7] dark:border-[#333] rounded-xl hover:shadow-sm transition-shadow"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0",
                                neoBrutalismMode 
                                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                                  : "rounded-full"
                              )}>
                                <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <h4 className={cn(
                                  "font-semibold text-[#1f1d39] dark:text-white",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                )}>
                                  {student.Last_Name} {student.First_Name}
                                </h4>
                                <div className="flex items-center gap-4 mt-1 text-sm text-[#85878d] dark:text-gray-400">
                                  <span>ID: {student.University_ID}</span>
                                  {student.Email && (
                                    <>
                                      <span>•</span>
                                      <span>{student.Email}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#85878d] dark:text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>{t('courses.noStudentsEnrolled')}</p>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Add/Edit Quiz Dialog */}
        {user?.role === 'tutor' && (
          <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
            <DialogContent className={cn(
              "bg-white dark:bg-[#1a1a1a] max-w-4xl max-h-[90vh] overflow-y-auto",
              "backdrop-blur-none",
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
                : "border-[#e5e7e7] dark:border-[#333]"
            )} style={{ filter: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
              <DialogHeader>
                <DialogTitle className={cn(
                  "text-[#211c37] dark:text-white text-xl",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {editingQuiz ? t('admin.editQuiz') : t('admin.addQuiz')}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSaveQuiz}>
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className={cn(
                      "grid w-full grid-cols-2 mb-4",
                      neoBrutalismMode 
                        ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                        : ""
                    )}>
                      <TabsTrigger value="basic" className={cn(
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {t('admin.basicInfo') || 'Basic Info'}
                      </TabsTrigger>
                      <TabsTrigger value="questions" className={cn(
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {t('admin.questions')} ({quizQuestions.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="mt-0">
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="course-id" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.courseId')} *
                          </Label>
                          <Input
                            id="course-id"
                            value={sectionDetail?.Course_ID || ''}
                            readOnly
                            disabled
                            className={cn(
                              "bg-gray-100 dark:bg-[#2a2a2a] text-[#211c37] dark:text-white cursor-not-allowed",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="section-id" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.sectionId')} *
                          </Label>
                          <Input
                            id="section-id"
                            value={sectionDetail?.Section_ID || ''}
                            readOnly
                            disabled
                            className={cn(
                              "bg-gray-100 dark:bg-[#2a2a2a] text-[#211c37] dark:text-white cursor-not-allowed",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="semester" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.semester')} *
                          </Label>
                          <Input
                            id="semester"
                            value={sectionDetail?.Semester || ''}
                            readOnly
                            disabled
                            className={cn(
                              "bg-gray-100 dark:bg-[#2a2a2a] text-[#211c37] dark:text-white cursor-not-allowed",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pass-score" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.passScore')}
                          </Label>
                          <Input
                            id="pass-score"
                            type="number"
                            step="0.1"
                            value={quizFormData.pass_score}
                            onChange={(e) => setQuizFormData({ ...quizFormData, pass_score: e.target.value })}
                            placeholder="5"
                            className={cn(
                              "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time-limit" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.timeLimit')} * <span className="text-xs text-gray-500 dark:text-gray-400">(minutes)</span>
                          </Label>
                          <Input
                            id="time-limit"
                            type="number"
                            min="1"
                            step="1"
                            value={quizFormData.Time_limits}
                            onChange={(e) => setQuizFormData({ ...quizFormData, Time_limits: e.target.value })}
                            placeholder="30"
                            className={cn(
                              "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="grading-method" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.gradingMethod')}
                          </Label>
                          <Select 
                            value={quizFormData.Grading_method} 
                            onValueChange={(value) => setQuizFormData({ ...quizFormData, Grading_method: value })}
                          >
                            <SelectTrigger className={cn(
                              "bg-white dark:bg-[#2a2a2a]",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Highest Attemp">Highest Attemp</SelectItem>
                              <SelectItem value="Last Attemp">Last Attemp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="start-date" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.startDate')} *
                          </Label>
                          <DateTimePicker
                            date={quizStartDate}
                            onDateChange={(date) => {
                              setQuizStartDate(date)
                              if (date) {
                                setQuizFormData({ ...quizFormData, Start_Date: formatDateToLocalInput(date) })
                              }
                            }}
                            placeholder="Select start date and time"
                            className={cn(
                              "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end-date" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.endDate')} *
                          </Label>
                          <DateTimePicker
                            date={quizEndDate}
                            onDateChange={(date) => {
                              setQuizEndDate(date)
                              if (date) {
                                setQuizFormData({ ...quizFormData, End_Date: formatDateToLocalInput(date) })
                              }
                            }}
                            placeholder="Select end date and time"
                            minDate={quizStartDate}
                            className={cn(
                              "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.type')}
                          </Label>
                          <Input
                            id="type"
                            value={quizFormData.types}
                            onChange={(e) => setQuizFormData({ ...quizFormData, types: e.target.value })}
                            placeholder="Multiple Choice"
                            className={cn(
                              "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weight" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.weight')}
                          </Label>
                          <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            value={quizFormData.Weight}
                            onChange={(e) => setQuizFormData({ ...quizFormData, Weight: e.target.value })}
                            placeholder="0.3"
                            className={cn(
                              "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="content" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.content')} *
                          </Label>
                          <Input
                            id="content"
                            value={quizFormData.content}
                            onChange={(e) => setQuizFormData({ ...quizFormData, content: e.target.value })}
                            placeholder="Quiz about Chapter 1"
                            className={cn(
                              "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="correct-answer" className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {t('admin.correctAnswer')} *
                          </Label>
                          <Input
                            id="correct-answer"
                            value={quizFormData.Correct_answer}
                            onChange={(e) => setQuizFormData({ ...quizFormData, Correct_answer: e.target.value })}
                            placeholder="A"
                            className={cn(
                              "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                              getNeoBrutalismInputClasses(neoBrutalismMode)
                            )}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="questions" className="mt-0">
                      <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                          <Label className={cn(
                            "text-lg font-semibold text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                          )}>
                            {t('admin.questions') || 'Questions'} ({quizQuestions.length})
                          </Label>
                          <Button
                            type="button"
                            onClick={() => {
                              setQuizQuestions([...quizQuestions, {
                                question: { vi: '', en: '' },
                                answers: {
                                  A: { vi: '', en: '' },
                                  B: { vi: '', en: '' },
                                  C: { vi: '', en: '' },
                                  D: { vi: '', en: '' },
                                },
                                correct: 'A'
                              }])
                            }}
                            className={cn(
                              neoBrutalismMode 
                                ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                                : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                            )}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.addQuestion')}</span>
                          </Button>
                        </div>

                        <ScrollArea className={cn(
                          "h-[500px] rounded-md border p-4",
                          neoBrutalismMode 
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                            : "border-[#e5e7e7] dark:border-[#333]"
                        )}>
                          <div className="space-y-4">
                            {quizQuestions.map((question, qIndex) => (
                              <div
                                key={qIndex}
                                className={cn(
                                  "p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-md border",
                                  neoBrutalismMode
                                    ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                    : "border-[#e5e7e7] dark:border-[#333]"
                                )}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <Badge className={cn(
                                    "bg-[#3bafa8] text-white",
                                    neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                                  )}>
                                    Question {qIndex + 1}
                                  </Badge>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setQuizQuestions(quizQuestions.filter((_, i) => i !== qIndex))
                                    }}
                                    className={cn(
                                      "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400",
                                      neoBrutalismMode 
                                        ? "border-4 border-red-600 dark:border-red-400 rounded-none"
                                        : ""
                                    )}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="space-y-2 mb-4">
                                  <Label className={cn(
                                    "text-[#211c37] dark:text-white",
                                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                  )}>
                                    Question (Vietnamese) <span className="text-gray-500 dark:text-gray-400 text-xs">(at least one required)</span>
                                  </Label>
                                  <Input
                                    value={question.question.vi}
                                    onChange={(e) => {
                                      const newQuestions = [...quizQuestions]
                                      newQuestions[qIndex].question.vi = e.target.value
                                      setQuizQuestions(newQuestions)
                                    }}
                                    placeholder="Nhập câu hỏi bằng tiếng Việt (tùy chọn)"
                                    className={cn(
                                      "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                                      getNeoBrutalismInputClasses(neoBrutalismMode)
                                    )}
                                  />
                                  <Label className={cn(
                                    "text-[#211c37] dark:text-white",
                                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                  )}>
                                    Question (English) <span className="text-gray-500 dark:text-gray-400 text-xs">(at least one required)</span>
                                  </Label>
                                  <Input
                                    value={question.question.en}
                                    onChange={(e) => {
                                      const newQuestions = [...quizQuestions]
                                      newQuestions[qIndex].question.en = e.target.value
                                      setQuizQuestions(newQuestions)
                                    }}
                                    placeholder="Enter question in English (optional)"
                                    className={cn(
                                      "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                                      getNeoBrutalismInputClasses(neoBrutalismMode)
                                    )}
                                  />
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className={cn(
                                      "text-[#211c37] dark:text-white font-semibold",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>
                                      Answers ({Object.keys(question.answers).length}):
                                    </Label>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newQuestions = [...quizQuestions]
                                          const answerKeys = Object.keys(newQuestions[qIndex].answers)
                                          const lastKey = answerKeys[answerKeys.length - 1]
                                          const nextKey = String.fromCharCode(lastKey.charCodeAt(0) + 1)
                                          newQuestions[qIndex].answers[nextKey] = { vi: '', en: '' }
                                          setQuizQuestions(newQuestions)
                                        }}
                                        className={cn(
                                          "border-[#3bafa8] text-[#3bafa8] hover:bg-[#3bafa8] hover:text-white",
                                          neoBrutalismMode ? "border-2 border-[#3bafa8] rounded-none" : ""
                                        )}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        <span className="text-xs">Add Answer</span>
                                      </Button>
                                      {Object.keys(question.answers).length > 2 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const newQuestions = [...quizQuestions]
                                            const answerKeys = Object.keys(newQuestions[qIndex].answers).sort()
                                            const lastKey = answerKeys[answerKeys.length - 1]
                                            delete newQuestions[qIndex].answers[lastKey]
                                            if (newQuestions[qIndex].correct === lastKey) {
                                              newQuestions[qIndex].correct = answerKeys[0]
                                            }
                                            setQuizQuestions(newQuestions)
                                          }}
                                          className={cn(
                                            "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400",
                                            neoBrutalismMode ? "border-2 border-red-600 dark:border-red-400 rounded-none" : ""
                                          )}
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          <span className="text-xs">Remove</span>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  {Object.keys(question.answers).sort().map((option) => (
                                    <div key={option} className={cn(
                                      "p-3 rounded-md border",
                                      question.correct === option
                                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                                        : "bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-[#333]",
                                      neoBrutalismMode && question.correct === option
                                        ? "border-2 border-green-600 dark:border-green-400 rounded-none"
                                        : ""
                                    )}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <input
                                          type="radio"
                                          name={`correct-${qIndex}`}
                                          checked={question.correct === option}
                                          onChange={() => {
                                            const newQuestions = [...quizQuestions]
                                            newQuestions[qIndex].correct = option
                                            setQuizQuestions(newQuestions)
                                          }}
                                          className="w-4 h-4 text-[#3bafa8]"
                                        />
                                        <Label className={cn(
                                          "font-semibold text-[#211c37] dark:text-white",
                                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                        )}>
                                          {option}
                                        </Label>
                                        {question.correct === option && (
                                          <Badge className={cn(
                                            "bg-green-500 text-white text-xs",
                                            neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                                          )}>
                                            Correct
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <div>
                                          <Label className={cn(
                                            "text-xs text-gray-600 dark:text-gray-400 mb-1 block",
                                            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                          )}>
                                            Vietnamese <span className="text-gray-400">(optional)</span>
                                          </Label>
                                          <Input
                                            value={question.answers[option].vi}
                                            onChange={(e) => {
                                              const newQuestions = [...quizQuestions]
                                              newQuestions[qIndex].answers[option].vi = e.target.value
                                              setQuizQuestions(newQuestions)
                                            }}
                                            placeholder={`Đáp án ${option} bằng tiếng Việt (tùy chọn)`}
                                            className={cn(
                                              "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                                              getNeoBrutalismInputClasses(neoBrutalismMode)
                                            )}
                                          />
                                        </div>
                                        <div>
                                          <Label className={cn(
                                            "text-xs text-gray-600 dark:text-gray-400 mb-1 block",
                                            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                          )}>
                                            English <span className="text-gray-400">(optional)</span>
                                          </Label>
                                          <Input
                                            value={question.answers[option].en}
                                            onChange={(e) => {
                                              const newQuestions = [...quizQuestions]
                                              newQuestions[qIndex].answers[option].en = e.target.value
                                              setQuizQuestions(newQuestions)
                                            }}
                                            placeholder={`Answer ${option} in English (optional)`}
                                            className={cn(
                                              "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                                              getNeoBrutalismInputClasses(neoBrutalismMode)
                                            )}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {quizQuestions.length === 0 && (
                              <div className={cn(
                                "text-center py-8 text-gray-500 dark:text-gray-400",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>
                                {t('admin.noQuestions')}
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </TabsContent>
                  </Tabs>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsQuizDialogOpen(false)}
                    className={cn(
                      "border-[#e5e7e7] dark:border-[#333]",
                      neoBrutalismMode 
                        ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                        : ""
                    )}
                  >
                    <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.cancel')}</span>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingQuiz}
                    className={cn(
                      neoBrutalismMode 
                        ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                        : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                    )}
                  >
                    {isSavingQuiz ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>
                      {editingQuiz ? t('admin.update') : t('admin.addNew')}
                    </span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Add/Edit Assignment Dialog */}
        {user?.role === 'tutor' && (
          <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
            <DialogContent className={cn(
              "bg-white dark:bg-[#1a1a1a] max-w-3xl max-h-[90vh] overflow-y-auto",
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
                : "border-[#e5e7e7] dark:border-[#333]"
            )}>
              <DialogHeader>
                <DialogTitle className={cn(
                  "text-[#211c37] dark:text-white text-xl",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {editingAssignment ? t('admin.editAssignment') : t('admin.addAssignment')}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSaveAssignment}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-id" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.courseId')} *
                    </Label>
                    <Input
                      id="course-id"
                      value={sectionDetail?.Course_ID || ''}
                      readOnly
                      disabled
                      className={cn(
                        "bg-gray-100 dark:bg-[#2a2a2a] text-[#211c37] dark:text-white cursor-not-allowed",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.semester')} *
                    </Label>
                    <Input
                      id="semester"
                      value={sectionDetail?.Semester || ''}
                      readOnly
                      disabled
                      className={cn(
                        "bg-gray-100 dark:bg-[#2a2a2a] text-[#211c37] dark:text-white cursor-not-allowed",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-score" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.maxScore')}
                    </Label>
                    <Input
                      id="max-score"
                      type="number"
                      value={assignmentFormData.MaxScore}
                      onChange={(e) => setAssignmentFormData({ ...assignmentFormData, MaxScore: e.target.value })}
                      placeholder="10"
                      className={cn(
                        "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.deadline')} *
                    </Label>
                    <DateTimePicker
                      date={assignmentFormData.submission_deadline}
                      onDateChange={(date) => setAssignmentFormData({ ...assignmentFormData, submission_deadline: date })}
                      placeholder={t('admin.deadline') || "Select deadline"}
                      className={cn(
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                      minDate={new Date()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accepted-format" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.acceptedFormat')}
                    </Label>
                    <Input
                      id="accepted-format"
                      value={assignmentFormData.accepted_specification}
                      onChange={(e) => setAssignmentFormData({ ...assignmentFormData, accepted_specification: e.target.value })}
                      placeholder="pdf,doc,docx"
                      className={cn(
                        "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="instructions" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.instructions')}
                    </Label>
                    <Textarea
                      id="instructions"
                      value={assignmentFormData.instructions}
                      onChange={(e) => setAssignmentFormData({ ...assignmentFormData, instructions: e.target.value })}
                      placeholder="Assignment instructions..."
                      className={cn(
                        "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="task-url" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.taskURL')} <span className="text-gray-500 dark:text-gray-400 text-sm">({t('common.optional')})</span>
                    </Label>
                    <Input
                      id="task-url"
                      type="url"
                      value={assignmentFormData.TaskURL}
                      onChange={(e) => setAssignmentFormData({ ...assignmentFormData, TaskURL: e.target.value })}
                      placeholder="https://example.com/assignment.pdf"
                      className={cn(
                        "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAssignmentDialogOpen(false)}
                    className={cn(
                      "border-[#e5e7e7] dark:border-[#333]",
                      neoBrutalismMode 
                        ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                        : ""
                    )}
                  >
                    <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.cancel')}</span>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingAssignment}
                    className={cn(
                      neoBrutalismMode 
                        ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                        : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                    )}
                  >
                    {isSavingAssignment ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>
                      {editingAssignment ? t('admin.update') : t('admin.addNew')}
                    </span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Quiz Scores Dialog */}
        {user?.role === 'tutor' && (
          <Dialog open={!!viewingQuizScores} onOpenChange={(open) => !open && setViewingQuizScores(null)}>
            {viewingQuizScores && (
              <DialogContent className={cn(
                "bg-white dark:bg-[#1a1a1a] max-w-5xl max-h-[90vh] overflow-y-auto",
                "backdrop-blur-none",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
                  : "border-[#e5e7e7] dark:border-[#333]"
              )} style={{ filter: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                <DialogHeader>
                  <DialogTitle className={cn(
                    "text-xl text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {t('admin.quizScores') || 'Quiz Scores'} - {(viewingQuizScores as any).content}
                  </DialogTitle>
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400 mt-1",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {sectionDetail?.Course_ID} - {sectionDetail?.Section_ID} ({quizAnswers.length} {t('admin.students') || 'students'})
                  </p>
                </DialogHeader>
                {loadingQuizAnswers ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-[#3bafa8]" />
                  </div>
                ) : quizAnswers.length === 0 ? (
                  <div className={cn(
                    "text-center py-8 text-gray-500 dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.noQuizAnswers') || 'No students have taken this quiz yet.'}
                  </div>
                ) : (
                  <ScrollArea className={cn(
                    "max-h-[70vh] rounded-md border p-4",
                    neoBrutalismMode 
                      ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : "border-[#e5e7e7] dark:border-[#333]"
                  )}>
                    <div className="space-y-4">
                      {quizAnswers.map((answer, idx) => {
                        const passed = answer.score !== null && answer.pass_score !== null && answer.score >= answer.pass_score
                        let parsedResponses: Record<string, string> | null = null
                        try {
                          if (answer.Responses) {
                            parsedResponses = JSON.parse(answer.Responses)
                          }
                        } catch (e) {
                          console.error('Error parsing responses:', e)
                        }
                        
                        return (
                          <div
                            key={`${answer.University_ID}-${answer.QuizID}`}
                            className={cn(
                              "p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-md border w-full",
                              neoBrutalismMode
                                ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                : "border-[#e5e7e7] dark:border-[#333]"
                            )}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge className={cn(
                                    "bg-[#3bafa8] text-white flex-shrink-0 text-base px-3 py-1",
                                    neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                                  )}>
                                    #{idx + 1}
                                  </Badge>
                                  <div>
                                    <p className={cn(
                                      "text-base font-semibold text-[#211c37] dark:text-white",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>
                                      {answer.Last_Name} {answer.First_Name}
                                    </p>
                                    <p className={cn(
                                      "text-sm text-gray-500 dark:text-gray-400",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>
                                      ID: {answer.University_ID}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className={cn(
                                        "text-xs text-gray-500 dark:text-gray-400",
                                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                      )}>
                                        {t('admin.score') || 'Score'}:
                                      </span>
                                      <p className={cn(
                                        "text-lg font-bold",
                                        answer.score !== null
                                          ? (passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")
                                          : "text-gray-400 dark:text-gray-500",
                                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                      )}>
                                        {answer.score !== null ? answer.score.toFixed(2) : 'N/A'}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditQuizScore(answer)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div>
                                    <span className={cn(
                                      "text-xs text-gray-500 dark:text-gray-400",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>
                                      {t('admin.passScore') || 'Pass Score'}:
                                    </span>
                                    <p className={cn(
                                      "text-lg font-semibold text-[#211c37] dark:text-white",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>
                                      {answer.pass_score !== null ? answer.pass_score.toFixed(1) : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className={cn(
                                      "text-xs text-gray-500 dark:text-gray-400",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>
                                      {t('admin.status') || 'Status'}:
                                    </span>
                                    <div className="mt-1">
                                      <Badge className={cn(
                                        passed
                                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                        neoBrutalismMode 
                                          ? (passed ? "border-2 border-green-600 dark:border-green-400 rounded-none" : "border-2 border-red-600 dark:border-red-400 rounded-none")
                                          : ""
                                      )}>
                                        {passed ? (t('admin.passed') || 'Passed') : (t('admin.failed') || 'Failed')}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <span className={cn(
                                      "text-xs text-gray-500 dark:text-gray-400",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>
                                      {t('admin.completionStatus') || 'Completion'}:
                                    </span>
                                    <p className={cn(
                                      "text-sm text-[#211c37] dark:text-white mt-1",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>
                                      {answer.completion_status || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                {parsedResponses && Object.keys(parsedResponses).length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-[#e5e7e7] dark:border-[#333]">
                                    <p className={cn(
                                      "text-sm font-semibold text-[#211c37] dark:text-white mb-2",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>
                                      {t('admin.responses') || 'Responses'}:
                                    </p>
                                    <div className="space-y-2">
                                      {Object.entries(parsedResponses).map(([questionKey, answerKey]) => (
                                        <div key={questionKey} className={cn(
                                          "p-2 bg-white dark:bg-[#2a2a2a] rounded border text-sm",
                                          neoBrutalismMode
                                            ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                            : "border-[#e5e7e7] dark:border-[#333]"
                                        )}>
                                          <span className={cn(
                                            "font-medium text-[#211c37] dark:text-white",
                                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                          )}>
                                            Q{questionKey}:
                                          </span>
                                          <span className={cn(
                                            "ml-2 text-gray-600 dark:text-gray-400",
                                            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                          )}>
                                            {answerKey}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </DialogContent>
            )}
          </Dialog>
        )}

        {/* Assignment Submissions Dialog */}
        {user?.role === 'tutor' && (
          <Dialog open={!!viewingAssignmentSubmissions} onOpenChange={(open) => !open && setViewingAssignmentSubmissions(null)}>
            {viewingAssignmentSubmissions && (
              <DialogContent className={cn(
                "bg-white dark:bg-[#1a1a1a] max-w-5xl max-h-[90vh] overflow-y-auto",
                "backdrop-blur-none",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
                  : "border-[#e5e7e7] dark:border-[#333]"
              )} style={{ filter: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                <DialogHeader>
                  <DialogTitle className={cn(
                    "text-xl text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {t('admin.assignmentSubmissions') || 'Assignment Submissions'} - {(viewingAssignmentSubmissions as any).instructions ? ((viewingAssignmentSubmissions as any).instructions.substring(0, 50) + ((viewingAssignmentSubmissions as any).instructions.length > 50 ? '...' : '')) : `Assignment #${(viewingAssignmentSubmissions as any).AssignmentID}`}
                  </DialogTitle>
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400 mt-1",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {sectionDetail?.Course_ID} ({sectionDetail?.Semester}) - {assignmentSubmissions.length} {t('admin.students') || 'students'}
                  </p>
                </DialogHeader>
                {loadingAssignmentSubmissions ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-[#3bafa8]" />
                  </div>
                ) : assignmentSubmissions.length === 0 ? (
                  <div className={cn(
                    "text-center py-8 text-gray-500 dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.noAssignmentSubmissions') || 'No students have submitted this assignment yet.'}
                  </div>
                ) : (
                  <ScrollArea className={cn(
                    "max-h-[70vh] rounded-md border p-4",
                    neoBrutalismMode 
                      ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : "border-[#e5e7e7] dark:border-[#333]"
                  )}>
                    <div className="space-y-4">
                      {assignmentSubmissions.map((submission, idx) => {
                        const passed = submission.score !== null && submission.score !== undefined && submission.MaxScore && submission.score >= submission.MaxScore * 0.5
                        return (
                          <div key={idx} className={cn(
                            "p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-md border w-full",
                            neoBrutalismMode
                              ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                              : "border-[#e5e7e7] dark:border-[#333]"
                          )}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge className={cn(
                                    "bg-[#3bafa8] text-white flex-shrink-0 text-base px-3 py-1",
                                    neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                                  )}>
                                    #{idx + 1}
                                  </Badge>
                                  <div>
                                    <p className={cn(
                                      "text-base font-semibold text-[#211c37] dark:text-white",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>
                                      {submission.Last_Name} {submission.First_Name}
                                    </p>
                                    <p className={cn(
                                      "text-sm text-gray-500 dark:text-gray-400",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>
                                      ID: {submission.University_ID}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <Badge className={cn(
                                submission.status === 'Submitted' 
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                neoBrutalismMode 
                                  ? "border-2 rounded-none"
                                  : ""
                              )}>
                                {submission.status || 'Pending'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className={cn(
                                    "text-xs text-gray-500 dark:text-gray-400",
                                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                  )}>
                                    {t('admin.score') || 'Score'}:
                                  </span>
                                  <p className={cn(
                                    "text-lg font-bold",
                                    submission.score !== null && submission.score !== undefined
                                      ? (passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")
                                    : "text-gray-400 dark:text-gray-500",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>
                                      {submission.score !== null && submission.score !== undefined
                                        ? `${submission.score.toFixed(2)} / ${submission.MaxScore || 10}`
                                        : 'N/A'}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditAssignmentScore(submission)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              <div>
                                <span className={cn(
                                  "text-xs text-gray-500 dark:text-gray-400",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {t('admin.submissionDeadline') || 'Deadline'}:
                                </span>
                                <p className={cn(
                                  "text-lg font-semibold text-[#211c37] dark:text-white",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                )}>
                                  {submission.submission_deadline ? new Date(submission.submission_deadline).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className={cn(
                                  "text-xs text-gray-500 dark:text-gray-400",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {t('admin.submitDate') || 'Submit Date'}:
                                </span>
                                <p className={cn(
                                  "text-lg font-semibold text-[#211c37] dark:text-white",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                )}>
                                  {submission.SubmitDate ? new Date(submission.SubmitDate).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className={cn(
                                  "text-xs text-gray-500 dark:text-gray-400",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {t('admin.lateSubmission') || 'Late'}:
                                </span>
                                <p className={cn(
                                  "text-lg font-semibold text-[#211c37] dark:text-white",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                )}>
                                  {submission.late_flag_indicator ? t('admin.yes') || 'Yes' : t('admin.no') || 'No'}
                                </p>
                              </div>
                              {submission.accepted_specification && (
                                <div className="col-span-2 md:col-span-4">
                                  <span className={cn(
                                    "text-xs text-gray-500 dark:text-gray-400",
                                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                  )}>
                                    {t('admin.acceptedFormat')}:
                                  </span>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {submission.accepted_specification}
                                  </p>
                                </div>
                              )}
                              {submission.attached_files && (
                                <div className="col-span-2 md:col-span-4">
                                  <span className={cn(
                                    "text-xs text-gray-500 dark:text-gray-400",
                                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                  )}>
                                    {t('admin.attachedFiles') || 'Attached Files'}:
                                  </span>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {submission.attached_files}
                                  </p>
                                </div>
                              )}
                              {submission.Comments && (
                                <div className="col-span-2 md:col-span-4">
                                  <span className={cn(
                                    "text-xs text-gray-500 dark:text-gray-400",
                                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                  )}>
                                    {t('admin.comments') || 'Comments'}:
                                  </span>
                                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                    {submission.Comments}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </DialogContent>
            )}
          </Dialog>
        )}

        {/* Edit Quiz Score Dialog */}
        {editingQuizScore && (
          <Dialog open={!!editingQuizScore} onOpenChange={(open) => !open && setEditingQuizScore(null)}>
            <DialogContent className={cn(
              "bg-white dark:bg-[#1a1a1a]",
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
                : "border-[#e5e7e7] dark:border-[#333]"
            )}>
              <DialogHeader>
                <DialogTitle className={cn(
                  "text-xl text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {t('admin.editScore') || 'Edit Quiz Score'}
                </DialogTitle>
                <p className={cn(
                  "text-sm text-[#85878d] dark:text-gray-400 mt-1",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {editingQuizScore.answer.Last_Name} {editingQuizScore.answer.First_Name} (ID: {editingQuizScore.answer.University_ID})
                </p>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="quiz-score" className={cn(
                    "text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>
                    {t('admin.score') || 'Score'} (0-10)
                  </Label>
                  <Input
                    id="quiz-score"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scoreFormData.quizScore}
                    onChange={(e) => setScoreFormData({ ...scoreFormData, quizScore: e.target.value })}
                    className={cn(
                      "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                      getNeoBrutalismInputClasses(neoBrutalismMode)
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingQuizScore(null)}
                  className={cn(
                    "border-[#e5e7e7] dark:border-[#333]",
                    neoBrutalismMode 
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                      : ""
                  )}
                >
                  <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('common.cancel')}</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveQuizScore}
                  disabled={isSavingScore}
                  className={cn(
                    neoBrutalismMode 
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                      : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                  )}
                >
                  {isSavingScore ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>
                    {t('common.save')}
                  </span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Assignment Score Dialog */}
        {editingAssignmentScore && (
          <Dialog open={!!editingAssignmentScore} onOpenChange={(open) => !open && setEditingAssignmentScore(null)}>
            <DialogContent className={cn(
              "bg-white dark:bg-[#1a1a1a]",
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
                : "border-[#e5e7e7] dark:border-[#333]"
            )}>
              <DialogHeader>
                <DialogTitle className={cn(
                  "text-xl text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {t('admin.editScore') || 'Edit Assignment Score'}
                </DialogTitle>
                <p className={cn(
                  "text-sm text-[#85878d] dark:text-gray-400 mt-1",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {editingAssignmentScore.submission.Last_Name} {editingAssignmentScore.submission.First_Name} (ID: {editingAssignmentScore.submission.University_ID})
                </p>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment-score" className={cn(
                    "text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>
                    {t('admin.score') || 'Score'} (Max: {editingAssignmentScore.submission.MaxScore || 10})
                  </Label>
                  <Input
                    id="assignment-score"
                    type="number"
                    min="0"
                    max={editingAssignmentScore.submission.MaxScore || 10}
                    step="0.1"
                    value={scoreFormData.assignmentScore}
                    onChange={(e) => setScoreFormData({ ...scoreFormData, assignmentScore: e.target.value })}
                    className={cn(
                      "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                      getNeoBrutalismInputClasses(neoBrutalismMode)
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-comments" className={cn(
                    "text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>
                    {t('admin.comments') || 'Comments'} <span className="text-gray-500 dark:text-gray-400 text-sm">({t('common.optional')})</span>
                  </Label>
                  <Textarea
                    id="assignment-comments"
                    value={scoreFormData.assignmentComments}
                    onChange={(e) => setScoreFormData({ ...scoreFormData, assignmentComments: e.target.value })}
                    placeholder="Add comments..."
                    className={cn(
                      "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                      getNeoBrutalismInputClasses(neoBrutalismMode)
                    )}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingAssignmentScore(null)}
                  className={cn(
                    "border-[#e5e7e7] dark:border-[#333]",
                    neoBrutalismMode 
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                      : ""
                  )}
                >
                  <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('common.cancel')}</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAssignmentScore}
                  disabled={isSavingScore}
                  className={cn(
                    neoBrutalismMode 
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                      : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                  )}
                >
                  {isSavingScore ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>
                    {t('common.save')}
                  </span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Assessment Grades Dialog */}
        {editingAssessmentGrades && (
          <Dialog open={!!editingAssessmentGrades} onOpenChange={(open) => !open && setEditingAssessmentGrades(null)}>
            <DialogContent className={cn(
              "bg-white dark:bg-[#1a1a1a]",
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
                : "border-[#e5e7e7] dark:border-[#333]"
            )}>
              <DialogHeader>
                <DialogTitle className={cn(
                  "text-xl text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {t('admin.editGrades') || 'Edit Assessment Grades'}
                </DialogTitle>
                <p className={cn(
                  "text-sm text-[#85878d] dark:text-gray-400 mt-1",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {editingAssessmentGrades.grade.Last_Name} {editingAssessmentGrades.grade.First_Name} (ID: {editingAssessmentGrades.grade.University_ID})
                </p>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiz-grade" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('courses.quizGrade') || 'Quiz Grade'}
                    </Label>
                    <Input
                      id="quiz-grade"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={scoreFormData.quizGrade}
                      onChange={(e) => setScoreFormData({ ...scoreFormData, quizGrade: e.target.value })}
                      placeholder="0-10"
                      className={cn(
                        "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignment-grade" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('courses.assignmentGrade') || 'Assignment Grade'}
                    </Label>
                    <Input
                      id="assignment-grade"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={scoreFormData.assignmentGrade}
                      onChange={(e) => setScoreFormData({ ...scoreFormData, assignmentGrade: e.target.value })}
                      placeholder="0-10"
                      className={cn(
                        "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="midterm-grade" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('courses.midtermGrade') || 'Midterm Grade'}
                    </Label>
                    <Input
                      id="midterm-grade"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={scoreFormData.midtermGrade}
                      onChange={(e) => setScoreFormData({ ...scoreFormData, midtermGrade: e.target.value })}
                      placeholder="0-10"
                      className={cn(
                        "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="final-grade" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('courses.finalGrade') || 'Final Grade'}
                    </Label>
                    <Input
                      id="final-grade"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={scoreFormData.finalGrade}
                      onChange={(e) => setScoreFormData({ ...scoreFormData, finalGrade: e.target.value })}
                      placeholder="0-10"
                      className={cn(
                        "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingAssessmentGrades(null)}
                  className={cn(
                    "border-[#e5e7e7] dark:border-[#333]",
                    neoBrutalismMode 
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                      : ""
                  )}
                >
                  <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('common.cancel')}</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAssessmentGrades}
                  disabled={isSavingScore}
                  className={cn(
                    neoBrutalismMode 
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                      : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                  )}
                >
                  {isSavingScore ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>
                    {t('common.save')}
                  </span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}

