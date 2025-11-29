-- Procedure: Get Tutor Dashboard Statistics
-- Description: Get statistics and data for tutor dashboard
-- Includes: total courses, total students, pending grading, grading activity

USE [lms_system];
GO

-- ==================== GET TUTOR DASHBOARD STATISTICS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorDashboardStatistics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorDashboardStatistics]
GO

CREATE PROCEDURE [dbo].[GetTutorDashboardStatistics]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            -- Total distinct courses taught
            (SELECT COUNT(DISTINCT t.Course_ID)
             FROM [Teaches] t
             WHERE t.University_ID = @University_ID) AS TotalCourses,
            
            -- Total students across all sections taught
            (SELECT COUNT(DISTINCT a.University_ID)
             FROM [Assessment] a
             INNER JOIN [Teaches] t ON a.Section_ID = t.Section_ID
                 AND a.Course_ID = t.Course_ID
                 AND a.Semester = t.Semester
             WHERE t.University_ID = @University_ID
               AND a.Status != 'Withdrawn') AS TotalStudents,
            
            -- Pending assignment submissions (submitted but not graded)
            (SELECT COUNT(DISTINCT asub.AssignmentID)
             FROM [Assignment_Submission] asub
             INNER JOIN [Assignment_Definition] ad ON asub.AssignmentID = ad.AssignmentID
             INNER JOIN [Teaches] t ON ad.Course_ID = t.Course_ID
                 AND ad.Semester = t.Semester
             WHERE t.University_ID = @University_ID
               AND asub.status = 'Submitted'
               AND asub.score IS NULL) AS PendingAssignments,
            
            -- Pending quiz submissions (submitted but not graded)
            (SELECT COUNT(DISTINCT qa.QuizID)
             FROM [Quiz_Answer] qa
             INNER JOIN [Quiz_Questions] qq ON qa.QuizID = qq.QuizID
             INNER JOIN [Teaches] t ON qq.Section_ID = t.Section_ID
                 AND qq.Course_ID = t.Course_ID
                 AND qq.Semester = t.Semester
             WHERE t.University_ID = @University_ID
               AND qa.completion_status = 'Submitted'
               AND qa.score IS NULL) AS PendingQuizzes,
            
            -- Completion rate (graded assignments + quizzes / total submissions)
            (SELECT 
                CASE 
                    WHEN (COUNT(DISTINCT asub.AssignmentID) + COUNT(DISTINCT qa.QuizID)) > 0
                    THEN CAST(
                        (COUNT(DISTINCT CASE WHEN asub.score IS NOT NULL THEN asub.AssignmentID END) +
                         COUNT(DISTINCT CASE WHEN qa.score IS NOT NULL THEN qa.QuizID END)) * 100.0 /
                        (COUNT(DISTINCT asub.AssignmentID) + COUNT(DISTINCT qa.QuizID))
                        AS DECIMAL(5,2))
                    ELSE 0
                END
             FROM [Teaches] t
             LEFT JOIN [Assignment_Definition] ad ON t.Course_ID = ad.Course_ID AND t.Semester = ad.Semester
             LEFT JOIN [Assignment_Submission] asub ON ad.AssignmentID = asub.AssignmentID
             LEFT JOIN [Quiz_Questions] qq ON t.Section_ID = qq.Section_ID 
                 AND t.Course_ID = qq.Course_ID 
                 AND t.Semester = qq.Semester
             LEFT JOIN [Quiz_Answer] qa ON qq.QuizID = qa.QuizID
             WHERE t.University_ID = @University_ID) AS CompletionRate;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TUTOR COURSES ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorCourses]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorCourses]
GO

CREATE PROCEDURE [dbo].[GetTutorCourses]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            t.Course_ID,
            c.Name AS Course_Name,
            c.Credit,
            c.CCategory,
            t.Section_ID,
            t.Semester,
            -- Count students in this specific section
            (SELECT COUNT(DISTINCT a.University_ID)
             FROM [Assessment] a
             WHERE a.Section_ID = t.Section_ID
               AND a.Course_ID = t.Course_ID
               AND a.Semester = t.Semester
               AND a.Status != 'Withdrawn') AS StudentCount,
            -- Count assignments for this course
            (SELECT COUNT(DISTINCT ad.AssignmentID)
             FROM [Assignment_Definition] ad
             WHERE ad.Course_ID = t.Course_ID
               AND ad.Semester = t.Semester) AS AssignmentCount,
            -- Count pending assignments
            (SELECT COUNT(DISTINCT asub.AssignmentID)
             FROM [Assignment_Submission] asub
             INNER JOIN [Assignment_Definition] ad ON asub.AssignmentID = ad.AssignmentID
             WHERE ad.Course_ID = t.Course_ID
               AND ad.Semester = t.Semester
               AND asub.status = 'Submitted'
               AND asub.score IS NULL) AS PendingAssignments
        FROM [Teaches] t
        INNER JOIN [Course] c ON t.Course_ID = c.Course_ID
        WHERE t.University_ID = @University_ID
        ORDER BY c.Name, t.Course_ID, t.Semester, t.Section_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TUTOR COURSES WITH SECTIONS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorCoursesWithSections]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorCoursesWithSections]
