# Ứng dụng Quản lý danh bạ điện thoại

Bài tập lớn học phần **Kỹ nghệ phần mềm (INF722)**, Khoa Công nghệ thông tin, Trường Đại học Hải Phòng.

Ứng dụng di động (Android/iOS) để lưu và tra cứu số điện thoại. Dữ liệu lưu trên máy bằng SQLite, có khóa bằng mã PIN.

## Chức năng

| Mã | Chức năng |
|---|---|
| UC-01 | Xem danh bạ, sắp xếp A–Z, chia mục theo chữ cái đầu |
| UC-02 / UC-03 | Thêm, sửa liên hệ. Kiểm tra họ tên, số điện thoại, email; chặn trùng số |
| UC-04 | Xóa vào thùng rác, khôi phục, xóa vĩnh viễn |
| UC-05 | Tìm theo tên **không cần gõ dấu** hoặc theo một phần số điện thoại |
| UC-06 | Đánh dấu và xem danh sách yêu thích |
| UC-07 | Khóa ứng dụng bằng PIN 4 số (lưu dạng băm SHA-256 có muối, sai 5 lần thì khóa 30 giây) |
| UC-08 | Gọi điện, nhắn SMS, gửi email bằng một chạm |
| UC-09 | Quản lý nhóm liên hệ (Gia đình, Bạn bè, Công việc...) |

## Cấu trúc thư mục

```
├── danh-ba/                 Mã nguồn ứng dụng (React Native + Expo SDK 58)
│   ├── App.js               Điểm vào: mở CSDL, khóa PIN, điều hướng
│   ├── src/db/              Tầng truy cập dữ liệu (SQLite, lược đồ, dữ liệu mẫu)
│   ├── src/services/        Tầng nghiệp vụ (ContactService, GroupService, AuthService, validation)
│   ├── src/screens/         Tầng giao diện (8 màn hình)
│   ├── src/ui/              Thành phần giao diện dùng chung
│   └── __tests__/           Kiểm thử tự động (unit/ và integration/)
├── docs/uml/                Mã nguồn PlantUML (.puml) và ảnh PNG của các sơ đồ
├── docs/screenshots/        Ảnh chụp màn hình ứng dụng
├── docs/BaoCao_BTL_DanhBa.docx   Báo cáo bài tập lớn
└── .github/workflows/ci.yml Tích hợp liên tục (lint + test + build)
```

## Cài đặt và chạy thử

Yêu cầu: **Node.js 20 trở lên** (đã thử với Node 24) và điện thoại có cài app **Expo Go** (CH Play / App Store).

**Cách nhanh trên Windows:** nháy đúp một trong các tệp ở thư mục gốc:

| Tệp | Tác dụng |
|---|---|
| `1_Chay_tren_dien_thoai.bat` | Hiện mã QR để quét bằng Expo Go |
| `2_Chay_tren_trinh_duyet.bat` | Mở ứng dụng trên trình duyệt (http://localhost:8081) |
| `3_Chay_kiem_thu.bat` | Chạy toàn bộ kiểm thử tự động |

Hoặc chạy bằng lệnh:

```bash
cd danh-ba
npm install
npx expo start
```

- **Trên điện thoại:** quét mã QR hiện trong terminal bằng Expo Go (điện thoại và máy tính dùng chung mạng Wi-Fi).
- **Trên trình duyệt:** bấm phím `w` trong terminal, hoặc chạy `npm run web`.

Lần đầu mở app sẽ yêu cầu **tạo mã PIN 4 số**. CSDL có sẵn 10 liên hệ mẫu và 3 nhóm.

## Kiểm thử và kiểm tra mã

```bash
cd danh-ba
npm test            # chạy toàn bộ kiểm thử
npm run test:ci     # chạy kèm đo độ bao phủ (coverage/) và xuất JUnit (reports/)
npm run lint        # kiểm tra mã bằng ESLint
```

- `__tests__/unit/`: kiểm thử đơn vị tầng nghiệp vụ, dùng repository giả lập trong bộ nhớ.
- `__tests__/integration/`: kiểm thử tích hợp tầng nghiệp vụ, repository và lược đồ SQLite thật (dùng `node:sqlite` có sẵn trong Node.js).

## Sinh lại sơ đồ UML

Cần Java và [plantuml.jar](https://plantuml.com/download). Không cần cài Graphviz vì các sơ đồ dùng `!pragma layout smetana`.

```bash
cd docs/uml
java -jar plantuml.jar -charset UTF-8 -tpng -o png *.puml
```

## Kiến trúc

Ứng dụng chia 3 tầng: **Giao diện → Nghiệp vụ → Truy cập dữ liệu**. Tầng nghiệp vụ nhận repository qua hàm khởi tạo (dependency injection), nên có thể kiểm thử mà không cần điện thoại hay SQLite thật.

## Ghi chú sử dụng AI

Theo mục VI.5–6 của đề cương, nhóm ghi nhận: mã nguồn ban đầu, kịch bản kiểm thử, sơ đồ PlantUML và bản nháp báo cáo được tạo với sự hỗ trợ của trợ lý AI (Claude). Nhóm đã chạy kiểm thử, chạy thử ứng dụng và rà soát lại toàn bộ kết quả. Không đưa dữ liệu cá nhân thật lên dịch vụ AI.
