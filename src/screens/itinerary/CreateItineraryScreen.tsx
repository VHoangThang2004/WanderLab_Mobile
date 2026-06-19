import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';

export function CreateItineraryScreen({ navigation }: any) {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('3');
  const [budget, setBudget] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);

  const handleGenerate = () => {
    if (!destination) return;
    setIsGenerating(true);
    // Mock AI Generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setItinerary({
        title: `Lịch trình ${days} ngày tại ${destination}`,
        days: Array.from({ length: parseInt(days) || 3 }).map((_, i) => ({
          day: i + 1,
          activities: [
            { time: '08:00', title: 'Ăn sáng đặc sản địa phương', location: destination },
            { time: '10:00', title: 'Tham quan địa điểm nổi tiếng', location: destination },
            { time: '14:00', title: 'Trải nghiệm văn hoá', location: destination },
            { time: '19:00', title: 'Ăn tối & Dạo phố', location: destination },
          ],
        })),
      });
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Lập Lịch Trình</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!itinerary && !isGenerating && (
          <View style={styles.formContainer}>
            <View style={styles.aiIconContainer}>
              <LinearGradient colors={gradients.primary} style={styles.aiIcon}>
                <Ionicons name="sparkles" size={32} color="#fff" />
              </LinearGradient>
              <Text style={styles.aiTitle}>WanderBot AI Planner</Text>
              <Text style={styles.aiSubtitle}>Để AI giúp bạn lên lịch trình hoàn hảo</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Điểm đến</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Đà Lạt, Phú Quốc, Sapa..."
                value={destination}
                onChangeText={setDestination}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số ngày đi</Text>
              <TextInput
                style={styles.input}
                placeholder="3"
                keyboardType="numeric"
                value={days}
                onChangeText={setDays}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngân sách dự kiến</Text>
              <View style={styles.budgetRow}>
                {['Tiết kiệm', 'Vừa phải', 'Thoải mái'].map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.budgetBtn,
                      budget === (index === 0 ? 'low' : index === 1 ? 'medium' : 'high') && styles.budgetBtnActive
                    ]}
                    onPress={() => setBudget(index === 0 ? 'low' : index === 1 ? 'medium' : 'high')}
                  >
                    <Text style={[
                      styles.budgetBtnText,
                      budget === (index === 0 ? 'low' : index === 1 ? 'medium' : 'high') && styles.budgetBtnTextActive
                    ]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={!destination}>
              <LinearGradient colors={destination ? gradients.primary : ['#ccc', '#ccc']} style={styles.generateBtnGradient}>
                <Ionicons name="color-wand" size={20} color="#fff" />
                <Text style={styles.generateBtnText}>Tạo Lịch Trình</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {isGenerating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>WanderBot đang phân tích dữ liệu...</Text>
            <Text style={styles.loadingSub}>Vui lòng chờ trong giây lát</Text>
          </View>
        )}

        {itinerary && !isGenerating && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>{itinerary.title}</Text>
            
            {itinerary.days.map((day: any) => (
              <View key={day.day} style={styles.dayCard}>
                <Text style={styles.dayTitle}>Ngày {day.day}</Text>
                {day.activities.map((act: any, idx: number) => (
                  <View key={idx} style={styles.activityItem}>
                    <Text style={styles.activityTime}>{act.time}</Text>
                    <View style={styles.activityLine}>
                      <View style={styles.activityDot} />
                      {idx < day.activities.length - 1 && <View style={styles.activityConnector} />}
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{act.title}</Text>
                      <Text style={styles.activityLocation}>
                        <Ionicons name="location-outline" size={12} color={colors.textTertiary} /> {act.location}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}

            <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.saveBtnText}>Lưu & Quay lại</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  formContainer: {
    gap: spacing.lg,
  },
  aiIconContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  aiIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  aiTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
  },
  aiSubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.base,
    color: colors.text,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  budgetBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  budgetBtnActive: {
    backgroundColor: '#fff',
    borderColor: colors.primary,
  },
  budgetBtnText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  budgetBtnTextActive: {
    color: colors.primary,
    fontWeight: typography.bold,
  },
  generateBtn: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  generateBtnGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: typography.md,
    fontWeight: typography.bold,
  },
  loadingContainer: {
    flex: 1,
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  loadingSub: {
    marginTop: spacing.xs,
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  resultContainer: {
    gap: spacing.lg,
  },
  resultTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dayCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  dayTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  activityTime: {
    width: 45,
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    paddingTop: 2,
  },
  activityLine: {
    width: 20,
    alignItems: 'center',
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryEnd,
    marginTop: 4,
  },
  activityConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
    paddingBottom: spacing.sm,
  },
  activityTitle: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.text,
  },
  activityLocation: {
    fontSize: typography.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: colors.inputBg,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtnText: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
  },
});
