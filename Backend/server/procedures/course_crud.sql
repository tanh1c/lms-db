-- Procedures: Course CRUD Operations
-- Description: Create, Read, Update, Delete operations for Courses

-- ==================== GET ALL COURSES ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllCourses]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllCourses]
GO

CREATE PROCEDURE [dbo].[GetAllCourses]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Course_ID, Name, Credit
    FROM [Course] 
    ORDER BY Course_ID;
END
GO

-- ==================== GET ALL COURSES WITH STATISTICS ====================
-- Description: Get all courses with section, student, and tutor counts for course management table
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllCoursesWithStats]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllCoursesWithStats]
GO

CREATE PROCEDURE [dbo].[GetAllCoursesWithStats]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.Course_ID,
        c.Name,
        c.Credit,
        c.CCategory,
        -- Count distinct sections for this course
        (SELECT COUNT(*) 
         FROM [Section] s 
         WHERE s.Course_ID = c.Course_ID) as SectionCount,
        -- Count distinct students enrolled in this course across all sections
        (SELECT COUNT(DISTINCT a.University_ID) 
         FROM [Assessment] a 
         INNER JOIN [Section] s ON a.Section_ID = s.Section_ID 
             AND a.Course_ID = s.Course_ID 
             AND a.Semester = s.Semester
         WHERE s.Course_ID = c.Course_ID) as StudentCount,
        -- Count distinct tutors teaching this course across all sections
        (SELECT COUNT(DISTINCT t.University_ID) 
         FROM [Teaches] t 
         INNER JOIN [Section] s ON t.Section_ID = s.Section_ID 
             AND t.Course_ID = s.Course_ID 
             AND t.Semester = s.Semester
         WHERE s.Course_ID = c.Course_ID) as TutorCount
    FROM [Course] c
    ORDER BY c.CCategory, c.Course_ID;
END
GO

-- ==================== CREATE COURSE ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateCourse]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateCourse]
GO

CREATE PROCEDURE [dbo].[CreateCourse]
    @Course_ID NVARCHAR(15),
    @Name NVARCHAR(100),
    @Credit INT = NULL,
    @CCategory NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        INSERT INTO [Course] (Course_ID, Name, Credit, CCategory)
        VALUES (@Course_ID, @Name, @Credit, @CCategory);
        
        SELECT @Course_ID as Course_ID, @Name as Name, @Credit as Credit, @CCategory as CCategory;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE COURSE ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateCourse]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateCourse]
GO

CREATE PROCEDURE [dbo].[UpdateCourse]
    @Course_ID NVARCHAR(15),
    @Name NVARCHAR(100) = NULL,
    @Credit INT = NULL,
    @CCategory NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        UPDATE [Course]
        SET 
            Name = ISNULL(@Name, Name),
            Credit = ISNULL(@Credit, Credit)
        WHERE Course_ID = @Course_ID;
        
        IF @CCategory IS NOT NULL
        BEGIN
            UPDATE [Course]
            SET CCategory = @CCategory
            WHERE Course_ID = @Course_ID;
        END
        
        IF NOT EXISTS (SELECT 1 FROM [Course] WHERE Course_ID = @Course_ID)
            THROW 50001, 'Course not found', 1;
            
        SELECT Course_ID, Name, Credit, CCategory
        FROM [Course] 
        WHERE Course_ID = @Course_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== DELETE COURSE ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteCourse]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteCourse]
GO

CREATE PROCEDURE [dbo].[DeleteCourse]
    @Course_ID NVARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check if course exists
        IF NOT EXISTS (SELECT 1 FROM [Course] WHERE Course_ID = @Course_ID)
            THROW 50001, 'Course not found', 1;
        
        -- Delete all related data in correct order to avoid foreign key violations
        
        -- 1. Delete Assignment_Submission (references Assignment_Definition)
        DELETE FROM [Assignment_Submission]
        WHERE EXISTS (
            SELECT 1
            FROM [Assignment_Definition] ad
            WHERE ad.Course_ID = @Course_ID
                AND [Assignment_Submission].AssignmentID = ad.AssignmentID
        );
        
        -- 2. Delete Assignment_Definition (course-wide assignments)
        DELETE FROM [Assignment_Definition]
        WHERE Course_ID = @Course_ID;
        
        -- 3. Delete Quiz_Answer (student answers, references Assessment via QuizID)
        DELETE FROM [Quiz_Answer]
        WHERE EXISTS (
            SELECT 1
            FROM [Assessment] ass
            INNER JOIN [Quiz_Questions] qq ON ass.Section_ID = qq.Section_ID 
                AND ass.Course_ID = qq.Course_ID 
                AND ass.Semester = qq.Semester
            WHERE ass.Course_ID = @Course_ID
                AND [Quiz_Answer].QuizID = qq.QuizID
                AND [Quiz_Answer].Assessment_ID = ass.Assessment_ID
        );
        
        -- 4. Delete Quiz_Questions (quiz definitions for this course)
        DELETE FROM [Quiz_Questions]
        WHERE Course_ID = @Course_ID;
        
        -- 5. Delete Feedback (references Assessment)
        DELETE FROM [Feedback]
        WHERE EXISTS (
            SELECT 1
            FROM [Assessment] ass
            WHERE ass.Course_ID = @Course_ID
                AND [Feedback].University_ID = ass.University_ID
                AND [Feedback].Section_ID = ass.Section_ID
                AND [Feedback].Course_ID = ass.Course_ID
                AND [Feedback].Semester = ass.Semester
                AND [Feedback].Assessment_ID = ass.Assessment_ID
        );
        
        -- 5. Delete Assessment (references Section)
        DELETE FROM [Assessment]
        WHERE Course_ID = @Course_ID;
        
        -- 6. Delete Teaches (references Section)
        DELETE FROM [Teaches]
        WHERE Course_ID = @Course_ID;
        
        -- 7. Delete Scheduler (references Section)
        DELETE FROM [Scheduler]
        WHERE Course_ID = @Course_ID;
        
        -- 8. Delete takes_place (references Section)
        DELETE FROM [takes_place]
        WHERE Course_ID = @Course_ID;
        
        -- 9. Delete Online (references Section)
        DELETE FROM [Online]
        WHERE Course_ID = @Course_ID;
        
        -- 10. Delete Section (references Course)
        DELETE FROM [Section]
        WHERE Course_ID = @Course_ID;
        
        -- 11. Finally, delete Course
        DELETE FROM [Course] 
        WHERE Course_ID = @Course_ID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Course not found', 1;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET ALL CATEGORIES ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllCategories]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllCategories]
GO

CREATE PROCEDURE [dbo].[GetAllCategories]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT CCategory
    FROM [Course]
    WHERE CCategory IS NOT NULL AND CCategory != ''
    ORDER BY CCategory;
END
GO
