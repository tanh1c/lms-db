-- Procedures: Advanced Statistics & Analytics
-- Description: Comprehensive statistics for user management dashboard

-- ==================== GET GPA STATISTICS BY MAJOR ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetGPAStatisticsByMajor]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetGPAStatisticsByMajor]
GO

CREATE PROCEDURE [dbo].[GetGPAStatisticsByMajor]
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        WITH CourseGPAs AS (
            SELECT 
                s.University_ID,
                s.Major,
                a.Course_ID,
                c.Credit,
                -- Calculate GPA: 10% quiz + 20% assignment + 20% midterm + 50% final
                CASE 
                    WHEN a.Final_Grade IS NOT NULL THEN
                        (ISNULL(a.Final_Grade, 0) * 0.5 + 
                         ISNULL(a.Midterm_Grade, 0) * 0.2 + 
                         ISNULL(a.Assignment_Grade, 0) * 0.2 + 
                         ISNULL(a.Quiz_Grade, 0) * 0.1) /
                        (0.5 + 
                         CASE WHEN a.Midterm_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                         CASE WHEN a.Assignment_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                         CASE WHEN a.Quiz_Grade IS NOT NULL THEN 0.1 ELSE 0 END)
                    ELSE NULL
                END AS CourseGPA
            FROM [Assessment] a
            INNER JOIN [Student] s ON a.University_ID = s.University_ID
            INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
            WHERE a.Final_Grade IS NOT NULL
                AND a.Status = 'Approved'
        ),
        StudentGPAs AS (
            SELECT 
                Major,
                University_ID,
                SUM(CourseGPA * Credit) / NULLIF(SUM(Credit), 0) AS CumulativeGPA
            FROM CourseGPAs
            WHERE CourseGPA IS NOT NULL
            GROUP BY Major, University_ID
        )
        SELECT 
            Major,
            COUNT(DISTINCT University_ID) AS StudentCount,
            AVG(CumulativeGPA) AS AverageGPA,
            MIN(CumulativeGPA) AS MinGPA,
            MAX(CumulativeGPA) AS MaxGPA,
            STDEV(CumulativeGPA) AS StdDevGPA
        FROM StudentGPAs
        GROUP BY Major
        ORDER BY AverageGPA DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET GPA STATISTICS BY DEPARTMENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetGPAStatisticsByDepartment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetGPAStatisticsByDepartment]
GO

CREATE PROCEDURE [dbo].[GetGPAStatisticsByDepartment]
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        WITH CourseGPAs AS (
            SELECT 
                s.University_ID,
                t.Department_Name,
                a.Course_ID,
                c.Credit,
                -- Calculate GPA: 10% quiz + 20% assignment + 20% midterm + 50% final
                CASE 
                    WHEN a.Final_Grade IS NOT NULL THEN
                        (ISNULL(a.Final_Grade, 0) * 0.5 + 
                         ISNULL(a.Midterm_Grade, 0) * 0.2 + 
                         ISNULL(a.Assignment_Grade, 0) * 0.2 + 
                         ISNULL(a.Quiz_Grade, 0) * 0.1) /
                        (0.5 + 
                         CASE WHEN a.Midterm_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                         CASE WHEN a.Assignment_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                         CASE WHEN a.Quiz_Grade IS NOT NULL THEN 0.1 ELSE 0 END)
                    ELSE NULL
                END AS CourseGPA
            FROM [Assessment] a
            INNER JOIN [Student] s ON a.University_ID = s.University_ID
            INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
            INNER JOIN [Teaches] te ON a.Section_ID = te.Section_ID 
                AND a.Course_ID = te.Course_ID 
                AND a.Semester = te.Semester
            INNER JOIN [Tutor] t ON te.University_ID = t.University_ID
            WHERE a.Final_Grade IS NOT NULL
                AND a.Status = 'Approved'
                AND t.Department_Name IS NOT NULL
        ),
        StudentGPAs AS (
            SELECT 
                Department_Name,
                University_ID,
                SUM(CourseGPA * Credit) / NULLIF(SUM(Credit), 0) AS CumulativeGPA
            FROM CourseGPAs
            WHERE CourseGPA IS NOT NULL
            GROUP BY Department_Name, University_ID
        )
        SELECT 
            Department_Name,
            COUNT(DISTINCT University_ID) AS StudentCount,
            AVG(CumulativeGPA) AS AverageGPA,
            MIN(CumulativeGPA) AS MinGPA,
            MAX(CumulativeGPA) AS MaxGPA,
            STDEV(CumulativeGPA) AS StdDevGPA
        FROM StudentGPAs
        GROUP BY Department_Name
        ORDER BY AverageGPA DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET COURSE ENROLLMENT STATISTICS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseEnrollmentStatistics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseEnrollmentStatistics]
