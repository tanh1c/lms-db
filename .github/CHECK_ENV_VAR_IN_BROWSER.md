# 🔍 Cách Kiểm tra Environment Variable trong Browser

## ❌ Lỗi: "Cannot use 'import.meta' outside a module"

Bạn không thể dùng `import.meta.env` trực tiếp trong browser console vì nó chỉ hoạt động trong module context.

## ✅ Cách kiểm tra đúng

### Cách 1: Kiểm tra qua API Config (Khuyến nghị)

1. Mở Browser Console (F12)
2. Gõ:
   ```javascript
   // Import config từ window object (nếu có)
   // Hoặc kiểm tra qua Network tab
   ```

### Cách 2: Kiểm tra qua Network Tab (Dễ nhất)

1. Mở **Network tab** trong DevTools
2. Thử login hoặc gọi API
3. Xem request URL:
   - ✅ Nếu thấy: `https://hcmut-lms-deploy.azurewebsites.net/api/auth/login` → Đúng
   - ❌ Nếu thấy: `http://localhost:3001/api/auth/login` → Sai (vẫn dùng localhost)

### Cách 3: Thêm debug code tạm thời

Thêm vào file `Frontend/src/lib/api/config.ts`:

```typescript
// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Debug: Log để kiểm tra
console.log('API_BASE_URL:', API_BASE_URL)
console.log('VITE_API_BASE_URL env:', import.meta.env.VITE_API_BASE_URL)

export const apiConfig = {
  baseURL: API_BASE_URL,
  // ...
}
```

Sau đó:
1. Rebuild/redeploy frontend
2. Mở browser console
3. Xem log `API_BASE_URL`

### Cách 4: Kiểm tra trong Sources tab

1. DevTools → **Sources** tab
2. Tìm file `config.ts` hoặc bundle file
3. Search `VITE_API_BASE_URL` hoặc `localhost:3001`
4. Xem giá trị được hardcode hay từ environment variable

## 🎯 Cách nhanh nhất: Kiểm tra Network Tab

**Đây là cách dễ nhất và chính xác nhất:**

1. Mở **Network tab** (F12 → Network)
2. Thử login hoặc gọi bất kỳ API nào
3. Xem **Request URL** trong request details

**Kết quả:**
- ✅ `https://hcmut-lms-deploy.azurewebsites.net/api/...` → Đúng
- ❌ `http://localhost:3001/api/...` → Vẫn dùng localhost

## 🔧 Nếu vẫn thấy localhost

### Trên Vercel:

1. **Kiểm tra Environment Variable:**
   - Vercel → Settings → Environment Variables
   - Xem có `VITE_API_BASE_URL` không
   - Giá trị có đúng không

2. **Redeploy:**
   - ⚠️ **QUAN TRỌNG**: Phải redeploy sau khi set environment variable
   - Vercel → Deployments → Redeploy

3. **Kiểm tra Build Logs:**
   - Vercel → Deployments → Build Logs
   - Xem environment variable có được inject vào build không

### Local Development:

1. **Tạo file `.env`:**
   ```
   VITE_API_BASE_URL=https://hcmut-lms-deploy.azurewebsites.net/api
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

## 📝 Tóm tắt

**Không dùng:**
```javascript
// ❌ SAI - Không hoạt động trong console
console.log(import.meta.env.VITE_API_BASE_URL)
```

**Dùng cách này:**
1. ✅ **Network tab** - Xem request URL thực tế
2. ✅ **Thêm console.log** trong code
3. ✅ **Kiểm tra trong Sources tab**

