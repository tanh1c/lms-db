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
        -- Format: "Building_Name - Room_Name" (e.g., "A1 - 101")
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

-- ==================== ROOM MANAGEMENT PROCEDURES ====================

-- ==================== CREATE ROOM ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateRoom]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateRoom]
GO

CREATE PROCEDURE [dbo].[CreateRoom]
    @Building_Name NVARCHAR(10),
    @Room_Name NVARCHAR(10),
    @Capacity INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if building exists
    IF NOT EXISTS (SELECT 1 FROM [Building] WHERE Building_Name = @Building_Name)
    BEGIN
        RAISERROR('Building does not exist', 16, 1)
        RETURN
    END
    
    -- Check if room already exists
    IF EXISTS (SELECT 1 FROM [Room] WHERE Room_Name = @Room_Name AND Building_Name = @Building_Name)
    BEGIN
        RAISERROR('Room already exists', 16, 1)
        RETURN
    END
    
    -- Insert into Room table
    INSERT INTO [Room] (Building_Name, Room_Name, Capacity)
    VALUES (@Building_Name, @Room_Name, ISNULL(@Capacity, 30))
    
    -- Return the created room with Room_ID calculated consistently
    SELECT 
        (SELECT COUNT(*) FROM [Room] r2 
         WHERE (r2.Building_Name < @Building_Name) 
            OR (r2.Building_Name = @Building_Name AND r2.Room_Name <= @Room_Name)) AS Room_ID,
        @Building_Name AS Building_Name,
        @Room_Name AS Room_Name,
        ISNULL(@Capacity, 30) AS Capacity
END
GO

-- ==================== GET ALL ROOMS WITH BUILDING INFO ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllRooms]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllRooms]
GO

CREATE PROCEDURE [dbo].[GetAllRooms]
    @Building_Name NVARCHAR(10) = NULL,
    @SearchQuery NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get rooms directly from Room table (which has Building_Name, Room_Name, Capacity)
    SELECT 
        ROW_NUMBER() OVER (ORDER BY r.Building_Name, r.Room_Name) AS Room_ID,
        r.Building_Name,
        r.Room_Name,
        r.Capacity,
        (SELECT COUNT(*) 
         FROM [takes_place] tp 
         WHERE tp.Room_Name = r.Room_Name AND tp.Building_Name = r.Building_Name) as UsageCount
    FROM [Room] r
    WHERE (@Building_Name IS NULL OR r.Building_Name = @Building_Name)
        AND (@SearchQuery IS NULL OR 
             r.Building_Name LIKE '%' + @SearchQuery + '%' OR
             r.Room_Name LIKE '%' + @SearchQuery + '%' OR
             CAST(r.Building_Name + r.Room_Name AS NVARCHAR(20)) LIKE '%' + @SearchQuery + '%')
    ORDER BY r.Building_Name, r.Room_Name;
END
GO

-- ==================== GET ROOMS BY SECTION ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetRoomsBySection]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetRoomsBySection]
GO

CREATE PROCEDURE [dbo].[GetRoomsBySection]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ROW_NUMBER() OVER (ORDER BY tp.Building_Name, tp.Room_Name) AS Room_ID,
        tp.Building_Name,
        tp.Room_Name,
        r.Capacity
    FROM [takes_place] tp
    INNER JOIN [Room] r ON tp.Room_Name = r.Room_Name AND tp.Building_Name = r.Building_Name
    WHERE tp.Section_ID = @Section_ID
        AND tp.Course_ID = @Course_ID
        AND tp.Semester = @Semester
    ORDER BY tp.Building_Name, tp.Room_Name;
END
GO

-- ==================== ASSIGN ROOM TO SECTION ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AssignRoomToSection]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[AssignRoomToSection]
GO

