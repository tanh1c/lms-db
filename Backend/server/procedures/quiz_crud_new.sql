-- Procedures: Quiz CRUD Operations (Updated for Quiz_Questions and Quiz_Answer tables)
-- ============================================
-- This file contains stored procedures for managing:
-- - Quiz_Questions: Quiz questions for each section/course (admin managed)
-- - Quiz_Answer: Student quiz answers (student responses)
-- ============================================

USE [lms_system]
GO

-- ==================== GET ALL QUIZ QUESTIONS (Admin View) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllQuizzes]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllQuizzes]
GO

CREATE PROCEDURE [dbo].[GetAllQuizzes]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        qq.QuizID,
        qq.Section_ID,
        qq.Course_ID,
        qq.Semester,
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
        c.Name as Course_Name,
        -- Count how many students have taken this quiz
        (SELECT COUNT(*) FROM [Quiz_Answer] qa WHERE qa.QuizID = qq.QuizID) as StudentCount
    FROM [Quiz_Questions] qq
    INNER JOIN [Course] c ON qq.Course_ID = c.Course_ID
    ORDER BY qq.Start_Date DESC;
END
GO

-- ==================== GET QUIZZES BY COURSE (Admin View) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetQuizzesByCourse]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetQuizzesByCourse]
GO

CREATE PROCEDURE [dbo].[GetQuizzesByCourse]
    @Course_ID NVARCHAR(15) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        qq.QuizID,
        qq.Section_ID,
        qq.Course_ID,
        qq.Semester,
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
        c.Name as Course_Name,
        -- Count how many students have taken this quiz
        (SELECT COUNT(*) FROM [Quiz_Answer] qa WHERE qa.QuizID = qq.QuizID) as StudentCount
    FROM [Quiz_Questions] qq
    INNER JOIN [Course] c ON qq.Course_ID = c.Course_ID
    WHERE (@Course_ID IS NULL OR qq.Course_ID = @Course_ID)
    ORDER BY qq.Course_ID, qq.Section_ID, qq.Semester, qq.Start_Date DESC;
END
GO

-- ==================== CREATE QUIZ (Admin - Creates Quiz_Questions) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateQuiz]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateQuiz]
GO

CREATE PROCEDURE [dbo].[CreateQuiz]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Grading_method NVARCHAR(50) = NULL,
    @pass_score DECIMAL(3,1) = NULL,
    @Time_limits TIME(7),
    @Start_Date DATETIME,
    @End_Date DATETIME,
    @content NVARCHAR(100),
    @types NVARCHAR(50) = NULL,
    @Weight FLOAT = NULL,
    @Correct_answer NVARCHAR(50),
    @Questions NVARCHAR(MAX) = NULL,
    @QuizID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insert into Quiz_Questions
        INSERT INTO [Quiz_Questions] (
            Section_ID,
            Course_ID,
            Semester,
            Grading_method,
            pass_score,
            Time_limits,
            Start_Date,
            End_Date,
            content,
            types,
            Weight,
            Correct_answer,
            Questions
        )
        VALUES (
            @Section_ID,
            @Course_ID,
            @Semester,
            @Grading_method,
            @pass_score,
            @Time_limits,
            @Start_Date,
            @End_Date,
            @content,
            @types,
            @Weight,
            @Correct_answer,
            @Questions
        );
        
        SET @QuizID = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        -- Return the created quiz
        SELECT 
            qq.QuizID,
            qq.Section_ID,
            qq.Course_ID,
            qq.Semester,
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
            c.Name as Course_Name,
            0 as StudentCount
        FROM [Quiz_Questions] qq
        INNER JOIN [Course] c ON qq.Course_ID = c.Course_ID
        WHERE qq.QuizID = @QuizID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE QUIZ (Admin - Updates Quiz_Questions) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateQuiz]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateQuiz]
GO

