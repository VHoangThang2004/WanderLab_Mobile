import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';

export function CheckoutScreen({ navigation, route }: any) {
  const { planId } = route.params || { planId: 'starter' };
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const planName = planId === 'pro' ? 'Professional' : 'Starter';
  const planPrice = planId === 'pro' ? '99.000đ' : '49.000đ';

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate payment API call
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
    }, 2000);
  };

  const handleFinish = () => {
    navigation.popToTop(); // Go back to root
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconBox}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Thanh toán thành công!</Text>
          <Text style={styles.successSub}>
            Bạn đã nâng cấp lên gói {planName}. Hãy tận hưởng các tính năng cao cấp của WanderLab.
          </Text>
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <LinearGradient colors={gradients.primary} style={styles.finishBtnGradient}>
              <Text style={styles.finishBtnText}>Khám phá ngay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Thông tin đơn hàng</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gói dịch vụ:</Text>
            <Text style={styles.summaryValue}>WanderLab {planName}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Chu kỳ:</Text>
            <Text style={styles.summaryValue}>1 Tháng</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>{planPrice}</Text>
          </View>
        </View>

        <View style={styles.paymentMethod}>
          <Text style={styles.methodTitle}>Phương thức thanh toán</Text>
          <TouchableOpacity style={styles.methodCard}>
            <Ionicons name="card" size={24} color={colors.primary} />
            <Text style={styles.methodText}>Thanh toán qua VNPay</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.payBtn} onPress={handlePayment} disabled={isProcessing}>
          <LinearGradient colors={gradients.primary} style={styles.payBtnGradient}>
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payBtnText}>Thanh toán {planPrice}</Text>
            )}
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
    padding: spacing.base,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.text,
  },
  totalValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  paymentMethod: {
    gap: spacing.sm,
  },
  methodTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.text,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    gap: spacing.sm,
  },
  methodText: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.text,
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  payBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  payBtnGradient: {
    paddingVertical: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  payBtnText: {
    color: '#fff',
    fontSize: typography.md,
    fontWeight: typography.bold,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIconBox: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  successSub: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
    lineHeight: typography.base * 1.5,
  },
  finishBtn: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  finishBtnGradient: {
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#fff',
    fontSize: typography.md,
    fontWeight: typography.bold,
  },
});