GO

CREATE PROCEDURE [dbo].[GetTutorCoursesWithSections]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT DISTINCT
            c.Course_ID,
            c.Name,
            c.Credit,
            c.CCategory,
            t.Section_ID,
            t.Semester
        FROM [Course] c
        INNER JOIN [Teaches] t ON c.Course_ID = t.Course_ID
        WHERE t.University_ID = @University_ID
        ORDER BY c.Course_ID, t.Semester, t.Section_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TUTOR SECTION DETAIL ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorSectionDetail]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorSectionDetail]
GO

CREATE PROCEDURE [dbo].[GetTutorSectionDetail]
    @University_ID DECIMAL(7,0),
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            t.Section_ID,
            t.Course_ID,
            t.Semester,
            c.Name AS Course_Name,
            c.Credit,
            c.CCategory
        FROM [Teaches] t
        INNER JOIN [Course] c ON t.Course_ID = c.Course_ID
        WHERE t.University_ID = @University_ID
          AND t.Section_ID = @Section_ID
          AND t.Course_ID = @Course_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TUTOR SECTION QUIZZES ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorSectionQuizzes]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorSectionQuizzes]
GO

CREATE PROCEDURE [dbo].[GetTutorSectionQuizzes]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT DISTINCT
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
            -- Count submissions
            (SELECT COUNT(DISTINCT qa.University_ID)
             FROM [Quiz_Answer] qa
             WHERE qa.QuizID = qq.QuizID) AS SubmissionCount,
            -- Count passed
            (SELECT COUNT(DISTINCT qa.University_ID)
             FROM [Quiz_Answer] qa
             WHERE qa.QuizID = qq.QuizID
               AND qa.score IS NOT NULL
               AND qa.score >= qq.pass_score) AS PassedCount
        FROM [Quiz_Questions] qq
        WHERE qq.Section_ID = @Section_ID
          AND qq.Course_ID = @Course_ID
          AND qq.Semester = @Semester
        ORDER BY qq.Start_Date DESC, qq.QuizID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TUTOR SECTION ASSIGNMENTS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorSectionAssignments]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorSectionAssignments]
GO

CREATE PROCEDURE [dbo].[GetTutorSectionAssignments]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            ad.AssignmentID,
            ad.Course_ID,
            ad.Semester,
            ad.instructions,
            ad.accepted_specification,
            ad.submission_deadline,
            ad.TaskURL,
            ad.MaxScore,
            -- Count submissions for this section
            (SELECT COUNT(DISTINCT asub.University_ID)
             FROM [Assignment_Submission] asub
             INNER JOIN [Assessment] a ON asub.University_ID = a.University_ID
             WHERE asub.AssignmentID = ad.AssignmentID
               AND asub.status = 'Submitted'
               AND a.Section_ID = @Section_ID
               AND a.Course_ID = @Course_ID
               AND a.Semester = @Semester) AS SubmissionCount,
            -- Count pending (submitted but not graded) for this section
            (SELECT COUNT(DISTINCT asub.University_ID)
             FROM [Assignment_Submission] asub
             INNER JOIN [Assessment] a ON asub.University_ID = a.University_ID
             WHERE asub.AssignmentID = ad.AssignmentID
               AND asub.status = 'Submitted'
               AND asub.score IS NULL
               AND a.Section_ID = @Section_ID
               AND a.Course_ID = @Course_ID
               AND a.Semester = @Semester) AS PendingCount
        FROM [Assignment_Definition] ad
        WHERE ad.Course_ID = @Course_ID
          AND ad.Semester = @Semester
        ORDER BY ad.submission_deadline DESC, ad.AssignmentID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TUTOR SECTION STUDENTS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorSectionStudents]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorSectionStudents]
GO

