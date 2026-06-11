import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, Platform, ActivityIndicator, KeyboardAvoidingView, Alert
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { diaryService } from '../../api/diaryService';
import { CreateDiaryPayload } from '../../types/diary';
import { colors, typography, spacing, borderRadius } from '../../theme';

export function CreateDiaryScreen() {
  const navigation = useNavigation<any>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!title || !location || !description || !imageUri) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tiêu đề, địa điểm, nội dung và chọn ảnh bìa.');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload image
      const coverUrl = await diaryService.uploadDiaryImage(imageUri);

      // 2. Create diary
      const payload: CreateDiaryPayload = {
        title,
        location,
        country: 'Việt Nam', // Mặc định
        duration: '1 ngày',
        dates: new Date().toISOString(),
        total_budget: '0 ₫',
        group_size: '1 người',
        description,
        status: 'published',
      };

      await diaryService.createDiary(payload, coverUrl);
      
      Alert.alert('Thành công', 'Bài viết đã được tạo thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.warn(e);
      Alert.alert('Lỗi', 'Không thể tạo bài viết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết mới</Text>
        <TouchableOpacity 
          onPress={handleCreate} 
          style={styles.headerBtn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.createBtnText}>Chia sẻ</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.imagePlaceholderText}>Thêm ảnh bìa</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Tiêu đề bài viết..."
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <View style={styles.inputGroup}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Địa điểm (vd: Đà Lạt, Lâm Đồng)"
              placeholderTextColor={colors.textTertiary}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.divider} />

          <TextInput
            style={styles.descriptionInput}
            placeholder="Viết cảm nghĩ của bạn về chuyến đi..."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    padding: spacing.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
  },
  createBtnText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: spacing.xs,
    fontSize: typography.sm,
    color: colors.textTertiary,
  },
  formContainer: {
    padding: spacing.base,
  },
  titleInput: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.base,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  descriptionInput: {
    fontSize: typography.base,
    color: colors.text,
    minHeight: 150,
  },
});
