import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { courseService } from '@/lib/api/courseService'
import type { Section, Course } from '@/types'
import { ROUTES } from '@/constants/routes'
import { ArrowLeft, Users } from 'lucide-react'

export default function SectionPage() {
  const { courseId, sectionId } = useParams<{ courseId: string; sectionId: string }>()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!courseId || !sectionId) return
      
      try {
        const [sectionData, courseData] = await Promise.all([
          courseService.getSectionById(sectionId, courseId),
          courseService.getCourseById(courseId),
        ])
        
        setSection(sectionData)
        setCourse(courseData)
      } catch (error) {
        console.error('Error loading section:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId, sectionId])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!section || !course) {
    return (
      <DashboardLayout>
        <div className="text-[#85878d]">Section not found</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={`Section ${section.Section_ID} - ${course.Name}`}
      subtitle="Section details"
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.COURSE_DETAIL.replace(':courseId', courseId!))}
          className="mb-4 border border-[#e5e7e7] hover:bg-gray-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>

        <Card className="border border-[#e5e7e7] rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#f8efe2] rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-[#1f1d39]">
                  Section {section.Section_ID} - {course.Name}
                </CardTitle>
                <CardDescription className="text-[#85878d]">Section Details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-4 bg-[#f5f7f9] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[#676767] mb-1">Section ID</p>
                  <p className="text-lg font-semibold text-[#1f1d39]">{section.Section_ID}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#f5f7f9] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[#676767] mb-1">Semester</p>
                  <p className="text-lg font-semibold text-[#1f1d39]">{section.Semester}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#f5f7f9] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[#676767] mb-1">Course ID</p>
                  <p className="text-lg font-semibold text-[#1f1d39]">{course.Course_ID}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#f5f7f9] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[#676767] mb-1">Course Name</p>
                  <p className="text-lg font-semibold text-[#1f1d39]">{course.Name}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

