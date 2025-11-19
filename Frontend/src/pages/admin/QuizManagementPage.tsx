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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminService, type AdminQuiz } from '@/lib/api/adminService'
import { HelpCircle, Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismInputClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'

export default function QuizManagementPage() {
  const { t } = useTranslation()
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<AdminQuiz | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const neoBrutalismMode = useNeoBrutalismMode()

  const [formData, setFormData] = useState({
    University_ID: '',
    Section_ID: '',
    Course_ID: '',
    Semester: '',
    Assessment_ID: '',
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

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      const data = await adminService.getQuizzes()
      setQuizzes(data)
    } catch (error) {
      console.error('Error loading quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.Course_Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.Course_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddQuiz = () => {
    setEditingQuiz(null)
    setFormData({
      University_ID: '',
      Section_ID: '',
      Course_ID: '',
      Semester: '',
      Assessment_ID: '',
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
    setIsDialogOpen(true)
  }

  const handleEditQuiz = (quiz: AdminQuiz) => {
    setEditingQuiz(quiz)
    setFormData({
      University_ID: quiz.University_ID.toString(),
      Section_ID: quiz.Section_ID,
      Course_ID: quiz.Course_ID,
      Semester: quiz.Semester,
      Assessment_ID: quiz.Assessment_ID.toString(),
      Grading_method: quiz.Grading_method || 'Highest Attemp',
      pass_score: quiz.pass_score?.toString() || '5',
      Time_limits: quiz.Time_limits || '',
      Start_Date: quiz.Start_Date ? new Date(quiz.Start_Date).toISOString().slice(0, 16) : '',
      End_Date: quiz.End_Date ? new Date(quiz.End_Date).toISOString().slice(0, 16) : '',
      content: quiz.content,
      types: quiz.types || '',
      Weight: quiz.Weight?.toString() || '',
      Correct_answer: quiz.Correct_answer,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteQuiz = async (quiz: AdminQuiz) => {
    if (!confirm(`${t('admin.confirmDelete')} quiz?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await adminService.deleteQuiz(
        quiz.University_ID,
        quiz.Section_ID,
        quiz.Course_ID,
        quiz.Semester,
        quiz.Assessment_ID
      )
      await loadQuizzes()
    } catch (error) {
      console.error('Error deleting quiz:', error)
      alert(t('admin.errorDeletingUser'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveQuiz = async () => {
    if (!formData.University_ID || !formData.Section_ID || !formData.Course_ID || !formData.Semester || !formData.Assessment_ID || !formData.content || !formData.Correct_answer) {
      alert(t('admin.fillRequiredFields'))
      return
    }

    try {
      if (editingQuiz) {
        await adminService.updateQuiz(
          parseInt(formData.University_ID),
          formData.Section_ID,
          formData.Course_ID,
          formData.Semester,
          parseInt(formData.Assessment_ID),
          {
            Grading_method: formData.Grading_method,
            pass_score: formData.pass_score ? parseFloat(formData.pass_score) : undefined,
            Time_limits: formData.Time_limits || undefined,
            Start_Date: formData.Start_Date || undefined,
            End_Date: formData.End_Date || undefined,
            content: formData.content,
            types: formData.types || undefined,
            Weight: formData.Weight ? parseFloat(formData.Weight) : undefined,
            Correct_answer: formData.Correct_answer,
          }
        )
      } else {
        await adminService.createQuiz({
          University_ID: parseInt(formData.University_ID),
          Section_ID: formData.Section_ID,
          Course_ID: formData.Course_ID,
          Semester: formData.Semester,
          Assessment_ID: parseInt(formData.Assessment_ID),
          Grading_method: formData.Grading_method,
          pass_score: formData.pass_score ? parseFloat(formData.pass_score) : 5,
          Time_limits: formData.Time_limits,
          Start_Date: formData.Start_Date,
          End_Date: formData.End_Date,
          content: formData.content,
          types: formData.types || null,
          Weight: formData.Weight ? parseFloat(formData.Weight) : null,
          Correct_answer: formData.Correct_answer,
        })
      }

      setIsDialogOpen(false)
      await loadQuizzes()
    } catch (error) {
      console.error('Error saving quiz:', error)
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
            {t('admin.quizManagement')}
          </h1>
          <p className={cn(
            "text-[#85878d] dark:text-gray-400",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>
            {t('admin.quizManagementSubtitle')}
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
                onClick={handleAddQuiz}
                className={cn(
                  "w-full md:w-auto",
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                    : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.addQuiz')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quizzes List */}
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center",
                neoBrutalismMode 
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className={cn(
                  "text-xl text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {t('admin.quizList')}
                </CardTitle>
                <CardDescription className={cn(
                  "text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>
                  {t('admin.totalQuizzes')}: {filteredQuizzes.length}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredQuizzes.length > 0 ? (
              <div className="space-y-3">
                {filteredQuizzes.map((quiz) => (
                  <div
                    key={`${quiz.University_ID}-${quiz.Section_ID}-${quiz.Course_ID}-${quiz.Semester}-${quiz.Assessment_ID}`}
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
                          {quiz.Course_Name || quiz.Course_ID} - {quiz.content}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.passScore')}: </span>
                            <span>{quiz.pass_score || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#676767] dark:text-gray-500">{t('admin.timeLimit')}: </span>
                            <span>{quiz.Time_limits || 'N/A'}</span>
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
            ) : (
              <div className="text-center py-12 text-[#85878d] dark:text-gray-400">
                <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className={getNeoBrutalismTextClasses(neoBrutalismMode, 'body')}>{t('admin.noQuizzes')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Quiz Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                {editingQuiz ? t('admin.editQuiz') : t('admin.addQuiz')}
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
                  disabled={!!editingQuiz}
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
                  disabled={!!editingQuiz}
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
                  disabled={!!editingQuiz}
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
                  disabled={!!editingQuiz}
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
                  disabled={!!editingQuiz}
                  placeholder="1"
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
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
                  {t('admin.timeLimit')} *
                </Label>
                <Input
                  id="time-limit"
                  type="time"
                  value={formData.Time_limits}
                  onChange={(e) => setFormData({ ...formData, Time_limits: e.target.value })}
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
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={formData.Start_Date}
                  onChange={(e) => setFormData({ ...formData, Start_Date: e.target.value })}
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
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={formData.End_Date}
                  onChange={(e) => setFormData({ ...formData, End_Date: e.target.value })}
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
                onClick={handleSaveQuiz}
                className={cn(
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                    : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                )}
              >
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{editingQuiz ? t('admin.update') : t('admin.addNew')}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

