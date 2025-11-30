# LMS (Learning Management System)

A comprehensive Learning Management System built with React and TypeScript for the frontend, and Flask with Python for the backend, integrated with Azure SQL Database.

## Project Structure

```
lms-db/
├── Backend/                # Backend API Server (Flask + Python)
│   └── server/             # Flask application
│       ├── app.py          # Main application file
│       ├── config/         # Database configuration
│       ├── routes/         # API routes
│       ├── utils/          # Utility functions (JWT, Azure Storage)
│       ├── Dockerfile      # Docker image for production
│       ├── pyproject.toml  # Poetry dependencies
│
├── Frontend/           # Frontend Application (React + TypeScript)
│   ├── src/            # Source code
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── lib/        # Utilities and API clients
│   │   ├── store/      # State management (Zustand)
│   │   ├── i18n/       # Internationalization
│   │   └── types/      # TypeScript type definitions
│   ├── public/         # Static assets
│   ├── Dockerfile      # Production Docker image
│   ├── Dockerfile.dev  # Development Docker image
│   ├── package.json    # Node.js dependencies
│   └── vercel.json     # Vercel deployment configuration
│
├── docker-compose.yml          # Production Docker Compose configuration
├── docker-compose.dev.yml      # Development Docker Compose configuration
├── .github/                    # GitHub Actions workflows and documentation
│   └── workflows/
│       └── deploy-backend.yml  # CI/CD pipeline for backend deployment
└── README.md                   # Project documentation
```

## Quick Start

### Prerequisites

- Azure SQL Database or SQL Server instance
- **For Docker (Recommended)**: Docker Desktop or Docker Engine installed
- **For Manual Setup**: Python 3.9+, Node.js 18+, and Poetry

---

## 🐳 Docker Setup (Recommended - Easiest Way)

**Why Docker?** Docker automatically handles all dependencies and configurations. You don't need to install Python, Node.js, or Poetry separately.

**Prerequisites:**
- Docker Desktop or Docker Engine installed
- Docker Compose installed (included with Docker Desktop)

**Quick Start with Docker:**

1. Configure environment variables:
   - Ensure `Backend/server/.env` file exists with your database credentials
   - The frontend will automatically use `http://localhost:3001/api` as the API base URL

2. Build and start all services:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001/api`
   - Health Check: `http://localhost:3001/api/health`

**Development Mode with Hot Reload:**

For development with hot reload enabled:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Note:** This command will:
- ✅ **Build images** (if needed or if `--build` flag is used)
- ✅ **Start containers** (run the services)
- ✅ **Show logs** in the terminal (press `Ctrl+C` to stop)

If you want to run in the background (detached mode):
```bash
docker-compose -f docker-compose.dev.yml up --build -d
```

**How Hot Reload Works:**
- ✅ **No need to enter the container** - Just edit code on your local machine
- ✅ **Automatic reload** - Changes are detected automatically:
  - **Frontend**: Edit files in `Frontend/src/` → Browser updates instantly (Vite HMR)
  - **Backend**: Edit files in `Backend/server/` → Flask server auto-reloads
- ✅ **Volume mounts** - Your local code is mounted into containers, so changes are immediate
- ✅ **Just save your files** - That's it! No manual restart needed

**Example workflow:**
1. Start containers: `docker-compose -f docker-compose.dev.yml up --build`
2. Edit `Frontend/src/App.tsx` on your computer
3. Save the file
4. Browser automatically updates! ✨

**Useful Docker Commands:**

**Starting Services:**
- Start services (build if needed): `docker-compose up`
- Start with rebuild: `docker-compose up --build`
- Start in background: `docker-compose up -d`
- Start specific service: `docker-compose up backend`

**Building Only (without running):**
- Build images only: `docker-compose build`
- Rebuild specific service: `docker-compose build backend`
- Force rebuild without cache: `docker-compose build --no-cache`

**Managing Containers:**
- Stop all services: `docker-compose down`
- View logs: `docker-compose logs -f`
- Rebuild services: `docker-compose up --build`
- Stop and remove volumes: `docker-compose down -v`
- Run in detached mode: `docker-compose up -d`

**Docker Services:**
- `backend`: Flask API server (port 3001)
- `frontend`: React/Vite application (port 5173 in dev, port 80 in production)

---

## 📦 Manual Setup (Alternative)

If you prefer to run the services manually without Docker, follow these instructions:

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

## CI/CD Architecture

This project implements a fully automated CI/CD pipeline using **GitHub Actions** for continuous integration and deployment to **Azure App Service**.

### Deployment Flow

```
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │ Push code (Backend/server/**)
       ▼
┌─────────────────────┐
│  GitHub Actions     │
│  (CI/CD Pipeline)   │
└──────┬──────────────┘
       │
       ├─► 1. Checkout code
       ├─► 2. Setup Docker Buildx
       ├─► 3. Login to Container Registry (GHCR)
       ├─► 4. Build Docker Image from Dockerfile
       ├─► 5. Push Image to Registry (tagged: latest + commit SHA)
       ├─► 6. Login to Azure (Service Principal)
       └─► 7. Deploy to Azure App Service
              └─► Pull image and run container
```