CREATE PROCEDURE [dbo].[GetTutorSectionStudents]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT DISTINCT
            u.University_ID,
            u.First_Name,
            u.Last_Name,
            u.Email,
            s.Major,
            s.Current_degree
        FROM [Users] u
        INNER JOIN [Student] s ON u.University_ID = s.University_ID
        INNER JOIN [Assessment] a ON s.University_ID = a.University_ID
        WHERE a.Section_ID = @Section_ID
          AND a.Course_ID = @Course_ID
          AND a.Semester = @Semester
          AND a.Status != 'Withdrawn'
        ORDER BY u.Last_Name, u.First_Name;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== CREATE TUTOR QUIZ ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateTutorQuiz]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateTutorQuiz]
GO

CREATE PROCEDURE [dbo].[CreateTutorQuiz]
    @University_ID DECIMAL(7,0),
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
        -- Verify tutor teaches this section
        IF NOT EXISTS (
            SELECT 1 FROM [Teaches] t
            WHERE t.University_ID = @University_ID
              AND t.Section_ID = @Section_ID
              AND t.Course_ID = @Course_ID
              AND t.Semester = @Semester
        )
        BEGIN
            THROW 50001, 'Tutor does not teach this section', 1;
        END
        
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

-- ==================== UPDATE TUTOR QUIZ ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateTutorQuiz]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateTutorQuiz]
GO

CREATE PROCEDURE [dbo].[UpdateTutorQuiz]
    @University_ID DECIMAL(7,0),
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
        -- Get current quiz info
        DECLARE @CurrentSection_ID NVARCHAR(10)
        DECLARE @CurrentCourse_ID NVARCHAR(15)
        DECLARE @CurrentSemester NVARCHAR(10)
        
        SELECT @CurrentSection_ID = Section_ID,
               @CurrentCourse_ID = Course_ID,
               @CurrentSemester = Semester
        FROM [Quiz_Questions]
        WHERE QuizID = @QuizID
        
        IF @CurrentSection_ID IS NULL
            THROW 50001, 'Quiz not found', 1;
        
        -- Use provided values or current values
        SET @Section_ID = ISNULL(@Section_ID, @CurrentSection_ID)
        SET @Course_ID = ISNULL(@Course_ID, @CurrentCourse_ID)
        SET @Semester = ISNULL(@Semester, @CurrentSemester)
        
        -- Verify tutor teaches this section
        IF NOT EXISTS (
            SELECT 1 FROM [Teaches] t
            WHERE t.University_ID = @University_ID
              AND t.Section_ID = @Section_ID
              AND t.Course_ID = @Course_ID
              AND t.Semester = @Semester
        )
        BEGIN
            THROW 50001, 'Tutor does not teach this section', 1;
        END
        
        -- Update quiz
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

-- ==================== DELETE TUTOR QUIZ ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteTutorQuiz]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteTutorQuiz]
GO

CREATE PROCEDURE [dbo].[DeleteTutorQuiz]
    @University_ID DECIMAL(7,0),
    @QuizID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verify tutor teaches the section of this quiz
        IF NOT EXISTS (
            SELECT 1 FROM [Quiz_Questions] qq
            INNER JOIN [Teaches] t ON qq.Section_ID = t.Section_ID
                AND qq.Course_ID = t.Course_ID
                AND qq.Semester = t.Semester
            WHERE qq.QuizID = @QuizID
              AND t.University_ID = @University_ID
        )
        BEGIN
            THROW 50001, 'Tutor does not teach this section or quiz not found', 1;
        END
        
        BEGIN TRANSACTION;
        
        -- Delete Quiz_Answer records
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

-- ==================== CREATE TUTOR ASSIGNMENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateTutorAssignment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateTutorAssignment]
GO