GO

CREATE PROCEDURE [dbo].[GetCourseEnrollmentStatistics]
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            s.Major,
            COUNT(DISTINCT a.University_ID) AS TotalStudents,
            COUNT(DISTINCT a.Course_ID) AS TotalCourses,
            COUNT(DISTINCT a.Section_ID + '-' + a.Course_ID + '-' + a.Semester) AS TotalEnrollments,
            CAST(AVG(CAST(EnrollmentCount AS FLOAT)) AS DECIMAL(10,2)) AS AvgCoursesPerStudent
        FROM [Assessment] a
        INNER JOIN [Student] s ON a.University_ID = s.University_ID
        INNER JOIN (
            SELECT University_ID, COUNT(DISTINCT Course_ID) AS EnrollmentCount
            FROM [Assessment]
            WHERE Status = 'Approved'
            GROUP BY University_ID
        ) ec ON a.University_ID = ec.University_ID
        WHERE a.Status = 'Approved'
        GROUP BY s.Major
        ORDER BY TotalStudents DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET COMPLETION RATE STATISTICS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCompletionRateStatistics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCompletionRateStatistics]
GO

CREATE PROCEDURE [dbo].[GetCompletionRateStatistics]
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Quiz completion rates
        WITH QuizStats AS (
            SELECT 
                COUNT(DISTINCT qq.QuizID) AS TotalQuizzes,
                COUNT(DISTINCT CASE WHEN qa.completion_status IN ('Submitted', 'Passed', 'Failed') THEN qa.QuizID END) AS CompletedQuizzes,
                COUNT(DISTINCT CASE WHEN qa.completion_status = 'Passed' THEN qa.QuizID END) AS PassedQuizzes
            FROM [Quiz_Questions] qq
            LEFT JOIN [Quiz_Answer] qa ON qq.QuizID = qa.QuizID
        ),
        AssignmentStats AS (
            SELECT 
                COUNT(DISTINCT ad.AssignmentID) AS TotalAssignments,
                SUM(CASE WHEN asub.status = 'Submitted' THEN 1 ELSE 0 END) AS SubmittedAssignments
            FROM [Assignment_Definition] ad
            LEFT JOIN [Assignment_Submission] asub ON ad.AssignmentID = asub.AssignmentID
        )
        SELECT 
            'Quiz' AS Type,
            TotalQuizzes AS Total,
            CompletedQuizzes AS Completed,
            PassedQuizzes AS Passed,
            CAST(CompletedQuizzes AS FLOAT) / NULLIF(TotalQuizzes, 0) * 100 AS CompletionRate,
            CAST(PassedQuizzes AS FLOAT) / NULLIF(CompletedQuizzes, 0) * 100 AS PassRate
        FROM QuizStats
        UNION ALL
        SELECT 
            'Assignment' AS Type,
            TotalAssignments AS Total,
            SubmittedAssignments AS Completed,
            0 AS Passed,
            CAST(SubmittedAssignments AS FLOAT) / NULLIF(TotalAssignments, 0) * 100 AS CompletionRate,
            0 AS PassRate
        FROM AssignmentStats;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET PERFORMANCE OVER TIME ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetPerformanceOverTime]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetPerformanceOverTime]
