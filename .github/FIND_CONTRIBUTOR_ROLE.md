# 🔍 Hướng dẫn Tìm Role "Contributor" Đúng

## 🎯 Role cần chọn

**"Contributor"** (tên đơn giản, không có prefix)

## ✅ Cách nhận biết Role ĐÚNG

### Role "Contributor" (ĐÚNG):
- **Tên**: Chỉ có **"Contributor"** (không có prefix)
- **Mô tả**: "Grants full access to manage all resources, but does not allow you to assign roles in Azure RBAC, manage assignments in Azure Blueprints, or share image galleries."
- **Type**: BuiltinRole
- **Category**: General

### Các role khác (SAI):
- ❌ "App Service Environment Contributor"
- ❌ "Application Insights Component Contributor"
- ❌ "Automation Contributor"
- ❌ "App Configuration Contributor"
- ❌ "API Management Service Contributor"
- ❌ Bất kỳ role nào có prefix trước "Contributor"

## 🔍 Cách tìm nhanh

### Cách 1: Search

1. Trong **search box**, gõ: `Contributor` (chỉ gõ từ này)
2. **Scroll xuống** trong danh sách
3. Tìm role có tên đơn giản là **"Contributor"** (không có prefix)
4. **Kiểm tra mô tả**: Phải có cụm "Grants full access to manage all resources"

### Cách 2: Filter

1. Tìm filter **"Category"** hoặc **"Type"**
2. Chọn **"General"** hoặc **"BuiltinRole"**
3. Tìm role **"Contributor"** trong danh sách đã lọc

### Cách 3: Scroll theo alphabet

Role "Contributor" thường nằm ở:
- **Gần đầu** danh sách (sau các role bắt đầu bằng "A")
- Hoặc **giữa** danh sách (theo thứ tự alphabet: C)

## 📋 So sánh

| Role | Chọn? | Lý do |
|------|-------|-------|
| **Contributor** | ✅ **ĐÚNG** | Role tổng quát, quản lý tất cả resources |
| **App Service Environment Contributor** | ❌ SAI | Chỉ quản lý App Service Environment |
| **Application Insights Component Contributor** | ❌ SAI | Chỉ quản lý Application Insights |
| **Automation Contributor** | ❌ SAI | Chỉ quản lý Automation |
| **API Management Service Contributor** | ❌ SAI | Chỉ quản lý API Management |

## 🎯 Mô tả chính xác

Khi bạn tìm thấy role "Contributor", mô tả phải là:

> **"Grants full access to manage all resources, but does not allow you to assign roles in Azure RBAC, manage assignments in Azure Blueprints, or share image galleries."**

**Dịch:**
> "Cấp quyền truy cập đầy đủ để quản lý tất cả resources, nhưng không cho phép bạn gán roles trong Azure RBAC, quản lý assignments trong Azure Blueprints, hoặc chia sẻ image galleries."

## ⚠️ Lưu ý

- Role "Contributor" là **built-in role phổ biến nhất**
- Nó nằm trong **category "General"**
- Không có prefix nào trước từ "Contributor"
- Mô tả bắt đầu bằng "Grants full access to manage all resources"

## ✅ Sau khi tìm thấy

1. Click vào role **"Contributor"**
2. Click **"Next"** để sang tab "Members"
3. Chọn service principal `backend-lms-deploy`
4. Click **"Review + assign"** để hoàn tất

## 💡 Tip

Nếu vẫn khó tìm:
1. **Scroll lên đầu** danh sách (sau khi search "Contributor")
2. Tìm role có tên ngắn nhất: chỉ **"Contributor"**
3. Kiểm tra mô tả có cụm "all resources" (tất cả resources)

