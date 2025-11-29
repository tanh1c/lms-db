# 🔐 Azure Role: Contributor - Mô tả chi tiết

## 📋 Mô tả chính thức

**Contributor** là một built-in role trong Azure RBAC (Role-Based Access Control).

### Mô tả từ Microsoft:

> "Grants full access to manage all resources, but does not allow you to assign roles in Azure RBAC, manage assignments in Azure Blueprints, or share image galleries."

**Dịch:**
> "Cấp quyền truy cập đầy đủ để quản lý tất cả resources, nhưng không cho phép bạn gán roles trong Azure RBAC, quản lý assignments trong Azure Blueprints, hoặc chia sẻ image galleries."

## ✅ Quyền của Contributor

### Có thể làm:

1. **Quản lý tất cả resources:**
   - ✅ Create (Tạo mới)
   - ✅ Read (Đọc)
   - ✅ Update (Cập nhật)
   - ✅ Delete (Xóa)

2. **Quản lý App Services:**
   - ✅ Deploy code/images
   - ✅ Cấu hình settings
   - ✅ Restart/Stop/Start
   - ✅ Xem logs
   - ✅ Quản lý environment variables

3. **Quản lý Container Registry:**
   - ✅ Push/Pull images
   - ✅ Quản lý repositories

4. **Quản lý Storage:**
   - ✅ Upload/Download files
   - ✅ Quản lý containers

5. **Quản lý SQL Database:**
   - ✅ Kết nối database
   - ✅ Thực thi queries (nếu có quyền database)

### Không thể làm:

1. **Quản lý quyền truy cập:**
   - ❌ Gán roles cho người khác
   - ❌ Thay đổi role assignments
   - ❌ Quản lý IAM

2. **Quản lý Blueprints:**
   - ❌ Tạo/sửa Azure Blueprints
   - ❌ Quản lý blueprint assignments

3. **Chia sẻ Image Galleries:**
   - ❌ Quản lý shared image galleries

## 🎯 So sánh với các Roles khác

| Role | Quyền | Khi nào dùng |
|------|-------|--------------|
| **Owner** | Tất cả quyền (bao gồm quản lý IAM) | Admin, quản lý toàn bộ |
| **Contributor** | Quản lý resources (không quản lý IAM) | CI/CD, deployment automation |
| **Reader** | Chỉ đọc | Monitoring, reporting |
| **User Access Administrator** | Chỉ quản lý IAM | Quản lý quyền truy cập |

## 🔧 Tại sao Contributor phù hợp cho GitHub Actions?

### GitHub Actions cần:

1. ✅ **Deploy code/images** lên App Service
2. ✅ **Cấu hình** App Service settings
3. ✅ **Push images** lên Container Registry
4. ✅ **Restart** App Service sau khi deploy

### Contributor cung cấp:

- ✅ Tất cả quyền cần thiết cho deployment
- ✅ Không có quyền quản lý IAM (an toàn hơn)
- ✅ Phù hợp với nguyên tắc "least privilege"

## 📝 Actions được phép (Actions)

Contributor có quyền thực hiện các actions sau:

```
Microsoft.*/register/action
Microsoft.*/unregister/action
Microsoft.*/*/read
Microsoft.*/*/write
Microsoft.*/*/delete
Microsoft.*/*/action
```

**Ví dụ:**
- `Microsoft.Web/sites/read` ✅
- `Microsoft.Web/sites/write` ✅
- `Microsoft.Web/sites/delete` ✅
- `Microsoft.Web/sites/restart/action` ✅
- `Microsoft.Authorization/*/write` ❌ (chỉ Owner)

## ⚠️ Lưu ý bảo mật

### Ưu điểm:

1. **An toàn hơn Owner:**
   - Không thể gán roles cho người khác
   - Không thể leo thang quyền

2. **Đủ quyền cho CI/CD:**
   - Có thể deploy và quản lý resources
   - Không cần quyền cao hơn

### Nhược điểm:

1. **Không thể quản lý IAM:**
   - Nếu cần gán quyền cho service khác, cần Owner

2. **Có thể xóa resources:**
   - Cần cẩn thận với quyền Delete
   - Nên dùng Resource Locks cho resources quan trọng

## 🎓 Tóm tắt

**Contributor = Quản lý resources (không quản lý quyền)**

- ✅ **Có thể**: Tạo, đọc, sửa, xóa resources
- ✅ **Có thể**: Deploy, cấu hình, restart services
- ❌ **Không thể**: Gán roles, quản lý IAM
- ❌ **Không thể**: Quản lý Blueprints

**Phù hợp cho:**
- ✅ CI/CD pipelines (GitHub Actions, Azure DevOps)
- ✅ Deployment automation
- ✅ Service accounts cho applications

## 📚 Tài liệu tham khảo

- [Azure built-in roles - Contributor](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#contributor)
- [Azure RBAC documentation](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview)

