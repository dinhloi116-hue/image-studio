IMAGE STUDIO DHL - LOCAL EXTENSION
==================================
Tool version: R20.14-BATCH-MB-DIRECT-DOWNLOAD

CÀI LẦN ĐẦU BẰNG GITHUB DESKTOP
1. GitHub Desktop -> Clone repository: dinhloi116-hue/image-studio
2. Chrome -> chrome://extensions/
3. Bật Developer mode
4. Load unpacked
5. Chọn thư mục: <repo image-studio>/chrome-extension

CẬP NHẬT SAU NÀY - GIỐNG TOOL ĐỌC TỒN KHO
1. GitHub Desktop -> image-studio -> Fetch origin / Pull origin
2. Trong Image Studio bấm 'Cập nhật từ Git' -> 'Áp dụng sau khi Pull'
   (hoặc chrome://extensions -> Reload)
3. Mở lại tool.

NHẬN DIỆN TIỆN ÍCH
Biểu tượng DHL nền xanh đậm, máy ảnh màu trắng, chữ SPORTS nền đỏ.
Trong Chrome: biểu tượng mảnh ghép (Extensions) -> ghim "DHL Image Studio | Chỉnh ảnh hàng loạt".
Bấm logo DHL trên thanh tiện ích để mở tool. Chọn "Chỉnh ảnh hàng loạt" để sửa sáng/màu/dấu chìm và tải ảnh riêng, không ZIP.

KIỂM TRA SAU KHI PULL
- chrome-extension/manifest.json (phiên bản 2.0.8)
- chrome-extension/tool.html (công cụ đầy đủ)
- chrome-extension/batch-editor.html + batch-editor.js (chỉnh ảnh hàng loạt)
- chrome-extension/icons/icon16.png, icon32.png, icon48.png, icon128.png
- chrome-extension/assets/ (thư viện cần thiết)

KHÔNG cần tải ZIP lại. KHÔNG dùng iframe GitHub Pages.
