# HouseNow Backend Intern Mini Test 2027

Hoàn thiện endpoint đặt chỗ trong starter project này.

## Phạm vi

- Thời gian đề xuất: **90 phút**.
- Stack bắt buộc: **Node.js 22.12+**, **TypeScript**, **TanStack Start/Router**
  và **Kysely**.
- Được sử dụng tài liệu và công cụ AI.
- Không thay framework, query builder, database schema, tests hoặc API contract.
- Không cần làm frontend, authentication, Docker hay cloud deployment.

## Chạy project

```bash
npm ci
npm test
npm run dev
```

Public tests chỉ kiểm tra project có thể chạy và một số hành vi cơ bản; không
đại diện cho toàn bộ tiêu chí đánh giá.

## API

### `POST /api/bookings`

Request:

```json
{
  "userId": 1,
  "slotId": 10,
  "idempotencyKey": "booking-user1-slot10"
}
```

Successful response:

```json
{
  "id": 1,
  "userId": 1,
  "slotId": 10,
  "status": "CONFIRMED"
}
```

Database có sẵn users `1`, `2`, `3` và slots `10`, `11`, `12`.

## Yêu cầu

- Validate request và trả lỗi nghiệp vụ nhất quán dưới dạng
  `{ "code": "...", "message": "..." }`.
- Không tạo booking cho resource không tồn tại hoặc không còn khả dụng.
- Giữ booking và số chỗ còn lại nhất quán khi request bị retry, trùng lặp hoặc
  được xử lý đồng thời.
- Request thất bại không được để lại thay đổi dữ liệu dở dang.
- Không hard-code dữ liệu seed trong xử lý nghiệp vụ.

Chỉ sửa code trong `src/`. Không cần viết tài liệu dài.

## Nộp bài

1. Fork repository vào tài khoản GitHub cá nhân.
2. Implement trên một branch mới.
3. Gửi link repository hoặc Pull Request theo hướng dẫn của HR.
