-- Procedures: Assignment CRUD Operations (Updated for Assignment_Definition and Assignment_Submission tables)
-- Description: 
-- - Assignment_Definition: Assignment definitions for each section/course (admin managed)
-- - Assignment_Submission: Student submissions for assignments

USE [lms_system];
GO

-- ==================== GET ALL ASSIGNMENTS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllAssignments]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllAssignments]
GO

CREATE PROCEDURE [dbo].[GetAllAssignments]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        ad.AssignmentID,
        ad.Section_ID,
        ad.Course_ID,
        ad.Semester,
        ad.MaxScore,
        ad.accepted_specification,
        ad.submission_deadline,
        ad.instructions,
        c.Name as Course_Name,
        (SELECT COUNT(*) FROM [Assignment_Submission] asub WHERE asub.AssignmentID = ad.AssignmentID) as StudentCount
    FROM [Assignment_Definition] ad
    INNER JOIN [Course] c ON ad.Course_ID = c.Course_ID
    ORDER BY ad.submission_deadline DESC;
END
GO

-- ==================== GET ASSIGNMENTS BY COURSE ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAssignmentsByCourse]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAssignmentsByCourse]
GO

CREATE PROCEDURE [dbo].[GetAssignmentsByCourse]
    @Course_ID NVARCHAR(15) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ad.AssignmentID,
        ad.Section_ID,
        ad.Course_ID,
        ad.Semester,
        ad.MaxScore,
        ad.accepted_specification,
        ad.submission_deadline,
        ad.instructions,
        c.Name as Course_Name,
        (SELECT COUNT(*) FROM [Assignment_Submission] asub WHERE asub.AssignmentID = ad.AssignmentID) as StudentCount
    FROM [Assignment_Definition] ad
    INNER JOIN [Course] c ON ad.Course_ID = c.Course_ID
    WHERE (@Course_ID IS NULL OR ad.Course_ID = @Course_ID)
    ORDER BY ad.Course_ID, ad.Section_ID, ad.Semester, ad.submission_deadline DESC;
END
GO

-- ==================== CREATE ASSIGNMENT (Admin - Creates Assignment_Definition) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateAssignment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateAssignment]
GO

CREATE PROCEDURE [dbo].[CreateAssignment]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @MaxScore INT = NULL,
    @accepted_specification NVARCHAR(50) = NULL,
    @submission_deadline DATETIME,
    @instructions NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @AssignmentID INT;
        
        -- Insert into Assignment_Definition
        INSERT INTO [Assignment_Definition] (
            Section_ID,
            Course_ID,
            Semester,
            MaxScore,
            accepted_specification,
            submission_deadline,
            instructions
        )
        VALUES (
            @Section_ID,
            @Course_ID,
            @Semester,
            ISNULL(@MaxScore, 10),
            @accepted_specification,
            @submission_deadline,
            @instructions
        );
        
        SET @AssignmentID = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        -- Return the created assignment
        SELECT 
            ad.AssignmentID,
            ad.Section_ID,
            ad.Course_ID,
            ad.Semester,
            ad.MaxScore,
            ad.accepted_specification,
            ad.submission_deadline,
            ad.instructions,
            c.Name as Course_Name,
            (SELECT COUNT(*) FROM [Assignment_Submission] asub WHERE asub.AssignmentID = ad.AssignmentID) as StudentCount
        FROM [Assignment_Definition] ad
        INNER JOIN [Course] c ON ad.Course_ID = c.Course_ID
        WHERE ad.AssignmentID = @AssignmentID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE ASSIGNMENT (Admin - Updates Assignment_Definition) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateAssignment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateAssignment]
GO

CREATE PROCEDURE [dbo].[UpdateAssignment]
    @AssignmentID INT,
    @Section_ID NVARCHAR(10) = NULL,
    @Course_ID NVARCHAR(15) = NULL,
    @Semester NVARCHAR(10) = NULL,
    @MaxScore INT = NULL,
    @accepted_specification NVARCHAR(50) = NULL,
    @submission_deadline DATETIME = NULL,
    @instructions NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        UPDATE [Assignment_Definition]
        SET 
            Section_ID = ISNULL(@Section_ID, Section_ID),
            Course_ID = ISNULL(@Course_ID, Course_ID),
            Semester = ISNULL(@Semester, Semester),
            MaxScore = ISNULL(@MaxScore, MaxScore),
            accepted_specification = ISNULL(@accepted_specification, accepted_specification),
            submission_deadline = ISNULL(@submission_deadline, submission_deadline),
            instructions = ISNULL(@instructions, instructions)
        WHERE AssignmentID = @AssignmentID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Assignment not found', 1;
        
        -- Return the updated assignment
        SELECT 
            ad.AssignmentID,
            ad.Section_ID,
            ad.Course_ID,
            ad.Semester,
            ad.MaxScore,
            ad.accepted_specification,
            ad.submission_deadline,
            ad.instructions,
            c.Name as Course_Name,
            (SELECT COUNT(*) FROM [Assignment_Submission] asub WHERE asub.AssignmentID = ad.AssignmentID) as StudentCount
        FROM [Assignment_Definition] ad
        INNER JOIN [Course] c ON ad.Course_ID = c.Course_ID
        WHERE ad.AssignmentID = @AssignmentID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== DELETE ASSIGNMENT (Admin - Deletes Assignment_Definition) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteAssignment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteAssignment]
GO

