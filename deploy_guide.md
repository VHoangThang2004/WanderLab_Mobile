# Hướng dẫn Build AAB và Upload lên Google Play Store

Khi triển khai ứng dụng Android lên **Google Play Store**, định dạng tệp bắt buộc hiện nay là **`.aab`** (Android App Bundle). File AAB cho phép Google tự động tối ưu hóa kích thước cài đặt cho từng dòng điện thoại khác nhau.

Dưới đây là các bước chi tiết để bạn xuất file `.aab` từ dự án Expo (WanderLab) và đẩy lên chợ ứng dụng lớn nhất thế giới này.

---

## Phần 1: Xuất file AAB từ dự án Expo

### Bước 1: Đảm bảo EAS CLI đã sẵn sàng
Nếu bạn chưa cài, hãy cài công cụ dòng lệnh của Expo và đăng nhập:
```bash
npm install -g eas-cli
eas login
```

### Bước 2: Cấu hình Versioning và Package Name
Trước khi build đưa lên Google Play, bạn cần mở file `app.json` và chắc chắn các thông số sau đã chuẩn mực:
```json
{
  "expo": {
    "version": "1.0.0", // Phiên bản hiển thị cho người dùng
    "android": {
      "package": "com.wanderlab.app", // ID định danh duy nhất của app (VD: com.tencongty.tenapp)
      "versionCode": 1 // Số phiên bản kỹ thuật. MỖI LẦN upload bản mới lên Play Store BẮT BUỘC phải tăng số này lên 1 đơn vị!
    }
  }
}
```

### Bước 3: Chạy lệnh Build Production
Trên Terminal, bạn chỉ cần gõ lệnh sau để tạo file AAB (EAS mặc định profile `production` sẽ build file AAB thay vì APK):
```bash
eas build -p android --profile production
```
> [Lưu ý] 
> Ở lần chạy đầu tiên, EAS sẽ hỏi bạn có muốn tạo Keystore (chữ ký số) không. Hãy chọn **Yes** để hệ thống tự động tạo và lưu trữ an toàn trên server của Expo.
> Bạn cũng có thể lấy file chữ ký này về bằng lệnh `eas credentials` sau này.

Khi quá trình build xong (tầm 10-20 phút), terminal sẽ cấp cho bạn một **link tải file `.aab`** (hoặc bạn có thể tự vào web expo.dev để tải).

---

## Phần 2: Upload lên Google Play Console

Google Play có quy trình xét duyệt và quản lý app cực kì chặt chẽ. Dưới đây là các bước khái quát:

### Bước 1: Đăng ký tài khoản Google Play Developer
1. Bạn phải đóng phí 1 lần duy nhất là **$25** tại [Google Play Console](https://play.google.com/console).
2. Điền và xác thực đầy đủ thông tin cá nhân/doanh nghiệp.

### Bước 2: Tạo Ứng dụng mới
1. Đăng nhập vào Play Console, nhấp vào **Create App** (Tạo ứng dụng).
2. Nhập thông tin: Tên ứng dụng (WanderLab), Ngôn ngữ mặc định, Chọn là App hay Game, Có tính phí hay Miễn phí.

### Bước 3: Thiết lập Cửa hàng (Store Presence)
Bạn cần hoàn thiện tất cả thông tin để Google hiển thị app cho người dùng:
- **Main store listing:** Tên ứng dụng, Mô tả ngắn, Mô tả chi tiết.
- **Đồ họa:** 
  - 1 biểu tượng ứng dụng (512x512).
  - 1 đồ họa tính năng (Feature Graphic - 1024x500).
  - Tối thiểu 2 ảnh chụp màn hình điện thoại.
- **Thiết lập quyền riêng tư:** Bạn cần tạo một trang web chứa **Privacy Policy** (Chính sách bảo mật) và dán link vào mục App Content.

### Bước 4: Tạo Bản phát hành (Release)
1. Trong menu bên trái, tìm mục **Production** (Sản xuất) hoặc **Internal Testing** (Thử nghiệm nội bộ - Khuyên dùng bước này trước).
2. Chọn **Create new release** (Tạo bản phát hành mới).
3. Tại phần App Bundles, tải lên file **`.aab`** bạn vừa build được từ bước EAS.
4. Đặt tên bản phát hành và mô tả những thay đổi của phiên bản (Release Notes).
5. Cuộn xuống và chọn **Review release** (Đánh giá).
6. Nếu có cảnh báo nhỏ, bạn có thể bỏ qua. Chọn **Start rollout** (Bắt đầu triển khai).

### Bước 5: Chờ Xét duyệt (Review)
- Với các tài khoản mới lập, việc xét duyệt app lần đầu có thể tốn từ **3 đến 7 ngày làm việc**.
- Khi Google báo **Approved**, app WanderLab của bạn sẽ chính thức có mặt trên Play Store cho toàn thế giới tải xuống!

> [Mẹo]
> Nếu bạn chỉ muốn test trên thiết bị thật một cách nhanh chóng mà không phải đợi duyệt trên Play Store, hãy tải bản `.apk` thay vì `.aab` bằng lệnh `eas build -p android --profile preview` như hướng dẫn cũ!
