import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { quizService } from '@/lib/api/quizService'
import { ROUTES } from '@/constants/routes'
import { ArrowLeft, CheckCircle2, XCircle, Trophy } from 'lucide-react'

export default function QuizResultPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<any>(null)
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadResult = async () => {
      if (!quizId) return
      
      try {
        const data = await quizService.getQuizById(parseInt(quizId))
        setQuiz(data)
        if (data && data.score) {
          setScore(data.score)
        }
      } catch (error) {
        console.error('Error loading quiz result:', error)
      } finally {
        setLoading(false)
      }
    }

    loadResult()
  }, [quizId])

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
        <div className="text-[#85878d]">Quiz result not found</div>
      </DashboardLayout>
    )
  }

  const passed = score !== null && score >= quiz.pass_score
  const percentage = score !== null ? ((score / quiz.pass_score) * 100).toFixed(0) : 0

  return (
    <DashboardLayout 
      title={`Quiz ${quiz.Assessment_ID} Result`}
      subtitle="View your quiz result"
    >
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.QUIZZES)}
          className="mb-4 border border-[#e5e7e7] hover:bg-gray-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quizzes
        </Button>

        <Card className="border border-[#e5e7e7] rounded-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {passed ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl text-[#1f1d39]">
              {passed ? 'Congratulations! You Passed!' : 'Not Passed'}
            </CardTitle>
            <CardDescription className="text-[#85878d]">Quiz {quiz.Assessment_ID} Result</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <span className="text-4xl font-bold text-[#1f1d39]">{score?.toFixed(2) || '0'}</span>
                <span className="text-2xl text-[#85878d]">/ {quiz.pass_score}</span>
              </div>
              <p className="text-lg text-[#676767]">
                Achieved {percentage}% requirement
              </p>
              <Badge className={`text-lg px-4 py-1 ${passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {passed ? 'Passed' : 'Failed'}
              </Badge>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#e5e7e7]">
              <div className="flex justify-between">
                <span className="text-[#85878d]">Passing Score:</span>
                <span className="font-semibold text-[#1f1d39]">{quiz.pass_score} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#85878d]">Grading Method:</span>
                <span className="font-semibold text-[#1f1d39]">{quiz.Grading_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#85878d]">Status:</span>
                <span className="font-semibold text-[#1f1d39] capitalize">{quiz.completion_status}</span>
              </div>
            </div>

            <Button
              onClick={() => navigate(ROUTES.QUIZZES)}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              View Quiz List
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

