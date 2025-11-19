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
import { adminService, type Assessment } from '@/lib/api/adminService'
import { BarChart3, Search, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismInputClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'

export default function AssessmentManagementPage() {
  const { t } = useTranslation()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null)
  const neoBrutalismMode = useNeoBrutalismMode()

  const [formData, setFormData] = useState({
    Final_Grade: '',
    Midterm_Grade: '',
    Quiz_Grade: '',
    Assignment_Grade: '',
    Status: 'Pending',
  })

  useEffect(() => {
    loadAssessments()
  }, [])

  const loadAssessments = async () => {
    try {
      const data = await adminService.getAssessments()
      setAssessments(data)
    } catch (error) {
      console.error('Error loading assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAssessments = assessments.filter(assessment =>
    assessment.Student_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.Course_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.Course_ID.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditAssessment = (assessment: Assessment) => {
    setEditingAssessment(assessment)
    setFormData({
      Final_Grade: assessment.Final_Grade?.toString() || '',
      Midterm_Grade: assessment.Midterm_Grade?.toString() || '',
      Quiz_Grade: assessment.Quiz_Grade?.toString() || '',
      Assignment_Grade: assessment.Assignment_Grade?.toString() || '',
      Status: assessment.Status || 'Pending',
    })
    setIsDialogOpen(true)
  }

  const handleSaveAssessment = async () => {
    if (!editingAssessment) return

    try {
      await adminService.updateAssessmentGrade(
        editingAssessment.University_ID,
        editingAssessment.Section_ID,
        editingAssessment.Course_ID,
        editingAssessment.Semester,
        editingAssessment.Assessment_ID,
        {
          Final_Grade: formData.Final_Grade ? parseFloat(formData.Final_Grade) : undefined,
          Midterm_Grade: formData.Midterm_Grade ? parseFloat(formData.Midterm_Grade) : undefined,
          Quiz_Grade: formData.Quiz_Grade ? parseFloat(formData.Quiz_Grade) : undefined,
          Assignment_Grade: formData.Assignment_Grade ? parseFloat(formData.Assignment_Grade) : undefined,
          Status: formData.Status,
        }
      )

      setIsDialogOpen(false)
      await loadAssessments()
    } catch (error) {
      console.error('Error saving assessment:', error)
      alert(t('admin.errorSavingUser'))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'Rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Cancelled':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
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
            {t('admin.assessmentManagement')}
          </h1>
          <p className={cn(
            "text-[#85878d] dark:text-gray-400",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>
            {t('admin.assessmentManagementSubtitle')}
          </p>
        </div>

        {/* Filters */}
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
            </div>
          </CardContent>
        </Card>

        {/* Assessments List */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className={cn(
                  "text-xl text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {t('admin.assessmentList')}
                </CardTitle>
                <CardDescription className={cn(
                  "text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('admin.totalAssessments')}: {filteredAssessments.length}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAssessments.length > 0 ? (
              <div className="space-y-3">
                {filteredAssessments.map((assessment) => (
                  <div
                    key={`${assessment.University_ID}-${assessment.Section_ID}-${assessment.Course_ID}-${assessment.Semester}-${assessment.Assessment_ID}`}
                    className={cn(
                      "p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a] transition-all",
                      neoBrutalismMode
                        ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                        : "border border-[#e5e7e7] dark:border-[#333] rounded-xl hover:shadow-sm transition-shadow"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={cn(
                            "font-semibold text-lg text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {assessment.Student_Name} - {assessment.Course_Name}
                          </h3>
                          <span className={cn(
                            "px-2 py-1 text-xs font-semibold rounded",
                            getStatusColor(assessment.Status),
                            neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : ""
                          )}>
                            {t(`admin.${assessment.Status.toLowerCase()}`)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.finalGrade')}: </span>
                            <span className="font-semibold">{assessment.Final_Grade ?? 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.midtermGrade')}: </span>
                            <span className="font-semibold">{assessment.Midterm_Grade ?? 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.quizGrade')}: </span>
                            <span className="font-semibold">{assessment.Quiz_Grade ?? 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.assignmentGrade')}: </span>
                            <span className="font-semibold">{assessment.Assignment_Grade ?? 'N/A'}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.courseId')}: </span>
                          <span>{assessment.Course_ID}</span>
                          {' • '}
                          <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.sectionId')}: </span>
                          <span>{assessment.Section_ID}</span>
                          {' • '}
                          <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.semester')}: </span>
                          <span>{assessment.Semester}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAssessment(assessment)}
                          className={cn(
                            "border-[#e5e7e7] dark:border-[#333]",
                            neoBrutalismMode 
                              ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                              : ""
                          )}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.updateGrades')}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#85878d] dark:text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className={getNeoBrutalismTextClasses(neoBrutalismMode, 'body')}>{t('admin.noAssessments')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Assessment Dialog */}
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
                {t('admin.updateGrades')}
              </DialogTitle>
              <DialogDescription className={cn(
                "text-gray-600 dark:text-gray-400",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
              )}>
                {editingAssessment && `${editingAssessment.Student_Name} - ${editingAssessment.Course_Name}`}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="final-grade" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.finalGrade')}
                </Label>
                <Input
                  id="final-grade"
                  type="number"
                  step="0.1"
                  max="13"
                  value={formData.Final_Grade}
                  onChange={(e) => setFormData({ ...formData, Final_Grade: e.target.value })}
                  placeholder="0-13"
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
                  {t('admin.midtermGrade')}
                </Label>
                <Input
                  id="midterm-grade"
                  type="number"
                  step="0.1"
                  max="13"
                  value={formData.Midterm_Grade}
                  onChange={(e) => setFormData({ ...formData, Midterm_Grade: e.target.value })}
                  placeholder="0-13"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiz-grade" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.quizGrade')}
                </Label>
                <Input
                  id="quiz-grade"
                  type="number"
                  step="0.1"
                  max="10"
                  value={formData.Quiz_Grade}
                  onChange={(e) => setFormData({ ...formData, Quiz_Grade: e.target.value })}
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
                  {t('admin.assignmentGrade')}
                </Label>
                <Input
                  id="assignment-grade"
                  type="number"
                  step="0.1"
                  max="10"
                  value={formData.Assignment_Grade}
                  onChange={(e) => setFormData({ ...formData, Assignment_Grade: e.target.value })}
                  placeholder="0-10"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="status" className={cn(
                  "text-[#211c37] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.status')}
                </Label>
                <Select 
                  value={formData.Status} 
                  onValueChange={(value) => setFormData({ ...formData, Status: value })}
                >
                  <SelectTrigger className={cn(
                    "bg-white dark:bg-[#2a2a2a]",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">{t('admin.pending')}</SelectItem>
                    <SelectItem value="Approved">{t('admin.approved')}</SelectItem>
                    <SelectItem value="Rejected">{t('admin.rejected')}</SelectItem>
                    <SelectItem value="Cancelled">{t('admin.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
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
                onClick={handleSaveAssessment}
                className={cn(
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                    : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                )}
              >
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.update')}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

