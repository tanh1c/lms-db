# 📝 Hướng dẫn Điền Form "Register an application" trên Azure Portal

## Form hiện tại bạn đang thấy

Bạn đang ở trang **"Register an application"** trong Azure Portal. Đây là hướng dẫn chi tiết:

## ✅ Các bước điền form

### 1. **Name** (Bắt buộc)
```
github-actions-lms-deploy
```
- Đây là tên hiển thị của application
- Có thể đổi sau nếu cần
- Nên dùng tên dễ nhận biết

### 2. **Supported account types** (Bắt buộc)
Chọn option đầu tiên:
```
☑ Accounts in this organizational directory only 
  (Default Directory only - Single tenant)
```

**Giải thích:**
- Option này phù hợp cho Service Principal dùng trong GitHub Actions
- Chỉ cần quyền trong organization của bạn
- Không cần multi-tenant

### 3. **Redirect URI** (Tùy chọn)
**Để trống** - Không cần điền gì cả

- Service Principal không cần redirect URI
- Chỉ cần cho Web apps hoặc SPA apps
- Bạn có thể bỏ qua phần này

## 🎯 Sau khi điền xong

1. Click nút **"Register"** (màu xanh, ở dưới cùng bên phải)
2. Đợi vài giây để Azure tạo application
3. Bạn sẽ được chuyển đến trang **Overview** của application

## 📋 Thông tin cần lấy sau khi Register

Sau khi click Register, bạn sẽ thấy trang Overview với các thông tin:

1. **Application (client) ID** → Copy giá trị này (dạng UUID)
2. **Directory (tenant) ID** → Copy giá trị này (dạng UUID)

**Ví dụ:**
```
Application (client) ID: d1234567-89ab-cdef-0123-456789abcdef
Directory (tenant) ID: 87654321-4321-4321-4321-210987654321
```

## 🔐 Bước tiếp theo

Sau khi có Client ID và Tenant ID, bạn cần:

1. **Tạo Client Secret** (xem file `DEPLOYMENT_SETUP.md` - Bước 2.3)
2. **Lấy Subscription ID** (xem file `DEPLOYMENT_SETUP.md` - Bước 2.4)
3. **Gán quyền Contributor** (xem file `DEPLOYMENT_SETUP.md` - Bước 2.5)
4. **Thêm vào GitHub Secrets** (xem file `DEPLOYMENT_SETUP.md` - Bước 2)

## ❓ Câu hỏi thường gặp

**Q: Tôi có thể đổi tên sau không?**
A: Có, bạn có thể đổi tên bất cứ lúc nào trong Overview.

**Q: Redirect URI có bắt buộc không?**
A: Không, để trống là được. Chỉ cần cho web apps.

**Q: Tôi chọn nhầm account type, có sao không?**
A: Có thể đổi sau, nhưng nên chọn đúng ngay từ đầu để tránh phức tạp.

## 🆘 Cần giúp đỡ?

Xem file `DEPLOYMENT_SETUP.md` để có hướng dẫn đầy đủ từ đầu đến cuối.

