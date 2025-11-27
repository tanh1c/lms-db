-- Procedures: Quiz CRUD Operations

-- ==================== GET ALL QUIZZES ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllQuizzes]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllQuizzes]
GO

CREATE PROCEDURE [dbo].[GetAllQuizzes]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        q.University_ID,
        q.Section_ID,
        q.Course_ID,
        q.Semester,
        q.Assessment_ID,
        q.Grading_method,
        q.pass_score,
        q.Time_limits,
        q.Start_Date,
        q.End_Date,
        q.Responses,
        q.completion_status,
        q.score,
        q.content,
        q.types,
        q.Weight,
        q.Correct_answer,
        q.Questions,
        c.Name as Course_Name
    FROM [Quiz] q
    INNER JOIN [Course] c ON q.Course_ID = c.Course_ID
    ORDER BY q.Start_Date DESC;
END
GO

-- ==================== CREATE QUIZ ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateQuiz]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateQuiz]
GO

CREATE PROCEDURE [dbo].[CreateQuiz]
    @University_ID DECIMAL(7,0),
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Assessment_ID INT OUTPUT,
    @Grading_method NVARCHAR(50) = NULL,
    @pass_score DECIMAL(3,1) = NULL,
    @Time_limits TIME(7),
    @Start_Date DATETIME,
    @End_Date DATETIME,
    @content NVARCHAR(100),
    @types NVARCHAR(50) = NULL,
    @Weight FLOAT = NULL,
    @Correct_answer NVARCHAR(50),
    @Questions NVARCHAR(MAX) = NULL
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
        
        -- Insert into Quiz
        INSERT INTO [Quiz] (University_ID, Section_ID, Course_ID, Semester, Assessment_ID,
                           Grading_method, pass_score, Time_limits, Start_Date, End_Date,
                           content, types, Weight, Correct_answer, Questions)
        VALUES (@University_ID, @Section_ID, @Course_ID, @Semester, @Assessment_ID,
                @Grading_method, @pass_score, @Time_limits, @Start_Date, @End_Date,
                @content, @types, @Weight, @Correct_answer, @Questions);
        
        COMMIT TRANSACTION;
        
        SELECT 
            q.University_ID,
            q.Section_ID,
            q.Course_ID,
            q.Semester,
            q.Assessment_ID,
            q.Grading_method,
            q.pass_score,
            q.Time_limits,
            q.Start_Date,
            q.End_Date,
            q.Responses,
            q.completion_status,
            q.score,
            q.content,
            q.types,
            q.Weight,
            q.Correct_answer,
            q.Questions,
            c.Name as Course_Name
        FROM [Quiz] q
        INNER JOIN [Course] c ON q.Course_ID = c.Course_ID
        WHERE q.University_ID = @University_ID
          AND q.Section_ID = @Section_ID
          AND q.Course_ID = @Course_ID
          AND q.Semester = @Semester
          AND q.Assessment_ID = @Assessment_ID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE QUIZ ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateQuiz]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateQuiz]
GO

CREATE PROCEDURE [dbo].[UpdateQuiz]
    @University_ID DECIMAL(7,0),
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Assessment_ID INT,
    @Grading_method NVARCHAR(50) = NULL,
    @pass_score DECIMAL(3,1) = NULL,
    @Time_limits TIME(7) = NULL,
    @Start_Date DATETIME = NULL,
    @End_Date DATETIME = NULL,
    @content NVARCHAR(100) = NULL,
    @types NVARCHAR(50) = NULL,
    @Weight FLOAT = NULL,
    @Correct_answer NVARCHAR(50) = NULL,
    @Questions NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        UPDATE [Quiz]
        SET 
            Grading_method = ISNULL(@Grading_method, Grading_method),
            pass_score = ISNULL(@pass_score, pass_score),
            Time_limits = ISNULL(@Time_limits, Time_limits),
            Start_Date = ISNULL(@Start_Date, Start_Date),
            End_Date = ISNULL(@End_Date, End_Date),
            content = ISNULL(@content, content),
            types = ISNULL(@types, types),
            Weight = ISNULL(@Weight, Weight),
            Correct_answer = ISNULL(@Correct_answer, Correct_answer),
            Questions = CASE 
                WHEN @Questions IS NOT NULL AND LEN(@Questions) > 0 THEN @Questions 
                ELSE Questions 
            END
        WHERE University_ID = @University_ID
          AND Section_ID = @Section_ID
          AND Course_ID = @Course_ID
          AND Semester = @Semester
          AND Assessment_ID = @Assessment_ID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Quiz not found', 1;
        
        SELECT 
            q.University_ID,
            q.Section_ID,
            q.Course_ID,
            q.Semester,
            q.Assessment_ID,
            q.Grading_method,
            q.pass_score,
            q.Time_limits,
            q.Start_Date,
            q.End_Date,
            q.Responses,
            q.completion_status,
            q.score,
            q.content,
            q.types,
            q.Weight,
            q.Correct_answer,
            q.Questions,
            c.Name as Course_Name
        FROM [Quiz] q
        INNER JOIN [Course] c ON q.Course_ID = c.Course_ID
        WHERE q.University_ID = @University_ID
          AND q.Section_ID = @Section_ID
          AND q.Course_ID = @Course_ID
          AND q.Semester = @Semester
          AND q.Assessment_ID = @Assessment_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== DELETE QUIZ ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteQuiz]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteQuiz]
GO

CREATE PROCEDURE [dbo].[DeleteQuiz]
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
        
        DELETE FROM [Quiz]
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
            THROW 50001, 'Quiz not found', 1;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== GET QUIZZES BY COURSE ====================
-- Description: Get all quizzes grouped by course and section for course management view
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetQuizzesByCourse]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetQuizzesByCourse]
GO

CREATE PROCEDURE [dbo].[GetQuizzesByCourse]
    @Course_ID NVARCHAR(15) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        q.University_ID,
        q.Section_ID,
        q.Course_ID,
        q.Semester,
        q.Assessment_ID,
        q.Grading_method,
        q.pass_score,
        q.Time_limits,
        q.Start_Date,
        q.End_Date,
        q.Responses,
        q.completion_status,
        q.score,
        q.content,
        q.types,
        q.Weight,
        q.Correct_answer,
        q.Questions,
        c.Name as Course_Name
    FROM [Quiz] q
    INNER JOIN [Course] c ON q.Course_ID = c.Course_ID
    WHERE (@Course_ID IS NULL OR q.Course_ID = @Course_ID)
    ORDER BY q.Course_ID, q.Section_ID, q.Semester, q.Start_Date DESC;
END
GO

