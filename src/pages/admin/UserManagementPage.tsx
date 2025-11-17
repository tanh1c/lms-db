import { useEffect, useState } from 'react'
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
import { userService } from '@/lib/api/userService'
import type { User, UserRole } from '@/types'
import { Users, Plus, Search, Edit2, Trash2, GraduationCap, UserCheck, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismInputClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'

export default function UserManagementPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null)
  const neoBrutalismMode = useNeoBrutalismMode()

  // Form state
  const [formData, setFormData] = useState({
    University_ID: '',
    First_Name: '',
    Last_Name: '',
    Email: '',
    Phone_Number: '',
    Address: '',
    National_ID: '',
  })

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter])

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.University_ID.toString().includes(query) ||
        `${user.First_Name} ${user.Last_Name}`.toLowerCase().includes(query) ||
        user.Email.toLowerCase().includes(query) ||
        user.Phone_Number?.toLowerCase().includes(query)
      )
    }

    setFilteredUsers(filtered)
  }

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
    })
    setIsDialogOpen(true)
  }

  const handleDeleteUser = async (universityId: number) => {
    if (!confirm(`${t('admin.confirmDelete')} ${universityId}?`)) {
      return
    }

    setIsDeleting(true)
    setDeleteUserId(universityId)

    try {
      await userService.deleteUser(universityId)
      await loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(t('admin.errorDeletingUser'))
    } finally {
      setIsDeleting(false)
      setDeleteUserId(null)
    }
  }

  const handleSaveUser = async () => {
    // Validation
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
        // Update existing user
        await userService.updateUser(universityId, {
          First_Name: formData.First_Name,
          Last_Name: formData.Last_Name,
          Email: formData.Email,
          Phone_Number: formData.Phone_Number || undefined,
          Address: formData.Address || undefined,
          National_ID: formData.National_ID || undefined,
        })
      } else {
        // Check if user already exists
        const existingUser = users.find(u => u.University_ID === universityId)
        if (existingUser) {
          alert(t('admin.universityIdExists'))
          return
        }

        // Create new user
        await userService.createUser({
          University_ID: universityId,
          First_Name: formData.First_Name,
          Last_Name: formData.Last_Name,
          Email: formData.Email,
          Phone_Number: formData.Phone_Number || undefined,
          Address: formData.Address || undefined,
          National_ID: formData.National_ID || undefined,
        })
      }

      setIsDialogOpen(false)
      await loadUsers()
    } catch (error) {
      console.error('Error saving user:', error)
      alert(t('admin.errorSavingUser'))
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
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
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
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length > 0 ? (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.University_ID}
                    className={cn(
                      "p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a] transition-all",
                      neoBrutalismMode
                        ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                        : "border border-[#e5e7e7] dark:border-[#333] rounded-xl hover:shadow-sm transition-shadow"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={cn(
                          "w-12 h-12 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0",
                          neoBrutalismMode 
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                            : "rounded-full"
                        )}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={cn(
                              "font-semibold text-lg text-[#211c37] dark:text-white",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                            )}>
                              {user.First_Name} {user.Last_Name}
                            </h3>
                            <Badge className={cn(
                              getRoleBadgeColor(user.role),
                              neoBrutalismMode ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]" : ""
                            )}>
                              <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{user.role ? t(`admin.${user.role}`) : t('admin.unknown')}</span>
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.id')}:</span>
                              <span>{user.University_ID}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.email')}:</span>
                              <span className="truncate">{user.Email}</span>
                            </div>
                            {user.Phone_Number && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.phone')}:</span>
                                <span>{user.Phone_Number}</span>
                              </div>
                            )}
                            {user.Address && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.address')}:</span>
                                <span className="truncate">{user.Address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
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
                          onClick={() => handleDeleteUser(user.University_ID)}
                          disabled={isDeleting && deleteUserId === user.University_ID}
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
            ) : (
              <div className="text-center py-12 text-[#85878d] dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className={getNeoBrutalismTextClasses(neoBrutalismMode, 'body')}>{t('admin.noUsers')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit User Dialog */}
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
                  placeholder="John"
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
                  placeholder="Doe"
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
      </div>
    </DashboardLayout>
  )
}