GO

CREATE PROCEDURE [dbo].[GetPerformanceOverTime]
    @GroupBy NVARCHAR(20) = 'Semester' -- 'Semester' or 'Month'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        IF @GroupBy = 'Semester'
        BEGIN
            WITH CourseGPAs AS (
                SELECT 
                    a.Semester,
                    a.University_ID,
                    a.Course_ID,
                    c.Credit,
                    -- Calculate GPA: 10% quiz + 20% assignment + 20% midterm + 50% final
                    CASE 
                        WHEN a.Final_Grade IS NOT NULL THEN
                            (ISNULL(a.Final_Grade, 0) * 0.5 + 
                             ISNULL(a.Midterm_Grade, 0) * 0.2 + 
                             ISNULL(a.Assignment_Grade, 0) * 0.2 + 
                             ISNULL(a.Quiz_Grade, 0) * 0.1) /
                            (0.5 + 
                             CASE WHEN a.Midterm_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                             CASE WHEN a.Assignment_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                             CASE WHEN a.Quiz_Grade IS NOT NULL THEN 0.1 ELSE 0 END)
                        ELSE NULL
                    END AS CourseGPA
                FROM [Assessment] a
                INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
                WHERE a.Final_Grade IS NOT NULL
                    AND a.Status = 'Approved'
            )
            SELECT 
                Semester AS Period,
                COUNT(DISTINCT University_ID) AS StudentCount,
                COUNT(DISTINCT Course_ID) AS CourseCount,
                AVG(CourseGPA) AS AverageGPA,
                MIN(CourseGPA) AS MinGPA,
                MAX(CourseGPA) AS MaxGPA
            FROM CourseGPAs
            WHERE CourseGPA IS NOT NULL
            GROUP BY Semester
            ORDER BY Semester;
        END
        ELSE
        BEGIN
            WITH CourseGPAs AS (
                SELECT 
                    FORMAT(a.Registration_Date, 'yyyy-MM') AS Period,
                    a.University_ID,
                    a.Course_ID,
                    c.Credit,
                    -- Calculate GPA: 10% quiz + 20% assignment + 20% midterm + 50% final
                    CASE 
                        WHEN a.Final_Grade IS NOT NULL THEN
                            (ISNULL(a.Final_Grade, 0) * 0.5 + 
                             ISNULL(a.Midterm_Grade, 0) * 0.2 + 
                             ISNULL(a.Assignment_Grade, 0) * 0.2 + 
                             ISNULL(a.Quiz_Grade, 0) * 0.1) /
                            (0.5 + 
                             CASE WHEN a.Midterm_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                             CASE WHEN a.Assignment_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                             CASE WHEN a.Quiz_Grade IS NOT NULL THEN 0.1 ELSE 0 END)
                        ELSE NULL
                    END AS CourseGPA
                FROM [Assessment] a
                INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
                WHERE a.Final_Grade IS NOT NULL
                    AND a.Status = 'Approved'
                    AND a.Registration_Date IS NOT NULL
            )
            SELECT 
                Period,
                COUNT(DISTINCT University_ID) AS StudentCount,
                COUNT(DISTINCT Course_ID) AS CourseCount,
                AVG(CourseGPA) AS AverageGPA,
                MIN(CourseGPA) AS MinGPA,
                MAX(CourseGPA) AS MaxGPA
            FROM CourseGPAs
            WHERE CourseGPA IS NOT NULL
            GROUP BY Period
            ORDER BY Period;
        END
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TOP STUDENTS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTopStudents]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTopStudents]
GO

