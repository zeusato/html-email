# HTML Email Builder

Công cụ tạo email HTML chuyên nghiệp từ file Word (.docx) hoặc soạn trực tiếp.

🔗 **Demo:** https://zeusato.github.io/html-email/

## ✨ Tính năng

### 📄 Chuyển đổi DOCX
- Import file Word (.docx) và tự động chuyển thành HTML
- Giữ nguyên định dạng: bold, italic, heading, list...

### 🎨 Editor mạnh mẽ
- **Rich Text Editor** với Lexical - hỗ trợ:
  - Heading H1/H2/H3
  - Bold, Italic, Underline, Strikethrough
  - Bullet list, Numbered list
  - Indent/Outdent
  - **Link** với text và URL riêng
  - **Button** tạo nút bấm với style
  - **Image** upload với resize và căn lề

### 📧 Tối ưu cho Email
- **Outlook Compatibility Mode** - tạo HTML tương thích với Outlook cũ
- Header/Footer image upload
- Tùy chỉnh max-width email
- Chọn font (Arial, Times New Roman, Tahoma, Verdana...)

### 📤 Export
- Download file HTML
- Copy HTML code
- Live Preview real-time

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript
- **Editor:** Lexical (Facebook)
- **Styling:** TailwindCSS
- **DOCX Parser:** Mammoth.js
- **Icons:** Lucide React
- **Deploy:** GitHub Pages

## 🚀 Sử dụng

1. Mở https://zeusato.github.io/html-email/
2. Upload file `.docx` hoặc soạn trực tiếp
3. Upload header/footer images (tùy chọn)
4. Chỉnh sửa nội dung
5. Click **Export HTML** để tải về

## 📦 Development

```bash
# Clone repo
git clone https://github.com/zeusato/html-email.git
cd html-email

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## 📝 License

MIT
