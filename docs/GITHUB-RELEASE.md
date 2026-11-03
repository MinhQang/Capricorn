# Phát hành Capricorn trên GitHub

Repository chứa mã nguồn và README. Bộ cài được đính kèm vào GitHub Release;
người dùng nhấn nút Download trong README để tải trực tiếp file cài đặt.
Không commit bộ cài vào Git: file hiện tại khoảng 714 MB. Thư mục `release/`
và `dist/` đã được loại khỏi Git bằng `.gitignore`.

## Chuẩn bị

Sau khi build bằng `npm run build:win`, chạy:

```powershell
npm run release:prepare -- --repo TEN-TAI-KHOAN/TEN-REPO
```

Thay tên tài khoản và repository bằng địa chỉ GitHub của bạn. Lệnh này chỉ
chuẩn bị file local, không đăng bất cứ thứ gì lên GitHub. Nó tạo:

```text
release/v0.3.2/
  Capricorn-Setup-x64.exe
  Capricorn-Setup-x64.exe.sha256
  RELEASE-NOTES.md
  PUBLISH.txt
```

Đồng thời lệnh gắn nút tải và đường dẫn checksum vào đầu README. Đường dẫn
`releases/latest/download/Capricorn-Setup-x64.exe` giữ nguyên qua các phiên bản.
Nếu dự án đã có `origin` GitHub hoặc trường `repository` trong package.json,
script tự nhận diện địa chỉ đó cho các lần build tiếp theo.

## Đăng bản phát hành

1. Push mã nguồn và README lên repository.
2. Vào **Releases → Draft a new release** trên GitHub.
3. Tạo tag **v0.3.2**, đặt tiêu đề **Capricorn 0.3.2**.
4. Đính kèm **Capricorn-Setup-x64.exe** và file **.sha256** trong thư mục trên.
5. Dán nội dung **RELEASE-NOTES.md** vào mô tả.
6. Publish bản phát hành và đặt làm **Latest**; không đánh dấu pre-release.
7. Mở README trên GitHub và thử nút Download trong cửa sổ trình duyệt riêng tư.

Hoặc sau khi đăng nhập GitHub CLI bằng `gh auth login`, chạy lệnh đã chuẩn bị
trong **PUBLISH.txt**. Script chuẩn bị không tự chạy lệnh phát hành này.

Nút tải chỉ hoạt động sau khi Release đã được publish và đính kèm đúng tên
file. Upload riêng mã nguồn hoặc dùng Code → Download ZIP không tạo ra Release.

Tài liệu GitHub: [liên kết tải từ Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases).
