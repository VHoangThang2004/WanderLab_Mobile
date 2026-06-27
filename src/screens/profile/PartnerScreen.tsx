import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, gradients } from '../../theme';
import { GradientButton } from '../../components/GradientButton';

export function PartnerScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
  });

  const handleSubmit = () => {
    if (!formData.businessName || !formData.email) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ thông tin bắt buộc');
      return;
    }
    Alert.alert('Thành công', 'Cảm ơn bạn đã đăng ký. Chúng tôi sẽ liên hệ sớm nhất!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trở thành đối tác</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.content}>
          <LinearGradient colors={gradients.hero} style={styles.heroBanner}>
            <Ionicons name="briefcase" size={48} color="#fff" />
            <Text style={styles.heroTitle}>Phát triển kinh doanh cùng WanderLab</Text>
            <Text style={styles.heroSubtitle}>Tiếp cận hơn 50,000+ người dùng đam mê du lịch.</Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Đăng ký ngay</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên doanh nghiệp *</Text>
              <TextInput 
                style={styles.input} 
                value={formData.businessName}
                onChangeText={(t) => setFormData({...formData, businessName: t})}
                placeholder="Ví dụ: Khách sạn Mường Thanh" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên người liên hệ</Text>
              <TextInput 
                style={styles.input} 
                value={formData.contactName}
                onChangeText={(t) => setFormData({...formData, contactName: t})}
                placeholder="Họ và tên" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(t) => setFormData({...formData, email: t})}
                placeholder="email@doanhnghiep.com" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại *</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(t) => setFormData({...formData, phone: t})}
                placeholder="0123 456 789" 
              />
            </View>

            <GradientButton title="Gửi đăng ký" onPress={handleSubmit} style={{ marginTop: spacing.md }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: { flex: 1 },
  heroBanner: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
  },
  heroTitle: { fontSize: typography.xl, fontWeight: typography.bold, color: '#fff', textAlign: 'center', marginTop: spacing.sm },
  heroSubtitle: { fontSize: typography.sm, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: spacing.xs },
  
  formContainer: {
    backgroundColor: '#fff',
    margin: spacing.base,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text, marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: typography.sm, fontWeight: typography.medium, color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: typography.base, color: colors.text, backgroundColor: '#f9fafb',
  },
});
