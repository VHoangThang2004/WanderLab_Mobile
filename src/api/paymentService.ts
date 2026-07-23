import { Linking, Alert } from 'react-native';
import CryptoJS from 'crypto-js';
import { supabase } from '../lib/supabase';

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
      // Gọi qua Edge Function giống Web để record vào database
      const returnUrl = 'exp://localhost:8081/--'; // Sẽ tự thêm /payment-success và /payment-cancel ở backend
      
      const { data, error } = await supabase.functions.invoke("payos-create", {
        body: { planKey, returnUrl }
      });

      if (error) {
        throw new Error(error.message || 'Lỗi từ Edge Function');
      }

      if (data?.checkoutUrl) {
        return data; // { checkoutUrl: '...' }
      } else {
        throw new Error("Không nhận được dữ liệu thanh toán từ hệ thống.");
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
