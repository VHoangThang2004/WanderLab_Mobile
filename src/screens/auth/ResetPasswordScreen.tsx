import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { GradientButton } from '../../components/GradientButton';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';

export function ResetPasswordScreen({ navigation }: any) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password.trim() || password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert('Thành công', 'Mật khẩu đã được cập nhật', [
        { text: 'Về đăng nhập', onPress: () => navigation.navigate('Login') }
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
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Đặt lại mật khẩu</Text>
              <Text style={styles.description}>Nhập mật khẩu mới của bạn.</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu mới"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <GradientButton title="Lưu mật khẩu" onPress={handleUpdatePassword} loading={isLoading} size="lg" />
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
  formCard: { backgroundColor: '#fff', borderRadius: borderRadius['2xl'], padding: spacing.xl },
  formTitle: { fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  description: { fontSize: typography.base, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: borderRadius.md, paddingHorizontal: spacing.base, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, height: 52 },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: typography.md, color: colors.text },
});