CREATE PROCEDURE [dbo].[CreateTutorAssignment]
    @University_ID DECIMAL(7,0),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @MaxScore INT = NULL,
    @accepted_specification NVARCHAR(50) = NULL,
    @submission_deadline DATETIME,
    @instructions NVARCHAR(MAX) = NULL,
    @TaskURL NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verify tutor teaches this course/semester (at least one section)
        IF NOT EXISTS (
            SELECT 1 FROM [Teaches] t
            WHERE t.University_ID = @University_ID
              AND t.Course_ID = @Course_ID
              AND t.Semester = @Semester
        )
        BEGIN
            THROW 50001, 'Tutor does not teach this course/semester', 1;
        END
        
        BEGIN TRANSACTION;
        
        DECLARE @AssignmentID INT;
        
        -- Insert into Assignment_Definition
        INSERT INTO [Assignment_Definition] (
            Course_ID,
            Semester,
            MaxScore,
            accepted_specification,
            submission_deadline,
            instructions,
            TaskURL
        )
        VALUES (
            @Course_ID,
            @Semester,
            ISNULL(@MaxScore, 10),
            @accepted_specification,
            @submission_deadline,
            @instructions,
            @TaskURL
        );
        
        SET @AssignmentID = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        -- Return the created assignment
        SELECT 
            ad.AssignmentID,
            ad.Course_ID,
            ad.Semester,
            ad.MaxScore,
            ad.accepted_specification,
            ad.submission_deadline,
            ad.instructions,
            ad.TaskURL,
            c.Name as Course_Name,
            0 as StudentCount
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

-- ==================== UPDATE TUTOR ASSIGNMENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateTutorAssignment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateTutorAssignment]
GO

CREATE PROCEDURE [dbo].[UpdateTutorAssignment]
    @University_ID DECIMAL(7,0),
    @AssignmentID INT,
    @Course_ID NVARCHAR(15) = NULL,
    @Semester NVARCHAR(10) = NULL,
    @MaxScore INT = NULL,
    @accepted_specification NVARCHAR(50) = NULL,
    @submission_deadline DATETIME = NULL,
    @instructions NVARCHAR(MAX) = NULL,
    @TaskURL NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Get current assignment info
        DECLARE @CurrentCourse_ID NVARCHAR(15)
        DECLARE @CurrentSemester NVARCHAR(10)
        
        SELECT @CurrentCourse_ID = Course_ID,
               @CurrentSemester = Semester
        FROM [Assignment_Definition]
        WHERE AssignmentID = @AssignmentID
        
        IF @CurrentCourse_ID IS NULL
            THROW 50001, 'Assignment not found', 1;
        
        -- Use provided values or current values
        SET @Course_ID = ISNULL(@Course_ID, @CurrentCourse_ID)
        SET @Semester = ISNULL(@Semester, @CurrentSemester)
        
        -- Verify tutor teaches this course/semester
        IF NOT EXISTS (
            SELECT 1 FROM [Teaches] t
            WHERE t.University_ID = @University_ID
              AND t.Course_ID = @Course_ID
              AND t.Semester = @Semester
        )
        BEGIN
            THROW 50001, 'Tutor does not teach this course/semester', 1;
        END
        
        -- Update assignment
        UPDATE [Assignment_Definition]
        SET 
            Course_ID = ISNULL(@Course_ID, Course_ID),
            Semester = ISNULL(@Semester, Semester),
            MaxScore = ISNULL(@MaxScore, MaxScore),
            accepted_specification = ISNULL(@accepted_specification, accepted_specification),
            submission_deadline = ISNULL(@submission_deadline, submission_deadline),
            instructions = ISNULL(@instructions, instructions),
            TaskURL = ISNULL(@TaskURL, TaskURL)
        WHERE AssignmentID = @AssignmentID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Assignment not found', 1;
        
        -- Return the updated assignment
        SELECT 
            ad.AssignmentID,
            ad.Course_ID,
            ad.Semester,
            ad.MaxScore,
            ad.accepted_specification,
            ad.submission_deadline,
            ad.instructions,
            ad.TaskURL,
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

-- ==================== DELETE TUTOR ASSIGNMENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteTutorAssignment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteTutorAssignment]
GO

CREATE PROCEDURE [dbo].[DeleteTutorAssignment]
    @University_ID DECIMAL(7,0),
    @AssignmentID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verify tutor teaches the course/semester of this assignment
        IF NOT EXISTS (
            SELECT 1 FROM [Assignment_Definition] ad
            INNER JOIN [Teaches] t ON ad.Course_ID = t.Course_ID
                AND ad.Semester = t.Semester
            WHERE ad.AssignmentID = @AssignmentID
              AND t.University_ID = @University_ID
        )
        BEGIN
            THROW 50001, 'Tutor does not teach this course/semester or assignment not found', 1;
        END
        
        BEGIN TRANSACTION;
        
        -- Delete Assignment_Submission records
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

-- ==================== GET TUTOR STUDENT GRADE COMPONENTS BY COURSE ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorStudentGradeComponents]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorStudentGradeComponents]
GO

