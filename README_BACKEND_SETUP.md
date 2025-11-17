# Backend API Setup Guide

This guide explains how to connect your frontend LMS application to a Microsoft SQL Server database.

## Overview

The project now includes a backend API server that connects to SQL Server and serves data to the frontend. The frontend has been updated to use real API calls instead of mock data.

## Architecture

```
┌─────────────┐         HTTP/REST         ┌─────────────┐
│   Frontend  │ ────────────────────────> │   Backend   │
│  (React)    │ <──────────────────────── │  (Express)  │
└─────────────┘                           └─────────────┘
                                                  │
                                                  │ SQL
                                                  ▼
                                          ┌─────────────┐
                                          │ SQL Server  │
                                          │  Database   │
                                          └─────────────┘
```

## Setup Steps

### 1. Database Setup

First, set up your SQL Server database:

1. **Create the database:**
   ```sql
   -- Run: db/create_database.sql
   ```

2. **Create tables:**
   ```sql
   -- Run: db/database/lms_database.sql
   ```

3. **Insert data:**
   ```sql
   -- Run scripts in: db/insert/
   ```

See `db/README.md` for detailed database setup instructions.

### 2. Backend Server Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Update with your SQL Server credentials:
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

4. **Start the server:**
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:3001`

### 3. Frontend Configuration

1. **Create `.env` file in project root:**
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with university ID and password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me?universityId=xxx` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/role/:role` - Get users by role
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

## Testing the Connection

1. **Test backend health:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Test database connection:**
   - Check server console for "✅ Connected to SQL Server database"
   - If you see connection errors, check your `.env` configuration

3. **Test login:**
   - Use a university ID from your database
   - The password should match what's in the `Account` table (or any password if not set)

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify Node.js version (18+)
- Check `.env` file exists and has correct values

### Database connection fails
- Verify SQL Server is running
- Check SQL Server credentials in `.env`
- Ensure TCP/IP is enabled in SQL Server Configuration Manager
- Check firewall settings for port 1433

### Frontend can't connect to API
- Verify backend is running on port 3001
- Check `VITE_API_BASE_URL` in frontend `.env`
- Check browser console for CORS errors (should be handled by backend)

### Data not showing
- Verify database has data (run insert scripts)
- Check browser network tab for API errors
- Check backend console for SQL errors

## Development Workflow

1. **Start SQL Server** (if not running as service)
2. **Start backend:** `cd server && npm run dev`
3. **Start frontend:** `npm run dev`
4. **Access frontend:** `http://localhost:5173` (or your Vite port)

## Production Deployment

For production:

1. **Backend:**
   - Set `NODE_ENV=production`
   - Use environment variables from your hosting provider
   - Consider using connection pooling and error handling

2. **Frontend:**
   - Update `VITE_API_BASE_URL` to production API URL
   - Build: `npm run build`

3. **Database:**
   - Use Azure SQL Database or SQL Server on a server
   - Update connection string accordingly
   - Enable SSL/TLS encryption

## Files Changed

### New Backend Files:
- `server/` - Complete backend API server
  - `index.js` - Main server file
  - `config/database.js` - Database connection
  - `routes/` - API route handlers

### Updated Frontend Files:
- `src/lib/api/*` - All services now use real API calls
- `src/lib/api/config.ts` - API configuration
- `src/lib/api/client.ts` - Axios client with interceptors

## Next Steps

- [ ] Implement file upload for assignments
- [ ] Add JWT authentication
- [ ] Add request validation
- [ ] Add error logging
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add unit tests







