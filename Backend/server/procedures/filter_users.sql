-- Procedure: Filter Users with Advanced Filters
-- This procedure filters users by Major, Department, Type, and other criteria

-- ==================== FILTER USERS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FilterUsers]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[FilterUsers]
GO

CREATE PROCEDURE [dbo].[FilterUsers]
    @Role NVARCHAR(20) = NULL,              -- 'student', 'tutor', 'admin', or NULL for all
    @Major NVARCHAR(50) = NULL,             -- Filter by Major (for students)
    @Department_Name NVARCHAR(50) = NULL,   -- Filter by Department (for tutors)
    @Type NVARCHAR(50) = NULL,              -- Filter by Type (for admins)
    @SearchQuery NVARCHAR(200) = NULL       -- Search in name, email, University_ID
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Build result using UNION ALL
        SELECT 
            s.University_ID,
            u.First_Name,
            u.Last_Name,
            u.Email,
            u.Phone_Number,
            u.Address,
            u.National_ID,
            'student' AS Role,
            s.Major,
            s.Current_degree,
            NULL AS Department_Name,
            NULL AS Type,
            NULL AS Name,
            NULL AS Academic_Rank,
            NULL AS Details
        FROM [Student] s
        INNER JOIN [Users] u ON s.University_ID = u.University_ID
        WHERE 
            (@Role IS NULL OR @Role = 'student')
            AND (@Major IS NULL OR @Major = '' OR s.Major = @Major)
            AND (@SearchQuery IS NULL OR @SearchQuery = '' OR 
                u.First_Name COLLATE Vietnamese_100_CI_AS LIKE '%' + @SearchQuery + '%' COLLATE Vietnamese_100_CI_AS
                OR u.Last_Name COLLATE Vietnamese_100_CI_AS LIKE '%' + @SearchQuery + '%' COLLATE Vietnamese_100_CI_AS
                OR u.Email COLLATE Vietnamese_100_CI_AS LIKE '%' + @SearchQuery + '%' COLLATE Vietnamese_100_CI_AS
                OR CAST(s.University_ID AS NVARCHAR) LIKE '%' + @SearchQuery + '%')
        
        UNION ALL
        
        SELECT 
            t.University_ID,
            u.First_Name,
            u.Last_Name,
            u.Email,
            u.Phone_Number,
            u.Address,
            u.National_ID,
            'tutor' AS Role,
            NULL AS Major,
            NULL AS Current_degree,
            t.Department_Name,
            NULL AS Type,
            t.Name,
            t.Academic_Rank,
            t.Details
        FROM [Tutor] t
        INNER JOIN [Users] u ON t.University_ID = u.University_ID
        WHERE 
            (@Role IS NULL OR @Role = 'tutor')
            AND (@Department_Name IS NULL OR @Department_Name = '' OR t.Department_Name = @Department_Name)
            AND (@SearchQuery IS NULL OR @SearchQuery = '' OR 
                u.First_Name COLLATE Vietnamese_100_CI_AS LIKE '%' + @SearchQuery + '%' COLLATE Vietnamese_100_CI_AS
                OR u.Last_Name COLLATE Vietnamese_100_CI_AS LIKE '%' + @SearchQuery + '%' COLLATE Vietnamese_100_CI_AS
                OR u.Email COLLATE Vietnamese_100_CI_AS LIKE '%' + @SearchQuery + '%' COLLATE Vietnamese_100_CI_AS
                OR CAST(t.University_ID AS NVARCHAR) LIKE '%' + @SearchQuery + '%')
        
        UNION ALL
        
        SELECT 
            a.University_ID,
            u.First_Name,
            u.Last_Name,
            u.Email,
            u.Phone_Number,
            u.Address,
            u.National_ID,
            'admin' AS Role,
            NULL AS Major,
            NULL AS Current_degree,
            NULL AS Department_Name,
            a.Type,
            NULL AS Name,
            NULL AS Academic_Rank,
            NULL AS Details
        FROM [Admin] a
        INNER JOIN [Users] u ON a.University_ID = u.University_ID
        WHERE 
            (@Role IS NULL OR @Role = 'admin')
            AND (@Type IS NULL OR @Type = '' OR a.Type = @Type)
            AND (@SearchQuery IS NULL OR @SearchQuery = '' OR 
                u.First_Name COLLATE Vietnamese_100_CI_AS LIKE '%' + @SearchQuery + '%' COLLATE Vietnamese_100_CI_AS
                OR u.Last_Name COLLATE Vietnamese_100_CI_AS LIKE '%' + @SearchQuery + '%' COLLATE Vietnamese_100_CI_AS
                OR u.Email COLLATE Vietnamese_100_CI_AS LIKE '%' + @SearchQuery + '%' COLLATE Vietnamese_100_CI_AS
                OR CAST(a.University_ID AS NVARCHAR) LIKE '%' + @SearchQuery + '%')
        
        ORDER BY University_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ==================== GET DISTINCT MAJORS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetDistinctMajors]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetDistinctMajors]
GO

CREATE PROCEDURE [dbo].[GetDistinctMajors]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT Major
    FROM [Student]
    WHERE Major IS NOT NULL
    ORDER BY Major;
END
GO

-- ==================== GET DISTINCT DEPARTMENTS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetDistinctDepartments]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetDistinctDepartments]
GO

CREATE PROCEDURE [dbo].[GetDistinctDepartments]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT Department_Name
    FROM [Tutor]
    WHERE Department_Name IS NOT NULL
    ORDER BY Department_Name;
END
GO

-- ==================== GET DISTINCT ADMIN TYPES ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetDistinctAdminTypes]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetDistinctAdminTypes]
GO

CREATE PROCEDURE [dbo].[GetDistinctAdminTypes]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT Type
    FROM [Admin]
    WHERE Type IS NOT NULL
    ORDER BY Type;
END
GO

