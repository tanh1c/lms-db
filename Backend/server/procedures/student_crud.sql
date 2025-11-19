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
        
        -- Insert into Users
        INSERT INTO [Users] (University_ID, First_Name, Last_Name, Email, Phone_Number, Address, National_ID)
        VALUES (@University_ID, @First_Name, @Last_Name, @Email, @Phone_Number, @Address, @National_ID);
        
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
        
        DELETE FROM [Student] WHERE University_ID = @University_ID;
        DELETE FROM [Account] WHERE University_ID = @University_ID;
        DELETE FROM [Users] WHERE University_ID = @University_ID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Student not found', 1;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

