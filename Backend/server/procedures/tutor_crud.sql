-- Procedures: Tutor CRUD Operations

-- ==================== GET ALL TUTORS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllTutors]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllTutors]
GO

CREATE PROCEDURE [dbo].[GetAllTutors]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        t.University_ID,
        t.Name,
        t.Academic_Rank,
        t.Details,
        t.Issuance_Date,
        t.Department_Name,
        u.First_Name,
        u.Last_Name,
        u.Email,
        u.Phone_Number,
        u.Address,
        u.National_ID
    FROM [Tutor] t
    INNER JOIN [Users] u ON t.University_ID = u.University_ID
    ORDER BY t.University_ID;
END
GO

-- ==================== CREATE TUTOR ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateTutor]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateTutor]
GO

CREATE PROCEDURE [dbo].[CreateTutor]
    @University_ID DECIMAL(7,0),
    @First_Name NVARCHAR(50),
    @Last_Name NVARCHAR(50),
    @Email NVARCHAR(100),
    @Phone_Number NVARCHAR(20) = NULL,
    @Address NVARCHAR(200) = NULL,
    @National_ID NVARCHAR(20) = NULL,
    @Name NVARCHAR(100) = NULL,
    @Academic_Rank NVARCHAR(50) = NULL,
    @Details NVARCHAR(500) = NULL,
    @Department_Name NVARCHAR(50) = NULL,
    @Password NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insert into Users
        INSERT INTO [Users] (University_ID, First_Name, Last_Name, Email, Phone_Number, Address, National_ID)
        VALUES (@University_ID, @First_Name, @Last_Name, @Email, @Phone_Number, @Address, @National_ID);
        
        -- Insert into Tutor
        INSERT INTO [Tutor] (University_ID, Name, Academic_Rank, Details, Issuance_Date, Department_Name)
        VALUES (@University_ID, 
                ISNULL(@Name, @First_Name + ' ' + @Last_Name), 
                @Academic_Rank, 
                @Details, 
                GETDATE(), 
                @Department_Name);
        
        -- Insert into Account (if password provided)
        IF @Password IS NOT NULL
        BEGIN
            INSERT INTO [Account] (University_ID, Password)
            VALUES (@University_ID, @Password);
        END
        
        COMMIT TRANSACTION;
        
        SELECT 
            t.University_ID,
            t.Name,
            t.Academic_Rank,
            t.Details,
            t.Issuance_Date,
            t.Department_Name,
            u.First_Name,
            u.Last_Name,
            u.Email,
            u.Phone_Number,
            u.Address,
            u.National_ID
        FROM [Tutor] t
        INNER JOIN [Users] u ON t.University_ID = u.University_ID
        WHERE t.University_ID = @University_ID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE TUTOR ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateTutor]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateTutor]
GO

CREATE PROCEDURE [dbo].[UpdateTutor]
    @University_ID DECIMAL(7,0),
    @First_Name NVARCHAR(50) = NULL,
    @Last_Name NVARCHAR(50) = NULL,
    @Email NVARCHAR(100) = NULL,
    @Phone_Number NVARCHAR(20) = NULL,
    @Address NVARCHAR(200) = NULL,
    @National_ID NVARCHAR(20) = NULL,
    @Name NVARCHAR(100) = NULL,
    @Academic_Rank NVARCHAR(50) = NULL,
    @Details NVARCHAR(500) = NULL,
    @Department_Name NVARCHAR(50) = NULL
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
        
        -- Update Tutor
        UPDATE [Tutor]
        SET 
            Name = ISNULL(@Name, Name),
            Academic_Rank = ISNULL(@Academic_Rank, Academic_Rank),
            Details = ISNULL(@Details, Details),
            Department_Name = ISNULL(@Department_Name, Department_Name)
        WHERE University_ID = @University_ID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Tutor not found', 1;
        
        COMMIT TRANSACTION;
        
        SELECT 
            t.University_ID,
            t.Name,
            t.Academic_Rank,
            t.Details,
            t.Issuance_Date,
            t.Department_Name,
            u.First_Name,
            u.Last_Name,
            u.Email,
            u.Phone_Number,
            u.Address,
            u.National_ID
        FROM [Tutor] t
        INNER JOIN [Users] u ON t.University_ID = u.University_ID
        WHERE t.University_ID = @University_ID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== DELETE TUTOR ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteTutor]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteTutor]
GO

CREATE PROCEDURE [dbo].[DeleteTutor]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DELETE FROM [Tutor] WHERE University_ID = @University_ID;
        DELETE FROM [Account] WHERE University_ID = @University_ID;
        DELETE FROM [Users] WHERE University_ID = @University_ID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Tutor not found', 1;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

