-- ==================== ADVANCED COURSE MANAGEMENT PROCEDURES ====================
-- Description: Advanced procedures for course management including search, filter, statistics, and related data

USE [lms_system];
GO

-- ==================== SEARCH COURSES WITH FILTERS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SearchCourses]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[SearchCourses]
GO

CREATE PROCEDURE [dbo].[SearchCourses]
    @SearchQuery NVARCHAR(100) = NULL,
    @MinCredit INT = NULL,
    @MaxCredit INT = NULL,
    @StartDateFrom DATE = NULL,
    @StartDateTo DATE = NULL,
    @HasSections BIT = NULL,
    @HasStudents BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT
        c.Course_ID,
        c.Name,
        c.Credit,
        c.Start_Date,
        (SELECT COUNT(*) FROM [Section] s WHERE s.Course_ID = c.Course_ID) as SectionCount,
        (SELECT COUNT(DISTINCT a.University_ID) 
         FROM [Assessment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = c.Course_ID) as StudentCount,
        (SELECT COUNT(*) 
         FROM [Teaches] t 
         INNER JOIN [Section] s ON t.Section_ID = s.Section_ID AND t.Course_ID = s.Course_ID AND t.Semester = s.Semester
         WHERE s.Course_ID = c.Course_ID) as TutorCount
    FROM [Course] c
    WHERE 
        (@SearchQuery IS NULL OR 
         c.Course_ID LIKE '%' + @SearchQuery + '%' OR 
         c.Name LIKE '%' + @SearchQuery + '%')
        AND (@MinCredit IS NULL OR c.Credit >= @MinCredit)
        AND (@MaxCredit IS NULL OR c.Credit <= @MaxCredit)
        AND (@StartDateFrom IS NULL OR c.Start_Date >= @StartDateFrom)
        AND (@StartDateTo IS NULL OR c.Start_Date <= @StartDateTo)
        AND (@HasSections IS NULL OR 
             (@HasSections = 1 AND EXISTS (SELECT 1 FROM [Section] s WHERE s.Course_ID = c.Course_ID)) OR
             (@HasSections = 0 AND NOT EXISTS (SELECT 1 FROM [Section] s WHERE s.Course_ID = c.Course_ID)))
        AND (@HasStudents IS NULL OR 
             (@HasStudents = 1 AND EXISTS (
                 SELECT 1 FROM [Assessment] a 
                 INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
                 WHERE s.Course_ID = c.Course_ID)) OR
             (@HasStudents = 0 AND NOT EXISTS (
                 SELECT 1 FROM [Assessment] a 
                 INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
                 WHERE s.Course_ID = c.Course_ID)))
    ORDER BY c.Course_ID;
END
GO

-- ==================== GET COURSE DETAILS WITH STATISTICS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseDetails]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseDetails]
GO

