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
import { adminService, type AdminAssignment, type AdminCourse } from '@/lib/api/adminService'
import { Plus, Edit2, Trash2, BookOpen, ArrowUpDown, ChevronDown, Loader2, ChevronUp, Eye, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismInputClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import AdvancedSearchPanel, { type SearchFilters } from '@/components/admin/AdvancedSearchPanel'

export default function AssignmentManagementPage() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [assignmentsByCourse, setAssignmentsByCourse] = useState<Map<string, AdminAssignment[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [loadingAssignments, setLoadingAssignments] = useState<Set<string>>(new Set())
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({})
  const [isSearching, setIsSearching] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<AdminAssignment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [viewingAssignment, setViewingAssignment] = useState<AdminAssignment | null>(null)
  const [viewingAssignmentScores, setViewingAssignmentScores] = useState<AdminAssignment | null>(null)
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const neoBrutalismMode = useNeoBrutalismMode()

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const [formData, setFormData] = useState({
    Course_ID: '',
    Semester: '',
    MaxScore: '',
    accepted_specification: '',
    submission_deadline: '',
    instructions: '',
  })

  useEffect(() => {
    loadCourses()
  }, [])

  // Load assignments when course is expanded
  useEffect(() => {
    expandedCourses.forEach(courseId => {
      if (!assignmentsByCourse.has(courseId) && !loadingAssignments.has(courseId)) {
        loadAssignmentsForCourse(courseId)
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

  const loadAssignmentsForCourse = async (courseId: string) => {
    try {
      setLoadingAssignments(prev => new Set(prev).add(courseId))
      const data = await adminService.getAssignmentsByCourse(courseId)
      setAssignmentsByCourse(prev => new Map(prev).set(courseId, data))
    } catch (error: any) {
      console.error(`Error loading assignments for course ${courseId}:`, error)
      setAssignmentsByCourse(prev => new Map(prev).set(courseId, []))
    } finally {
      setLoadingAssignments(prev => {
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

  // Group assignments by semester for a course (no longer by section)
  const getAssignmentsBySemester = (courseId: string): { [semester: string]: AdminAssignment[] } => {
    const courseAssignments = assignmentsByCourse.get(courseId) || []
    const grouped: { [semester: string]: AdminAssignment[] } = {}
    
    courseAssignments.forEach(assignment => {
      const semesterKey = assignment.Semester
      if (!grouped[semesterKey]) {
        grouped[semesterKey] = []
      }
      grouped[semesterKey].push(assignment)
    })
    
    return grouped
  }

  const handleAddAssignment = () => {
    setEditingAssignment(null)
    setFormData({
      Course_ID: '',
      Semester: '',
      MaxScore: '10',
      accepted_specification: '',
      submission_deadline: '',
      instructions: '',
    })
    setIsDialogOpen(true)
  }

  const handleAddAssignmentForSemester = (courseId: string, semester: string) => {
    setEditingAssignment(null)
    setFormData({
      Course_ID: courseId,
      Semester: semester,
      MaxScore: '10',
      accepted_specification: '',
      submission_deadline: '',
      instructions: '',
    })
    setIsDialogOpen(true)
  }

  const toggleSemesterAssignments = (courseId: string, semester: string) => {
    const semesterKey = `${courseId}-${semester}`
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(semesterKey)) {
        newSet.delete(semesterKey)
      } else {
        newSet.add(semesterKey)
      }
      return newSet
    })
  }

  const handleViewAssignmentScores = async (assignment: AdminAssignment) => {
    setViewingAssignmentScores(assignment)
    setLoadingSubmissions(true)
    try {
      const submissions = await adminService.getAssignmentSubmissionsByAssignmentID(assignment.AssignmentID)
      // Sort by score descending (highest first), then by submit date
      const sortedSubmissions = [...submissions].sort((a, b) => {
        // NULL scores go last
        if (a.score === null || a.score === undefined) return 1
        if (b.score === null || b.score === undefined) return -1
        // Sort by score descending
        if (b.score !== a.score) return b.score - a.score
        // If scores are equal, sort by submit date descending
        if (a.SubmitDate && b.SubmitDate) {
          return new Date(b.SubmitDate).getTime() - new Date(a.SubmitDate).getTime()
        }
        return 0
      })
      setAssignmentSubmissions(sortedSubmissions)
    } catch (error: any) {
      console.error('Error loading assignment submissions:', error)
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Failed to load assignment submissions'
      alert(errorMessage)
      setAssignmentSubmissions([])
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleEditAssignment = (assignment: AdminAssignment) => {
    setEditingAssignment(assignment)
    setFormData({
      Course_ID: assignment.Course_ID,
      Semester: assignment.Semester,
      MaxScore: assignment.MaxScore?.toString() || '10',
      accepted_specification: assignment.accepted_specification || '',
      submission_deadline: assignment.submission_deadline ? new Date(assignment.submission_deadline).toISOString().slice(0, 16) : '',
      instructions: assignment.instructions || '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteAssignment = async (assignment: AdminAssignment) => {
    if (!confirm(`${t('admin.confirmDelete')} assignment?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await adminService.deleteAssignment(assignment.AssignmentID)
      
      // Remove from assignmentsByCourse
      const courseAssignments = assignmentsByCourse.get(assignment.Course_ID) || []
      const updatedAssignments = courseAssignments.filter(a => a.AssignmentID !== assignment.AssignmentID)
      setAssignmentsByCourse(prev => new Map(prev).set(assignment.Course_ID, updatedAssignments))
      
      alert(t('admin.deleteAssignmentSuccess') || t('admin.deleteCourseSuccess') || 'Assignment deleted successfully')
    } catch (error: any) {
      console.error('Error deleting assignment:', error)
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          t('admin.errorDeletingAssignment') || 
                          'Failed to delete assignment'
      alert(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveAssignment = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!formData.Course_ID || !formData.Semester) {
      alert(t('admin.fillRequiredFields'))
      return
    }

    try {
      if (editingAssignment) {
        await adminService.updateAssignment(editingAssignment.AssignmentID, {
          Course_ID: formData.Course_ID,
          Semester: formData.Semester,
          MaxScore: formData.MaxScore ? parseInt(formData.MaxScore) : undefined,
          accepted_specification: formData.accepted_specification || undefined,
          submission_deadline: formData.submission_deadline || undefined,
          instructions: formData.instructions || undefined,
        })
        alert(t('admin.updateAssignmentSuccess') || t('admin.updateCourseSuccess') || 'Assignment updated successfully')
      } else {
        await adminService.createAssignment({
          Course_ID: formData.Course_ID,
          Semester: formData.Semester,
          MaxScore: formData.MaxScore ? parseInt(formData.MaxScore) : 10,
          accepted_specification: formData.accepted_specification || null,
          submission_deadline: formData.submission_deadline,
          instructions: formData.instructions || null,
        })
        alert(t('admin.createAssignmentSuccess') || t('admin.createCourseSuccess') || 'Assignment created successfully')
      }

      setIsDialogOpen(false)
      
      // Refresh assignments for the course
      if (formData.Course_ID) {
        await loadAssignmentsForCourse(formData.Course_ID)
      }
    } catch (error: any) {
      console.error('Error saving assignment:', error)
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          t('admin.errorSavingAssignment') || 
                          'Failed to save assignment'
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
      id: 'AssignmentCount',
      header: () => <div className="text-center">{t('admin.assignments')}</div>,
      cell: ({ row }) => {
        const course = row.original
        const isExpanded = expandedCourses.has(course.Course_ID)
        const courseAssignments = assignmentsByCourse.get(course.Course_ID) || []
        const count = isExpanded ? courseAssignments.length : '-'
        return (
          <div className="flex justify-center">
            {isExpanded ? (
              <Badge className={cn(
                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                neoBrutalismMode ? "border-2 border-green-600 dark:border-green-400 rounded-none" : ""
              )}>
                {count} {t('admin.assignments')}
              </Badge>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            )}
          </div>
        )
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, neoBrutalismMode, expandedCourses, assignmentsByCourse])

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
            {t('admin.assignmentManagement')}
          </h1>
          <p className={cn(
            "text-[#85878d] dark:text-gray-400",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>
            {t('admin.assignmentManagementSubtitle')}
          </p>
        </div>

        {/* Advanced Search Panel */}
        <AdvancedSearchPanel
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
          onSearch={handleSearch}
          onReset={handleResetFilters}
          onAddCourse={handleAddAssignment}
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
              <Button
                onClick={handleAddAssignment}
                className={cn(
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                    : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.addAssignment')}</span>
              </Button>
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
                          const isCenterColumn = ['Credit', 'SectionCount', 'AssignmentCount'].includes(header.column.id)
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
                        const isLoading = loadingAssignments.has(course.Course_ID)
                        const assignmentsBySemester = getAssignmentsBySemester(course.Course_ID)
                        const semesterKeys = Object.keys(assignmentsBySemester)
                        
                        return (
                          <Fragment key={row.id}>
                            <TableRow
                              data-state={row.getIsSelected() && 'selected'}
                              className={cn(
                                isExpanded && "bg-[#3bafa8]/5 dark:bg-[#3bafa8]/10"
                              )}
                            >
                              {row.getVisibleCells().map((cell) => {
                                const isCenterColumn = ['Credit', 'SectionCount', 'AssignmentCount'].includes(cell.column.id)
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
                                    ) : semesterKeys.length === 0 ? (
                                      <div className={cn(
                                        "text-center py-8 text-gray-500 dark:text-gray-400",
                                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                      )}>
                                        {t('admin.noAssignments')}
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        {semesterKeys.map((semester) => {
                                          const semesterAssignments = assignmentsBySemester[semester]
                                          
                                          return (
                                            <div key={semester} className="space-y-2">
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
                                                    onClick={() => toggleSemesterAssignments(course.Course_ID, semester)}
                                                    className={cn(
                                                      "h-6 w-6 p-0",
                                                      neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                                                    )}
                                                  >
                                                    {expandedSections.has(`${course.Course_ID}-${semester}`) ? (
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
                                                    {t('admin.semester')}: {semester}
                                                  </span>
                                                  <Badge variant="secondary" className="ml-2">
                                                    {semesterAssignments.length} {t('admin.assignments')}
                                                  </Badge>
                                                </div>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  onClick={() => handleAddAssignmentForSemester(course.Course_ID, semester)}
                                                  className={cn(
                                                    "text-xs",
                                                    getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary')
                                                  )}
                                                >
                                                  <Plus className="h-3 w-3 mr-1" />
                                                  {t('admin.add')} {t('admin.assignment')}
                                                </Button>
                                              </div>
                                              {expandedSections.has(`${course.Course_ID}-${semester}`) && (
                                              <div className="space-y-2 pl-6">
                                                {semesterAssignments.map((assignment) => (
                  <div
                    key={assignment.AssignmentID}
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
                                                          {assignment.instructions ? assignment.instructions.substring(0, 50) + (assignment.instructions.length > 50 ? '...' : '') : `${t('admin.assignment')} #${assignment.AssignmentID}`}
                                                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.maxScore')}: </span>
                            <span>{assignment.MaxScore || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.deadline')}: </span>
                            <span>{assignment.submission_deadline ? new Date(assignment.submission_deadline).toLocaleString() : 'N/A'}</span>
                          </div>
                          {assignment.accepted_specification && (
                            <div>
                              <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.acceptedFormat')}: </span>
                              <span>{assignment.accepted_specification}</span>
                            </div>
                          )}
                        </div>
                        {assignment.instructions && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {assignment.instructions}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {assignment.instructions && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingAssignment(assignment)}
                            className={cn(
                              "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                              neoBrutalismMode 
                                ? "border-2 border-blue-600 dark:border-blue-400 rounded-none"
                                : ""
                            )}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.viewAssignment') || 'View Assignment'}</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAssignmentScores(assignment)}
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
                          onClick={() => handleEditAssignment(assignment)}
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
                          onClick={() => handleDeleteAssignment(assignment)}
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

        {/* Add/Edit Assignment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  value={formData.Course_ID}
                  onChange={(e) => setFormData({ ...formData, Course_ID: e.target.value })}
                  disabled={!!editingAssignment}
                  placeholder="CS101"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
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
                  onChange={(e) => setFormData({ ...formData, Semester: e.target.value })}
                  disabled={!!editingAssignment}
                  placeholder="2025-1"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
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
                  value={formData.MaxScore}
                  onChange={(e) => setFormData({ ...formData, MaxScore: e.target.value })}
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
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.submission_deadline}
                  onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
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
                  value={formData.accepted_specification}
                  onChange={(e) => setFormData({ ...formData, accepted_specification: e.target.value })}
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
                <Input
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Assignment instructions..."
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
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{editingAssignment ? t('admin.update') : t('admin.addNew')}</span>
              </Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Assignment Dialog */}
        <Dialog open={!!viewingAssignment} onOpenChange={(open) => !open && setViewingAssignment(null)}>
          {viewingAssignment && (
            <DialogContent className={cn(
              "bg-white dark:bg-[#1a1a1a] max-w-3xl max-h-[90vh] overflow-y-auto",
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
                  {t('admin.assignment')} #{viewingAssignment.AssignmentID}
                </DialogTitle>
                <p className={cn(
                  "text-sm text-[#85878d] dark:text-gray-400 mt-1",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {viewingAssignment.Course_ID} ({viewingAssignment.Semester})
                </p>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h4 className={cn(
                    "font-semibold text-[#211c37] dark:text-white mb-2",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>
                    {t('admin.instructions')}:
                  </h4>
                  <p className={cn(
                    "text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {viewingAssignment.instructions || 'N/A'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className={cn(
                      "font-medium text-[#676767] dark:text-gray-500",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.maxScore')}:
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {viewingAssignment.MaxScore || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className={cn(
                      "font-medium text-[#676767] dark:text-gray-500",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.deadline')}:
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {viewingAssignment.submission_deadline ? new Date(viewingAssignment.submission_deadline).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  {viewingAssignment.accepted_specification && (
                    <div>
                      <span className={cn(
                        "font-medium text-[#676767] dark:text-gray-500",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {t('admin.acceptedFormat')}:
                      </span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {viewingAssignment.accepted_specification}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* Assignment Submissions Dialog */}
        <Dialog open={!!viewingAssignmentScores} onOpenChange={(open) => !open && setViewingAssignmentScores(null)}>
          {viewingAssignmentScores && (
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
                  {t('admin.assignmentSubmissions') || 'Assignment Submissions'} - {viewingAssignmentScores.instructions ? viewingAssignmentScores.instructions.substring(0, 50) : `Assignment #${viewingAssignmentScores.AssignmentID}`}
                </DialogTitle>
                <p className={cn(
                  "text-sm text-[#85878d] dark:text-gray-400 mt-1",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {viewingAssignmentScores.Course_ID} ({viewingAssignmentScores.Semester}) - {assignmentSubmissions.length} {t('admin.students') || 'students'}
                </p>
              </DialogHeader>
              {loadingSubmissions ? (
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
      </div>
    </DashboardLayout>
  )
}
