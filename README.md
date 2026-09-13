# Image Studio

Công cụ xử lý ảnh chạy trực tiếp trên trình duyệt, không cần cài đặt và không cần đăng nhập.

## Tính năng chính

- Xóa nền và dọn viền ám màu
- Crop sát hình với lề tùy chọn
- Thêm viền và bóng đổ, tự nới canvas để tránh xén mép
- Làm nét, chỉnh sáng / tương phản / độ rực
- Tạo tram / halftone DTF với preset 30–50 LPI, preview và xuất PNG nền trong suốt
- Preview tên & số áo
- Chèn logo / chữ hàng loạt
- Đổi tên ảnh hàng loạt bằng TXT / CSV / Excel `.xlsx`
- Nén video theo giới hạn dung lượng
- Xuất ZIP / tải hàng loạt
- Giao diện desktop và mobile

## Cách chạy

Mở `index.html` bằng Chrome/Edge khi tải repo về máy, hoặc bật GitHub Pages từ nhánh `main` để dùng trực tuyến.

Bản hiện tại: **R20.0 Halftone**.

### Preset tram DTF

- **DTF SAFE 35** — 35 LPI, 45°, round, lỗ tối thiểu 0.55 mm
- **DTF BALANCED 40** — 40 LPI, 45°, round, 0.50 mm — mặc định khuyên dùng
- **DTF DETAIL 45** — 45 LPI, 45°, round, 0.40 mm
- **DTF RETAIL 50** — 50 LPI, 22.5°, round, 0.35 mm
- **VINTAGE 30** — 30 LPI, 45°, round, 0.70 mm

Các preset là điểm bắt đầu thực tế để test; film, mực trắng, powder, máy và nhiệt ép khác nhau có thể cần tinh chỉnh.

> Ứng dụng được đóng gói thành `index.html` + các module trong thư mục `app/` và `assets/` để giữ nguyên đầy đủ tool một-file gốc, đồng thời cho phép thêm tính năng độc lập.
