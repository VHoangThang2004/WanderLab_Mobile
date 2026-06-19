import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0đ',
    period: '/ tháng',
    features: [
      'Tạo tối đa 3 nhật ký hành trình',
      'Lập lịch trình AI (1 lần/ngày)',
      'Lưu trữ ảnh tiêu chuẩn',
    ],
    recommended: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '49.000đ',
    period: '/ tháng',
    features: [
      'Tạo không giới hạn nhật ký',
      'Lập lịch trình AI không giới hạn',
      'Lưu trữ ảnh chất lượng cao',
      'Hỗ trợ khách hàng ưu tiên',
    ],
    recommended: true,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '99.000đ',
    period: '/ tháng',
    features: [
      'Mọi tính năng của gói Starter',
      'Xuất nhật ký ra PDF cao cấp',
      'API truy cập dữ liệu',
      'Hỗ trợ 24/7',
    ],
    recommended: false,
  },
];

export function SubscriptionScreen({ navigation }: any) {
  const [selectedPlan, setSelectedPlan] = useState('starter');

  const handleCheckout = () => {
    navigation.navigate('Checkout', { planId: selectedPlan });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nâng Cấp Tài Khoản</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Trải nghiệm WanderLab{'\n'}không giới hạn</Text>
        <Text style={styles.subtitle}>
          Mở khoá sức mạnh AI và các tính năng cao cấp để lưu giữ hành trình của bạn trọn vẹn nhất.
        </Text>

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardActive]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.8}
              >
                {plan.recommended && (
                  <LinearGradient colors={gradients.primary} style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Khuyên dùng</Text>
                  </LinearGradient>
                )}
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={[styles.radio, isSelected && styles.radioActive]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>

                <View style={styles.featuresList}>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={isSelected ? colors.primary : colors.textTertiary} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleCheckout} disabled={selectedPlan === 'free'}>
          <LinearGradient colors={selectedPlan === 'free' ? ['#ccc', '#ccc'] : gradients.primary} style={styles.continueBtnGradient}>
            <Text style={styles.continueBtnText}>
              {selectedPlan === 'free' ? 'Đang sử dụng' : 'Tiếp tục thanh toán'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  title: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: typography['3xl'] * 1.2,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  plansContainer: {
    gap: spacing.lg,
  },
  planCard: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    position: 'relative',
  },
  planCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -40 }],
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  recommendedText: {
    color: '#fff',
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  planName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  planPrice: {
    fontSize: typography['2xl'],
    fontWeight: typography.extrabold,
    color: colors.text,
  },
  planPeriod: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.sm,
    color: colors.text,
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  continueBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  continueBtnGradient: {
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: typography.md,
    fontWeight: typography.bold,
  },
});
