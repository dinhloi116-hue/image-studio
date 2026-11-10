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

## Chỉnh ảnh hàng loạt (R20.13)

- Vào tab **☀ Chỉnh ảnh hàng loạt** hoặc mở `batch-editor/` trên web.
- Chọn nhiều ảnh JPG/PNG/WebP (phù hợp 50–100 ảnh từ điện thoại).
- Dùng preset **Sáng bán hàng** hoặc điều chỉnh phơi sáng (EV), độ sáng, tương phản, độ rực màu, độ sắc nét. Xem trước từng ảnh.
- Dấu chìm chữ bảo vệ: lặp chéo toàn ảnh như MIUI Gallery, một dấu ở giữa hoặc tắt; chỉnh nội dung, màu, độ mờ, kích thước, mật độ và góc nghiêng.
- Xuất **từng ảnh hàng loạt, không ZIP**; Chrome có thể xin quyền tải nhiều file. Trên trình duyệt hỗ trợ File System Access API có thêm nút chọn thư mục lưu trực tiếp. Tên ảnh thêm `_DHL`, tùy chọn giữ nguyên kích thước, 4000/3000/2048 px; JPG/PNG/WebP.
- Hiện **MB gốc** và **MB xuất thử thực tế** cho ảnh đang xem, tổng MB gốc, tổng MB ước tính trước khi xuất và tổng MB thực tế sau khi xuất.
- **PNG nén lossless** giữ nguyên pixel ảnh đã chỉnh sửa, dù dung lượng có thể tăng. JPG/WebP nén lossy có thể giảm MB nhưng không đảm bảo giữ chất lượng tuyệt đối.
- Xử lý trực tiếp trên thiết bị bằng Canvas; không tải ảnh lên máy chủ. Không ghi đè ảnh gốc.
- Phiên bản Chrome offline nằm trong `chrome-extension/batch-editor.html` và `batch-editor.js`, build-local-extension tự đồng bộ từ `batch-editor/`.

## Cách chạy

Mở `index.html` bằng Chrome/Edge khi tải repo về máy, hoặc bật GitHub Pages từ nhánh `main` để dùng trực tuyến.

Bản hiện tại: **R20.14 Batch Photo Export & MB Preview**.

### Preset tram DTF

- **DTF SAFE 35** — 35 LPI, 45°, round, lỗ tối thiểu 0.55 mm
- **DTF BALANCED 40** — 40 LPI, 45°, round, 0.50 mm — mặc định khuyên dùng
- **DTF DETAIL 45** — 45 LPI, 45°, round, 0.40 mm
- **DTF RETAIL 50** — 50 LPI, 22.5°, round, 0.35 mm
- **VINTAGE 30** — 30 LPI, 45°, round, 0.70 mm

Các preset là điểm bắt đầu thực tế để test; film, mực trắng, powder, máy và nhiệt ép khác nhau có thể cần tinh chỉnh.

> Ứng dụng được đóng gói thành `index.html` + các module trong thư mục `app/` và `assets/` để giữ nguyên đầy đủ tool một-file gốc, đồng thời cho phép thêm tính năng độc lập.
