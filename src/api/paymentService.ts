import { Linking, Alert } from 'react-native';
import CryptoJS from 'crypto-js';

// Đọc thông tin từ .env (Expo xử lý tự động qua process.env)
const PAYOS_CLIENT_ID = process.env.EXPO_PUBLIC_PAYOS_CLIENT_ID || '';
const PAYOS_API_KEY = process.env.EXPO_PUBLIC_PAYOS_API_KEY || '';
const PAYOS_CHECKSUM_KEY = process.env.EXPO_PUBLIC_PAYOS_CHECKSUM_KEY || '';

export const paymentService = {
  /**
   * Tạo Checkout Session trực tiếp từ Mobile thông qua PayOS API
   */
  async createCheckoutSession(planKey: string) {
    try {
      // 1. Chuẩn bị dữ liệu
      const amount = planKey === 'plus' ? 50000 : 150000;
      const description = `WanderLab ${planKey}`;
      const orderCode = Number(String(Date.now()).slice(-9)); // Tối đa 53 bit, lấy 9 số cuối
      const returnUrl = 'exp://localhost:8081/--/subscription-success';
      const cancelUrl = 'exp://localhost:8081/--/subscription-cancel';

      // 2. Tạo signature theo đúng định dạng PayOS (Sắp xếp alphabet)
      const dataStr = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
      const signature = CryptoJS.HmacSHA256(dataStr, PAYOS_CHECKSUM_KEY).toString(CryptoJS.enc.Hex);

      const body = {
        orderCode,
        amount,
        description,
        cancelUrl,
        returnUrl,
        signature
      };

      // 3. Gọi API PayOS
      const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY
        },
        body: JSON.stringify(body)
      });

      const resData = await response.json();

      if (resData.code !== '00') {
        throw new Error(resData.desc || 'Lỗi từ PayOS');
      }

      if (resData.data) {
        return resData.data;
      } else {
        throw new Error("Không nhận được dữ liệu thanh toán từ PayOS.");
      }
    } catch (err: any) {
      console.error("Lỗi khi tạo PayOS session:", err);
      Alert.alert("Thanh toán thất bại", err.message || "Đã xảy ra lỗi khi kết nối với cổng thanh toán.");
      return null;
    }
  },

  /**
   * Kiểm tra trạng thái đơn hàng
   */
  async checkPaymentStatus(orderCode: number) {
    try {
      const response = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY
        }
      });
      const resData = await response.json();
      return resData;
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái thanh toán:", error);
      return null;
    }
  }
};
