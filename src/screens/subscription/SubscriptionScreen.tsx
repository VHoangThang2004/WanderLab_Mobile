import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { colors, typography, spacing } from '../../theme';
import { paymentService } from '../../api/paymentService';
import { useAuthStore } from '../../stores/authStore';

export function SubscriptionScreen({ navigation }: any) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [showWebview, setShowWebview] = useState(false);
  const { user, updateProfile } = useAuthStore();
  const currentPlan = (user as any)?.plan || 'free';

  const planValues = { free: 0, plus: 1, pro: 2, premium: 2 };
  const currentPlanValue = planValues[currentPlan as keyof typeof planValues] || 0;

  const handleDowngrade = (planKey: string) => {
    Alert.alert(
      'Xác nhận hạ cấp',
      `Bạn có chắc chắn muốn hạ cấp xuống gói ${planKey.toUpperCase()} không? Bạn sẽ mất các đặc quyền của gói hiện tại.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đồng ý', 
          onPress: async () => {
            setLoadingPlan(planKey);
            try {
              await updateProfile({ plan: planKey });
              Alert.alert('Thành công', `Đã hạ cấp xuống gói ${planKey.toUpperCase()}`);
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể hạ cấp. Vui lòng thử lại.');
            } finally {
              setLoadingPlan(null);
            }
          }
        }
      ]
    );
  };

  const handleUpgrade = async (planKey: string) => {
    setLoadingPlan(planKey);
    setSelectedPlan(planKey);
    try {
      const data = await paymentService.createCheckoutSession(planKey);
      if (data) {
        // Cấp fallback cho amount và orderCode nếu backend (Edge function) chỉ trả về checkoutUrl
        setPaymentData({
          ...data,
          amount: data.amount || (planKey === 'pro' ? 150000 : (planKey === 'plus' ? 50000 : 0)),
          orderCode: data.orderCode || Date.now().toString().slice(-6)
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tạo đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleOpenPayment = () => {
    if (paymentData && paymentData.checkoutUrl) {
      setShowWebview(true);
    }
  };

  const onShouldStartLoadWithRequest = (request: any) => {
    let url = request.url;
    
    // Bắt sự kiện thanh toán thành công / hủy từ PayOS
    if (url.includes('payment-success')) {
      setShowWebview(false);
      
      // Cập nhật trạng thái user trong DB
      if (selectedPlan) {
        updateProfile({ plan: selectedPlan }).then(() => {
          Alert.alert(
            "Thanh toán thành công 🎉", 
            `Tài khoản của bạn đã được nâng cấp lên gói ${selectedPlan.toUpperCase()}. Hãy tận hưởng các tính năng mới!`
          );
        }).catch(err => {
          console.error("Lỗi cập nhật gói:", err);
          Alert.alert("Lỗi", "Thanh toán thành công nhưng không thể cập nhật gói. Vui lòng liên hệ hỗ trợ.");
        });
      }
      return false;
    }

    if (url.includes('payment-cancel')) {
      setShowWebview(false);
      Alert.alert("Đã hủy", "Giao dịch thanh toán đã bị hủy.");
      return false;
    }

    // Xử lý chuẩn intent:// của Android (PayOS thường dùng để gọi MoMo/VNPAY)
    if (url.startsWith('intent://')) {
      const schemeMatch = url.match(/scheme=([^;]+)/);
      if (schemeMatch && schemeMatch[1]) {
        const scheme = schemeMatch[1];
        // Cắt phần 'intent://' và phần '#Intent;' để ghép lại thành URL chuẩn
        const pathMatch = url.match(/intent:\/\/([^#]+)/);
        const path = pathMatch && pathMatch[1] ? pathMatch[1] : '';
        url = `${scheme}://${path}`;
      }
    }

    // Bắt các liên kết deep link (không phải http/https) để đánh thức app ngân hàng
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Thông báo", "Ứng dụng thanh toán này chưa được cài đặt trên máy của bạn.");
        }
      }).catch(err => console.error("Lỗi xử lý URL:", err));
      
      // Chặn WebView điều hướng tới deep link này (để tránh lỗi Webpage not available)
      return false;
    }
    // Cho phép các liên kết http/https hoạt động bình thường trong WebView
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn Gói Dịch Vụ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>Nâng cấp trải nghiệm</Text>
          <Text style={styles.introText}>Chọn gói phù hợp nhất với hành trình của bạn.</Text>
        </View>

        {/* Free Plan */}
        <View style={[styles.card, styles.cardNormal]}>
          <Text style={styles.planName}>Free</Text>
          <Text style={styles.planDesc}>Trải nghiệm cơ bản</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>0đ</Text>
            <Text style={styles.priceUnit}>/tháng</Text>
          </View>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Xem, thích & bình luận</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Đăng bài: 4 Nhật ký & 2 Lịch trình / ngày</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Trợ lý AI: 8 Nhật ký & 4 Lịch trình / ngày</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Đính kèm: 5 ảnh & 1 video (720p) / bài</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.actionButton, styles.buttonSecondary]} 
            disabled={currentPlanValue === 0 || loadingPlan !== null}
            onPress={() => handleDowngrade('free')}
          >
            <Text style={styles.buttonTextSecondary}>
              {currentPlanValue === 0 ? 'Gói hiện tại' : 'Hạ cấp'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plus Plan (Highlight) */}
        <View style={[styles.card, styles.cardHighlight]}>
          <View style={styles.badgeHighlight}>
            <Text style={styles.badgeText}>PHỔ BIẾN NHẤT</Text>
          </View>
          <Text style={styles.planName}>Plus</Text>
          <Text style={styles.planDesc}>Trải nghiệm tuyệt vời hơn</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>50.000đ</Text>
            <Text style={styles.priceUnit}>/tháng</Text>
          </View>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Giới hạn sử dụng gấp 2.5 lần gói Free</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Đính kèm video phân giải cao 1080p</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Trải nghiệm không quảng cáo</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Huy hiệu Plus nổi bật</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.actionButton, styles.buttonPrimary, currentPlanValue === 1 && { backgroundColor: '#ccc' }]} 
            onPress={() => currentPlanValue > 1 ? handleDowngrade('plus') : handleUpgrade('plus')}
            disabled={loadingPlan !== null || currentPlanValue === 1}
          >
            {loadingPlan === 'plus' ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.buttonTextPrimary}>
                {currentPlanValue === 1 ? 'Gói hiện tại' : (currentPlanValue > 1 ? 'Hạ cấp' : 'Nâng cấp ngay')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Pro Plan */}
        <View style={[styles.card, styles.cardNormal]}>
          <Text style={styles.planName}>Pro</Text>
          <Text style={styles.planDesc}>Dành cho tín đồ xê dịch</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>150.000đ</Text>
            <Text style={styles.priceUnit}>/tháng</Text>
          </View>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Giới hạn sử dụng gấp 2.5 lần gói Plus</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Đính kèm video siêu nét 2160p (4K)</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Trải nghiệm không quảng cáo</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ff3131" />
              <Text style={styles.featureText}>Huy hiệu Pro đẳng cấp</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.actionButton, styles.buttonSecondary, currentPlanValue === 2 && { backgroundColor: '#f3f4f6', borderColor: '#ccc' }]}
            onPress={() => currentPlanValue > 2 ? handleDowngrade('pro') : handleUpgrade('pro')}
            disabled={loadingPlan !== null || currentPlanValue === 2}
          >
            {loadingPlan === 'pro' ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={[styles.buttonTextSecondary, currentPlanValue === 2 && { color: '#9ca3af' }]}>
                {currentPlanValue === 2 ? 'Gói hiện tại' : (currentPlanValue > 2 ? 'Hạ cấp' : 'Nâng cấp ngay')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Native Payment Modal */}
      <Modal visible={!!paymentData} animationType="slide" onRequestClose={() => setPaymentData(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
          <View style={styles.webviewHeader}>
            <TouchableOpacity onPress={() => setPaymentData(null)} style={styles.closeWebviewBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.webviewTitle}>Cổng Thanh Toán</Text>
            <View style={{ width: 28 }} />
          </View>
          
          {paymentData && (
            <ScrollView contentContainerStyle={{ padding: spacing.md }}>
              <View style={styles.paymentInfoCard}>
                <Text style={styles.paymentInfoTitle}>Thanh toán đơn hàng</Text>
                <Text style={styles.paymentOrderCode}>WanderLab_{paymentData.orderCode}</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.md }}>
                  <Text style={styles.paymentAmount}>{paymentData.amount.toLocaleString('vi-VN')}</Text>
                  <Text style={styles.paymentCurrency}> VND</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#ff3131', marginTop: spacing.xl }]} 
                onPress={handleOpenPayment}
              >
                <Text style={{ color: '#fff', fontSize: typography.base, fontWeight: 'bold' }}>Thanh toán qua PayOS</Text>
              </TouchableOpacity>
              
              <Text style={{ textAlign: 'center', fontSize: typography.xs, color: colors.textSecondary, marginTop: spacing.md }}>
                Hỗ trợ tự động chuyển hướng và điền thông tin cho mọi Ngân hàng & Ví điện tử
              </Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal WebView dành cho màn hình thanh toán PayOS */}
      <Modal visible={showWebview} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.webviewHeader}>
            <TouchableOpacity onPress={() => setShowWebview(false)} style={styles.closeWebviewBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.webviewTitle}>Thanh toán PayOS</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {paymentData?.checkoutUrl && (
            <WebView 
              source={{ uri: paymentData.checkoutUrl }}
              style={{ flex: 1 }}
              originWhitelist={['*']}
              onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
              // Bắt buộc trên Android để onShouldStartLoadWithRequest hoạt động tốt nhất
              javaScriptEnabled={true}
              domStorageEnabled={true}
              setSupportMultipleWindows={false}
              userAgent="Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36"
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeWebviewBtn: {
    padding: spacing.xs,
  },
  webviewTitle: {
    fontSize: typography.base,
    fontWeight: 'bold',
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  introContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: typography.extrabold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  introText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  cardNormal: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHighlight: {
    borderWidth: 2,
    borderColor: '#ff3131',
    paddingTop: spacing.xl,
    position: 'relative',
  },
  badgeHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ff3131',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: typography.bold,
  },
  planName: {
    fontSize: 24,
    fontWeight: typography.extrabold,
    color: colors.text,
    marginBottom: 4,
  },
  planDesc: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  priceValue: {
    fontSize: 40,
    fontWeight: typography.extrabold,
    color: colors.text,
  },
  priceUnit: {
    fontSize: typography.base,
    color: colors.textSecondary,
    fontWeight: typography.medium,
    marginLeft: 4,
  },
  featuresList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.sm,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#fff3f3',
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  buttonTextPrimary: {
    color: '#ff3131',
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  buttonTextSecondary: {
    color: colors.text,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  paymentInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paymentInfoTitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  paymentOrderCode: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: typography.extrabold,
    color: '#0054a6', // Màu giống VNPay
  },
  paymentCurrency: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: '#0054a6',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    width: '100%',
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrHint: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic'
  },
  bankInstruction: {
    fontSize: typography.sm,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  bankButton: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1.5,
  },
  bankLogo: {
    width: '80%',
    height: '80%',
  }
});
