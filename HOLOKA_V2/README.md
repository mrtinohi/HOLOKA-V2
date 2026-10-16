# HOLOKA – Nền Tảng Quản Lý Bất Động Sản Thông Minh

HOLOKA là nền tảng B2B SaaS hiện đại dành cho Chủ sở hữu (Owners), Chủ nhà (Landlords), Quản lý vận hành (Property Managers) và Nhân viên kỹ thuật (Staff). Hệ thống chuyển đổi mô hình quản lý thủ công thành hệ thống quản lý vận hành tích hợp thông minh:

**Manage → Understand → Detect → Recommend → Act → Predict**

---

## 🚀 Các Tính Năng Chính

1. **Xác thực & Phân quyền (RBAC):** Kiến trúc phiên làm việc JWT Stateless kết hợp Refresh Token an toàn, phân quyền đa cấp (`OWNER`, `MANAGER`, `STAFF`).
2. **Quản lý danh mục tài sản:** Quản lý phân cấp Bất động sản (Properties) → Tòa nhà (Buildings) → Phòng (Rooms) với chỉ số lấp đầy thời gian thực.
3. **Vòng đời khách thuê & hợp đồng:** Quản lý hồ sơ khách thuê và hợp đồng điện tử với kiểm tra nghiêm ngặt ngăn chặn trùng lặp thời gian thuê của phòng.
4. **Tài chính & Hóa đơn:** Tự động hóa chu trình thanh toán từ `DRAFT` đến `PAID` hoặc `OVERDUE`.
5. **Vận hành & Bảo trì:** Ghi nhận sự cố, giao việc cho nhân viên, quản lý chi phí dự kiến/thực tế và theo dõi tiến độ xử lý.
6. **Công cụ cảnh báo thông minh (Smart Alert Engine):** Bộ lập lịch nền tự động đánh giá dữ liệu vận hành theo chu kỳ (hợp đồng sắp hết hạn, hóa đơn quá hạn, phòng trống kéo dài).
7. **Giao diện người dùng hiện đại:** Giao diện React tối ưu, phong cách thẩm mỹ cao, hiển thị báo cáo tổng hợp không bị lỗi N+1 query.

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **Ngôn ngữ & Framework:** Java 21 + Spring Boot 3.5.16
- **Cơ sở dữ liệu:** Microsoft SQL Server
- **Migration:** Flyway Database Migration
- **Bảo mật:** Spring Security 6, Nimbus JWT, BCrypt (cost 12)
- **Quản lý gói:** Maven Wrapper

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **CSS:** Tailwind CSS v4
- **Icons:** Lucide React
- **Routing:** React Router v7
- **HTTP Client:** Axios (Interceptors xử lý CSRF và tự động làm mới JWT)

---

## 📁 Cấu Trúc Thư Mục

```text
HOLOKA-anti/
├── backend/                # Spring Boot REST API
│   ├── src/main/java/      # Mã nguồn Java (chia theo domain: auth, property, room...)
│   ├── src/main/resources/ # Cấu hình (application.properties, db/migration)
│   └── pom.xml             # Quản lý dependencies Maven
├── frontend/               # React Vite Single Page App
│   ├── src/components/     # UI Components dùng chung
│   ├── src/pages/          # Màn hình chức năng (Dashboard, Rooms, Tenants...)
│   ├── src/services/       # API clients kết nối backend
│   └── package.json        # Dependencies Node.js
├── docs/                   # Tài liệu thiết kế & đặc tả hệ thống
│   ├── architecture.md     # Kiến trúc hệ thống
│   ├── database.md         # Thiết kế cơ sở dữ liệu
│   ├── api.md              # Đặc tả API endpoints
│   └── steps/              # Nhật ký các giai đoạn phát triển
├── .env.example            # Mẫu biến môi trường
└── README.md               # Hướng dẫn dự án
```

---

## ⚙️ Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Tiên Quyết
* **JDK 21**
* **Node.js 18+** & npm
* **Microsoft SQL Server** (chạy tại `localhost:1433`)

### 1. Cơ Sở Dữ Liệu
Tạo cơ sở dữ liệu trên SQL Server:
```sql
CREATE DATABASE holoka_newconcept;
```
*(Cấu hình kết nối mặc định tại `backend/src/main/resources/application.properties` là `sa` / `123`).*

### 2. Khởi Chạy Backend
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
* API khả dụng tại: `http://localhost:8080/api`
* Health check: `http://localhost:8080/actuator/health`
* Flyway sẽ tự động đồng bộ schema database khi khởi động.

### 3. Khởi Chạy Frontend
```powershell
cd frontend
npm install
npm run dev
```
* Giao diện web khả dụng tại: `http://localhost:5173`

---

## 🔑 Thông Tin Đăng Nhập

* **Địa chỉ Email:** `admin@holoka.vn`
* **Mật khẩu:** `Abcd1234@`
* **Workspace mặc định:** *An Nhiên Living* (Quyền: `OWNER`)

---

## 📄 Bản Quyền
Dự án phát triển cho đồ án / hệ thống HOLOKA. Bảo lưu mọi quyền.
