export type UserRole = 'student' | 'tutor' | 'admin'

export interface User {
  University_ID: number
  First_Name: string
  Last_Name: string
  Email: string
  Phone_Number?: string
  Address?: string
  National_ID?: string
  role?: UserRole
}

export interface Student extends User {
  Major: string
  Current_degree: string
}

export interface Tutor extends User {
  Name: string
  Academic_Rank?: string
  Details?: string
  Issuance_Date?: string
  Department_Name?: string
}

export interface Admin extends User {
  Type: 'Coordinator' | 'Office of Academic Affairs' | 'Office of Student Affairs' | 'Program Administrator'
}

export interface Course {
  Course_ID: number
  Name: string
  Credit: number
  Start_Date?: string
}

export interface Section {
  Section_ID: number
  Course_ID: number
  Semester: string
  Course?: Course
}

export interface Assignment {
  University_ID: number
  Section_ID: number
  Course_ID: number
  Assessment_ID: number
  MaxScore: number
  accepted_specification?: string
  submission_deadline: string
  instructions?: string
}

export interface Quiz {
  University_ID: number
  Section_ID: number
  Course_ID: number
  Assessment_ID: number
  Grading_method: 'Highest Attemp' | 'Last Attemp'
  pass_score: number
  Time_limits: string
  Start_Date: string
  End_Date: string
  Responses?: string
  completion_status: 'Not Taken' | 'In Progress' | 'Submitted' | 'Passed' | 'Failed'
  score: number
  content: string
  types?: string
  Weight?: number
  Correct_answer: string
}

export interface Submission {
  Submission_No: number
  University_ID: number
  Section_ID: number
  Course_ID: number
  Assessment_ID: number
  accepted_specification?: string
  late_flag_indicator: boolean
  SubmitDate: string
  attached_files?: string
  status: 'No Submission' | 'Submitted'
}

export interface Assessment {
  University_ID: number
  Section_ID: number
  Course_ID: number
  Assessment_ID: number
  Grade: number
  Registration_Date: string
  Potential_Withdrawal_Date?: string
  Status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
}

