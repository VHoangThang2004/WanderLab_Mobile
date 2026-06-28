import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { GradientButton } from '../../components/GradientButton';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'wanderlab://reset-password',
      });
      if (error) throw error;
      Alert.alert('Thành công', 'Vui lòng kiểm tra hộp thư email của bạn để lấy liên kết khôi phục mật khẩu.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradients.hero} style={styles.gradient}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Quên mật khẩu</Text>
              <Text style={styles.description}>Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              <GradientButton title="Gửi yêu cầu" onPress={handleReset} loading={isLoading} size="lg" />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: spacing.xl, left: spacing.xl, zIndex: 10 },
  formCard: { backgroundColor: '#fff', borderRadius: borderRadius['2xl'], padding: spacing.xl },
  formTitle: { fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  description: { fontSize: typography.base, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: borderRadius.md, paddingHorizontal: spacing.base, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, height: 52 },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: typography.md, color: colors.text },
});
