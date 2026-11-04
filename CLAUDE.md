# CLAUDE.md

Bài thực tập: template React cho trang đăng ký sự kiện vé miễn phí (Internet Day 2026), song ngữ vi/en. Hệ thống thật sẽ copy nguyên thư mục `src/template-internet-day/` vào và dùng luôn.

Nguồn yêu cầu:

- **Đặc tả gốc** nằm ở `../new 5.txt`. Khi có mâu thuẫn, file này luôn được ưu tiên.
- **BRD/SRS** nằm ở `../BRD SRS – Trang đăng ký sự kiện (Template React).docx`. Đây là bản BA viết lại, có ít chi tiết hơn đặc tả gốc.

Đặc tả dặn: *"đừng tự đoán nghiệp vụ"*. Gặp điểm chưa rõ thì hỏi, rồi ghi vào mục "Ghi chú và điểm cần anh xác nhận" trong README.

## Lệnh

```bash
npm run dev            # trang demo
npm run build          # tsc -b && vite build
npm run typecheck      # tsc --noEmit -p tsconfig.app.json  ← dùng lệnh này để kiểm tra kiểu thật sự
npm run check:schema   # kiểm tra schema.json theo checklist schema của đặc tả
node scripts/screenshots.mjs http://localhost:5173/   # chụp lại docs/*.png và thumbnail.png (cần dev server đang chạy)
```

`npx tsc --noEmit` ở thư mục gốc **không kiểm tra file nào**, vì `tsconfig.json` có `"files": []`. Lệnh đó vẫn nằm trong checklist nghiệm thu nên phải pass, nhưng muốn kiểm tra kiểu thật thì dùng `npm run typecheck`.

`scripts/screenshots.mjs` thu ảnh 1600 × 900 làm thumbnail. Chụp xong phải thu nhỏ `thumbnail.png` về 800 × 450, ví dụ bằng PIL.

## Ràng buộc cứng (đặc tả nghiệm thu theo các điểm này)

- **Thư viện:** chỉ dùng React 19, TypeScript, Tailwind CSS 4, Vite, `lucide-react`, `framer-motion`. Muốn thêm thư viện khác phải hỏi trước.
- **Ranh giới thư mục template:** bên trong `src/template-internet-day/` không được import từ `src/mock/` hay `main.tsx`, và chỉ dùng import tương đối. Ngược lại thì được: mock và demo có thể import từ template.
- **Không gọi `fetch` hay `axios`.** Mọi lời gọi API đi qua prop `api`. Hai hàm `api` không bao giờ ném lỗi; khi lỗi, `message` trả về đã là câu cho khách đọc, hiển thị nguyên văn.
- **Không dùng `any` hay `localStorage`.** Comment viết bằng tiếng Anh. Không ghi URL server, khoá hay mật khẩu vào code.
- **`src/template-internet-day/src/types.ts`:** phần kiểu của đặc tả là **chép nguyên**, không được đổi tên trường. Chỉ `RegistrationContent` và `AgendaItem` là tự thiết kế.
- **`src/mock/serverData.json`:** chép nguyên từ đặc tả, không được sửa. Biến thể "vé có phí" dùng để thử `SALE10` chỉ nằm trong `main.tsx`.
- **Nội dung theo sự kiện:** mọi chữ, ảnh, màu thay đổi theo sự kiện phải lấy từ `content.defaultData` (tức `schema.json`).
- **Nhãn cố định:** nút, tên ô, câu lỗi form chỉ nằm trong `src/i18n.ts`. Khi thêm nhãn mới phải thêm cho cả `vi` và `en`; kiểu `Dictionary` suy ra từ `vi` nên thiếu bên `en` sẽ báo lỗi kiểu.
- **`main.tsx`:** truyền `content={{ defaultData: schema.defaultData }}` đúng như đặc tả. Nhờ vậy TypeScript kiểm tra luôn `defaultData` có khớp `RegistrationContent` hay không.

## schema.json

- Có đúng 6 khoá gốc: `name`, `version`, `author`, `language` (luôn là `["vi","en"]`), `defaultData`, `editable`.
- Cây khoá của `editable` phải giống hệt `defaultData`. Field con nằm trong `fields`, cả với `block` lẫn `repeater`.
- Chỉ dùng các kiểu field: `block`, `text`, `textarea`, `number`, `toggle`, `select`, `color`, `image`, `url`, `email`, `tel`, `code`, `repeater`.
- Chữ song ngữ khai báo là `block` có 2 field con `vi` và `en`. `label` trong `editable` viết bằng tiếng Anh.
- Kiểu `select` cần có `options` và `default`. Kiểu `number` nên có `min`/`max`. `scripts/check-schema.mjs` kiểm tra cả hai.
- Khi thêm hay đổi trường, sửa cùng lúc 3 chỗ:
  1. `defaultData`;
  2. `editable`;
  3. `RegistrationContent` trong `types.ts`.

  Sau đó chạy `npm run check:schema` và `npm run typecheck`.