CREATE PROCEDURE [dbo].[GetCourseDetails]
    @Course_ID NVARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.Course_ID,
        c.Name,
        c.Credit,
        c.Start_Date,
        (SELECT COUNT(*) FROM [Section] s WHERE s.Course_ID = c.Course_ID) as TotalSections,
        (SELECT COUNT(DISTINCT a.University_ID) 
         FROM [Assessment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = c.Course_ID) as TotalStudents,
        (SELECT COUNT(DISTINCT t.University_ID) 
         FROM [Teaches] t 
         INNER JOIN [Section] s ON t.Section_ID = s.Section_ID AND t.Course_ID = s.Course_ID AND t.Semester = s.Semester
         WHERE s.Course_ID = c.Course_ID) as TotalTutors,
        (SELECT COUNT(*) 
         FROM [Assignment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = c.Course_ID) as TotalAssignments,
        (SELECT COUNT(*) 
         FROM [Quiz] q 
         INNER JOIN [Section] s ON q.Section_ID = s.Section_ID AND q.Course_ID = s.Course_ID AND q.Semester = s.Semester
         WHERE s.Course_ID = c.Course_ID) as TotalQuizzes,
        (SELECT AVG(a.Final_Grade) 
         FROM [Assessment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = c.Course_ID AND a.Final_Grade IS NOT NULL) as AverageFinalGrade
    FROM [Course] c
    WHERE c.Course_ID = @Course_ID;
END
GO

-- ==================== GET COURSE SECTIONS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseSections]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseSections]
GO

CREATE PROCEDURE [dbo].[GetCourseSections]
    @Course_ID NVARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.Section_ID,
        s.Course_ID,
        s.Semester,
        (SELECT COUNT(DISTINCT a.University_ID) 
         FROM [Assessment] a 
         WHERE a.Section_ID = s.Section_ID 
           AND a.Course_ID = s.Course_ID 
           AND a.Semester = s.Semester 
           AND UPPER(LTRIM(RTRIM(a.Status))) = 'APPROVED') as StudentCount,
        (SELECT COUNT(DISTINCT t.University_ID) 
         FROM [Teaches] t 
         WHERE t.Section_ID = s.Section_ID AND t.Course_ID = s.Course_ID AND t.Semester = s.Semester) as TutorCount,
        (SELECT STRING_AGG(CONCAT(u.First_Name, ' ', u.Last_Name), ', ') 
         FROM [Teaches] t 
         INNER JOIN [Users] u ON t.University_ID = u.University_ID
         WHERE t.Section_ID = s.Section_ID AND t.Course_ID = s.Course_ID AND t.Semester = s.Semester) as TutorNames,
        (SELECT COUNT(*) 
         FROM [takes_place] tp 
         WHERE tp.Section_ID = s.Section_ID AND tp.Course_ID = s.Course_ID AND tp.Semester = s.Semester) as RoomCount,
        -- Room and Building information as comma-separated strings
        -- Format: "Building_Name - Room_Name" (e.g., "A1 - Room 101")
        (SELECT STRING_AGG(CONCAT(tp.Building_Name, ' - ', tp.Room_Name), ', ')
         FROM [takes_place] tp
         WHERE tp.Section_ID = s.Section_ID AND tp.Course_ID = s.Course_ID AND tp.Semester = s.Semester) as RoomsInfo
    FROM [Section] s
    WHERE s.Course_ID = @Course_ID
    ORDER BY s.Semester, s.Section_ID;
END
GO

-- ==================== GET COURSE STUDENTS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseStudents]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseStudents]
GO

CREATE PROCEDURE [dbo].[GetCourseStudents]
    @Course_ID NVARCHAR(15),
    @Section_ID NVARCHAR(10) = NULL,
    @Semester NVARCHAR(10) = NULL,
    @Status NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT
        a.University_ID,
        u.First_Name,
        u.Last_Name,
        u.Email,
        s.Major,
        s.Current_degree,
        a.Section_ID,
        a.Semester,
        a.Assessment_ID,
        a.Registration_Date,
        a.Potential_Withdrawal_Date,
        a.Status,
        a.Final_Grade,
        a.Midterm_Grade,
        a.Quiz_Grade,
        a.Assignment_Grade
    FROM [Assessment] a
    INNER JOIN [Section] sec ON a.Section_ID = sec.Section_ID AND a.Course_ID = sec.Course_ID AND a.Semester = sec.Semester
    INNER JOIN [Student] s ON a.University_ID = s.University_ID
    INNER JOIN [Users] u ON a.University_ID = u.University_ID
    WHERE sec.Course_ID = @Course_ID
        AND (@Section_ID IS NULL OR a.Section_ID = @Section_ID)
        AND (@Semester IS NULL OR a.Semester = @Semester)
        AND (@Status IS NULL OR a.Status = @Status)
    ORDER BY u.Last_Name, u.First_Name;
END
GO

-- ==================== GET COURSE TUTORS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseTutors]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseTutors]
GO

CREATE PROCEDURE [dbo].[GetCourseTutors]
    @Course_ID NVARCHAR(15),
    @Section_ID NVARCHAR(10) = NULL,
    @Semester NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT
        t.University_ID,
        u.First_Name,
        u.Last_Name,
        u.Email,
        tut.Name as TutorName,
        tut.Academic_Rank,
        tut.Department_Name,
        t.Section_ID,
        t.Semester,
        t.Role_Specification,
        t.Timestamp,
        (SELECT COUNT(DISTINCT a.University_ID) 
         FROM [Assessment] a 
         WHERE a.Section_ID = t.Section_ID AND a.Course_ID = t.Course_ID AND a.Semester = t.Semester) as StudentCount
    FROM [Teaches] t
    INNER JOIN [Section] s ON t.Section_ID = s.Section_ID AND t.Course_ID = s.Course_ID AND t.Semester = s.Semester
    INNER JOIN [Tutor] tut ON t.University_ID = tut.University_ID
    INNER JOIN [Users] u ON t.University_ID = u.University_ID
    WHERE s.Course_ID = @Course_ID
        AND (@Section_ID IS NULL OR t.Section_ID = @Section_ID)
        AND (@Semester IS NULL OR t.Semester = @Semester)
    ORDER BY u.Last_Name, u.First_Name;
