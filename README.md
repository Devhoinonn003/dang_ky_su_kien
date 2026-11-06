# Template Internet Day – trang đăng ký sự kiện

Đây là component React cho trang đăng ký tham dự sự kiện vé miễn phí, có đủ tiếng Việt và tiếng Anh. Khách xem thông tin sự kiện, chọn loại vé và ngày, điền thông tin, nhập mã ưu đãi nếu có, gửi đăng ký rồi nhận mã vé kèm QR.

Công nghệ: React 19, TypeScript, Tailwind CSS 4, Vite, lucide-react, framer-motion.

## Cách chạy

```bash
npm install
npm run dev            # trang demo: http://localhost:5173
npm run build          # tsc -b && vite build
npx tsc --noEmit       # kiểm tra kiểu (hoặc: npm run typecheck)
npm run check:schema   # kiểm tra schema.json theo checklist phần schema
```

Không cần cấu hình gì thêm.

### Trang demo (`src/main.tsx`)

Trang demo đọc schema giống cách hệ thống sẽ đọc: `content={{ defaultData: schema.defaultData }}`. Thanh **Demo** ở đầu trang có nút đổi ngôn ngữ vi/en. Mục **Demo options** dùng để thử các trường hợp biên:

- bật/tắt `isPreview`;
- chọn `serverData`:
  - `serverData.json` (dữ liệu giả chép nguyên từ đặc tả);
  - chỉ có 1 ngày;
  - thêm một vé có phí;
  - không có dữ liệu;
- chọn `content`:
  - `schema.json`;
  - *alternative theme*: thẻ nền tối, góc vuông, banner xếp chồng, màu chính vàng;
  - *partial / broken*: thiếu trường hoặc sai kiểu;
- xem `register()` đã được gọi bao nhiêu lần và request gần nhất.

### Thử 6 tình huống của mock

| Thao tác | Kết quả |
|---|---|
| Nhập mã `SALE10` (chọn *+ paid ticket*, vé Workshop) | Giảm 10%: 150.000 đ → 135.000 đ |
| Nhập mã khác | "Mã giảm giá không hợp lệ hoặc đã hết hạn." hiện dưới ô mã |
| Email thường, ví dụ `a@example.com` | Màn xác nhận có mã vé và QR |
| Email bắt đầu bằng `trung` / `hetve` / `nhanh` / `matmang` | Câu lỗi tương ứng hiện dưới nút Gửi, form giữ nguyên dữ liệu |

Mỗi lần gọi mock chờ 800 ms. Khi trang ở tiếng Anh, mock trả câu tiếng Anh.

## Cấu trúc

```
src/
├── template-internet-day/          # THƯ MỤC BÀN GIAO
│   ├── index.tsx                   # 'use client' + export default component chính
│   ├── schema.json                 # defaultData + editable
│   ├── template_metadata.json      # id là UUID mới
│   ├── thumbnail.png               # 800 × 450
│   └── src/
│       ├── App.tsx                 # chỉ ghép các phần; số bước tự đánh theo các phần đang hiện
│       ├── config.ts               # hằng số: regex validate, số lượng vé, locale, preset bo góc, bố cục hero
│       ├── formFields.ts           # khai báo các ô nhập: hiển thị, validate, map sang payload register
│       ├── i18n.ts                 # nhãn cố định, đủ vi và en
│       ├── types.ts                # kiểu chép nguyên từ đặc tả + RegistrationContent
│       ├── hooks/                  # useRegistrationForm (giá trị, lỗi), useDiscount (mã ưu đãi)
│       ├── lib/                    # content (đọc schema), theme (biến màu), request, serverData, format, validation
│       └── components/             # EventIntro, Agenda, TicketPicker, SessionPicker, AttendeeSection,
│                                   # Field, DiscountField, OrderSummary, Confirmation, SiteFooter, SectionHeading
├── mock/                           # chỉ để chạy thử, không bàn giao
│   ├── serverData.json
│   └── mockApi.ts
└── main.tsx                        # trang demo
public/images/                      # banner desktop/mobile + logo Internet Day
scripts/                            # check-schema.mjs, screenshots.mjs
```

