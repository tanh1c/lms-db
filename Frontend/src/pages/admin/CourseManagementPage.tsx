import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { adminService, type AdminCourse } from '@/lib/api/adminService'
import { BookOpen, Plus, Edit2, Trash2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismInputClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import AdvancedSearchPanel, { type SearchFilters } from '@/components/admin/AdvancedSearchPanel'

export default function CourseManagementPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null)
  const neoBrutalismMode = useNeoBrutalismMode()

  const [formData, setFormData] = useState({
    Course_ID: '',
    Name: '',
    Credit: '',
    Start_Date: '',
  })

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await adminService.getCourses()
      setCourses(data)
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
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
    }
  }

  const handleResetFilters = () => {
    setSearchFilters({})
    loadCourses()
  }

  const handleAddCourse = () => {
    setEditingCourse(null)
    setFormData({
      Course_ID: '',
      Name: '',
      Credit: '',
      Start_Date: '',
    })
    setIsDialogOpen(true)
  }

  const handleEditCourse = (course: AdminCourse) => {
    setEditingCourse(course)
    setFormData({
      Course_ID: course.Course_ID,
      Name: course.Name,
      Credit: course.Credit?.toString() || '',
      Start_Date: course.Start_Date || '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm(`${t('admin.confirmDeleteCourse')} ${courseId}?`)) {
      return
    }

    setIsDeleting(true)
    setDeleteCourseId(courseId)

    try {
      await adminService.deleteCourse(courseId)
      await loadCourses()
    } catch (error) {
      console.error('Error deleting course:', error)
      alert(t('admin.errorDeletingUser'))
    } finally {
      setIsDeleting(false)
      setDeleteCourseId(null)
    }
  }

  const handleSaveCourse = async () => {
    if (!formData.Course_ID || !formData.Name) {
      alert(t('admin.fillRequiredFields'))
      return
    }

    try {
      if (editingCourse) {
        await adminService.updateCourse(formData.Course_ID, {
          Name: formData.Name,
          Credit: formData.Credit ? parseInt(formData.Credit) : null,
          Start_Date: formData.Start_Date || null,
        })
      } else {
        await adminService.createCourse({
          Course_ID: formData.Course_ID,
          Name: formData.Name,
          Credit: formData.Credit ? parseInt(formData.Credit) : null,
          Start_Date: formData.Start_Date || null,
        })
      }

      setIsDialogOpen(false)
      await loadCourses()
    } catch (error) {
      console.error('Error saving course:', error)
      alert(t('admin.errorSavingUser'))
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
            {t('admin.courseManagement')}
          </h1>
          <p className={cn(
            "text-[#85878d] dark:text-gray-400",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>
            {t('admin.courseManagementSubtitle')}
          </p>
        </div>

        {/* Advanced Search Panel */}
        <AdvancedSearchPanel
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
          onSearch={handleSearch}
          onReset={handleResetFilters}
        />

        {/* Actions */}
        <div className="flex justify-end">
          <Button
            onClick={handleAddCourse}
            className={cn(
              neoBrutalismMode 
                ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.addCourse')}</span>
          </Button>
        </div>

        {/* Courses List */}
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
                )}>
                  {t('admin.courseList')}
                </CardTitle>
                <CardDescription className={cn(
                  "text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('admin.totalCourses')}: {courses.length}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {courses.length > 0 ? (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course.Course_ID}
                    className={cn(
                      "p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a] transition-all",
                      neoBrutalismMode
                        ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                        : "border border-[#e5e7e7] dark:border-[#333] rounded-xl hover:shadow-sm transition-shadow"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-semibold text-lg text-[#211c37] dark:text-white mb-2",
                          getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                        )}>
                          {course.Name}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div>
                            <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.courseId')}: </span>
                            <span>{course.Course_ID}</span>
                          </div>
                          {course.Credit && (
                            <div>
                              <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.credit')}: </span>
                              <span>{course.Credit}</span>
                            </div>
                          )}
                          {course.Start_Date && (
                            <div>
                              <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.startDate')}: </span>
                              <span>{new Date(course.Start_Date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        {(course.SectionCount !== undefined || course.StudentCount !== undefined || course.TutorCount !== undefined) && (
                          <div className="flex flex-wrap gap-3 text-xs">
                            {course.SectionCount !== undefined && (
                              <span className={cn(
                                "px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded",
                                neoBrutalismMode 
                                  ? "border-2 border-blue-600 dark:border-blue-400 rounded-none"
                                  : ""
                              )}>
                                {course.SectionCount} {t('admin.sections')}
                              </span>
                            )}
                            {course.StudentCount !== undefined && (
                              <span className={cn(
                                "px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded",
                                neoBrutalismMode 
                                  ? "border-2 border-green-600 dark:border-green-400 rounded-none"
                                  : ""
                              )}>
                                {course.StudentCount} {t('admin.students')}
                              </span>
                            )}
                            {course.TutorCount !== undefined && (
                              <span className={cn(
                                "px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded",
                                neoBrutalismMode 
                                  ? "border-2 border-purple-600 dark:border-purple-400 rounded-none"
                                  : ""
                              )}>
                                {course.TutorCount} {t('admin.tutors')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/courses/${course.Course_ID}`)}
                          className={cn(
                            "border-[#e5e7e7] dark:border-[#333]",
                            neoBrutalismMode 
                              ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                              : ""
                          )}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.viewDetails')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCourse(course)}
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
                          onClick={() => handleDeleteCourse(course.Course_ID)}
                          disabled={isDeleting && deleteCourseId === course.Course_ID}
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
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className={getNeoBrutalismTextClasses(neoBrutalismMode, 'body')}>{t('admin.noCourses')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Course Dialog */}
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
                {editingCourse ? t('admin.editCourseInfo') : t('admin.addNewCourse')}
              </DialogTitle>
              <DialogDescription className={cn(
                "text-gray-600 dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {editingCourse ? t('admin.updateUserInfo') : t('admin.fillInfoToCreateCourse')}
              </DialogDescription>
            </DialogHeader>

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
                  disabled={!!editingCourse}
                  placeholder="CS101"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-name" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.courseName')} *
                </Label>
                <Input
                  id="course-name"
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  placeholder="Introduction to Computer Science"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.credit')}
                </Label>
                <Input
                  id="credit"
                  type="number"
                  value={formData.Credit}
                  onChange={(e) => setFormData({ ...formData, Credit: e.target.value })}
                  placeholder="3"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.startDate')}
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.Start_Date}
                  onChange={(e) => setFormData({ ...formData, Start_Date: e.target.value })}
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
                onClick={handleSaveCourse}
                className={cn(
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                    : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                )}
              >
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{editingCourse ? t('admin.update') : t('admin.addNew')}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

