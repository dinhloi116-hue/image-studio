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
- **Cố gắng giảm MB, vẫn xuất ảnh (mặc định):** thử JPG/WebP ở mức chất lượng cao 92–98%, chọn chất lượng cao nhất nếu file đạt mục tiêu nhỏ hơn ít nhất 1%. Nếu ảnh gốc đã nén rất tốt, vẫn xuất file đã chỉnh ở chất lượng 92% và cảnh báo tăng MB thay vì bỏ qua ảnh. PNG cũng luôn xuất và cảnh báo khi lớn hơn gốc. Xem trước bằng chính file nén thử nghiệm. Không thể đồng thời đảm bảo lossless, chỉnh ảnh, và file luôn nhẹ hơn.
- **Giới hạn kỹ thuật:** ảnh chỉnh sửa/watermark JPG cần mã hóa lại, nên không thể bảo đảm 100% pixel giống bản đã chỉnh mà luôn giảm dung lượng. PNG bảo toàn pixel nhưng có thể nặng hoặc không thể giảm MB.
- Xử lý trực tiếp trên thiết bị bằng Canvas; không tải ảnh lên máy chủ. Không ghi đè ảnh gốc.
- Phiên bản Chrome offline nằm trong `chrome-extension/batch-editor.html` và `batch-editor.js`, build-local-extension tự đồng bộ từ `batch-editor/`.

## Chế độ Patch có thước và Auto Tone (R20.22)

- Bật **Auto Crop** → **Patch có thước — vuông 1:1**. Thuật toán đọc toàn ảnh ở độ phân giải nhỏ, tìm patch vàng/trắng trên thảm xanh, thước đứng trái và thước ngang dưới, nhận diện dải chữ nền màu cuối ảnh để loại khỏi khung. Khung patch vuông đặt patch gần trung tâm và giữ các mốc thước, có thể chọn ba ô giữ thước trái/thước dưới/bỏ caption. Ảnh không phù hợp hoặc thiếu thước sẽ được đánh dấu **Cần xem lại** để chỉnh tay, không giả vờ nhận diện chính xác. Đây là phát hiện màu/cạnh theo quy tắc, không phải OCR hay AI phân đoạn.
- **Tự phân tích sáng/tối từng ảnh** (mặc định bật): phân tích histogram của vùng crop, phân biệt ảnh sáng gắt/tối/cân bằng. Khi bật, thuật toán dùng bộ thông số tự chọn, không cộng thêm preset “Rực và rõ” cũ. Có thanh riêng cho **Khôi phục/nén vùng sáng**, **Làm rõ vùng tối**, **Độ rõ & chi tiết vải**; chế độ tay vẫn khả dụng khi tắt Auto.
- Áo trắng bị cháy sẽ được nén highlight và hạn chế phát sinh vùng trắng 255; thuật toán **không thể khôi phục thông tin ảnh đã cháy trắng tuyệt đối**.
- Ảnh đầu vào **dưới 1,5 MB** không chạy tìm mức nén nhỏ hơn; JPG/WebP vẫn phải mã hóa lại sau sửa nhưng xuất chất lượng 98%. Ảnh từ 1,5 MB trở lên vẫn thử giảm dung lượng. PNG giữ nguyên cơ chế xuất riêng. Không có ZIP.
- Các mô-đun mới dùng chung trên PWA Xiaomi và Chrome Extension.

## Tối ưu hàng loạt và chèn chữ (R20.20)

- Bật **Auto Crop** → **Quét & kiểm tra cả lô**. Tool phân tích ba ngưỡng màu nền, chấm điểm nhất quán và chỉ cắt sát khi đủ tin cậy. Ảnh khó nhận diện được căn an toàn và đưa vào danh sách **Ảnh cần kiểm tra**; người dùng nhấn ảnh thu nhỏ để mở chỉnh tay. Đây là thuật toán xử lý ảnh cục bộ, **không phải AI nhận dạng áo**.
- Xem trước dạng lưới toàn bộ ảnh với nhãn **Cắt ổn / Cần xem lại / Đã chỉnh tay**. Tùy chọn lọc chỉ ảnh cần xem; có thể sửa từng ảnh mà không ảnh hưởng toàn lô.
- **Chèn chữ** độc lập với Watermark: bật bằng checkbox riêng, nhập văn bản hoặc `{filename}`, `{index}`, `{total}`, xuống dòng. Chọn font hệ thống, màu, viền, nền sau chữ, cỡ chữ, độ mờ, lề và 9 vị trí cố định. Chạm/kéo trên preview để đặt chữ ở vị trí tùy ý, áp dụng mọi ảnh.
- Tính MB và xuất từng file không ZIP vẫn dùng cùng crop và text overlay như preview. Ảnh gốc không bị ghi đè.
- Trong PWA Xiaomi, các mô-đun được lưu trong Service Worker và chạy sau lần tải đầu tiên.

## Cắt ảnh tự động hàng loạt (R20.19)

- Trong **Chỉnh ảnh hàng loạt**, chọn ô tích **AUTO CROP** (mặc định tắt, không tác động nếu chưa bật).
- Tự nhận diện chủ thể bằng tương phản với màu nền mép ảnh; có chế độ cắt giữa ảnh khi nền quá phức tạp. Đây là thuật toán heuristic, không phải AI tách nền; cần kiểm tra những ảnh nền gần màu sản phẩm.
- Các tỷ lệ: **1:1** (mặc định khi bật), **4:5**, **3:4**, **2:3**, **9:16**, **16:9**, **3:2**, và **Gốc (cắt sát)**.
- Chỉnh **lề 0–25%**, **độ nhạy tìm sản phẩm**. Khung được tính riêng cho từng ảnh.
- Bấm **Chỉnh khung thủ công** trên ảnh đang xem rồi kéo khung hoặc các nút góc trên điện thoại và máy tính. Lưu chỉ áp dụng ảnh đang chọn; các ảnh còn lại vẫn cắt tự động.
- Khung áp dụng đồng nhất trong preview, tính MB sau chỉnh sửa và xuất từng file; **không vẽ đường khung vào ảnh xuất**. Ảnh gốc không bị ghi đè.
- Nếu tắt ô tích, ảnh sẽ dùng toàn bộ khung ban đầu, không cắt.

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

Bản hiện tại: **R20.22 Patch Ruler Crop & Adaptive Tone**.

### Preset tram DTF

- **DTF SAFE 35** — 35 LPI, 45°, round, lỗ tối thiểu 0.55 mm
- **DTF BALANCED 40** — 40 LPI, 45°, round, 0.50 mm — mặc định khuyên dùng
- **DTF DETAIL 45** — 45 LPI, 45°, round, 0.40 mm
- **DTF RETAIL 50** — 50 LPI, 22.5°, round, 0.35 mm
- **VINTAGE 30** — 30 LPI, 45°, round, 0.70 mm

Các preset là điểm bắt đầu thực tế để test; film, mực trắng, powder, máy và nhiệt ép khác nhau có thể cần tinh chỉnh.

> Ứng dụng được đóng gói thành `index.html` + các module trong thư mục `app/` và `assets/` để giữ nguyên đầy đủ tool một-file gốc, đồng thời cho phép thêm tính năng độc lập.