CREATE PROCEDURE [dbo].[GetTutorStudentGradeComponents]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Get average grade components for all students in courses taught by this tutor
        SELECT 
            c.Name AS course_name,
            c.Course_ID,
            AVG(ISNULL(a.Final_Grade, 0)) AS Final_Grade,
            AVG(ISNULL(a.Midterm_Grade, 0)) AS Midterm_Grade,
            AVG(ISNULL(a.Quiz_Grade, 0)) AS Quiz_Grade,
            AVG(ISNULL(a.Assignment_Grade, 0)) AS Assignment_Grade
        FROM [Teaches] t
        INNER JOIN [Assessment] a ON t.Section_ID = a.Section_ID
            AND t.Course_ID = a.Course_ID
            AND t.Semester = a.Semester
        INNER JOIN [Course] c ON t.Course_ID = c.Course_ID
        WHERE t.University_ID = @University_ID
          AND a.Status != 'Withdrawn'
          AND (
            a.Quiz_Grade IS NOT NULL OR 
            a.Assignment_Grade IS NOT NULL OR 
            a.Midterm_Grade IS NOT NULL OR 
            a.Final_Grade IS NOT NULL
          )
        GROUP BY c.Course_ID, c.Name
        ORDER BY c.Name;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TUTOR AVERAGE STUDENT GPA ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorAverageStudentGPA]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorAverageStudentGPA]
GO

CREATE PROCEDURE [dbo].[GetTutorAverageStudentGPA]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Calculate average GPA of all students in courses taught by this tutor
        -- GPA = Quiz_Grade * 10% + Assignment_Grade * 20% + Midterm_Grade * 20% + Final_Grade * 50%
        WITH TutorGPA AS (
            SELECT 
                AVG(
                    ISNULL(a.Quiz_Grade, 0) * 0.10 +
                    ISNULL(a.Assignment_Grade, 0) * 0.20 +
                    ISNULL(a.Midterm_Grade, 0) * 0.20 +
                    ISNULL(a.Final_Grade, 0) * 0.50
                ) AS AverageGPA,
                COUNT(DISTINCT a.University_ID) AS TotalStudents,
                COUNT(DISTINCT t.Course_ID) AS TotalCourses
            FROM [Teaches] t
            INNER JOIN [Assessment] a ON t.Section_ID = a.Section_ID
                AND t.Course_ID = a.Course_ID
                AND t.Semester = a.Semester
            WHERE t.University_ID = @University_ID
              AND a.Status != 'Withdrawn'
              AND (
                a.Quiz_Grade IS NOT NULL OR 
                a.Assignment_Grade IS NOT NULL OR 
                a.Midterm_Grade IS NOT NULL OR 
                a.Final_Grade IS NOT NULL
              )
        ),
        AllTutorsGPA AS (
            SELECT 
                t2.University_ID,
                AVG(
                    ISNULL(a2.Quiz_Grade, 0) * 0.10 +
                    ISNULL(a2.Assignment_Grade, 0) * 0.20 +
                    ISNULL(a2.Midterm_Grade, 0) * 0.20 +
                    ISNULL(a2.Final_Grade, 0) * 0.50
                ) AS TutorAverageGPA
            FROM [Teaches] t2
            INNER JOIN [Assessment] a2 ON t2.Section_ID = a2.Section_ID
                AND t2.Course_ID = a2.Course_ID
                AND t2.Semester = a2.Semester
            WHERE a2.Status != 'Withdrawn'
              AND (
                a2.Quiz_Grade IS NOT NULL OR 
                a2.Assignment_Grade IS NOT NULL OR 
                a2.Midterm_Grade IS NOT NULL OR 
                a2.Final_Grade IS NOT NULL
              )
            GROUP BY t2.University_ID
        ),
        RankedTutors AS (
            SELECT 
                University_ID,
                TutorAverageGPA,
                ROW_NUMBER() OVER (ORDER BY TutorAverageGPA DESC) AS RankNum
            FROM AllTutorsGPA
        )
        SELECT 
            tg.AverageGPA,
            tg.TotalStudents,
            tg.TotalCourses,
            ISNULL(rt.RankNum, 0) AS Rank
        FROM TutorGPA tg
        LEFT JOIN RankedTutors rt ON rt.University_ID = @University_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TOP TUTORS BY STUDENT GPA ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTopTutorsByStudentGPA]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTopTutorsByStudentGPA]
GO

