# Hướng dẫn Setup CI/CD với GitHub Actions

## 📋 Yêu cầu

1. Azure App Service đã được tạo
2. Repository trên GitHub
3. Quyền admin trên repository

## 🚀 Quick Start

**Bạn đang ở đâu?**
- ✅ Đang ở trang "Register an application" trên Azure Portal → Xem **Bước 2.1** bên dưới
- ✅ Đã tạo App Registration → Xem **Bước 2.2, 2.3, 2.4**
- ✅ Đã có đủ thông tin → Xem **Bước 2** để thêm vào GitHub Secrets

## 🔧 Bước 1: Tạo Azure Service Principal

Để GitHub Actions có thể deploy lên Azure, bạn cần tạo Service Principal:

### Cách 1: Dùng Azure CLI (Khuyến nghị)

```bash
# Login vào Azure
az login

# Tạo Service Principal (thay YOUR_SUBSCRIPTION_ID và YOUR_RESOURCE_GROUP)
az ad sp create-for-rbac \
  --name "github-actions-lms-deploy" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/YOUR_RESOURCE_GROUP \
  --sdk-auth
```

Lệnh này sẽ trả về JSON output, copy toàn bộ output này.

### Cách 2: Dùng Azure Portal (Chi tiết từng bước)

#### Bước 2.1: Đăng ký Application

1. Vào Azure Portal → **Azure Active Directory** → **App registrations**
2. Click **"+ New registration"** (hoặc "Register an application")
3. Điền form:
   - **Name**: `github-actions-lms-deploy` (hoặc tên bạn muốn)
   - **Supported account types**: Chọn **"Accounts in this organizational directory only (Default Directory only - Single tenant)"** (option đầu tiên)
   - **Redirect URI**: Để trống (không cần thiết cho Service Principal)
4. Click **"Register"** (nút màu xanh ở dưới)

#### Bước 2.2: Lấy Client ID và Tenant ID

Sau khi đăng ký thành công, bạn sẽ thấy trang **Overview**:
- Copy **Application (client) ID** → Đây là `clientId`
- Copy **Directory (tenant) ID** → Đây là `tenantId`
- Lưu lại 2 giá trị này

#### Bước 2.3: Tạo Client Secret

1. Vào menu bên trái → **"Certificates & secrets"**
2. Click tab **"Client secrets"**
3. Click **"+ New client secret"**
4. Điền form:
   - **Description**: `GitHub Actions Deploy` (hoặc tên mô tả)
   - **Expires**: Chọn **"24 months"** (hoặc thời gian bạn muốn)
5. Click **"Add"**
6. ⚠️ **QUAN TRỌNG**: Copy **Value** của secret ngay lập tức (sẽ không hiện lại sau khi rời trang) → Đây là `clientSecret`

#### Bước 2.4: Lấy Subscription ID

1. Vào Azure Portal → **Subscriptions** (tìm trong search bar)
2. Copy **Subscription ID** của subscription bạn đang dùng → Đây là `subscriptionId`

#### Bước 2.5: Gán quyền Contributor

**Cách 1: Gán quyền ở Subscription level (Khuyến nghị)**

1. Ở trang **Subscriptions**, click vào tên subscription của bạn (ví dụ: "Azure for Students")
2. Bạn sẽ vào trang chi tiết của subscription
3. Trong menu bên trái, tìm và click **"Access control (IAM)"** (có icon khóa)
   - Nếu không thấy, scroll xuống trong menu sidebar
   - Hoặc tìm trong search box của menu: gõ "IAM" hoặc "Access control"
4. Click nút **"+ Add"** ở trên cùng → Chọn **"Add role assignment"**
5. Trong form hiện ra (tab "Role"):
   - **Search box**: Gõ **"Contributor"** (chỉ gõ từ này, không có prefix)
   - **Chọn role**: Tìm và chọn role có tên đơn giản là **"Contributor"** (không phải "App Service Contributor", "API Contributor", v.v.)
     - ✅ **Đúng**: "Contributor" (mô tả: "Grants full access to manage all resources, but does not allow you to assign roles in Azure RBAC...")
     - ❌ **Sai**: "App Service Contributor", "API Management Service Contributor", "Application Insights Component Contributor", v.v.
   - Click **"Next"** để sang tab tiếp theo
6. Tab "Members":
   - **Assign access to**: Chọn **"User, group, or service principal"**
   - **Select**: Click vào ô này, gõ `github-actions-lms-deploy` và chọn application bạn vừa tạo
   - Click **"Next"**
