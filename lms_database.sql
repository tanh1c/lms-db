USE [lms_system];
GO

-- DROP ALL FOREIGN KEY FIRST
DECLARE @sql nvarchar(max) = N'';
SELECT @sql = @sql + N'ALTER TABLE ' 
    + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + N'.' + QUOTENAME(OBJECT_NAME(parent_object_id))
    + N' DROP CONSTRAINT ' + QUOTENAME(name) + N';' + CHAR(10)
FROM sys.foreign_keys;
EXEC sp_executesql @sql;
PRINT @sql

DROP TABLE IF EXISTS [Review];
DROP TABLE IF EXISTS [Submission];
DROP TABLE IF EXISTS [Assignment];
DROP TABLE IF EXISTS [Quiz];
DROP TABLE IF EXISTS [Link];
DROP TABLE IF EXISTS [Online];
DROP TABLE IF EXISTS [Platform];
DROP TABLE IF EXISTS [Room_Equipment];
DROP TABLE IF EXISTS [Takes_Place];
DROP TABLE IF EXISTS [Room];
DROP TABLE IF EXISTS [Building];
DROP TABLE IF EXISTS [Feedback];
DROP TABLE IF EXISTS [Assessment];
DROP TABLE IF EXISTS [Teaches];
DROP TABLE IF EXISTS [Section];
DROP TABLE IF EXISTS [Course];
DROP TABLE IF EXISTS [Tutor];
DROP TABLE IF EXISTS [Student];
DROP TABLE IF EXISTS [Department];
DROP TABLE IF EXISTS [Platform_Link];
DROP TABLE IF EXISTS [Reference_To];
DROP TABLE IF EXISTS [Audit_Log];
DROP TABLE IF EXISTS [Admin];
DROP TABLE IF EXISTS [Account];
DROP TABLE IF EXISTS [Users];

CREATE TABLE [Users] (
    University_ID DECIMAL(7,0) PRIMARY KEY,
    First_Name NVARCHAR(50) COLLATE Vietnamese_100_CI_AS,
    Last_Name NVARCHAR(50) COLLATE Vietnamese_100_CI_AS,
    Email NVARCHAR(50) COLLATE Vietnamese_100_CI_AS NOT NULL,
    Phone_Number NVARCHAR(10) COLLATE Vietnamese_100_CI_AS CHECK (LEN(Phone_Number) = 10 OR LEN(Phone_Number) = 11),
    [Address] NVARCHAR(50) COLLATE Vietnamese_100_CI_AS,
    National_ID NVARCHAR(12) COLLATE Vietnamese_100_CI_AS UNIQUE CHECK (LEN(National_ID) = 12)
);

CREATE TABLE [Account] (
    University_ID DECIMAL(7,0),
    [Password] NVARCHAR(50),
    CONSTRAINT PK_Account PRIMARY KEY (University_ID),
    CONSTRAINT FK_Account_User FOREIGN KEY (University_ID)
        REFERENCES [Users](University_ID)
);

CREATE TABLE [Admin] (
    University_ID DECIMAL(7,0) PRIMARY KEY,
    [Type] NVARCHAR(50) CHECK ([Type] IN (
        'Coordinator',
        'Office of Academic Affairs',
        'Office of Student Affairs',
        'Program Administrator'
    )),
    CONSTRAINT FK_Admin_User FOREIGN KEY (University_ID)
        REFERENCES [Users](University_ID)
);

CREATE TABLE [Audit_Log] (
    LogID INT IDENTITY(0,1) PRIMARY KEY,
    [timestamp] DATETIME NOT NULL DEFAULT GETDATE(),
    affected_entities NVARCHAR(255), 
    section_creation NVARCHAR(500),
    deadline_extensions NVARCHAR(500),
    grade_updates DECIMAL(2,2) CHECK (grade_updates BETWEEN 0 AND 10),
);

CREATE TABLE [Reference_To] (
    LogID INT,
    University_ID DECIMAL(7,0),
    CONSTRAINT PK_Reference PRIMARY KEY (LogID, University_ID),
    CONSTRAINT FK_Reference_Log FOREIGN KEY (LogID)
        REFERENCES [Audit_Log](LogID),
    CONSTRAINT FK_Reference_User FOREIGN KEY (University_ID)
        REFERENCES [Users](University_ID)
);