CREATE PROCEDURE [dbo].[GetTopTutorsByStudentGPA]
    @TopN INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        WITH TutorStats AS (
            SELECT 
                t.University_ID,
                u.First_Name,
                u.Last_Name,
                COUNT(DISTINCT CONCAT(te.Section_ID, '-', te.Course_ID, '-', te.Semester)) AS total_courses,
                AVG(
                    ISNULL(a.Quiz_Grade, 0) * 0.10 +
                    ISNULL(a.Assignment_Grade, 0) * 0.20 +
                    ISNULL(a.Midterm_Grade, 0) * 0.20 +
                    ISNULL(a.Final_Grade, 0) * 0.50
                ) AS gpa,
                COUNT(DISTINCT a.University_ID) AS estimated_hours
            FROM [Tutor] t
            INNER JOIN [Users] u ON t.University_ID = u.University_ID
            INNER JOIN [Teaches] te ON t.University_ID = te.University_ID
            INNER JOIN [Assessment] a ON te.Section_ID = a.Section_ID 
                AND te.Course_ID = a.Course_ID 
                AND te.Semester = a.Semester
            WHERE a.Status != 'Withdrawn'
              AND (
                a.Quiz_Grade IS NOT NULL OR 
                a.Assignment_Grade IS NOT NULL OR 
                a.Midterm_Grade IS NOT NULL OR 
                a.Final_Grade IS NOT NULL
              )
            GROUP BY t.University_ID, u.First_Name, u.Last_Name
            HAVING AVG(
                ISNULL(a.Quiz_Grade, 0) * 0.10 +
                ISNULL(a.Assignment_Grade, 0) * 0.20 +
                ISNULL(a.Midterm_Grade, 0) * 0.20 +
                ISNULL(a.Final_Grade, 0) * 0.50
            ) IS NOT NULL
        ),
        RankedTutors AS (
            SELECT 
                University_ID,
                First_Name,
                Last_Name,
                total_courses,
                estimated_hours,
                gpa AS points,
                ROW_NUMBER() OVER (ORDER BY gpa DESC) AS rank_num,
                LAG(gpa) OVER (ORDER BY gpa DESC) AS prev_grade
            FROM TutorStats
        )
        SELECT TOP (@TopN)
            rank_num AS rank,
            First_Name,
            Last_Name,
            total_courses AS course,
            estimated_hours AS hour,
            points,
            CASE 
                WHEN prev_grade IS NULL OR points >= prev_grade THEN 'up'
                ELSE 'down'
            END AS trend
        FROM RankedTutors
        ORDER BY rank_num;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TUTOR GRADING ACTIVITY ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorGradingActivity]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorGradingActivity]
GO

CREATE PROCEDURE [dbo].[GetTutorGradingActivity]
    @University_ID DECIMAL(7,0),
    @MonthsBack INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Get grading activity for the last N months
        -- Using a simpler approach with UNION ALL for months
        DECLARE @StartDate DATE = DATEADD(MONTH, -@MonthsBack, GETDATE())
        
        SELECT 
            FORMAT(DATEADD(MONTH, number, @StartDate), 'MMM') AS Month,
            -- Count graded assignments
            (SELECT COUNT(DISTINCT asub.AssignmentID)
             FROM [Assignment_Submission] asub
             INNER JOIN [Assignment_Definition] ad ON asub.AssignmentID = ad.AssignmentID
             INNER JOIN [Teaches] t ON ad.Course_ID = t.Course_ID
                 AND ad.Semester = t.Semester
             WHERE t.University_ID = @University_ID
               AND asub.score IS NOT NULL
               AND YEAR(asub.SubmitDate) = YEAR(DATEADD(MONTH, number, @StartDate))
               AND MONTH(asub.SubmitDate) = MONTH(DATEADD(MONTH, number, @StartDate))) AS Graded,
            -- Count pending assignments
            (SELECT COUNT(DISTINCT asub.AssignmentID)
             FROM [Assignment_Submission] asub
             INNER JOIN [Assignment_Definition] ad ON asub.AssignmentID = ad.AssignmentID
             INNER JOIN [Teaches] t ON ad.Course_ID = t.Course_ID
                 AND ad.Semester = t.Semester
             WHERE t.University_ID = @University_ID
               AND asub.status = 'Submitted'
               AND asub.score IS NULL
               AND YEAR(asub.SubmitDate) = YEAR(DATEADD(MONTH, number, @StartDate))
               AND MONTH(asub.SubmitDate) = MONTH(DATEADD(MONTH, number, @StartDate))) AS Pending
        FROM (
            SELECT 0 AS number UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL 
            SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL 
            SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
        ) AS months
        WHERE number < @MonthsBack
        ORDER BY DATEADD(MONTH, number, @StartDate) DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE TUTOR QUIZ ANSWER SCORE ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateTutorQuizAnswerScore]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateTutorQuizAnswerScore]
