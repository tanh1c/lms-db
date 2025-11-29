# 🚀 Hướng dẫn Deploy lên Vercel

## ❓ Câu hỏi thường gặp

### 1. Có cần xóa node_modules trước khi deploy không?

**❌ KHÔNG CẦN!**

**Lý do:**
- `node_modules` đã có trong `.gitignore` → Không được commit lên Git
- Vercel tự động chạy `npm install` khi build
- Vercel sẽ tạo `node_modules` riêng của nó

**Bạn chỉ cần:**
- ✅ Commit code (không commit `node_modules`)
- ✅ Push lên GitHub
- ✅ Vercel tự động build

### 2. File .env local có ảnh hưởng đến Vercel không?

**❌ KHÔNG!**

**Lý do:**
- File `.env` đã có trong `.gitignore` → Không được commit
- Vercel không thấy file `.env` của bạn
- Vercel dùng environment variables từ Vercel Dashboard

**Bạn cần:**
- ✅ Set environment variables trong Vercel Dashboard
- ✅ Không cần commit file `.env`

### 3. Có cần thay đổi gì trong code không?

**❌ KHÔNG CẦN!**

Code đã đúng:
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
```

- **Local**: Dùng file `.env` → `http://localhost:3001/api` (fallback)
- **Vercel**: Dùng environment variable từ Dashboard → `https://hcmut-lms-deploy.azurewebsites.net/api`

## ✅ Checklist trước khi Deploy

### 1. Kiểm tra .gitignore

Đảm bảo `.gitignore` có:
```
node_modules
.env
.env.local
```

✅ Đã có trong `.gitignore` của bạn

### 2. Set Environment Variables trong Vercel

**QUAN TRỌNG**: Phải set trước khi deploy!

1. Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Thêm:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://hcmut-lms-deploy-ffhtdzdua0d6cme0.malaysiawest-01.azurewebsites.net/api`
   - **Environment**: ✅ Production, ✅ Preview
3. Click **"Save"**

### 3. Push code lên GitHub

```bash
git add .
git commit -m "Update frontend config"
git push origin main
```

Vercel sẽ tự động:
- ✅ Detect push
- ✅ Run `npm install`
- ✅ Run `npm run build`
- ✅ Deploy

## 🔄 Quy trình Deploy

### Local Development:
```
1. Tạo file Frontend/.env
2. Thêm: VITE_API_BASE_URL=https://hcmut-lms-deploy...azurewebsites.net/api
3. npm run dev
4. ✅ Frontend dùng .env file
```

### Vercel Production:
```
1. Set environment variable trong Vercel Dashboard
2. Push code lên GitHub
3. Vercel tự động build và deploy
4. ✅ Frontend dùng environment variable từ Vercel
```

## 📝 Tóm tắt

| Item | Local | Vercel |
|------|-------|--------|
| **Environment Variable** | File `.env` | Vercel Dashboard |
| **node_modules** | Có (local) | Vercel tự tạo khi build |
| **Cần xóa node_modules?** | ❌ Không | ❌ Không |
| **Cần commit .env?** | ❌ Không | ❌ Không |
| **Cần thay đổi code?** | ❌ Không | ❌ Không |

## ⚠️ Lưu ý

1. **File .env local KHÔNG ảnh hưởng Vercel**
   - `.env` đã trong `.gitignore`
   - Vercel không thấy file này
   - Phải set trong Vercel Dashboard

2. **node_modules KHÔNG cần xóa**
   - Đã trong `.gitignore`
   - Vercel tự động install khi build
   - Không cần commit

3. **Environment Variables phải set TRƯỚC khi deploy**
   - Nếu set sau, cần redeploy
   - Set cho cả Production và Preview

## 🎯 Kết luận

**Bạn KHÔNG CẦN:**
- ❌ Xóa node_modules
- ❌ Commit .env file
- ❌ Thay đổi code

**Bạn CHỈ CẦN:**
- ✅ Set `VITE_API_BASE_URL` trong Vercel Dashboard
- ✅ Push code lên GitHub
- ✅ Vercel tự động deploy

