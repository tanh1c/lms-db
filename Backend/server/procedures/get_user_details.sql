-- Procedure: Get User Details
-- This procedure returns detailed information about a user including courses, assignments, etc.

-- ==================== GET USER DETAILS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetUserDetails]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetUserDetails]
GO

CREATE PROCEDURE [dbo].[GetUserDetails]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Get user basic info
        DECLARE @First_Name NVARCHAR(50);
        DECLARE @Last_Name NVARCHAR(50);
        DECLARE @Email NVARCHAR(100);
        DECLARE @Phone_Number NVARCHAR(20);
        DECLARE @Address NVARCHAR(200);
        DECLARE @National_ID NVARCHAR(20);
        
        SELECT 
            @First_Name = First_Name,
            @Last_Name = Last_Name,
            @Email = Email,
            @Phone_Number = Phone_Number,
            @Address = Address,
            @National_ID = National_ID
        FROM [Users]
        WHERE University_ID = @University_ID;
        
        IF @First_Name IS NULL
        BEGIN
            THROW 50001, 'User not found', 1;
        END
        
        -- Determine user role and get role-specific info
        DECLARE @Role NVARCHAR(20) = NULL;
        DECLARE @Major NVARCHAR(50) = NULL;
        DECLARE @Current_degree NVARCHAR(50) = NULL;
        DECLARE @Name NVARCHAR(100) = NULL;
        DECLARE @Academic_Rank NVARCHAR(50) = NULL;
        DECLARE @Details NVARCHAR(500) = NULL;
        DECLARE @Department_Name NVARCHAR(50) = NULL;
        DECLARE @Issuance_Date DATE = NULL;
        DECLARE @Type NVARCHAR(50) = NULL;
        
        IF EXISTS (SELECT 1 FROM [Student] WHERE University_ID = @University_ID)
        BEGIN
            SET @Role = 'student';
            SELECT 
                @Major = Major,
                @Current_degree = Current_degree
            FROM [Student]
            WHERE University_ID = @University_ID;
        END
        ELSE IF EXISTS (SELECT 1 FROM [Tutor] WHERE University_ID = @University_ID)
        BEGIN
            SET @Role = 'tutor';
            SELECT 
                @Name = Name,
                @Academic_Rank = Academic_Rank,
                @Details = Details,
                @Department_Name = Department_Name,
                @Issuance_Date = Issuance_Date
            FROM [Tutor]
            WHERE University_ID = @University_ID;
        END
        ELSE IF EXISTS (SELECT 1 FROM [Admin] WHERE University_ID = @University_ID)
        BEGIN
            SET @Role = 'admin';
            SELECT @Type = Type
            FROM [Admin]
            WHERE University_ID = @University_ID;
        END
        
        -- Return user basic info and role
        SELECT 
            @University_ID AS University_ID,
            @First_Name AS First_Name,
            @Last_Name AS Last_Name,
            @Email AS Email,
            @Phone_Number AS Phone_Number,
            @Address AS Address,
            @National_ID AS National_ID,
            @Role AS Role,
            @Major AS Major,
            @Current_degree AS Current_degree,
            @Name AS Name,
            @Academic_Rank AS Academic_Rank,
            @Details AS Details,
            @Department_Name AS Department_Name,
            @Issuance_Date AS Issuance_Date,
            @Type AS Type;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET USER COURSES (for students) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetUserCourses]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetUserCourses]
GO

CREATE PROCEDURE [dbo].[GetUserCourses]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            a.Course_ID,
            a.Section_ID,
            a.Semester,
            c.Name AS Course_Name,
            c.Credit,
            a.Registration_Date,
            a.Status,
            a.Final_Grade,
            a.Midterm_Grade,
            a.Quiz_Grade,
            a.Assignment_Grade
        FROM [Assessment] a
        INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
        WHERE a.University_ID = @University_ID
        ORDER BY a.Registration_Date DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET USER SECTIONS TAUGHT (for tutors) ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetUserSectionsTaught]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetUserSectionsTaught]
GO

CREATE PROCEDURE [dbo].[GetUserSectionsTaught]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            t.Course_ID,
            t.Section_ID,
            t.Semester,
            c.Name AS Course_Name,
            c.Start_Date,
            t.Role_Specification,
            t.Timestamp
        FROM [Teaches] t
        INNER JOIN [Course] c ON t.Course_ID = c.Course_ID
        WHERE t.University_ID = @University_ID
        ORDER BY t.Semester DESC, t.Timestamp DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