GO

CREATE PROCEDURE [dbo].[UpdateTutorQuizAnswerScore]
    @University_ID DECIMAL(7,0),
    @QuizID INT,
    @Student_University_ID DECIMAL(7,0),
    @Score DECIMAL(4,2)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verify tutor teaches the section of this quiz
        IF NOT EXISTS (
            SELECT 1 FROM [Quiz_Questions] qq
            INNER JOIN [Teaches] t ON qq.Section_ID = t.Section_ID
                AND qq.Course_ID = t.Course_ID
                AND qq.Semester = t.Semester
            WHERE qq.QuizID = @QuizID
              AND t.University_ID = @University_ID
        )
        BEGIN
            THROW 50001, 'Tutor does not teach this quiz', 1;
        END
        
        -- Update quiz answer score
        UPDATE [Quiz_Answer]
        SET score = @Score
        WHERE QuizID = @QuizID
          AND University_ID = @Student_University_ID;
        
        IF @@ROWCOUNT = 0
        BEGIN
            THROW 50002, 'Quiz answer not found', 1;
        END
        
        -- Return updated quiz answer
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
          AND qa.University_ID = @Student_University_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE TUTOR ASSIGNMENT SUBMISSION SCORE ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateTutorAssignmentSubmissionScore]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateTutorAssignmentSubmissionScore]
GO

CREATE PROCEDURE [dbo].[UpdateTutorAssignmentSubmissionScore]
    @University_ID DECIMAL(7,0),
    @AssignmentID INT,
    @Student_University_ID DECIMAL(7,0),
    @Score DECIMAL(5,2),
    @Comments NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verify tutor teaches the course/semester of this assignment
        IF NOT EXISTS (
            SELECT 1 FROM [Assignment_Definition] ad
            INNER JOIN [Teaches] t ON ad.Course_ID = t.Course_ID
                AND ad.Semester = t.Semester
            WHERE ad.AssignmentID = @AssignmentID
              AND t.University_ID = @University_ID
        )
        BEGIN
            THROW 50001, 'Tutor does not teach this assignment', 1;
        END
        
        -- Update assignment submission score
        UPDATE [Assignment_Submission]
        SET 
            score = @Score,
            Comments = ISNULL(@Comments, Comments)
        WHERE AssignmentID = @AssignmentID
          AND University_ID = @Student_University_ID;
        
        IF @@ROWCOUNT = 0
        BEGIN
            THROW 50002, 'Assignment submission not found', 1;
        END
        
        -- Return updated assignment submission
        SELECT 
            asub.University_ID,
            u.First_Name,
            u.Last_Name,
            asub.AssignmentID,
            asub.Assessment_ID,
            asub.score,
            asub.accepted_specification,
            asub.late_flag_indicator,
            asub.SubmitDate,
            asub.attached_files,
            asub.status,
            asub.Comments,
            ad.instructions as Assignment_Instructions,
            ad.MaxScore,
            ad.submission_deadline
        FROM [Assignment_Submission] asub
        INNER JOIN [Assignment_Definition] ad ON asub.AssignmentID = ad.AssignmentID
        INNER JOIN [Users] u ON asub.University_ID = u.University_ID
        WHERE asub.AssignmentID = @AssignmentID
          AND asub.University_ID = @Student_University_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE TUTOR ASSESSMENT GRADES ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateTutorAssessmentGrades]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateTutorAssessmentGrades]
GO

