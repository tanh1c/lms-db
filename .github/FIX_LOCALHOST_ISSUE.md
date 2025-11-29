# 🔧 Sửa lỗi: Frontend vẫn dùng localhost:3001

## 🔴 Vấn đề

Frontend vẫn gọi API đến `http://localhost:3001/api` thay vì Azure App Service.

**Nguyên nhân:**
- Environment variable `VITE_API_BASE_URL` chưa được set
- Hoặc đã set nhưng chưa redeploy
- Hoặc đang chạy local development

## ✅ Giải pháp

### Kiểm tra: Bạn đang chạy ở đâu?

**Option 1: Đang chạy trên Vercel (Production)**

Nếu bạn đang xem frontend trên Vercel (ví dụ: `lms-db-alpha.vercel.app`):

1. **Kiểm tra Environment Variable:**
   - Vercel Dashboard → Project → **Settings** → **Environment Variables**
   - Xem có `VITE_API_BASE_URL` chưa?
   - Giá trị có đúng `https://hcmut-lms-deploy.azurewebsites.net/api` không?

2. **Nếu chưa có hoặc sai:**
   - Thêm/sửa: `VITE_API_BASE_URL` = `https://hcmut-lms-deploy.azurewebsites.net/api`
   - Environment: **Production** và **Preview**

3. **Redeploy:**
   - Vercel → **Deployments** → Click **"..."** trên deployment mới nhất
   - Click **"Redeploy"**
   - ⚠️ **QUAN TRỌNG**: Phải redeploy sau khi thêm/sửa environment variable

**Option 2: Đang chạy local (Development)**

Nếu bạn đang chạy `npm run dev` trên máy local:

1. **Tạo file `.env` trong Frontend folder:**
   ```
   VITE_API_BASE_URL=https://hcmut-lms-deploy.azurewebsites.net/api
   ```

2. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   # Start lại
   npm run dev
   ```

## 🔍 Cách kiểm tra Environment Variable

### Trong Browser Console:

1. Mở frontend (Vercel hoặc local)
2. Mở **Developer Tools** (F12)
3. Vào tab **Console**
4. Gõ:
   ```javascript
   console.log(import.meta.env.VITE_API_BASE_URL)
   ```

**Kết quả mong đợi:**
- ✅ Nếu thấy: `https://hcmut-lms-deploy.azurewebsites.net/api` → Đúng
- ❌ Nếu thấy: `undefined` hoặc `http://localhost:3001/api` → Chưa set hoặc chưa redeploy

## 📝 Checklist

### Nếu chạy trên Vercel:

- [ ] Vào Vercel → Settings → Environment Variables
- [ ] Kiểm tra có `VITE_API_BASE_URL` chưa
- [ ] Giá trị = `https://hcmut-lms-deploy.azurewebsites.net/api`
- [ ] Environment: Production và Preview
- [ ] **Redeploy** frontend (quan trọng!)
- [ ] Kiểm tra lại trong browser console

### Nếu chạy local:

- [ ] Tạo file `Frontend/.env`
- [ ] Thêm: `VITE_API_BASE_URL=https://hcmut-lms-deploy.azurewebsites.net/api`
- [ ] Restart dev server
- [ ] Kiểm tra lại trong browser console

## ⚠️ Lưu ý quan trọng

### Vite Environment Variables:

1. **Phải bắt đầu bằng `VITE_`** để được expose ra browser
2. **Phải rebuild/redeploy** sau khi thay đổi
3. **Không commit `.env`** vào Git (thêm vào `.gitignore`)

### Vercel:

- Environment variables chỉ áp dụng sau khi **redeploy**
- Mỗi environment (Production/Preview) cần set riêng
- Có thể set cho cả 3: Production, Preview, Development

## 🎯 Tóm tắt

**Nếu trên Vercel:**
1. Set `VITE_API_BASE_URL` trong Vercel Settings
2. **Redeploy** (quan trọng!)
3. Kiểm tra lại

**Nếu local:**
1. Tạo `Frontend/.env` với `VITE_API_BASE_URL`
2. Restart dev server
3. Kiểm tra lại

## 🔍 Debug

Nếu vẫn không hoạt động:

1. **Kiểm tra trong Network tab:**
   - Xem request URL có đúng không
   - Xem có CORS error không

2. **Kiểm tra build:**
   - Vercel → Deployments → Build Logs
   - Xem environment variable có được inject vào build không

3. **Clear cache:**
   - Browser: Hard refresh (Ctrl+Shift+R)
   - Hoặc clear browser cache

