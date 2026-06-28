import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { colors, typography, spacing, borderRadius, gradients } from '../../theme';
import { GradientButton } from '../../components/GradientButton';

export function CreateGroupScreen({ navigation }: any) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const handleCreate = () => {
    if (!groupName.trim() || !description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và mô tả nhóm');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Thành công', 'Đã tạo nhóm thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo Nhóm Mới</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.content}>
          
          <Text style={styles.label}>Ảnh bìa nhóm</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImage} contentFit="cover" />
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="cloud-upload-outline" size={32} color="#aaa" />
                <Text style={styles.placeholderText}>Click để tải ảnh bìa lên</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên nhóm *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Phượt Miền Bắc 2024"
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả nhóm *</Text>
            <TextInput
              style={[styles.input, { minHeight: 100 }]}
              placeholder="Giới thiệu về nhóm của bạn..."
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <Text style={styles.label}>Quyền riêng tư</Text>
          <TouchableOpacity 
            style={[styles.privacyCard, !isPrivate && styles.privacyActive]}
            onPress={() => setIsPrivate(false)}
          >
            <Ionicons name="globe-outline" size={24} color={!isPrivate ? colors.primary : '#666'} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text style={styles.privacyTitle}>Công khai</Text>
              <Text style={styles.privacyDesc}>Bất kỳ ai cũng có thể xem và tham gia</Text>
            </View>
            <Ionicons name={!isPrivate ? "radio-button-on" : "radio-button-off"} size={20} color={!isPrivate ? colors.primary : '#ccc'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.privacyCard, isPrivate && styles.privacyActive]}
            onPress={() => setIsPrivate(true)}
          >
            <Ionicons name="lock-closed-outline" size={24} color={isPrivate ? colors.primary : '#666'} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text style={styles.privacyTitle}>Riêng tư</Text>
              <Text style={styles.privacyDesc}>Chỉ thành viên được mời mới có thể tham gia</Text>
            </View>
            <Ionicons name={isPrivate ? "radio-button-on" : "radio-button-off"} size={20} color={isPrivate ? colors.primary : '#ccc'} />
          </TouchableOpacity>

          <GradientButton title="Tạo Nhóm" onPress={handleCreate} loading={isLoading} style={{ marginTop: spacing.xl }} />
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
  content: { padding: spacing.lg },
  
  label: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.text, marginBottom: spacing.xs },
  
  imagePicker: { width: '100%', aspectRatio: 16/9, backgroundColor: '#f5f5f5', borderRadius: borderRadius.lg, borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', overflow: 'hidden', marginBottom: spacing.lg },
  coverImage: { width: '100%', height: '100%' },
  placeholderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { marginTop: spacing.sm, fontSize: typography.sm, color: '#666' },

  inputGroup: { marginBottom: spacing.lg },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: typography.base, color: colors.text },
  
  privacyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  privacyActive: { borderColor: colors.primary, backgroundColor: '#fff9f5' },
  privacyTitle: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text },
  privacyDesc: { fontSize: typography.xs, color: colors.textSecondary },
});
