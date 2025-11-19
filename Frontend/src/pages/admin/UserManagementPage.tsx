import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { ScrollArea } from '@/components/ui/scroll-area'
import { adminService } from '@/lib/api/adminService'
import type { User, UserRole } from '@/types'
import { 
  Users, Plus, Search, Edit2, Trash2, GraduationCap, UserCheck, Shield,
  Download, ArrowUpDown, MoreHorizontal, ChevronDown, KeyRound, Eye, Filter, X, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismInputClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Pie, PieChart as RechartsPieChart, Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'

export default function UserManagementPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([]) // All users for statistics and charts
  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [majorFilter, setMajorFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [filterOptions, setFilterOptions] = useState<{
    majors: string[]
    departments: string[]
    admin_types: string[]
  }>({ majors: [], departments: [], admin_types: [] })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const neoBrutalismMode = useNeoBrutalismMode()

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // Form state
  const [formData, setFormData] = useState({
    University_ID: '',
    First_Name: '',
    Last_Name: '',
    Email: '',
    Phone_Number: '',
    Address: '',
    National_ID: '',
    Role: 'student' as UserRole | '',
    Password: '',
    Major: '',
    Current_degree: 'Bachelor',
    Name: '',
    Academic_Rank: '',
    Details: '',
    Department_Name: '',
    Type: 'Program Administrator',
  })

  useEffect(() => {
    loadUsers(true) // Initial load
    loadFilterOptions()
  }, [])

  const loadFilterOptions = async () => {
    try {
      const options = await adminService.getFilterOptions()
      setFilterOptions(options)
    } catch (error) {
      console.error('Error loading filter options:', error)
    }
  }

  const loadUsers = async (isInitialLoad: boolean = false) => {
    try {
      // Only show full loading on initial load, use filtering state for subsequent filters
      if (isInitialLoad) {
        setLoading(true)
      } else {
        setFiltering(true)
      }
      
      // Check if any advanced filters are active (excluding searchQuery as it can be used independently)
      const hasAdvancedFilters = (majorFilter && majorFilter !== 'all') || (departmentFilter && departmentFilter !== 'all') || (typeFilter && typeFilter !== 'all')
      
      if (hasAdvancedFilters) {
        // Use filter API
        const filteredUsers = await adminService.filterUsers({
          role: roleFilter !== 'all' ? roleFilter : undefined,
          major: majorFilter && majorFilter !== 'all' ? majorFilter : undefined,
          department: departmentFilter && departmentFilter !== 'all' ? departmentFilter : undefined,
          type: typeFilter && typeFilter !== 'all' ? typeFilter : undefined,
          search: debouncedSearchQuery.trim() || undefined,
        })
        
        const filteredUsersList: User[] = filteredUsers.map((u: any) => ({
          University_ID: u.University_ID,
          First_Name: u.First_Name,
          Last_Name: u.Last_Name,
          Email: u.Email,
          Phone_Number: u.Phone_Number ?? undefined,
          Address: u.Address ?? undefined,
          National_ID: u.National_ID ?? undefined,
          role: u.role as UserRole,
        }))
        
        setUsers(filteredUsersList)
        // Keep allUsers unchanged when filtering
        if (isInitialLoad) {
          setAllUsers(filteredUsersList)
        }
      } else {
        // Use regular API (load all)
        const [studentsResult, tutorsResult, adminsResult] = await Promise.all([
          adminService.getStudents().catch((err) => {
            console.error('Error loading students:', err)
            return []
          }),
          adminService.getTutors().catch((err) => {
            console.error('Error loading tutors:', err)
            return []
          }),
          adminService.getAdmins().catch((err) => {
            console.error('Error loading admins:', err)
            return []
          }),
        ])
        
        const students = Array.isArray(studentsResult) ? studentsResult : []
        const tutors = Array.isArray(tutorsResult) ? tutorsResult : []
        const admins = Array.isArray(adminsResult) ? adminsResult : []
        
        const allUsersList: User[] = [
          ...students.map(s => ({
            University_ID: s.University_ID,
            First_Name: s.First_Name,
            Last_Name: s.Last_Name,
            Email: s.Email,
            Phone_Number: s.Phone_Number ?? undefined,
            Address: s.Address ?? undefined,
            National_ID: s.National_ID ?? undefined,
            role: 'student' as UserRole,
          })),
          ...tutors.map(t => ({
            University_ID: t.University_ID,
            First_Name: t.First_Name,
            Last_Name: t.Last_Name,
            Email: t.Email,
            Phone_Number: t.Phone_Number ?? undefined,
            Address: t.Address ?? undefined,
            National_ID: t.National_ID ?? undefined,
            role: 'tutor' as UserRole,
          })),
          ...admins.map(a => ({
            University_ID: a.University_ID,
            First_Name: a.First_Name,
            Last_Name: a.Last_Name,
            Email: a.Email,
            Phone_Number: a.Phone_Number ?? undefined,
            Address: a.Address ?? undefined,
            National_ID: a.National_ID ?? undefined,
            role: 'admin' as UserRole,
          })),
        ]
        
        // Always update allUsers on initial load or when no advanced filters
        if (isInitialLoad || !hasAdvancedFilters) {
          setAllUsers(allUsersList)
        }
        
        // Apply role filter if needed
        if (roleFilter !== 'all') {
          const filtered = allUsersList.filter(u => u.role === roleFilter)
          setUsers(filtered)
        } else {
          setUsers(allUsersList)
        }
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      if (isInitialLoad) {
        setLoading(false)
      } else {
        setFiltering(false)
      }
    }
  }

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms debounce for search
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Reload users when filters change (using debounced search query)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers()
    }, 300) // Debounce to avoid too many API calls
    
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, majorFilter, departmentFilter, typeFilter, debouncedSearchQuery])

  // Statistics - Always use allUsers to show total system statistics
  const statistics = useMemo(() => {
    const total = allUsers.length
    const students = allUsers.filter(u => u.role === 'student').length
    const tutors = allUsers.filter(u => u.role === 'tutor').length
    const admins = allUsers.filter(u => u.role === 'admin').length
    
    return { total, students, tutors, admins }
  }, [allUsers])

  // Chart data
  const roleDistributionData = useMemo(() => {
    const total = statistics.total || 1 // Avoid division by zero
    return [
      { 
        role: 'student', 
        count: statistics.students, 
        fill: '#3b82f6',
        label: t('admin.student'),
        percentage: ((statistics.students / total) * 100).toFixed(1)
      },
      { 
        role: 'tutor', 
        count: statistics.tutors, 
        fill: '#10b981',
        label: t('admin.tutor'),
        percentage: ((statistics.tutors / total) * 100).toFixed(1)
      },
      { 
        role: 'admin', 
        count: statistics.admins, 
        fill: '#8b5cf6',
        label: t('admin.admin'),
        percentage: ((statistics.admins / total) * 100).toFixed(1)
      },
    ]
  }, [statistics, t])

  const chartConfig = {
    student: {
      label: t('admin.student'),
      color: '#3b82f6',
    },
    tutor: {
      label: t('admin.tutor'),
      color: '#10b981',
    },
    admin: {
      label: t('admin.admin'),
      color: '#8b5cf6',
    },
  } satisfies ChartConfig

  // Filtered users for table
  // Note: If advanced filters are active, filtering is done on backend
  // Otherwise, apply client-side filtering for role and search
  const filteredUsers = useMemo(() => {
    const hasAdvancedFilters = (majorFilter && majorFilter !== 'all') || (departmentFilter && departmentFilter !== 'all') || (typeFilter && typeFilter !== 'all')
    
    // If advanced filters are active, users are already filtered from backend
    if (hasAdvancedFilters) {
      return users
    }
    
    // Otherwise, apply client-side filtering
    let filtered = [...users]

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    if (searchQuery.trim()) {
      // Normalize Vietnamese text for better search (remove diacritics for comparison)
      const normalizeVietnamese = (str: string) => {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      }
      const query = normalizeVietnamese(searchQuery)
      filtered = filtered.filter(user => {
        const fullName = `${user.Last_Name} ${user.First_Name}`
        return (
          user.University_ID.toString().includes(searchQuery) ||
          normalizeVietnamese(fullName).includes(query) ||
          normalizeVietnamese(user.Email).includes(query) ||
          (user.Phone_Number && normalizeVietnamese(user.Phone_Number).includes(query))
        )
      })
    }

    return filtered
  }, [users, searchQuery, roleFilter, majorFilter, departmentFilter, typeFilter])

  // Table columns
  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('admin.selectAll')}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t('admin.selectRow')}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'University_ID',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            {t('admin.id')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('University_ID')}</div>
      ),
    },
    {
      accessorKey: 'First_Name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            {t('admin.firstName')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0",
              neoBrutalismMode 
                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                : "rounded-full"
            )}>
              {getRoleIcon(user.role)}
            </div>
            <div>
              <div className="font-medium">{user.Last_Name} {user.First_Name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{user.Email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            {t('admin.role')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const role = row.getValue('role') as UserRole
        return (
          <Badge className={cn(
            getRoleBadgeColor(role),
            neoBrutalismMode ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
          )}>
            {role ? t(`admin.${role}`) : t('admin.unknown')}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'Phone_Number',
      header: t('admin.phone'),
      cell: ({ row }) => (
        <div>{row.getValue('Phone_Number') || t('admin.noData')}</div>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('admin.actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewDetails(user.University_ID)}>
                <Eye className="mr-2 h-4 w-4" />
                {t('admin.viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                <Edit2 className="mr-2 h-4 w-4" />
                {t('admin.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResetPassword(user.University_ID)}>
                <KeyRound className="mr-2 h-4 w-4" />
                {t('admin.resetPassword')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteUser(user.University_ID)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('admin.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [t, neoBrutalismMode])

  const table = useReactTable({
    data: filteredUsers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleAddUser = () => {
    setEditingUser(null)
    setFormData({
      University_ID: '',
      First_Name: '',
      Last_Name: '',
      Email: '',
      Phone_Number: '',
      Address: '',
      National_ID: '',
      Role: 'student',
      Password: '',
      Major: '',
      Current_degree: 'Bachelor',
      Name: '',
      Academic_Rank: '',
      Details: '',
      Department_Name: '',
      Type: 'Program Administrator',
    })
    setIsDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      University_ID: user.University_ID.toString(),
      First_Name: user.First_Name,
      Last_Name: user.Last_Name,
      Email: user.Email,
      Phone_Number: user.Phone_Number || '',
      Address: user.Address || '',
      National_ID: user.National_ID || '',
      Role: user.role || 'student',
      Password: '',
      Major: (user as any).Major || '',
      Current_degree: (user as any).Current_degree || 'Bachelor',
      Name: (user as any).Name || '',
      Academic_Rank: (user as any).Academic_Rank || '',
      Details: (user as any).Details || '',
      Department_Name: (user as any).Department_Name || '',
      Type: (user as any).Type || 'Program Administrator',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteUser = async (universityId: number) => {
    if (!confirm(`${t('admin.confirmDelete')} ${universityId}?`)) {
      return
    }

    try {
      const user = users.find(u => u.University_ID === universityId)
      if (!user) {
        alert(t('admin.userNotFound'))
        return
      }

      if (user.role === 'student') {
        await adminService.deleteStudent(universityId)
      } else if (user.role === 'tutor') {
        await adminService.deleteTutor(universityId)
      } else if (user.role === 'admin') {
        await adminService.deleteAdmin(universityId)
      }
      
      await loadUsers(true) // Reload all users after delete
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(t('admin.errorDeletingUser'))
    }
  }

  const handleSaveUser = async () => {
    if (!formData.University_ID || !formData.First_Name || !formData.Last_Name || !formData.Email) {
      alert(t('admin.fillRequiredFields'))
      return
    }

    const universityId = parseInt(formData.University_ID)
    if (isNaN(universityId)) {
      alert(t('admin.universityIdMustBeNumber'))
      return
    }

    try {
      if (editingUser) {
        const currentRole = editingUser.role
        const newRole = formData.Role as UserRole
        
        // Check if role has changed
        if (newRole && newRole !== currentRole) {
          // Role changed - use updateUserRole
          const roleSpecificData: any = {}
          
          if (newRole === 'student') {
            if (!formData.Major) {
              alert(t('admin.majorRequired'))
              return
            }
            roleSpecificData.Major = formData.Major
            roleSpecificData.Current_degree = formData.Current_degree || 'Bachelor'
          } else if (newRole === 'tutor') {
            roleSpecificData.Name = formData.Name || `${formData.Last_Name} ${formData.First_Name}`
            roleSpecificData.Academic_Rank = formData.Academic_Rank || undefined
            roleSpecificData.Details = formData.Details || undefined
            roleSpecificData.Department_Name = formData.Department_Name || undefined
          } else if (newRole === 'admin') {
            roleSpecificData.Type = formData.Type || 'Program Administrator'
          }
          
          await adminService.updateUserRole(universityId, newRole, roleSpecificData)
          
          // Also update user info
          if (newRole === 'student') {
            await adminService.updateStudent(universityId, {
              First_Name: formData.First_Name,
              Last_Name: formData.Last_Name,
              Email: formData.Email,
              Phone_Number: formData.Phone_Number || undefined,
              Address: formData.Address || undefined,
              National_ID: formData.National_ID || undefined,
            })
          } else if (newRole === 'tutor') {
            await adminService.updateTutor(universityId, {
              First_Name: formData.First_Name,
              Last_Name: formData.Last_Name,
              Email: formData.Email,
              Phone_Number: formData.Phone_Number || undefined,
              Address: formData.Address || undefined,
              National_ID: formData.National_ID || undefined,
            })
          } else if (newRole === 'admin') {
            await adminService.updateAdmin(universityId, {
              First_Name: formData.First_Name,
              Last_Name: formData.Last_Name,
              Email: formData.Email,
              Phone_Number: formData.Phone_Number || undefined,
              Address: formData.Address || undefined,
              National_ID: formData.National_ID || undefined,
            })
          }
        } else {
          // Role unchanged - just update user info
          if (currentRole === 'student') {
            await adminService.updateStudent(universityId, {
              First_Name: formData.First_Name,
              Last_Name: formData.Last_Name,
              Email: formData.Email,
              Phone_Number: formData.Phone_Number || undefined,
              Address: formData.Address || undefined,
              National_ID: formData.National_ID || undefined,
            })
          } else if (currentRole === 'tutor') {
            await adminService.updateTutor(universityId, {
              First_Name: formData.First_Name,
              Last_Name: formData.Last_Name,
              Email: formData.Email,
              Phone_Number: formData.Phone_Number || undefined,
              Address: formData.Address || undefined,
              National_ID: formData.National_ID || undefined,
            })
          } else if (currentRole === 'admin') {
            await adminService.updateAdmin(universityId, {
              First_Name: formData.First_Name,
              Last_Name: formData.Last_Name,
              Email: formData.Email,
              Phone_Number: formData.Phone_Number || undefined,
              Address: formData.Address || undefined,
              National_ID: formData.National_ID || undefined,
            })
          }
        }
      } else {
        const existingUser = users.find(u => u.University_ID === universityId)
        if (existingUser) {
          alert(t('admin.universityIdExists'))
          return
        }

        if (!formData.Role) {
          alert(t('admin.pleaseSelectRole'))
          return
        }

        const baseUserData = {
          University_ID: universityId,
          First_Name: formData.First_Name,
          Last_Name: formData.Last_Name,
          Email: formData.Email,
          Phone_Number: formData.Phone_Number || null,
          Address: formData.Address || null,
          National_ID: formData.National_ID || null,
          Password: formData.Password || '123456',
        }

        if (formData.Role === 'student') {
          await adminService.createStudent({
            ...baseUserData,
            Major: formData.Major || 'Computer Science',
            Current_degree: formData.Current_degree || 'Bachelor',
          })
        } else if (formData.Role === 'tutor') {
          await adminService.createTutor({
            ...baseUserData,
            Name: formData.Name || `${formData.Last_Name} ${formData.First_Name}`,
            Academic_Rank: formData.Academic_Rank || null,
            Details: formData.Details || null,
            Department_Name: formData.Department_Name || null,
            Issuance_Date: null,
          })
        } else if (formData.Role === 'admin') {
          await adminService.createAdmin({
            ...baseUserData,
            Type: formData.Type || 'Program Administrator',
          })
        }
      }

      setIsDialogOpen(false)
      await loadUsers(true) // Reload all users after save
    } catch (error) {
      console.error('Error saving user:', error)
      alert(t('admin.errorSavingUser'))
    }
  }

  const handleResetPassword = async (universityId: number) => {
    if (!confirm(t('admin.confirmResetPassword'))) {
      return
    }

    try {
      const result = await adminService.resetUserPassword(universityId)
      alert(t('admin.passwordResetSuccess', { password: result.default_password }))
    } catch (error) {
      console.error('Error resetting password:', error)
      alert(t('admin.errorResettingPassword'))
    }
  }

  const handleViewDetails = async (universityId: number) => {
    setLoadingDetails(true)
    setIsDetailsDialogOpen(true)
    try {
      const details = await adminService.getUserDetails(universityId)
      setSelectedUserDetails(details)
    } catch (error) {
      console.error('Error loading user details:', error)
      alert(t('admin.errorLoadingDetails'))
      setIsDetailsDialogOpen(false)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleExportCSV = () => {
    const headers = [
      t('admin.csvId'),
      t('admin.csvFirstName'),
      t('admin.csvLastName'),
      t('admin.csvEmail'),
      t('admin.csvPhone'),
      t('admin.csvRole'),
      t('admin.csvAddress')
    ]
    const rows = filteredUsers.map(user => [
      user.University_ID,
      user.First_Name,
      user.Last_Name,
      user.Email,
      user.Phone_Number || '',
      user.role || '',
      user.Address || '',
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      alert(t('admin.selectAtLeastOneUser'))
      return
    }

    if (!confirm(t('admin.confirmBulkDelete', { count: selectedRows.length }))) {
      return
    }

    try {
      for (const row of selectedRows) {
        const user = row.original
        if (user.role === 'student') {
          await adminService.deleteStudent(user.University_ID)
        } else if (user.role === 'tutor') {
          await adminService.deleteTutor(user.University_ID)
        } else if (user.role === 'admin') {
          await adminService.deleteAdmin(user.University_ID)
        }
      }
      
      setRowSelection({})
      await loadUsers(true) // Reload all users after bulk delete
      alert(t('admin.bulkDeleteSuccess', { count: selectedRows.length }))
    } catch (error) {
      console.error('Error bulk deleting users:', error)
      alert(t('admin.errorDeletingUser'))
    }
  }

  const getRoleIcon = (role?: UserRole) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case 'tutor':
        return <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'admin':
        return <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      default:
        return <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'tutor':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  // Calculate GPA for a course: 10% quiz + 20% assignment + 20% midterm + 50% final
  const calculateCourseGPA = (course: any): number | null => {
    const quiz = course.Quiz_Grade !== null ? parseFloat(course.Quiz_Grade) : null
    const assignment = course.Assignment_Grade !== null ? parseFloat(course.Assignment_Grade) : null
    const midterm = course.Midterm_Grade !== null ? parseFloat(course.Midterm_Grade) : null
    const final = course.Final_Grade !== null ? parseFloat(course.Final_Grade) : null

    // If final grade exists, use it with weights
    if (final !== null) {
      let total = final * 0.5
      let weightSum = 0.5

      if (midterm !== null) {
        total += midterm * 0.2
        weightSum += 0.2
      }
      if (assignment !== null) {
        total += assignment * 0.2
        weightSum += 0.2
      }
      if (quiz !== null) {
        total += quiz * 0.1
        weightSum += 0.1
      }

      // If we have final grade, return weighted average (normalize if some components are missing)
      return total / weightSum
    }

    // If no final grade, return null
    return null
  }

  // Convert GPA to letter grade according to Vietnamese grading scale
  const getLetterGrade = (gpa: number): { letter: string; scale4: number; classification: string } => {
    if (gpa >= 8.5) {
      return { letter: 'A+', scale4: 4.0, classification: 'excellent' }
    } else if (gpa >= 8.0) {
      return { letter: 'B+', scale4: 3.5, classification: 'good' }
    } else if (gpa >= 7.0) {
      return { letter: 'B', scale4: 3.0, classification: 'good' }
    } else if (gpa >= 6.5) {
      return { letter: 'C+', scale4: 2.5, classification: 'fair' }
    } else if (gpa >= 5.5) {
      return { letter: 'C', scale4: 2.0, classification: 'fair' }
    } else if (gpa >= 5.0) {
      return { letter: 'D+', scale4: 1.5, classification: 'average' }
    } else if (gpa >= 4.0) {
      return { letter: 'D', scale4: 1.0, classification: 'average' }
    } else {
      return { letter: 'F', scale4: 0.0, classification: 'poor' }
    }
  }

  // Get color classes for letter grade
  const getLetterGradeColor = (gpa: number) => {
    if (gpa >= 8.5) {
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-300 dark:border-emerald-700'
      }
    } else if (gpa >= 8.0) {
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-300 dark:border-green-700'
      }
    } else if (gpa >= 7.0) {
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-300 dark:border-blue-700'
      }
    } else if (gpa >= 6.5) {
      return {
        bg: 'bg-cyan-100 dark:bg-cyan-900/30',
        text: 'text-cyan-700 dark:text-cyan-400',
        border: 'border-cyan-300 dark:border-cyan-700'
      }
    } else if (gpa >= 5.5) {
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-300 dark:border-yellow-700'
      }
    } else if (gpa >= 5.0) {
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-300 dark:border-orange-700'
      }
    } else if (gpa >= 4.0) {
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-300 dark:border-red-700'
      }
    } else {
      return {
        bg: 'bg-gray-100 dark:bg-gray-900/30',
        text: 'text-gray-700 dark:text-gray-400',
        border: 'border-gray-300 dark:border-gray-700'
      }
    }
  }

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
            {t('admin.userManagement')}
          </h1>
          <p className={cn(
            "text-[#85878d] dark:text-gray-400",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>
            {t('admin.userManagementSubtitle')}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-sm font-medium text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.totalUsers')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {statistics.total}
              </div>
              <p className={cn(
                "text-xs text-muted-foreground",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.totalUsersInSystem')}
              </p>
            </CardContent>
          </Card>

          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-sm font-medium text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.student')}
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold text-blue-600 dark:text-blue-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {statistics.students}
              </div>
              <p className={cn(
                "text-xs text-muted-foreground",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {((statistics.students / statistics.total) * 100).toFixed(1)}% {t('admin.ofTotal')}
              </p>
            </CardContent>
          </Card>

          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-sm font-medium text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.tutor')}
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold text-green-600 dark:text-green-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {statistics.tutors}
              </div>
              <p className={cn(
                "text-xs text-muted-foreground",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {((statistics.tutors / statistics.total) * 100).toFixed(1)}% {t('admin.ofTotal')}
              </p>
            </CardContent>
          </Card>

          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-sm font-medium text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.admin')}
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold text-purple-600 dark:text-purple-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {statistics.admins}
              </div>
              <p className={cn(
                "text-xs text-muted-foreground",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {((statistics.admins / statistics.total) * 100).toFixed(1)}% {t('admin.ofTotal')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Role Distribution Pie Chart */}
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardHeader>
              <CardTitle className={cn(
                "text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {t('admin.roleDistribution')}
              </CardTitle>
              <CardDescription className={cn(
                "text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.roleDistributionSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                <RechartsPieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={roleDistributionData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ChartContainer>
              {/* Custom Legend */}
              <div className={cn(
                "flex flex-wrap items-center justify-center gap-4 mt-4",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {roleDistributionData.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-sm text-[#211c37] dark:text-white">
                      <span className="font-medium">{entry.label}</span>
                      {' '}
                      <span className="text-muted-foreground">
                        ({entry.count} - {entry.percentage}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Comparison Bar Chart */}
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardHeader>
              <CardTitle className={cn(
                "text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {t('admin.quantityComparison')}
              </CardTitle>
              <CardDescription className={cn(
                "text-[#85878d] dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {t('admin.quantityComparisonSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                <BarChart accessibilityLayer data={roleDistributionData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [value, t('admin.totalUsers')]}
                  />
                  <Bar dataKey="count" radius={4}>
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
              {/* Custom Legend */}
              <div className={cn(
                "flex flex-wrap items-center justify-center gap-4 mt-4",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {roleDistributionData.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-sm text-[#211c37] dark:text-white">
                      <span className="font-medium">{entry.label}</span>
                      {' '}
                      <span className="text-muted-foreground">
                        ({entry.count})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Basic Filters and Actions */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Top Row: Search, Role Filter, Advanced Filters Toggle, Actions */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-1 gap-4 items-center w-full md:w-auto">
                  <div className="flex-1 md:flex-initial">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={t('admin.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                          "pl-10 bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white w-full md:w-[300px]",
                          getNeoBrutalismInputClasses(neoBrutalismMode)
                        )}
                      />
                    </div>
                  </div>
                  <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                    <SelectTrigger className={cn(
                      "w-[180px] bg-white dark:bg-[#2a2a2a]",
                      getNeoBrutalismInputClasses(neoBrutalismMode)
                    )}>
                      <SelectValue placeholder={t('admin.filterByRole')} />
                    </SelectTrigger>
                    <SelectContent className={cn(
                      neoBrutalismMode 
                        ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                        : ""
                    )}>
                      <SelectItem value="all">{t('admin.all')}</SelectItem>
                      <SelectItem value="student">{t('admin.student')}</SelectItem>
                      <SelectItem value="tutor">{t('admin.tutor')}</SelectItem>
                      <SelectItem value="admin">{t('admin.admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={cn(
                      "gap-2",
                      (majorFilter !== 'all' || departmentFilter !== 'all' || typeFilter !== 'all')
                        ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "",
                      neoBrutalismMode 
                        ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                        : ""
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    {t('admin.advancedFilters')}
                    {(majorFilter !== 'all' || departmentFilter !== 'all' || typeFilter !== 'all') && (
                      <Badge className={cn(
                        "ml-1 bg-blue-500 text-white",
                        neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                      )}>
                        {[
                          majorFilter !== 'all' ? 1 : 0,
                          departmentFilter !== 'all' ? 1 : 0,
                          typeFilter !== 'all' ? 1 : 0
                        ].reduce((a, b) => a + b, 0)}
                      </Badge>
                    )}
                  </Button>
                </div>
                
                <div className="flex gap-2">
                {table.getFilteredSelectedRowModel().rows.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleBulkDelete}
                    className={cn(
                      "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400",
                      neoBrutalismMode 
                        ? "border-4 border-red-600 dark:border-red-400 rounded-none"
                        : ""
                    )}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa đã chọn ({table.getFilteredSelectedRowModel().rows.length})
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className={cn(
                    "border-[#e5e7e7] dark:border-[#333]",
                    neoBrutalismMode 
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                      : ""
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('admin.export')}
                </Button>
                <Button
                  onClick={handleAddUser}
                  className={cn(
                    "w-full md:w-auto",
                    neoBrutalismMode 
                      ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                      : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                  )}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.addUser')}</span>
                </Button>
                </div>
              </div>

              {/* Active Filters Display */}
              {(majorFilter !== 'all' || departmentFilter !== 'all' || typeFilter !== 'all' || debouncedSearchQuery.trim()) && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                  <span className={cn(
                    "text-sm text-muted-foreground",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.activeFilters')}:
                  </span>
                  {debouncedSearchQuery.trim() && (
                    <Badge variant="secondary" className={cn(
                      "gap-1",
                      neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                    )}>
                      {t('admin.search')}: "{debouncedSearchQuery}"
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setDebouncedSearchQuery('')
                        }}
                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {majorFilter !== 'all' && (
                    <Badge variant="secondary" className={cn(
                      "gap-1",
                      neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                    )}>
                      {t('admin.major')}: {majorFilter}
                      <button
                        onClick={() => setMajorFilter('all')}
                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {departmentFilter !== 'all' && (
                    <Badge variant="secondary" className={cn(
                      "gap-1",
                      neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                    )}>
                      {t('admin.department')}: {departmentFilter}
                      <button
                        onClick={() => setDepartmentFilter('all')}
                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {typeFilter !== 'all' && (
                    <Badge variant="secondary" className={cn(
                      "gap-1",
                      neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                    )}>
                      {t('admin.adminType')}: {typeFilter}
                      <button
                        onClick={() => setTypeFilter('all')}
                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMajorFilter('all')
                      setDepartmentFilter('all')
                      setTypeFilter('all')
                      setSearchQuery('')
                      setDebouncedSearchQuery('')
                    }}
                    className={cn(
                      "h-7 text-xs",
                      neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                    )}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t('admin.clearAllFilters')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters Panel - Separate Card */}
        {showAdvancedFilters && (
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={cn(
                    "text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {t('admin.advancedFilters')}
                  </CardTitle>
                  <CardDescription className={cn(
                    "text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.advancedFiltersDescription')}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Role Filter */}
                <div className="space-y-2">
                  <Label className={cn(
                    "text-[#211c37] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>
                    {t('admin.role')}
                  </Label>
                  <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                    <SelectTrigger className={cn(
                      "bg-white dark:bg-[#2a2a2a]",
                      getNeoBrutalismInputClasses(neoBrutalismMode)
                    )}>
                      <SelectValue placeholder={t('admin.filterByRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('admin.all')}</SelectItem>
                      <SelectItem value="student">{t('admin.student')}</SelectItem>
                      <SelectItem value="tutor">{t('admin.tutor')}</SelectItem>
                      <SelectItem value="admin">{t('admin.admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Major Filter (for Students) */}
                {(roleFilter === 'all' || roleFilter === 'student') && (
                  <div className="space-y-2">
                    <Label className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.major')}
                    </Label>
                    <Select value={majorFilter} onValueChange={setMajorFilter}>
                      <SelectTrigger className={cn(
                        "bg-white dark:bg-[#2a2a2a]",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}>
                        <SelectValue placeholder={t('admin.selectMajor')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('admin.all')}</SelectItem>
                        {filterOptions.majors.map((major) => (
                          <SelectItem key={major} value={major}>{major}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Department Filter (for Tutors) */}
                {(roleFilter === 'all' || roleFilter === 'tutor') && (
                  <div className="space-y-2">
                    <Label className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.department')}
                    </Label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className={cn(
                        "bg-white dark:bg-[#2a2a2a]",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}>
                        <SelectValue placeholder={t('admin.selectDepartment')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('admin.all')}</SelectItem>
                        {filterOptions.departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Type Filter (for Admins) */}
                {(roleFilter === 'all' || roleFilter === 'admin') && (
                  <div className="space-y-2">
                    <Label className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.adminType')}
                    </Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className={cn(
                        "bg-white dark:bg-[#2a2a2a]",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}>
                        <SelectValue placeholder={t('admin.selectAdminType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('admin.all')}</SelectItem>
                        {filterOptions.admin_types.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className={cn(
                    "text-xl text-[#1f1d39] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                  )}>
                    {t('admin.userList')}
                  </CardTitle>
                  <CardDescription className={cn(
                    "text-[#85878d] dark:text-gray-400",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>
                    {t('admin.totalUsers')} {filteredUsers.length} {t('admin.users')}
                  </CardDescription>
                </div>
                {filtering && (
                  <Loader2 className="h-5 w-5 animate-spin text-[#3bafa8] dark:text-[#3bafa8]" />
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    {t('admin.columns')} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {filtering && (
                <div className="absolute inset-0 bg-white/80 dark:bg-[#1a1a1a]/80 z-10 flex items-center justify-center rounded-md">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#3bafa8] dark:text-[#3bafa8]" />
                    <span className={cn(
                      "text-sm text-muted-foreground",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('common.loading')}...
                    </span>
                  </div>
                </div>
              )}
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
                          return (
                            <TableHead key={header.id}>
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
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
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
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          {t('admin.noUsers')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </ScrollArea>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className={cn(
                "text-muted-foreground flex-1 text-sm",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {table.getFilteredSelectedRowModel().rows.length} of{' '}
                {table.getFilteredRowModel().rows.length} hàng đã chọn.
              </div>
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

        {/* Add/Edit User Dialog - Keep existing dialog code */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                {editingUser ? t('admin.editUserInfo') : t('admin.addNewUser')}
              </DialogTitle>
              <DialogDescription className={cn(
                "text-gray-600 dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {editingUser ? t('admin.updateUserInfo') : t('admin.fillInfoToCreate')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="university-id" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.universityId')} *
                </Label>
                <Input
                  id="university-id"
                  value={formData.University_ID}
                  onChange={(e) => setFormData({ ...formData, University_ID: e.target.value })}
                  disabled={!!editingUser}
                  placeholder="1234567"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first-name" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.firstName')} *
                </Label>
                <Input
                  id="first-name"
                  value={formData.First_Name}
                  onChange={(e) => setFormData({ ...formData, First_Name: e.target.value })}
                  placeholder={t('admin.placeholderFirstName')}
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.lastName')} *
                </Label>
                <Input
                  id="last-name"
                  value={formData.Last_Name}
                  onChange={(e) => setFormData({ ...formData, Last_Name: e.target.value })}
                  placeholder={t('admin.placeholderLastName')}
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.email')} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  placeholder="user@hcmut.edu.vn"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.phoneNumber')}
                </Label>
                <Input
                  id="phone"
                  value={formData.Phone_Number}
                  onChange={(e) => setFormData({ ...formData, Phone_Number: e.target.value })}
                  placeholder="0900000000"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="national-id" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.nationalId')}
                </Label>
                <Input
                  id="national-id"
                  value={formData.National_ID}
                  onChange={(e) => setFormData({ ...formData, National_ID: e.target.value })}
                  placeholder="079123456789"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.address')}
                </Label>
                <Input
                  id="address"
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  placeholder="123 Street, District, HCMC"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              
              {/* Role selector - show for both new and edit */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="role" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.role')} {editingUser ? '' : '*'}
                  {editingUser && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({t('admin.currentRole')}: {t(`admin.${editingUser.role}`)})
                    </span>
                  )}
                </Label>
                <Select 
                  value={formData.Role} 
                  onValueChange={(value) => setFormData({ ...formData, Role: value as UserRole })}
                >
                  <SelectTrigger className={cn(
                    "bg-white dark:bg-[#2a2a2a]",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}>
                    <SelectValue placeholder={t('admin.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">{t('admin.student')}</SelectItem>
                    <SelectItem value="tutor">{t('admin.tutor')}</SelectItem>
                    <SelectItem value="admin">{t('admin.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {!editingUser && (
                <>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="password" className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>
                      {t('admin.password')} (mặc định: 123456)
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.Password}
                      onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
                      placeholder="Để trống để dùng mật khẩu mặc định"
                      className={cn(
                        "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                        getNeoBrutalismInputClasses(neoBrutalismMode)
                      )}
                    />
                  </div>
                  
                  {/* Student specific fields - show when role is student or when editing and changing to student */}
                  {formData.Role === 'student' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="major" className={cn(
                          "text-[#211c37] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                          {t('admin.major')} *
                        </Label>
                        <Input
                          id="major"
                          value={formData.Major}
                          onChange={(e) => setFormData({ ...formData, Major: e.target.value })}
                          placeholder={t('admin.placeholderMajor')}
                          className={cn(
                            "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                            getNeoBrutalismInputClasses(neoBrutalismMode)
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="degree" className={cn(
                          "text-[#211c37] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                          {t('admin.degree')}
                        </Label>
                        <Select 
                          value={formData.Current_degree} 
                          onValueChange={(value) => setFormData({ ...formData, Current_degree: value })}
                        >
                          <SelectTrigger className={cn(
                            "bg-white dark:bg-[#2a2a2a]",
                            getNeoBrutalismInputClasses(neoBrutalismMode)
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bachelor">{t('admin.degreeBachelor')}</SelectItem>
                            <SelectItem value="Master">{t('admin.degreeMaster')}</SelectItem>
                            <SelectItem value="PhD">{t('admin.degreePhD')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  {/* Tutor specific fields - show when role is tutor */}
                  {formData.Role === 'tutor' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="tutor-name" className={cn(
                          "text-[#211c37] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                          {t('admin.tutorName')}
                        </Label>
                        <Input
                          id="tutor-name"
                          value={formData.Name}
                          onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                          placeholder={t('admin.placeholderTutorName')}
                          className={cn(
                            "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                            getNeoBrutalismInputClasses(neoBrutalismMode)
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="academic-rank" className={cn(
                          "text-[#211c37] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                          {t('admin.academicRank')}
                        </Label>
                        <Input
                          id="academic-rank"
                          value={formData.Academic_Rank}
                          onChange={(e) => setFormData({ ...formData, Academic_Rank: e.target.value })}
                          placeholder={t('admin.placeholderAcademicRank')}
                          className={cn(
                            "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                            getNeoBrutalismInputClasses(neoBrutalismMode)
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department" className={cn(
                          "text-[#211c37] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                          {t('admin.department')}
                        </Label>
                        <Input
                          id="department"
                          value={formData.Department_Name}
                          onChange={(e) => setFormData({ ...formData, Department_Name: e.target.value })}
                          placeholder={t('admin.placeholderMajor')}
                          className={cn(
                            "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                            getNeoBrutalismInputClasses(neoBrutalismMode)
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="details" className={cn(
                          "text-[#211c37] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                          {t('admin.details')}
                        </Label>
                        <Input
                          id="details"
                          value={formData.Details}
                          onChange={(e) => setFormData({ ...formData, Details: e.target.value })}
                          placeholder={t('admin.placeholderDetails')}
                          className={cn(
                            "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                            getNeoBrutalismInputClasses(neoBrutalismMode)
                          )}
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Admin specific fields - show when role is admin */}
                  {formData.Role === 'admin' && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="admin-type" className={cn(
                        "text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {t('admin.adminType')}
                      </Label>
                      <Select 
                        value={formData.Type} 
                        onValueChange={(value) => setFormData({ ...formData, Type: value })}
                      >
                        <SelectTrigger className={cn(
                          "bg-white dark:bg-[#2a2a2a]",
                          getNeoBrutalismInputClasses(neoBrutalismMode)
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Program Administrator">{t('admin.adminTypeProgramAdministrator')}</SelectItem>
                          <SelectItem value="Office of Student Affairs">{t('admin.adminTypeStudentAffairs')}</SelectItem>
                          <SelectItem value="Office of Academic Affairs">{t('admin.adminTypeAcademicAffairs')}</SelectItem>
                          <SelectItem value="Coordinator">{t('admin.adminTypeCoordinator')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button
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
                onClick={handleSaveUser}
                className={cn(
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                    : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                )}
              >
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{editingUser ? t('admin.update') : t('admin.addNew')}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className={cn(
            "bg-white dark:bg-[#1a1a1a] max-w-4xl max-h-[90vh] p-0",
            neoBrutalismMode 
              ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
              : "border-[#e5e7e7] dark:border-[#333]"
          )}>
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle className={cn(
                "text-[#211c37] dark:text-white text-xl",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {t('admin.userDetails')}
              </DialogTitle>
            </DialogHeader>

            {loadingDetails ? (
              <div className="flex items-center justify-center py-8 px-6">
                <div className={cn(
                  "text-lg text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>{t('common.loading')}</div>
              </div>
            ) : selectedUserDetails ? (
              <ScrollArea className="max-h-[calc(90vh-120px)]">
                <div className="space-y-6 px-6 pb-6">
                {/* Basic Info */}
                <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                  <CardHeader>
                    <CardTitle className={cn(
                      "text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                    )}>
                      {t('admin.basicInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className={cn(
                        "text-sm text-muted-foreground",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('admin.universityId')}</Label>
                      <p className={cn(
                        "font-medium text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>{selectedUserDetails.University_ID}</p>
                    </div>
                    <div>
                      <Label className={cn(
                        "text-sm text-muted-foreground",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('admin.name')}</Label>
                      <p className={cn(
                        "font-medium text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>{selectedUserDetails.Last_Name} {selectedUserDetails.First_Name}</p>
                    </div>
                    <div>
                      <Label className={cn(
                        "text-sm text-muted-foreground",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('admin.email')}</Label>
                      <p className={cn(
                        "font-medium text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>{selectedUserDetails.Email}</p>
                    </div>
                    <div>
                      <Label className={cn(
                        "text-sm text-muted-foreground",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                      )}>{t('admin.role')}</Label>
                      <Badge className={cn(
                        getRoleBadgeColor(selectedUserDetails.role),
                        neoBrutalismMode ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                      )}>
                        {t(`admin.${selectedUserDetails.role}`)}
                      </Badge>
                    </div>
                    {selectedUserDetails.Phone_Number && (
                      <div>
                        <Label className={cn(
                          "text-sm text-muted-foreground",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>{t('admin.phoneNumber')}</Label>
                        <p className={cn(
                          "font-medium text-[#211c37] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>{selectedUserDetails.Phone_Number}</p>
                      </div>
                    )}
                    {selectedUserDetails.Address && (
                      <div>
                        <Label className={cn(
                          "text-sm text-muted-foreground",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>{t('admin.address')}</Label>
                        <p className={cn(
                          "font-medium text-[#211c37] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>{selectedUserDetails.Address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Role Specific Info */}
                {selectedUserDetails.role_specific_info && Object.keys(selectedUserDetails.role_specific_info).length > 0 && (
                  <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                    <CardHeader>
                      <CardTitle className={cn(
                        "text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>
                        {t('admin.roleSpecificInfo')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedUserDetails.role_specific_info).map(([key, value]) => {
                        if (!value) return null
                        // Map key to correct translation key
                        let translationKey = key
                        if (key === 'Current_degree') {
                          translationKey = 'degree'
                        } else if (key === 'Major') {
                          translationKey = 'major'
                        } else if (key === 'Department_Name') {
                          translationKey = 'department'
                        } else if (key === 'Academic_Rank') {
                          translationKey = 'academicRank'
                        } else if (key === 'Type') {
                          translationKey = 'adminType'
                        } else if (key === 'Name') {
                          translationKey = 'tutorName'
                        } else if (key === 'Details') {
                          translationKey = 'details'
                        } else if (key === 'Issuance_Date') {
                          translationKey = 'issuanceDate'
                        }
                        return (
                          <div key={key}>
                            <Label className={cn(
                              "text-sm text-muted-foreground",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                            )}>{t(`admin.${translationKey}`) || key}</Label>
                            <p className={cn(
                              "font-medium text-[#211c37] dark:text-white",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                            )}>
                              {key === 'Issuance_Date' && value 
                                ? new Date(String(value)).toLocaleDateString() 
                                : String(value)}
                            </p>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* GPA Overview Card (for students) */}
                {selectedUserDetails.role === 'student' && (() => {
                  // Calculate GPA data
                  const coursesWithGPA = selectedUserDetails.courses?.filter((c: any) => {
                    const gpa = calculateCourseGPA(c)
                    return gpa !== null && c.Credit
                  }) || []
                  
                  if (coursesWithGPA.length === 0) return null
                  
                  const totalPoints = coursesWithGPA.reduce((sum: number, c: any) => {
                    const gpa = calculateCourseGPA(c)
                    return sum + (gpa! * (c.Credit || 0))
                  }, 0)
                  const totalCredits = coursesWithGPA.reduce((sum: number, c: any) => sum + (c.Credit || 0), 0)
                  const cumulativeGPA = totalCredits > 0 ? (totalPoints / totalCredits) : 0
                  
                  // Prepare chart data - GPA by semester
                  const gpaBySemester = selectedUserDetails.courses
                    ?.filter((c: any) => calculateCourseGPA(c) !== null)
                    .reduce((acc: any, c: any) => {
                      const semester = c.Semester || 'Unknown'
                      const gpa = calculateCourseGPA(c)!
                      const credit = c.Credit || 0
                      
                      if (!acc[semester]) {
                        acc[semester] = { totalPoints: 0, totalCredits: 0, courses: [] }
                      }
                      acc[semester].totalPoints += gpa * credit
                      acc[semester].totalCredits += credit
                      acc[semester].courses.push({ name: c.Course_Name, gpa, credit })
                      
                      return acc
                    }, {}) || {}
                  
                  const chartData = Object.entries(gpaBySemester)
                    .map(([semester, data]: [string, any]) => ({
                      semester,
                      gpa: data.totalCredits > 0 ? (data.totalPoints / data.totalCredits) : 0,
                      credits: data.totalCredits
                    }))
                    .sort((a, b) => a.semester.localeCompare(b.semester))
                  
                  // Prepare bar chart data - GPA by course
                  const courseGpaData = selectedUserDetails.courses
                    ?.filter((c: any) => calculateCourseGPA(c) !== null)
                    .map((c: any) => ({
                      name: c.Course_Name.length > 20 ? c.Course_Name.substring(0, 20) + '...' : c.Course_Name,
                      fullName: c.Course_Name,
                      gpa: calculateCourseGPA(c)!,
                      credit: c.Credit || 0
                    }))
                    .sort((a: any, b: any) => b.gpa - a.gpa) || []
                  
                  const gpaChartConfig = {
                    gpa: {
                      label: t('admin.courseGPA'),
                      color: 'hsl(var(--chart-1))',
                    },
                  } satisfies ChartConfig
                  
                  return (
                    <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                      <CardHeader>
                        <CardTitle className={cn(
                          "text-[#211c37] dark:text-white",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                        )}>
                          {t('admin.gpaOverview')}
                        </CardTitle>
                        <CardDescription className={cn(
                          "text-[#85878d] dark:text-gray-400",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>
                          {t('admin.gpaOverviewDescription')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Cumulative GPA Display */}
                          <div className={cn(
                            "p-6 rounded-lg border-2",
                            neoBrutalismMode 
                              ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20"
                              : "border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20"
                          )}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <Label className={cn(
                                  "text-sm text-muted-foreground",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>{t('admin.cumulativeGPA')}</Label>
                                <div className="flex items-center gap-3 mt-2">
                                  <p className={cn(
                                    "text-5xl font-bold text-[#211c37] dark:text-white",
                                    getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                                  )}>
                                    {cumulativeGPA.toFixed(2)}
                                  </p>
                                  {(() => {
                                    const letterGrade = getLetterGrade(cumulativeGPA)
                                    const colors = getLetterGradeColor(cumulativeGPA)
                                    return (
                                      <div className={cn(
                                        "px-4 py-2 rounded-lg border-2 flex items-center gap-2",
                                        colors.bg,
                                        colors.border,
                                        neoBrutalismMode ? "rounded-none border-4" : ""
                                      )}>
                                        <span className={cn(
                                          "text-2xl font-bold",
                                          colors.text
                                        )}>
                                          {letterGrade.letter}
                                        </span>
                                        <span className={cn(
                                          "text-xs",
                                          colors.text
                                        )}>
                                          {t(`admin.classification${letterGrade.classification.charAt(0).toUpperCase() + letterGrade.classification.slice(1)}`)}
                                        </span>
                                      </div>
                                    )
                                  })()}
                                </div>
                                <p className={cn(
                                  "text-sm text-muted-foreground mt-2",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {totalCredits} {t('admin.totalCredits')} • {coursesWithGPA.length} {t('admin.courses')}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* GPA Trend Chart */}
                          {chartData.length > 0 && (
                            <div>
                              <h4 className={cn(
                                "text-lg font-semibold text-[#211c37] dark:text-white mb-4",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                              )}>
                                {t('admin.gpaTrendBySemester')}
                              </h4>
                              <ChartContainer config={gpaChartConfig} className="h-[250px] w-full">
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis
                                    dataKey="semester"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#85878d', fontSize: 12 }}
                                  />
                                  <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 10]}
                                    tick={{ fill: '#85878d', fontSize: 12 }}
                                  />
                                  <ChartTooltip 
                                    content={<ChartTooltipContent />}
                                    formatter={(value: number) => [value.toFixed(2), t('admin.courseGPA')]}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="gpa"
                                    stroke="hsl(var(--chart-1))"
                                    strokeWidth={3}
                                    dot={{ fill: "hsl(var(--chart-1))", r: 5 }}
                                    activeDot={{ r: 7 }}
                                  />
                                </LineChart>
                              </ChartContainer>
                            </div>
                          )}
                          
                          {/* GPA by Course Bar Chart */}
                          {courseGpaData.length > 0 && (
                            <div>
                              <h4 className={cn(
                                "text-lg font-semibold text-[#211c37] dark:text-white mb-4",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                              )}>
                                {t('admin.gpaByCourse')}
                              </h4>
                              <ChartContainer config={gpaChartConfig} className="h-[300px] w-full">
                                <BarChart data={courseGpaData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tick={{ fill: '#85878d', fontSize: 11 }}
                                  />
                                  <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 10]}
                                    tick={{ fill: '#85878d', fontSize: 12 }}
                                  />
                                  <ChartTooltip 
                                    content={<ChartTooltipContent />}
                                    formatter={(value: number, name: any, _item: any, _index: number, payload: any) => {
                                      if (!payload || !payload.credit) {
                                        return [value.toFixed(2), name]
                                      }
                                      return [
                                        `${value.toFixed(2)} (${payload.credit} ${t('admin.credit')})`,
                                        payload.fullName || name
                                      ]
                                    }}
                                  />
                                  <Bar dataKey="gpa" radius={[8, 8, 0, 0]}>
                                    {courseGpaData.map((entry: any, index: number) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={
                                          entry.gpa >= 8.0 ? '#10b981' :
                                          entry.gpa >= 6.5 ? '#3b82f6' :
                                          entry.gpa >= 5.0 ? '#f59e0b' : '#ef4444'
                                        }
                                      />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ChartContainer>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Courses (for students) */}
                {selectedUserDetails.role === 'student' && (
                  <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                    <CardHeader>
                      <CardTitle className={cn(
                        "text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>
                        {t('admin.courses')} ({selectedUserDetails.courses?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedUserDetails.courses && selectedUserDetails.courses.length > 0 ? (
                        <div className="space-y-4">
                          {selectedUserDetails.courses.map((course: any, index: number) => {
                            // Calculate GPA for this course
                            const courseGPA = calculateCourseGPA(course)
                            
                            return (
                            <div key={index} className={cn(
                              "p-4 border rounded-lg",
                              neoBrutalismMode 
                                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                : "border-[#e5e7e7] dark:border-[#333]"
                            )}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className={cn(
                                    "font-semibold text-[#211c37] dark:text-white",
                                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                  )}>{course.Course_Name}</h4>
                                  <p className={cn(
                                    "text-sm text-muted-foreground",
                                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                  )}>
                                    {course.Course_ID} - {t('admin.section')} {course.Section_ID} - {course.Semester}
                                  </p>
                                </div>
                                {course.Status && (() => {
                                  const getStatusColor = (status: string) => {
                                    switch (status.toLowerCase()) {
                                      case 'approved':
                                        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
                                      case 'pending':
                                        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
                                      case 'rejected':
                                        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
                                      case 'cancelled':
                                        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700'
                                      default:
                                        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700'
                                    }
                                  }
                                  return (
                                    <Badge className={cn(
                                      getStatusColor(course.Status),
                                      neoBrutalismMode ? "border-2 rounded-none" : ""
                                    )}>
                                      {course.Status}
                                    </Badge>
                                  )
                                })()}
                              </div>
                              <div className="grid grid-cols-4 gap-2 mt-2">
                                {course.Final_Grade !== null && (
                                  <div>
                                    <Label className={cn(
                                      "text-xs text-muted-foreground",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>{t('admin.finalGrade')}</Label>
                                    <p className={cn(
                                      "font-medium",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>{course.Final_Grade}</p>
                                  </div>
                                )}
                                {course.Midterm_Grade !== null && (
                                  <div>
                                    <Label className={cn(
                                      "text-xs text-muted-foreground",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>{t('admin.midtermGrade')}</Label>
                                    <p className={cn(
                                      "font-medium",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>{course.Midterm_Grade}</p>
                                  </div>
                                )}
                                {course.Quiz_Grade !== null && (
                                  <div>
                                    <Label className={cn(
                                      "text-xs text-muted-foreground",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>{t('admin.quizGrade')}</Label>
                                    <p className={cn(
                                      "font-medium",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>{course.Quiz_Grade}</p>
                                  </div>
                                )}
                                {course.Assignment_Grade !== null && (
                                  <div>
                                    <Label className={cn(
                                      "text-xs text-muted-foreground",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>{t('admin.assignmentGrade')}</Label>
                                    <p className={cn(
                                      "font-medium",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>{course.Assignment_Grade}</p>
                                  </div>
                                )}
                              </div>
                              {courseGPA !== null && (
                                <div className={cn(
                                  "mt-4 p-4 rounded-lg border-2",
                                  getLetterGradeColor(courseGPA).bg,
                                  getLetterGradeColor(courseGPA).border,
                                  neoBrutalismMode ? "rounded-none border-4" : ""
                                )}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <Label className={cn(
                                        "text-xs text-muted-foreground mb-2 block",
                                        getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                      )}>{t('admin.courseGPA')}</Label>
                                      <div className="flex items-center gap-3">
                                        <p className={cn(
                                          "text-3xl font-bold",
                                          getLetterGradeColor(courseGPA).text,
                                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                        )}>
                                          {courseGPA.toFixed(2)}
                                        </p>
                                        {(() => {
                                          const letterGrade = getLetterGrade(courseGPA)
                                          const colors = getLetterGradeColor(courseGPA)
                                          return (
                                            <div className={cn(
                                              "px-3 py-1 rounded-lg border-2 flex items-center gap-2",
                                              colors.bg,
                                              colors.border,
                                              neoBrutalismMode ? "rounded-none border-2" : ""
                                            )}>
                                              <span className={cn(
                                                "text-lg font-bold",
                                                colors.text
                                              )}>
                                                {letterGrade.letter}
                                              </span>
                                              <span className={cn(
                                                "text-xs",
                                                colors.text
                                              )}>
                                                {t(`admin.classification${letterGrade.classification.charAt(0).toUpperCase() + letterGrade.classification.slice(1)}`)}
                                              </span>
                                            </div>
                                          )
                                        })()}
                                      </div>
                                    </div>
                                    {course.Credit && (
                                      <div className="text-right ml-4">
                                        <Label className={cn(
                                          "text-xs text-muted-foreground",
                                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                        )}>{t('admin.credit')}</Label>
                                        <p className={cn(
                                          "text-lg font-bold",
                                          getLetterGradeColor(courseGPA).text,
                                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                        )}>{course.Credit}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {course.Registration_Date && (
                                <p className={cn(
                                  "text-xs text-muted-foreground mt-2",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {t('admin.registrationDate')}: {new Date(course.Registration_Date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )
                          })}
                        </div>
                      ) : (
                        <p className={cn(
                          "text-muted-foreground text-center py-4",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>{t('admin.noCourses')}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Sections Taught (for tutors) */}
                {selectedUserDetails.role === 'tutor' && (
                  <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
                    <CardHeader>
                      <CardTitle className={cn(
                        "text-[#211c37] dark:text-white",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                      )}>
                        {t('admin.sectionsTaught')} ({selectedUserDetails.sections_taught?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedUserDetails.sections_taught && selectedUserDetails.sections_taught.length > 0 ? (
                        <div className="space-y-4">
                          {selectedUserDetails.sections_taught.map((section: any, index: number) => (
                            <div key={index} className={cn(
                              "p-4 border rounded-lg",
                              neoBrutalismMode 
                                ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                                : "border-[#e5e7e7] dark:border-[#333]"
                            )}>
                              <h4 className={cn(
                                "font-semibold text-[#211c37] dark:text-white mb-2",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                              )}>{section.Course_Name}</h4>
                              <p className={cn(
                                "text-sm text-muted-foreground",
                                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                              )}>
                                {section.Course_ID} - {t('admin.section')} {section.Section_ID} - {section.Semester}
                              </p>
                              <div className="flex gap-4 mt-2">
                                {section.Start_Date && (
                                  <div>
                                    <Label className={cn(
                                      "text-xs text-muted-foreground",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>{t('admin.startDate')}</Label>
                                    <p className={cn(
                                      "text-sm",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>{new Date(section.Start_Date).toLocaleDateString()}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={cn(
                          "text-muted-foreground text-center py-4",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                        )}>{t('admin.noSections')}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
                </div>
              </ScrollArea>
            ) : null}

          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
