# 🔧 Sửa lỗi: Resource hcmut-lms-deploy doesn't exist

## ✅ Xác nhận

App Service `hcmut-lms-deploy` **tồn tại** trong Resource Group `hcmut-lms-rg`.

## 🔴 Nguyên nhân lỗi

Service Principal (`backend-lms-deploy`) **không có quyền** trên Resource Group `hcmut-lms-rg`.

## ✅ Giải pháp: Gán quyền Contributor cho Resource Group

### Bước 1: Vào Resource Group IAM

1. Ở trang Resource Group `hcmut-lms-rg` (bạn đang ở đây)
2. Trong menu bên trái, click **"Access control (IAM)"**

### Bước 2: Gán quyền Contributor

1. Click **"+ Add"** → **"Add role assignment"**
2. Trong form:
   - **Role**: Chọn **"Contributor"**
   - **Assign access to**: Chọn **"User, group, or service principal"**
   - **Select**: Gõ `backend-lms-deploy` và chọn service principal
3. Click **"Review + assign"** → **"Review + assign"** (lần 2)

### Bước 3: Kiểm tra

1. Vào **"Role assignments"** tab
2. Tìm `backend-lms-deploy` trong danh sách
3. Đảm bảo có quyền **Contributor** trên Resource Group `hcmut-lms-rg`

## 🔍 Kiểm tra quyền hiện tại

### Cách 1: Kiểm tra trong Resource Group

1. Resource Group `hcmut-lms-rg` → **Access control (IAM)**
2. Tab **"Role assignments"**
3. Tìm `backend-lms-deploy`
4. Nếu không thấy → Cần gán quyền

### Cách 2: Kiểm tra trong Subscription

1. Subscriptions → Chọn subscription → **Access control (IAM)**
2. Tab **"Role assignments"**
3. Tìm `backend-lms-deploy`
4. Kiểm tra scope:
   - Nếu scope là **Subscription** → Có quyền trên tất cả Resource Groups
   - Nếu scope là **Resource Group** → Chỉ có quyền trên Resource Group đó

## ⚠️ Lưu ý

### Quyền ở Subscription level vs Resource Group level

- **Subscription level**: Có quyền trên tất cả Resource Groups (khuyến nghị)
- **Resource Group level**: Chỉ có quyền trên Resource Group cụ thể

**Nếu đã gán ở Subscription level nhưng vẫn lỗi:**
- Có thể mất vài phút để quyền có hiệu lực
- Hoặc cần gán lại ở Resource Group level

## ✅ Sau khi gán quyền

1. **Đợi 1-2 phút** để quyền có hiệu lực
2. **Rerun workflow** trên GitHub Actions:
   - Vào GitHub → Actions
   - Chọn workflow run failed
   - Click **"Re-run jobs"** → **"Re-run failed jobs"**
3. Hoặc **push code mới** để trigger workflow

## 🎯 Tóm tắt

1. ✅ App Service tồn tại: `hcmut-lms-deploy` trong `hcmut-lms-rg`
2. ❌ Service Principal chưa có quyền trên Resource Group
3. ✅ Cần gán quyền **Contributor** cho `backend-lms-deploy` trên Resource Group `hcmut-lms-rg`

## 📝 Checklist

- [ ] Vào Resource Group `hcmut-lms-rg` → **Access control (IAM)**
- [ ] Click **"+ Add"** → **"Add role assignment"**
- [ ] Chọn Role: **Contributor**
- [ ] Chọn Service Principal: `backend-lms-deploy`
- [ ] Click **"Review + assign"**
- [ ] Đợi 1-2 phút
- [ ] Rerun workflow trên GitHub Actions

