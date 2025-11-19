-- Procedures: Section CRUD Operations

-- ==================== GET ALL SECTIONS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllSections]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllSections]
GO

CREATE PROCEDURE [dbo].[GetAllSections]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Section_ID, Course_ID, Semester 
    FROM [Section] 
    ORDER BY Course_ID, Section_ID;
END
GO

-- ==================== CREATE SECTION ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateSection]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[CreateSection]
GO

CREATE PROCEDURE [dbo].[CreateSection]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        INSERT INTO [Section] (Section_ID, Course_ID, Semester)
        VALUES (@Section_ID, @Course_ID, @Semester);
        
        SELECT @Section_ID as Section_ID, @Course_ID as Course_ID, @Semester as Semester;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== DELETE SECTION ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeleteSection]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[DeleteSection]
GO

CREATE PROCEDURE [dbo].[DeleteSection]
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DELETE FROM [Section] 
        WHERE Section_ID = @Section_ID 
          AND Course_ID = @Course_ID 
          AND Semester = @Semester;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Section not found', 1;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

