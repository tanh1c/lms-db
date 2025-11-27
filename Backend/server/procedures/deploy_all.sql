-- Deploy All Procedures
-- Run this script to deploy all stored procedures to the database
-- Usage: Execute this file in SQL Server Management Studio or via sqlcmd

PRINT 'Deploying all stored procedures...'
GO

-- Statistics
:r get_statistics.sql
GO

-- Course CRUD
:r course_crud.sql
GO

-- Section CRUD
:r section_crud.sql
GO

-- Student CRUD
:r student_crud.sql
GO

-- Tutor CRUD
:r tutor_crud.sql
GO

-- Admin CRUD
:r admin_crud.sql
GO

-- Assignment CRUD
:r assignment_crud.sql
GO

-- Quiz CRUD (Updated for Quiz_Questions and Quiz_Answer)
:r quiz_crud_new.sql
GO

-- Assessment Queries
:r assessment_queries.sql
GO

-- Update User Role
:r update_user_role.sql
GO

-- Reset User Password
:r reset_user_password.sql
GO

-- Get User Details
:r get_user_details.sql
GO

-- Filter Users
:r filter_users.sql
GO

-- Audit Log Queries
:r audit_log_queries.sql
GO

-- Advanced Statistics
:r advanced_statistics.sql
GO

-- Password Reset
:r password_reset.sql
GO

PRINT 'All procedures deployed successfully!'
GO