CREATE PROCEDURE [dbo].[AssignRoomToSection]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Building_Name NVARCHAR(10),
    @Room_Name NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if section exists
    IF NOT EXISTS (SELECT 1 FROM [Section] WHERE Section_ID = @Section_ID AND Course_ID = @Course_ID AND Semester = @Semester)
    BEGIN
        RAISERROR('Section does not exist', 16, 1)
        RETURN
    END
    
    -- Check if room exists
    IF NOT EXISTS (SELECT 1 FROM [Room] WHERE Room_Name = @Room_Name AND Building_Name = @Building_Name)
    BEGIN
        RAISERROR('Room does not exist', 16, 1)
        RETURN
    END
    
    -- Check if assignment already exists
    IF EXISTS (SELECT 1 FROM [takes_place] 
               WHERE Section_ID = @Section_ID 
                 AND Course_ID = @Course_ID 
                 AND Semester = @Semester
                 AND Room_Name = @Room_Name 
                 AND Building_Name = @Building_Name)
    BEGIN
        RAISERROR('Room is already assigned to this section', 16, 1)
        RETURN
    END
    
    -- Insert the assignment
    INSERT INTO [takes_place] (Section_ID, Course_ID, Semester, Building_Name, Room_Name)
    VALUES (@Section_ID, @Course_ID, @Semester, @Building_Name, @Room_Name)
    
    SELECT 'Room assigned successfully' as Message
END
GO

-- ==================== REMOVE ROOM FROM SECTION ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RemoveRoomFromSection]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[RemoveRoomFromSection]
GO

CREATE PROCEDURE [dbo].[RemoveRoomFromSection]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Building_Name NVARCHAR(10),
    @Room_Name NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM [takes_place]
    WHERE Section_ID = @Section_ID
        AND Course_ID = @Course_ID
        AND Semester = @Semester
        AND Room_Name = @Room_Name
        AND Building_Name = @Building_Name
    
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Room assignment not found', 16, 1)
        RETURN
    END
    
    SELECT 'Room removed successfully' as Message
END
GO

-- ==================== UPDATE ROOM ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateRoom]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateRoom]
GO

CREATE PROCEDURE [dbo].[UpdateRoom]
    @Building_Name NVARCHAR(10),
    @Room_Name NVARCHAR(10),
    @New_Building_Name NVARCHAR(10) = NULL,
    @New_Room_Name NVARCHAR(10) = NULL,
    @Capacity INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if room exists
    IF NOT EXISTS (SELECT 1 FROM [Room] WHERE Room_Name = @Room_Name AND Building_Name = @Building_Name)
    BEGIN
        RAISERROR('Room does not exist', 16, 1)
        RETURN
    END
    
    -- If changing building or room name, check if new room exists
    IF (@New_Building_Name IS NOT NULL AND @New_Building_Name != @Building_Name) OR
       (@New_Room_Name IS NOT NULL AND @New_Room_Name != @Room_Name)
    BEGIN
        DECLARE @Final_Building_Name NVARCHAR(10) = ISNULL(@New_Building_Name, @Building_Name)
        DECLARE @Final_Room_Name NVARCHAR(10) = ISNULL(@New_Room_Name, @Room_Name)
        
        -- Check if new building exists
        IF NOT EXISTS (SELECT 1 FROM [Building] WHERE Building_Name = @Final_Building_Name)
        BEGIN
            RAISERROR('New building does not exist', 16, 1)
            RETURN
        END
        
        -- Check if room with same name exists in new building
        IF EXISTS (SELECT 1 FROM [Room] WHERE Room_Name = @Final_Room_Name AND Building_Name = @Final_Building_Name 
                   AND NOT (Room_Name = @Room_Name AND Building_Name = @Building_Name))
        BEGIN
            RAISERROR('Room with this name already exists in the building', 16, 1)
            RETURN
        END
        
        -- Update takes_place references first
        UPDATE [takes_place]
        SET Building_Name = @Final_Building_Name,
            Room_Name = @Final_Room_Name
        WHERE Room_Name = @Room_Name AND Building_Name = @Building_Name
        
        -- Update room
        UPDATE [Room]
        SET Building_Name = @Final_Building_Name,
            Room_Name = @Final_Room_Name
        WHERE Room_Name = @Room_Name AND Building_Name = @Building_Name
        
        SET @Building_Name = @Final_Building_Name
        SET @Room_Name = @Final_Room_Name
    END
    
    -- Update capacity if provided
    IF @Capacity IS NOT NULL
    BEGIN
        UPDATE [Room]
        SET Capacity = @Capacity
        WHERE Room_Name = @Room_Name AND Building_Name = @Building_Name
    END
    
    SELECT 'Room updated successfully' as Message
