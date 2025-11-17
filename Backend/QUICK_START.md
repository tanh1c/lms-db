# Quick Start Guide - Connecting Frontend to SQL Server

## Prerequisites
- SQL Server 2019+ installed and running
- Node.js 18+ installed
- Database `lms_system` created (see `db/README.md`)

## 3-Step Setup

### Step 1: Set Up Database
```bash
# In SQL Server Management Studio, run:
# 1. db/create_database.sql
# 2. db/database/lms_database.sql  
# 3. db/insert/*.sql (all insert scripts)
```

### Step 2: Configure and Start Backend
```bash
cd Backend/server
pip install -r requirements.txt
# Create .env file with your SQL Server credentials
# Edit .env with your SQL Server credentials
python app.py
```

### Step 3: Configure and Start Frontend
```bash
# In Frontend directory, create .env file:
cd Frontend
echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env

# Start frontend:
npm run dev
```

## Verify It Works

1. **Backend:** Check console for "✅ Connected to SQL Server database"
2. **Frontend:** Open browser, try logging in with a university ID from your database
3. **API:** Visit `http://localhost:3001/api/health` - should return `{"status":"ok"}`

## Default Configuration

- **Backend Port:** 3001
- **Frontend Port:** 5173 (Vite default)
- **Database:** lms_system
- **API Base URL:** http://localhost:3001/api

## Troubleshooting

**Backend won't connect?**
- Check SQL Server is running
- Verify credentials in `Backend/server/.env`
- Check TCP/IP is enabled in SQL Server Configuration Manager
- Verify Python dependencies: `pip install -r requirements.txt`

**Frontend shows errors?**
- Make sure backend is running
- Check `VITE_API_BASE_URL` in frontend `.env`
- Check browser console for errors

**No data showing?**
- Verify database has data (run insert scripts)
- Check backend console for SQL errors
- Check browser network tab for failed API calls










