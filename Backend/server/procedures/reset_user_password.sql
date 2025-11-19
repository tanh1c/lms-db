-- Procedure: Reset User Password
-- This procedure resets a user's password to default (123456)

-- ==================== RESET USER PASSWORD ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ResetUserPassword]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[ResetUserPassword]
GO

CREATE PROCEDURE [dbo].[ResetUserPassword]
    @University_ID DECIMAL(7,0),
    @DefaultPassword NVARCHAR(50) = '123456'
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
        
        -- Check if account exists, update or insert
        IF EXISTS (SELECT 1 FROM [Account] WHERE University_ID = @University_ID)
        BEGIN
            -- Update existing password
            UPDATE [Account]
            SET Password = @DefaultPassword
            WHERE University_ID = @University_ID;
        END
        ELSE
        BEGIN
            -- Create new account with default password
            INSERT INTO [Account] (University_ID, Password)
            VALUES (@University_ID, @DefaultPassword);
        END
        
        COMMIT TRANSACTION;
        
        -- Return success message
        SELECT 
            @University_ID AS University_ID,
            @DefaultPassword AS DefaultPassword,
            'Password reset successfully' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

