-- ==================== PASSWORD RESET PROCEDURES ====================
-- Procedures for handling password reset functionality

-- Create PasswordResetTokens table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PasswordResetTokens]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PasswordResetTokens] (
        [Token] NVARCHAR(100) PRIMARY KEY,
        [University_ID] DECIMAL(7,0) NOT NULL,
        [ExpiresAt] DATETIME NOT NULL,
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY ([University_ID]) REFERENCES [Users]([University_ID]) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_PasswordResetTokens_University_ID ON [PasswordResetTokens]([University_ID]);
    CREATE INDEX IX_PasswordResetTokens_ExpiresAt ON [PasswordResetTokens]([ExpiresAt]);
END
GO

-- ==================== REQUEST PASSWORD RESET ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RequestPasswordReset]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[RequestPasswordReset]
GO

CREATE PROCEDURE [dbo].[RequestPasswordReset]
    @University_ID DECIMAL(7,0),
    @ResetToken NVARCHAR(100),
    @ExpiresAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if user exists
        IF NOT EXISTS (SELECT 1 FROM [Users] WHERE University_ID = @University_ID)
        BEGIN
            THROW 50001, 'User not found', 1;
        END
        
        -- Check if account exists
        IF NOT EXISTS (SELECT 1 FROM [Account] WHERE University_ID = @University_ID)
        BEGIN
            THROW 50002, 'Account not found', 1;
        END
        
        -- Delete any existing tokens for this user
        DELETE FROM [PasswordResetTokens] WHERE University_ID = @University_ID;
        
        -- Insert new reset token
        INSERT INTO [PasswordResetTokens] (Token, University_ID, ExpiresAt)
        VALUES (@ResetToken, @University_ID, @ExpiresAt);
        
        COMMIT TRANSACTION;
        
        SELECT 
            @University_ID AS University_ID,
            @ResetToken AS ResetToken,
            @ExpiresAt AS ExpiresAt,
            'Password reset token generated successfully' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== VERIFY RESET TOKEN ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VerifyResetToken]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[VerifyResetToken]
GO

CREATE PROCEDURE [dbo].[VerifyResetToken]
    @ResetToken NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check if token exists and is not expired
        DECLARE @University_ID DECIMAL(7,0)
        DECLARE @ExpiresAt DATETIME
        
        SELECT 
            @University_ID = University_ID,
            @ExpiresAt = ExpiresAt
        FROM [PasswordResetTokens]
        WHERE Token = @ResetToken;
        
        IF @University_ID IS NULL
        BEGIN
            SELECT 
                NULL AS University_ID,
                0 AS IsValid,
                'Invalid token' AS Message;
            RETURN;
        END
        
        IF @ExpiresAt < GETDATE()
        BEGIN
            -- Delete expired token
            DELETE FROM [PasswordResetTokens] WHERE Token = @ResetToken;
            
            SELECT 
                NULL AS University_ID,
                0 AS IsValid,
                'Token expired' AS Message;
            RETURN;
        END
        
        SELECT 
            @University_ID AS University_ID,
            1 AS IsValid,
            'Token is valid' AS Message;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== RESET PASSWORD WITH TOKEN ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ResetPasswordWithToken]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[ResetPasswordWithToken]
GO

CREATE PROCEDURE [dbo].[ResetPasswordWithToken]
    @ResetToken NVARCHAR(100),
    @NewPassword NVARCHAR(255)  -- Increased size for bcrypt hashes
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verify token and get University_ID
        DECLARE @University_ID DECIMAL(7,0)
        DECLARE @ExpiresAt DATETIME
        
        SELECT 
            @University_ID = University_ID,
            @ExpiresAt = ExpiresAt
        FROM [PasswordResetTokens]
        WHERE Token = @ResetToken;
        
        IF @University_ID IS NULL
        BEGIN
            THROW 50003, 'Invalid reset token', 1;
        END
        
        IF @ExpiresAt < GETDATE()
        BEGIN
            DELETE FROM [PasswordResetTokens] WHERE Token = @ResetToken;
            THROW 50004, 'Reset token has expired', 1;
        END
        
        -- Update password in Account table
        IF EXISTS (SELECT 1 FROM [Account] WHERE University_ID = @University_ID)
        BEGIN
            UPDATE [Account]
            SET Password = @NewPassword
            WHERE University_ID = @University_ID;
        END
        ELSE
        BEGIN
            INSERT INTO [Account] (University_ID, Password)
            VALUES (@University_ID, @NewPassword);
        END
        
        -- Delete the used token
        DELETE FROM [PasswordResetTokens] WHERE Token = @ResetToken;
        
        COMMIT TRANSACTION;
        
        SELECT 
            @University_ID AS University_ID,
            'Password reset successfully' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ==================== UPDATE PASSWORD ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdatePassword]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdatePassword]
GO

CREATE PROCEDURE [dbo].[UpdatePassword]
    @University_ID DECIMAL(7,0),
    @NewPassword NVARCHAR(255)  -- Increased size for bcrypt hashes
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if user exists
        IF NOT EXISTS (SELECT 1 FROM [Users] WHERE University_ID = @University_ID)
        BEGIN
            THROW 50001, 'User not found', 1;
        END
        
        -- Update or insert password
        IF EXISTS (SELECT 1 FROM [Account] WHERE University_ID = @University_ID)
        BEGIN
            UPDATE [Account]
            SET Password = @NewPassword
            WHERE University_ID = @University_ID;
        END
        ELSE
        BEGIN
            INSERT INTO [Account] (University_ID, Password)
            VALUES (@University_ID, @NewPassword);
        END
        
        COMMIT TRANSACTION;
        
        SELECT 
            @University_ID AS University_ID,
            'Password updated successfully' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

