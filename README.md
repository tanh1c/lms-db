# LMS (Learning Management System)

A comprehensive Learning Management System built with React and TypeScript for the frontend, and Flask with Python for the backend, integrated with Azure SQL Database.

## Project Structure

```
BTL/
├── Backend/          # Backend API Server (Flask + Python)
│   └── server/       # Flask application
│       ├── app.py    # Main application file
│       ├── config/   # Database configuration
│       ├── routes/   # API routes
│       ├── procedures/ # SQL stored procedures
│       └── deploy_procedures.py # Procedure deployment script
│
└── Frontend/         # Frontend Application (React + TypeScript)
    ├── src/          # Source code
    ├── public/       # Static assets
    └── package.json
```

## Quick Start

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- Poetry (Python dependency management tool)
- Azure SQL Database or SQL Server instance

### Backend Setup

**Install Poetry:**

For Windows (PowerShell):
```bash
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
```

For macOS/Linux:
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

Alternatively, install via pip:
```bash
pip install poetry
```

**Configure and Run Backend:**

1. Navigate to the backend directory:
```bash
cd Backend/server
```

2. Install dependencies:
```bash
poetry install
```

3. Create environment configuration file:
   - Copy `.env.example` to `.env`
   - Fill in your SQL Server database credentials

4. Deploy stored procedures to the database:
```bash
poetry run python deploy_procedures.py
```

5. Start the server:
```bash
poetry run python app.py
```

Alternatively, activate the Poetry shell:
```bash
cd Backend/server
poetry shell
python app.py
```

The backend server runs on `http://localhost:3001` by default.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration file:
   - Create a `.env` file in the `Frontend/` directory
   - Add the following line:
   ```
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

4. Start the development server:
```bash
npm run dev
```

The frontend application runs on `http://localhost:5173` by default.

## Technology Stack

### Backend Technologies

- **Python 3.9+** - Programming language
- **Poetry** - Dependency management and packaging
- **Flask 3.0.0** - Web framework
- **SQL Server (Azure SQL Database)** - Relational database management system
- **pymssql 2.2.11** - SQL Server database driver
- **bcrypt 4.1.2** - Password hashing library
- **pyjwt 2.8.0** - JSON Web Token implementation
- **Stored Procedures** - Database logic encapsulation for improved performance and security

### Frontend Technologies

- **React 18** - User interface library
- **TypeScript** - Typed superset of JavaScript
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **React Router v7** - Client-side routing
- **Zustand** - State management library
- **GSAP** - Animation library
- **react-i18next** - Internationalization framework
- **Recharts** - Composable charting library
- **@tanstack/react-table** - Headless UI for building data tables

## Environment Variables

### Backend Configuration

Create a `.env` file in `Backend/server/` with the following variables:

```env
# Database Configuration
DB_SERVER=your-server.database.windows.net
DB_PORT=1433
DB_DATABASE=lms_system
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# Server Configuration
PORT=3001
NODE_ENV=development
```

**Security Note:** The `.env` file is excluded from version control via `.gitignore` to protect sensitive credentials.

### Frontend Configuration

Create a `.env` file in `Frontend/` with the following variable:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

For production deployments, update this URL to point to your production backend API.

## Authentication

The system implements role-based authentication with three user types:

- **Student**: University_ID range 100000-199999
- **Tutor**: University_ID range 200000-2999999
- **Admin**: University_ID range 3000000 and above

**Login Credentials:**

Users authenticate using their University_ID and password. The system provides fallback authentication when the backend is unavailable:

- Student: University_ID `100001` / Password: `123456`
- Tutor: University_ID `200001` / Password: `123456`
- Admin: University_ID `3000001` / Password: `123456`

**Production Note:** When the backend is connected to the database, authentication uses actual user accounts stored in the database.

## Features

### Administrator Features

- **User Management**
  - Complete CRUD operations for Students, Tutors, and Administrators
  - User statistics visualization with pie and bar charts
  - Advanced data table with sorting, filtering, and pagination
  - Bulk operations for deleting multiple users
  - CSV export functionality
  - Password reset capabilities
  - Detailed user information view (courses, assignments, etc.)
  - User role modification

