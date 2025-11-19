import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { adminService, type AdminAssignment } from '@/lib/api/adminService'
import { FileText, Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismInputClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'

export default function AssignmentManagementPage() {
  const { t } = useTranslation()
  const [assignments, setAssignments] = useState<AdminAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<AdminAssignment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const neoBrutalismMode = useNeoBrutalismMode()

  const [formData, setFormData] = useState({
    University_ID: '',
    Section_ID: '',
    Course_ID: '',
    Semester: '',
    Assessment_ID: '',
    MaxScore: '',
    accepted_specification: '',
    submission_deadline: '',
    instructions: '',
  })

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    try {
      const data = await adminService.getAssignments()
      setAssignments(data)
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAssignments = assignments.filter(assignment =>
    assignment.Course_Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.Course_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.Section_ID.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddAssignment = () => {
    setEditingAssignment(null)
    setFormData({
      University_ID: '',
      Section_ID: '',
      Course_ID: '',
      Semester: '',
      Assessment_ID: '',
      MaxScore: '10',
      accepted_specification: '',
      submission_deadline: '',
      instructions: '',
    })
    setIsDialogOpen(true)
  }

  const handleEditAssignment = (assignment: AdminAssignment) => {
    setEditingAssignment(assignment)
    setFormData({
      University_ID: assignment.University_ID.toString(),
      Section_ID: assignment.Section_ID,
      Course_ID: assignment.Course_ID,
      Semester: assignment.Semester,
      Assessment_ID: assignment.Assessment_ID.toString(),
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
      await adminService.deleteAssignment(
        assignment.University_ID,
        assignment.Section_ID,
        assignment.Course_ID,
        assignment.Semester,
        assignment.Assessment_ID
      )
      await loadAssignments()
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert(t('admin.errorDeletingUser'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveAssignment = async () => {
    if (!formData.University_ID || !formData.Section_ID || !formData.Course_ID || !formData.Semester || !formData.Assessment_ID) {
      alert(t('admin.fillRequiredFields'))
      return
    }

    try {
      if (editingAssignment) {
        await adminService.updateAssignment(
          parseInt(formData.University_ID),
          formData.Section_ID,
          formData.Course_ID,
          formData.Semester,
          parseInt(formData.Assessment_ID),
          {
            MaxScore: formData.MaxScore ? parseInt(formData.MaxScore) : undefined,
            accepted_specification: formData.accepted_specification || undefined,
            submission_deadline: formData.submission_deadline || undefined,
            instructions: formData.instructions || undefined,
          }
        )
      } else {
        await adminService.createAssignment({
          University_ID: parseInt(formData.University_ID),
          Section_ID: formData.Section_ID,
          Course_ID: formData.Course_ID,
          Semester: formData.Semester,
          Assessment_ID: parseInt(formData.Assessment_ID),
          MaxScore: formData.MaxScore ? parseInt(formData.MaxScore) : 10,
          accepted_specification: formData.accepted_specification || null,
          submission_deadline: formData.submission_deadline,
          instructions: formData.instructions || null,
        })
      }

      setIsDialogOpen(false)
      await loadAssignments()
    } catch (error) {
      console.error('Error saving assignment:', error)
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
            {t('admin.assignmentManagement')}
          </h1>
          <p className={cn(
            "text-[#85878d] dark:text-gray-400",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>
            {t('admin.assignmentManagementSubtitle')}
          </p>
        </div>

        {/* Filters and Actions */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
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
              <Button
                onClick={handleAddAssignment}
                className={cn(
                  "w-full md:w-auto",
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                    : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.addAssignment')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assignments List */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className={cn(
                  "text-xl text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {t('admin.assignmentList')}
                </CardTitle>
                <CardDescription className={cn(
                  "text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('admin.totalAssignments')}: {filteredAssignments.length}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAssignments.length > 0 ? (
              <div className="space-y-3">
                {filteredAssignments.map((assignment) => (
                  <div
                    key={`${assignment.University_ID}-${assignment.Section_ID}-${assignment.Course_ID}-${assignment.Semester}-${assignment.Assessment_ID}`}
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
                          {assignment.Course_Name || assignment.Course_ID} - {assignment.Section_ID}
                        </h3>
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
            ) : (
              <div className="text-center py-12 text-[#85878d] dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className={getNeoBrutalismTextClasses(neoBrutalismMode, 'body')}>{t('admin.noAssignments')}</p>
              </div>
            )}
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
                  disabled={!!editingAssignment}
                  placeholder="100001"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
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
                  onChange={(e) => setFormData({ ...formData, Section_ID: e.target.value })}
                  disabled={!!editingAssignment}
                  placeholder="S001"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
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
                <Label htmlFor="assessment-id" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  Assessment ID *
                </Label>
                <Input
                  id="assessment-id"
                  type="number"
                  value={formData.Assessment_ID}
                  onChange={(e) => setFormData({ ...formData, Assessment_ID: e.target.value })}
                  disabled={!!editingAssignment}
                  placeholder="1"
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
                onClick={handleSaveAssignment}
                className={cn(
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                    : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                )}
              >
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{editingAssignment ? t('admin.update') : t('admin.addNew')}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