CREATE PROCEDURE [dbo].[UpdateQuiz]
    @QuizID INT,
    @Section_ID NVARCHAR(10) = NULL,
    @Course_ID NVARCHAR(15) = NULL,
    @Semester NVARCHAR(10) = NULL,
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
        -- Update all fields including Questions in a single UPDATE statement
        -- For Questions, we use COALESCE to handle NULL properly
        UPDATE [Quiz_Questions]
        SET 
            Section_ID = ISNULL(@Section_ID, Section_ID),
            Course_ID = ISNULL(@Course_ID, Course_ID),
            Semester = ISNULL(@Semester, Semester),
            Grading_method = ISNULL(@Grading_method, Grading_method),
            pass_score = ISNULL(@pass_score, pass_score),
            Time_limits = ISNULL(@Time_limits, Time_limits),
            Start_Date = ISNULL(@Start_Date, Start_Date),
            End_Date = ISNULL(@End_Date, End_Date),
            content = ISNULL(@content, content),
            types = ISNULL(@types, types),
            Weight = ISNULL(@Weight, Weight),
            Correct_answer = ISNULL(@Correct_answer, Correct_answer),
            Questions = COALESCE(@Questions, Questions)
        WHERE QuizID = @QuizID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Quiz not found', 1;
        
        -- Return the updated quiz
        SELECT 
            qq.QuizID,
            qq.Section_ID,
            qq.Course_ID,
            qq.Semester,
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
            c.Name as Course_Name,
            (SELECT COUNT(*) FROM [Quiz_Answer] qa WHERE qa.QuizID = qq.QuizID) as StudentCount
        FROM [Quiz_Questions] qq
        INNER JOIN [Course] c ON qq.Course_ID = c.Course_ID
        WHERE qq.QuizID = @QuizID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== DELETE QUIZ (Admin - Deletes Quiz_Questions) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteQuiz]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteQuiz]
GO

CREATE PROCEDURE [dbo].[DeleteQuiz]
    @QuizID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete Quiz_Answer records (will cascade due to FK)
        DELETE FROM [Quiz_Answer]
        WHERE QuizID = @QuizID;
        
        -- Delete Quiz_Questions
        DELETE FROM [Quiz_Questions]
        WHERE QuizID = @QuizID;
        
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

-- ==================== GET QUIZ BY ID (Admin) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetQuizById]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetQuizById]
GO

CREATE PROCEDURE [dbo].[GetQuizById]
    @QuizID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        qq.QuizID,
        qq.Section_ID,
        qq.Course_ID,
        qq.Semester,
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
        c.Name as Course_Name,
        (SELECT COUNT(*) FROM [Quiz_Answer] qa WHERE qa.QuizID = qq.QuizID) as StudentCount
    FROM [Quiz_Questions] qq
    INNER JOIN [Course] c ON qq.Course_ID = c.Course_ID
    WHERE qq.QuizID = @QuizID;
END
GO

-- ==================== GET STUDENT QUIZ ANSWERS ====================
-- Get all quiz answers for a specific student
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetStudentQuizAnswers]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetStudentQuizAnswers]
GO

CREATE PROCEDURE [dbo].[GetStudentQuizAnswers]
    @University_ID DECIMAL(7,0),
    @Course_ID NVARCHAR(15) = NULL,
    @Semester NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Now get Section_ID, Course_ID, Semester from Quiz_Questions via QuizID
    SELECT 
        qa.University_ID,
        qq.Section_ID,  -- From Quiz_Questions
        qq.Course_ID,   -- From Quiz_Questions
        qq.Semester,    -- From Quiz_Questions
        qa.Assessment_ID,
        qa.QuizID,
        qa.Responses,
        qa.completion_status,
        qa.score,
        qq.content,
        qq.Start_Date,
        qq.End_Date,
        qq.Time_limits,
        c.Name as Course_Name
    FROM [Quiz_Answer] qa
    INNER JOIN [Quiz_Questions] qq ON qa.QuizID = qq.QuizID
    INNER JOIN [Course] c ON qq.Course_ID = c.Course_ID
    WHERE qa.University_ID = @University_ID
      AND (@Course_ID IS NULL OR qq.Course_ID = @Course_ID)
      AND (@Semester IS NULL OR qq.Semester = @Semester)
    ORDER BY qq.Start_Date DESC;
END
GO

-- ==================== GET QUIZ ANSWERS BY QUIZ ID (Admin View) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetQuizAnswersByQuizID]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetQuizAnswersByQuizID]
GO