END
GO

-- ==================== DELETE ROOM ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteRoom]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteRoom]
GO

CREATE PROCEDURE [dbo].[DeleteRoom]
    @Building_Name NVARCHAR(10),
    @Room_Name NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if room exists
    IF NOT EXISTS (SELECT 1 FROM [Room] WHERE Room_Name = @Room_Name AND Building_Name = @Building_Name)
    BEGIN
        RAISERROR('Room does not exist', 16, 1)
        RETURN
    END
    
    -- Check if room is in use
    IF EXISTS (SELECT 1 FROM [takes_place] WHERE Room_Name = @Room_Name AND Building_Name = @Building_Name)
    BEGIN
        RAISERROR('Cannot delete room that is assigned to sections', 16, 1)
        RETURN
    END
    
    -- Delete room equipment first (if exists)
    DELETE FROM [Room_Equipment]
    WHERE Building_Name = @Building_Name AND Room_Name = @Room_Name
    
    -- Delete room
    DELETE FROM [Room]
    WHERE Room_Name = @Room_Name AND Building_Name = @Building_Name
    
    SELECT 'Room deleted successfully' as Message
END
GO

-- ==================== GET ROOM EQUIPMENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetRoomEquipment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetRoomEquipment]
GO

CREATE PROCEDURE [dbo].[GetRoomEquipment]
    @Building_Name NVARCHAR(10),
    @Room_Name NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Equipment_Name,
        Building_Name,
        Room_Name
    FROM [Room_Equipment]
    WHERE Building_Name = @Building_Name
        AND Room_Name = @Room_Name
    ORDER BY Equipment_Name;
END
GO

-- ==================== GET ALL ROOMS WITH EQUIPMENT COUNT ====================
-- Update GetAllRooms to include equipment count
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllRooms]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllRooms]
GO

CREATE PROCEDURE [dbo].[GetAllRooms]
    @Building_Name NVARCHAR(10) = NULL,
    @SearchQuery NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get rooms directly from Room table (which has Building_Name, Room_Name, Capacity)
    SELECT 
        ROW_NUMBER() OVER (ORDER BY r.Building_Name, r.Room_Name) AS Room_ID,
        r.Building_Name,
        r.Room_Name,
        r.Capacity,
        (SELECT COUNT(*) 
         FROM [takes_place] tp 
         WHERE tp.Room_Name = r.Room_Name AND tp.Building_Name = r.Building_Name) as UsageCount,
        (SELECT COUNT(*) 
         FROM [Room_Equipment] re 
         WHERE re.Room_Name = r.Room_Name AND re.Building_Name = r.Building_Name) as EquipmentCount
    FROM [Room] r
    WHERE (@Building_Name IS NULL OR r.Building_Name = @Building_Name)
        AND (@SearchQuery IS NULL OR 
             r.Building_Name LIKE '%' + @SearchQuery + '%' OR
             r.Room_Name LIKE '%' + @SearchQuery + '%' OR
             CAST(r.Building_Name + r.Room_Name AS NVARCHAR(20)) LIKE '%' + @SearchQuery + '%')
    ORDER BY r.Building_Name, r.Room_Name;
END
GO

