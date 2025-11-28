-- Procedure: Get Quiz by Assessment_ID or QuizID
-- Description: Get quiz details for taking quiz
-- This handles both Assessment_ID (from URL) and QuizID

USE [lms_system];
GO

-- ==================== GET QUIZ BY ID ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetQuizById]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetQuizById]
GO

CREATE PROCEDURE [dbo].[GetQuizById]
    @QuizID_Or_Assessment_ID INT,
    @University_ID DECIMAL(7,0) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- First try to find by QuizID
        DECLARE @QuizID INT = NULL
        DECLARE @Assessment_ID INT = NULL
        
        -- Check if it's a QuizID
        IF EXISTS (SELECT 1 FROM [Quiz_Questions] WHERE QuizID = @QuizID_Or_Assessment_ID)
        BEGIN
            SET @QuizID = @QuizID_Or_Assessment_ID
        END
        ELSE
        BEGIN
            -- If not found as QuizID, try to find by Assessment_ID
            -- Get QuizID from Quiz_Questions that matches Assessment
            SELECT TOP 1 
                @QuizID = qq.QuizID,
                @Assessment_ID = a.Assessment_ID
            FROM [Quiz_Questions] qq
            INNER JOIN [Assessment] a ON qq.Section_ID = a.Section_ID
                AND qq.Course_ID = a.Course_ID
                AND qq.Semester = a.Semester
            WHERE a.Assessment_ID = @QuizID_Or_Assessment_ID
                AND (@University_ID IS NULL OR a.University_ID = @University_ID)
                AND a.Status != 'Withdrawn'
        END
        
        -- If QuizID found, get quiz details
        IF @QuizID IS NOT NULL
        BEGIN
            SELECT 
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
                -- Student's answer data if exists
                qa.Responses,
                qa.completion_status,
                qa.score,
                -- Calculate status
                CASE 
                    WHEN qa.score IS NOT NULL AND qa.score >= qq.pass_score THEN 'Passed'
                    WHEN qa.completion_status = 'Submitted' AND (qa.score IS NULL OR qa.score < qq.pass_score) THEN 'Failed'
                    WHEN qa.completion_status = 'In Progress' THEN 'In Progress'
                    WHEN qa.completion_status = 'Submitted' THEN 'Submitted'
                    ELSE 'Not Taken'
                END AS status_display
            FROM [Quiz_Questions] qq
            INNER JOIN [Assessment] a ON qq.Section_ID = a.Section_ID
                AND qq.Course_ID = a.Course_ID
                AND qq.Semester = a.Semester
            LEFT JOIN [Quiz_Answer] qa ON qq.QuizID = qa.QuizID
                AND qa.Assessment_ID = a.Assessment_ID
                AND (@University_ID IS NULL OR qa.University_ID = @University_ID)
            WHERE qq.QuizID = @QuizID
                AND (@University_ID IS NULL OR a.University_ID = @University_ID)
                AND a.Status != 'Withdrawn';
        END
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

