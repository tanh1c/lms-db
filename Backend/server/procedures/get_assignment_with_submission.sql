-- Procedure: Get Assignment with Student Submission Data
-- Description: Get assignment details along with student's submission data (score, SubmitDate, status)
-- This is used when student views assignment submission page

USE [lms_system];
GO

-- ==================== GET ASSIGNMENT WITH SUBMISSION ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAssignmentWithSubmission]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAssignmentWithSubmission]
GO

CREATE PROCEDURE [dbo].[GetAssignmentWithSubmission]
    @AssignmentID INT = NULL,
    @Assessment_ID INT = NULL,
    @University_ID DECIMAL(7,0),
    @Section_ID NVARCHAR(10) = NULL,
    @Course_ID NVARCHAR(15) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @ActualAssignmentID INT = NULL
        
        -- If Assessment_ID provided, try to find AssignmentID
        IF @Assessment_ID IS NOT NULL
        BEGIN
            -- Try to get from Assignment_Submission first
            SELECT TOP 1 @ActualAssignmentID = AssignmentID
            FROM [Assignment_Submission]
            WHERE Assessment_ID = @Assessment_ID
                AND University_ID = @University_ID
            
            -- If not found, try to get from Assessment -> Section -> Assignment_Definition
            IF @ActualAssignmentID IS NULL AND @Section_ID IS NOT NULL AND @Course_ID IS NOT NULL
            BEGIN
                DECLARE @Semester NVARCHAR(10) = NULL
                
                -- Get Semester from Assessment
                SELECT TOP 1 @Semester = Semester
                FROM [Assessment]
                WHERE Assessment_ID = @Assessment_ID
                    AND University_ID = @University_ID
                    AND Section_ID = @Section_ID
                    AND Course_ID = @Course_ID
                
                -- Find assignment by Course_ID and Semester
                IF @Semester IS NOT NULL
                BEGIN
                    SELECT TOP 1 @ActualAssignmentID = ad.AssignmentID
                    FROM [Assignment_Definition] ad
                    INNER JOIN [Section] s ON ad.Course_ID = s.Course_ID
                        AND ad.Semester = s.Semester
                    INNER JOIN [Assessment] a ON s.Section_ID = a.Section_ID
                        AND s.Course_ID = a.Course_ID
                        AND s.Semester = a.Semester
                    WHERE a.Assessment_ID = @Assessment_ID
                        AND ad.Course_ID = @Course_ID
                        AND ad.Semester = @Semester
                        AND s.Section_ID = @Section_ID
                    ORDER BY ad.submission_deadline DESC
                END
            END
        END
        ELSE IF @AssignmentID IS NOT NULL
        BEGIN
            SET @ActualAssignmentID = @AssignmentID
        END
        
        -- If no AssignmentID found, return nothing
        IF @ActualAssignmentID IS NULL
        BEGIN
            RETURN
        END
        
        -- Get assignment details with submission data
        SELECT 
            -- Assignment details
            ad.AssignmentID,
            ad.Course_ID,
            ad.Semester,
            ad.MaxScore,
            ad.accepted_specification,
            ad.submission_deadline,
            ad.instructions,
            ad.TaskURL,
            c.Name as Course_Name,
            -- Submission data (if exists)
            asub.score,
            asub.SubmitDate,
            asub.status,
            asub.attached_files,
            asub.Comments,
            asub.late_flag_indicator,
            -- Calculate submission status
            CASE 
                WHEN asub.status = 'Submitted' AND asub.SubmitDate IS NOT NULL THEN 'Submitted'
                WHEN asub.status = 'In Progress' THEN 'In Progress'
                WHEN asub.AssignmentID IS NOT NULL THEN ISNULL(asub.status, 'Submitted')
                ELSE 'Not Submitted'
            END AS submission_status_display
        FROM [Assignment_Definition] ad
        INNER JOIN [Course] c ON ad.Course_ID = c.Course_ID
        LEFT JOIN [Assignment_Submission] asub ON ad.AssignmentID = asub.AssignmentID
            AND asub.University_ID = @University_ID
        WHERE ad.AssignmentID = @ActualAssignmentID
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

