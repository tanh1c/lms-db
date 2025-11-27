-- Procedures: Student CRUD Operations

-- ==================== GET ALL STUDENTS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllStudents]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllStudents]
GO

CREATE PROCEDURE [dbo].[GetAllStudents]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        s.University_ID,
        s.Major,
        s.Current_degree,
        u.First_Name,
        u.Last_Name,
        u.Email,
        u.Phone_Number,
        u.Address,
        u.National_ID
    FROM [Student] s
    INNER JOIN [Users] u ON s.University_ID = u.University_ID
    ORDER BY s.University_ID;
END
GO

-- ==================== CREATE STUDENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateStudent]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateStudent]
GO

CREATE PROCEDURE [dbo].[CreateStudent]
    @University_ID DECIMAL(7,0),
    @First_Name NVARCHAR(50),
    @Last_Name NVARCHAR(50),
    @Email NVARCHAR(100),
    @Phone_Number NVARCHAR(20) = NULL,
    @Address NVARCHAR(200) = NULL,
    @National_ID NVARCHAR(20) = NULL,
    @Major NVARCHAR(50),
    @Current_degree NVARCHAR(50) = NULL,
    @Password NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Truncate and validate values to match table schema constraints
        DECLARE @Email_Truncated NVARCHAR(50) = LEFT(@Email, 50);
        -- Phone_Number must be exactly 10 or 11 characters (CHECK constraint)
        DECLARE @Phone_Number_Truncated NVARCHAR(11) = CASE 
            WHEN @Phone_Number IS NOT NULL AND (LEN(@Phone_Number) = 10 OR LEN(@Phone_Number) = 11) 
            THEN LEFT(@Phone_Number, 11) 
            ELSE NULL 
        END;
        DECLARE @Address_Truncated NVARCHAR(50) = CASE WHEN @Address IS NOT NULL THEN LEFT(@Address, 50) ELSE NULL END;
        -- National_ID must be exactly 12 characters (CHECK constraint)
        DECLARE @National_ID_Truncated NVARCHAR(12) = CASE 
            WHEN @National_ID IS NOT NULL AND LEN(@National_ID) = 12 
            THEN LEFT(@National_ID, 12) 
            ELSE NULL 
        END;
        
        -- Insert into Users
        INSERT INTO [Users] (University_ID, First_Name, Last_Name, Email, Phone_Number, Address, National_ID)
        VALUES (@University_ID, @First_Name, @Last_Name, @Email_Truncated, @Phone_Number_Truncated, @Address_Truncated, @National_ID_Truncated);
        
        -- Insert into Student
        INSERT INTO [Student] (University_ID, Major, Current_degree)
        VALUES (@University_ID, @Major, @Current_degree);
        
        -- Insert into Account (if password provided)
        IF @Password IS NOT NULL
        BEGIN
            INSERT INTO [Account] (University_ID, Password)
            VALUES (@University_ID, @Password);
        END
        
        COMMIT TRANSACTION;
        
        SELECT 
            s.University_ID,
            s.Major,
            s.Current_degree,
            u.First_Name,
            u.Last_Name,
            u.Email,
            u.Phone_Number,
            u.Address,
            u.National_ID
        FROM [Student] s
        INNER JOIN [Users] u ON s.University_ID = u.University_ID
        WHERE s.University_ID = @University_ID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE STUDENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateStudent]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateStudent]
GO

CREATE PROCEDURE [dbo].[UpdateStudent]
    @University_ID DECIMAL(7,0),
    @First_Name NVARCHAR(50) = NULL,
    @Last_Name NVARCHAR(50) = NULL,
    @Email NVARCHAR(100) = NULL,
    @Phone_Number NVARCHAR(20) = NULL,
    @Address NVARCHAR(200) = NULL,
    @National_ID NVARCHAR(20) = NULL,
    @Major NVARCHAR(50) = NULL,
    @Current_degree NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update Users
        UPDATE [Users]
        SET 
            First_Name = ISNULL(@First_Name, First_Name),
            Last_Name = ISNULL(@Last_Name, Last_Name),
            Email = ISNULL(@Email, Email),
            Phone_Number = ISNULL(@Phone_Number, Phone_Number),
            Address = ISNULL(@Address, Address),
            National_ID = ISNULL(@National_ID, National_ID)
        WHERE University_ID = @University_ID;
        
        -- Update Student
        UPDATE [Student]
        SET 
            Major = ISNULL(@Major, Major),
            Current_degree = ISNULL(@Current_degree, Current_degree)
        WHERE University_ID = @University_ID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Student not found', 1;
        
        COMMIT TRANSACTION;
        
        SELECT 
            s.University_ID,
            s.Major,
            s.Current_degree,
            u.First_Name,
            u.Last_Name,
            u.Email,
            u.Phone_Number,
            u.Address,
            u.National_ID
        FROM [Student] s
        INNER JOIN [Users] u ON s.University_ID = u.University_ID
        WHERE s.University_ID = @University_ID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== DELETE STUDENT ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteStudent]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteStudent]
GO

CREATE PROCEDURE [dbo].[DeleteStudent]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if student exists first
        IF NOT EXISTS (SELECT 1 FROM [Student] WHERE University_ID = @University_ID)
        BEGIN
            THROW 50001, 'Student not found', 1;
        END
        
        -- Delete related data first (to avoid foreign key constraint violations)
        -- Delete Submissions (must be deleted before Assessment)
        -- Delete Assignment_Submission (student submissions)
        DELETE FROM [Assignment_Submission] 
        WHERE University_ID = @University_ID;
        
        -- Delete Quiz_Answer (student quiz answers, references Assessment)
        DELETE FROM [Quiz_Answer] 
        WHERE University_ID = @University_ID;
        
        -- Delete Feedbacks (references Assessment)
        DELETE FROM [Feedback] 
        WHERE University_ID = @University_ID;
        
        -- Delete Assessments (after deleting dependent tables)
        DELETE FROM [Assessment] 
        WHERE University_ID = @University_ID;
        
        -- Delete Reference_To (if any)
        DELETE FROM [Reference_To] 
        WHERE University_ID = @University_ID;
        
        -- IMPORTANT: Delete from ALL role tables (user might have data in multiple roles)
        -- Delete from Tutor table (if exists) - handle related data first
        IF EXISTS (SELECT 1 FROM [Tutor] WHERE University_ID = @University_ID)
        BEGIN
            -- Update Department to remove this tutor as chair
            UPDATE [Department] 
            SET University_ID = NULL 
            WHERE University_ID = @University_ID;
            
            -- Delete Reviews
            DELETE FROM [review] 
            WHERE University_ID = @University_ID;
            
            -- Delete Teaches relationships
            DELETE FROM [Teaches] 
            WHERE University_ID = @University_ID;
            
            -- Delete from Tutor table
            DELETE FROM [Tutor] WHERE University_ID = @University_ID;
        END
        
        -- Delete from Admin table (if exists)
        DELETE FROM [Admin] WHERE University_ID = @University_ID;
        
        -- Delete from Student table
        DELETE FROM [Student] WHERE University_ID = @University_ID;
        
        -- Delete from Account
        DELETE FROM [Account] WHERE University_ID = @University_ID;
        
        -- Delete from Users (parent table) - now safe to delete
        DELETE FROM [Users] WHERE University_ID = @University_ID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