### Components

#### 1. **GitHub Actions Workflow** (`.github/workflows/deploy-backend.yml`)
- **Trigger**: Automatically runs on push to `main`/`master` branch when `Backend/server/**` files change
- **Manual Trigger**: Can also be triggered manually via `workflow_dispatch`
- **Key Steps**:
  1. Checkout source code
  2. Setup Docker Buildx for multi-platform builds
  3. Authenticate with GitHub Container Registry (GHCR)
  4. Build Docker image from `Backend/server/Dockerfile`
  5. Push image to GHCR with tags: `latest` and `{commit-sha}`
  6. Authenticate with Azure using Service Principal
  7. Deploy image to Azure App Service

#### 2. **Docker Image** (`Backend/server/Dockerfile`)
- **Base Image**: `python:3.11-slim`
- **Build Process**:
  1. Install system dependencies (gcc, unixodbc-dev)
  2. Install Poetry for dependency management
  3. Copy `pyproject.toml` and `poetry.lock`
  4. Install Python dependencies via Poetry
  5. Copy application code
  6. Expose port 3001
  7. Run application: `poetry run python app.py`

#### 3. **Container Registry: GitHub Container Registry (GHCR)**
- **URL Format**: `ghcr.io/{username}/lms-backend`
- **Advantages**: Free, integrated with GitHub, no additional setup required
- **Authentication**: Uses `GITHUB_TOKEN` (automatically available in GitHub Actions)
- **Image Tags**:
  - `ghcr.io/{username}/lms-backend:latest` - Always points to the latest build
  - `ghcr.io/{username}/lms-backend:{commit-sha}` - Immutable tag for each commit (enables easy rollback)

#### 4. **Azure App Service**
- **Type**: Linux Container
- **Publishing Method**: Docker Container
- **Port**: 3001
- **Container Configuration**:
  - **Image Source**: GitHub Container Registry (GHCR)
  - **Image**: `ghcr.io/{username}/lms-backend:latest`
  - **Registry Server URL**: `ghcr.io`
  - **Authentication**: GitHub Personal Access Token (PAT) with `read:packages` scope

#### 5. **Azure Service Principal**
- **Purpose**: Enables GitHub Actions to authenticate with Azure
- **Credentials**: Stored securely in GitHub Secrets as `AZURE_CREDENTIALS` (JSON format)
- **Required Permissions**: "Contributor" role on the Resource Group containing the App Service

### Required Configuration

#### GitHub Secrets
1. **`AZURE_CREDENTIALS`**: Service Principal credentials in JSON format
   ```json
   {
     "clientId": "...",
     "clientSecret": "...",
     "tenantId": "...",
     "subscriptionId": "..."
   }
   ```

#### Azure App Service Environment Variables
Configure the following in Azure Portal → App Service → Configuration → Application settings:
- `PORT=3001`
- `DB_SERVER={azure-sql-server}.database.windows.net`
- `DB_DATABASE={database-name}`
- `DB_USER={username}`
- `DB_PASSWORD={password}`
- `JWT_SECRET={secret-key}`
- `JWT_EXPIRES_IN=24h`
- `AZURE_STORAGE_CONNECTION_STRING={connection-string}`
- `AZURE_STORAGE_ACCOUNT_NAME={account-name}`

### Benefits

1. **Automation**: No manual deployment required - push code and it deploys automatically
2. **Version Control**: Each commit has its own immutable Docker image tag for easy rollback
3. **Consistency**: Development and production environments use the same Docker image
4. **Scalability**: Azure App Service can automatically scale based on demand
5. **Security**: Secrets are managed securely in GitHub Secrets and Azure Key Vault
6. **Cost-Effective**: Uses free GitHub Container Registry (GHCR) instead of paid Azure Container Registry

### Deployment Process

1. **Developer pushes code** to `Backend/server/**` directory
2. **GitHub Actions workflow triggers** automatically
3. **Docker image is built** from `Backend/server/Dockerfile`
4. **Image is pushed** to GHCR with `latest` and `{commit-sha}` tags
5. **Azure App Service pulls** the new image from GHCR
6. **Container restarts** with the new image
7. **Health checks** ensure the application is running correctly

### Alternative: Azure Container Registry (ACR)

The workflow also supports Azure Container Registry (ACR) as an alternative to GHCR:
- Set `AZURE_CONTAINER_REGISTRY` environment variable in the workflow
- Configure `AZURE_CONTAINER_REGISTRY` and `AZURE_CONTAINER_REGISTRY_PASSWORD` GitHub Secrets
- Set `USE_GITHUB_REGISTRY: false` in the workflow

**Note**: ACR requires a paid Azure subscription, while GHCR is free for public repositories.

### Troubleshooting

- **Build failures**: Check `Dockerfile` syntax and `pyproject.toml` dependencies
- **Deployment failures**: Verify `AZURE_WEBAPP_NAME` matches your App Service name and Service Principal has "Contributor" role
- **Container startup issues**: Check environment variables in Azure App Service and review logs in Azure Portal → Log stream

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