END
GO

-- ==================== GET COURSE STATISTICS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseStatistics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseStatistics]
GO

CREATE PROCEDURE [dbo].[GetCourseStatistics]
    @Course_ID NVARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        -- Enrollment Statistics
        (SELECT COUNT(DISTINCT a.University_ID) 
         FROM [Assessment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = @Course_ID) as TotalEnrolledStudents,
        
        (SELECT COUNT(DISTINCT a.University_ID) 
         FROM [Assessment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = @Course_ID AND a.Status = 'Approved') as ApprovedStudents,
        
        (SELECT COUNT(DISTINCT a.University_ID) 
         FROM [Assessment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = @Course_ID AND a.Status = 'Pending') as PendingStudents,
        
        -- Grade Statistics
        (SELECT AVG(a.Final_Grade) 
         FROM [Assessment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = @Course_ID AND a.Final_Grade IS NOT NULL) as AverageFinalGrade,
        
        (SELECT MIN(a.Final_Grade) 
         FROM [Assessment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = @Course_ID AND a.Final_Grade IS NOT NULL) as MinFinalGrade,
        
        (SELECT MAX(a.Final_Grade) 
         FROM [Assessment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = @Course_ID AND a.Final_Grade IS NOT NULL) as MaxFinalGrade,
        
        -- Activity Statistics
        (SELECT COUNT(*) 
         FROM [Assignment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = @Course_ID) as TotalAssignments,
        
        (SELECT COUNT(*) 
         FROM [Quiz] q 
         INNER JOIN [Section] s ON q.Section_ID = s.Section_ID AND q.Course_ID = s.Course_ID AND q.Semester = s.Semester
         WHERE s.Course_ID = @Course_ID) as TotalQuizzes,
        
        (SELECT COUNT(*) 
         FROM [Submission] sub 
         INNER JOIN [Section] s ON sub.Section_ID = s.Section_ID AND sub.Course_ID = s.Course_ID AND sub.Semester = s.Semester
         WHERE s.Course_ID = @Course_ID) as TotalSubmissions,
        
        -- Section Statistics
        (SELECT COUNT(*) FROM [Section] s WHERE s.Course_ID = @Course_ID) as TotalSections,
        
        (SELECT COUNT(DISTINCT t.University_ID) 
         FROM [Teaches] t 
         INNER JOIN [Section] s ON t.Section_ID = s.Section_ID AND t.Course_ID = s.Course_ID AND t.Semester = s.Semester
         WHERE s.Course_ID = @Course_ID) as TotalTutors;
END
GO

-- ==================== GET COURSES BY SEMESTER ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCoursesBySemester]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCoursesBySemester]
GO

CREATE PROCEDURE [dbo].[GetCoursesBySemester]
    @Semester NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT
        c.Course_ID,
        c.Name,
        c.Credit,
        c.Start_Date,
        (SELECT COUNT(*) FROM [Section] s WHERE s.Course_ID = c.Course_ID AND s.Semester = @Semester) as SectionCount,
        (SELECT COUNT(DISTINCT a.University_ID) 
         FROM [Assessment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
         WHERE s.Course_ID = c.Course_ID AND s.Semester = @Semester) as StudentCount
    FROM [Course] c
    INNER JOIN [Section] s ON c.Course_ID = s.Course_ID
    WHERE s.Semester = @Semester
    ORDER BY c.Course_ID;
END
GO

-- ==================== GET COURSE ENROLLMENT TREND ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetCourseEnrollmentTrend]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetCourseEnrollmentTrend]
GO

CREATE PROCEDURE [dbo].[GetCourseEnrollmentTrend]
    @Course_ID NVARCHAR(15),
    @StartSemester NVARCHAR(10) = NULL,
    @EndSemester NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.Semester,
        COUNT(DISTINCT a.University_ID) as EnrolledStudents,
        COUNT(DISTINCT s.Section_ID) as SectionCount,
        AVG(a.Final_Grade) as AverageGrade
    FROM [Section] s
    LEFT JOIN [Assessment] a ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
    WHERE s.Course_ID = @Course_ID
        AND (@StartSemester IS NULL OR s.Semester >= @StartSemester)
        AND (@EndSemester IS NULL OR s.Semester <= @EndSemester)
    GROUP BY s.Semester
    ORDER BY s.Semester;
END
GO