Template không dùng file `index.css` riêng vì toàn bộ style viết bằng class Tailwind và biến CSS.

Các ràng buộc của thư mục template:

- Không import gì từ `mock/` hay `main.tsx`. Import nội bộ đều dùng đường dẫn tương đối.
- Không gọi `fetch` hay `axios`. Mọi lời gọi API đi qua prop `api`.
- Không dùng `any` hay `localStorage`.
- Comment viết bằng tiếng Anh.

## Mở rộng

Nguyên tắc: nội dung theo sự kiện nằm trong `schema.json`, quy tắc chung nằm trong `config.ts`, nhãn cố định nằm trong `i18n.ts`. Component không viết cứng chữ, màu hay độ bo góc.

| Muốn… | Sửa ở đâu |
|---|---|
| Thêm trường nội dung (chữ, ảnh, màu, bật/tắt…) | `schema.json` (`defaultData` + `editable`) và `RegistrationContent` trong `types.ts`. `lib/content.ts` tự kiểm tra giá trị theo `editable`, không cần viết thêm code kiểm tra |
| Thêm, bớt hay đổi thứ tự ô nhập | `ATTENDEE_FIELDS` trong `formFields.ts`. Hiển thị, validate, thứ tự focus khi lỗi và payload `register` đều lấy từ mảng này |
| Đổi quy tắc email, số điện thoại, số lượng vé | `config.ts` |
| Thêm một phần form mới | thêm phần tử vào mảng `sections` trong `App.tsx`; số bước tự đánh lại |
| Thêm preset bo góc hay bố cục hero | `RADIUS_PRESETS` / `HERO_LAYOUTS` trong `config.ts` và `options` tương ứng trong `schema.json` |
| Đổi màu trạng thái (lỗi, thành công, thông tin, cảnh báo) | `STATUS` trong `lib/theme.ts` |
| Thêm nhãn giao diện | `i18n.ts`, thêm cho cả `vi` và `en` (thiếu bên nào thì TypeScript báo lỗi) |

**Màu sắc.** Component chỉ dùng biến CSS do `lib/theme.ts` sinh ra từ khối `Theme`, ví dụ `--er-primary`, `--er-surface`, `--er-on-surface`, `--er-muted`, `--er-danger`. Màu chữ được tự chọn đen hoặc trắng theo độ tương phản. Màu trạng thái có bộ riêng cho thẻ nền sáng và nền tối, nên đổi bảng màu nào cũng đọc được.

**Kiểm tra giá trị từ editor.** Giá trị không hợp lệ sẽ bị thay bằng giá trị mặc định trong schema:

- `select` có giá trị ngoài `options`;
- `number` vượt `min`/`max` (bị kẹp về trong khoảng);
- `color` không phải mã hex;
- `url`/`image` dùng scheme lạ như `javascript:`.

## Bảng trường `content.defaultData`

