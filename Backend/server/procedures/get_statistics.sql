-- Procedure: Get Statistics
-- Description: Get all system statistics for admin dashboard
-- Returns: Single row with all counts

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetStatistics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[GetStatistics]
GO

CREATE PROCEDURE [dbo].[GetStatistics]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        (SELECT COUNT(*) FROM [Users]) as total_users,
        (SELECT COUNT(*) FROM [Student]) as total_students,
        (SELECT COUNT(*) FROM [Tutor]) as total_tutors,
        (SELECT COUNT(*) FROM [Admin]) as total_admins,
        (SELECT COUNT(*) FROM [Course]) as total_courses,
        (SELECT COUNT(*) FROM [Section]) as total_sections,
        (SELECT COUNT(*) FROM [Assignment]) as total_assignments,
        (SELECT COUNT(*) FROM [Quiz]) as total_quizzes,
        (SELECT COUNT(*) FROM [Submission]) as total_submissions,
        (SELECT COUNT(*) FROM [Assessment] WHERE Status = 'Pending') as pending_assessments;
END
GO

