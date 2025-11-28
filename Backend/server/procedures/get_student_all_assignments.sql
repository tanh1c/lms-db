-- Procedure: Get All Student Assignments
-- Description: Get all assignments for a student from all sections they are enrolled in
-- This is used for the student's assignment list page

USE [lms_system];
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetStudentAllAssignments]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetStudentAllAssignments]
GO

CREATE PROCEDURE [dbo].[GetStudentAllAssignments]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT DISTINCT
            ad.AssignmentID,
            ad.Course_ID,
            ad.Semester,
            ad.instructions,
            ad.accepted_specification,
            ad.submission_deadline,
            ad.TaskURL,
            ad.MaxScore,
            -- Student's submission data
            asub.Assessment_ID,
            asub.score,
            asub.status,
            asub.SubmitDate,
            asub.late_flag_indicator,
            asub.attached_files,
            asub.Comments,
            -- Section info for navigation
            s.Section_ID,
            -- Course name
            c.Name AS Course_Name,
            -- Calculate status
            CASE 
                WHEN asub.status = 'Submitted' AND asub.SubmitDate IS NOT NULL THEN 'Submitted'
                WHEN ad.submission_deadline < GETDATE() AND asub.AssignmentID IS NULL THEN 'Overdue'
                WHEN asub.status = 'In Progress' THEN 'In Progress'
                WHEN asub.AssignmentID IS NOT NULL AND asub.status IS NOT NULL THEN asub.status
                ELSE 'Not Started'
            END AS status_display
        FROM [Assignment_Definition] ad
        INNER JOIN [Section] s ON ad.Course_ID = s.Course_ID
            AND ad.Semester = s.Semester
        INNER JOIN [Assessment] a ON s.Section_ID = a.Section_ID
            AND s.Course_ID = a.Course_ID
            AND s.Semester = a.Semester
        INNER JOIN [Course] c ON ad.Course_ID = c.Course_ID
        LEFT JOIN [Assignment_Submission] asub ON ad.AssignmentID = asub.AssignmentID
            AND asub.University_ID = @University_ID
        WHERE a.University_ID = @University_ID
          AND a.Status != 'Withdrawn'
        ORDER BY ad.submission_deadline DESC, ad.AssignmentID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

