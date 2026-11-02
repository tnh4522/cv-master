# 📄 CV Master — Modern Interactive CV/Resume Builder

<div align="center">

![CV Master Logo](/public/logo.svg)

**Nền tảng tạo, chỉnh sửa và tối ưu hóa CV/Resume chuyên nghiệp chuẩn ATS với xem trước A4 thời gian thực, hỗ trợ trợ lý AI thông minh.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1-FCC72B?logo=vitest&logoColor=black)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Tính năng](#-tính-năng-nổi-bật) • [Công nghệ](#-công-nghệ-sử-dụng) • [Cài đặt](#-cài-đặt--chạy-dự-án) • [Cấu trúc](#-cấu-trúc-thư-mục) • [Biến môi trường](#-biến-môi-trường) • [Kiểm thử](#-kiểm-thử-automated-tests)

</div>

---

## 🌟 Giới thiệu

**CV Master** là ứng dụng web mã nguồn mở giúp lập trình viên và người tìm việc thiết kế hồ sơ năng lực (CV/Resume) chuẩn mực, đạt tỷ lệ vượt qua hệ thống **ATS (Applicant Tracking System)** cao nhất. 

Ứng dụng cung cấp bảng điều khiển trực quan với khả năng xem trước trang giấy khổ A4 theo thời gian thực (WYSIWYG), kéo-thả sắp xếp các mục linh hoạt, tinh chỉnh typography, tự động kiểm tra ngắt trang nhiều trang, tích hợp trợ lý AI (Google Gemini) để viết lại tóm tắt, sửa lỗi chính tả và đánh giá độ phù hợp với tin tuyển dụng.

---

## 🚀 Tính năng nổi bật

### 1. 📝 Quản lý nội dung CV toàn diện
- **Thông tin cá nhân (Personal Information)**: Họ tên, chức danh nghề nghiệp, và thông tin liên hệ được tối ưu chuẩn mực theo 3 dòng cố định: (1) Email & Số điện thoại, (2) Ngày sinh & Địa chỉ, (3) LinkedIn & Portfolio/Website.
- **Ảnh đại diện linh hoạt**: Tải ảnh trực tiếp (`PNG/JPG/WebP <= 2MB`) hoặc nhập URL, tùy chỉnh kích thước (`size: 40px – 200px`), bo tròn góc (`border-radius: 0 – 100px`), bật/tắt hiển thị trên bản in.
- **Tóm tắt chuyên môn (Summary)**: Bộ soạn thảo Rich Text (TipTap) hỗ trợ định dạng danh sách, in đậm, in nghiêng, liên kết, và các công cụ AI.
- **8+ danh mục động**:
  - 💼 **Work Experience (Kinh nghiệm làm việc)**: Tên công ty, vị trí, khoảng thời gian, địa điểm, hình thức làm việc, website, mô tả chi tiết.
  - 🚀 **Projects (Dự án nổi bật)**: Tên dự án, mô tả ngắn, năm hoàn thành, liên kết demo/repo, công nghệ/từ khóa (hỗ trợ kéo-thả sắp xếp chip tag).
  - 🎓 **Education (Học vấn)**: Trường/viện, bằng cấp, chuyên ngành, thời gian đào tạo, thành tích.
  - ⚡ **Technical Skills (Kỹ năng kỹ thuật)**: Nhóm kỹ năng, từ khóa/tags kéo-thả sắp xếp, tùy biến 3 dạng hiển thị (Inline, 2 cột Grid, 1 cột Dọc).
  - 🌐 **Languages (Ngoại ngữ)**: Cấp độ thành thạo, chứng chỉ (IELTS, TOEIC, JLPT...), điểm số, ngày cấp, link xác thực chứng chỉ, đánh giá chi tiết 4 kỹ năng (Nghe, Nói, Đọc, Viết) và ghi chú.
  - 📜 **Certifications (Chứng chỉ nghề nghiệp)**: Tên chứng chỉ, đơn vị cấp, ngày cấp, mã/đường dẫn xác thực.
  - 🏆 **Awards (Giải thưởng & Danh hiệu)**: Tên giải thưởng, tổ chức trao thưởng, thời gian, mô tả.
  - 🤝 **Volunteering (Hoạt động cộng đồng)**: Tổ chức, vai trò, mốc thời gian, địa điểm, đóng góp.
  - 🎯 **Interests (Sở thích)**: Tên sở thích, mô tả chi tiết và từ khóa/tags đi kèm.

### 2. 🔀 Tùy biến cấu trúc & Kéo thả (Drag & Drop)
- Tự do đổi tên tiêu đề bất kỳ mục nào (Rename Section Titles).
- **Kéo thả sắp xếp thứ tự các mục** trên CV qua thư viện `@dnd-kit`.
- **Ẩn / Hiện mục bất kỳ**: Tạm ẩn kinh nghiệm hoặc dự án không phù hợp với vị trí ứng tuyển mà không cần xóa dữ liệu.
- Nhân bản (Duplicate) nhanh chóng chỉ với 1 cú click.

### 3. 📄 Live Canvas A4 & Tinh chỉnh bố cục in
- Khung xem trước A4 tỉ lệ chuẩn (`210mm x 297mm`, `794px x 1122.5px`), hỗ trợ phóng to/thu nhỏ (Zoom in/out), kéo rê (Pan), và căn giữa tự động.
- **Dấu chỉ ngắt trang thông minh (Page Break Indicator)**: Hiển thị đường nét đứt trực quan khi nội dung vượt quá trang 1, trang 2 để người dùng chủ động căn chỉnh độ dài trước khi xuất file.
- **Controls & Styling Sheet**:
  - Căn lề thông tin liên hệ: Trái (Left), Giữa (Center), Phải (Right).
  - Kiểu bố cục kỹ năng: `Inline` (dàn ngang tiết kiệm dòng), `Grid Col` (2 cột cân đối), `Grid Row` (từng dòng riêng biệt).
  - Typography: Tích hợp Google Fonts phân nhóm thông minh (ATS-Friendly, Sans-serif, Serif, Display, Monospace, Handwriting). Hỗ trợ font tiếng Việt như `Be Vietnam Pro`.
  - Tùy chỉnh: Cỡ chữ (Font Size), chiều cao dòng (Line Height), khoảng cách mục (Vertical Spacing), lề trang (Page Margin).

### 4. 🤖 Trợ lý AI & Đánh giá CV (Gemini AI)
- **Công cụ viết trực tiếp trong editor**:
  - ✨ *Improve Writing*: Tối ưu hóa câu từ theo hướng hành động, chuyên nghiệp hơn.
  - 🔍 *Fix Typos*: Tự động rà soát và sửa lỗi chính tả, ngữ pháp tiếng Anh.
  - 🎛️ *Customize Tone*: 6 chế độ điều chỉnh phong cách (`Shorter`, `Longer`, `More Formal`, `More Informal`, `More Creative`, `More Technical`).
- **Trang phân tích ATS chuyên sâu (`/review`)**:
  - Đánh giá hồ sơ dựa trên Tiêu đề công việc mục tiêu & Mô tả công việc (Job Description).
  - Đồng hồ hiển thị Điểm tổng thể (Overall Score) và Độ phù hợp công việc (Job Fit %).
  - Phân tích 4 tab: Tổng quan (Overview), Chi tiết ATS (Detailed Analysis), Đề xuất cải thiện (Recommendations), và Danh sách việc cần làm có Checkbox tương tác (Specific Improvements).

### 5. 📥 Xuất & Nhập dữ liệu an toàn
- **Nhập CV (Import)**:
  - 📂 **CV Master JSON**: Tự động nhận diện, kiểm tra tính hợp lệ qua Zod Schema và khôi phục toàn bộ CV chỉ trong 1 bước.
  - 📑 **PDF Resume Import**: Trích xuất dữ liệu từ văn bản PDF và ánh xạ vào các trường thông tin.
  - 🖼️ **Image CV Import**: Phân tích ảnh chụp CV kèm thuật toán kiểm tra heuristic 6 tín hiệu để loại bỏ tài liệu không hợp lệ.
- **Xuất CV (Export)**:
  - 🖨️ **PDF Document**: Xuất PDF chuẩn in ấn chất lượng cao, giữ nguyên font chữ và màu sắc, tự động loại bỏ các công cụ hỗ trợ xem trước.
  - 💾 **JSON Backup**: Lưu trữ file sao lưu ngoại tuyến để tiếp tục chỉnh sửa bất cứ lúc nào.

### 6. 🌓 Giao diện & Trải nghiệm
- Chế độ Sáng / Tối (Dark / Light Mode) mượt mà, lưu trạng thái tự động vào `localStorage`.
- Giao diện đáp ứng (Responsive Layout): Chế độ 3 cột tiện lợi trên màn hình Desktop lớn và điều hướng chuyển đổi tab `Content / Preview` tối ưu cho điện thoại & tablet.
- Bảo mật XSS nghiêm ngặt: Lọc mã độc trong Rich Text HTML, kiểm tra giao thức URL an toàn (`https://`, loại bỏ `javascript:`).

---

## 🛠️ Công nghệ sử dụng

| Lĩnh vực | Thư viện / Công nghệ |
|---|---|
| **Frontend Core** | [React 18](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/), [Vite 5](https://vitejs.dev/) |
| **Styling & UI** | [Tailwind CSS 3](https://tailwindcss.com/), [Radix UI Primitives](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) |
| **Quản lý trạng thái** | [Zustand 5](https://zustand.docs.pmnd.rs/) (với cơ chế persist `localStorage` tự động) |
| **Biểu mẫu & Kiểm thực** | [React Hook Form](https://react-hook-form.com/), [Zod 3](https://zod.dev/) |
| **Soạn thảo Rich Text** | [TipTap 2](https://tiptap.dev/) (Document, Paragraph, Text, Lists, Link, History) |
| **Kéo thả (DnD)** | [@dnd-kit/core](https://dndkit.com/), `@dnd-kit/sortable` |
| **Canvas & Preview** | [react-zoom-pan-pinch](https://github.com/BetterTyped/react-zoom-pan-pinch) |
| **Trí tuệ nhân tạo (AI)** | [Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash` / `gemini-1.5-flash`) |
| **Kiểm thử (Testing)** | [Vitest](https://vitest.dev/), [@testing-library/react](https://testing-library.com/), [jsdom](https://github.com/jsdom/jsdom) |

---

## 💻 Cài đặt & Chạy dự án

### Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên
- **Trình quản lý gói**: `npm`, `yarn`, hoặc `pnpm`

### Các bước cài đặt

1. **Clone kho lưu trữ về máy**:
   ```bash
   git clone https://github.com/tnh4522/cv-master.git
   cd cv-master
   ```

2. **Cài đặt các gói phụ thuộc**:
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (Tùy chọn)**:
   Tạo file `.env.local` ở thư mục gốc nếu bạn muốn sử dụng tính năng Gemini AI trực tuyến:
   ```env
   VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
   VITE_GEMINI_MODEL=gemini-2.5-flash
   ```
   > *Lưu ý: Nếu không cấu hình khóa API Gemini, ứng dụng vẫn hoạt động 100% trơn tru nhờ bộ xử lý dữ liệu và thuật toán phân tích cục bộ (Local Fallback Adapters).*

4. **Khởi chạy môi trường phát triển (Dev Server)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại địa chỉ: `http://localhost:5173`

5. **Đóng gói mã nguồn cho Production**:
   ```bash
   npm run build
   ```

---

## 📁 Cấu trúc thư mục

```text
cv-master/
├── public/                     # Tài nguyên tĩnh (logo, favicon...)
├── src/
│   ├── components/
│   │   ├── controls/           # Bộ điều khiển bố cục (FontPicker, DndSections, ControlsSheet)
│   │   ├── editor/             # Các panel chỉnh sửa (Basics, Summary, SectionList, RichText)
│   │   ├── icons/              # Bộ icon tùy biến (SectionIcon, CustomFieldIcon, LinkedIn, WhatsApp...)
│   │   ├── layout/             # Layout chính (Header, Navigation Rail)
│   │   ├── modals/             # Hộp thoại popup (SectionDialogs, Import, Download, AiReview)
│   │   ├── preview/            # Xem trước A4 (ResumeSheet, PreviewCanvas)
│   │   └── ui/                 # Thành phần giao diện nền tảng (Radix UI, Form, Toast)
│   ├── context/                # React Contexts (ThemeContext, DialogContext)
│   ├── lib/                    # Tiện ích bổ trợ (cn, hằng số cấu hình, debounce, math)
│   ├── pages/                  # Các trang (WorkspacePage, ReviewPage)
│   ├── schemas/                # Lược đồ kiểm thực Zod (resumeSchemas, importSchemas)
│   ├── services/               # Dịch vụ tích hợp (aiService, pdfService, photoService, fontsService, importService)
│   ├── store/                  # Quản lý state toàn cục (useResumeStore, usePdfSettingsStore, useReviewStore)
│   ├── test/                   # Bộ kiểm thử chất lượng tự động (Phase 2 -> Phase 5)
│   ├── types/                  # Định nghĩa kiểu dữ liệu TypeScript (resume.ts)
│   ├── App.tsx                 # Điều hướng Router & ErrorBoundary
│   ├── main.tsx                # Điểm khởi chạy ứng dụng
│   └── index.css               # Định dạng CSS gốc & Biến màu Tailwind
├── docs/                       # Tài liệu nghiên cứu kiến trúc & đặc tả kỹ thuật
├── vite.config.ts              # Cấu hình Vite & Vitest
├── tailwind.config.js          # Cấu hình Tailwind CSS
└── tsconfig.json               # Cấu hình TypeScript
```

---

## 🔑 Biến môi trường

Bạn có thể tạo file `.env.local` để tinh chỉnh các tham số sau:

| Tên biến | Bắt buộc | Mặc định | Mô tả |
|---|:---:|---|---|
| `VITE_GEMINI_API_KEY` | Không | `undefined` | Khóa API Google Gemini cho các tính năng AI |
| `VITE_GEMINI_MODEL` | Không | `gemini-2.5-flash` | Tên model Gemini muốn sử dụng |
| `VITE_GOOGLE_FONTS_API_KEY` | Không | `undefined` | Khóa API để lấy danh sách font động từ Google Fonts |
| `VITE_PDF_API_URL` | Không | `undefined` | Endpoint dịch vụ render PDF server-side (mặc định dùng print trình duyệt) |
| `VITE_PHOTO_UPLOAD_URL` | Không | `undefined` | Endpoint tải ảnh đại diện lên cloud (mặc định nén Data URL) |

---

## 🧪 Kiểm thử (Automated Tests)

Dự án bao gồm bộ kiểm thử tự động toàn diện được viết bằng **Vitest** và **Testing Library**, bao phủ từ tính năng cốt lõi đến các kịch bản thực tế:

```bash
# Chạy toàn bộ test suite một lần
npm test

# Chạy test ở chế độ theo dõi (Watch mode)
npm run test:watch
```

### Các nhóm kiểm thử chính:
- **`phase2.test.tsx`**: Kiểm tra Zustand store, tính hợp lệ của toàn bộ Zod schemas, đồng bộ `localStorage`, và hiển thị ResumeSheet.
- **`phase3.test.tsx`**: Kiểm tra trích xuất PDF/Ảnh, bộ lọc kích thước/định dạng ảnh, khử mã độc JSON, và import file JSON thực tế.
- **`phase4.test.tsx`**: Kiểm tra bộ adapter AI Gemini, 6 presets tùy biến văn bản, guard clauses chặn CV rỗng, và trang phân tích `/review`.
- **`phase5.test.tsx`**: Kiểm tra vòng đời CRUD trên toàn bộ 9 mục CV, chuyển đổi giao diện Desktop/Mobile, kiểm tra đường chỉ ngắt trang A4, khả năng tự phục hồi khi API ngoài gặp sự cố, và bảo mật lọc mã XSS.

---

## 🤝 Đóng góp phát triển (Contributing)

Mọi ý kiến đóng góp, báo lỗi hoặc yêu cầu tính năng mới đều được hoan nghênh:

1. Fork dự án
2. Tạo nhánh tính năng mới (`git checkout -b feature/AmazingFeature`)
3. Commit các thay đổi (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push lên nhánh của bạn (`git push origin feature/AmazingFeature`)
5. Mở một **Pull Request**

---

## 📄 Bản quyền (License)

Dự án được phân phối dưới giấy phép **MIT License**. Bạn hoàn toàn có thể tự do sử dụng, chỉnh sửa và triển khai cho mục đích cá nhân hoặc thương mại.
