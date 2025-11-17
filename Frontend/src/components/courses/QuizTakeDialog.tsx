import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { HelpCircle, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { ContentItem } from './ContentEditorDialog'

interface QuizTakeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quiz: ContentItem
  onSubmit: (answers: Record<number, number>) => Promise<{ score: number; correctAnswers: number; totalQuestions: number }>
  existingResult?: {
    score: number
    answers: Record<number, number>
    submittedAt: string
  }
}

export default function QuizTakeDialog({
  open,
  onOpenChange,
  quiz,
  onSubmit,
  existingResult,
}: QuizTakeDialogProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isTimeUp, setIsTimeUp] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  if (!quiz.quiz) return null

  const questions = quiz.quiz.questions
  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const parseTimeToMs = (timeStr: string): number => {
    // Format: HH:mm:ss or mm:ss
    const parts = timeStr.split(':').map(Number)
    if (parts.length === 3) {
      return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000
    } else if (parts.length === 2) {
      return (parts[0] * 60 + parts[1]) * 1000
    }
    return 0
  }

  const timeLimitMs = parseTimeToMs(quiz.quiz.timeLimit)

  useEffect(() => {
    if (open && !existingResult && timeLimitMs > 0) {
      setTimeRemaining(timeLimitMs)
      setIsTimeUp(false)
      
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1000) {
            setIsTimeUp(true)
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    }

    if (existingResult) {
      setAnswers(existingResult.answers)
      setTimeRemaining(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [open, existingResult, timeLimitMs])

  const handleAutoSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(answers)
      if (timerRef.current) clearInterval(timerRef.current)
      alert('Hết thời gian! Bài quiz đã được tự động nộp.')
      onOpenChange(false)
    } catch (error) {
      console.error('Error auto-submitting quiz:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (isTimeUp && !existingResult) {
      handleAutoSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeUp, existingResult])

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answerIndex }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length
    if (answeredCount < questions.length) {
      const confirm = window.confirm(
        `Bạn chưa trả lời ${questions.length - answeredCount} câu hỏi. Bạn có muốn nộp bài không?`
      )
      if (!confirm) return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(answers)
      if (timerRef.current) clearInterval(timerRef.current)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const answeredCount = Object.keys(answers).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-[#1a1a1a] border-[#e5e7e7] dark:border-[#333] max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-[#211c37] dark:text-white text-xl">
                {quiz.title || 'Quiz'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
                Pass Score: {quiz.quiz.passScore}/10 | Time Limit: {quiz.quiz.timeLimit}
              </DialogDescription>
            </div>
            {timeRemaining !== null && timeRemaining > 0 && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                timeRemaining < 60000 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <Clock className={`h-4 w-4 ${
                  timeRemaining < 60000 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                }`} />
                <span className={`text-sm font-medium ${
                  timeRemaining < 60000 ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
            {existingResult && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Đã hoàn thành
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#211c37] dark:text-white">
                Câu hỏi {currentQuestionIndex + 1} / {questions.length}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Đã trả lời: {answeredCount} / {questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          <div className="p-6 border border-[#e5e7e7] dark:border-[#333] rounded-lg bg-[#f5f7f9] dark:bg-[#2a2a2a] space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-[#211c37] dark:text-white mb-4">
                  {currentQuestion.question}
                </h3>
                
                <RadioGroup
                  value={answers[currentQuestionIndex]?.toString()}
                  onValueChange={(value) => handleAnswerChange(currentQuestionIndex, parseInt(value))}
                  disabled={!!existingResult}
                  className="space-y-3"
                >
                  {currentQuestion.answers.map((answer, index) => {
                    const isSelected = answers[currentQuestionIndex] === index
                    const isCorrect = existingResult && index === currentQuestion.correctAnswer
                    const isIncorrect = existingResult && isSelected && index !== currentQuestion.correctAnswer
                    
                    return (
                      <div
                        key={index}
                        className={`
                          flex items-center space-x-3 p-3 rounded-lg border transition-colors
                          ${isSelected && !existingResult
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : isCorrect
                            ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                            : isIncorrect
                            ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                            : 'border-[#e5e7e7] dark:border-[#333] bg-white dark:bg-[#1a1a1a]'
                          }
                        `}
                      >
                        <RadioGroupItem value={index.toString()} id={`answer-${index}`} disabled={!!existingResult} />
                        <Label
                          htmlFor={`answer-${index}`}
                          className={`flex-1 cursor-pointer ${
                            existingResult
                              ? isCorrect
                                ? 'text-green-700 dark:text-green-300 font-medium'
                                : isIncorrect
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-gray-600 dark:text-gray-400'
                              : 'text-[#211c37] dark:text-white'
                          }`}
                        >
                          {answer}
                          {isCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 ml-2 inline" />
                          )}
                          {isIncorrect && (
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 ml-2 inline" />
                          )}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Result Info */}
          {existingResult && (
            <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Kết quả: {existingResult.score.toFixed(1)}/10 ({existingResult.score >= quiz.quiz.passScore ? 'Đạt' : 'Không đạt'})
                </span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                Nộp lúc: {format(new Date(existingResult.submittedAt), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || !!existingResult || isSubmitting}
              className="border-[#e5e7e7] dark:border-[#333]"
            >
              Câu trước
            </Button>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1 || !!existingResult || isSubmitting}
              className="border-[#e5e7e7] dark:border-[#333]"
            >
              Câu sau
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentQuestionIndex(0)
                setAnswers({})
                onOpenChange(false)
              }}
              disabled={isSubmitting}
              className="border-[#e5e7e7] dark:border-[#333]"
            >
              {existingResult ? 'Đóng' : 'Hủy'}
            </Button>
            {!existingResult && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isTimeUp}
                className="bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
              >
                {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

