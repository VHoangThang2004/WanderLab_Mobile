import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { diaryBookService } from '../../api/diaryBookService';
import { diaryService } from '../../api/diaryService';
import { useAuthStore } from '../../stores/authStore';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';

export function CreateDiaryBookScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const { bookId } = route.params || {};
  const isEditing = !!bookId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [selectedDiaries, setSelectedDiaries] = useState<string[]>([]);
  
  // Fetch book details if editing
  const { data: bookDetails, isLoading: isLoadingBook } = useQuery({
    queryKey: ['diaryBook', bookId],
    queryFn: () => diaryBookService.fetchBookById(bookId),
    enabled: isEditing,
  });

  useEffect(() => {
    if (isEditing && bookDetails?.book) {
      setTitle(bookDetails.book.title || '');
      setDescription(bookDetails.book.description || '');
      setCoverImage(bookDetails.book.cover_image_url || null);
      setSelectedDiaries(bookDetails.diaries?.map((d: any) => d.id) || []);
    }
  }, [bookDetails, isEditing]);

  const { data: myDiaries, isLoading: isLoadingDiaries } = useQuery({
    queryKey: ['myDiaries', user?.id],
    queryFn: () => diaryService.fetchMyDiaries(),
    enabled: !!user?.id,
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCoverImage(result.assets[0].uri);
      setCoverBase64(result.assets[0].base64 || null);
    }
  };

  const toggleDiary = (diaryId: string) => {
    setSelectedDiaries(prev => 
      prev.includes(diaryId) 
        ? prev.filter(id => id !== diaryId)
        : [...prev, diaryId]
    );
  };

  const createBookMutation = useMutation({
    mutationFn: async () => {
      let cover_image_url = undefined;

      if (coverBase64) {
        const fileName = `${user?.id}/${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('diaries')
          .upload(fileName, decode(coverBase64), { contentType: 'image/jpeg' });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase
          .storage
          .from('diaries')
          .getPublicUrl(fileName);

        cover_image_url = publicUrlData.publicUrl;
      }

      if (isEditing) {
        return diaryBookService.updateBook(bookId, {
          title,
          description,
          cover_image_url,
        }, selectedDiaries);
      } else {
        return diaryBookService.createBook({
          title,
          description,
          cover_image_url,
        }, selectedDiaries);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaryBooks'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['diaryBook', bookId] });
      }
      navigation.goBack();
    },
    onError: (error) => {
      console.error('Error saving book:', error);
      alert('Đã xảy ra lỗi khi lưu cuốn sách.');
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề cho cuốn sách.');
      return;
    }
    createBookMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Sửa Cuốn Sách' : 'Tạo Cuốn Sách Mới'}</Text>
        <TouchableOpacity 
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={createBookMutation.isPending || (isEditing && isLoadingBook)}
        >
          {createBookMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.coverPicker} onPress={pickImage}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.coverPlaceholderText}>Thêm ảnh bìa</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tiêu đề sách</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tiêu đề (vd: Mùa hè rực rỡ 2026)"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Lời tựa (mô tả)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Viết một chút về cuốn sách này..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.diariesSection}>
          <Text style={styles.label}>Chọn các trang nhật ký ({selectedDiaries.length})</Text>
          <Text style={styles.subLabel}>Các bài viết sẽ được xếp vào sách theo thứ tự thời gian.</Text>
          
          {isLoadingDiaries ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : myDiaries && myDiaries.length > 0 ? (
            <View style={styles.diaryList}>
              {myDiaries.map((diary: any) => {
                const isSelected = selectedDiaries.includes(diary.id);
                return (
                  <TouchableOpacity 
                    key={diary.id}
                    style={[styles.diaryItem, isSelected && styles.diaryItemSelected]}
                    onPress={() => toggleDiary(diary.id)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: diary.image }} style={styles.diaryThumb} contentFit="cover" />
                    <View style={styles.diaryInfo}>
                      <Text style={styles.diaryTitle} numberOfLines={1}>{diary.title || diary.location}</Text>
                      <Text style={styles.diaryDate}>{diary.date}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyDiaries}>
              <Text style={styles.emptyDiariesText}>Bạn chưa có bài nhật ký nào để chọn.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text },
  saveBtn: { padding: spacing.xs, paddingHorizontal: spacing.sm },
  saveBtnText: { color: colors.primary, fontSize: typography.base, fontWeight: typography.bold },
  content: { flex: 1 },
  coverPicker: {
    width: '100%',
    height: 250,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { alignItems: 'center' },
  coverPlaceholderText: { color: colors.textTertiary, marginTop: spacing.sm, fontSize: typography.base },
  inputGroup: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  label: { fontSize: typography.base, fontWeight: typography.bold, color: colors.text, marginBottom: spacing.xs },
  subLabel: { fontSize: typography.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.base,
    color: colors.text,
  },
  textArea: { height: 100 },
  diariesSection: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  diaryList: { marginTop: spacing.sm },
  diaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diaryItemSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  diaryThumb: { width: 50, height: 50, borderRadius: borderRadius.sm, marginRight: spacing.md },
  diaryInfo: { flex: 1 },
  diaryTitle: { fontSize: typography.base, fontWeight: typography.bold, color: colors.text, marginBottom: 2 },
  diaryDate: { fontSize: typography.sm, color: colors.textSecondary },
  checkbox: {
    width: 24, height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyDiaries: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  emptyDiariesText: { color: colors.textSecondary, fontStyle: 'italic' },
});
