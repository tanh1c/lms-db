import { useEffect, useState, useMemo, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { adminService, type AdminQuiz, type AdminCourse, type QuizQuestion, type CourseSection, type QuizAnswer } from '@/lib/api/adminService'
import { HelpCircle, Plus, Edit2, Trash2, BookOpen, ArrowUpDown, ChevronDown, Loader2, ChevronUp, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismInputClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import AdvancedSearchPanel, { type SearchFilters } from '@/components/admin/AdvancedSearchPanel'

export default function QuizManagementPage() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [quizzesByCourse, setQuizzesByCourse] = useState<Map<string, AdminQuiz[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [loadingQuizzes, setLoadingQuizzes] = useState<Set<string>>(new Set())
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({})
  const [isSearching, setIsSearching] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<AdminQuiz | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [viewingQuizQuestions, setViewingQuizQuestions] = useState<AdminQuiz | null>(null)
  const [viewingQuizScores, setViewingQuizScores] = useState<AdminQuiz | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([])
  const [loadingAnswers, setLoadingAnswers] = useState(false)
  const neoBrutalismMode = useNeoBrutalismMode()

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const [formData, setFormData] = useState<{
    Section_ID: string
    Course_ID: string
    Semester: string
    Grading_method: string
    pass_score: string
    Time_limits: string
    Start_Date: string
    End_Date: string
    content: string
    types: string
    Weight: string
    Correct_answer: string
  }>({
    Section_ID: '',
    Course_ID: '',
    Semester: '',
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
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [availableSections, setAvailableSections] = useState<CourseSection[]>([])
  const [loadingSections, setLoadingSections] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')

  useEffect(() => {
    loadCourses()
  }, [])

  // Load quizzes when course is expanded
  useEffect(() => {
    expandedCourses.forEach(courseId => {
      if (!quizzesByCourse.has(courseId) && !loadingQuizzes.has(courseId)) {
        loadQuizzesForCourse(courseId)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedCourses])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await adminService.getCourses()
      setCourses(data || [])
    } catch (error: any) {
      console.error('Error loading courses:', error)
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Failed to load courses'
      alert(errorMessage)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const loadQuizzesForCourse = async (courseId: string) => {
    try {
      setLoadingQuizzes(prev => new Set(prev).add(courseId))
      const data = await adminService.getQuizzesByCourse(courseId)
      setQuizzesByCourse(prev => new Map(prev).set(courseId, data))
    } catch (error: any) {
      console.error(`Error loading quizzes for course ${courseId}:`, error)
      setQuizzesByCourse(prev => new Map(prev).set(courseId, []))
    } finally {
      setLoadingQuizzes(prev => {
        const newSet = new Set(prev)
        newSet.delete(courseId)
        return newSet
      })
    }
  }

  const handleSearch = async () => {
    try {
      setIsSearching(true)
      const hasFilters = Object.values(searchFilters).some(v => v !== undefined && v !== '')
      
      if (hasFilters) {
        const results = await adminService.searchCourses(searchFilters)
        setCourses(results)
      } else {
        await loadCourses()
      }
    } catch (error) {
      console.error('Error searching courses:', error)
      alert(t('admin.errorSearchingCourses'))
    } finally {
      setIsSearching(false)
    }
  }

  const handleResetFilters = () => {
    setSearchFilters({})
    loadCourses()
  }

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
      } else {
        newSet.add(courseId)
      }
      return newSet
    })
  }

  // Group quizzes by section for a course
  const getQuizzesBySection = (courseId: string): { [sectionId: string]: AdminQuiz[] } => {
    const courseQuizzes = quizzesByCourse.get(courseId) || []
    const grouped: { [sectionId: string]: AdminQuiz[] } = {}
    
    courseQuizzes.forEach(quiz => {
      const sectionKey = `${quiz.Section_ID}-${quiz.Semester}`
      if (!grouped[sectionKey]) {
        grouped[sectionKey] = []
      }
      grouped[sectionKey].push(quiz)
    })
    
    return grouped
  }

  const loadSectionsForCourse = async (courseId: string) => {
    if (!courseId) {
      setAvailableSections([])
      return
    }
    
    try {
      setLoadingSections(true)
      const sections = await adminService.getCourseSections(courseId)
      setAvailableSections(sections || [])
    } catch (error: any) {
      console.error(`Error loading sections for course ${courseId}:`, error)
      setAvailableSections([])
    } finally {
      setLoadingSections(false)
    }
  }

  const handleCourseSelect = async (courseId: string) => {
    setSelectedCourseId(courseId)
    setFormData(prev => ({ ...prev, Course_ID: courseId, Section_ID: '', Semester: '' }))
    await loadSectionsForCourse(courseId)
  }

  const handleSectionSelect = (sectionId: string) => {
    const section = availableSections.find(s => s.Section_ID === sectionId)
    if (section) {
      setFormData(prev => ({
        ...prev,
        Section_ID: section.Section_ID,
        Semester: section.Semester,
      }))
    }
  }

  const handleAddQuiz = () => {
    setEditingQuiz(null)
    setSelectedCourseId('')
    setAvailableSections([])
    setStartDate(undefined)
    setEndDate(undefined)
    setFormData({
      Section_ID: '',
      Course_ID: '',
      Semester: '',
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
    setQuestions([])
    setIsDialogOpen(true)
  }

  const handleAddQuizForSection = (courseId: string, sectionId: string, semester: string) => {
    setEditingQuiz(null)
    setSelectedCourseId(courseId)
    setAvailableSections([])
    setStartDate(undefined)
    setEndDate(undefined)
    setFormData({
      Section_ID: sectionId,
      Course_ID: courseId,
      Semester: semester,
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
    setQuestions([])
    setIsDialogOpen(true)
  }

  const toggleSectionQuizzes = (courseId: string, sectionId: string, semester: string) => {
    const sectionKey = `${courseId}-${sectionId}-${semester}`
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey)
      } else {
        newSet.add(sectionKey)
      }
      return newSet
    })
  }

  // Helper function to convert TIME format (HH:MM:SS) to minutes
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

  // Helper function to convert minutes to TIME format (HH:MM:SS)
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

  // Helper function to format Date to local datetime string (YYYY-MM-DD HH:mm:ss)
  // This preserves the local timezone instead of converting to UTC
  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  // Helper function to format Date to local datetime string for input (YYYY-MM-DDTHH:mm)
  const formatDateToLocalInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleEditQuiz = (quiz: AdminQuiz) => {
    setEditingQuiz(quiz)
    setStartDate(quiz.Start_Date ? new Date(quiz.Start_Date) : undefined)
    setEndDate(quiz.End_Date ? new Date(quiz.End_Date) : undefined)
    setFormData({
      Section_ID: quiz.Section_ID,
      Course_ID: quiz.Course_ID,
      Semester: quiz.Semester,
      Grading_method: quiz.Grading_method || 'Highest Attemp',
      pass_score: quiz.pass_score?.toString() || '5',
      Time_limits: timeToMinutes(quiz.Time_limits), // Convert TIME to minutes for display
      Start_Date: quiz.Start_Date ? formatDateToLocalInput(new Date(quiz.Start_Date)) : '',
      End_Date: quiz.End_Date ? formatDateToLocalInput(new Date(quiz.End_Date)) : '',
      content: quiz.content,
      types: quiz.types || '',
      Weight: quiz.Weight?.toString() || '',
      Correct_answer: quiz.Correct_answer,
    })
    // Load questions if available
    console.log('Edit Quiz - Questions from quiz:', quiz.Questions)
    console.log('Edit Quiz - Questions type:', typeof quiz.Questions)
    console.log('Edit Quiz - Questions length:', quiz.Questions ? quiz.Questions.length : 0)
    
    if (quiz.Questions) {
      try {
        const parsedQuestions: QuizQuestion[] = JSON.parse(quiz.Questions)
        console.log('Parsed questions count:', parsedQuestions.length)
        console.log('Parsed questions:', parsedQuestions)
        
        // Log each question's answers
        parsedQuestions.forEach((q, idx) => {
          console.log(`Question ${idx + 1} answers:`, Object.keys(q.answers))
        })
        
        setQuestions(parsedQuestions)
      } catch (error) {
        console.error('Error parsing questions:', error)
        console.error('Raw Questions string:', quiz.Questions)
        setQuestions([])
      }
    } else {
      console.log('No Questions found in quiz')
      setQuestions([])
    }
    setIsDialogOpen(true)
  }

  const handleDeleteQuiz = async (quiz: AdminQuiz) => {
    if (!confirm(`${t('admin.confirmDelete')} quiz?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await adminService.deleteQuiz(quiz.QuizID)
      
      // Remove from quizzesByCourse
      const courseQuizzes = quizzesByCourse.get(quiz.Course_ID) || []
      const updatedQuizzes = courseQuizzes.filter(q => q.QuizID !== quiz.QuizID)
      setQuizzesByCourse(prev => new Map(prev).set(quiz.Course_ID, updatedQuizzes))
      
      alert(t('admin.deleteQuizSuccess') || t('admin.deleteCourseSuccess') || 'Quiz deleted successfully')
    } catch (error: any) {
      console.error('Error deleting quiz:', error)
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          t('admin.errorDeletingQuiz') || 
                          'Failed to delete quiz'
      alert(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewQuizScores = async (quiz: AdminQuiz) => {
    setViewingQuizScores(quiz)
    setLoadingAnswers(true)
    try {
      const answers = await adminService.getQuizAnswersByQuizID(quiz.QuizID)
      setQuizAnswers(answers)
    } catch (error: any) {
      console.error('Error loading quiz answers:', error)
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Failed to load quiz answers'
      alert(errorMessage)
      setQuizAnswers([])
    } finally {
      setLoadingAnswers(false)
    }
  }

  const handleSaveQuiz = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!formData.Section_ID || !formData.Course_ID || !formData.Semester || !formData.content || !formData.Correct_answer) {
      alert(t('admin.fillRequiredFields'))
      return
    }

    // Validate dates
    if (!startDate || !endDate) {
      alert('Please select both start date and end date')
      return
    }

    if (startDate >= endDate) {
      alert('End date must be after start date')
      return
    }

    // Validate questions: each question must have at least one language (vi or en)
    if (questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        
        // Check question text
        if (!q.question.vi.trim() && !q.question.en.trim()) {
          alert(`Question ${i + 1}: Please provide at least one language (Vietnamese or English) for the question text.`)
          return
        }
        
        // Check each answer (dynamic - can be A, B, C, D, E, F, ...)
        const answerKeys = Object.keys(q.answers)
        if (answerKeys.length < 2) {
          alert(`Question ${i + 1}: Please provide at least 2 answer options.`)
          return
        }
        
        for (const option of answerKeys) {
          if (!q.answers[option].vi.trim() && !q.answers[option].en.trim()) {
            alert(`Question ${i + 1}, Answer ${option}: Please provide at least one language (Vietnamese or English) for this answer.`)
            return
          }
        }
        
        // Validate correct answer exists in answers
        if (!q.answers[q.correct]) {
          alert(`Question ${i + 1}: Correct answer "${q.correct}" does not exist in the answer options.`)
          return
        }
      }
    }

    try {
      if (editingQuiz) {
        if (!editingQuiz?.QuizID) {
          throw new Error('QuizID is required for update')
        }
        
        await adminService.updateQuiz(
          editingQuiz.QuizID,
          {
            Section_ID: formData.Section_ID,
            Course_ID: formData.Course_ID,
            Semester: formData.Semester,
            Grading_method: formData.Grading_method,
            pass_score: formData.pass_score ? parseFloat(formData.pass_score) : undefined,
            Time_limits: formData.Time_limits ? minutesToTime(formData.Time_limits) : undefined,
            Start_Date: startDate ? formatDateToLocal(startDate) : undefined,
            End_Date: endDate ? formatDateToLocal(endDate) : undefined,
            content: formData.content,
            types: formData.types || undefined,
            Weight: formData.Weight ? parseFloat(formData.Weight) : undefined,
            Correct_answer: formData.Correct_answer,
            Questions: JSON.stringify(questions, null, 0), // Always send Questions, even if empty array
          }
        )
        
        console.log('Update quiz - Questions sent:', questions)
        console.log('Update quiz - Questions count:', questions.length)
        questions.forEach((q, idx) => {
          console.log(`Question ${idx + 1} answers:`, Object.keys(q.answers))
        })
        console.log('Update quiz - Questions JSON:', JSON.stringify(questions, null, 2))
        
        alert(t('admin.updateQuizSuccess') || t('admin.updateCourseSuccess') || 'Quiz updated successfully')
      } else {
        await adminService.createQuiz({
          Section_ID: formData.Section_ID,
          Course_ID: formData.Course_ID,
          Semester: formData.Semester,
          Grading_method: formData.Grading_method,
          pass_score: formData.pass_score ? parseFloat(formData.pass_score) : 5,
          Time_limits: formData.Time_limits ? minutesToTime(formData.Time_limits) : '',
          Start_Date: startDate ? formatDateToLocal(startDate) : '',
          End_Date: endDate ? formatDateToLocal(endDate) : '',
          content: formData.content,
          types: formData.types || null,
          Weight: formData.Weight ? parseFloat(formData.Weight) : null,
          Correct_answer: formData.Correct_answer,
          Questions: questions.length > 0 ? JSON.stringify(questions, null, 0) : undefined, // Convert to JSON string
        })
        alert(t('admin.createQuizSuccess') || t('admin.createCourseSuccess') || 'Quiz created successfully')
      }

      setIsDialogOpen(false)
      
      // Refresh quizzes for the course to get updated data
      if (formData.Course_ID) {
        // Clear cached quizzes to force reload
        setQuizzesByCourse(prev => {
          const newMap = new Map(prev)
          newMap.delete(formData.Course_ID)
          return newMap
        })
        // Small delay to ensure state is cleared, then reload
        await new Promise(resolve => setTimeout(resolve, 100))
        const reloadedData = await adminService.getQuizzesByCourse(formData.Course_ID)
        setQuizzesByCourse(prev => new Map(prev).set(formData.Course_ID, reloadedData))
        
        console.log('Reloaded quizzes for course:', formData.Course_ID)
        console.log('Reloaded quizzes count:', reloadedData.length)
        
        // Log loaded quizzes to verify
        const updatedQuiz = editingQuiz ? reloadedData.find(q => q.QuizID === editingQuiz.QuizID) : null
        if (updatedQuiz) {
          console.log('Reloaded quiz Questions:', updatedQuiz.Questions)
          console.log('Reloaded quiz Questions length:', updatedQuiz.Questions ? updatedQuiz.Questions.length : 0)
          if (updatedQuiz.Questions) {
            try {
              const parsed = JSON.parse(updatedQuiz.Questions)
              console.log('Reloaded quiz parsed questions count:', parsed.length)
              parsed.forEach((q: QuizQuestion, idx: number) => {
                console.log(`Reloaded Question ${idx + 1} answers:`, Object.keys(q.answers))
              })
            } catch (e) {
              console.error('Error parsing reloaded questions:', e)
            }
          } else {
            console.warn('Reloaded quiz has no Questions!')
          }
        } else {
          console.warn('Updated quiz not found in reloaded data!')
        }
      }
    } catch (error: any) {
      console.error('Error saving quiz:', error)
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          t('admin.errorSavingQuiz') || 
                          'Failed to save quiz'
      alert(errorMessage)
    }
  }

  // Table columns
  const columns: ColumnDef<AdminCourse>[] = useMemo(() => [
    {
      id: 'expand',
      enableHiding: false,
      cell: ({ row }) => {
        const course = row.original
        const isExpanded = expandedCourses.has(course.Course_ID)
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCourse(course.Course_ID)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )
      },
    },
    {
      accessorKey: 'Course_ID',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            {t('admin.courseId')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const courseId = row.getValue('Course_ID') as string
        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 bg-[#3bafa8] dark:bg-[#3bafa8]/30 flex items-center justify-center flex-shrink-0",
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                : "rounded-full"
            )}>
              <BookOpen className="h-4 w-4 text-white dark:text-[#3bafa8]" />
            </div>
            <div className="font-medium">{courseId}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'Name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            {t('admin.courseName')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const course = row.original
        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0",
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                : "rounded-full"
            )}>
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="font-medium">{course.Name}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'Credit',
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              {t('admin.credit')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const credit = row.getValue('Credit') as number | null
        return <div className="text-center">{credit ?? t('admin.noData')}</div>
      },
    },
    {
      id: 'SectionCount',
      accessorFn: (row) => row.SectionCount ?? 0,
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              {t('admin.sections')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const count = row.original.SectionCount
        if (count === undefined || count === null) return <div className="text-center">{t('admin.noData')}</div>
        return (
          <div className="flex justify-center">
            <Badge className={cn(
              "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              neoBrutalismMode ? "border-2 border-blue-600 dark:border-blue-400 rounded-none" : ""
            )}>
              {count} {t('admin.sections')}
            </Badge>
          </div>
        )
      },
    },
    {
      id: 'QuizCount',
      header: () => <div className="text-center">{t('admin.quizzes')}</div>,
      cell: ({ row }) => {
        const course = row.original
        const isExpanded = expandedCourses.has(course.Course_ID)
        const courseQuizzes = quizzesByCourse.get(course.Course_ID) || []
        const count = isExpanded ? courseQuizzes.length : '-'
        return (
          <div className="flex justify-center">
            {isExpanded ? (
              <Badge className={cn(
                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                neoBrutalismMode ? "border-2 border-green-600 dark:border-green-400 rounded-none" : ""
              )}>
                {count} {t('admin.quizzes')}
              </Badge>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            )}
          </div>
        )
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, neoBrutalismMode, expandedCourses, quizzesByCourse])

  const table = useReactTable({
    data: courses,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className={cn(
            "text-lg text-[#211c37] dark:text-white",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>{t('common.loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className={cn(
            "text-3xl font-bold text-[#211c37] dark:text-white mb-2",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
          )}>
            {t('admin.quizManagement')}
          </h1>
          <p className={cn(
            "text-[#85878d] dark:text-gray-400",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>
            {t('admin.quizManagementSubtitle')}
          </p>
        </div>

        {/* Advanced Search Panel - Add Quiz */}
        <AdvancedSearchPanel
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
          onSearch={handleSearch}
          onReset={handleResetFilters}
          onAddCourse={handleAddQuiz}
          addButtonLabelKey="admin.addQuiz"
        />

        {/* Courses List Table */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className={cn(
                    "text-xl text-[#1f1d39] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {t('admin.courseList')}
                  </CardTitle>
                  <CardDescription className={cn(
                    "text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.totalCourses')} {courses.length}
                  </CardDescription>
                </div>
                {isSearching && (
                  <Loader2 className="h-5 w-5 animate-spin text-[#3bafa8] dark:text-[#3bafa8]" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className={cn(
              "h-[600px] rounded-md border",
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                : "border-[#e5e7e7] dark:border-[#333]"
            )}>
              <div className="p-4">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const isCenterColumn = ['Credit', 'SectionCount', 'QuizCount'].includes(header.column.id)
                          return (
                            <TableHead 
                              key={header.id}
                              className={cn(isCenterColumn && 'text-center')}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => {
                        const course = row.original
                        const isExpanded = expandedCourses.has(course.Course_ID)
                        const isLoading = loadingQuizzes.has(course.Course_ID)
                        const quizzesBySection = getQuizzesBySection(course.Course_ID)
                        const sectionKeys = Object.keys(quizzesBySection)
                        
                        return (
                          <Fragment key={row.id}>
                            <TableRow
                              data-state={row.getIsSelected() && 'selected'}
                              className={cn(
                                isExpanded && "bg-[#3bafa8]/5 dark:bg-[#3bafa8]/10"
                              )}
                            >
                              {row.getVisibleCells().map((cell) => {
                                const isCenterColumn = ['Credit', 'SectionCount', 'QuizCount'].includes(cell.column.id)
                                return (
                                  <TableCell 
                                    key={cell.id}
                                    className={cn(isCenterColumn && 'text-center')}
                                  >
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={columns.length} className="p-0">
                                  <div className="p-4 bg-gray-50 dark:bg-[#1a1a1a]">
                                    {isLoading ? (
                                      <div className="flex items-center justify-center h-32">
                                        <Loader2 className="h-6 w-6 animate-spin text-[#3bafa8]" />
                                      </div>
                                    ) : sectionKeys.length === 0 ? (
              <div className={cn(
                                        "text-center py-8 text-gray-500 dark:text-gray-400",
                                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                      )}>
                                        {t('admin.noQuizzes')}
              </div>
                                    ) : (
                                      <div className="space-y-4">
                                        {sectionKeys.map((sectionKey) => {
                                          const [sectionId, semester] = sectionKey.split('-')
                                          const sectionQuizzes = quizzesBySection[sectionKey]
                                          
                                          return (
                                            <div key={sectionKey} className="space-y-2">
                                              <div className={cn(
                                                "flex items-center justify-between gap-2 p-2 bg-[#f5f5f5] dark:bg-[#2a2a2a] rounded-md",
                                                neoBrutalismMode 
                                                  ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                                  : ""
                                              )}>
                                                <div className="flex items-center gap-2">
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleSectionQuizzes(course.Course_ID, sectionId, semester)}
                                                    className={cn(
                                                      "h-6 w-6 p-0",
                                                      neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                                                    )}
                                                  >
                                                    {expandedSections.has(`${course.Course_ID}-${sectionId}-${semester}`) ? (
                                                      <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                      <ChevronDown className="h-4 w-4" />
                                                    )}
                                                  </Button>
                                                <HelpCircle className="h-4 w-4 text-[#3bafa8]" />
                                                <span className={cn(
                                                  "font-semibold text-[#211c37] dark:text-white",
                                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                                )}>
                                                  {sectionId} - {semester}
                                                </span>
                                                <Badge variant="secondary" className="ml-2">
                                                  {sectionQuizzes.length} {t('admin.quizzes')}
                                                </Badge>
              </div>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  onClick={() => handleAddQuizForSection(course.Course_ID, sectionId, semester)}
                                                  className={cn(
                                                    "text-xs",
                                                    getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary')
                                                  )}
                                                >
                                                  <Plus className="h-3 w-3 mr-1" />
                                                  {t('admin.add')} {t('admin.quiz')}
                                                </Button>
                                              </div>
                                              {expandedSections.has(`${course.Course_ID}-${sectionId}-${semester}`) && (
                                              <div className="space-y-2 pl-6">
                                                {sectionQuizzes.map((quiz) => (
                  <div
                    key={`quiz-${quiz.QuizID}`}
                    className={cn(
                                                      "p-3 bg-white dark:bg-[#2a2a2a] rounded-md border",
                      neoBrutalismMode
                                                        ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                                        : "border-[#e5e7e7] dark:border-[#333]"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                                                        <h4 className={cn(
                                                          "font-semibold text-[#211c37] dark:text-white mb-2",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                                                          {quiz.content}
                                                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.passScore')}: </span>
                            <span>{quiz.pass_score || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.timeLimit')}: </span>
                            <span>{quiz.Time_limits ? (() => {
                              const minutes = timeToMinutes(quiz.Time_limits)
                              return minutes ? `${minutes} minutes` : 'N/A'
                            })() : 'N/A'}</span>
                          </div>
                          {quiz.Weight && (
                            <div>
                              <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.weight')}: </span>
                              <span>{quiz.Weight}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.startDate')}: </span>
                          <span>{quiz.Start_Date ? new Date(quiz.Start_Date).toLocaleString() : 'N/A'}</span>
                          {' - '}
                          <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.endDate')}: </span>
                          <span>{quiz.End_Date ? new Date(quiz.End_Date).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {quiz.Questions && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingQuizQuestions(quiz)}
                            className={cn(
                              "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                              neoBrutalismMode 
                                ? "border-2 border-blue-600 dark:border-blue-400 rounded-none"
                                : ""
                            )}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.viewQuestions') || 'View Questions'}</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewQuizScores(quiz)}
                          className={cn(
                            "border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20",
                            neoBrutalismMode 
                              ? "border-2 border-green-600 dark:border-green-400 rounded-none"
                              : ""
                          )}
                        >
                          <BookOpen className="h-4 w-4 mr-1" />
                          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.showScore') || 'Show Score'}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuiz(quiz)}
                          className={cn(
                            "border-[#e5e7e7] dark:border-[#333]",
                            neoBrutalismMode 
                              ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                              : ""
                          )}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.edit')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuiz(quiz)}
                          disabled={isDeleting}
                          className={cn(
                            "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
                            neoBrutalismMode 
                              ? "border-4 border-red-600 dark:border-red-400 rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:shadow-[4px_4px_0px_0px_rgba(248,113,113,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(248,113,113,1)]"
                              : ""
                          )}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.delete')}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          {t('admin.noCourses')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className={cn(
                    neoBrutalismMode 
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                      : ""
                  )}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className={cn(
                    neoBrutalismMode 
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                      : ""
                  )}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions and Answers Dialog */}
        <Dialog open={!!viewingQuizQuestions} onOpenChange={(open) => !open && setViewingQuizQuestions(null)}>
          {viewingQuizQuestions && viewingQuizQuestions.Questions && (() => {
            try {
              const questions: QuizQuestion[] = JSON.parse(viewingQuizQuestions.Questions)
              return (
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
                      {t('admin.questions')} - {viewingQuizQuestions.content}
                    </DialogTitle>
                    <p className={cn(
                      "text-sm text-[#85878d] dark:text-gray-400 mt-1",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {viewingQuizQuestions.Course_ID} - {viewingQuizQuestions.Section_ID} ({questions.length} {t('admin.questions')})
                    </p>
                  </DialogHeader>
                  <ScrollArea className={cn(
                    "max-h-[70vh] rounded-md border p-4",
                    neoBrutalismMode 
                      ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : "border-[#e5e7e7] dark:border-[#333]"
                  )}>
                    <div className="space-y-4">
                      {questions.map((q, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-md border w-full",
                            neoBrutalismMode
                              ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                              : "border-[#e5e7e7] dark:border-[#333]"
                          )}
                        >
                          <div className="flex items-start gap-3 mb-3 w-full">
                            <Badge className={cn(
                              "bg-[#3bafa8] text-white flex-shrink-0 text-base px-3 py-1",
                              neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                            )}>
                              Q{idx + 1}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              {q.question.vi && (
                                <p className={cn(
                                  "text-base font-medium text-[#211c37] dark:text-white mb-2 break-words leading-relaxed",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {q.question.vi}
                                </p>
                              )}
                              {q.question.en && (
                                <p className={cn(
                                  "text-sm text-gray-500 dark:text-gray-400 italic break-words leading-relaxed",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {q.question.en}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className={cn(
                            "grid gap-3 mt-3 w-full",
                            Object.keys(q.answers).length === 2 ? "grid-cols-1 md:grid-cols-2" :
                            Object.keys(q.answers).length === 3 ? "grid-cols-1 md:grid-cols-3" :
                            Object.keys(q.answers).length === 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" :
                            Object.keys(q.answers).length <= 6 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" :
                            "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                          )}>
                            {Object.keys(q.answers).sort().map((option) => {
                              const answer = q.answers[option]
                              const isCorrect = q.correct === option
                              return (
                                <div
                                  key={option}
                                  className={cn(
                                    "p-3 rounded-md text-sm border w-full",
                                    isCorrect
                                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                                      : "bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-[#333]",
                                    neoBrutalismMode && isCorrect
                                      ? "border-2 border-green-600 dark:border-green-400 rounded-none"
                                      : ""
                                  )}
                                >
                                  <div className="flex items-start gap-2 w-full">
                                    <span className={cn(
                                      "font-bold flex-shrink-0 text-base",
                                      isCorrect ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                                    )}>
                                      {option}.
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      {answer.vi && (
                                        <p className={cn(
                                          "text-sm text-[#211c37] dark:text-white break-words leading-relaxed",
                                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                        )}>
                                          {answer.vi}
                                        </p>
                                      )}
                                      {answer.en && (
                                        <p className={cn(
                                          "text-xs text-gray-500 dark:text-gray-400 italic mt-1 break-words leading-relaxed",
                                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                        )}>
                                          {answer.en}
                                        </p>
                                      )}
                                    </div>
                                    {isCorrect && (
                                      <Badge className={cn(
                                        "bg-green-500 text-white text-sm flex-shrink-0 px-2 py-1",
                                        neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                                      )}>
                                        ✓
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              )
            } catch (error) {
              return (
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
                      {t('admin.questions')} - {viewingQuizQuestions.content}
                    </DialogTitle>
                  </DialogHeader>
                  <div className={cn(
                    "text-center py-8 text-red-500 dark:text-red-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.errorParsingQuestions') || 'Error parsing questions'}
                  </div>
                </DialogContent>
              )
            }
          })()}
        </Dialog>

        {/* Quiz Scores and Responses Dialog */}
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
                  {t('admin.quizScores') || 'Quiz Scores'} - {viewingQuizScores.content}
                </DialogTitle>
                <p className={cn(
                  "text-sm text-[#85878d] dark:text-gray-400 mt-1",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {viewingQuizScores.Course_ID} - {viewingQuizScores.Section_ID} ({quizAnswers.length} {t('admin.students') || 'students'})
                </p>
              </DialogHeader>
              {loadingAnswers ? (
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

        {/* Add/Edit Quiz Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            {editingQuiz ? (
              // Use Tabs when editing
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
                    {t('admin.questions')} ({questions.length})
                  </TabsTrigger>
                </TabsList>
                
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="mt-0">
            <div className="grid grid-cols-2 gap-4 py-4">
                    {/* When editing, show read-only fields */}
              <div className="space-y-2">
                      <Label htmlFor="course-id" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                        {t('admin.courseId')} *
                </Label>
                <Input
                        id="course-id"
                        value={formData.Course_ID}
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
                  value={formData.Section_ID}
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
                        value={formData.Semester}
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
                        value={formData.pass_score}
                        onChange={(e) => setFormData({ ...formData, pass_score: e.target.value })}
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
                        value={formData.Time_limits}
                        onChange={(e) => setFormData({ ...formData, Time_limits: e.target.value })}
                        placeholder="30"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enter the time limit in minutes (e.g., 30 for 30 minutes, 60 for 1 hour)
                      </p>
              </div>
              <div className="space-y-2">
                      <Label htmlFor="grading-method" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                        {t('admin.gradingMethod')}
                      </Label>
                      <Select 
                        value={formData.Grading_method} 
                        onValueChange={(value) => setFormData({ ...formData, Grading_method: value })}
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
                        date={startDate}
                        onDateChange={(date) => {
                          setStartDate(date)
                          if (date) {
                            setFormData({ ...formData, Start_Date: formatDateToLocalInput(date) })
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
                        date={endDate}
                        onDateChange={(date) => {
                          setEndDate(date)
                          if (date) {
                            setFormData({ ...formData, End_Date: formatDateToLocalInput(date) })
                          }
                        }}
                        placeholder="Select end date and time"
                        minDate={startDate}
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
                        value={formData.types}
                        onChange={(e) => setFormData({ ...formData, types: e.target.value })}
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
                        value={formData.Weight}
                        onChange={(e) => setFormData({ ...formData, Weight: e.target.value })}
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
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                        value={formData.Correct_answer}
                        onChange={(e) => setFormData({ ...formData, Correct_answer: e.target.value })}
                        placeholder="A"
                        className={cn(
                          "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                          getNeoBrutalismInputClasses(neoBrutalismMode)
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                {/* Questions Tab */}
                <TabsContent value="questions" className="mt-0">
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <Label className={cn(
                        "text-lg font-semibold text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>
                        {t('admin.questions') || 'Questions'} ({questions.length})
                      </Label>
                      <Button
                        type="button"
                        onClick={() => {
                          setQuestions([...questions, {
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
                        {questions.map((question, qIndex) => (
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
                                  setQuestions(questions.filter((_, i) => i !== qIndex))
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

                            {/* Question Text */}
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
                                  const newQuestions = [...questions]
                                  newQuestions[qIndex].question.vi = e.target.value
                                  setQuestions(newQuestions)
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
                                  const newQuestions = [...questions]
                                  newQuestions[qIndex].question.en = e.target.value
                                  setQuestions(newQuestions)
                                }}
                                placeholder="Enter question in English (optional)"
                                className={cn(
                                  "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                                  getNeoBrutalismInputClasses(neoBrutalismMode)
                                )}
                              />
                            </div>

                            {/* Answers */}
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
                                      const newQuestions = [...questions]
                                      const answerKeys = Object.keys(newQuestions[qIndex].answers)
                                      const lastKey = answerKeys[answerKeys.length - 1]
                                      const nextKey = String.fromCharCode(lastKey.charCodeAt(0) + 1)
                                      newQuestions[qIndex].answers[nextKey] = { vi: '', en: '' }
                                      setQuestions(newQuestions)
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
                                        const newQuestions = [...questions]
                                        const answerKeys = Object.keys(newQuestions[qIndex].answers).sort()
                                        const lastKey = answerKeys[answerKeys.length - 1]
                                        delete newQuestions[qIndex].answers[lastKey]
                                        // If deleted answer was correct, set to first available
                                        if (newQuestions[qIndex].correct === lastKey) {
                                          newQuestions[qIndex].correct = answerKeys[0]
                                        }
                                        setQuestions(newQuestions)
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
                                        const newQuestions = [...questions]
                                        newQuestions[qIndex].correct = option
                                        setQuestions(newQuestions)
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
                                          const newQuestions = [...questions]
                                          newQuestions[qIndex].answers[option].vi = e.target.value
                                          setQuestions(newQuestions)
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
                                          const newQuestions = [...questions]
                                          newQuestions[qIndex].answers[option].en = e.target.value
                                          setQuestions(newQuestions)
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
                        {questions.length === 0 && (
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
            ) : (
              // Original layout when adding new quiz
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* Show course/section selection only if not pre-filled from section context */}
                {!formData.Course_ID || !formData.Section_ID ? (
                    <>
                      {/* Course Selection - Only when creating new quiz without section context */}
              <div className="space-y-2">
                        <Label htmlFor="course-select" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                          {t('admin.courseId')} *
                </Label>
                        <Select
                          value={selectedCourseId}
                          onValueChange={handleCourseSelect}
                  disabled={!!editingQuiz}
                        >
                          <SelectTrigger className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                          )}>
                            <SelectValue placeholder={t('admin.selectCourse') || "Select Course"} />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.Course_ID} value={course.Course_ID}>
                                {course.Course_ID} - {course.Name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Section Selection - Only when creating new quiz without section context */}
                      <div className="space-y-2">
                        <Label htmlFor="section-select" className={cn(
                          "text-[#211c37] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                          {t('admin.sectionId')} *
                        </Label>
                        <Select
                          value={formData.Section_ID}
                          onValueChange={handleSectionSelect}
                          disabled={!!editingQuiz || !selectedCourseId || loadingSections}
                        >
                          <SelectTrigger className={cn(
                            "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                            getNeoBrutalismInputClasses(neoBrutalismMode)
                          )}>
                            <SelectValue placeholder={
                              loadingSections 
                                ? (t('admin.loading') || "Loading...")
                                : !selectedCourseId
                                ? (t('admin.selectCourseFirst') || "Select Course First")
                                : (t('admin.selectSection') || "Select Section")
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSections.map((section) => (
                              <SelectItem key={`${section.Section_ID}-${section.Semester}`} value={section.Section_ID}>
                                {section.Section_ID} - {section.Semester} ({section.StudentCount} students)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Show read-only fields when pre-filled from section context */}
                      <div className="space-y-2">
                        <Label htmlFor="course-id" className={cn(
                          "text-[#211c37] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                          {t('admin.courseId')} *
                        </Label>
                        <Input
                          id="course-id"
                          value={formData.Course_ID}
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
                  value={formData.Section_ID}
                          readOnly
                          disabled
                  className={cn(
                            "bg-gray-100 dark:bg-[#2a2a2a] text-[#211c37] dark:text-white cursor-not-allowed",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
                    </>
                  )}

                  {/* Semester - Auto-filled, read-only */}
                  <div className="space-y-2">
                    <Label htmlFor="semester" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.semester')} *
                    </Label>
                    <Input
                      id="semester"
                      value={formData.Semester}
                      readOnly
                      disabled
                      placeholder="Auto-filled from section"
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
                  value={formData.pass_score}
                  onChange={(e) => setFormData({ ...formData, pass_score: e.target.value })}
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
                  value={formData.Time_limits}
                  onChange={(e) => setFormData({ ...formData, Time_limits: e.target.value })}
                  placeholder="30"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter the time limit in minutes (e.g., 30 for 30 minutes, 60 for 1 hour)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grading-method" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.gradingMethod')}
                </Label>
                <Select 
                  value={formData.Grading_method} 
                  onValueChange={(value) => setFormData({ ...formData, Grading_method: value })}
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
                  date={startDate}
                  onDateChange={(date) => {
                    setStartDate(date)
                    if (date) {
                      setFormData({ ...formData, Start_Date: formatDateToLocalInput(date) })
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
                  date={endDate}
                  onDateChange={(date) => {
                    setEndDate(date)
                    if (date) {
                      setFormData({ ...formData, End_Date: formatDateToLocalInput(date) })
                    }
                  }}
                  placeholder="Select end date and time"
                  minDate={startDate}
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
                  value={formData.types}
                  onChange={(e) => setFormData({ ...formData, types: e.target.value })}
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
                  value={formData.Weight}
                  onChange={(e) => setFormData({ ...formData, Weight: e.target.value })}
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
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                  value={formData.Correct_answer}
                  onChange={(e) => setFormData({ ...formData, Correct_answer: e.target.value })}
                  placeholder="A"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>

              {/* Questions Section */}
              <div className="col-span-2 space-y-4 mt-4 pt-4 border-t border-[#e5e7e7] dark:border-[#333]">
              <div className="flex items-center justify-between">
                <Label className={cn(
                  "text-lg font-semibold text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {t('admin.questions') || 'Questions'} ({questions.length})
                </Label>
                <Button
                  type="button"
                  onClick={() => {
                    setQuestions([...questions, {
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
                "h-[400px] rounded-md border p-4",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                  : "border-[#e5e7e7] dark:border-[#333]"
              )}>
                <div className="space-y-4">
                  {questions.map((question, qIndex) => (
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
                            setQuestions(questions.filter((_, i) => i !== qIndex))
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

                      {/* Question Text */}
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
                            const newQuestions = [...questions]
                            newQuestions[qIndex].question.vi = e.target.value
                            setQuestions(newQuestions)
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
                            const newQuestions = [...questions]
                            newQuestions[qIndex].question.en = e.target.value
                            setQuestions(newQuestions)
                          }}
                          placeholder="Enter question in English (optional)"
                          className={cn(
                            "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                            getNeoBrutalismInputClasses(neoBrutalismMode)
                          )}
                        />
                      </div>

                      {/* Answers */}
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
                                const newQuestions = [...questions]
                                const answerKeys = Object.keys(newQuestions[qIndex].answers)
                                const lastKey = answerKeys[answerKeys.length - 1]
                                const nextKey = String.fromCharCode(lastKey.charCodeAt(0) + 1)
                                newQuestions[qIndex].answers[nextKey] = { vi: '', en: '' }
                                setQuestions(newQuestions)
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
                                  const newQuestions = [...questions]
                                  const answerKeys = Object.keys(newQuestions[qIndex].answers).sort()
                                  const lastKey = answerKeys[answerKeys.length - 1]
                                  delete newQuestions[qIndex].answers[lastKey]
                                  // If deleted answer was correct, set to first available
                                  if (newQuestions[qIndex].correct === lastKey) {
                                    newQuestions[qIndex].correct = answerKeys[0]
                                  }
                                  setQuestions(newQuestions)
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
                                  const newQuestions = [...questions]
                                  newQuestions[qIndex].correct = option
                                  setQuestions(newQuestions)
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
                                    const newQuestions = [...questions]
                                    newQuestions[qIndex].answers[option].vi = e.target.value
                                    setQuestions(newQuestions)
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
                                    const newQuestions = [...questions]
                                    newQuestions[qIndex].answers[option].en = e.target.value
                                    setQuestions(newQuestions)
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
                  {questions.length === 0 && (
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
            </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
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
                className={cn(
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                    : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                )}
              >
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{editingQuiz ? t('admin.update') : t('admin.addNew')}</span>
              </Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