| Đường dẫn | Kiểu field | Ý nghĩa |
|---|---|---|
| `customCSS` | code (css) | CSS tuỳ chỉnh, mặc định `""` |
| `metadata.title`, `metadata.description` | block vi/en | Tiêu đề tab, mô tả khi chia sẻ link |
| `metadata.icon` | image | Favicon |
| `Theme.primaryColor` | color | Màu nút và điểm nhấn chính |
| `Theme.accentColor` | color | Màu nhấn phụ (icon, giờ trong lịch trình) |
| `Theme.backgroundColor` | color | Màu nền trang |
| `Theme.surfaceColor` | color | Màu nền ô nhập và các thẻ sáng |
| `Theme.headingFromColor` / `Theme.headingToColor` | color | Hai màu chuyển sắc của tiêu đề "Đăng ký tham gia" và nút Gửi |
| `Theme.radius` | select `none` / `small` / `medium` / `large` / `pill` | Độ bo góc; `pill` bo tròn hẳn ô nhập và nút như mẫu |
| `Hero.layout` | select `overlay` / `stacked` | Chữ đè lên banner, hoặc banner ở trên và chữ ở dưới |
| `Hero.overlayOffsetMobile` / `Hero.overlayOffsetDesktop` | number (vw) | Khoảng trống phía trên chữ khi dùng `overlay`, để chữ không đè lên logo trong banner |
| `Hero.bannerDesktop` / `Hero.bannerMobile` | image | Banner từ 768 px trở lên / dưới 768 px |
| `Hero.logo` | image | Logo ở phần giới thiệu và màn xác nhận |
| `Hero.tagline`, `Hero.title`, `Hero.time`, `Hero.location` | block vi/en | Thông tin sự kiện |
| `Hero.description` | block vi/en (textarea) | Mô tả ngắn |
| `Agenda[]` | repeater `{ time, label{vi,en} }` | Lịch trình |
| `Form.backgroundDesktop` / `Form.backgroundMobile` | image | Ảnh nền phía sau form, từ 768 px trở lên / dưới 768 px. Mép dưới ảnh mờ dần vào màu nền |
| `Form.showAttendanceSessions` | toggle | Bật/tắt nhóm "Phiên tham dự" (chỉ hiển thị, không gửi đi) |
| `Form.attendanceSessions[]` | repeater `{ code, startsRow, label{vi,en} }` | Các phiên trong nhóm; `startsRow` để xuống dòng như mẫu (2 phiên rồi 3 phiên) |
| `Form.showDiscount`, `Form.showCompany`, `Form.showPosition` | toggle | Bật/tắt ô mã ưu đãi, ô công ty, ô chức danh |
| `Form.termsText` | block vi/en (textarea) | Nội dung ô đồng ý điều khoản |
| `Form.termsUrl` | url | Link điều khoản đầy đủ, để trống thì ẩn |
| `Confirmation.thankYouTitle`, `Confirmation.thankYouMessage` | block vi/en | Lời cảm ơn trên màn xác nhận |
| `Organizer.name` | block vi/en | Tên ban tổ chức (chân trang, phần giới thiệu) |
| `Organizer.contactEmail` / `Organizer.hotline` | email / tel | Liên hệ ở chân trang |

Thiếu trường nào hoặc sai kiểu thì template dùng giá trị trong `schema.json` (xem mục "Mở rộng").

## Ảnh chụp màn hình

| 360 px | 1440 px |
|---|---|
| ![360 px](docs/screenshot-360.png) | ![1440 px](docs/screenshot-1440.png) |

Màn xác nhận ở 360 px: [docs/confirmation-360.png](docs/confirmation-360.png).

Để chụp lại, chạy dev server rồi `node scripts/screenshots.mjs http://localhost:5173/`.

## Tự kiểm tra trước khi nộp

- [x] `npm install` rồi `npm run dev` chạy được ngay.
- [x] `npm run build` và `npx tsc --noEmit` không lỗi.
- [x] Thư mục template đúng cấu trúc; không import từ `mock/` hay `main.tsx`; không gọi `fetch`/`axios`.
- [x] `types.ts` đúng tên trường như đặc tả.
- [x] Đủ 7 phần giao diện.
- [x] Vé VIP (hết vé) hiện nhưng không chọn được.
- [x] Đăng ký thành công có mã vé và QR. Nút Đăng ký mới đưa về form trống.
- [x] Đủ 6 tình huống mock, câu lỗi hiện đúng chỗ, dữ liệu form còn nguyên.
- [x] Bấm Gửi liên tục chỉ gọi `register` một lần.
- [x] Form báo lỗi khi để trống, sai email, sai số điện thoại, chưa tick điều khoản.
- [x] `registered_session` gửi `["D1"]` / `["D2"]`; khi chỉ có 1 ngày thì gửi `[]`.
- [x] Đổi `language` thì toàn bộ chữ đổi theo (xem ghi chú 2).
- [x] Content thiếu trường, hoặc không có `serverData` với `isPreview = true`: trang vẫn hiện, không lỗi.
- [x] Ở 360 px không có cuộn ngang. Điền và gửi được bằng bàn phím.
- [x] Chỉ dùng lucide-react và framer-motion ngoài React, Tailwind, Vite.
- [x] `schema.json` hợp lệ, đủ 6 khoá gốc, có `customCSS` và `metadata`. Cây khoá của `defaultData` và `editable` khớp nhau. Kiểm tra bằng `npm run check:schema`.
- [x] Đủ nội dung tối thiểu ở quy tắc 4. Mọi chữ có cả vi và en.
- [x] Đổi chữ, màu hoặc thêm một dòng `Agenda` trong `defaultData` thì trang demo đổi theo.
- [x] Có `template_metadata.json` với UUID mới và `thumbnail.png`.

