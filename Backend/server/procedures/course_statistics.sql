-- ==================== COURSE STATISTICS PROCEDURES ====================
-- Description: Stored procedures for course statistics and analytics
-- Separate from user management procedures to avoid conflicts

USE [lms_system];
GO

-- ==================== GET COURSE ENROLLMENT BY COURSE ====================
-- Description: Get enrollment statistics (student count, section count, tutor count) for each course
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseEnrollmentByCourse]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseEnrollmentByCourse]
GO

CREATE PROCEDURE [dbo].[GetCourseEnrollmentByCourse]
    @TopN INT = NULL  -- Optional: limit to top N courses
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            c.Course_ID,
            c.Name AS Course_Name,
            c.Credit,
            ISNULL(COUNT(DISTINCT s.Section_ID), 0) AS SectionCount,
            ISNULL(COUNT(DISTINCT a.University_ID), 0) AS StudentCount,
            ISNULL(COUNT(DISTINCT t.University_ID), 0) AS TutorCount,
            AVG(CASE WHEN a.Final_Grade IS NOT NULL THEN a.Final_Grade END) AS AverageGrade,
            COUNT(DISTINCT CASE WHEN a.Status = 'Approved' THEN a.University_ID END) AS ApprovedStudents,
            COUNT(DISTINCT CASE WHEN a.Status = 'Pending' THEN a.University_ID END) AS PendingStudents
        FROM [Course] c
        LEFT JOIN [Section] s ON c.Course_ID = s.Course_ID
        LEFT JOIN [Assessment] a ON s.Section_ID = a.Section_ID 
            AND s.Course_ID = a.Course_ID 
            AND s.Semester = a.Semester
        LEFT JOIN [Teaches] te ON s.Section_ID = te.Section_ID 
            AND s.Course_ID = te.Course_ID 
            AND s.Semester = te.Semester
        LEFT JOIN [Tutor] t ON te.University_ID = t.University_ID
        GROUP BY c.Course_ID, c.Name, c.Credit
        ORDER BY COUNT(DISTINCT a.University_ID) DESC, c.Course_ID
        OFFSET 0 ROWS
        FETCH NEXT CASE WHEN @TopN IS NOT NULL THEN @TopN ELSE 999999 END ROWS ONLY;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET COURSE DISTRIBUTION BY CREDIT ====================
-- Description: Get distribution of courses by credit value
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseDistributionByCredit]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseDistributionByCredit]
GO

CREATE PROCEDURE [dbo].[GetCourseDistributionByCredit]
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            ISNULL(c.Credit, 0) AS Credit,
            COUNT(DISTINCT c.Course_ID) AS CourseCount,
            COUNT(DISTINCT a.University_ID) AS TotalStudents
        FROM [Course] c
        LEFT JOIN [Section] s ON c.Course_ID = s.Course_ID
        LEFT JOIN [Assessment] a ON s.Section_ID = a.Section_ID 
            AND s.Course_ID = a.Course_ID 
            AND s.Semester = a.Semester
        GROUP BY c.Credit
        ORDER BY c.Credit;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET TOP COURSES BY ENROLLMENT ====================
-- Description: Get top courses by student enrollment
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetTopCoursesByEnrollment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetTopCoursesByEnrollment]
GO

CREATE PROCEDURE [dbo].[GetTopCoursesByEnrollment]
    @TopN INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT TOP (@TopN)
            c.Course_ID,
            c.Name AS Course_Name,
            c.Credit,
            COUNT(DISTINCT a.University_ID) AS StudentCount,
            COUNT(DISTINCT s.Section_ID) AS SectionCount,
            COUNT(DISTINCT t.University_ID) AS TutorCount,
            AVG(CASE WHEN a.Final_Grade IS NOT NULL THEN a.Final_Grade END) AS AverageGrade,
            MIN(a.Final_Grade) AS MinGrade,
            MAX(a.Final_Grade) AS MaxGrade
        FROM [Course] c
        LEFT JOIN [Section] s ON c.Course_ID = s.Course_ID
        LEFT JOIN [Assessment] a ON s.Section_ID = a.Section_ID 
            AND s.Course_ID = a.Course_ID 
            AND s.Semester = a.Semester
        LEFT JOIN [Teaches] te ON s.Section_ID = te.Section_ID 
            AND s.Course_ID = te.Course_ID 
            AND s.Semester = te.Semester
        LEFT JOIN [Tutor] t ON te.University_ID = t.University_ID
        GROUP BY c.Course_ID, c.Name, c.Credit
        ORDER BY COUNT(DISTINCT a.University_ID) DESC, c.Course_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET COURSE AVERAGE GRADE BY COURSE ====================
