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
import { adminService } from '@/lib/api/adminService'
import type { User, UserRole } from '@/types'
import { 
  Users, Plus, Search, Edit2, Trash2, GraduationCap, UserCheck, Shield,
  Download, ArrowUpDown, MoreHorizontal, ChevronDown, KeyRound, Eye
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
import { Pie, PieChart as RechartsPieChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'

export default function UserManagementPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
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
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const [students, tutors, admins] = await Promise.all([
        adminService.getStudents().catch(() => []),
        adminService.getTutors().catch(() => []),
        adminService.getAdmins().catch(() => []),
      ])
      
      const allUsers: User[] = [
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
      
      setUsers(allUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Statistics
  const statistics = useMemo(() => {
    const total = users.length
    const students = users.filter(u => u.role === 'student').length
    const tutors = users.filter(u => u.role === 'tutor').length
    const admins = users.filter(u => u.role === 'admin').length
    
    return { total, students, tutors, admins }
  }, [users])

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
  const filteredUsers = useMemo(() => {
    let filtered = [...users]

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.University_ID.toString().includes(query) ||
        `${user.First_Name} ${user.Last_Name}`.toLowerCase().includes(query) ||
        user.Email.toLowerCase().includes(query) ||
        user.Phone_Number?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [users, searchQuery, roleFilter])

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
              <div className="font-medium">{user.First_Name} {user.Last_Name}</div>
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
      
      await loadUsers()
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
            roleSpecificData.Name = formData.Name || `${formData.First_Name} ${formData.Last_Name}`
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
            Name: formData.Name || `${formData.First_Name} ${formData.Last_Name}`,
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
      await loadUsers()
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
      await loadUsers()
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

        {/* Filters and Actions */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center justify-between">
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
            <div className="overflow-hidden rounded-md border">
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
            "bg-white dark:bg-[#1a1a1a] max-w-4xl max-h-[90vh] overflow-y-auto",
            neoBrutalismMode 
              ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
              : "border-[#e5e7e7] dark:border-[#333]"
          )}>
            <DialogHeader>
              <DialogTitle className={cn(
                "text-[#211c37] dark:text-white text-xl",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {t('admin.userDetails')}
              </DialogTitle>
            </DialogHeader>

            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className={cn(
                  "text-lg text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>{t('common.loading')}</div>
              </div>
            ) : selectedUserDetails ? (
              <div className="space-y-6 py-4">
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
                      )}>{selectedUserDetails.First_Name} {selectedUserDetails.Last_Name}</p>
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
                        return (
                          <div key={key}>
                            <Label className={cn(
                              "text-sm text-muted-foreground",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                            )}>{t(`admin.${key}`) || key}</Label>
                            <p className={cn(
                              "font-medium text-[#211c37] dark:text-white",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                            )}>{String(value)}</p>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )}

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
                          {selectedUserDetails.courses.map((course: any, index: number) => (
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
                                {course.Status && (
                                  <Badge>{course.Status}</Badge>
                                )}
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
                              {course.Registration_Date && (
                                <p className={cn(
                                  "text-xs text-muted-foreground mt-2",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {t('admin.registrationDate')}: {new Date(course.Registration_Date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))}
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
                                {section.End_Date && (
                                  <div>
                                    <Label className={cn(
                                      "text-xs text-muted-foreground",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>{t('admin.endDate')}</Label>
                                    <p className={cn(
                                      "text-sm",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                    )}>{new Date(section.End_Date).toLocaleDateString()}</p>
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
            ) : null}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailsDialogOpen(false)}
                className={cn(
                  "border-[#e5e7e7] dark:border-[#333]",
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                    : ""
                )}
              >
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.close')}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
