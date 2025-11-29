# 🔧 Hướng dẫn Thêm Environment Variables trong Vercel

## 📍 Bạn đang ở đâu?

Bạn đang ở Vercel Dashboard → Project `lms-db` → Tab **"Overview"**

## ✅ Các bước thêm Environment Variables

### Bước 1: Vào Settings

1. Ở navigation bar trên cùng, click tab **"Settings"**
   - Các tabs: Overview | Deployments | Analytics | ... | **Settings**
2. Bạn sẽ vào trang Settings của project

### Bước 2: Tìm Environment Variables

1. Trong menu Settings bên trái, scroll xuống
2. Tìm và click **"Environment Variables"**
   - Hoặc vào trực tiếp: `https://vercel.com/[your-username]/lms-db/settings/environment-variables`

### Bước 3: Thêm Environment Variable

1. Click nút **"Add New"** (hoặc **"+ Add"**)
2. Điền form:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://hcmut-lms-deploy.azurewebsites.net/api`
   - **Environment**: Check các môi trường:
     - ✅ **Production** (cho production domain)
     - ✅ **Preview** (cho preview deployments)
     - ⚠️ **Development** (không cần, dùng local)
3. Click **"Save"** (hoặc **"Add"**)

### Bước 4: Redeploy

Sau khi thêm environment variable:

1. Vào tab **"Deployments"**
2. Tìm deployment mới nhất
3. Click **"..."** (3 chấm) → **"Redeploy"**
4. Hoặc push code mới lên GitHub

## 🔗 Đường dẫn nhanh

```
Vercel Dashboard
  ↓
Project: lms-db
  ↓
Tab: Settings (navigation bar)
  ↓
Menu bên trái: Environment Variables
  ↓
"+ Add New"
```

## 📝 Domain Vercel cần thêm vào CORS

Từ project của bạn:

### Production Domain:
```
https://lms-db-alpha.vercel.app
```

### Preview Domain Pattern:
```
https://*.vercel.app
```
(Cho tất cả preview deployments)

### Cách thêm vào Azure CORS:

1. **Azure Portal** → **App Services** → `hcmut-lms-deploy`
2. Menu bên trái → **API** → **CORS**
3. Thêm các origins:
   - `https://lms-db-alpha.vercel.app`
   - `https://*.vercel.app` (cho preview)
4. Click **"Save"**

## ✅ Checklist

- [ ] Vào Vercel → Settings → Environment Variables
- [ ] Thêm `VITE_API_BASE_URL` = `https://hcmut-lms-deploy.azurewebsites.net/api`
- [ ] Chọn Environment: Production và Preview
- [ ] Save
- [ ] Azure Portal → App Service → API → CORS
- [ ] Thêm `https://lms-db-alpha.vercel.app`
- [ ] Thêm `https://*.vercel.app` (cho preview)
- [ ] Save
- [ ] Redeploy frontend trên Vercel

## 🎯 Tóm tắt

**Environment Variables trong Vercel:**
- Tab: **Settings** → **Environment Variables**
- Key: `VITE_API_BASE_URL`
- Value: `https://hcmut-lms-deploy.azurewebsites.net/api`

**CORS trong Azure:**
- `https://lms-db-alpha.vercel.app` (production)
- `https://*.vercel.app` (preview)

