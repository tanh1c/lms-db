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
    @HasSections BIT = NULL,
    @HasStudents BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT
        c.Course_ID,
        c.Name,
        c.Credit,
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
         FROM [Assignment_Definition] ad 
         WHERE ad.Course_ID = c.Course_ID) as TotalAssignments,
        (SELECT COUNT(*) 
         FROM [Quiz_Questions] qq 
         INNER JOIN [Section] s ON qq.Section_ID = s.Section_ID AND qq.Course_ID = s.Course_ID AND qq.Semester = s.Semester
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
         FROM [Assignment_Definition] ad 
         WHERE ad.Course_ID = @Course_ID) as TotalAssignments,
        
        (SELECT COUNT(*) 
         FROM [Quiz_Questions] qq 
         INNER JOIN [Section] s ON qq.Section_ID = s.Section_ID AND qq.Course_ID = s.Course_ID AND qq.Semester = s.Semester
         WHERE s.Course_ID = @Course_ID) as TotalQuizzes,
        
        (SELECT COUNT(*) 
         FROM [Assignment_Submission] asub
         INNER JOIN [Assignment_Definition] ad ON asub.AssignmentID = ad.AssignmentID
         WHERE ad.Course_ID = @Course_ID) as TotalSubmissions,
        
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

-- ==================== GET ALL EQUIPMENT TYPES ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllEquipmentTypes]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllEquipmentTypes]
GO

CREATE PROCEDURE [dbo].[GetAllEquipmentTypes]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT Equipment_Name
    FROM [Room_Equipment]
    ORDER BY Equipment_Name;
END
GO

-- ==================== UPDATE ROOM EQUIPMENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateRoomEquipment]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateRoomEquipment]
GO

