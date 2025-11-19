-- Procedure: Update User Role
-- This procedure allows changing a user's role from one type to another
-- It handles moving data between Student, Tutor, and Admin tables

-- ==================== UPDATE USER ROLE ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateUserRole]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateUserRole]
GO

CREATE PROCEDURE [dbo].[UpdateUserRole]
    @University_ID DECIMAL(7,0),
    @NewRole NVARCHAR(20), -- 'student', 'tutor', or 'admin'
    @Major NVARCHAR(50) = NULL, -- Required if new role is 'student'
    @Current_degree NVARCHAR(50) = NULL, -- Optional for student
    @Name NVARCHAR(100) = NULL, -- Optional for tutor
    @Academic_Rank NVARCHAR(50) = NULL, -- Optional for tutor
    @Details NVARCHAR(500) = NULL, -- Optional for tutor
    @Department_Name NVARCHAR(50) = NULL, -- Optional for tutor
    @Type NVARCHAR(50) = 'Program Administrator' -- Optional for admin
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validate new role
        IF @NewRole NOT IN ('student', 'tutor', 'admin')
        BEGIN
            THROW 50001, 'Invalid role. Must be student, tutor, or admin', 1;
        END
        
        -- Check if user exists
        IF NOT EXISTS (SELECT 1 FROM [Users] WHERE University_ID = @University_ID)
        BEGIN
            THROW 50002, 'User not found', 1;
        END
        
        -- Remove user from old role tables
        DELETE FROM [Student] WHERE University_ID = @University_ID;
        DELETE FROM [Tutor] WHERE University_ID = @University_ID;
        DELETE FROM [Admin] WHERE University_ID = @University_ID;
        
        -- Add user to new role table
        IF @NewRole = 'student'
        BEGIN
            IF @Major IS NULL
            BEGIN
                THROW 50003, 'Major is required when changing role to student', 1;
            END
            
            INSERT INTO [Student] (University_ID, Major, Current_degree)
            VALUES (@University_ID, @Major, ISNULL(@Current_degree, 'Bachelor'));
        END
        ELSE IF @NewRole = 'tutor'
        BEGIN
            DECLARE @FirstName NVARCHAR(50);
            DECLARE @LastName NVARCHAR(50);
            
            SELECT @FirstName = First_Name, @LastName = Last_Name
            FROM [Users]
            WHERE University_ID = @University_ID;
            
            INSERT INTO [Tutor] (University_ID, Name, Academic_Rank, Details, Issuance_Date, Department_Name)
            VALUES (
                @University_ID,
                ISNULL(@Name, @FirstName + ' ' + @LastName),
                @Academic_Rank,
                @Details,
                GETDATE(),
                @Department_Name
            );
        END
        ELSE IF @NewRole = 'admin'
        BEGIN
            INSERT INTO [Admin] (University_ID, Type)
            VALUES (@University_ID, @Type);
        END
        
        COMMIT TRANSACTION;
        
        -- Return updated user info based on new role
        IF @NewRole = 'student'
        BEGIN
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
        END
        ELSE IF @NewRole = 'tutor'
        BEGIN
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
        END
        ELSE IF @NewRole = 'admin'
        BEGIN
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
        END
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

