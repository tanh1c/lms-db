-- Procedures: Student Dashboard Statistics
-- Description: Get statistics and data for student dashboard

USE [lms_system]
GO

-- ==================== GET STUDENT DASHBOARD STATISTICS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetStudentDashboardStatistics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetStudentDashboardStatistics]
GO

CREATE PROCEDURE [dbo].[GetStudentDashboardStatistics]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @TotalCourses INT;
        DECLARE @TotalAssignments INT;
        DECLARE @TotalQuizzes INT;
        DECLARE @CompletedAssignments INT;
        DECLARE @CompletedQuizzes INT;
        DECLARE @AverageGrade DECIMAL(4,2);
        DECLARE @TotalStudyHours INT;
        DECLARE @ProgressPercentage DECIMAL(5,2);
        DECLARE @LeaderboardRank INT;
        DECLARE @StudentGPA DECIMAL(4,2);
        
        -- Total courses enrolled
        SELECT @TotalCourses = COUNT(DISTINCT CONCAT(a.Section_ID, '-', a.Course_ID, '-', a.Semester))
        FROM [Assessment] a
        WHERE a.University_ID = @University_ID
          AND a.Status != 'Withdrawn';
        
        -- Total assignments (for courses student is enrolled in)
        SELECT @TotalAssignments = COUNT(DISTINCT ad.AssignmentID)
        FROM [Assignment_Definition] ad
        INNER JOIN [Assessment] a ON ad.Course_ID = a.Course_ID AND ad.Semester = a.Semester
        WHERE a.University_ID = @University_ID
          AND a.Status != 'Withdrawn';
        
        -- Total quizzes (for sections student is enrolled in)
        SELECT @TotalQuizzes = COUNT(DISTINCT qq.QuizID)
        FROM [Quiz_Questions] qq
        INNER JOIN [Assessment] a ON qq.Section_ID = a.Section_ID 
            AND qq.Course_ID = a.Course_ID 
            AND qq.Semester = a.Semester
        WHERE a.University_ID = @University_ID
          AND a.Status != 'Withdrawn';
        
        -- Completed assignments (submitted)
        SELECT @CompletedAssignments = COUNT(DISTINCT asub.AssignmentID)
        FROM [Assignment_Submission] asub
        WHERE asub.University_ID = @University_ID
          AND asub.status = 'Submitted';
        
        -- Completed quizzes
        SELECT @CompletedQuizzes = COUNT(DISTINCT qa.QuizID)
        FROM [Quiz_Answer] qa
        WHERE qa.University_ID = @University_ID
          AND qa.completion_status IN ('Submitted', 'Passed', 'Failed');
        
        -- Calculate GPA: Weighted average of all courses
        -- Each course GPA = Quiz_Grade * 10% + Assignment_Grade * 20% + Midterm_Grade * 20% + Final_Grade * 50%
        SELECT @AverageGrade = AVG(
            ISNULL(a.Quiz_Grade, 0) * 0.10 +
            ISNULL(a.Assignment_Grade, 0) * 0.20 +
            ISNULL(a.Midterm_Grade, 0) * 0.20 +
            ISNULL(a.Final_Grade, 0) * 0.50
        )
        FROM [Assessment] a
        WHERE a.University_ID = @University_ID
          AND a.Status != 'Withdrawn'
          AND (
            a.Quiz_Grade IS NOT NULL OR 
            a.Assignment_Grade IS NOT NULL OR 
            a.Midterm_Grade IS NOT NULL OR 
            a.Final_Grade IS NOT NULL
          );
        
        -- Total study hours (estimated from assignments and quizzes completed)
        SET @TotalStudyHours = ISNULL(@CompletedAssignments, 0) * 2 + ISNULL(@CompletedQuizzes, 0) * 1;
        
        -- Progress percentage (completed assignments + quizzes / total assignments + quizzes)
        IF (@TotalAssignments + @TotalQuizzes) > 0
            SET @ProgressPercentage = CAST((@CompletedAssignments + @CompletedQuizzes) * 100.0 / (@TotalAssignments + @TotalQuizzes) AS DECIMAL(5,2));
        ELSE
            SET @ProgressPercentage = 0;
        
        -- Get student's GPA for leaderboard ranking
        SELECT @StudentGPA = AVG(
            ISNULL(a.Quiz_Grade, 0) * 0.10 +
            ISNULL(a.Assignment_Grade, 0) * 0.20 +
            ISNULL(a.Midterm_Grade, 0) * 0.20 +
            ISNULL(a.Final_Grade, 0) * 0.50
        )
        FROM [Assessment] a
        WHERE a.University_ID = @University_ID
          AND a.Status != 'Withdrawn'
          AND (
            a.Quiz_Grade IS NOT NULL OR 
            a.Assignment_Grade IS NOT NULL OR 
            a.Midterm_Grade IS NOT NULL OR 
            a.Final_Grade IS NOT NULL
          );
        
        -- Leaderboard rank (based on GPA)
        SELECT @LeaderboardRank = COUNT(*) + 1
        FROM (
            SELECT a2.University_ID, 
                AVG(
                    ISNULL(a2.Quiz_Grade, 0) * 0.10 +
                    ISNULL(a2.Assignment_Grade, 0) * 0.20 +
                    ISNULL(a2.Midterm_Grade, 0) * 0.20 +
                    ISNULL(a2.Final_Grade, 0) * 0.50
                ) AS gpa
            FROM [Assessment] a2
            WHERE a2.Status != 'Withdrawn'
              AND (
                a2.Quiz_Grade IS NOT NULL OR 
                a2.Assignment_Grade IS NOT NULL OR 
                a2.Midterm_Grade IS NOT NULL OR 
                a2.Final_Grade IS NOT NULL
              )
            GROUP BY a2.University_ID
            HAVING AVG(
                ISNULL(a2.Quiz_Grade, 0) * 0.10 +
                ISNULL(a2.Assignment_Grade, 0) * 0.20 +
                ISNULL(a2.Midterm_Grade, 0) * 0.20 +
                ISNULL(a2.Final_Grade, 0) * 0.50
            ) > ISNULL(@StudentGPA, 0)
        ) AS better_students;
        
        -- Return results
        SELECT 
            ISNULL(@TotalCourses, 0) AS total_courses,
            ISNULL(@TotalAssignments, 0) AS total_assignments,
            ISNULL(@TotalQuizzes, 0) AS total_quizzes,
            ISNULL(@CompletedAssignments, 0) AS completed_assignments,
            ISNULL(@CompletedQuizzes, 0) AS completed_quizzes,
            ISNULL(@AverageGrade, 0) AS average_grade,
            ISNULL(@TotalStudyHours, 0) AS total_study_hours,
            ISNULL(@ProgressPercentage, 0) AS progress_percentage,
            ISNULL(@LeaderboardRank, 0) AS leaderboard_rank;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET STUDENT UPCOMING TASKS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetStudentUpcomingTasks]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetStudentUpcomingTasks]
