import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { adminService, type CourseDetails, type CourseSection, type CourseStudent, type CourseTutor, type CourseStatistics, type Room, type ScheduleEntry } from '@/lib/api/adminService'
import { ArrowLeft, BookOpen, Users, GraduationCap, BarChart3, Loader2, ArrowUpDown, Plus, X, MapPin, Clock, Edit2, Search, Filter } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismTextClasses,
  getNeoBrutalismInputClasses
} from '@/lib/utils/theme-utils'
import CourseStatisticsView from '@/components/admin/CourseStatisticsView'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

export default function CourseDetailPage() {
  const { t } = useTranslation()
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null)
  const [sections, setSections] = useState<CourseSection[]>([])
  const [students, setStudents] = useState<CourseStudent[]>([])
  const [, setTutors] = useState<CourseTutor[]>([])
  const [statistics, setStatistics] = useState<CourseStatistics | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null)
  const [sectionRooms, setSectionRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [sectionSchedule, setSectionSchedule] = useState<ScheduleEntry[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [scheduleFormData, setScheduleFormData] = useState({
    Day_of_Week: '',
    Start_Period: '',
    End_Period: ''
  })
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEntry | null>(null)
  const [sectionSearchQuery, setSectionSearchQuery] = useState('')
  const [sectionSemesterFilter, setSectionSemesterFilter] = useState<string>('all')
  const [sectionSorting, setSectionSorting] = useState<SortingState>([])
  const neoBrutalismMode = useNeoBrutalismMode()

  useEffect(() => {
    if (courseId) {
      loadCourseData()
    }
  }, [courseId])

  // Define columns for students table
  const studentColumns: ColumnDef<CourseStudent>[] = useMemo(() => [
    {
      accessorKey: 'Last_Name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            {t('admin.student')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const student = row.original
        return (
          <div>
            <p className={cn(
              "font-semibold text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
            )}>
              {student.Last_Name} {student.First_Name}
            </p>
            <p className={cn(
              "text-xs text-[#85878d] dark:text-gray-400",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
            )}>
              {student.University_ID} • {student.Major}
            </p>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const nameA = `${rowA.original.Last_Name} ${rowA.original.First_Name}`
        const nameB = `${rowB.original.Last_Name} ${rowB.original.First_Name}`
        return nameA.localeCompare(nameB)
      },
    },
    {
      accessorKey: 'Section_ID',
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              {t('admin.section')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const student = row.original
        return (
          <div className="text-center">
            <p className={cn(
              "text-sm text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
            )}>
              {student.Section_ID}
            </p>
            <p className={cn(
              "text-xs text-[#85878d] dark:text-gray-400",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
            )}>
              {student.Semester}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'Status',
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              {t('admin.status')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const student = row.original
        return (
          <div className="flex justify-center">
            <Badge className={cn(
              student.Status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              student.Status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                : ""
            )}>
              {student.Status}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'Final_Grade',
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              {t('admin.finalGrade')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const grade = row.original.Final_Grade
        return (
          <div className="text-center">
            <p className={cn(
              "font-semibold text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
            )}>
              {grade !== null ? grade.toFixed(2) : 'N/A'}
            </p>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const gradeA = rowA.original.Final_Grade ?? -1
        const gradeB = rowB.original.Final_Grade ?? -1
        return gradeA - gradeB
      },
    },
    {
      accessorKey: 'Midterm_Grade',
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              {t('admin.midtermGrade')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const grade = row.original.Midterm_Grade
        return (
          <div className="text-center">
            <p className={cn(
              "text-sm text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
            )}>
              {grade !== null ? grade.toFixed(2) : 'N/A'}
            </p>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const gradeA = rowA.original.Midterm_Grade ?? -1
        const gradeB = rowB.original.Midterm_Grade ?? -1
        return gradeA - gradeB
      },
    },
    {
      accessorKey: 'Quiz_Grade',
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              {t('admin.quizGrade')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const grade = row.original.Quiz_Grade
        return (
          <div className="text-center">
            <p className={cn(
              "text-sm text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
            )}>
              {grade !== null ? grade.toFixed(2) : 'N/A'}
            </p>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const gradeA = rowA.original.Quiz_Grade ?? -1
        const gradeB = rowB.original.Quiz_Grade ?? -1
        return gradeA - gradeB
      },
    },
    {
      accessorKey: 'Assignment_Grade',
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              {t('admin.assignmentGrade')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const grade = row.original.Assignment_Grade
        return (
          <div className="text-center">
            <p className={cn(
              "text-sm text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
            )}>
              {grade !== null ? grade.toFixed(2) : 'N/A'}
            </p>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const gradeA = rowA.original.Assignment_Grade ?? -1
        const gradeB = rowB.original.Assignment_Grade ?? -1
        return gradeA - gradeB
      },
    },
    {
      id: 'GPA',
      accessorFn: (row) => {
        // Calculate GPA: Quiz 10%, Midterm 20%, Assignment 20%, Final 50%
        const quiz = row.Quiz_Grade ?? 0
        const midterm = row.Midterm_Grade ?? 0
        const assignment = row.Assignment_Grade ?? 0
        const final = row.Final_Grade ?? 0
        
        // Calculate total weight based on available grades
        let totalWeight = 0
        let weightedSum = 0
        
        if (row.Final_Grade !== null) {
          weightedSum += final * 0.5
          totalWeight += 0.5
        }
        if (row.Midterm_Grade !== null) {
          weightedSum += midterm * 0.2
          totalWeight += 0.2
        }
        if (row.Assignment_Grade !== null) {
          weightedSum += assignment * 0.2
          totalWeight += 0.2
        }
        if (row.Quiz_Grade !== null) {
          weightedSum += quiz * 0.1
          totalWeight += 0.1
        }
        
        // Return GPA if we have at least Final grade, otherwise null
        if (totalWeight > 0 && row.Final_Grade !== null) {
          return weightedSum / totalWeight
        }
        return null
      },
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              {t('admin.gpa') || 'GPA'}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const student = row.original
        // Calculate GPA: Quiz 10%, Midterm 20%, Assignment 20%, Final 50%
        const quiz = student.Quiz_Grade ?? 0
        const midterm = student.Midterm_Grade ?? 0
        const assignment = student.Assignment_Grade ?? 0
        const final = student.Final_Grade ?? 0
        
        // Calculate total weight based on available grades
        let totalWeight = 0
        let weightedSum = 0
        
        if (student.Final_Grade !== null) {
          weightedSum += final * 0.5
          totalWeight += 0.5
        }
        if (student.Midterm_Grade !== null) {
          weightedSum += midterm * 0.2
          totalWeight += 0.2
        }
        if (student.Assignment_Grade !== null) {
          weightedSum += assignment * 0.2
          totalWeight += 0.2
        }
        if (student.Quiz_Grade !== null) {
          weightedSum += quiz * 0.1
          totalWeight += 0.1
        }
        
        // Calculate GPA if we have at least Final grade
        const gpa = totalWeight > 0 && student.Final_Grade !== null 
          ? weightedSum / totalWeight 
          : null
        
        return (
          <div className="text-center">
            <p className={cn(
              "font-semibold text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
            )}>
              {gpa !== null ? gpa.toFixed(2) : 'N/A'}
            </p>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        // Calculate GPA for both rows
        const calculateGPA = (student: CourseStudent) => {
          const quiz = student.Quiz_Grade ?? 0
          const midterm = student.Midterm_Grade ?? 0
          const assignment = student.Assignment_Grade ?? 0
          const final = student.Final_Grade ?? 0
          
          let totalWeight = 0
          let weightedSum = 0
          
          if (student.Final_Grade !== null) {
            weightedSum += final * 0.5
            totalWeight += 0.5
          }
          if (student.Midterm_Grade !== null) {
            weightedSum += midterm * 0.2
            totalWeight += 0.2
          }
          if (student.Assignment_Grade !== null) {
            weightedSum += assignment * 0.2
            totalWeight += 0.2
          }
          if (student.Quiz_Grade !== null) {
            weightedSum += quiz * 0.1
            totalWeight += 0.1
          }
          
          return totalWeight > 0 && student.Final_Grade !== null 
            ? weightedSum / totalWeight 
            : -1
        }
        
        const gpaA = calculateGPA(rowA.original)
        const gpaB = calculateGPA(rowB.original)
        return gpaA - gpaB
      },
    },
  ], [t, neoBrutalismMode])

  const studentTable = useReactTable({
    data: students,
    columns: studentColumns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => `${row.University_ID}-${row.Section_ID}-${row.Semester}-${row.Assessment_ID}`,
    state: {
      sorting,
    },
  })

  const loadCourseData = async () => {
    if (!courseId) return
    
    try {
      setLoading(true)
      const [details, sectionsData, studentsData, tutorsData, statsData, roomsData] = await Promise.all([
        adminService.getCourseDetails(courseId),
        adminService.getCourseSections(courseId),
        adminService.getCourseStudents(courseId),
        adminService.getCourseTutors(courseId),
        adminService.getCourseStatistics(courseId),
        adminService.getRooms(),
      ])
      
      setCourseDetails(details)
      setSections(sectionsData)
      setStudents(studentsData)
      setTutors(tutorsData)
      setStatistics(statsData)
      setRooms(roomsData)
    } catch (error) {
      console.error('Error loading course data:', error)
      alert(t('admin.errorLoadingCourseData'))
    } finally {
      setLoading(false)
    }
  }

  const loadSectionRooms = async (section: CourseSection) => {
    try {
      setLoadingRooms(true)
      const data = await adminService.getSectionRooms(section.Section_ID, section.Course_ID, section.Semester)
      setSectionRooms(data)
    } catch (error) {
      console.error('Error loading section rooms:', error)
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleOpenRoomDialog = async (section: CourseSection) => {
    setSelectedSection(section)
    await loadSectionRooms(section)
    setIsRoomDialogOpen(true)
  }

  const handleAssignRoom = async (room: Room) => {
    if (!selectedSection) return
    try {
      await adminService.assignRoomToSection(
        selectedSection.Section_ID,
        selectedSection.Course_ID,
        selectedSection.Semester,
        room.Building_Name,
        room.Room_Name
      )
      await loadSectionRooms(selectedSection)
      await loadCourseData() // Reload sections to update room counts
    } catch (error) {
      console.error('Error assigning room:', error)
      alert('Failed to assign room. It may already be assigned to this section.')
    }
  }

  const handleRemoveRoom = async (room: Room) => {
    if (!selectedSection) return
    try {
      await adminService.removeRoomFromSection(
        selectedSection.Section_ID,
        selectedSection.Course_ID,
        selectedSection.Semester,
        room.Building_Name,
        room.Room_Name
      )
      await loadSectionRooms(selectedSection)
      await loadCourseData() // Reload sections to update room counts
    } catch (error) {
      console.error('Error removing room:', error)
      alert('Failed to remove room')
    }
  }

  const loadSectionSchedule = async (section: CourseSection) => {
    try {
      setLoadingSchedule(true)
      const data = await adminService.getSectionSchedule(section.Section_ID, section.Course_ID, section.Semester)
      setSectionSchedule(data)
    } catch (error) {
      console.error('Error loading section schedule:', error)
    } finally {
      setLoadingSchedule(false)
    }
  }

  const handleOpenScheduleDialog = async (section: CourseSection) => {
    setSelectedSection(section)
    setEditingSchedule(null)
    setScheduleFormData({ Day_of_Week: '', Start_Period: '', End_Period: '' })
    await loadSectionSchedule(section)
    setIsScheduleDialogOpen(true)
  }

  const handleSaveSchedule = async () => {
    if (!selectedSection) return
    
    try {
      if (editingSchedule) {
        // Update existing schedule entry
        await adminService.updateScheduleEntry(
          selectedSection.Section_ID,
          selectedSection.Course_ID,
          selectedSection.Semester,
          editingSchedule.Day_of_Week,
          editingSchedule.Start_Period,
          editingSchedule.End_Period,
          scheduleFormData.Day_of_Week ? parseInt(scheduleFormData.Day_of_Week) : undefined,
          scheduleFormData.Start_Period ? parseInt(scheduleFormData.Start_Period) : undefined,
          scheduleFormData.End_Period ? parseInt(scheduleFormData.End_Period) : undefined
        )
      } else {
        // Create new schedule entry
        await adminService.createScheduleEntry(
          selectedSection.Section_ID,
          selectedSection.Course_ID,
          selectedSection.Semester,
          parseInt(scheduleFormData.Day_of_Week),
          parseInt(scheduleFormData.Start_Period),
          parseInt(scheduleFormData.End_Period)
        )
      }
      await loadSectionSchedule(selectedSection)
      setEditingSchedule(null)
      setScheduleFormData({ Day_of_Week: '', Start_Period: '', End_Period: '' })
      // Show success message
      if (editingSchedule) {
        alert(t('admin.scheduleUpdated') || 'Schedule entry updated successfully')
      } else {
        alert(t('admin.scheduleSaved') || 'Schedule entry saved successfully')
      }
    } catch (error: any) {
      console.error('Error saving schedule:', error)
      const errorMessage = error?.response?.data?.error || error?.message || t('admin.errorSavingSchedule') || 'Failed to save schedule. Please check for conflicts.'
      alert(errorMessage)
    }
  }

  const handleEditSchedule = (entry: ScheduleEntry) => {
    setEditingSchedule(entry)
    setScheduleFormData({
      Day_of_Week: entry.Day_of_Week.toString(),
      Start_Period: entry.Start_Period.toString(),
      End_Period: entry.End_Period.toString()
    })
  }

  const handleDeleteSchedule = async (entry: ScheduleEntry) => {
    if (!selectedSection) return
    if (!confirm(t('admin.confirmDeleteSchedule') || 'Are you sure you want to delete this schedule entry?')) {
      return
    }
    try {
      await adminService.deleteScheduleEntry(
        selectedSection.Section_ID,
        selectedSection.Course_ID,
        selectedSection.Semester,
        entry.Day_of_Week,
        entry.Start_Period,
        entry.End_Period
      )
      await loadSectionSchedule(selectedSection)
      alert(t('admin.scheduleDeleted') || 'Schedule entry deleted successfully')
    } catch (error) {
      console.error('Error deleting schedule:', error)
      alert(t('admin.errorDeletingSchedule') || 'Failed to delete schedule entry')
    }
  }

  const formatPeriod = (period: number): string => {
    const hour = 5 + period // 1 = 6 AM, 2 = 7 AM, etc.
    const periodHour = hour % 24
    const ampm = periodHour < 12 ? 'AM' : 'PM'
    const displayHour = periodHour === 0 ? 12 : periodHour > 12 ? periodHour - 12 : periodHour
    return `${displayHour}:00 ${ampm}`
  }

  const getPeriodDuration = (startPeriod: number, endPeriod: number): number => {
    return endPeriod - startPeriod + 1
  }

  const getDayName = (day: number): string => {
    const days = [
      '', // 0 - unused
      t('admin.monday') || 'Monday',
      t('admin.tuesday') || 'Tuesday',
      t('admin.wednesday') || 'Wednesday',
      t('admin.thursday') || 'Thursday',
      t('admin.friday') || 'Friday',
      t('admin.saturday') || 'Saturday',
      t('admin.sunday') || 'Sunday'
    ]
    return days[day] || `Day ${day}`
  }

  // Filter and sort sections
  const filteredSections = useMemo(() => {
    let filtered = [...sections]

    // Filter by search query
    if (sectionSearchQuery) {
      const query = sectionSearchQuery.toLowerCase()
      filtered = filtered.filter(section =>
        section.Section_ID.toLowerCase().includes(query) ||
        section.Semester.toLowerCase().includes(query) ||
        (section.TutorNames && section.TutorNames.toLowerCase().includes(query)) ||
        (section.RoomsInfo && section.RoomsInfo.toLowerCase().includes(query))
      )
    }

    // Filter by semester
    if (sectionSemesterFilter !== 'all') {
      filtered = filtered.filter(section => section.Semester === sectionSemesterFilter)
    }

    return filtered
  }, [sections, sectionSearchQuery, sectionSemesterFilter])

  // Get unique semesters for filter
  const uniqueSemesters = useMemo(() => {
    return Array.from(new Set(sections.map(s => s.Semester))).sort()
  }, [sections])

  // Define columns for sections table
  const sectionColumns = useMemo<ColumnDef<CourseSection>[]>(() => [
    {
      accessorKey: 'Section_ID',
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className={cn(
                "h-8 px-2 lg:px-3",
                neoBrutalismMode 
                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                  : ""
              )}
            >
              {t('admin.section')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const section = row.original
        return (
          <div className="text-center">
            <span className={cn(
              "font-semibold text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
            )}>
              {section.Section_ID}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'Semester',
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className={cn(
                "h-8 px-2 lg:px-3",
                neoBrutalismMode 
                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                  : ""
              )}
            >
              {t('admin.semester')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        return (
          <div className="text-center">
            <Badge className={cn(
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                : ""
            )}>
              {row.original.Semester}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'StudentCount',
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className={cn(
                "h-8 px-2 lg:px-3",
                neoBrutalismMode 
                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                  : ""
              )}
            >
              {t('admin.students')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        return (
          <div className="text-center">
            <span className={cn(
              "font-semibold text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
            )}>
              {row.original.StudentCount}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'TutorCount',
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className={cn(
                "h-8 px-2 lg:px-3",
                neoBrutalismMode 
                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                  : ""
              )}
            >
              {t('admin.tutors')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        return (
          <div className="text-center">
            <span className={cn(
              "font-semibold text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
            )}>
              {row.original.TutorCount}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'RoomCount',
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className={cn(
                "h-8 px-2 lg:px-3",
                neoBrutalismMode 
                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                  : ""
              )}
            >
              {t('admin.rooms')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const section = row.original
        return (
          <div className="text-center">
            <span className={cn(
              "font-semibold text-[#211c37] dark:text-white",
              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
            )}>
              {section.RoomCount}
            </span>
            {section.RoomsInfo && (
              <p className={cn(
                "text-xs text-[#85878d] dark:text-gray-400 mt-1",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {section.RoomsInfo}
              </p>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: () => (
        <div className="text-center w-full">
          {t('admin.actions') || 'Actions'}
        </div>
      ),
      cell: ({ row }) => {
        const section = row.original
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenRoomDialog(section)}
              className={cn(
                "gap-1",
                neoBrutalismMode 
                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                  : ""
              )}
              title={t('admin.manageRooms') || 'Manage Rooms'}
            >
              <MapPin className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenScheduleDialog(section)}
              className={cn(
                "gap-1",
                neoBrutalismMode 
                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                  : ""
              )}
              title={t('admin.manageSchedule') || 'Manage Schedule'}
            >
              <Clock className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
    },
  ], [t, neoBrutalismMode])

  // Create table instance for sections
  const sectionsTable = useReactTable({
    data: filteredSections,
    columns: sectionColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSectionSorting,
    state: {
      sorting: sectionSorting,
    },
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#3bafa8]" />
        </div>
      </DashboardLayout>
    )
  }

  if (!courseDetails) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className={getNeoBrutalismTextClasses(neoBrutalismMode, 'body')}>{t('admin.courseNotFound')}</p>
          <Button
            onClick={() => {
              // Set flag to scroll to course list when returning
              sessionStorage.setItem('shouldScrollToCourseList', 'true')
              navigate('/admin/courses')
            }}
            className={cn(
              "mt-4",
              neoBrutalismMode 
                ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary')
                : ""
            )}
          >
            {t('admin.backToCourses')}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
              // Set flag to scroll to course list when returning
              sessionStorage.setItem('shouldScrollToCourseList', 'true')
              navigate('/admin/courses')
            }}
              className={cn(
                neoBrutalismMode 
                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                  : ""
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('admin.back')}
            </Button>
            <div>
              <h1 className={cn(
                "text-3xl font-bold text-[#211c37] dark:text-white mb-2",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {courseDetails.Name}
              </h1>
              <p className={cn(
                "text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.courseId')}: {courseDetails.Course_ID}
              </p>
            </div>
          </div>
        </div>

        {/* Course Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center",
                  neoBrutalismMode 
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                    : "rounded-lg"
                )}>
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.sections')}
                  </p>
                  <p className={cn(
                    "text-2xl font-bold text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {courseDetails.TotalSections}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 bg-green-100 dark:bg-green-900/30 flex items-center justify-center",
                  neoBrutalismMode 
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                    : "rounded-lg"
                )}>
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.students')}
                  </p>
                  <p className={cn(
                    "text-2xl font-bold text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {courseDetails.TotalStudents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center",
                  neoBrutalismMode 
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                    : "rounded-lg"
                )}>
                  <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.tutors')}
                  </p>
                  <p className={cn(
                    "text-2xl font-bold text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {courseDetails.TotalTutors}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center",
                  neoBrutalismMode 
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                    : "rounded-lg"
                )}>
                  <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.avgGrade')}
                  </p>
                  <p className={cn(
                    "text-2xl font-bold text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {courseDetails.AverageFinalGrade ? courseDetails.AverageFinalGrade.toFixed(2) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn(
            "grid w-full grid-cols-4",
            neoBrutalismMode 
              ? "bg-white dark:bg-[#2a2a2a] border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
              : "bg-gray-100 dark:bg-[#2a2a2a]"
          )}>
            <TabsTrigger value="overview" className={cn(
              neoBrutalismMode 
                ? "data-[state=active]:bg-[#3bafa8] data-[state=active]:text-white rounded-none"
                : "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]"
            )}>
              {t('admin.overview')}
            </TabsTrigger>
            <TabsTrigger value="sections" className={cn(
              neoBrutalismMode 
                ? "data-[state=active]:bg-[#3bafa8] data-[state=active]:text-white rounded-none"
                : "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]"
            )}>
              {t('admin.sections')} ({sections.length})
            </TabsTrigger>
            <TabsTrigger value="students" className={cn(
              neoBrutalismMode 
                ? "data-[state=active]:bg-[#3bafa8] data-[state=active]:text-white rounded-none"
                : "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]"
            )}>
              {t('admin.students')} ({students.length})
            </TabsTrigger>
            <TabsTrigger value="statistics" className={cn(
              neoBrutalismMode 
                ? "data-[state=active]:bg-[#3bafa8] data-[state=active]:text-white rounded-none"
                : "data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a]"
            )}>
              {t('admin.statistics')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
              <CardHeader>
                <CardTitle className={cn(
                  "text-xl text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {t('admin.courseInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={cn(
                      "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('admin.courseId')}
                    </p>
                    <p className={cn(
                      "font-semibold text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {courseDetails.Course_ID}
                    </p>
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('admin.courseName')}
                    </p>
                    <p className={cn(
                      "font-semibold text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {courseDetails.Name}
                    </p>
                  </div>
                  {courseDetails.Credit && (
                    <div>
                      <p className={cn(
                        "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        {t('admin.credit')}
                      </p>
                      <p className={cn(
                        "font-semibold text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {courseDetails.Credit}
                      </p>
                    </div>
                  )}
                  {courseDetails.Start_Date && (
                    <div>
                      <p className={cn(
                        "text-sm text-[#85878d] dark:text-gray-400 mb-1",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        {t('admin.startDate')}
                      </p>
                      <p className={cn(
                        "font-semibold text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {new Date(courseDetails.Start_Date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                <CardHeader>
                  <CardTitle className={cn(
                    "text-lg text-[#1f1d39] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {t('admin.activitySummary')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={cn(
                        "text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        {t('admin.assignments')}
                      </span>
                      <span className={cn(
                        "font-semibold text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {courseDetails.TotalAssignments}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={cn(
                        "text-[#85878d] dark:text-gray-400",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>
                        {t('admin.quizzes')}
                      </span>
                      <span className={cn(
                        "font-semibold text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {courseDetails.TotalQuizzes}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4 mt-4">
            {sections.length > 0 ? (
              <>
                {/* Search and Filter Bar */}
                <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Search Input */}
                      <div className="flex-1 relative">
                        <Search className={cn(
                          "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#85878d] dark:text-gray-400"
                        )} />
                        <Input
                          placeholder={t('admin.searchSections') || 'Search sections by ID, semester, tutor, or room...'}
                          value={sectionSearchQuery}
                          onChange={(e) => setSectionSearchQuery(e.target.value)}
                          className={cn(
                            "pl-10",
                            neoBrutalismMode 
                              ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                              : ""
                          )}
                        />
                      </div>
                      {/* Semester Filter */}
                      <div className="w-full sm:w-48">
                        <Select value={sectionSemesterFilter} onValueChange={setSectionSemesterFilter}>
                      <SelectTrigger className={cn(
                        "w-full",
                        neoBrutalismMode 
                          ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                          : ""
                      )}>
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder={t('admin.filterBySemester') || 'Filter by semester'} />
                      </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('admin.allSemesters') || 'All Semesters'}</SelectItem>
                            {uniqueSemesters.map((semester) => (
                              <SelectItem key={semester} value={semester}>
                                {semester}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {sectionSearchQuery || sectionSemesterFilter !== 'all' ? (
                      <div className="mt-3 flex items-center gap-2">
                        <span className={cn(
                          "text-sm text-[#85878d] dark:text-gray-400",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>
                          {t('admin.showingResults') || 'Showing'} {filteredSections.length} {t('admin.of') || 'of'} {sections.length} {t('admin.sections') || 'sections'}
                        </span>
                        {(sectionSearchQuery || sectionSemesterFilter !== 'all') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSectionSearchQuery('')
                              setSectionSemesterFilter('all')
                            }}
                            className={cn(
                              "h-6 px-2 text-xs",
                              neoBrutalismMode 
                                ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                                : ""
                            )}
                          >
                            {t('admin.clearFilters') || 'Clear filters'}
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Sections Table */}
                <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                  <CardContent className="pt-6">
                    {filteredSections.length > 0 ? (
                      <div className="rounded-md border border-[#e5e7e7] dark:border-[#333] overflow-hidden">
                        <Table>
                          <TableHeader>
                            {sectionsTable.getHeaderGroups().map((headerGroup) => (
                              <TableRow
                                key={headerGroup.id}
                                className={cn(
                                  "border-[#e5e7e7] dark:border-[#333]",
                                  neoBrutalismMode 
                                    ? "border-b-4"
                                    : ""
                                )}
                              >
                                {headerGroup.headers.map((header) => (
                                  <TableHead
                                    key={header.id}
                                    className={cn(
                                      "text-[#211c37] dark:text-white",
                                      header.id === 'actions' ? "text-center" : "text-center",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}
                                  >
                                    {header.isPlaceholder
                                      ? null
                                      : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                        )}
                                  </TableHead>
                                ))}
                              </TableRow>
                            ))}
                          </TableHeader>
                          <TableBody>
                            {sectionsTable.getRowModel().rows?.length ? (
                              sectionsTable.getRowModel().rows.map((row) => (
                                <TableRow
                                  key={row.id}
                                  data-state={row.getIsSelected() && 'selected'}
                                  className={cn(
                                    "border-[#e5e7e7] dark:border-[#333]",
                                    neoBrutalismMode 
                                      ? "border-b-4"
                                      : ""
                                  )}
                                >
                                  {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                      key={cell.id}
                                      className={cn(
                                        "text-[#211c37] dark:text-white",
                                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                      )}
                                    >
                                      {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                      )}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={sectionColumns.length}
                                  className="h-24 text-center"
                                >
                                  <p className={cn(
                                    "text-[#85878d] dark:text-gray-400",
                                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                  )}>
                                    {t('admin.noSectionsFound') || 'No sections found'}
                                  </p>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className={cn(
                          "text-[#85878d] dark:text-gray-400",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>
                          {t('admin.noSectionsFound') || 'No sections found'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                <CardContent className="pt-6 text-center py-12">
                  <p className={cn(
                    "text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.noSections')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-4 mt-4">
            {students.length > 0 ? (
              <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                <CardHeader>
                  <CardTitle className={cn(
                    "text-xl text-[#1f1d39] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {t('admin.enrolledStudents')} ({students.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        {studentTable.getHeaderGroups().map((headerGroup) => (
                          <TableRow 
                            key={headerGroup.id}
                            className={cn(
                              neoBrutalismMode 
                                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB]"
                                : "border-[#e5e7e7] dark:border-[#333]"
                            )}
                          >
                            {headerGroup.headers.map((header) => {
                              const isCenterColumn = ['Section_ID', 'Status', 'Final_Grade', 'Midterm_Grade', 'Quiz_Grade', 'Assignment_Grade', 'GPA'].includes(header.column.id)
                              return (
                                <TableHead 
                                  key={header.id}
                                  className={cn(
                                    "py-3 px-4",
                                    isCenterColumn ? 'text-center' : 'text-left',
                                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                  )}
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
                        {studentTable.getRowModel().rows?.length ? (
                          studentTable.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                              className={cn(
                                neoBrutalismMode 
                                  ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB]"
                                  : "border-[#e5e7e7] dark:border-[#333]"
                              )}
                            >
                              {row.getVisibleCells().map((cell) => {
                                const isCenterColumn = ['Section_ID', 'Status', 'Final_Grade', 'Midterm_Grade', 'Quiz_Grade', 'Assignment_Grade', 'GPA'].includes(cell.column.id)
                                return (
                                  <TableCell 
                                    key={cell.id}
                                    className={cn(
                                      "py-3 px-4",
                                      isCenterColumn && 'text-center'
                                    )}
                                  >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={studentColumns.length} className="h-24 text-center">
                              <p className={cn(
                                "text-[#85878d] dark:text-gray-400",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>
                                {t('admin.noStudents')}
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                <CardContent className="pt-6 text-center py-12">
                  <p className={cn(
                    "text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.noStudents')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4 mt-4">
            {statistics && (
              <CourseStatisticsView courseId={courseId || ''} statistics={statistics} />
            )}
          </TabsContent>
        </Tabs>

        {/* Room Management Dialog */}
        <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
          <DialogContent className={cn(
            "bg-white dark:bg-[#1a1a1a] max-w-2xl",
            neoBrutalismMode 
              ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
              : "border-[#e5e7e7] dark:border-[#333]"
          )}>
            <DialogHeader>
              <DialogTitle className={cn(
                "text-[#211c37] dark:text-white text-xl",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {t('admin.manageRooms') || 'Manage Rooms'} - {t('admin.section')} {selectedSection?.Section_ID}
              </DialogTitle>
              <DialogDescription className={cn(
                "text-gray-600 dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.roomManagementDescription') || 'Assign or remove rooms for this section'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Assigned Rooms */}
              <div>
                <Label className={cn(
                  "text-[#211c37] dark:text-white mb-2 block",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.assignedRooms') || 'Assigned Rooms'} ({sectionRooms.length})
                </Label>
                {loadingRooms ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#3bafa8]" />
                  </div>
                ) : sectionRooms.length > 0 ? (
                  <div className="space-y-2">
                    {sectionRooms.map((room) => (
                      <div
                        key={`${room.Building_Name}-${room.Room_Name}`}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md",
                          neoBrutalismMode 
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none"
                            : "border border-[#e5e7e7] dark:border-[#333] bg-gray-50 dark:bg-[#2a2a2a]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-[#3bafa8]" />
                          <div>
                            <p className={cn(
                              "font-semibold text-[#211c37] dark:text-white",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                            )}>
                              {room.Building_Name} - {room.Room_Name}
                            </p>
                            {room.Capacity && (
                              <p className={cn(
                                "text-xs text-[#85878d] dark:text-gray-400",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>
                                {t('admin.capacity')}: {room.Capacity}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRoom(room)}
                          className={cn(
                            "text-red-600 hover:text-red-700",
                            neoBrutalismMode 
                              ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                              : ""
                          )}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {t('admin.remove') || 'Remove'}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400 italic py-4 text-center",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.noRoomsAssigned') || 'No rooms assigned to this section'}
                  </p>
                )}
              </div>

              {/* Available Rooms */}
              <div>
                <Label className={cn(
                  "text-[#211c37] dark:text-white mb-2 block",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.availableRooms') || 'Available Rooms'}
                </Label>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {rooms
                    .filter(room => !sectionRooms.some(sr => sr.Room_Name === room.Room_Name && sr.Building_Name === room.Building_Name))
                    .map((room) => (
                      <div
                        key={`${room.Building_Name}-${room.Room_Name}`}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md",
                          neoBrutalismMode 
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none"
                            : "border border-[#e5e7e7] dark:border-[#333] bg-gray-50 dark:bg-[#2a2a2a]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-[#85878d]" />
                          <div>
                            <p className={cn(
                              "font-semibold text-[#211c37] dark:text-white",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                            )}>
                              {room.Building_Name} - {room.Room_Name}
                            </p>
                            {room.Capacity && (
                              <p className={cn(
                                "text-xs text-[#85878d] dark:text-gray-400",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>
                                {t('admin.capacity')}: {room.Capacity}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignRoom(room)}
                          className={cn(
                            "gap-1",
                            neoBrutalismMode 
                              ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                              : ""
                          )}
                        >
                          <Plus className="h-4 w-4" />
                          {t('admin.assign') || 'Assign'}
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRoomDialogOpen(false)}
                className={cn(
                  "border-[#e5e7e7] dark:border-[#333]",
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                    : ""
                )}
              >
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.close') || 'Close'}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Management Dialog */}
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogContent className={cn(
            "bg-white dark:bg-[#1a1a1a] max-w-3xl",
            neoBrutalismMode 
              ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
              : "border-[#e5e7e7] dark:border-[#333]"
          )}>
            <DialogHeader>
              <DialogTitle className={cn(
                "text-[#211c37] dark:text-white text-xl",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {t('admin.manageSchedule') || 'Manage Schedule'} - {t('admin.section')} {selectedSection?.Section_ID}
              </DialogTitle>
              <DialogDescription className={cn(
                "text-gray-600 dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.scheduleManagementDescription') || 'Add, edit, or remove schedule entries for this section'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Schedule Form */}
              <div className={cn(
                "p-4 rounded-md",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none"
                  : "border border-[#e5e7e7] dark:border-[#333] bg-gray-50 dark:bg-[#2a2a2a]"
              )}>
                <h4 className={cn(
                  "font-semibold mb-3 text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {editingSchedule ? (t('admin.editScheduleEntry') || 'Edit Schedule Entry') : (t('admin.addScheduleEntry') || 'Add Schedule Entry')}
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className={cn(
                      "text-[#211c37] dark:text-white mb-2 block",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('admin.dayOfWeek') || 'Day of Week'}
                    </Label>
                    <Select
                      value={scheduleFormData.Day_of_Week}
                      onValueChange={(value) => setScheduleFormData({ ...scheduleFormData, Day_of_Week: value })}
                    >
                      <SelectTrigger className={cn(
                        neoBrutalismMode 
                          ? getNeoBrutalismInputClasses(neoBrutalismMode)
                          : ""
                      )}>
                        <SelectValue placeholder={t('admin.selectDay') || 'Select day'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t('admin.monday') || 'Monday'}</SelectItem>
                        <SelectItem value="2">{t('admin.tuesday') || 'Tuesday'}</SelectItem>
                        <SelectItem value="3">{t('admin.wednesday') || 'Wednesday'}</SelectItem>
                        <SelectItem value="4">{t('admin.thursday') || 'Thursday'}</SelectItem>
                        <SelectItem value="5">{t('admin.friday') || 'Friday'}</SelectItem>
                        <SelectItem value="6">{t('admin.saturday') || 'Saturday'}</SelectItem>
                        <SelectItem value="7">{t('admin.sunday') || 'Sunday'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={cn(
                      "text-[#211c37] dark:text-white mb-2 block",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('admin.startPeriod') || 'Start Period'}
                    </Label>
                    <Select
                      value={scheduleFormData.Start_Period}
                      onValueChange={(value) => setScheduleFormData({ ...scheduleFormData, Start_Period: value })}
                    >
                      <SelectTrigger className={cn(
                        neoBrutalismMode 
                          ? getNeoBrutalismInputClasses(neoBrutalismMode)
                          : ""
                      )}>
                        <SelectValue placeholder={t('admin.selectStart') || 'Select start'} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 13 }, (_, i) => i + 1).map(period => (
                          <SelectItem key={period} value={period.toString()}>
                            {formatPeriod(period)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={cn(
                      "text-[#211c37] dark:text-white mb-2 block",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('admin.endPeriod') || 'End Period'}
                    </Label>
                    <Select
                      value={scheduleFormData.End_Period}
                      onValueChange={(value) => setScheduleFormData({ ...scheduleFormData, End_Period: value })}
                    >
                      <SelectTrigger className={cn(
                        neoBrutalismMode 
                          ? getNeoBrutalismInputClasses(neoBrutalismMode)
                          : ""
                      )}>
                        <SelectValue placeholder={t('admin.selectEnd') || 'Select end'} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 13 }, (_, i) => i + 1).map(period => (
                          <SelectItem key={period} value={period.toString()}>
                            {formatPeriod(period)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleSaveSchedule}
                    disabled={
                      !scheduleFormData.Day_of_Week || 
                      !scheduleFormData.Start_Period || 
                      !scheduleFormData.End_Period || 
                      (scheduleFormData.Start_Period && scheduleFormData.End_Period ? 
                        parseInt(scheduleFormData.Start_Period) >= parseInt(scheduleFormData.End_Period) : 
                        false)
                    }
                    className={cn(
                      neoBrutalismMode 
                        ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary')
                        : ""
                    )}
                  >
                    {editingSchedule ? (t('admin.update') || 'Update') : (t('admin.add') || 'Add')}
                  </Button>
                  {editingSchedule && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingSchedule(null)
                        setScheduleFormData({ Day_of_Week: '', Start_Period: '', End_Period: '' })
                      }}
                      className={cn(
                        neoBrutalismMode 
                          ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                          : ""
                      )}
                    >
                      {t('admin.cancel') || 'Cancel'}
                    </Button>
                  )}
                </div>
                {/* Validation message */}
                {scheduleFormData.Start_Period && scheduleFormData.End_Period && 
                 parseInt(scheduleFormData.Start_Period) >= parseInt(scheduleFormData.End_Period) && (
                  <p className={cn(
                    "text-sm text-red-600 dark:text-red-400 mt-2",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.startPeriodMustBeLessThanEnd') || 'Start period must be less than end period'}
                  </p>
                )}
              </div>

              {/* Schedule List */}
              <div>
                <Label className={cn(
                  "text-[#211c37] dark:text-white mb-2 block",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.scheduleEntries') || 'Schedule Entries'} ({sectionSchedule.length})
                </Label>
                {loadingSchedule ? (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#3bafa8]" />
                    <span className={cn(
                      "text-sm text-[#85878d] dark:text-gray-400",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('admin.loadingSchedule') || 'Loading schedule...'}
                    </span>
                  </div>
                ) : sectionSchedule.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sectionSchedule.map((entry, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md",
                          neoBrutalismMode 
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] bg-white dark:bg-[#2a2a2a] rounded-none"
                            : "border border-[#e5e7e7] dark:border-[#333] bg-gray-50 dark:bg-[#2a2a2a]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-[#3bafa8]" />
                          <div>
                            <p className={cn(
                              "font-semibold text-[#211c37] dark:text-white",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                            )}>
                              {getDayName(entry.Day_of_Week)}
                            </p>
                            <p className={cn(
                              "text-xs text-[#85878d] dark:text-gray-400",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                            )}>
                              {formatPeriod(entry.Start_Period)} - {formatPeriod(entry.End_Period)}
                              <span className="ml-2">
                                ({getPeriodDuration(entry.Start_Period, entry.End_Period)} {t('admin.periods') || 'periods'})
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSchedule(entry)}
                            className={cn(
                              neoBrutalismMode 
                                ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                                : ""
                            )}
                            title={t('admin.edit') || 'Edit'}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSchedule(entry)}
                            className={cn(
                              "text-red-600 hover:text-red-700",
                              neoBrutalismMode 
                                ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                                : ""
                            )}
                            title={t('admin.delete') || 'Delete'}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={cn(
                    "text-sm text-[#85878d] dark:text-gray-400 italic py-4 text-center",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.noScheduleEntries') || 'No schedule entries for this section'}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsScheduleDialogOpen(false)
                  setEditingSchedule(null)
                  setScheduleFormData({ Day_of_Week: '', Start_Period: '', End_Period: '' })
                }}
                className={cn(
                  "border-[#e5e7e7] dark:border-[#333]",
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                    : ""
                )}
              >
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.close') || 'Close'}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

