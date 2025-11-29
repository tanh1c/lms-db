# ✅ Hướng dẫn Chọn Role "Contributor"

## 🎯 Role cần chọn

Bạn đang ở trang **"Add role assignment"** và thấy rất nhiều roles có từ "Contributor". 

**Chọn role này:**
```
✅ Contributor
```

**KHÔNG chọn các role này:**
```
❌ App Service Contributor
❌ API Management Service Contributor  
❌ Application Insights Component Contributor
❌ App Configuration Contributor
❌ Automation Contributor
❌ Azure API Center Service Contributor
... (và các role khác có prefix)
```

## 📋 Cách nhận biết Role đúng

### Role "Contributor" (ĐÚNG):
- **Tên**: Chỉ có "Contributor" (không có prefix)
- **Mô tả**: "Grants full access to manage all resources, but does not allow you to assign roles in Azure RBAC, manage assignments in Azure Blueprints, or share image galleries."
- **Type**: BuiltinRole
- **Category**: General

### Các role khác (SAI):
- Có prefix trước "Contributor" (ví dụ: "App Service Contributor")
- Mô tả cụ thể cho một service nào đó

## 🔍 Cách tìm nhanh

1. **Trong search box**, gõ: `Contributor` (chỉ gõ từ này)
2. **Scroll xuống** trong danh sách
3. **Tìm role** có tên đơn giản là **"Contributor"** (không có prefix)
4. **Kiểm tra mô tả**: Nên có cụm "Grants full access to manage all resources"

## 📸 Vị trí trong danh sách

Role "Contributor" thường nằm ở:
- **Gần đầu danh sách** (sau khi search "Contributor")
- Hoặc **giữa danh sách** (theo thứ tự alphabet)

## ⚠️ Lưu ý

- Role "Contributor" là **built-in role phổ biến nhất**
- Nó cho phép quản lý tất cả resources (trừ quyền gán roles)
- Đây là role phù hợp cho GitHub Actions để deploy

## ✅ Sau khi chọn

1. Click vào role **"Contributor"**
2. Click **"Next"** để sang tab "Members"
3. Chọn service principal `github-actions-lms-deploy`
4. Click **"Review + assign"** để hoàn tất

