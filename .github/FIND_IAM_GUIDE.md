# 🔍 Hướng dẫn Tìm "Access control (IAM)" trên Azure Portal

## Bạn đang ở đâu?

Bạn đang ở trang **Subscriptions** và thấy danh sách subscription. Bạn cần tìm "Access control (IAM)" để gán quyền.

## 📍 Cách 1: Từ Subscription (Đơn giản nhất)

### Bước 1: Click vào tên Subscription
- Ở bảng subscriptions, click vào tên subscription của bạn
- Ví dụ: Click vào **"Azure for Students"** (dòng có Subscription ID: `ccb6c139-3b6a-490c-b9c1-dd6a94cad586`)

### Bước 2: Tìm menu "Access control (IAM)"
Sau khi click vào subscription, bạn sẽ vào trang chi tiết. Tìm menu bên trái:

**Các cách tìm:**
1. **Scroll xuống** trong menu sidebar bên trái
2. **Tìm trong search box** của menu: Gõ "IAM" hoặc "Access control"
3. **Nhìn icon khóa** 🔒 - "Access control (IAM)" thường có icon khóa

**Menu thường có dạng:**
```
☰ Overview
☰ Activity log
☰ Access control (IAM)  ← Đây là cái bạn cần!
☰ Tags
☰ Policies
...
```

### Bước 3: Click vào "Access control (IAM)"
- Click vào **"Access control (IAM)"** trong menu
- Bạn sẽ thấy trang với các tab: **Role assignments**, **Role definitions**, etc.

## 📍 Cách 2: Từ Resource Group (Khuyến nghị - An toàn hơn)

### Bước 1: Vào Resource Groups
1. Ở search bar trên cùng Azure Portal, gõ: **"Resource groups"**
2. Click vào **"Resource groups"** trong kết quả

### Bước 2: Chọn Resource Group
- Click vào Resource Group chứa Azure App Service của bạn
- (Nếu không biết, tìm Resource Group có tên liên quan đến LMS hoặc App Service của bạn)

### Bước 3: Tìm "Access control (IAM)"
- Tương tự như Cách 1, tìm **"Access control (IAM)"** trong menu bên trái
- Click vào đó

## 🎯 Sau khi vào "Access control (IAM)"

Bạn sẽ thấy:
- Tab **"Role assignments"** (mặc định)
- Nút **"+ Add"** ở trên cùng
- Bảng danh sách các role assignments hiện có

### Tiếp theo:
1. Click **"+ Add"** → **"Add role assignment"**
2. Chọn:
   - **Role**: **Contributor**
   - **Assign access to**: **User, group, or service principal**
   - **Select**: Gõ `github-actions-lms-deploy` và chọn
3. Click **"Review + assign"** → **"Review + assign"** (lần 2)

## ❓ Vẫn không thấy?

### Kiểm tra quyền của bạn:
- Bạn cần có quyền **Owner** hoặc **User Access Administrator**
- Nếu không có, liên hệ admin để gán quyền

### Thử các cách khác:
1. **Refresh trang** (F5 hoặc Ctrl+R)
2. **Đăng xuất và đăng nhập lại** Azure Portal
3. **Thử dùng Azure CLI** thay vì Portal (xem hướng dẫn trong DEPLOYMENT_SETUP.md)

### Dùng Azure CLI (Nhanh hơn):
```bash
# Login
az login

# Gán quyền Contributor (thay YOUR_SUBSCRIPTION_ID và YOUR_RESOURCE_GROUP)
az role assignment create \
  --assignee <client-id-của-app> \
  --role Contributor \
  --scope /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/YOUR_RESOURCE_GROUP
```

## 📸 Vị trí trong Azure Portal

```
Azure Portal
├── Subscriptions (bạn đang ở đây)
│   └── [Click vào subscription name]
│       └── Access control (IAM) ← Tìm trong menu bên trái
│
└── Resource groups
    └── [Click vào resource group]
        └── Access control (IAM) ← Hoặc ở đây
```

## 💡 Tip

Nếu vẫn khó tìm, dùng **search bar trên cùng** của Azure Portal:
- Gõ: **"Access control"** hoặc **"IAM"**
- Click vào kết quả phù hợp

