import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { quizService } from '@/lib/api/quizService'
import { ROUTES } from '@/constants/routes'
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react'

export default function QuizTakePage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(3600) // 1 hour in seconds
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) return
      
      try {
        const data = await quizService.getQuizById(parseInt(quizId))
        setQuiz(data)
        if (data) {
          // Parse time limits (HH:MM:SS)
          const [hours, minutes, seconds] = data.Time_limits.split(':').map(Number)
          setTimeLeft(hours * 3600 + minutes * 60 + seconds)
        }
      } catch (error) {
        console.error('Error loading quiz:', error)
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [quizId])

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSubmit = async () => {
    if (!quizId) return
    setSubmitting(true)
    
    try {
      const result = await quizService.submitQuiz(parseInt(quizId), answers)
      if (result.success) {
        navigate(ROUTES.QUIZ_RESULT.replace(':quizId', quizId))
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!quiz) {
    return (
      <DashboardLayout>
        <div className="text-[#85878d]">Quiz not found</div>
      </DashboardLayout>
    )
  }

  const isTimeUp = timeLeft <= 0

  return (
    <DashboardLayout 
      title={`Quiz ${quiz.Assessment_ID}`}
      subtitle="Take the quiz"
    >
      <div className="space-y-6 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.QUIZZES)}
          className="mb-4 border border-[#e5e7e7] hover:bg-gray-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quizzes
        </Button>

        <Card className="border border-[#e5e7e7] rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-[#1f1d39]">Quiz {quiz.Assessment_ID}</CardTitle>
                <CardDescription className="text-[#85878d]">{quiz.content}</CardDescription>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isTimeUp ? 'bg-red-100 text-red-700' : 'bg-[#e1e2f6] text-purple-700'}`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isTimeUp && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>Time's up! Quiz will be automatically submitted.</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold text-[#1f1d39]">Question</Label>
                <p className="text-[#676767] mt-1">{quiz.content}</p>
              </div>

              <RadioGroup
                value={answers[quiz.Assessment_ID.toString()] || ''}
                onValueChange={(value) => {
                  setAnswers({ ...answers, [quiz.Assessment_ID.toString()]: value })
                }}
                disabled={isTimeUp || submitting}
              >
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <div key={option} className="flex items-center space-x-2 p-3 border border-[#e5e7e7] rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="cursor-pointer flex-1 text-[#1f1d39]">
                        Option {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isTimeUp || submitting || !answers[quiz.Assessment_ID.toString()]}
                className="flex-1 bg-black hover:bg-gray-800 text-white"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