CREATE PROCEDURE [dbo].[DeleteAssignment]
    @AssignmentID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete Assignment_Submission records (will cascade due to FK)
        DELETE FROM [Assignment_Submission]
        WHERE AssignmentID = @AssignmentID;
        
        -- Delete Assignment_Definition
        DELETE FROM [Assignment_Definition]
        WHERE AssignmentID = @AssignmentID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Assignment not found', 1;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== GET ASSIGNMENT BY ID ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAssignmentById]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAssignmentById]
GO

CREATE PROCEDURE [dbo].[GetAssignmentById]
    @AssignmentID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ad.AssignmentID,
        ad.Section_ID,
        ad.Course_ID,
        ad.Semester,
        ad.MaxScore,
        ad.accepted_specification,
        ad.submission_deadline,
        ad.instructions,
        c.Name as Course_Name,
        (SELECT COUNT(*) FROM [Assignment_Submission] asub WHERE asub.AssignmentID = ad.AssignmentID) as StudentCount
    FROM [Assignment_Definition] ad
    INNER JOIN [Course] c ON ad.Course_ID = c.Course_ID
    WHERE ad.AssignmentID = @AssignmentID;
END
GO

-- ==================== GET ASSIGNMENT SUBMISSIONS BY ASSIGNMENT ID (Admin View) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAssignmentSubmissionsByAssignmentID]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAssignmentSubmissionsByAssignmentID]
GO

CREATE PROCEDURE [dbo].[GetAssignmentSubmissionsByAssignmentID]
    @AssignmentID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        asub.University_ID,
        u.First_Name,
        u.Last_Name,
        asub.AssignmentID,
        asub.Assessment_ID,
        asub.accepted_specification,
        asub.late_flag_indicator,
        asub.SubmitDate,
        asub.attached_files,
        asub.status,
        ad.instructions as Assignment_Instructions,
        ad.MaxScore,
        ad.submission_deadline
    FROM [Assignment_Submission] asub
    INNER JOIN [Assignment_Definition] ad ON asub.AssignmentID = ad.AssignmentID
    INNER JOIN [Users] u ON asub.University_ID = u.University_ID
    WHERE asub.AssignmentID = @AssignmentID
    ORDER BY asub.SubmitDate DESC;
END
GO

-- ==================== CREATE/UPDATE STUDENT ASSIGNMENT SUBMISSION ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SaveStudentAssignmentSubmission]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[SaveStudentAssignmentSubmission]
GO

CREATE PROCEDURE [dbo].[SaveStudentAssignmentSubmission]
    @University_ID DECIMAL(7,0),
    @AssignmentID INT,
    @Assessment_ID INT,
    @accepted_specification NVARCHAR(50) = NULL,
    @attached_files NVARCHAR(MAX) = NULL,
    @status NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verify Assignment_Definition exists
        IF NOT EXISTS (SELECT 1 FROM [Assignment_Definition] WHERE AssignmentID = @AssignmentID)
        BEGIN
            THROW 50001, 'Assignment not found', 1;
        END
        
        -- Get Section_ID, Course_ID, Semester from Assignment_Definition
        DECLARE @Section_ID NVARCHAR(10);
        DECLARE @Course_ID NVARCHAR(15);
        DECLARE @Semester NVARCHAR(10);
        DECLARE @submission_deadline DATETIME;
        
        SELECT 
            @Section_ID = Section_ID,
            @Course_ID = Course_ID,
            @Semester = Semester,
            @submission_deadline = submission_deadline
        FROM [Assignment_Definition]
        WHERE AssignmentID = @AssignmentID;
        
        -- Calculate late_flag_indicator
        DECLARE @late_flag_indicator BIT = 0;
        IF GETDATE() > @submission_deadline
            SET @late_flag_indicator = 1;
        
        -- Check if submission already exists
        IF EXISTS (
            SELECT 1 
            FROM [Assignment_Submission] 
            WHERE University_ID = @University_ID 
            AND AssignmentID = @AssignmentID
        )
        BEGIN
            -- Update existing submission
            UPDATE [Assignment_Submission]
            SET 
                Assessment_ID = @Assessment_ID,
                accepted_specification = ISNULL(@accepted_specification, accepted_specification),
                late_flag_indicator = @late_flag_indicator,
                SubmitDate = GETDATE(),
                attached_files = ISNULL(@attached_files, attached_files),
                status = ISNULL(@status, 'Submitted')
            WHERE University_ID = @University_ID
              AND AssignmentID = @AssignmentID;
        END
        ELSE
        BEGIN
            -- Insert new submission
            INSERT INTO [Assignment_Submission] (
                University_ID,
                AssignmentID,
                Assessment_ID,
                Section_ID,
                Course_ID,
                Semester,
                accepted_specification,
                late_flag_indicator,
                SubmitDate,
                attached_files,
                status
            )
            VALUES (
                @University_ID,
                @AssignmentID,
                @Assessment_ID,
                @Section_ID,
                @Course_ID,
                @Semester,
                @accepted_specification,
                @late_flag_indicator,
                GETDATE(),
                @attached_files,
                ISNULL(@status, 'Submitted')
            );
        END
        
        COMMIT TRANSACTION;
        
        -- Return the submission
        SELECT 
            asub.University_ID,
            asub.AssignmentID,
            asub.Assessment_ID,
            asub.Section_ID,
            asub.Course_ID,
            asub.Semester,
            asub.accepted_specification,
            asub.late_flag_indicator,
            asub.SubmitDate,
            asub.attached_files,
            asub.status
        FROM [Assignment_Submission] asub
        INNER JOIN [Assignment_Definition] ad ON asub.AssignmentID = ad.AssignmentID
        WHERE asub.University_ID = @University_ID
          AND asub.AssignmentID = @AssignmentID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

