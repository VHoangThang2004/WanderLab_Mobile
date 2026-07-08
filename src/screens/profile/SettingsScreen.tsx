import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { colors as staticColors, typography, spacing, borderRadius } from '../../theme';
import { GradientButton } from '../../components/GradientButton';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../hooks/useTheme';
import { useThemeStore } from '../../stores/themeStore';

interface SettingsScreenProps {
  navigation: any;
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { user, logout, updateProfile, changePassword } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { mode, setMode } = useThemeStore();
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  
  const [activeModal, setActiveModal] = useState<'profile' | 'password' | 'language' | 'theme' | null>(null);

  const styles = getStyles(colors, isDarkMode);

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [isSaving, setIsSaving] = useState(false);

  // Password Form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('settings.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
      });
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ');
      setActiveModal(null);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    setIsSaving(true);
    try {
      await changePassword(currentPwd, newPwd);
      Alert.alert('Thành công', 'Đã đổi mật khẩu');
      setActiveModal(null);
      setCurrentPwd('');
      setNewPwd('');
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể đổi mật khẩu');
    } finally {
      setIsSaving(false);
    }
  };

  const SettingItem = ({ icon, title, subtitle, onPress, isDanger }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.settingIcon, isDanger && { backgroundColor: '#fee2e2' }]}>
        <Ionicons name={icon} size={20} color={isDanger ? '#ef4444' : colors.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, isDanger && { color: '#ef4444' }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <SettingItem
            icon="person-outline"
            title={t('settings.updateProfile')}
            subtitle={t('settings.updateProfileSub')}
            onPress={() => {
              setFullName(user?.full_name || '');
              setBio(user?.bio || '');
              setLocation(user?.location || '');
              setActiveModal('profile');
            }}
          />
          <SettingItem
            icon="lock-closed-outline"
            title={t('settings.changePassword')}
            subtitle={t('settings.changePasswordSub')}
            onPress={() => setActiveModal('password')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.customization')}</Text>
          <SettingItem
            icon="language-outline"
            title={t('settings.language')}
            subtitle={language === 'vi' ? 'Tiếng Việt' : 'English'}
            onPress={() => setActiveModal('language')}
          />
          <SettingItem
            icon={isDarkMode ? 'moon-outline' : 'sunny-outline'}
            title={t('settings.theme')}
            subtitle={mode === 'system' ? t('settings.themeSystem') : mode === 'dark' ? t('settings.themeDark') : t('settings.themeLight')}
            onPress={() => setActiveModal('theme')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.other')}</Text>
          <SettingItem
            icon="business-outline"
            title={t('settings.partner')}
            subtitle={t('settings.partnerSub')}
            onPress={() => navigation.navigate('Partner')}
          />
          <SettingItem
            icon="information-circle-outline"
            title="Giới thiệu"
            subtitle="Phiên bản 1.0.0"
            onPress={() => {}}
          />
        </View>

        <View style={[styles.section, { borderBottomWidth: 0 }]}>
          <SettingItem
            icon="log-out-outline"
            title={t('settings.logout')}
            isDanger
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={activeModal === 'profile'} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sửa hồ sơ</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và tên *</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Nhập họ tên" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiểu sử</Text>
              <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} placeholder="Mô tả bản thân" multiline />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Địa điểm</Text>
              <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Ví dụ: TP. HCM" />
            </View>
            <GradientButton title="Lưu thay đổi" onPress={handleSaveProfile} loading={isSaving} style={styles.saveBtn} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password Modal */}
      <Modal visible={activeModal === 'password'} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu hiện tại *</Text>
              <TextInput style={styles.input} value={currentPwd} onChangeText={setCurrentPwd} secureTextEntry={!showPwd} placeholder="Mật khẩu cũ" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu mới *</Text>
              <TextInput style={styles.input} value={newPwd} onChangeText={setNewPwd} secureTextEntry={!showPwd} placeholder="Ít nhất 6 ký tự" />
            </View>
            <TouchableOpacity style={styles.showPwdBtn} onPress={() => setShowPwd(!showPwd)}>
              <Text style={styles.showPwdText}>{showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</Text>
            </TouchableOpacity>
            <GradientButton title="Đổi mật khẩu" onPress={handleChangePassword} loading={isSaving} style={styles.saveBtn} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Language Modal */}
      <Modal visible={activeModal === 'language'} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('settings.language')}</Text>
            <TouchableOpacity style={styles.dialogOption} onPress={() => { setLanguage('vi'); setActiveModal(null); }}>
              <Text style={styles.dialogOptionText}>Tiếng Việt</Text>
              {language === 'vi' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
            <View style={styles.dialogDivider} />
            <TouchableOpacity style={styles.dialogOption} onPress={() => { setLanguage('en'); setActiveModal(null); }}>
              <Text style={styles.dialogOptionText}>English</Text>
              {language === 'en' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
            <View style={styles.dialogDivider} />
            <TouchableOpacity style={styles.dialogCancel} onPress={() => setActiveModal(null)}>
              <Text style={styles.cancelText}>{t('settings.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Theme Modal */}
      <Modal visible={activeModal === 'theme'} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('settings.theme')}</Text>
            <TouchableOpacity style={styles.dialogOption} onPress={() => { setMode('light'); setActiveModal(null); }}>
              <Text style={styles.dialogOptionText}>{t('settings.themeLight')}</Text>
              {mode === 'light' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
            <View style={styles.dialogDivider} />
            <TouchableOpacity style={styles.dialogOption} onPress={() => { setMode('dark'); setActiveModal(null); }}>
              <Text style={styles.dialogOptionText}>{t('settings.themeDark')}</Text>
              {mode === 'dark' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
            <View style={styles.dialogDivider} />
            <TouchableOpacity style={styles.dialogOption} onPress={() => { setMode('system'); setActiveModal(null); }}>
              <Text style={styles.dialogOptionText}>{t('settings.themeSystem')}</Text>
              {mode === 'system' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
            <View style={styles.dialogDivider} />
            <TouchableOpacity style={styles.dialogCancel} onPress={() => setActiveModal(null)}>
              <Text style={styles.cancelText}>{t('settings.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text },
  content: { flex: 1 },
  section: {
    backgroundColor: colors.card, marginTop: spacing.md,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textSecondary,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs,
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: isDarkMode ? '#2d1b1b' : '#fff0eb', justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: typography.base, fontWeight: typography.medium, color: colors.text },
  settingSubtitle: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  cancelText: { fontSize: typography.base, color: colors.textSecondary },
  modalTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text },
  modalContent: { padding: spacing.lg, backgroundColor: colors.background },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: typography.sm, fontWeight: typography.medium, color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: typography.base, color: colors.text, backgroundColor: colors.inputBg,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveBtn: { marginTop: spacing.lg },
  showPwdBtn: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  showPwdText: { color: colors.primary, fontWeight: typography.medium },
  
  // Dialog (Language, Theme)
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dialog: { width: '80%', backgroundColor: colors.card, borderRadius: borderRadius.xl, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border },
  dialogTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  dialogOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingHorizontal: spacing.xl },
  dialogOptionText: { fontSize: typography.base, color: colors.text },
  dialogDivider: { height: 1, backgroundColor: colors.border },
  dialogCancel: { padding: spacing.md, alignItems: 'center', marginTop: spacing.xs },
});
