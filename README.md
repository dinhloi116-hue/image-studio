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

## Chỉnh ảnh hàng loạt (R20.17)

- Vào tab **☀ Chỉnh ảnh hàng loạt** hoặc mở `batch-editor/` trên web.
- Chọn nhiều ảnh JPG/PNG/WebP (phù hợp 50–100 ảnh từ điện thoại).
- Dùng preset **Sáng bán hàng** hoặc điều chỉnh phơi sáng (EV), độ sáng, tương phản, độ rực màu, độ sắc nét. Xem trước từng ảnh.
- Dấu chìm chữ bảo vệ: lặp chéo toàn ảnh như MIUI Gallery, một dấu ở giữa hoặc tắt; chỉnh nội dung, màu, độ mờ, kích thước, mật độ và góc nghiêng.
- Xuất **từng ảnh hàng loạt, không ZIP**; Chrome có thể xin quyền tải nhiều file. Trên trình duyệt hỗ trợ File System Access API có thêm nút chọn thư mục lưu trực tiếp. Tên ảnh thêm `_DHL`, tùy chọn giữ nguyên kích thước, 4000/3000/2048 px; JPG/PNG/WebP.
- Hiện **MB gốc** và **MB xuất thử thực tế** cho ảnh đang xem, tổng MB gốc, tổng MB ước tính trước khi xuất và tổng MB thực tế sau khi xuất.
- **Mặc định giữ định dạng nguồn** theo từng ảnh JPG → JPG, PNG → PNG, WebP → WebP.
- **Giảm MB, giữ chất lượng thị giác cao (mặc định):** thử mã hóa JPG/WebP từ chất lượng cao xuống không dưới 92% và chọn chất lượng cao nhất có file nhỏ hơn ảnh gốc ít nhất 1%. Nếu không thể đạt ngưỡng, báo lỗi riêng ảnh đó thay vì tự tăng dung lượng hoặc hạ quá thấp. Xem trước bằng chính file nén thử nghiệm. Có chế độ riêng cho phép file lớn hơn nếu người dùng ưu tiên chất lượng tối đa.
- **Giới hạn kỹ thuật:** ảnh chỉnh sửa/watermark JPG cần mã hóa lại, nên không thể bảo đảm 100% pixel giống bản đã chỉnh mà luôn giảm dung lượng. PNG bảo toàn pixel nhưng có thể nặng hoặc không thể giảm MB.
- Xử lý trực tiếp trên thiết bị bằng Canvas; không tải ảnh lên máy chủ. Không ghi đè ảnh gốc.
- Phiên bản Chrome offline nằm trong `chrome-extension/batch-editor.html` và `batch-editor.js`, build-local-extension tự đồng bộ từ `batch-editor/`.

## Cài trên Xiaomi / Android (PWA)

- Mở bằng **Google Chrome**: https://dinhloi116-hue.github.io/image-studio/batch-editor/
- Chọn **Cài lên điện thoại** ngay trên trang nếu Chrome hiện hộp thoại cài đặt. Hoặc dùng menu **⋮ → Thêm vào màn hình chính → Cài đặt / Thêm**.
- Ứng dụng có tên **DHL Ảnh**, biểu tượng DHL SPORTS riêng và giao diện standalone khi trình duyệt hỗ trợ.
- Lần mở đầu tiên cần internet để lưu tệp ứng dụng. Sau đó phần **chỉnh ảnh hàng loạt** có thể hoạt động ngoại tuyến bằng Service Worker; ảnh chọn từ thiết bị vẫn chỉ được xử lý cục bộ.
- Tự ghi nhớ các thông số chỉnh sáng, màu, watermark và chất lượng xuất trên thiết bị. **Không lưu ảnh người dùng** trong bộ nhớ ứng dụng.
- Trên Xiaomi Android, tải hàng loạt từng file phụ thuộc quyền cho phép tải nhiều tệp của Chrome; có thể cần xác nhận một lần. Nút chọn thư mục trực tiếp chỉ xuất hiện khi trình duyệt hỗ trợ.
- PWA **không phải APK**. Không cần Play Store hay cài Chrome Extension.

- **Khắc phục lỗi đọc ảnh Xiaomi:** giữ nguyên quyền bộ chọn ảnh trong quá trình sao chép dữ liệu đầu vào vào bộ nhớ cục bộ, nhận diện định dạng qua header JPG/PNG/WebP/HEIC/AVIF, giải mã dự phòng qua bitmap / URL / FileReader / WebCodecs, xử lý màu & nét theo ô 512 px tránh thiếu RAM. Trên lô lớn, có thể dùng bộ nhớ tạm riêng trong thiết bị và xóa khi xóa danh sách, dọn tệp cũ khi mở lại app.
- Mặc định **Rực và rõ** cùng **watermark 10%** trên lần mở đầu tiên, sau đó ghi nhớ tùy chỉnh người dùng.

## Cách chạy

Mở `index.html` bằng Chrome/Edge khi tải repo về máy, hoặc bật GitHub Pages từ nhánh `main` để dùng trực tuyến.

Bản hiện tại: **R20.18 Xiaomi Image Decode Fix**.

### Preset tram DTF

- **DTF SAFE 35** — 35 LPI, 45°, round, lỗ tối thiểu 0.55 mm
- **DTF BALANCED 40** — 40 LPI, 45°, round, 0.50 mm — mặc định khuyên dùng
- **DTF DETAIL 45** — 45 LPI, 45°, round, 0.40 mm
- **DTF RETAIL 50** — 50 LPI, 22.5°, round, 0.35 mm
- **VINTAGE 30** — 30 LPI, 45°, round, 0.70 mm

Các preset là điểm bắt đầu thực tế để test; film, mực trắng, powder, máy và nhiệt ép khác nhau có thể cần tinh chỉnh.

> Ứng dụng được đóng gói thành `index.html` + các module trong thư mục `app/` và `assets/` để giữ nguyên đầy đủ tool một-file gốc, đồng thời cho phép thêm tính năng độc lập.
