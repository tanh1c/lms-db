-- Procedures: Assignment CRUD Operations

-- ==================== GET ALL ASSIGNMENTS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllAssignments]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllAssignments]
GO

CREATE PROCEDURE [dbo].[GetAllAssignments]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        a.University_ID,
        a.Section_ID,
        a.Course_ID,
        a.Semester,
        a.Assessment_ID,
        a.MaxScore,
        a.accepted_specification,
        a.submission_deadline,
        a.instructions,
        c.Name as Course_Name
    FROM [Assignment] a
    INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
    ORDER BY a.submission_deadline DESC;
END
GO

-- ==================== CREATE ASSIGNMENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateAssignment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateAssignment]
GO

CREATE PROCEDURE [dbo].[CreateAssignment]
    @University_ID DECIMAL(7,0),
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Assessment_ID INT OUTPUT,
    @MaxScore INT = NULL,
    @accepted_specification NVARCHAR(50) = NULL,
    @submission_deadline DATETIME,
    @instructions NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Get next Assessment_ID
        SELECT @Assessment_ID = ISNULL(MAX(Assessment_ID), 0) + 1
        FROM [Assessment]
        WHERE University_ID = @University_ID 
          AND Section_ID = @Section_ID 
          AND Course_ID = @Course_ID 
          AND Semester = @Semester;
        
        -- Insert into Assessment
        INSERT INTO [Assessment] (University_ID, Section_ID, Course_ID, Semester, Assessment_ID, Status)
        VALUES (@University_ID, @Section_ID, @Course_ID, @Semester, @Assessment_ID, 'Pending');
        
        -- Insert into Assignment
        INSERT INTO [Assignment] (University_ID, Section_ID, Course_ID, Semester, Assessment_ID, 
                                 MaxScore, accepted_specification, submission_deadline, instructions)
        VALUES (@University_ID, @Section_ID, @Course_ID, @Semester, @Assessment_ID,
                @MaxScore, @accepted_specification, @submission_deadline, @instructions);
        
        COMMIT TRANSACTION;
        
        SELECT 
            a.University_ID,
            a.Section_ID,
            a.Course_ID,
            a.Semester,
            a.Assessment_ID,
            a.MaxScore,
            a.accepted_specification,
            a.submission_deadline,
            a.instructions,
            c.Name as Course_Name
        FROM [Assignment] a
        INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
        WHERE a.University_ID = @University_ID
          AND a.Section_ID = @Section_ID
          AND a.Course_ID = @Course_ID
          AND a.Semester = @Semester
          AND a.Assessment_ID = @Assessment_ID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE ASSIGNMENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateAssignment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateAssignment]
GO

CREATE PROCEDURE [dbo].[UpdateAssignment]
    @University_ID DECIMAL(7,0),
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Assessment_ID INT,
    @MaxScore INT = NULL,
    @accepted_specification NVARCHAR(50) = NULL,
    @submission_deadline DATETIME = NULL,
    @instructions NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        UPDATE [Assignment]
        SET 
            MaxScore = ISNULL(@MaxScore, MaxScore),
            accepted_specification = ISNULL(@accepted_specification, accepted_specification),
            submission_deadline = ISNULL(@submission_deadline, submission_deadline),
            instructions = ISNULL(@instructions, instructions)
        WHERE University_ID = @University_ID
          AND Section_ID = @Section_ID
          AND Course_ID = @Course_ID
          AND Semester = @Semester
          AND Assessment_ID = @Assessment_ID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Assignment not found', 1;
        
        SELECT 
            a.University_ID,
            a.Section_ID,
            a.Course_ID,
            a.Semester,
            a.Assessment_ID,
            a.MaxScore,
            a.accepted_specification,
            a.submission_deadline,
            a.instructions,
            c.Name as Course_Name
        FROM [Assignment] a
        INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
        WHERE a.University_ID = @University_ID
          AND a.Section_ID = @Section_ID
          AND a.Course_ID = @Course_ID
          AND a.Semester = @Semester
          AND a.Assessment_ID = @Assessment_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== DELETE ASSIGNMENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteAssignment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteAssignment]
GO

CREATE PROCEDURE [dbo].[DeleteAssignment]
    @University_ID DECIMAL(7,0),
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Assessment_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DELETE FROM [Assignment]
        WHERE University_ID = @University_ID
          AND Section_ID = @Section_ID
          AND Course_ID = @Course_ID
          AND Semester = @Semester
          AND Assessment_ID = @Assessment_ID;
        
        DELETE FROM [Assessment]
        WHERE University_ID = @University_ID
          AND Section_ID = @Section_ID
          AND Course_ID = @Course_ID
          AND Semester = @Semester
          AND Assessment_ID = @Assessment_ID;
        
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

-- ==================== GET ASSIGNMENTS BY COURSE ====================
-- Description: Get all assignments grouped by course and section for course management view
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAssignmentsByCourse]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAssignmentsByCourse]
GO

CREATE PROCEDURE [dbo].[GetAssignmentsByCourse]
    @Course_ID NVARCHAR(15) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.University_ID,
        a.Section_ID,
        a.Course_ID,
        a.Semester,
        a.Assessment_ID,
        a.MaxScore,
        a.accepted_specification,
        a.submission_deadline,
        a.instructions,
        c.Name as Course_Name
    FROM [Assignment] a
    INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
    WHERE (@Course_ID IS NULL OR a.Course_ID = @Course_ID)
    ORDER BY a.Course_ID, a.Section_ID, a.Semester, a.submission_deadline DESC;
END
GO