## Kiến trúc nhanh

Ưu tiên mở rộng, hạn chế tối đa viết cứng. Mỗi loại thay đổi có một chỗ duy nhất (bảng chi tiết ở mục "Mở rộng" trong README):

- **Nội dung theo sự kiện:** `schema.json`.
- **Quy tắc chung:** `src/config.ts` (regex, số lượng vé, locale, preset bo góc và bố cục).
- **Nhãn giao diện:** `src/i18n.ts`.
- **Ô nhập:** `ATTENDEE_FIELDS` trong `src/formFields.ts`. Từ mảng này suy ra cách render, validate, thứ tự focus và payload `register` (`issuerKey`, `holderKey`).
- **`src/lib/content.ts`:** `resolveContent` duyệt `editable` của schema để làm sạch content: `select` phải nằm trong `options`, `number` bị kẹp theo `min`/`max`, `color` phải là hex, `url`/`image` bị chặn scheme lạ, trường thiếu lấy giá trị mặc định. Thêm trường vào schema thì không cần sửa file này.
- **`src/lib/theme.ts`:** chuyển khối `Theme` thành biến CSS `--er-*`.
  - Component **chỉ** dùng các biến này, không dùng `bg-white`, `slate-*`, `red-*` hay `rounded-xl`.
  - Các biến chính: `--er-surface`, `--er-on-surface`, `--er-muted`, `--er-border`, `--er-subtle`, `--er-ink`, `--er-primary-text`, `--er-radius`, `--er-radius-card`.
  - Màu trạng thái có dạng `--er-{danger|success|info|warning}` cùng các biến `-bg` và `-border`.
- **`src/App.tsx`:** chỉ ghép các phần. Mảng `sections` có cờ `visible`, số bước được đánh tự động.
  - `submittingRef` chặn gọi `register` hai lần.
  - Validate kiểm tra cả vé hay ngày đã chọn có còn hợp lệ không, qua `selectableTickets` và `sessionCodes`.
- **Hooks:** `useRegistrationForm` giữ giá trị và lỗi. Lỗi lưu dạng khoá i18n nên tự dịch khi đổi ngôn ngữ. `useDiscount` xử lý mã ưu đãi: đổi mã hay đổi vé thì bỏ mã đã áp, response cũ bị bỏ qua.

## Kiểm thử thủ công

Mở mục **Demo options** trên trang demo:

- bật/tắt `isPreview`;
- đổi `serverData` giữa: mặc định, 1 ngày, có vé trả phí, không có dữ liệu;
- đổi `content` giữa: `schema.json`, giao diện khác (thẻ nền tối, góc vuông, banner xếp chồng), content hỏng;
- xem số lần `register()` được gọi và request gần nhất.

Tình huống mock theo email: email bắt đầu bằng `trung`, `hetve`, `nhanh` hoặc `matmang` trả lỗi; email khác thì thành công. Với mã ưu đãi, `SALE10` giảm 10%, mã khác báo lỗi.

Với input do React quản lý, test bằng JS phải đặt giá trị qua native setter rồi dispatch sự kiện `input`. Gán `.value` trực tiếp thì React không nhận.

## Điểm đang lệch đặc tả hoặc chờ xác nhận

Danh sách đầy đủ ở cuối README.

- **Ảnh mặc định là đường dẫn local**, không phải URL đầy đủ như quy tắc 6 yêu cầu. Banner và logo đang là `/images/...` trong `public/`. Người dùng đã chọn giữ ảnh Internet Day.
- **Vé đã qua `sale_end_time`** đang ghi "Đã ngừng bán". Đặc tả chưa nêu nhãn cho trường hợp này.
- **Dữ liệu mẫu hết hạn bán sau 01/12/2026.** Sau ngày đó không còn vé nào chọn được; muốn thử luồng đăng ký phải sửa ngày trong `serverData.json`.

## Git

- Remote: `origin` = https://github.com/Devhoinonn003/dang_ky_su_kien.git, nhánh `main`.
- Thông điệp commit kết thúc bằng dòng `Co-Authored-By`.
- File zip để nộp tạo bằng `git archive --format=zip --prefix=event-registration/ -o ../event-registration.zip HEAD`, nên chỉ chứa nội dung đã commit.