Create table [Student](
	University_ID DECIMAL(7,0) PRIMARY KEY,
	CONSTRAINT FK_Student_User FOREIGN KEY (University_ID)
        REFERENCES [Users](University_ID),
	Major NVARCHAR(50) not null,
	Current_degree NVARCHAR(50) DEFAULT 'Bachelor'
);

CREATE TABLE [Department] (
    Department_Name NVARCHAR(50) PRIMARY KEY,
    University_ID DECIMAL(7,0) 
);

CREATE TABLE [Tutor] (
    University_ID DECIMAL(7,0) PRIMARY KEY, 
    [Name] NVARCHAR(50) NOT NULL,
    Academic_Rank NVARCHAR(50),
    [Details] NVARCHAR(100),
    Issuance_Date DATE,
    Department_Name NVARCHAR(50),
    
    CONSTRAINT FK_Tutor_User FOREIGN KEY (University_ID)
        REFERENCES [Users](University_ID),
        
    CONSTRAINT FK_Tutor_Department FOREIGN KEY (Department_Name)
        REFERENCES [Department](Department_Name)
);
GO

ALTER TABLE [Department]
ADD CONSTRAINT FK_Department_Tutor_Chair
    FOREIGN KEY (University_ID)
    REFERENCES [Tutor](University_ID);
GO


CREATE TABLE [Course] (
    Course_ID NVARCHAR(15) PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL,
    Credit INT CHECK (Credit BETWEEN 0 AND 10),
    Start_Date DATE
);
GO

CREATE TABLE [Section] (
    Section_ID NVARCHAR(10) NOT NULL, 
    Course_ID NVARCHAR(15) NOT NULL,
    Semester NVARCHAR(10) NOT NULL,
    
    CONSTRAINT PK_Section PRIMARY KEY (Section_ID, Course_ID, Semester), 
    
    CONSTRAINT FK_Section_Course FOREIGN KEY (Course_ID)
        REFERENCES [Course](Course_ID)
);
GO

CREATE TABLE [Teaches] (
    University_ID DECIMAL(7,0),
    Section_ID NVARCHAR(10) NOT NULL,
    Course_ID NVARCHAR(15) NOT NULL, 
    Semester NVARCHAR(10) NOT NULL, 
    Role_Specification NVARCHAR(50),
    [Timestamp] DATETIME,
    
    CONSTRAINT PK_Teaches PRIMARY KEY (University_ID, Section_ID, Course_ID, Semester),
    
    CONSTRAINT FK_Teaches_Tutor FOREIGN KEY (University_ID)
        REFERENCES [Tutor](University_ID),
        
    CONSTRAINT FK_Teaches_Section FOREIGN KEY (Section_ID, Course_ID, Semester) 
        REFERENCES [Section](Section_ID, Course_ID, Semester)
);
GO