GO

CREATE PROCEDURE [dbo].[GetStudentUpcomingTasks]
    @University_ID DECIMAL(7,0),
    @DaysAhead INT = 7
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Get upcoming assignments
        SELECT 
            'Assignment' AS task_type,
            ad.AssignmentID AS task_id,
            ad.instructions AS task_title,
            ad.submission_deadline AS deadline,
            c.Name AS course_name,
            ad.Course_ID,
            ad.Semester,
            CASE 
                WHEN asub.status = 'Submitted' THEN 1
                ELSE 0
            END AS is_completed,
            asub.status AS current_status
        FROM [Assignment_Definition] ad
        INNER JOIN [Assessment] a ON ad.Course_ID = a.Course_ID AND ad.Semester = a.Semester
        INNER JOIN [Course] c ON ad.Course_ID = c.Course_ID
        LEFT JOIN [Assignment_Submission] asub ON asub.University_ID = a.University_ID 
            AND asub.AssignmentID = ad.AssignmentID
        WHERE a.University_ID = @University_ID
          AND a.Status != 'Withdrawn'
          AND ad.submission_deadline >= GETDATE()
          AND ad.submission_deadline <= DATEADD(DAY, @DaysAhead, GETDATE())
          AND (asub.status IS NULL OR asub.status != 'Submitted')
        
        UNION ALL
        
        -- Get upcoming quizzes
        SELECT 
            'Quiz' AS task_type,
            qq.QuizID AS task_id,
            qq.content AS task_title,
            qq.End_Date AS deadline,
            c.Name AS course_name,
            qq.Course_ID,
            qq.Semester,
            CASE 
                WHEN qa.completion_status IN ('Submitted', 'Passed', 'Failed') THEN 1
                ELSE 0
            END AS is_completed,
            qa.completion_status AS current_status
        FROM [Quiz_Questions] qq
        INNER JOIN [Assessment] a ON qq.Section_ID = a.Section_ID 
            AND qq.Course_ID = a.Course_ID 
            AND qq.Semester = a.Semester
        INNER JOIN [Course] c ON qq.Course_ID = c.Course_ID
        LEFT JOIN [Quiz_Answer] qa ON qa.University_ID = a.University_ID 
            AND qa.QuizID = qq.QuizID
        WHERE a.University_ID = @University_ID
          AND a.Status != 'Withdrawn'
          AND qq.End_Date >= GETDATE()
          AND qq.End_Date <= DATEADD(DAY, @DaysAhead, GETDATE())
          AND (qa.completion_status IS NULL OR qa.completion_status NOT IN ('Submitted', 'Passed', 'Failed'))
        
        ORDER BY deadline ASC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET STUDENT LEADERBOARD ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetStudentLeaderboard]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetStudentLeaderboard]
