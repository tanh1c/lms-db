# Đề Xuất Chức Năng Mới Cho Trang Quản Lý Courses

## Tổng Quan

Trang quản lý courses hiện tại đã có các chức năng CRUD cơ bản (Create, Read, Update, Delete) và đã sử dụng stored procedures. Dưới đây là các đề xuất chức năng mới để nâng cao trải nghiệm quản lý.

## ✅ Đã Hoàn Thành

### 1. Stored Procedures Nâng Cao
- ✅ `SearchCourses` - Tìm kiếm và lọc courses với nhiều tiêu chí
- ✅ `GetCourseDetails` - Lấy thông tin chi tiết và thống kê của course
- ✅ `GetCourseSections` - Lấy danh sách sections của course
- ✅ `GetCourseStudents` - Lấy danh sách students đăng ký course
- ✅ `GetCourseTutors` - Lấy danh sách tutors dạy course
- ✅ `GetCourseStatistics` - Lấy thống kê chi tiết của course
- ✅ `GetCoursesBySemester` - Lấy courses theo semester
- ✅ `GetCourseEnrollmentTrend` - Phân tích xu hướng đăng ký qua các semester

### 2. API Endpoints Mới
- ✅ `/admin/courses/search` - Tìm kiếm courses với filters
- ✅ `/admin/courses/<course_id>/details` - Chi tiết course
- ✅ `/admin/courses/<course_id>/sections` - Danh sách sections
- ✅ `/admin/courses/<course_id>/students` - Danh sách students
- ✅ `/admin/courses/<course_id>/tutors` - Danh sách tutors
- ✅ `/admin/courses/<course_id>/statistics` - Thống kê course
- ✅ `/admin/courses/by-semester/<semester>` - Courses theo semester
- ✅ `/admin/courses/<course_id>/enrollment-trend` - Xu hướng đăng ký

## 🎯 Đề Xuất Chức Năng Mới Cho Frontend

### 1. **Tìm Kiếm & Lọc Nâng Cao** 🔍
**Mô tả**: Thêm thanh tìm kiếm và bộ lọc nâng cao cho danh sách courses

**Tính năng**:
- Tìm kiếm theo Course ID hoặc Course Name
- Lọc theo Credit (min/max)
- Lọc theo Start Date (từ ngày - đến ngày)
- Lọc courses có/không có sections
- Lọc courses có/không có students enrolled
- Sắp xếp theo: Course ID, Name, Credit, Start Date, Số lượng students

**UI Components cần thêm**:
- Advanced Search Panel với các filter options
- Sort dropdown
- Filter chips hiển thị các filter đang active

---

### 2. **Course Detail View** 📊
**Mô tả**: Trang chi tiết course hiển thị đầy đủ thông tin và thống kê

**Tính năng**:
- Thông tin cơ bản: Course ID, Name, Credit, Start Date
- Thống kê tổng quan:
  - Tổng số sections
  - Tổng số students enrolled
  - Tổng số tutors
  - Tổng số assignments/quizzes
  - Điểm trung bình final grade
- Tabs để xem:
  - Sections (danh sách sections với thông tin chi tiết)
  - Students (danh sách students với grades)
  - Tutors (danh sách tutors dạy course)
  - Statistics (biểu đồ và phân tích)

**UI Components cần thêm**:
- CourseDetailPage component
- Statistics cards
- Tabs component
- Data tables cho sections/students/tutors

---

### 3. **Course Statistics Dashboard** 📈
**Mô tả**: Dashboard hiển thị thống kê và phân tích chi tiết của course

**Tính năng**:
- Enrollment Statistics:
  - Tổng số students enrolled
  - Số students approved/pending
  - Biểu đồ enrollment theo semester
- Grade Statistics:
  - Điểm trung bình, min, max
  - Phân bố điểm (histogram)
  - Tỷ lệ pass/fail
- Activity Statistics:
  - Số lượng assignments/quizzes
  - Số lượng submissions
  - Completion rate
- Enrollment Trend:
  - Biểu đồ xu hướng đăng ký qua các semester
  - So sánh enrollment giữa các semester

**UI Components cần thêm**:
- Chart components (Line, Bar, Pie charts)
- Statistics cards
- Trend visualization

---

### 4. **Quản Lý Sections Trong Course** 📚
**Mô tả**: Quản lý các sections của course trực tiếp từ trang course detail

**Tính năng**:
- Xem danh sách sections của course
- Thêm section mới cho course
- Xem chi tiết section:
  - Số lượng students
  - Danh sách tutors
  - Room assignments
- Xóa section (với confirmation)
- Filter sections theo semester

**UI Components cần thêm**:
- SectionList component
- AddSectionDialog
- SectionDetailCard

---

### 5. **Quản Lý Students Enrolled** 👥
**Mô tả**: Xem và quản lý students đã đăng ký course

**Tính năng**:
- Xem danh sách students enrolled
- Filter students theo:
  - Section
  - Semester
  - Status (Pending/Approved/Rejected)
- Xem thông tin chi tiết student:
  - Thông tin cá nhân
  - Grades (Final, Midterm, Quiz, Assignment)
  - Registration date
  - Status