CREATE PROCEDURE [dbo].[UpdateRoomEquipment]
    @Building_Name NVARCHAR(10),
    @Room_Name NVARCHAR(10),
    @EquipmentList NVARCHAR(MAX) = NULL  -- JSON array string like '["Equipment1","Equipment2"]'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check if room exists
        IF NOT EXISTS (SELECT 1 FROM [Room] WHERE Room_Name = @Room_Name AND Building_Name = @Building_Name)
        BEGIN
            RAISERROR('Room does not exist', 16, 1)
            RETURN
        END
        
        -- Delete all existing equipment for this room
        DELETE FROM [Room_Equipment]
        WHERE Building_Name = @Building_Name AND Room_Name = @Room_Name
        
        -- Insert new equipment if provided
        IF @EquipmentList IS NOT NULL AND @EquipmentList != '' AND @EquipmentList != '[]'
        BEGIN
            -- Use OPENJSON if available (SQL Server 2016+), otherwise parse manually
            IF (SELECT CAST(SERVERPROPERTY('ProductMajorVersion') AS INT)) >= 13
            BEGIN
                -- SQL Server 2016+ - Use OPENJSON
                INSERT INTO [Room_Equipment] (Equipment_Name, Building_Name, Room_Name)
                SELECT 
                    LTRIM(RTRIM(value)) as Equipment_Name,
                    @Building_Name,
                    @Room_Name
                FROM OPENJSON(@EquipmentList)
                WHERE LTRIM(RTRIM(value)) != '' AND LTRIM(RTRIM(value)) IS NOT NULL
            END
            ELSE
            BEGIN
                -- SQL Server 2014 or earlier - Parse manually
                DECLARE @EquipmentTable TABLE (Equipment_Name NVARCHAR(100))
                DECLARE @JsonData NVARCHAR(MAX) = @EquipmentList
                DECLARE @StartPos INT = 2  -- Skip opening bracket '['
                DECLARE @EndPos INT
                DECLARE @CurrentValue NVARCHAR(100)
                
                -- Remove outer brackets and quotes
                SET @JsonData = LTRIM(RTRIM(@JsonData))
                IF LEFT(@JsonData, 1) = '['
                    SET @JsonData = SUBSTRING(@JsonData, 2, LEN(@JsonData) - 2)
                
                -- Split by comma
                WHILE @StartPos <= LEN(@JsonData)
                BEGIN
                    SET @EndPos = CHARINDEX(',', @JsonData, @StartPos)
                    IF @EndPos = 0
                        SET @EndPos = LEN(@JsonData) + 1
                    
                    SET @CurrentValue = SUBSTRING(@JsonData, @StartPos, @EndPos - @StartPos)
                    SET @CurrentValue = REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(@CurrentValue)), '"', ''), '''', ''), '[', '')
                    SET @CurrentValue = REPLACE(@CurrentValue, ']', '')
                    
                    IF @CurrentValue != '' AND @CurrentValue IS NOT NULL
                    BEGIN
                        INSERT INTO @EquipmentTable (Equipment_Name)
                        VALUES (@CurrentValue)
                    END
                    
                    SET @StartPos = @EndPos + 1
                END
                
                -- Insert equipment into Room_Equipment table
                INSERT INTO [Room_Equipment] (Equipment_Name, Building_Name, Room_Name)
                SELECT Equipment_Name, @Building_Name, @Room_Name
                FROM @EquipmentTable
                WHERE Equipment_Name IS NOT NULL AND Equipment_Name != ''
            END
        END
        
        SELECT 'Room equipment updated successfully' as Message
    END TRY
    BEGIN CATCH
        THROW
    END CATCH
END
GO

-- ==================== GET ROOM SECTIONS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetRoomSections]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetRoomSections]
GO

CREATE PROCEDURE [dbo].[GetRoomSections]
    @Building_Name NVARCHAR(10),
    @Room_Name NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        tp.Section_ID,
        tp.Course_ID,
        c.Name as Course_Name,
        tp.Semester
    FROM [takes_place] tp
    INNER JOIN [Course] c ON tp.Course_ID = c.Course_ID
    WHERE tp.Building_Name = @Building_Name
        AND tp.Room_Name = @Room_Name
    ORDER BY tp.Semester, tp.Course_ID, tp.Section_ID;
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

-- ==================== SCHEDULE MANAGEMENT PROCEDURES ====================

-- ==================== GET SECTION SCHEDULE ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetSectionSchedule]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetSectionSchedule]
GO

CREATE PROCEDURE [dbo].[GetSectionSchedule]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Section_ID,
        Course_ID,
        Semester,
        Day_of_Week,
        Start_Period,
        End_Period
    FROM [Scheduler]
    WHERE Section_ID = @Section_ID
        AND Course_ID = @Course_ID
        AND Semester = @Semester
    ORDER BY Day_of_Week, Start_Period;
END
GO

-- ==================== CREATE SCHEDULE ENTRY ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateScheduleEntry]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateScheduleEntry]
GO

CREATE PROCEDURE [dbo].[CreateScheduleEntry]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Day_of_Week INT,
    @Start_Period INT,
    @End_Period INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if section exists
    IF NOT EXISTS (SELECT 1 FROM [Section] WHERE Section_ID = @Section_ID AND Course_ID = @Course_ID AND Semester = @Semester)
    BEGIN
        RAISERROR('Section does not exist', 16, 1)
        RETURN
    END
    
    -- Validate Day_of_Week (1-7)
    IF @Day_of_Week < 1 OR @Day_of_Week > 7
    BEGIN
        RAISERROR('Day_of_Week must be between 1 and 7', 16, 1)
        RETURN
    END
    
    -- Validate periods
    IF @Start_Period < 1 OR @Start_Period > 13 OR @End_Period < 1 OR @End_Period > 13
    BEGIN
        RAISERROR('Periods must be between 1 and 13', 16, 1)
        RETURN
    END
    
    IF @Start_Period >= @End_Period
    BEGIN
        RAISERROR('Start_Period must be less than End_Period', 16, 1)
        RETURN
    END
    
    -- Check for conflicts (same day and overlapping periods)
    IF EXISTS (SELECT 1 FROM [Scheduler] 
               WHERE Section_ID = @Section_ID 
                 AND Course_ID = @Course_ID 
                 AND Semester = @Semester
                 AND Day_of_Week = @Day_of_Week
                 AND ((Start_Period <= @Start_Period AND End_Period > @Start_Period)
                      OR (Start_Period < @End_Period AND End_Period >= @End_Period)
                      OR (Start_Period >= @Start_Period AND End_Period <= @End_Period)))
    BEGIN
        RAISERROR('Schedule conflict: overlapping time periods on the same day', 16, 1)
        RETURN
    END
    
    -- Insert schedule entry
    INSERT INTO [Scheduler] (Section_ID, Course_ID, Semester, Day_of_Week, Start_Period, End_Period)
    VALUES (@Section_ID, @Course_ID, @Semester, @Day_of_Week, @Start_Period, @End_Period)
    
    SELECT 'Schedule entry created successfully' as Message
END
GO

-- ==================== UPDATE SCHEDULE ENTRY ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateScheduleEntry]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateScheduleEntry]
GO

CREATE PROCEDURE [dbo].[UpdateScheduleEntry]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Old_Day_of_Week INT,
    @Old_Start_Period INT,
    @Old_End_Period INT,
    @New_Day_of_Week INT = NULL,
    @New_Start_Period INT = NULL,
    @New_End_Period INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if schedule entry exists
    IF NOT EXISTS (SELECT 1 FROM [Scheduler] 
                   WHERE Section_ID = @Section_ID 
                     AND Course_ID = @Course_ID 
                     AND Semester = @Semester
                     AND Day_of_Week = @Old_Day_of_Week
                     AND Start_Period = @Old_Start_Period
                     AND End_Period = @Old_End_Period)
    BEGIN
        RAISERROR('Schedule entry does not exist', 16, 1)
        RETURN
    END
    
    DECLARE @Final_Day_of_Week INT = ISNULL(@New_Day_of_Week, @Old_Day_of_Week)
    DECLARE @Final_Start_Period INT = ISNULL(@New_Start_Period, @Old_Start_Period)
    DECLARE @Final_End_Period INT = ISNULL(@New_End_Period, @Old_End_Period)
    
    -- Validate Day_of_Week (1-7)
    IF @Final_Day_of_Week < 1 OR @Final_Day_of_Week > 7
    BEGIN
        RAISERROR('Day_of_Week must be between 1 and 7', 16, 1)
        RETURN
    END
    
    -- Validate periods
    IF @Final_Start_Period < 1 OR @Final_Start_Period > 13 OR @Final_End_Period < 1 OR @Final_End_Period > 13
    BEGIN
        RAISERROR('Periods must be between 1 and 13', 16, 1)
        RETURN
    END
    
    IF @Final_Start_Period >= @Final_End_Period
    BEGIN
        RAISERROR('Start_Period must be less than End_Period', 16, 1)
        RETURN
    END
    
    -- Check for conflicts (excluding the current entry)
    IF EXISTS (SELECT 1 FROM [Scheduler] 
               WHERE Section_ID = @Section_ID 
                 AND Course_ID = @Course_ID 
                 AND Semester = @Semester
                 AND Day_of_Week = @Final_Day_of_Week
                 AND NOT (Day_of_Week = @Old_Day_of_Week AND Start_Period = @Old_Start_Period AND End_Period = @Old_End_Period)
                 AND ((Start_Period <= @Final_Start_Period AND End_Period > @Final_Start_Period)
                      OR (Start_Period < @Final_End_Period AND End_Period >= @Final_End_Period)
                      OR (Start_Period >= @Final_Start_Period AND End_Period <= @Final_End_Period)))
    BEGIN
        RAISERROR('Schedule conflict: overlapping time periods on the same day', 16, 1)
        RETURN
    END
    
    -- Update schedule entry
    UPDATE [Scheduler]
    SET Day_of_Week = @Final_Day_of_Week,
        Start_Period = @Final_Start_Period,
        End_Period = @Final_End_Period
    WHERE Section_ID = @Section_ID
        AND Course_ID = @Course_ID
        AND Semester = @Semester
        AND Day_of_Week = @Old_Day_of_Week
        AND Start_Period = @Old_Start_Period
        AND End_Period = @Old_End_Period
    
    SELECT 'Schedule entry updated successfully' as Message
END
GO

-- ==================== DELETE SCHEDULE ENTRY ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteScheduleEntry]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteScheduleEntry]
GO

CREATE PROCEDURE [dbo].[DeleteScheduleEntry]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Day_of_Week INT,
    @Start_Period INT,
    @End_Period INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM [Scheduler]
    WHERE Section_ID = @Section_ID
        AND Course_ID = @Course_ID
        AND Semester = @Semester
        AND Day_of_Week = @Day_of_Week
        AND Start_Period = @Start_Period
        AND End_Period = @End_Period
    
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Schedule entry not found', 16, 1)
        RETURN
    END
    
    SELECT 'Schedule entry deleted successfully' as Message
END
GO

-- ==================== GET ALL SCHEDULES ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllSchedules]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllSchedules]
GO

CREATE PROCEDURE [dbo].[GetAllSchedules]
    @Course_ID NVARCHAR(15) = NULL,
    @Semester NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.Section_ID,
        s.Course_ID,
        s.Semester,
        s.Day_of_Week,
        CASE s.Day_of_Week
            WHEN 1 THEN 'Monday'
            WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday'
            WHEN 4 THEN 'Thursday'
            WHEN 5 THEN 'Friday'
            WHEN 6 THEN 'Saturday'
        END AS Day_Name,
        s.Start_Period,
        s.End_Period,
        c.Name as Course_Name,
        sec.Section_ID as Section_Exists
    FROM [Scheduler] s
    INNER JOIN [Course] c ON s.Course_ID = c.Course_ID
    INNER JOIN [Section] sec ON s.Section_ID = sec.Section_ID 
        AND s.Course_ID = sec.Course_ID 
        AND s.Semester = sec.Semester
    WHERE (@Course_ID IS NULL OR s.Course_ID = @Course_ID)
        AND (@Semester IS NULL OR s.Semester = @Semester)
    ORDER BY s.Day_of_Week, s.Start_Period, s.Course_ID, s.Section_ID;
END
GO

-- ==================== GET SCHEDULES BY ROOM ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetSchedulesByRoom]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetSchedulesByRoom]
GO

CREATE PROCEDURE [dbo].[GetSchedulesByRoom]
    @Building_Name NVARCHAR(10) = NULL,
    @Room_Name NVARCHAR(10) = NULL,
    @Semester NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        tp.Building_Name,
        tp.Room_Name,
        s.Section_ID,
        s.Course_ID,
        s.Semester,
        s.Day_of_Week,
        CASE s.Day_of_Week
            WHEN 1 THEN 'Monday'
            WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday'
            WHEN 4 THEN 'Thursday'
            WHEN 5 THEN 'Friday'
            WHEN 6 THEN 'Saturday'
        END AS Day_Name,
        s.Start_Period,
        s.End_Period,
        c.Name as Course_Name
    FROM [Scheduler] s
    INNER JOIN [Course] c ON s.Course_ID = c.Course_ID
    INNER JOIN [Section] sec ON s.Section_ID = sec.Section_ID 
        AND s.Course_ID = sec.Course_ID 
        AND s.Semester = sec.Semester
    INNER JOIN [takes_place] tp ON s.Section_ID = tp.Section_ID
        AND s.Course_ID = tp.Course_ID
        AND s.Semester = tp.Semester
    WHERE (@Building_Name IS NULL OR tp.Building_Name = @Building_Name)
        AND (@Room_Name IS NULL OR tp.Room_Name = @Room_Name)
        AND (@Semester IS NULL OR s.Semester = @Semester)
    ORDER BY tp.Building_Name, tp.Room_Name, s.Day_of_Week, s.Start_Period;
END
GO

-- ==================== GET SCHEDULES BY USER ====================
-- Get schedule for a specific user (student or tutor)
-- For students: returns schedules of sections they are enrolled in (from Assessment table)
-- For tutors: returns schedules of sections they teach (from Teaches table)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetSchedulesByUser]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetSchedulesByUser]
GO

CREATE PROCEDURE [dbo].[GetSchedulesByUser]
    @University_ID DECIMAL(7,0),
    @User_Type NVARCHAR(10) = 'student', -- 'student' or 'tutor'
    @Semester NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @User_Type = 'student'
    BEGIN
        -- Get schedules for student (from enrolled sections)
        SELECT 
            s.Section_ID,
            s.Course_ID,
            s.Semester,
            s.Day_of_Week,
            CASE s.Day_of_Week
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END AS Day_Name,
            s.Start_Period,
            s.End_Period,
            c.Name as Course_Name,
            a.Status as Enrollment_Status,
            a.Final_Grade,
            -- Room information
            (SELECT STRING_AGG(CONCAT(tp.Building_Name, ' - ', tp.Room_Name), ', ')
             FROM [takes_place] tp
             WHERE tp.Section_ID = s.Section_ID 
               AND tp.Course_ID = s.Course_ID 
               AND tp.Semester = s.Semester) as RoomsInfo
        FROM [Scheduler] s
        INNER JOIN [Assessment] a ON s.Section_ID = a.Section_ID 
            AND s.Course_ID = a.Course_ID 
            AND s.Semester = a.Semester
        INNER JOIN [Course] c ON s.Course_ID = c.Course_ID
        WHERE a.University_ID = @University_ID
            AND (@Semester IS NULL OR s.Semester = @Semester)
            AND UPPER(LTRIM(RTRIM(a.Status))) = 'APPROVED' -- Only approved enrollments
        ORDER BY s.Day_of_Week, s.Start_Period, s.Course_ID, s.Section_ID;
    END
    ELSE IF @User_Type = 'tutor'
    BEGIN
        -- Get schedules for tutor (from sections they teach)
        SELECT 
            s.Section_ID,
            s.Course_ID,
            s.Semester,
            s.Day_of_Week,
            CASE s.Day_of_Week
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END AS Day_Name,
            s.Start_Period,
            s.End_Period,
            c.Name as Course_Name,
            t.Role_Specification,
            -- Room information
            (SELECT STRING_AGG(CONCAT(tp.Building_Name, ' - ', tp.Room_Name), ', ')
             FROM [takes_place] tp
             WHERE tp.Section_ID = s.Section_ID 
               AND tp.Course_ID = s.Course_ID 
               AND tp.Semester = s.Semester) as RoomsInfo
        FROM [Scheduler] s
        INNER JOIN [Teaches] t ON s.Section_ID = t.Section_ID 
            AND s.Course_ID = t.Course_ID 
            AND s.Semester = t.Semester
        INNER JOIN [Course] c ON s.Course_ID = c.Course_ID
        WHERE t.University_ID = @University_ID
            AND (@Semester IS NULL OR s.Semester = @Semester)
        ORDER BY s.Day_of_Week, s.Start_Period, s.Course_ID, s.Section_ID;
    END
    ELSE
    BEGIN
        RAISERROR('Invalid User_Type. Must be ''student'' or ''tutor''', 16, 1)
        RETURN
    END
END
GO
