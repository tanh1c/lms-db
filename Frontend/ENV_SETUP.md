# 🔧 Hướng dẫn Setup Environment Variable cho Frontend

## ❌ Format SAI hiện tại

```
VITE_API_BASE_URL=hcmut-lms-deploy-ffhtdzdua0d6cme0.malaysiawest-01.azurewebsites.net
```

**Vấn đề:**
- ❌ Thiếu `https://` ở đầu
- ❌ Thiếu `/api` ở cuối

## ✅ Format ĐÚNG

Tạo file `Frontend/.env` với nội dung:

```env
VITE_API_BASE_URL=https://hcmut-lms-deploy-ffhtdzdua0d6cme0.malaysiawest-01.azurewebsites.net/api
```

**Hoặc dùng domain ngắn hơn (nếu có):**

```env
VITE_API_BASE_URL=https://hcmut-lms-deploy.azurewebsites.net/api
```

## 📍 Vị trí file `.env`

File `.env` phải ở **cùng cấp** với `package.json`:

```
Frontend/
├── .env              ← File này (cùng cấp với package.json)
├── package.json
├── vite.config.ts
├── src/
└── ...
```

## 🔄 Sau khi tạo/sửa file `.env`

**QUAN TRỌNG**: Phải **restart dev server** để Vite load environment variable mới:

1. **Stop dev server**: Nhấn `Ctrl+C` trong terminal
2. **Start lại**:
   ```bash
   cd Frontend
   npm run dev
   ```

## ✅ Kiểm tra

Sau khi restart, mở browser console, bạn sẽ thấy:

```
🔍 API_BASE_URL: https://hcmut-lms-deploy-ffhtdzdua0d6cme0.malaysiawest-01.azurewebsites.net/api
🔍 VITE_API_BASE_URL env: https://hcmut-lms-deploy-ffhtdzdua0d6cme0.malaysiawest-01.azurewebsites.net/api
```

**Nếu vẫn thấy `localhost:3001`**:
- ❌ File `.env` chưa được tạo đúng vị trí
- ❌ Dev server chưa được restart
- ❌ Format URL sai

## 📝 Tóm tắt

1. ✅ Tạo file `Frontend/.env`
2. ✅ Nội dung: `VITE_API_BASE_URL=https://hcmut-lms-deploy-ffhtdzdua0d6cme0.malaysiawest-01.azurewebsites.net/api`
3. ✅ **Restart dev server** (quan trọng!)
4. ✅ Kiểm tra console log