CREATE PROCEDURE [dbo].[GetTopStudents]
    @TopN INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        WITH CourseGPAs AS (
            SELECT 
                s.University_ID,
                u.First_Name,
                u.Last_Name,
                s.Major,
                a.Course_ID,
                c.Credit,
                -- Calculate GPA: 10% quiz + 20% assignment + 20% midterm + 50% final
                CASE 
                    WHEN a.Final_Grade IS NOT NULL THEN
                        (ISNULL(a.Final_Grade, 0) * 0.5 + 
                         ISNULL(a.Midterm_Grade, 0) * 0.2 + 
                         ISNULL(a.Assignment_Grade, 0) * 0.2 + 
                         ISNULL(a.Quiz_Grade, 0) * 0.1) /
                        (0.5 + 
                         CASE WHEN a.Midterm_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                         CASE WHEN a.Assignment_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                         CASE WHEN a.Quiz_Grade IS NOT NULL THEN 0.1 ELSE 0 END)
                    ELSE NULL
                END AS CourseGPA
            FROM [Assessment] a
            INNER JOIN [Student] s ON a.University_ID = s.University_ID
            INNER JOIN [Users] u ON s.University_ID = u.University_ID
            INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
            WHERE a.Final_Grade IS NOT NULL
                AND a.Status = 'Approved'
        ),
        StudentGPAs AS (
            SELECT 
                University_ID,
                First_Name,
                Last_Name,
                Major,
                SUM(CourseGPA * Credit) / NULLIF(SUM(Credit), 0) AS CumulativeGPA,
                COUNT(DISTINCT Course_ID) AS CourseCount,
                SUM(Credit) AS TotalCredits
            FROM CourseGPAs
            WHERE CourseGPA IS NOT NULL
            GROUP BY University_ID, First_Name, Last_Name, Major
        )
        SELECT TOP (@TopN)
            University_ID,
            First_Name,
            Last_Name,
            Major,
            CumulativeGPA,
            CourseCount,
            TotalCredits
        FROM StudentGPAs
        ORDER BY CumulativeGPA DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TOP TUTORS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTopTutors]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTopTutors]
GO

CREATE PROCEDURE [dbo].[GetTopTutors]
    @TopN INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        WITH TutorStats AS (
            SELECT 
                t.University_ID,
                u.First_Name,
                u.Last_Name,
                t.Department_Name,
                t.Academic_Rank,
                COUNT(DISTINCT te.Section_ID + '-' + te.Course_ID + '-' + te.Semester) AS SectionCount,
                COUNT(DISTINCT a.University_ID) AS StudentCount,
                AVG(CASE 
                    WHEN a.Final_Grade IS NOT NULL THEN
                        (ISNULL(a.Final_Grade, 0) * 0.5 + 
                         ISNULL(a.Midterm_Grade, 0) * 0.2 + 
                         ISNULL(a.Assignment_Grade, 0) * 0.2 + 
                         ISNULL(a.Quiz_Grade, 0) * 0.1) /
                        (0.5 + 
                         CASE WHEN a.Midterm_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                         CASE WHEN a.Assignment_Grade IS NOT NULL THEN 0.2 ELSE 0 END +
                         CASE WHEN a.Quiz_Grade IS NOT NULL THEN 0.1 ELSE 0 END)
                    ELSE NULL
                END) AS AverageStudentGPA
            FROM [Tutor] t
            INNER JOIN [Users] u ON t.University_ID = u.University_ID
            LEFT JOIN [Teaches] te ON t.University_ID = te.University_ID
            LEFT JOIN [Assessment] a ON te.Section_ID = a.Section_ID 
                AND te.Course_ID = a.Course_ID 
                AND te.Semester = a.Semester
                AND a.Status = 'Approved'
            GROUP BY t.University_ID, u.First_Name, u.Last_Name, t.Department_Name, t.Academic_Rank
        )
        SELECT TOP (@TopN)
            University_ID,
            First_Name,
            Last_Name,
            Department_Name,
            Academic_Rank,
            SectionCount,
            StudentCount,
            AverageStudentGPA
        FROM TutorStats
        WHERE SectionCount > 0
        ORDER BY StudentCount DESC, AverageStudentGPA DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