GO

CREATE PROCEDURE [dbo].[GetStudentLeaderboard]
    @TopN INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        WITH StudentStats AS (
            SELECT 
                a.University_ID,
                u.First_Name,
                u.Last_Name,
                COUNT(DISTINCT CONCAT(a.Section_ID, '-', a.Course_ID, '-', a.Semester)) AS total_courses,
                AVG(
                    ISNULL(a.Quiz_Grade, 0) * 0.10 +
                    ISNULL(a.Assignment_Grade, 0) * 0.20 +
                    ISNULL(a.Midterm_Grade, 0) * 0.20 +
                    ISNULL(a.Final_Grade, 0) * 0.50
                ) AS gpa,
                COUNT(DISTINCT asub.AssignmentID) * 2 + COUNT(DISTINCT qa.QuizID) * 1 AS estimated_hours
            FROM [Assessment] a
            INNER JOIN [Users] u ON a.University_ID = u.University_ID
            LEFT JOIN [Assignment_Submission] asub ON asub.University_ID = a.University_ID
            LEFT JOIN [Quiz_Answer] qa ON qa.University_ID = a.University_ID
            WHERE a.Status != 'Withdrawn'
              AND (
                a.Quiz_Grade IS NOT NULL OR 
                a.Assignment_Grade IS NOT NULL OR 
                a.Midterm_Grade IS NOT NULL OR 
                a.Final_Grade IS NOT NULL
              )
            GROUP BY a.University_ID, u.First_Name, u.Last_Name
            HAVING AVG(
                ISNULL(a.Quiz_Grade, 0) * 0.10 +
                ISNULL(a.Assignment_Grade, 0) * 0.20 +
                ISNULL(a.Midterm_Grade, 0) * 0.20 +
                ISNULL(a.Final_Grade, 0) * 0.50
            ) IS NOT NULL
        ),
        RankedStudents AS (
            SELECT 
                University_ID,
                First_Name,
                Last_Name,
                total_courses,
                estimated_hours,
                gpa AS points,
                ROW_NUMBER() OVER (ORDER BY gpa DESC) AS rank_num,
                LAG(gpa) OVER (ORDER BY gpa DESC) AS prev_grade
            FROM StudentStats
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
        FROM RankedStudents
        ORDER BY rank_num;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET STUDENT ACTIVITY CHART ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetStudentActivityChart]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetStudentActivityChart]
