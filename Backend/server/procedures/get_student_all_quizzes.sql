-- Procedure: Get All Student Quizzes
-- Description: Get all quizzes for a student from all sections they are enrolled in
-- This is used for the student's quiz list page

USE [lms_system];
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetStudentAllQuizzes]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetStudentAllQuizzes]
GO

CREATE PROCEDURE [dbo].[GetStudentAllQuizzes]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT DISTINCT
            qq.QuizID,
            qq.Section_ID,
            qq.Course_ID,
            qq.Semester,
            a.Assessment_ID,
            qq.Grading_method,
            qq.pass_score,
            qq.Time_limits,
            qq.Start_Date,
            qq.End_Date,
            qq.content,
            qq.types,
            qq.Weight,
            qq.Correct_answer,
            qq.Questions,
            -- Student's answer data
            qa.Responses,
            qa.completion_status,
            qa.score,
            -- Course name
            c.Name AS Course_Name,
            -- Calculate status
            CASE 
                WHEN qa.score IS NOT NULL AND qa.score >= qq.pass_score THEN 'Passed'
                WHEN qa.completion_status = 'Submitted' AND (qa.score IS NULL OR qa.score < qq.pass_score) THEN 'Failed'
                WHEN qa.completion_status = 'In Progress' THEN 'In Progress'
                WHEN qa.completion_status = 'Submitted' THEN 'Submitted'
                ELSE 'Not Taken'
            END AS status_display
        FROM [Quiz_Questions] qq
        INNER JOIN [Section] s ON qq.Section_ID = s.Section_ID
            AND qq.Course_ID = s.Course_ID
            AND qq.Semester = s.Semester
        INNER JOIN [Assessment] a ON s.Section_ID = a.Section_ID
            AND s.Course_ID = a.Course_ID
            AND s.Semester = a.Semester
        INNER JOIN [Course] c ON qq.Course_ID = c.Course_ID
        LEFT JOIN [Quiz_Answer] qa ON qq.QuizID = qa.QuizID
            AND qa.Assessment_ID = a.Assessment_ID
            AND qa.University_ID = @University_ID
        WHERE a.University_ID = @University_ID
          AND a.Status != 'Withdrawn'
        ORDER BY qq.End_Date DESC, qq.QuizID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

