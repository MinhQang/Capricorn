# Capricorn — bộ cài Windows

Capricorn 0.3.2 dành cho Windows 10 22H2 / Windows 11 x64. Bản này dùng CPU, phù hợp máy có đồ họa tích hợp; 8 GB RAM là mức thực dụng cho cấu hình mô hình nhỏ. Chưa có bản macOS, Linux hoặc Windows ARM.

## Cài đặt

Chạy `Capricorn-Setup-0.3.2-x64.exe`, chọn thư mục cài và một lựa chọn AI:

- Qwen3 1.7B: mặc định, tải khoảng 1.4 GB.
- Qwen3 0.6B: nhỏ hơn, tải khoảng 0.6 GB.
- Download later: tải sau trong Settings → AI setup / download models.

Giữ lựa chọn mở Capricorn ở trang cuối. Lần mở đầu, cửa sổ thiết lập sẽ tự tải mô hình đã chọn, hiện tiến trình và kiểm tra mô hình trước khi bật Open Capricorn. Nếu bỏ chọn mở ứng dụng, công việc này diễn ra ở lần mở tiếp theo. Tải lỗi hoặc mất mạng có nút Retry; các lớp mô hình đã tải được Ollama kiểm tra và tái sử dụng. Cần mạng cho bước này, sau đó hội thoại và voice chat chạy local. Không cần tự cài Node, Python, uv hoặc Ollama.

Bộ cài chứa Electron, Node, Python portable, thư viện speech, Kokoro, speaker tổng hợp Capri, Whisper base.en và Ollama 0.40.13 CPU. AI engine chạy riêng trên cổng loopback ngẫu nhiên và dùng thư mục mô hình riêng; không yêu cầu hay thay đổi Ollama đang cài trên máy. Engine được dừng cùng Capricorn. Không tự chạy cùng Windows.

Dung lượng mô hình do nhà cung cấp quyết định và có thể thay đổi. Nên có ít nhất 5 GB trống cho chương trình, tải tạm và mô hình nhỏ. Trình cài chỉ tải mô hình khi bạn chọn; không tải video hay gửi lịch sử chat lên dịch vụ bên ngoài. Tường lửa/proxy có thể chặn registry mô hình; khi đó dùng Retry sau khi khôi phục kết nối.

## Dữ liệu và cập nhật

Dữ liệu nằm trong `%LOCALAPPDATA%\Capricorn`. Nếu phát hiện thư mục dữ liệu Capri cũ, ứng dụng tiếp tục dùng nó để giữ hội thoại và sở thích. Mô hình tải mới nằm trong thư mục con `models`. Gỡ ứng dụng giữ lại dữ liệu và mô hình; không xóa ngầm lịch sử của bạn.

Không đóng gói dữ liệu cá nhân, lịch sử chat, video Capri_data, khóa truy cập hoặc test cache. 100 lượt hội thoại và tính năng truy hồi ngữ cảnh mới có trong bản 0.3.2. Giới hạn truy cập file ổ C giữ nguyên; các ứng dụng cài ở C vẫn có thể được mở.

## Build lại

Máy build cần Node 24 x64, dependencies và tài nguyên speech đã chuẩn bị. `npm run prepare:ollama` sao chép Ollama CPU từ bản cài chính thức trên máy build (hoặc `OLLAMA_RUNTIME_DIR`), ghi provenance/hash. Cần kèm `.tools/ollama/LICENSE`; bản hiện tại lấy từ tag v0.40.13 chính thức. Icon dùng ảnh mặt Capri có sẵn trong dự án, giữ thông tin bản quyền.

```powershell
npm ci
npm test
npm run build:win
```

Kết quả trong `dist/Capricorn-Setup-0.3.2-x64.exe`. `npm run build:unpacked` tạo `dist/win-unpacked/Capricorn.exe` để kiểm tra trước khi làm bộ cài. Mã cấu hình nằm trong `electron-builder.config.cjs`, trang chọn mô hình trong `build/installer.nsh`.

Bộ cài chưa ký số. Trước khi phân phối rộng, cần ký mã và thử trên máy Windows sạch/VM, nhiều thiết bị âm thanh và môi trường mạng khác nhau. Kiểm thử trên một máy không chứng minh tương thích mọi máy. Giữ THIRD_PARTY_NOTICES và toàn bộ giấy phép kèm theo; tài nguyên Lachy có điều kiện phi thương mại, quyền nhân vật/ảnh không được chuyển nhượng.

Nguồn chính thức: https://docs.ollama.com/windows, https://docs.ollama.com/api/pull, https://www.electron.build/nsis/.

## L?nh nhanh trong b?n 0.3.2

G? `/` ho?c b?m n?t `/` c?nh ? chat ?? xem g?i ?. D?ng ph?m m?i t?n v? Tab ?? ch?n, Enter ?? g?i. `/chrome`, `/vscode`, `/explorer`, `/notepad` m? app; `/open t?n ?ng d?ng` m? theo t?n Start menu. `/apps` li?t k? t?n c? th? m?; app ch?a c?i s? b?o l?i th?t, kh?ng chuy?n sang chat gi? v? thao t?c.

`/write n?i dung` m? t?i li?u Notepad tr?ng r?i ?i?n nguy?n v?n, kh?ng t? l?u file. B?n nh?p Notepad ?ang c? ???c gi? l?i. `/windows`, `/focus t?n`, `/minimize t?n`, `/maximize t?n`, `/close t?n` d?ng c?ng c? c?a s?. `/list ???ng d?n`, `/read ???ng d?n` gi? gi?i h?n kh?ng truy c?p file ? C. `/remember s? th?ch` l?u m?t ?i?u; `/new` x?a l?ch s? h?i tho?i nh?ng gi? s? th?ch ?? l?u.

C?u n?i nh? ?open my visualcode? d?ng chung b? m? ?ng d?ng v?i chat. C? th? n?i ?slash explorer? ?? g?i tag. M? h?nh chat d?ng prompt g?n h?n, ?u ti?n c?u h?i m?i v? th? t?o l?i m?t l?n n?u ch?p nguy?n c?u tr? l?i c? cho c?u h?i kh?c. M? h?nh nh? v?n c? th? tr? l?i sai; kh?ng c? c? ch? t? b?a th?nh c?ng cho thao t?c m?y t?nh.