-- Description: Get average grade statistics for each course
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseAverageGradeByCourse]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseAverageGradeByCourse]
GO

CREATE PROCEDURE [dbo].[GetCourseAverageGradeByCourse]
    @MinEnrollment INT = 1  -- Only include courses with at least this many students
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        WITH CourseGrades AS (
            SELECT 
                c.Course_ID,
                c.Name AS Course_Name,
                c.Credit,
                COUNT(DISTINCT a.University_ID) AS StudentCount,
                -- Calculate weighted GPA: 10% quiz + 20% assignment + 20% midterm + 50% final
                AVG(
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
                    END
                ) AS AverageGPA,
                AVG(a.Final_Grade) AS AverageFinalGrade,
                MIN(a.Final_Grade) AS MinFinalGrade,
                MAX(a.Final_Grade) AS MaxFinalGrade,
                STDEV(a.Final_Grade) AS StdDevFinalGrade
            FROM [Course] c
            LEFT JOIN [Section] s ON c.Course_ID = s.Course_ID
            LEFT JOIN [Assessment] a ON s.Section_ID = a.Section_ID 
                AND s.Course_ID = a.Course_ID 
                AND s.Semester = a.Semester
                AND a.Status = 'Approved'
            GROUP BY c.Course_ID, c.Name, c.Credit
            HAVING COUNT(DISTINCT a.University_ID) >= @MinEnrollment
        )
        SELECT 
            Course_ID,
            Course_Name,
            Credit,
            StudentCount,
            AverageGPA,
            AverageFinalGrade,
            MinFinalGrade,
            MaxFinalGrade,
            StdDevFinalGrade
        FROM CourseGrades
        ORDER BY AverageGPA DESC, StudentCount DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET COURSE ENROLLMENT TREND OVER TIME ====================
-- Description: Get enrollment trend by semester or month
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseEnrollmentTrendOverTime]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseEnrollmentTrendOverTime]
GO

CREATE PROCEDURE [dbo].[GetCourseEnrollmentTrendOverTime]
    @GroupBy NVARCHAR(20) = 'Semester'  -- 'Semester' or 'Month'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        IF @GroupBy = 'Semester'
        BEGIN
            SELECT 
                s.Semester AS Period,
                COUNT(DISTINCT s.Course_ID) AS CourseCount,
                COUNT(DISTINCT s.Section_ID) AS SectionCount,
                COUNT(DISTINCT a.University_ID) AS StudentCount,
                COUNT(DISTINCT t.University_ID) AS TutorCount,
                AVG(CASE WHEN a.Final_Grade IS NOT NULL THEN a.Final_Grade END) AS AverageGrade
            FROM [Section] s
            LEFT JOIN [Assessment] a ON s.Section_ID = a.Section_ID 
                AND s.Course_ID = a.Course_ID 
                AND s.Semester = a.Semester
            LEFT JOIN [Teaches] te ON s.Section_ID = te.Section_ID 
                AND s.Course_ID = te.Course_ID 
                AND s.Semester = te.Semester
            LEFT JOIN [Tutor] t ON te.University_ID = t.University_ID
            GROUP BY s.Semester
            ORDER BY s.Semester;
        END
        ELSE
        BEGIN
            SELECT 
                FORMAT(a.Registration_Date, 'yyyy-MM') AS Period,
                COUNT(DISTINCT s.Course_ID) AS CourseCount,
                COUNT(DISTINCT s.Section_ID) AS SectionCount,
                COUNT(DISTINCT a.University_ID) AS StudentCount,
                COUNT(DISTINCT t.University_ID) AS TutorCount,
                AVG(CASE WHEN a.Final_Grade IS NOT NULL THEN a.Final_Grade END) AS AverageGrade
            FROM [Assessment] a
            INNER JOIN [Section] s ON a.Section_ID = s.Section_ID 
                AND a.Course_ID = s.Course_ID 
                AND a.Semester = s.Semester
            LEFT JOIN [Teaches] te ON s.Section_ID = te.Section_ID 
                AND s.Course_ID = te.Course_ID 
                AND s.Semester = te.Semester
            LEFT JOIN [Tutor] t ON te.University_ID = t.University_ID
            WHERE a.Registration_Date IS NOT NULL
            GROUP BY FORMAT(a.Registration_Date, 'yyyy-MM')
            ORDER BY FORMAT(a.Registration_Date, 'yyyy-MM');
        END
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET COURSE STATUS DISTRIBUTION ====================
-- Description: Get distribution of enrollment statuses across all courses
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseStatusDistribution]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseStatusDistribution]
GO

