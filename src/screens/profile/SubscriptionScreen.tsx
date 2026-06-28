import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, gradients } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useUsageLimits } from '../../hooks/useUsageLimits';

export function SubscriptionScreen({ navigation }: any) {
  const { user, setPlan } = useAuthStore() as any;
  const { language } = useLanguageStore();
  const { resetUsage } = useUsageLimits();
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'momo'>('bank');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Thành công', language === 'vi' ? 'Đã sao chép!' : 'Copied!');
  };

  const handleDowngrade = (plan: any) => {
    Alert.alert(
      language === 'vi' ? 'Xác nhận hạ cấp' : 'Confirm downgrade',
      language === 'vi' 
        ? `Bạn có chắc chắn muốn hạ cấp xuống gói ${plan.name}? Các đặc quyền của gói hiện tại sẽ bị hủy bỏ.`
        : `Are you sure you want to downgrade to the ${plan.name} plan?`,
      [
        { text: language === 'vi' ? 'Hủy' : 'Cancel', style: 'cancel' },
        { 
          text: language === 'vi' ? 'Đồng ý' : 'Yes', 
          onPress: async () => {
            setPlan(plan.planKey);
            await resetUsage();
            Alert.alert('Thành công', language === 'vi' ? `Đã hạ cấp thành công xuống gói ${plan.name}.` : `Downgraded to ${plan.name}.`);
          }
        }
      ]
    );
  };

  const pricingPlans = [
    {
      name: "Free",
      price: language === 'vi' ? "0₫" : "$0",
      period: language === 'vi' ? "/tháng" : "/month",
      planKey: "free",
      description: language === 'vi' ? "Trải nghiệm cơ bản" : "Basic experience",
      features: language === 'vi' ? [
        "Xem, thích & bình luận",
        "Đăng bài: 4 Nhật ký & 2 Lịch trình / ngày",
        "Trợ lý AI: 8 Nhật ký & 4 Lịch trình / ngày",
        "Đính kèm: 5 ảnh & 1 video (720p) / bài",
      ] : [
        "View, like & comment",
        "Post: 4 Journals & 2 Itineraries / day",
        "AI Assist: 8 Journals & 4 Itineraries / day",
        "Attach: 5 images & 1 video (720p) / post",
      ],
      gradient: ['#ffffff', '#FFF5F3'],
      popular: false,
      isCurrent: (user?.plan || 'free') === 'free',
      level: 0,
    },
    {
      name: "Plus",
      price: language === 'vi' ? "19.000₫" : "$0.79",
      period: language === 'vi' ? "/tháng" : "/month",
      planKey: "plus",
      description: language === 'vi' ? "Trải nghiệm tuyệt vời hơn" : "Better experience",
      features: language === 'vi' ? [
        "Giới hạn sử dụng gấp 2.5 lần gói Free",
        "Đính kèm video phân giải cao 1080p",
        "Trải nghiệm không quảng cáo",
        "Huy hiệu Plus nổi bật",
      ] : [
        "Usage limits 2.5x higher than Free",
        "Attach high resolution 1080p videos",
        "Ad-free experience",
        "Exclusive Plus badge",
      ],
      gradient: ['#ffffff', '#FFE8E0'],
      popular: true,
      isCurrent: (user?.plan || 'free') === 'plus',
      level: 1,
    },
    {
      name: "Pro",
      price: language === 'vi' ? "29.000₫" : "$1.19",
      period: language === 'vi' ? "/tháng" : "/month",
      planKey: "pro",
      description: language === 'vi' ? "Dành cho tín đồ xê dịch" : "For travel enthusiasts",
      features: language === 'vi' ? [
        "Giới hạn sử dụng gấp 2.5 lần gói Plus",
        "Đính kèm video siêu nét 2160p (4K)",
        "Trải nghiệm không quảng cáo",
        "Huy hiệu Pro đẳng cấp",
      ] : [
        "Usage limits 2.5x higher than Plus",
        "Attach ultra HD 2160p (4K) videos",
        "Ad-free experience",
        "Exclusive Pro badge",
      ],
      gradient: gradients.primary,
      popular: false,
      isCurrent: (user?.plan || 'free') === 'pro',
      level: 2,
    },
  ];

  const currentPlanLevel = pricingPlans.find(p => p.planKey === (user?.plan || 'free'))?.level || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{language === 'vi' ? "Nâng cấp gói" : "Upgrade Plan"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{language === 'vi' ? "Trải nghiệm WanderLab tốt nhất" : "Best WanderLab Experience"}</Text>
          <Text style={styles.subTitle}>{language === 'vi' ? "Chọn gói phù hợp với nhu cầu của bạn" : "Choose the plan that fits you best"}</Text>
        </View>

        {pricingPlans.map((plan, idx) => (
          <LinearGradient
            key={idx}
            colors={plan.gradient as [string, string]}
            start={{x:0,y:0}} end={{x:1,y:1}}
            style={[styles.planCard, plan.popular && styles.planCardPopular]}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>{language === 'vi' ? "Phổ biến nhất" : "Most popular"}</Text>
              </View>
            )}
            
            <Text style={[styles.planName, plan.popular && {color: '#fff'}]}>{plan.name}</Text>
            <Text style={[styles.planDesc, plan.popular && {color: 'rgba(255,255,255,0.8)'}]}>{plan.description}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.planPrice, plan.popular && {color: '#fff'}]}>{plan.price}</Text>
              <Text style={[styles.planPeriod, plan.popular && {color: 'rgba(255,255,255,0.8)'}]}>{plan.period}</Text>
            </View>

            <View style={styles.features}>
              {plan.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={20} color={plan.popular ? '#fff' : colors.primary} />
                  <Text style={[styles.featureText, plan.popular && {color: '#fff'}]}>{f}</Text>
                </View>
              ))}
            </View>

            {plan.isCurrent ? (
              <View style={styles.actionBtnDisabled}>
                <Text style={styles.actionBtnTextDisabled}>{language === 'vi' ? "Gói hiện tại" : "Current plan"}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, plan.popular && styles.actionBtnLight]}
                onPress={() => {
                  if (plan.level < currentPlanLevel) {
                    handleDowngrade(plan);
                  } else {
                    setSelectedPlan(plan);
                    setPaymentMethod('bank');
                  }
                }}
              >
                <Text style={[styles.actionBtnText, plan.popular && {color: colors.primary}]}>
                  {plan.level < currentPlanLevel 
                    ? (language === 'vi' ? "Hạ cấp" : "Downgrade") 
                    : (language === 'vi' ? "Nâng cấp ngay" : "Upgrade now")}
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={!!selectedPlan} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{language === 'vi' ? "Thanh toán" : "Payment"}</Text>
              <TouchableOpacity onPress={() => !isProcessing && setSelectedPlan(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedPlan && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.paymentSub}>{language === 'vi' ? "Thanh toán cho gói" : "Payment for"} {selectedPlan.name}</Text>
                <Text style={styles.paymentPrice}>{selectedPlan.price}</Text>

                <View style={styles.tabRow}>
                  <TouchableOpacity 
                    style={[styles.tabBtn, paymentMethod === 'bank' && styles.tabBtnActive]}
                    onPress={() => setPaymentMethod('bank')}
                  >
                    <Ionicons name="card-outline" size={20} color={paymentMethod === 'bank' ? '#fff' : colors.text} />
                    <Text style={[styles.tabText, paymentMethod === 'bank' && {color: '#fff'}]}>Ngân hàng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.tabBtn, paymentMethod === 'momo' && {backgroundColor: '#a50064', borderColor: '#a50064'}]}
                    onPress={() => setPaymentMethod('momo')}
                  >
                    <Ionicons name="phone-portrait-outline" size={20} color={paymentMethod === 'momo' ? '#fff' : colors.text} />
                    <Text style={[styles.tabText, paymentMethod === 'momo' && {color: '#fff'}]}>Momo</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.qrContainer}>
                  <Ionicons name="qr-code-outline" size={150} color={colors.text} />
                  <Text style={styles.qrHelp}>{language === 'vi' ? "Quét mã QR để thanh toán" : "Scan QR to pay"}</Text>
                </View>

                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{language === 'vi' ? "Ngân hàng" : "Bank"}</Text>
                    <Text style={styles.detailValue}>{paymentMethod === 'bank' ? "Agribank" : "Momo"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{language === 'vi' ? "Chủ tài khoản" : "Account Name"}</Text>
                    <Text style={styles.detailValue}>VÕ HOÀNG THẮNG</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{language === 'vi' ? "Số tài khoản" : "Account No."}</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={styles.detailValue}>{paymentMethod === 'bank' ? "8888853382267" : "*******045"} </Text>
                      <TouchableOpacity onPress={() => handleCopy(paymentMethod === 'bank' ? "8888853382267" : "0123456045")}>
                        <Ionicons name="copy-outline" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{language === 'vi' ? "Nội dung" : "Message"}</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={styles.detailValue}>{selectedPlan.planKey === 'plus' ? 'WANDERLABPLUS' : 'WANDERLABPRO'} </Text>
                      <TouchableOpacity onPress={() => handleCopy(selectedPlan.planKey === 'plus' ? 'WANDERLABPLUS' : 'WANDERLABPRO')}>
                        <Ionicons name="copy-outline" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.confirmBtn, isProcessing && {backgroundColor: colors.textSecondary}]}
                  disabled={isProcessing}
                  onPress={async () => {
                    setIsProcessing(true);
                    setTimeout(async () => {
                      setPlan(selectedPlan.planKey);
                      await resetUsage();
                      setIsProcessing(false);
                      setSelectedPlan(null);
                      Alert.alert('Thành công', language === 'vi' ? `Chào mừng bạn đến với gói ${selectedPlan.name}!` : `Welcome to the ${selectedPlan.name} plan!`);
                    }, 2000);
                  }}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmBtnText}>{language === 'vi' ? "Tôi đã thanh toán" : "I have transferred"}</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  titleSection: { alignItems: 'center', marginBottom: spacing.xl },
  mainTitle: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.primary, marginBottom: spacing.xs },
  subTitle: { fontSize: typography.base, color: colors.textSecondary },
  
  planCard: { 
    borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden'
  },
  planCardPopular: { transform: [{scale: 1.02}], borderWidth: 0, elevation: 6 },
  popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 12 },
  popularText: { color: '#fff', fontSize: typography.xs, fontWeight: typography.bold, textTransform: 'uppercase' },
  
  planName: { fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.text, marginBottom: 4 },
  planDesc: { fontSize: typography.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.xl },
  planPrice: { fontSize: typography['3xl'], fontWeight: typography.extrabold, color: colors.text },
  planPeriod: { fontSize: typography.base, color: colors.textSecondary, marginLeft: 4 },
  
  features: { marginBottom: spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  featureText: { fontSize: typography.sm, color: colors.text, marginLeft: spacing.sm, flex: 1 },
  
  actionBtn: { backgroundColor: colors.text, paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center' },
  actionBtnLight: { backgroundColor: '#fff' },
  actionBtnText: { color: '#fff', fontSize: typography.base, fontWeight: typography.bold },
  
  actionBtnDisabled: { backgroundColor: colors.border, paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center' },
  actionBtnTextDisabled: { color: colors.textSecondary, fontSize: typography.base, fontWeight: typography.bold },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.text },
  
  paymentSub: { fontSize: typography.sm, color: colors.textSecondary, textAlign: 'center' },
  paymentPrice: { fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.primary, textAlign: 'center', marginBottom: spacing.lg },
  
  tabRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  tabBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.text },
  
  qrContainer: { alignItems: 'center', padding: spacing.xl, backgroundColor: '#f5f5f5', borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  qrHelp: { fontSize: typography.xs, color: colors.textSecondary, marginTop: spacing.sm },
  
  detailsBox: { backgroundColor: '#f9fafb', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  detailLabel: { fontSize: typography.sm, color: colors.textSecondary },
  detailValue: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.text },
  
  confirmBtn: { backgroundColor: colors.text, paddingVertical: 16, borderRadius: borderRadius.lg, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: typography.base, fontWeight: typography.bold },
});