## Ghi chú và điểm cần anh xác nhận

1. **Ảnh mặc định chưa phải URL đầy đủ.** Quy tắc 6 yêu cầu URL đầy đủ, nhưng banner và logo Internet Day hiện là file local trong `public/images/`, nên schema đang ghi `/images/...`. Khi có CDN, hoặc khi ban tổ chức tải ảnh lên editor, sẽ thay bằng URL đầy đủ.
2. **Một phần chữ không đổi theo ngôn ngữ.** Tên vé, mô tả vé và tên ngày lấy nguyên từ `serverData`, nên vẫn là tiếng Việt khi trang ở tiếng Anh. Ký hiệu "đ" giữ nguyên vì đặc tả yêu cầu định dạng giá theo `vi-VN`.
3. **Mã ưu đãi với dữ liệu mẫu giảm 0 đ.** Mọi vé trong `serverData.json` đều giá `0.00`, nên `SALE10` giảm 0 đ. Trang demo có thêm lựa chọn *+ paid ticket* (vé Workshop 150.000 đ) để thấy được số tiền giảm. File `serverData.json` vẫn giữ nguyên như đặc tả.
4. **Nhãn cho vé đã hết hạn bán là tự chọn.** Vé chưa tới giờ mở bán ghi "Chưa mở bán". Vé đã qua `sale_end_time` đang ghi "Đã ngừng bán", vì đặc tả chưa nêu nhãn cho trường hợp này.
5. **Dữ liệu mẫu sẽ hết hạn bán.** `sale_end_time` trong dữ liệu mẫu là 01/12/2026. Sau ngày này mọi vé đều không chọn được, nên muốn thử luồng đăng ký phải sửa ngày trong `src/mock/serverData.json`.
6. **Form dựng theo mẫu `background/Form đăng ký ID2026.pdf`, nhưng dữ liệu theo đặc tả.** Ảnh nền form được xuất từ chính file PDF (đã xoá phần chữ và ô nhập). Bố cục, phông chữ (Montserrat, League Spartan) và tỉ lệ cột lấy theo số đo trong PDF. Mẫu có những phần đặc tả không có, và ngược lại:
   - Mẫu có ô **Vị trí công tác**, **Ngành/lĩnh vực công tác**, **Tham gia với vai trò**. Các ô này chưa làm, vì `RegistrationRequest` trong đặc tả không có trường tương ứng và mẫu cũng chưa có danh sách lựa chọn.
   - Mẫu có 5 phiên (Cả ngày, Phiên sáng, Phiên chiều 1–3). Trang hiển thị nhóm **Phiên tham dự** này theo cấu hình `Form.attendanceSessions`, nhưng **chỉ để hiển thị**: lựa chọn không bắt buộc và không gửi lên `register()`, vì `RegistrationRequest` không có trường cho nó. Ngày tham dự vẫn lấy từ `serverData` và gửi qua `registered_session` như đặc tả. Cần xác nhận: nếu phiên phải được lưu thì cần bổ sung trường vào đặc tả.
   - Mẫu không có phần chọn vé, mã ưu đãi, ô đồng ý điều khoản và tóm tắt. Trang vẫn giữ các phần này vì đặc tả bắt buộc, và trình bày cùng kiểu với mẫu.
   - Chữ trong mẫu điện thoại chỉ khoảng 8 px và ô nhập cao khoảng 16 px. Trang dùng tối thiểu 13 px và ô cao 36 px để đọc và bấm được trên điện thoại.
7. **Phông chữ tải từ Google Fonts** (`FORM_FONTS` trong `src/config.ts`). Nếu hệ thống thật chặn nguồn ngoài, trang tự dùng phông mặc định.