CREATE PROCEDURE [dbo].[GetQuizAnswersByQuizID]
    @QuizID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        qa.University_ID,
        u.First_Name,
        u.Last_Name,
        qa.QuizID,
        qa.Assessment_ID,
        qa.Responses,
        qa.completion_status,
        qa.score,
        qq.content as Quiz_Content,
        qq.pass_score,
        qq.Start_Date,
        qq.End_Date
    FROM [Quiz_Answer] qa
    INNER JOIN [Quiz_Questions] qq ON qa.QuizID = qq.QuizID
    INNER JOIN [Users] u ON qa.University_ID = u.University_ID
    WHERE qa.QuizID = @QuizID
    ORDER BY qa.score DESC, u.Last_Name, u.First_Name;
END
GO

-- ==================== CREATE/UPDATE STUDENT QUIZ ANSWER ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SaveStudentQuizAnswer]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[SaveStudentQuizAnswer]
GO

CREATE PROCEDURE [dbo].[SaveStudentQuizAnswer]
    @University_ID DECIMAL(7,0),
    @Assessment_ID INT OUTPUT,
    @QuizID INT,
    @Responses NVARCHAR(100) = NULL,
    @completion_status NVARCHAR(100) = NULL,
    @score DECIMAL(4,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Get Section_ID, Course_ID, Semester from Quiz_Questions
        DECLARE @Section_ID NVARCHAR(10)
        DECLARE @Course_ID NVARCHAR(15)
        DECLARE @Semester NVARCHAR(10)
        
        SELECT 
            @Section_ID = Section_ID,
            @Course_ID = Course_ID,
            @Semester = Semester
        FROM [Quiz_Questions]
        WHERE QuizID = @QuizID
        
        IF @Section_ID IS NULL
            THROW 50001, 'Quiz not found', 1;
        
        -- Get or create Assessment_ID
        IF @Assessment_ID IS NULL OR @Assessment_ID = 0
        BEGIN
            SELECT @Assessment_ID = ISNULL(MAX(Assessment_ID), 0) + 1
            FROM [Assessment]
            WHERE University_ID = @University_ID 
              AND Section_ID = @Section_ID 
              AND Course_ID = @Course_ID 
              AND Semester = @Semester;
            
            -- Insert into Assessment if not exists
            IF NOT EXISTS (
                SELECT 1 FROM [Assessment]
                WHERE University_ID = @University_ID 
                  AND Section_ID = @Section_ID 
                  AND Course_ID = @Course_ID 
                  AND Semester = @Semester
                  AND Assessment_ID = @Assessment_ID
            )
            BEGIN
                INSERT INTO [Assessment] (University_ID, Section_ID, Course_ID, Semester, Assessment_ID, Status)
                VALUES (@University_ID, @Section_ID, @Course_ID, @Semester, @Assessment_ID, 'Pending');
            END
        END
        
        -- Insert or update Quiz_Answer
        IF EXISTS (
            SELECT 1 FROM [Quiz_Answer]
            WHERE University_ID = @University_ID
              AND Assessment_ID = @Assessment_ID
              AND QuizID = @QuizID
        )
        BEGIN
            -- Update existing answer
            UPDATE [Quiz_Answer]
            SET 
                Responses = ISNULL(@Responses, Responses),
                completion_status = ISNULL(@completion_status, completion_status),
                score = ISNULL(@score, score)
            WHERE University_ID = @University_ID
              AND Assessment_ID = @Assessment_ID
              AND QuizID = @QuizID;
        END
        ELSE
        BEGIN
            -- Insert new answer
            INSERT INTO [Quiz_Answer] (
                University_ID,
                Assessment_ID,
                QuizID,
                Responses,
                completion_status,
                score
            )
            VALUES (
                @University_ID,
                @Assessment_ID,
                @QuizID,
                @Responses,
                @completion_status,
                @score
            );
        END
        
        COMMIT TRANSACTION;
        
        -- Return the saved answer
        SELECT 
            qa.University_ID,
            qq.Section_ID,
            qq.Course_ID,
            qq.Semester,
            qa.Assessment_ID,
            qa.QuizID,
            qa.Responses,
            qa.completion_status,
            qa.score,
            qq.content,
            qq.Start_Date,
            qq.End_Date,
            qq.Time_limits,
            c.Name as Course_Name
        FROM [Quiz_Answer] qa
        INNER JOIN [Quiz_Questions] qq ON qa.QuizID = qq.QuizID
        INNER JOIN [Course] c ON qq.Course_ID = c.Course_ID
        WHERE qa.University_ID = @University_ID
          AND qa.Assessment_ID = @Assessment_ID
          AND qa.QuizID = @QuizID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