CREATE PROCEDURE [dbo].[GetCourseStatusDistribution]
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            ISNULL(a.Status, 'No Enrollment') AS Status,
            COUNT(DISTINCT a.University_ID) AS StudentCount,
            COUNT(DISTINCT s.Course_ID) AS CourseCount,
            COUNT(DISTINCT s.Section_ID) AS SectionCount
        FROM [Section] s
        LEFT JOIN [Assessment] a ON s.Section_ID = a.Section_ID 
            AND s.Course_ID = a.Course_ID 
            AND s.Semester = a.Semester
        GROUP BY a.Status
        ORDER BY COUNT(DISTINCT a.University_ID) DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET COURSE ACTIVITY STATISTICS ====================
-- Description: Get activity statistics (assignments, quizzes, submissions) by course
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseActivityStatistics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseActivityStatistics]
GO

CREATE PROCEDURE [dbo].[GetCourseActivityStatistics]
    @TopN INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            c.Course_ID,
            c.Name AS Course_Name,
            c.Credit,
            COUNT(DISTINCT s.Section_ID) AS SectionCount,
            COUNT(DISTINCT a.University_ID) AS StudentCount,
            COUNT(DISTINCT ad.AssignmentID) AS TotalAssignments,
            COUNT(DISTINCT qq.QuizID) AS TotalQuizzes,
            COUNT(DISTINCT asub.University_ID) AS TotalSubmissions,
            COUNT(DISTINCT CASE WHEN asub.status = 'Submitted' THEN asub.University_ID END) AS SubmittedCount,
            AVG(CASE WHEN a.Final_Grade IS NOT NULL THEN a.Final_Grade END) AS AverageGrade
        FROM [Course] c
        LEFT JOIN [Section] s ON c.Course_ID = s.Course_ID
        LEFT JOIN [Assessment] a ON s.Section_ID = a.Section_ID 
            AND s.Course_ID = a.Course_ID 
            AND s.Semester = a.Semester
        LEFT JOIN [Assignment_Definition] ad ON s.Course_ID = ad.Course_ID 
            AND s.Semester = ad.Semester
        LEFT JOIN [Quiz_Questions] qq ON s.Section_ID = qq.Section_ID 
            AND s.Course_ID = qq.Course_ID 
            AND s.Semester = qq.Semester
        LEFT JOIN [Assignment_Submission] asub ON ad.AssignmentID = asub.AssignmentID
        GROUP BY c.Course_ID, c.Name, c.Credit
        ORDER BY COUNT(DISTINCT a.University_ID) DESC, c.Course_ID
        OFFSET 0 ROWS
        FETCH NEXT CASE WHEN @TopN IS NOT NULL THEN @TopN ELSE 999999 END ROWS ONLY;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