CREATE TABLE [Assessment] (
    University_ID DECIMAL(7,0) NOT NULL,
    Section_ID NVARCHAR(10) NOT NULL, 
    Course_ID NVARCHAR(15) NOT NULL, 
    Semester NVARCHAR(10) NOT NULL,
    Assessment_ID INT IDENTITY(0,1) NOT NULL, 
    Registration_Date DATE DEFAULT GETDATE(),
    Potential_Withdrawal_Date DATE,
    [Status] NVARCHAR(50) DEFAULT 'Pending' CHECK ([Status] IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    Final_Grade DECIMAL(4,2) CHECK (Final_Grade BETWEEN 0 AND 13),
    Midterm_Grade DECIMAL(4,2) CHECK (Midterm_Grade BETWEEN 0 AND 13),
    Quiz_Grade DECIMAL(4,2) CHECK (Quiz_Grade BETWEEN 0 AND 10),
    Assignment_Grade DECIMAL(4,2) CHECK (Assignment_Grade BETWEEN 0 AND 10),

    CONSTRAINT PK_Assessment PRIMARY KEY (University_ID, Section_ID, Course_ID, Semester, Assessment_ID),
    
    CONSTRAINT CK_Assessment_Dates CHECK (Registration_Date <= Potential_Withdrawal_Date),
    
    CONSTRAINT FK_Assessment_Student FOREIGN KEY (University_ID)
        REFERENCES [Student](University_ID),
        
    CONSTRAINT FK_Assessment_Section FOREIGN KEY (Section_ID, Course_ID, Semester) 
        REFERENCES [Section](Section_ID, Course_ID, Semester)
);
GO

CREATE TABLE [Feedback] (
    feedback NVARCHAR(255) NOT NULL,
    University_ID DECIMAL(7,0) NOT NULL,
    Section_ID NVARCHAR(10) NOT NULL, 
    Course_ID NVARCHAR(15) NOT NULL,
    Semester NVARCHAR(10) NOT NULL,
    Assessment_ID INT NOT NULL,
    
    CONSTRAINT PK_Feedback PRIMARY KEY 
        (feedback, University_ID, Section_ID, Course_ID, Semester, Assessment_ID), 
        
    CONSTRAINT FK_Feedback_Assessment FOREIGN KEY 
        (University_ID, Section_ID, Course_ID, Semester, Assessment_ID) 
        REFERENCES [Assessment](University_ID, Section_ID, Course_ID, Semester, Assessment_ID)
);
GO

CREATE TABLE [Building](
    Building_ID INT IDENTITY(0,1) PRIMARY KEY,
    Building_Name NVARCHAR(10) NOT NULL UNIQUE
);
GO

CREATE TABLE [Room](
    Room_ID INT IDENTITY(0,1) NOT NULL, 
    Building_ID INT NOT NULL,
    Capacity INT DEFAULT 30 CHECK (Capacity BETWEEN 1 AND 300),

    CONSTRAINT PK_Room PRIMARY KEY (Building_ID, Room_ID),
    
    CONSTRAINT FK_Room_Building FOREIGN KEY (Building_ID)
        REFERENCES [Building](Building_ID)
);
GO

CREATE TABLE [Room_Equipment](
    Equipment_Name NVARCHAR(100) NOT NULL,
    Building_ID INT NOT NULL,
    Room_ID INT NOT NULL,
    
    CONSTRAINT PK_Room_Equipment PRIMARY KEY (Building_ID, Room_ID, Equipment_Name),
    
    CONSTRAINT FK_Equipment_Room FOREIGN KEY (Building_ID, Room_ID)
        REFERENCES [Room](Building_ID, Room_ID)
);
GO

CREATE TABLE [takes_place](
	Section_ID NVARCHAR(10) NOT NULL, 
	Course_ID NVARCHAR(15) NOT NULL, 
    Semester NVARCHAR(10) NOT NULL, 
	Room_ID INT NOT NULL,
	Building_ID INT NOT NULL,
	
	CONSTRAINT PK_Place PRIMARY KEY (Section_ID, Course_ID, Semester, Room_ID, Building_ID), 
	
	CONSTRAINT FK_Place_Section FOREIGN KEY (Section_ID, Course_ID, Semester)
        REFERENCES [Section](Section_ID, Course_ID, Semester),

	CONSTRAINT FK_Place_Room FOREIGN KEY (Building_ID, Room_ID)
        REFERENCES [Room](Building_ID, Room_ID)
);
GO

CREATE TABLE [Platform](
	Platform_ID INT IDENTITY(0,1) PRIMARY KEY,
	[Name] NVARCHAR(50)
);
GO

CREATE TABLE [Platform_Link](
    Platform_ID INT NOT NULL,
    Link NVARCHAR(255) NOT NULL,
    CONSTRAINT PK_Platform_Link PRIMARY KEY (Platform_ID, Link),
    CONSTRAINT FK_Link_Platform FOREIGN KEY (Platform_ID)
        REFERENCES [Platform](Platform_ID)
);
GO

-- 7. Bảng ONLINE --- ĐÃ SỬA ---
CREATE TABLE [Online](
	Platform_ID INT NOT NULL,
	Section_ID NVARCHAR(10) NOT NULL, -- ĐÃ SỬA: từ INT sang NVARCHAR
	Course_ID NVARCHAR(15) NOT NULL, -- ĐÃ SỬA: (từ script của bạn)
    Semester NVARCHAR(10) NOT NULL, -- ĐÃ SỬA: Thêm Semester để khớp FK
	
	CONSTRAINT PK_Online PRIMARY KEY (Platform_ID, Section_ID, Course_ID, Semester), -- ĐÃ SỬA: Thêm Semester vào PK
	
	CONSTRAINT FK_Online_Platform FOREIGN KEY (Platform_ID)
        REFERENCES [Platform](Platform_ID),
	
	CONSTRAINT FK_Online_Section FOREIGN KEY (Section_ID, Course_ID, Semester) -- ĐÃ SỬA: Thêm Semester vào FK
    	REFERENCES [Section](Section_ID, Course_ID, Semester)
);
GO

CREATE TABLE [Quiz] (
    University_ID DECIMAL(7,0) NOT NULL,
    Section_ID NVARCHAR(10) NOT NULL, 
    Course_ID NVARCHAR(15) NOT NULL,
    Semester NVARCHAR(10) NOT NULL, 
    Assessment_ID INT NOT NULL,
    
    CONSTRAINT PK_Quiz PRIMARY KEY (University_ID, Section_ID, Course_ID, Semester, Assessment_ID), 
    
    CONSTRAINT FK_Quiz_Assessment FOREIGN KEY (University_ID, Section_ID, Course_ID, Semester, Assessment_ID) 
        REFERENCES [Assessment](University_ID, Section_ID, Course_ID, Semester, Assessment_ID),

    Grading_method NVARCHAR(50) DEFAULT 'Highest Attemp' CHECK (Grading_method IN (
        'Highest Attemp',
        'Last Attemp'
    )),
    
    pass_score DECIMAL(3,1) DEFAULT 5 CHECK (pass_score BETWEEN 0 AND 10),
    
    Time_limits TIME NOT NULL,
    [Start_Date] DATETIME NOT NULL,
    End_Date DATETIME NOT NULL,
    
    CONSTRAINT CK_Quiz_Dates CHECK ([Start_Date] < End_Date),
    
    Responses NVARCHAR(100),
    completion_status NVARCHAR(100) DEFAULT 'Not Taken' CHECK (completion_status IN ('Not Taken', 'In Progress', 'Submitted', 'Passed', 'Failed')),
    
    score DECIMAL(4,2) DEFAULT 0 CHECK (score BETWEEN 0 AND 10),
    
    content NVARCHAR(100) NOT NULL,
    [types] NVARCHAR(50),
    [Weight] FLOAT CHECK (Weight >= 0),
    Correct_answer NVARCHAR(50) NOT NULL
);
GO


CREATE TABLE [Assignment] (
    University_ID DECIMAL(7,0) NOT NULL,
    Section_ID NVARCHAR(10) NOT NULL, 
    Course_ID NVARCHAR(15) NOT NULL, 
    Semester NVARCHAR(10) NOT NULL,
    Assessment_ID INT NOT NULL,
    
    CONSTRAINT PK_Assignment PRIMARY KEY (University_ID, Section_ID, Course_ID, Semester, Assessment_ID), 
    
    CONSTRAINT FK_Assignment_Assessment FOREIGN KEY (University_ID, Section_ID, Course_ID, Semester, Assessment_ID) 
        REFERENCES [Assessment](University_ID, Section_ID, Course_ID, Semester, Assessment_ID),

    MaxScore INT DEFAULT 10 CHECK (MaxScore BETWEEN 0 AND 10),
    accepted_specification NVARCHAR(50),
    submission_deadline DATETIME NOT NULL,
    instructions NVARCHAR(50)
);
GO


CREATE TABLE [Submission] (
    Submission_No INT IDENTITY(0,1) PRIMARY KEY,
    University_ID DECIMAL(7,0) NOT NULL,
    Section_ID NVARCHAR(10) NOT NULL, 
    Course_ID NVARCHAR(15) NOT NULL, 
    Semester NVARCHAR(10) NOT NULL, 
    Assessment_ID INT NOT NULL,
	accepted_specification NVARCHAR(50),
	late_flag_indicator BIT DEFAULT 0,
	SubmitDate DATETIME DEFAULT GETDATE(),
	attached_files NVARCHAR(50),
	[status] NVARCHAR(50) DEFAULT 'Submitted' CHECK ([status] IN ('No Submission', 'Submitted')),
	
    CONSTRAINT FK_Submission_Assignment FOREIGN KEY 
        (University_ID, Section_ID, Course_ID, Semester, Assessment_ID) 
        REFERENCES [Assignment](University_ID, Section_ID, Course_ID, Semester, Assessment_ID)
);
GO

CREATE TABLE [review](
    Submission_No INT NOT NULL PRIMARY KEY,
    University_ID DECIMAL(7,0) NOT NULL,
    Score INT CHECK (Score BETWEEN 0 AND 10),
    Comments NVARCHAR(500),
	
    CONSTRAINT FK_Review_Submission FOREIGN KEY (Submission_No)
        REFERENCES [Submission](Submission_No),
	CONSTRAINT FK_Review_Tutor FOREIGN KEY (University_ID)
        REFERENCES [Tutor](University_ID)
);
GO
