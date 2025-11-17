# LMS (Learning Management System)

Hệ thống quản lý học tập với Frontend (React + TypeScript) và Backend (Flask + Python).

## 📁 Cấu trúc Project

```
BTL/
├── Backend/          # Backend API Server (Flask + Python)
│   ├── server/       # Flask application
│   │   ├── app.py    # Main application file
│   │   ├── config/   # Database configuration
│   │   └── routes/   # API routes
│   ├── README_BACKEND_SETUP.md
│   └── QUICK_START.md
│
└── Frontend/         # Frontend Application (React + TypeScript)
    ├── src/          # Source code
    ├── public/       # Static assets
    ├── package.json
    └── README.md
```

## 🚀 Quick Start

### Backend Setup

```bash
cd Backend/server
pip install -r requirements.txt
# Tạo .env file với SQL Server credentials
python app.py
```

Xem chi tiết: [Backend/README_BACKEND_SETUP.md](Backend/README_BACKEND_SETUP.md)

### Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

Xem chi tiết: [Frontend/README.md](Frontend/README.md)

## 🛠️ Tech Stack

### Backend
- Python 3.8+
- Flask
- SQL Server
- pymssql

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router v7
- Zustand
- GSAP

## 📝 Environment Variables

### Backend (.env trong Backend/server/)
```env
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=lms_system
DB_USER=sa
DB_PASSWORD=YourPassword123
PORT=3001
```

### Frontend (.env trong Frontend/)
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 📚 Documentation

- [Backend Setup Guide](Backend/README_BACKEND_SETUP.md)
- [Quick Start Guide](Backend/QUICK_START.md)
- [Frontend Documentation](Frontend/README.md)

## 📄 License

MIT

