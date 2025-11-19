-- Procedures: Admin CRUD Operations

-- ==================== GET ALL ADMINS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllAdmins]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllAdmins]
GO

CREATE PROCEDURE [dbo].[GetAllAdmins]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        a.University_ID,
        a.Type,
        u.First_Name,
        u.Last_Name,
        u.Email,
        u.Phone_Number,
        u.Address,
        u.National_ID
    FROM [Admin] a
    INNER JOIN [Users] u ON a.University_ID = u.University_ID
    ORDER BY a.University_ID;
END
GO

-- ==================== CREATE ADMIN ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateAdmin]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateAdmin]
GO

CREATE PROCEDURE [dbo].[CreateAdmin]
    @University_ID DECIMAL(7,0),
    @First_Name NVARCHAR(50),
    @Last_Name NVARCHAR(50),
    @Email NVARCHAR(100),
    @Phone_Number NVARCHAR(20) = NULL,
    @Address NVARCHAR(200) = NULL,
    @National_ID NVARCHAR(20) = NULL,
    @Type NVARCHAR(50) = 'Program Administrator',
    @Password NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insert into Users
        INSERT INTO [Users] (University_ID, First_Name, Last_Name, Email, Phone_Number, Address, National_ID)
        VALUES (@University_ID, @First_Name, @Last_Name, @Email, @Phone_Number, @Address, @National_ID);
        
        -- Insert into Admin
        INSERT INTO [Admin] (University_ID, Type)
        VALUES (@University_ID, @Type);
        
        -- Insert into Account (if password provided)
        IF @Password IS NOT NULL
        BEGIN
            INSERT INTO [Account] (University_ID, Password)
            VALUES (@University_ID, @Password);
        END
        
        COMMIT TRANSACTION;
        
        SELECT 
            a.University_ID,
            a.Type,
            u.First_Name,
            u.Last_Name,
            u.Email,
            u.Phone_Number,
            u.Address,
            u.National_ID
        FROM [Admin] a
        INNER JOIN [Users] u ON a.University_ID = u.University_ID
        WHERE a.University_ID = @University_ID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE ADMIN ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateAdmin]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateAdmin]
GO

CREATE PROCEDURE [dbo].[UpdateAdmin]
    @University_ID DECIMAL(7,0),
    @First_Name NVARCHAR(50) = NULL,
    @Last_Name NVARCHAR(50) = NULL,
    @Email NVARCHAR(100) = NULL,
    @Phone_Number NVARCHAR(20) = NULL,
    @Address NVARCHAR(200) = NULL,
    @National_ID NVARCHAR(20) = NULL,
    @Type NVARCHAR(50) = NULL
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
        
        -- Update Admin
        UPDATE [Admin]
        SET Type = ISNULL(@Type, Type)
        WHERE University_ID = @University_ID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Admin not found', 1;
        
        COMMIT TRANSACTION;
        
        SELECT 
            a.University_ID,
            a.Type,
            u.First_Name,
            u.Last_Name,
            u.Email,
            u.Phone_Number,
            u.Address,
            u.National_ID
        FROM [Admin] a
        INNER JOIN [Users] u ON a.University_ID = u.University_ID
        WHERE a.University_ID = @University_ID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== DELETE ADMIN ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteAdmin]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteAdmin]
GO

CREATE PROCEDURE [dbo].[DeleteAdmin]
    @University_ID DECIMAL(7,0)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DELETE FROM [Admin] WHERE University_ID = @University_ID;
        DELETE FROM [Account] WHERE University_ID = @University_ID;
        DELETE FROM [Users] WHERE University_ID = @University_ID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Admin not found', 1;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

