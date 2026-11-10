# MiniBank Admin Web

Trang quản trị dành cho nhân viên ngân hàng, xây dựng bằng Next.js. Ứng dụng
gọi MiniBank Backend để quản lý khách hàng, sản phẩm tài chính, giao dịch,
phê duyệt và phân quyền.

## Tính năng chính

- Đăng nhập và đăng ký tài khoản quản trị.
- Dashboard và báo cáo tổng quan.
- Quản lý khách hàng, hồ sơ KYC và tài liệu.
- Quản lý tài khoản ngân hàng, giao dịch và hoàn tiền.
- Quản lý sản phẩm vay, hồ sơ vay, hợp đồng, hạn mức và lịch trả nợ.
- Quản lý sản phẩm tiết kiệm, tài khoản và yêu cầu tất toán.
- Quy trình phê duyệt giao dịch lớn, khoản vay và tiết kiệm.
- Quản lý nhân viên, vai trò, quyền và nhật ký audit.
- Chatbot/hỗ trợ thời gian thực qua WebSocket/STOMP.

## Công nghệ

- Next.js `16.2.4` với React `19.2.4` và TypeScript.
- Tailwind CSS, Recharts, Lucide React và Sonner.
- Next.js App Router.
- Native WebSocket/STOMP client kết nối backend.

## Yêu cầu

- Node.js phiên bản LTS tương thích với Next.js 16.
- npm (hoặc yarn/pnpm/bun).
- MiniBank Backend đang chạy và có thể truy cập từ trình duyệt.

## Cài đặt

```bash
npm install
```

Tạo `banking-admin/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Giá trị phải là base URL của backend, không thêm dấu `/` ở cuối. Một số môi
trường hiện có thể chạy backend ở cổng `8081`; khi đó thay đổi URL tương ứng.
Biến có tiền tố `NEXT_PUBLIC_` được đưa vào trình duyệt, vì vậy không đặt
secret vào biến này.

## Chạy phát triển

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Kiểm tra và build production

```bash
npm run lint
npm run build
npm run start
```

`npm run start` chạy server production sau khi `npm run build` thành công.

## Cấu trúc thư mục

```text
src/
├── app/       # Route, layout và màn hình theo App Router
└── lib/       # API client, WebSocket client và tiện ích dùng chung
public/        # Tài nguyên tĩnh
```

Các route quản trị nằm dưới `src/app`, còn các client gọi backend nằm dưới
`src/lib/api`. Base URL được đọc từ `NEXT_PUBLIC_API_BASE_URL`; WebSocket dùng
endpoint `/ws` tương ứng.

## Luồng kết nối

```text
Trình duyệt -> Admin Web -> MiniBank Backend -> PostgreSQL
                                      └-----> AI Service
```

Backend chịu trách nhiệm xác thực, phân quyền và kiểm tra dữ liệu. Không kết
nối trực tiếp từ admin web tới PostgreSQL.

## Lưu ý triển khai

- Cấu hình CORS và địa chỉ frontend ở backend trước khi deploy.
- Chỉ dùng HTTPS/WSS trong môi trường production.
- Không commit `.env`, token, cookie, khóa ký hoặc thông tin khách hàng.
- Kiểm tra quyền theo vai trò trên backend; ẩn menu ở frontend không thay thế
  cho phân quyền phía server.

## Góp phần

1. Tạo branch từ `main`.
2. Chạy `npm run lint` và `npm run build`.
3. Mô tả endpoint/backend cần thiết khi thay đổi luồng quản trị.
4. Không đưa secret hoặc dữ liệu khách hàng thật vào commit.
