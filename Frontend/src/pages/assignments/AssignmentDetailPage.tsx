import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { assignmentService } from '@/lib/api/assignmentService'
import type { Assignment } from '@/types'
import { ROUTES } from '@/constants/routes'
import { ArrowLeft, FileText, Calendar, Clock, Upload } from 'lucide-react'

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAssignment = async () => {
      if (!assignmentId) return
      
      try {
        const data = await assignmentService.getAssignmentById(parseInt(assignmentId))
        setAssignment(data)
      } catch (error) {
        console.error('Error loading assignment:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAssignment()
  }, [assignmentId])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="text-[#85878d]">Assignment not found</div>
      </DashboardLayout>
    )
  }

  const deadline = new Date(assignment.submission_deadline)
  const now = new Date()
  const isOverdue = now > deadline

  return (
    <DashboardLayout 
      title={`Assignment ${assignment.Assessment_ID}`}
      subtitle="Assignment details"
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.ASSIGNMENTS)}
          className="mb-4 border border-[#e5e7e7] hover:bg-gray-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assignments
        </Button>

        <Card className="border border-[#e5e7e7] rounded-xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#e1e2f6] rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-[#1f1d39]">Assignment {assignment.Assessment_ID}</CardTitle>
                  <CardDescription className="text-[#85878d]">Assignment Details</CardDescription>
                </div>
              </div>
              {isOverdue ? (
                <Badge className="bg-red-500 text-white">Overdue</Badge>
              ) : (
                <Badge className="bg-green-500 text-white">On Time</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {assignment.instructions && (
              <div className="p-4 bg-[#f5f7f9] rounded-lg">
                <h3 className="text-lg font-semibold text-[#1f1d39] mb-2">Instructions</h3>
                <p className="text-[#676767]">{assignment.instructions}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-4 bg-[#f5f7f9] rounded-lg">
                <Calendar className="h-5 w-5 text-[#85878d]" />
                <div>
                  <p className="text-sm font-medium text-[#676767] mb-1">Deadline</p>
                  <p className="text-sm font-semibold text-[#1f1d39]">
                    {deadline.toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[#f5f7f9] rounded-lg">
                <Clock className="h-5 w-5 text-[#85878d]" />
                <div>
                  <p className="text-sm font-medium text-[#676767] mb-1">Max Score</p>
                  <p className="text-sm font-semibold text-[#1f1d39]">{assignment.MaxScore} points</p>
                </div>
              </div>

              {assignment.accepted_specification && (
                <div className="flex items-center gap-3 p-4 bg-[#f5f7f9] rounded-lg">
                  <Upload className="h-5 w-5 text-[#85878d]" />
                  <div>
                    <p className="text-sm font-medium text-[#676767] mb-1">Accepted Format</p>
                    <p className="text-sm font-semibold text-[#1f1d39]">
                      {assignment.accepted_specification}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={() => navigate(ROUTES.ASSIGNMENT_SUBMIT.replace(':assignmentId', assignmentId!))}
              className="w-full md:w-auto bg-black hover:bg-gray-800 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Submit Assignment
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

