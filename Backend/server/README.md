# LMS Backend API Server

Backend API server for the LMS (Learning Management System) that connects to Microsoft SQL Server database.

## Prerequisites

- Python 3.8+ 
- Microsoft SQL Server 2019 or later
- SQL Server database `lms_system` (see `/db` folder for setup)

## Installation

1. Navigate to the server directory:
```bash
cd Backend/server
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your SQL Server credentials:
```bash
# Create .env file manually or copy from .env.example if available
```

4. Update `.env` with your SQL Server credentials:
```env
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=lms_system
DB_USER=sa
DB_PASSWORD=YourPassword123
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

PORT=3001
NODE_ENV=development
```

## Running the Server

### Development Mode
```bash
python app.py
```

### Production Mode
```bash
# Use a production WSGI server like gunicorn
gunicorn -w 4 -b 0.0.0.0:3001 app:app
```

The server will start on `http://localhost:3001` (or the port specified in `.env`).

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/role/:role` - Get users by role (student/tutor/admin)
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `GET /api/courses/:id/sections` - Get sections by course
- `GET /api/courses/:courseId/sections/:sectionId` - Get section by ID

### Assignments
- `GET /api/assignments/user/:userId` - Get assignments for user
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments/:id/submit` - Submit assignment

### Students
- `GET /api/students/course/:courseId` - Get students by course

### Quizzes
- `GET /api/quizzes/user/:userId` - Get quizzes for user
- `GET /api/quizzes/:id` - Get quiz by ID

### Grades
- `GET /api/grades/user/:userId` - Get grades for user

### Schedule
- `GET /api/schedule/user/:userId` - Get schedule for user

## Database Setup

Before running the server, make sure your SQL Server database is set up:

1. Run `db/create_database.sql` to create the database
2. Run `db/database/lms_database.sql` to create tables
3. Run the insert scripts in `db/insert/` to populate data

See `/db/README.md` for detailed database setup instructions.

## Frontend Configuration

Update your frontend `.env` file (or `vite.config.ts`) to point to the API:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to SQL Server:

1. **Check SQL Server is running**: Make sure SQL Server service is running
2. **Check TCP/IP is enabled**: In SQL Server Configuration Manager, enable TCP/IP protocol
3. **Check firewall**: Ensure port 1433 (or your custom port) is open
4. **Check credentials**: Verify username and password in `.env`
5. **Check server name**: Use `localhost` or `127.0.0.1` for local connections, or the server name for remote connections

### Authentication Issues

- If using Windows Authentication, you may need to modify the connection string
- For SQL Server Authentication, ensure the user has proper permissions

### Port Already in Use

If port 3001 is already in use, change the `PORT` in `.env` file.