CREATE PROCEDURE [dbo].[UpdateTutorAssessmentGrades]
    @University_ID DECIMAL(7,0),
    @Assessment_ID INT,
    @Quiz_Grade DECIMAL(5,2) = NULL,
    @Assignment_Grade DECIMAL(5,2) = NULL,
    @Midterm_Grade DECIMAL(5,2) = NULL,
    @Final_Grade DECIMAL(5,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verify tutor teaches the section of this assessment
        IF NOT EXISTS (
            SELECT 1 FROM [Assessment] a
            INNER JOIN [Teaches] t ON a.Section_ID = t.Section_ID
                AND a.Course_ID = t.Course_ID
                AND a.Semester = t.Semester
            WHERE a.Assessment_ID = @Assessment_ID
              AND t.University_ID = @University_ID
        )
        BEGIN
            THROW 50001, 'Tutor does not teach this assessment', 1;
        END
        
        -- Update assessment grades (only update non-NULL values)
        UPDATE [Assessment]
        SET 
            Quiz_Grade = ISNULL(@Quiz_Grade, Quiz_Grade),
            Assignment_Grade = ISNULL(@Assignment_Grade, Assignment_Grade),
            Midterm_Grade = ISNULL(@Midterm_Grade, Midterm_Grade),
            Final_Grade = ISNULL(@Final_Grade, Final_Grade)
        WHERE Assessment_ID = @Assessment_ID;
        
        IF @@ROWCOUNT = 0
        BEGIN
            THROW 50002, 'Assessment not found', 1;
        END
        
        -- Return updated assessment
        SELECT 
            a.Assessment_ID,
            a.University_ID,
            a.Section_ID,
            a.Course_ID,
            a.Semester,
            a.Quiz_Grade,
            a.Assignment_Grade,
            a.Midterm_Grade,
            a.Final_Grade,
            a.Status
        FROM [Assessment] a
        WHERE a.Assessment_ID = @Assessment_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TUTOR SECTION STUDENT GRADES ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorSectionStudentGrades]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorSectionStudentGrades]
GO

CREATE PROCEDURE [dbo].[GetTutorSectionStudentGrades]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            u.University_ID,
            u.First_Name,
            u.Last_Name,
            u.Email,
            s.Major,
            s.Current_degree,
            a.Assessment_ID,
            a.Quiz_Grade,
            a.Assignment_Grade,
            a.Midterm_Grade,
            a.Final_Grade,
            a.Status,
            -- Calculate GPA: 10% Quiz, 20% Assignment, 20% Midterm, 50% Final
            CASE 
                WHEN a.Final_Grade IS NOT NULL THEN
                    (ISNULL(a.Quiz_Grade, 0) * 0.1 + 
                     ISNULL(a.Assignment_Grade, 0) * 0.2 + 
                     ISNULL(a.Midterm_Grade, 0) * 0.2 + 
                     ISNULL(a.Final_Grade, 0) * 0.5)
                ELSE NULL
            END AS GPA
        FROM [Users] u
        INNER JOIN [Student] s ON u.University_ID = s.University_ID
        LEFT JOIN [Assessment] a ON s.University_ID = a.University_ID
            AND a.Section_ID = @Section_ID
            AND a.Course_ID = @Course_ID
            AND a.Semester = @Semester
            AND a.Status != 'Withdrawn'
        WHERE EXISTS (
            SELECT 1 FROM [Assessment] a2
            WHERE a2.University_ID = u.University_ID
              AND a2.Section_ID = @Section_ID
              AND a2.Course_ID = @Course_ID
              AND a2.Semester = @Semester
              AND a2.Status != 'Withdrawn'
        )
        ORDER BY u.Last_Name, u.First_Name;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TUTOR SCHEDULE ====================
-- Procedure: Get Tutor Schedule
-- Description: Get schedule for a tutor from all sections they teach
-- Includes Day_of_Week, Start_Period, End_Period from Scheduler table
-- Includes Building_Name and Room_Name from takes_place table
-- This is used for the tutor's schedule page

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTutorSchedule]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTutorSchedule]
GO

CREATE PROCEDURE [dbo].[GetTutorSchedule]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            t.Section_ID,
            t.Course_ID,
            t.Semester,
            c.Name AS Course_Name,
            sch.Day_of_Week,
            sch.Start_Period,
            sch.End_Period,
            tp.Building_Name,
            tp.Room_Name
        FROM [Teaches] t
        INNER JOIN [Section] s ON t.Section_ID = s.Section_ID 
            AND t.Course_ID = s.Course_ID 
            AND t.Semester = s.Semester
        INNER JOIN [Course] c ON t.Course_ID = c.Course_ID
        INNER JOIN [Scheduler] sch ON t.Section_ID = sch.Section_ID
            AND t.Course_ID = sch.Course_ID
            AND t.Semester = sch.Semester
        LEFT JOIN [takes_place] tp ON t.Section_ID = tp.Section_ID
            AND t.Course_ID = tp.Course_ID
            AND t.Semester = tp.Semester
        WHERE t.University_ID = @University_ID
          AND sch.Day_of_Week IS NOT NULL
          AND sch.Start_Period IS NOT NULL
          AND sch.End_Period IS NOT NULL
        ORDER BY sch.Day_of_Week, sch.Start_Period;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