7. Tab "Review + assign":
   - Xem lại thông tin
   - Click **"Review + assign"** để hoàn tất

**Cách 2: Gán quyền ở Resource Group level (An toàn hơn, khuyến nghị)**

1. Vào **Resource groups** (tìm trong search bar)
2. Chọn Resource Group chứa Azure App Service của bạn
3. Vào **Access control (IAM)** trong menu bên trái
4. Làm tương tự như Cách 1 (bước 4-7)
   - Chọn role **"Contributor"** (không có prefix)
   - Chọn service principal `github-actions-lms-deploy`

⚠️ **Lưu ý**: 
- Nếu không thấy "Access control (IAM)" trong menu, thử refresh trang
- Đảm bảo bạn có quyền Owner hoặc User Access Administrator
- Có thể mất vài phút để quyền có hiệu lực

## 🔐 Bước 2: Thêm GitHub Secrets

1. Vào repository trên GitHub
2. Vào **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Thêm secret sau:

### Secret: `AZURE_CREDENTIALS`

**Nếu dùng Azure CLI (Cách 1):**
- Name: `AZURE_CREDENTIALS`
- Value: Paste toàn bộ JSON output từ lệnh `az ad sp create-for-rbac`

**Nếu dùng Azure Portal (Cách 2):**
- Name: `AZURE_CREDENTIALS`
- Value: Tạo JSON với 4 giá trị bạn đã lấy ở trên:
```json
{
  "clientId": "d1234567-89ab-cdef-0123-456789abcdef",
  "clientSecret": "abc~DEF123ghi456JKL789mno012PQR345stu678",
  "subscriptionId": "12345678-1234-1234-1234-123456789012",
  "tenantId": "87654321-4321-4321-4321-210987654321"
}
```

**Ví dụ thực tế:**
- `clientId`: Từ **Application (client) ID** trong Overview
- `clientSecret`: Từ **Value** trong Client secrets (đã copy ở bước 2.3)
- `subscriptionId`: Từ **Subscriptions** → Subscription ID
- `tenantId`: Từ **Directory (tenant) ID** trong Overview

⚠️ **Lưu ý**: 
- `clientSecret` chỉ hiện 1 lần, nếu quên phải tạo secret mới
- Giữ JSON này an toàn, không chia sẻ công khai

## ⚙️ Bước 3: Cấu hình Workflow

1. Mở file `.github/workflows/deploy-backend.yml`
2. Thay đổi các giá trị sau:

```yaml
env:
  AZURE_WEBAPP_NAME: your-app-service-name  # ⚠️ Thay bằng tên Azure App Service của bạn
```

**Ví dụ:**
```yaml
env:
  AZURE_WEBAPP_NAME: lms-backend-prod
```

## 🗄️ Bước 4: Cấu hình Environment Variables trên Azure App Service

1. Vào Azure Portal → App Services → Chọn App Service của bạn
2. Vào **Configuration** → **Application settings**
3. Thêm các biến môi trường từ file `.env`:

```
DB_SERVER=lms-hcmut.database.windows.net
DB_PORT=1433
DB_DATABASE=lms_system
DB_USER=sManager
DB_PASSWORD=your-password
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_ACCOUNT_NAME=hcmutlmstorage
PORT=3001
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
```

⚠️ **Lưu ý bảo mật:** Không commit file `.env` lên GitHub!

## 🚀 Bước 5: Test Deployment

1. Push code lên branch `main` hoặc `master`:
```bash
git add .
git commit -m "Setup CI/CD"
git push origin main
```

2. Vào GitHub → **Actions** tab để xem workflow chạy
3. Nếu thành công, backend sẽ được deploy tự động lên Azure App Service

## 🔍 Troubleshooting

### Lỗi: "Azure login failed"
- Kiểm tra lại `AZURE_CREDENTIALS` secret
- Đảm bảo Service Principal có quyền Contributor trên Resource Group

### Lỗi: "App service not found"
- Kiểm tra tên App Service trong workflow file
- Đảm bảo App Service và Resource Group đúng

### Lỗi: "Database connection failed"
- Kiểm tra Application Settings trên Azure App Service
- Đảm bảo Azure SQL Server cho phép kết nối từ Azure Services
- Kiểm tra Firewall rules trên Azure SQL Server

## 📝 Lưu ý

- Workflow chỉ chạy khi có thay đổi trong `Backend/server/**`
- Có thể chạy thủ công từ GitHub Actions tab → "Run workflow"
- Mỗi lần deploy sẽ mất khoảng 3-5 phút

