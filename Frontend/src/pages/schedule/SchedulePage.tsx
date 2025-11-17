import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format, startOfWeek, addDays, getDay } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { DatePicker } from '@/components/ui/date-time-picker'
import { scheduleService } from '@/lib/api/scheduleService'
import { useAuth } from '@/context/AuthProvider'
import type { ScheduleItem } from '@/lib/api/scheduleService'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismInputClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'
import { Clock, MapPin, Building, BookOpen, Calendar as CalendarIcon, Video, StickyNote } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const DAYS_MAP: Record<string, number> = {
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
  'Sunday': 0,
}

export default function SchedulePage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [showTikTok, setShowTikTok] = useState(false)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [currentNote, setCurrentNote] = useState('')
  const neoBrutalismMode = useNeoBrutalismMode()

  useEffect(() => {
    const loadSchedule = async () => {
      if (!user) return
      
      try {
        const data = await scheduleService.getSchedule(user.University_ID)
        setSchedule(data)
      } catch (error) {
        console.error('Error loading schedule:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSchedule()
  }, [user])

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('schedule-notes')
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes))
      } catch (error) {
        console.error('Error loading notes:', error)
      }
    }
  }, [])

  // Save notes to localStorage
  const saveNote = (date: Date, note: string) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const newNotes = { ...notes, [dateKey]: note }
    setNotes(newNotes)
    localStorage.setItem('schedule-notes', JSON.stringify(newNotes))
  }

  const handleSaveNote = () => {
    saveNote(selectedDate, currentNote)
    setNoteDialogOpen(false)
  }

  const handleDeleteNote = () => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    const newNotes = { ...notes }
    delete newNotes[dateKey]
    setNotes(newNotes)
    localStorage.setItem('schedule-notes', JSON.stringify(newNotes))
    setNoteDialogOpen(false)
  }

  // Get dates that have classes
  const getDatesWithClasses = (): Date[] => {
    const dates: Date[] = []
    const today = new Date()
    const startDate = startOfWeek(today, { weekStartsOn: 1 }) // Monday
    const endDate = addDays(startDate, 6 * 7) // 6 weeks ahead

    for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
      const dayOfWeek = getDay(d) === 0 ? 7 : getDay(d) // Convert Sunday (0) to 7
      const dayName = Object.keys(DAYS_MAP).find(
        key => DAYS_MAP[key] === dayOfWeek
      )

      if (dayName && schedule.some(item => item.Day === dayName)) {
        dates.push(new Date(d))
      }
    }

    return dates
  }

  // Get classes for selected date
  const getClassesForDate = (date: Date): ScheduleItem[] => {
    const dayOfWeek = getDay(date) === 0 ? 7 : getDay(date) // Convert Sunday (0) to 7
    const dayName = Object.keys(DAYS_MAP).find(
      key => DAYS_MAP[key] === dayOfWeek
    )

    if (!dayName) return []

    return schedule.filter(item => item.Day === dayName)
  }

  const selectedDateClasses = getClassesForDate(selectedDate)
  const datesWithClasses = getDatesWithClasses()

  // Get dates with notes
  const getDatesWithNotes = (): Date[] => {
    return Object.keys(notes).map(dateKey => {
      const [year, month, day] = dateKey.split('-').map(Number)
      return new Date(year, month - 1, day)
    })
  }

  const datesWithNotes = getDatesWithNotes()

  // Custom modifiers for calendar
  const modifiers = {
    hasClasses: datesWithClasses,
    hasNotes: datesWithNotes,
    selected: selectedDate,
  }

  const modifiersClassNames = {
    hasClasses: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-[#3bafa8] dark:after:bg-[#3bafa8] after:rounded-full',
    hasNotes: 'relative before:absolute before:top-1 before:right-1 before:w-2 before:h-2 before:bg-yellow-400 dark:before:bg-yellow-500 before:rounded-full',
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[#211c37] dark:text-white">{t('common.loading')}</div>
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
            {t('schedule.title')}
          </h1>
          <p className={cn(
            "text-[#85878d] dark:text-gray-400",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
          )}>
            {t('schedule.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* First Month Calendar */}
              <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 bg-[#e1e2f6] dark:bg-[#2a2a2a] flex items-center justify-center",
                    neoBrutalismMode 
                      ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                      : "rounded-lg"
                  )}>
                    <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className={cn(
                      "text-xl text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                    )}>
                      {format(currentMonth, 'MMMM yyyy')}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex justify-center items-start px-6 pb-6">
                <div className="w-full max-w-fit mx-auto">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    month={currentMonth}
                    onMonthChange={(date) => {
                      setCurrentMonth(date)
                    }}
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                    className="rounded-lg border-0"
                    classNames={{
                      day: "h-10 w-10 text-[#211c37] dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]",
                      day_selected: "bg-black dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-white",
                      day_today: "bg-[#f5f7f9] dark:bg-[#2a2a2a] font-semibold",
                      day_outside: "text-[#85878d] dark:text-gray-500 opacity-50",
                      day_disabled: "text-[#85878d] dark:text-gray-500 opacity-30",
                      month_caption: "text-[#211c37] dark:text-white font-semibold flex items-center justify-center",
                      weekday: "text-[#676767] dark:text-gray-400 font-medium text-center flex-1",
                      weekdays: "flex w-full",
                      week: "flex w-full",
                      table: "w-full border-collapse table-fixed",
                      nav_button: "text-[#211c37] dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]",
                    }}
                  />
                </div>
              </CardContent>
              </Card>

              {/* Second Card - TikTok or Calendar with Notes */}
              <Card className={cn(
                getNeoBrutalismCardClasses(neoBrutalismMode),
                "flex flex-col"
              )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {showTikTok ? (
                      <>
                        <div className={cn(
                          "w-10 h-10 bg-[#ff0050] dark:bg-[#ff0050] flex items-center justify-center",
                          neoBrutalismMode 
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                            : "rounded-lg"
                        )}>
                          <Video className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className={cn(
                            "text-xl text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                          )}>
                            {t('schedule.tiktok')}
                          </CardTitle>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={cn(
                          "w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center",
                          neoBrutalismMode 
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                            : "rounded-lg"
                        )}>
                          <StickyNote className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <CardTitle className={cn(
                            "text-xl text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                          )}>
                            {t('schedule.notes')}
                          </CardTitle>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-sm text-[#676767] dark:text-gray-400",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>{t('schedule.notes')}</span>
                    <Switch
                      checked={showTikTok}
                      onCheckedChange={setShowTikTok}
                      className={neoBrutalismMode ? "data-[state=checked]:bg-[#1a1a1a] dark:data-[state=checked]:bg-[#FFFBEB]" : ""}
                    />
                    <span className={cn(
                      "text-sm text-[#676767] dark:text-gray-400",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>{t('schedule.tiktok')}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {showTikTok ? (
                  <div className={cn(
                    "flex-1 overflow-hidden bg-black",
                    neoBrutalismMode ? "border-t-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : "rounded-b-2xl"
                  )}>
                    <iframe
                      src="https://www.tiktok.com/foryou"
                      className="w-full h-full min-h-[600px] border-0"
                      allow="encrypted-media; autoplay; clipboard-write; microphone; camera; fullscreen; picture-in-picture"
                      allowFullScreen
                      title="TikTok Feed"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation"
                    />
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {/* Add Note Button */}
                    <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setCurrentNote('')
                            setNoteDialogOpen(true)
                          }}
                          className={cn(
                            "w-full",
                            neoBrutalismMode 
                              ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                              : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                          )}
                        >
                          <StickyNote className="h-4 w-4 mr-2" />
                          <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('schedule.addNewNote')}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={cn(
                        "bg-white dark:bg-[#1a1a1a]",
                        neoBrutalismMode 
                          ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,251,235,1)]"
                          : "border-[#e5e7e7] dark:border-[#333]"
                      )}>
                        <DialogHeader>
                          <DialogTitle className={cn(
                            "text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                          )}>
                            {currentNote && notes[format(selectedDate, 'yyyy-MM-dd')] ? 
                              `${t('schedule.editNote')} ${format(selectedDate, 'dd/MM/yyyy')}` : 
                              t('schedule.addNewNote')}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="note-date" className={cn(
                              "text-[#211c37] dark:text-white",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                            )}>
                              {t('schedule.date')}
                            </Label>
                            <div className="mt-2">
                              <DatePicker
                                date={selectedDate}
                                onDateChange={(date) => {
                                  if (date) {
                                    setSelectedDate(date)
                                    setCurrentNote(notes[format(date, 'yyyy-MM-dd')] || '')
                                  }
                                }}
                                placeholder={t('schedule.selectDate')}
                                className={getNeoBrutalismInputClasses(neoBrutalismMode)}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="note" className={cn(
                              "text-[#211c37] dark:text-white",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                            )}>
                              {t('schedule.noteContent')}
                            </Label>
                            <Textarea
                              id="note"
                              value={currentNote}
                              onChange={(e) => setCurrentNote(e.target.value)}
                              placeholder={t('schedule.enterNote')}
                              className={cn(
                                "mt-2 bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                                getNeoBrutalismInputClasses(neoBrutalismMode, "resize-none")
                              )}
                              rows={5}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            {notes[format(selectedDate, 'yyyy-MM-dd')] && (
                              <Button
                                variant="destructive"
                                onClick={handleDeleteNote}
                                className={cn(
                                  neoBrutalismMode 
                                    ? "border-4 border-red-600 dark:border-red-400 bg-red-600 hover:bg-red-700 rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:shadow-[4px_4px_0px_0px_rgba(248,113,113,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(248,113,113,1)]"
                                    : "bg-red-600 hover:bg-red-700"
                                )}
                              >
                                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('schedule.delete')}</span>
                              </Button>
                            )}
                            <Button
                              onClick={handleSaveNote}
                              className={cn(
                                neoBrutalismMode 
                                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                                  : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                              )}
                            >
                              <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('schedule.save')}</span>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Notes List */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {Object.keys(notes).length === 0 ? (
                        <div className="text-center py-8 text-[#85878d] dark:text-gray-400">
                          <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className={getNeoBrutalismTextClasses(neoBrutalismMode, 'body')}>{t('schedule.noNotes')}</p>
                        </div>
                      ) : (
                        Object.entries(notes)
                          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                          .map(([dateKey, note]) => {
                            const [year, month, day] = dateKey.split('-').map(Number)
                            const noteDate = new Date(year, month - 1, day)
                            return (
                              <div
                                key={dateKey}
                                className={cn(
                                  "p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 transition-all",
                                  neoBrutalismMode 
                                    ? "border-4 border-yellow-600 dark:border-yellow-400 rounded-none shadow-[4px_4px_0px_0px_rgba(234,179,8,1)] dark:shadow-[4px_4px_0px_0px_rgba(253,224,71,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(234,179,8,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(253,224,71,1)]"
                                    : "rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <StickyNote className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                    <span className={cn(
                                      "font-semibold text-yellow-800 dark:text-yellow-200",
                                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                                    )}>
                                      {format(noteDate, 'dd/MM/yyyy')}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDate(noteDate)
                                      setCurrentNote(note)
                                      setNoteDialogOpen(true)
                                    }}
                                    className={cn(
                                      "h-6 px-2 text-xs text-yellow-700 dark:text-yellow-300",
                                      neoBrutalismMode 
                                        ? "border-4 border-yellow-600 dark:border-yellow-400 rounded-none shadow-[4px_4px_0px_0px_rgba(234,179,8,1)] dark:shadow-[4px_4px_0px_0px_rgba(253,224,71,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(234,179,8,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(253,224,71,1)] hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                                        : "hover:bg-yellow-200 dark:hover:bg-yellow-800"
                                    )}
                                  >
                                    <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('schedule.edit')}</span>
                                  </Button>
                                </div>
                                <p className={cn(
                                  "text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap",
                                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                                )}>
                                  {note}
                                </p>
                              </div>
                            )
                          })
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              </Card>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 bg-[#3bafa8]",
                  neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : "rounded-full"
                )}></div>
                <span className={cn(
                  "text-[#676767] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>{t('schedule.hasClasses')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 bg-yellow-400 dark:bg-yellow-500",
                  neoBrutalismMode ? "border-2 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none" : "rounded-full"
                )}></div>
                <span className={cn(
                  "text-[#676767] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>{t('schedule.hasNotes')}</span>
              </div>
            </div>
          </div>

          {/* Classes List Section */}
          <div>
            <Card className={cn(
              getNeoBrutalismCardClasses(neoBrutalismMode),
              "h-full"
            )}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 bg-[#f8efe2] dark:bg-[#2a2a2a] flex items-center justify-center",
                    neoBrutalismMode 
                      ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                      : "rounded-lg"
                  )}>
                    <BookOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className={cn(
                      "text-xl text-[#211c37] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                    )}>
                      {format(selectedDate, 'EEEE, dd/MM/yyyy')}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedDateClasses.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateClasses.map((item, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a] transition-all",
                          neoBrutalismMode
                            ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,251,235,1)]"
                            : "border border-[#e5e7e7] dark:border-[#333] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-colors"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className={cn(
                            "font-semibold text-lg text-[#211c37] dark:text-white",
                            getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                          )}>
                            {item.Course_Name}
                          </h3>
                          <Badge className={cn(
                            "bg-[#3bafa8] text-white",
                            neoBrutalismMode ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]" : "border-0"
                          )}>
                            <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('schedule.section')} {item.Section_ID}</span>
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-[#676767] dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>{item.Time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#676767] dark:text-gray-400">
                            <Building className="h-4 w-4" />
                            <span>{item.Building}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#676767] dark:text-gray-400">
                            <MapPin className="h-4 w-4" />
                            <span>{t('schedule.room')} {item.Room}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-[#85878d] dark:text-gray-400" />
                    <p className={cn(
                      "text-[#85878d] dark:text-gray-400",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>
                      {t('schedule.noClassesToday')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weekly Overview */}
        {schedule.length > 0 && (
          <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
            <CardHeader>
              <CardTitle className={cn(
                "text-xl text-[#211c37] dark:text-white",
                getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
              )}>
                {t('schedule.weeklyOverview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const dayClasses = schedule.filter(item => item.Day === day)
                  const dayName = i18n.language === 'vi' ? {
                    'Monday': t('schedule.monday'),
                    'Tuesday': t('schedule.tuesday'),
                    'Wednesday': t('schedule.wednesday'),
                    'Thursday': t('schedule.thursday'),
                    'Friday': t('schedule.friday'),
                    'Saturday': t('schedule.saturday'),
                    'Sunday': t('schedule.sunday'),
                  }[day] : day

                  if (dayClasses.length === 0) return null

                  return (
                    <div
                      key={day}
                      className={cn(
                        "p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a]",
                        neoBrutalismMode
                          ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                          : "border border-[#e5e7e7] dark:border-[#333] rounded-xl"
                      )}
                    >
                      <h3 className={cn(
                        "font-semibold text-[#211c37] dark:text-white mb-3",
                        getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                      )}>
                        {dayName}
                      </h3>
                      <div className="space-y-2">
                        {dayClasses.map((item, idx) => (
                          <div
                            key={idx}
                            className="text-sm text-[#676767] dark:text-gray-400"
                          >
                            <div className={cn(
                              "font-medium text-[#211c37] dark:text-white",
                              getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                            )}>
                              {item.Course_Name}
                            </div>
                            <div className="text-xs mt-1">
                              {item.Time} • {item.Building}-{item.Room}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