- Export danh sách students ra Excel/CSV
- Bulk actions:
  - Approve/Reject multiple students
  - Send notifications

**UI Components cần thêm**:
- StudentListTable component
- StudentDetailModal
- BulkActionToolbar
- ExportButton

---

### 6. **Quản Lý Tutors** 👨‍🏫
**Mô tả**: Xem và quản lý tutors dạy course

**Tính năng**:
- Xem danh sách tutors dạy course
- Filter tutors theo section/semester
- Xem thông tin chi tiết tutor:
  - Thông tin cá nhân
  - Academic rank
  - Department
  - Số lượng students đang dạy
- Gán tutor mới cho section
- Xóa tutor khỏi section

**UI Components cần thêm**:
- TutorList component
- AssignTutorDialog
- TutorDetailCard

---

### 7. **Course Analytics & Reports** 📊
**Mô tả**: Báo cáo và phân tích nâng cao cho courses

**Tính năng**:
- Course Performance Report:
  - Điểm trung bình theo semester
  - Tỷ lệ completion
  - So sánh với courses khác
- Enrollment Report:
  - Xu hướng đăng ký
  - Dự đoán enrollment cho semester tới
  - Phân tích theo major/department
- Export Reports:
  - PDF report
  - Excel spreadsheet
  - CSV data

**UI Components cần thêm**:
- ReportGenerator component
- ExportOptionsDialog
- ComparisonCharts

---

### 8. **Bulk Operations** ⚡
**Mô tả**: Thao tác hàng loạt trên nhiều courses

**Tính năng**:
- Bulk delete courses (với confirmation)
- Bulk update (ví dụ: update start date cho nhiều courses)
- Bulk export courses ra Excel/CSV
- Import courses từ Excel/CSV
- Duplicate course (tạo course mới dựa trên course hiện có)

**UI Components cần thêm**:
- BulkActionBar
- ImportDialog
- DuplicateCourseDialog

---

### 9. **Course Prerequisites** 🔗
**Mô tả**: Quản lý prerequisites (điều kiện tiên quyết) của course

**Tính năng**:
- Xem danh sách prerequisites của course
- Thêm/xóa prerequisites
- Validation khi student đăng ký (kiểm tra đã học prerequisites chưa)
- Hiển thị prerequisite chain trong course detail

**Lưu ý**: Cần thêm bảng `Course_Prerequisite` vào database

**UI Components cần thêm**:
- PrerequisiteList component
- AddPrerequisiteDialog
- PrerequisiteChainVisualization

---

### 10. **Course Scheduling** 📅
**Mô tả**: Quản lý lịch học và phòng học cho course sections

**Tính năng**:
- Xem lịch học của sections
- Assign room cho section
- Xem room availability
- Conflict detection (kiểm tra xung đột lịch)
- Calendar view cho course schedule

**UI Components cần thêm**:
- ScheduleCalendar component
- RoomAssignmentDialog
- ConflictAlert component

---

### 11. **Notifications & Alerts** 🔔
**Mô tả**: Thông báo và cảnh báo liên quan đến courses

**Tính năng**:
- Thông báo khi:
  - Course sắp bắt đầu
  - Enrollment đạt giới hạn
  - Có students pending approval
  - Deadline assignments/quizzes sắp đến
- Alert khi:
  - Course không có tutors assigned
  - Course không có sections
  - Low enrollment rate

**UI Components cần thêm**:
- NotificationCenter
- AlertBadge
- NotificationSettings

---

### 12. **Course Templates** 📋
**Mô tả**: Tạo course từ template để tiết kiệm thời gian

**Tính năng**:
- Tạo course template từ course hiện có
- Lưu template với:
  - Course structure
  - Default sections
  - Default assignments/quizzes structure
- Tạo course mới từ template
- Quản lý templates library

**UI Components cần thêm**:
- TemplateLibrary component
- CreateTemplateDialog
- UseTemplateDialog

---

## Ưu Tiên Triển Khai

### Phase 1 (High Priority) - 2-3 tuần
1. ✅ Tìm kiếm & Lọc nâng cao
2. ✅ Course Detail View
3. ✅ Course Statistics Dashboard
4. ✅ Quản lý Sections trong Course

### Phase 2 (Medium Priority) - 2-3 tuần
5. Quản lý Students Enrolled
6. Quản lý Tutors
7. Bulk Operations

### Phase 3 (Low Priority) - 3-4 tuần
8. Course Analytics & Reports
9. Course Prerequisites
10. Course Scheduling
11. Notifications & Alerts
12. Course Templates

## Lưu Ý Kỹ Thuật

1. **Database**: Một số tính năng (như Prerequisites) cần thêm bảng mới
2. **Performance**: Cần optimize queries cho các thống kê phức tạp
3. **Caching**: Cân nhắc cache cho statistics để tăng performance
4. **Permissions**: Đảm bảo chỉ admin có quyền truy cập các tính năng này
5. **Responsive**: Tất cả UI components cần responsive cho mobile

## Tài Liệu Tham Khảo

- File procedures: `Backend/server/procedures/course_advanced.sql`
- API endpoints: `Backend/server/routes/admin.py` (lines 115-350)
- Frontend page: `Frontend/src/pages/admin/CourseManagementPage.tsx`