GO

CREATE PROCEDURE [dbo].[GetStudentActivityChart]
    @University_ID DECIMAL(7,0),
    @MonthsBack INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        WITH MonthSeries AS (
            SELECT 
                FORMAT(DATEADD(MONTH, -n, GETDATE()), 'MMM') AS month_name,
                DATEADD(MONTH, -n, GETDATE()) AS month_start,
                DATEADD(MONTH, -(n-1), GETDATE()) AS month_end
            FROM (
                SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
            ) AS months
            WHERE n < @MonthsBack
        ),
        AssignmentActivity AS (
            SELECT 
                ms.month_name,
                ms.month_start,
                ms.month_end,
                COUNT(DISTINCT asub.AssignmentID) * 2 AS Study
            FROM MonthSeries ms
            LEFT JOIN [Assignment_Submission] asub ON asub.University_ID = @University_ID
                AND asub.SubmitDate >= ms.month_start 
                AND asub.SubmitDate < ms.month_end
            GROUP BY ms.month_name, ms.month_start, ms.month_end
        ),
        QuizActivity AS (
            SELECT 
                ms.month_name,
                ms.month_start,
                ms.month_end,
                COUNT(DISTINCT qa.QuizID) AS Exams
            FROM MonthSeries ms
            LEFT JOIN [Quiz_Answer] qa ON qa.University_ID = @University_ID
            LEFT JOIN [Quiz_Questions] qq ON qq.QuizID = qa.QuizID
            WHERE qq.End_Date >= ms.month_start 
              AND qq.End_Date < ms.month_end
            GROUP BY ms.month_name, ms.month_start, ms.month_end
        )
        SELECT 
            ms.month_name AS month,
            ISNULL(aa.Study, 0) AS Study,
            ISNULL(qa.Exams, 0) AS Exams
        FROM MonthSeries ms
        LEFT JOIN AssignmentActivity aa ON aa.month_name = ms.month_name
        LEFT JOIN QuizActivity qa ON qa.month_name = ms.month_name
        ORDER BY ms.month_start;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET STUDENT GRADE COMPONENTS BY COURSE ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetStudentGradeComponents]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetStudentGradeComponents]
GO

CREATE PROCEDURE [dbo].[GetStudentGradeComponents]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            c.Name AS course_name,
            a.Course_ID,
            a.Semester,
            ISNULL(a.Final_Grade, 0) AS Final_Grade,
            ISNULL(a.Midterm_Grade, 0) AS Midterm_Grade,
            ISNULL(a.Quiz_Grade, 0) AS Quiz_Grade,
            ISNULL(a.Assignment_Grade, 0) AS Assignment_Grade
        FROM [Assessment] a
        INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
        WHERE a.University_ID = @University_ID
          AND a.Status != 'Withdrawn'
        ORDER BY a.Semester DESC, c.Name;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET STUDENT COURSES ====================
-- Description: Get distinct courses that a student is enrolled in
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetStudentCourses]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetStudentCourses]
GO

CREATE PROCEDURE [dbo].[GetStudentCourses]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT DISTINCT
            c.Course_ID,
            c.Name,
            c.Credit
        FROM [Course] c
        INNER JOIN [Assessment] a ON c.Course_ID = a.Course_ID
        WHERE a.University_ID = @University_ID
          AND a.Status != 'Withdrawn'
        ORDER BY c.Course_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

