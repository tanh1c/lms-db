-- Procedures: Assessment Queries (Read operations)

-- ==================== GET ALL ASSESSMENTS ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetAllAssessments]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetAllAssessments]
GO

CREATE PROCEDURE [dbo].[GetAllAssessments]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        a.University_ID,
        a.Section_ID,
        a.Course_ID,
        a.Semester,
        a.Assessment_ID,
        a.Registration_Date,
        a.Potential_Withdrawal_Date,
        a.Status,
        a.Final_Grade,
        a.Midterm_Grade,
        a.Quiz_Grade,
        a.Assignment_Grade,
        u.First_Name,
        u.Last_Name,
        c.Name as Course_Name
    FROM [Assessment] a
    INNER JOIN [Users] u ON a.University_ID = u.University_ID
    INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
    ORDER BY a.Registration_Date DESC;
END
GO

-- ==================== UPDATE ASSESSMENT GRADE ====================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateAssessmentGrade]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[UpdateAssessmentGrade]
GO

CREATE PROCEDURE [dbo].[UpdateAssessmentGrade]
    @University_ID DECIMAL(7,0),
    @Section_ID NVARCHAR(10),
    @Course_ID NVARCHAR(15),
    @Semester NVARCHAR(10),
    @Assessment_ID INT,
    @Final_Grade DECIMAL(4,2) = NULL,
    @Midterm_Grade DECIMAL(4,2) = NULL,
    @Quiz_Grade DECIMAL(4,2) = NULL,
    @Assignment_Grade DECIMAL(4,2) = NULL,
    @Status NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        UPDATE [Assessment]
        SET 
            Final_Grade = ISNULL(@Final_Grade, Final_Grade),
            Midterm_Grade = ISNULL(@Midterm_Grade, Midterm_Grade),
            Quiz_Grade = ISNULL(@Quiz_Grade, Quiz_Grade),
            Assignment_Grade = ISNULL(@Assignment_Grade, Assignment_Grade),
            Status = ISNULL(@Status, Status)
        WHERE University_ID = @University_ID
          AND Section_ID = @Section_ID
          AND Course_ID = @Course_ID
          AND Semester = @Semester
          AND Assessment_ID = @Assessment_ID;
        
        IF @@ROWCOUNT = 0
            THROW 50001, 'Assessment not found', 1;
        
        SELECT 
            a.University_ID,
            a.Section_ID,
            a.Course_ID,
            a.Semester,
            a.Assessment_ID,
            a.Registration_Date,
            a.Potential_Withdrawal_Date,
            a.Status,
            a.Final_Grade,
            a.Midterm_Grade,
            a.Quiz_Grade,
            a.Assignment_Grade,
            u.First_Name,
            u.Last_Name,
            c.Name as Course_Name
        FROM [Assessment] a
        INNER JOIN [Users] u ON a.University_ID = u.University_ID
        INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
        WHERE a.University_ID = @University_ID
          AND a.Section_ID = @Section_ID
          AND a.Course_ID = @Course_ID
          AND a.Semester = @Semester
          AND a.Assessment_ID = @Assessment_ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

