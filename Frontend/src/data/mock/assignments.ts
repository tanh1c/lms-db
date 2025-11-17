import type { Assignment } from '@/types'

export const mockAssignments: Assignment[] = [
  {
    University_ID: 100001,
    Section_ID: 1,
    Course_ID: 1,
    Assessment_ID: 1,
    MaxScore: 10,
    accepted_specification: 'pdf,doc,docx',
    submission_deadline: '2024-12-15T23:59:59',
    instructions: 'Làm bài tập về thiết kế database',
  },
  {
    University_ID: 100001,
    Section_ID: 1,
    Course_ID: 1,
    Assessment_ID: 2,
    MaxScore: 10,
    accepted_specification: 'pdf,doc,docx',
    submission_deadline: '2024-12-20T23:59:59',
    instructions: 'Thực hành SQL queries',
  },
]