- **Course Management** - Create, read, update, and delete course records
- **Assignment Management** - Manage assignments and student submissions
- **Quiz Management** - Create and manage quiz assessments
- **Assessment and Grades Management** - Track and manage student grades
- **System Statistics Dashboard** - Overview of system-wide metrics and analytics

### Student Features

- View enrolled courses and course sections
- Submit assignment files
- Take online quizzes
- View grades and assessment results
- Access course schedule

### Tutor Features

- Manage assigned courses
- Grade student assignments
- Create and manage quizzes
- View student progress and performance

## API Endpoints

### Base URL

- Development: `http://localhost:3001/api`
- Production: Configure via Frontend environment variables

### Authentication Endpoints

- `POST /api/auth/login` - Authenticate user with University_ID and password
- `POST /api/auth/logout` - Terminate user session

### User Management Endpoints

- `GET /api/admin/users` - Retrieve all users
- `POST /api/admin/students` - Create new student account
- `PUT /api/admin/students/<id>` - Update student information
- `DELETE /api/admin/students/<id>` - Delete student account
- `POST /api/admin/tutors` - Create new tutor account
- `PUT /api/admin/tutors/<id>` - Update tutor information
- `DELETE /api/admin/tutors/<id>` - Delete tutor account
- `POST /api/admin/admins` - Create new administrator account
- `PUT /api/admin/admins/<id>` - Update administrator information
- `DELETE /api/admin/admins/<id>` - Delete administrator account
- `PUT /api/admin/users/<id>/role` - Modify user role
- `POST /api/admin/users/<id>/reset-password` - Reset user password to default
- `GET /api/admin/users/<id>/details` - Retrieve detailed user information

### System Management Endpoints

- `GET /api/admin/statistics` - Retrieve system-wide statistics
- `GET /api/admin/courses` - Retrieve all courses
- `POST /api/admin/courses` - Create new course
- `PUT /api/admin/courses/<id>` - Update course information
- `DELETE /api/admin/courses/<id>` - Delete course

Similar CRUD endpoints are available for assignments, quizzes, and assessments.

## Database

The system utilizes Azure SQL Database with stored procedures for all database operations. This architecture provides:

- **Performance Optimization** - Pre-compiled SQL statements for faster query execution
- **Security Enhancement** - Centralized business logic reduces SQL injection risks
- **Maintainability** - Database logic updates can be made without application code changes

### Database Schema

The database schema includes the following primary tables:

- `Users` - Core user information
- `Account` - User authentication credentials
- `Student` - Student-specific attributes
- `Tutor` - Tutor-specific attributes
- `Admin` - Administrator-specific attributes
- `Course` - Course catalog information
- `Section` - Course section details
- `Assessment` - Student assessment records
- `Assignment` - Assignment definitions
- `Quiz` - Quiz definitions
- `Submission` - Student assignment submissions

For the complete database schema, refer to `lms_database.sql` and `script.sql` files in the project root.

### Stored Procedures Deployment

Deploy all stored procedures to the database:

```bash
cd Backend/server
poetry run python deploy_procedures.py
```

This script deploys all stored procedures from `Backend/server/procedures/` to the configured database.

## Internationalization

The frontend application supports multiple languages:

- **Vietnamese (vi)** - Default language
- **English (en)**

Users can switch languages using the language selector in the application interface.

## Building for Production

### Backend Build

```bash
cd Backend/server
poetry build
```

### Frontend Build

```bash
cd Frontend
npm run build
```

The production build output is located in `Frontend/dist/`.

## Deployment

### Backend Deployment

The backend can be deployed to any Python-compatible hosting service, including:

- Heroku
- Railway
- Azure App Service
- AWS Elastic Beanstalk
- Google Cloud Run

Ensure that:
- Environment variables are properly configured on the hosting platform
- The database connection is accessible from the hosting service
- Required ports are open and accessible

### Frontend Deployment

The frontend can be deployed to static hosting services, including:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

Configuration requirements:
- Set the `VITE_API_BASE_URL` environment variable to your production backend API URL
- Configure routing for Single Page Application (SPA) behavior
- Ensure CORS is properly configured on the backend for the frontend domain

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeatureName`)
3. Commit your changes (`git commit -m 'Add YourFeatureName'`)
4. Push to the branch (`git push origin feature/YourFeatureName`)
5. Open a Pull Request

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.
