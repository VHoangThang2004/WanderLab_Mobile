import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

const DESTINATIONS = [
  { id: "pq", name: "Phú Quốc", tag: "Biển & Đảo", image: "https://images.unsplash.com/photo-1693282815546-f7eeb0fa909b?w=400" },
  { id: "hl", name: "Hạ Long", tag: "Kỳ quan", image: "https://images.unsplash.com/photo-1547024842-7c86b2226ef5?w=400" },
  { id: "hn", name: "Hà Nội", tag: "Thành phố", image: "https://images.unsplash.com/photo-1727860628226-2d545134f8a9?w=400" },
  { id: "hoi", name: "Hội An", tag: "Văn hóa", image: "https://images.unsplash.com/photo-1643030080539-b411caf44c37?w=400" },
  { id: "dn", name: "Đà Nẵng", tag: "Biển", image: "https://images.unsplash.com/flagged/photo-1583863374731-4224cbbc8c36?w=400" },
  { id: "sp", name: "Sa Pa", tag: "Trekking", image: "https://images.unsplash.com/photo-1694152362587-99d77d21793b?w=400" },
];

const DURATIONS = ["3 ngày", "4 ngày", "5 ngày", "6 ngày", "7 ngày"];
const GROUP_SIZES = ["1 mình", "Cặp đôi", "Nhóm bạn (3–5)", "Gia đình", "Đoàn lớn (6+)"];
const BUDGETS = [
  { label: "Tiết kiệm", range: "< 5 triệu/người", icon: "💰" },
  { label: "Trung bình", range: "5–15 triệu/người", icon: "💳" },
  { label: "Thoải mái", range: "15–30 triệu/người", icon: "✨" },
  { label: "Sang trọng", range: "> 30 triệu/người", icon: "👑" },
];
const INTERESTS = [
  { label: "Biển & Bơi lội", icon: "water" },
  { label: "Ẩm thực", icon: "restaurant" },
  { label: "Chụp ảnh", icon: "camera" },
  { label: "Leo núi", icon: "analytics" },
  { label: "Văn hóa & Lịch sử", icon: "business" },
  { label: "Nghỉ dưỡng", icon: "heart" },
];

const PHU_QUOC_ITINERARY = {
  title: "Đến Đảo & Khám Phá Bắc",
  duration: "5 ngày",
  days: [
    { day: 1, title: "Bay đến Phú Quốc, nhận phòng", activities: ["Thăm Làng Chài & khu nuôi cấy ngọc trai", "Chiều: Dinh Cậu – ngắm hoàng hôn", "Tối: Bia hơi tươi & hải sản chợ đêm"], budget: "1.600.000₫" },
    { day: 2, title: "Tour 3 Đảo & Lặn Biển", activities: ["7h sáng: Xuất phát tour 3 đảo nam", "Lặn ngắm san hô tại Hòn Mây Rút", "Ăn hải sản BBQ ngay trên thuyền"], budget: "1.900.000₫" },
    { day: 3, title: "VinWonders & Cáp Treo", activities: ["Sáng: Cáp treo Hòn Thơm", "Trưa: Ăn trưa tại Grand World", "Chiều: VinWonders Park"], budget: "2.500.000₫" },
  ]
};

export function CreateItineraryScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState("pq");
  const [duration, setDuration] = useState("5 ngày");
  const [groupSize, setGroupSize] = useState("Cặp đôi");
  const [budget, setBudget] = useState("Trung bình");
  const [interests, setInterests] = useState<string[]>(["Biển & Bơi lội", "Ẩm thực"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const selectedDest = DESTINATIONS.find((d) => d.id === destination) || DESTINATIONS[0];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setStep(4);
    }, 2000);
  };

  const toggleInterest = (label: string) => {
    setInterests(prev => prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]);
  };

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map(n => (
        <React.Fragment key={n}>
          <View style={[styles.progressCircle, step >= n && styles.progressCircleActive]}>
            {step > n ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={[styles.progressText, step >= n && styles.progressTextActive]}>{n}</Text>}
          </View>
          {n < 4 && <View style={[styles.progressLine, step > n && styles.progressLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Lập Lịch Trình</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {step < 4 && renderProgress()}

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Bạn muốn đi đâu?</Text>
            <View style={styles.gridContainer}>
              {DESTINATIONS.map(dest => (
                <TouchableOpacity 
                  key={dest.id} 
                  style={[styles.destCard, destination === dest.id && styles.destCardActive]}
                  onPress={() => setDestination(dest.id)}
                >
                  <Image source={{ uri: dest.image }} style={styles.destImage} contentFit="cover" />
                  <View style={styles.destOverlay} />
                  {destination === dest.id && (
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                  <View style={styles.destInfo}>
                    <Text style={styles.destName}>{dest.name}</Text>
                    <Text style={styles.destTag}>{dest.tag}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.stepTitle, { marginTop: spacing.lg }]}>Thời gian đi</Text>
            <View style={styles.wrapContainer}>
              {DURATIONS.map(d => (
                <TouchableOpacity 
                  key={d} 
                  style={[styles.chip, duration === d && styles.chipActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.chipText, duration === d && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.primaryBtnText}>Tiếp tục</Text>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Số lượng người</Text>
            <View style={styles.wrapContainer}>
              {GROUP_SIZES.map(g => (
                <TouchableOpacity 
                  key={g} 
                  style={[styles.chip, groupSize === g && styles.chipActive]}
                  onPress={() => setGroupSize(g)}
                >
                  <Text style={[styles.chipText, groupSize === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.stepTitle, { marginTop: spacing.lg }]}>Ngân sách ước tính</Text>
            <View style={styles.gridContainer}>
              {BUDGETS.map(b => (
                <TouchableOpacity 
                  key={b.label} 
                  style={[styles.budgetCard, budget === b.label && styles.budgetCardActive]}
                  onPress={() => setBudget(b.label)}
                >
                  <Text style={styles.budgetIcon}>{b.icon}</Text>
                  <Text style={[styles.budgetLabel, budget === b.label && styles.budgetLabelActive]}>{b.label}</Text>
                  <Text style={styles.budgetRange}>{b.range}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(3)}>
              <Text style={styles.primaryBtnText}>Tiếp tục</Text>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Sở thích của bạn</Text>
            <View style={styles.wrapContainer}>
              {INTERESTS.map(i => (
                <TouchableOpacity 
                  key={i.label} 
                  style={[styles.interestChip, interests.includes(i.label) && styles.interestChipActive]}
                  onPress={() => toggleInterest(i.label)}
                >
                  <Ionicons name={i.icon as any} size={16} color={interests.includes(i.label) ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.interestText, interests.includes(i.label) && styles.interestTextActive]}>{i.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>TÓM TẮT YÊU CẦU</Text>
              <Text style={styles.summaryText}>📍 {selectedDest.name}</Text>
              <Text style={styles.summaryText}>⏱️ {duration}</Text>
              <Text style={styles.summaryText}>👥 {groupSize}</Text>
              <Text style={styles.summaryText}>💰 {budget}</Text>
            </View>

            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={isGenerating}>
              <LinearGradient colors={gradients.primary} style={styles.generateBtnGradient}>
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#fff" />
                    <Text style={styles.generateBtnText}>Tạo Lịch Trình</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {step === 4 && (
          <View style={styles.resultContainer}>
            <LinearGradient colors={gradients.primary} style={styles.resultHeader}>
              <Text style={styles.resultDest}>{selectedDest.name} · {duration}</Text>
              <Text style={styles.resultMeta}>👥 {groupSize}   💰 {budget}</Text>
            </LinearGradient>

            <Text style={styles.resultSubtitle}>Lịch trình chi tiết</Text>
            {PHU_QUOC_ITINERARY.days.map(day => (
              <View key={day.day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayNumber}>NGÀY {day.day}</Text>
                  <Text style={styles.dayBudget}>~{day.budget}</Text>
                </View>
                <Text style={styles.dayTitle}>{day.title}</Text>
                {day.activities.map((act, idx) => (
                  <View key={idx} style={styles.actRow}>
                    <View style={styles.actDot} />
                    <Text style={styles.actText}>{act}</Text>
                  </View>
                ))}
              </View>
            ))}

            <View style={styles.dayCard}>
              <Text style={[styles.dayTitle, { marginBottom: spacing.sm }]}>Ước tính chi phí</Text>
              <View style={styles.costRow}><Text style={styles.costLabel}>Vé máy bay</Text><Text style={styles.costVal}>2.400.000₫</Text></View>
              <View style={styles.costRow}><Text style={styles.costLabel}>Khách sạn</Text><Text style={styles.costVal}>4.500.000₫</Text></View>
              <View style={styles.costRow}><Text style={styles.costLabel}>Ăn uống</Text><Text style={styles.costVal}>1.800.000₫</Text></View>
              <View style={styles.costRow}><Text style={styles.costLabel}>Vui chơi</Text><Text style={styles.costVal}>2.200.000₫</Text></View>
              <View style={[styles.costRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
                <Text style={[styles.costLabel, { fontWeight: 'bold' }]}>Tổng cộng</Text>
                <Text style={[styles.costVal, { color: colors.primary, fontSize: 16 }]}>10.900.000₫</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtnOutline} onPress={() => setStep(1)}>
                <Ionicons name="refresh" size={20} color={colors.text} />
                <Text style={styles.actionBtnTextOutline}>Làm lại</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtnSolid, isSaved && { backgroundColor: '#10b981' }]} 
                onPress={() => {
                  setIsSaved(true);
                  setTimeout(() => navigation.goBack(), 1000);
                }}
              >
                <Ionicons name={isSaved ? "checkmark" : "bookmark"} size={20} color="#fff" />
                <Text style={styles.actionBtnTextSolid}>{isSaved ? "Đã lưu" : "Lưu lại"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.md, fontWeight: typography.semibold, color: colors.text },
  content: { flex: 1 },
  contentContainer: { padding: spacing.base, paddingBottom: spacing['4xl'] },
  
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl, marginTop: spacing.md },
  progressCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  progressCircleActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  progressText: { fontSize: 12, fontWeight: 'bold', color: colors.textTertiary },
  progressTextActive: { color: '#fff' },
  progressLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 4 },
  progressLineActive: { backgroundColor: colors.primary },

  stepContainer: { gap: spacing.md },
  stepTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text, marginBottom: spacing.xs },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  destCard: { width: (width - 32 - spacing.sm) / 2, height: 120, borderRadius: borderRadius.lg, overflow: 'hidden', position: 'relative' },
  destCardActive: { borderWidth: 2, borderColor: colors.primary },
  destImage: { width: '100%', height: '100%' },
  destOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  checkIcon: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  destInfo: { position: 'absolute', bottom: 8, left: 8 },
  destName: { color: '#fff', fontWeight: 'bold', fontSize: typography.base },
  destTag: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },

  wrapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  budgetCard: { width: (width - 32 - spacing.sm) / 2, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  budgetCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  budgetIcon: { fontSize: 24, marginBottom: spacing.xs },
  budgetLabel: { fontSize: typography.sm, fontWeight: 'bold', color: colors.text },
  budgetLabelActive: { color: colors.primary },
  budgetRange: { fontSize: 10, color: colors.textTertiary, marginTop: 2 },

  interestChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  interestChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  interestText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: '600' },
  interestTextActive: { color: colors.primary },

  summaryCard: { backgroundColor: colors.primary + '10', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.primary + '30', marginTop: spacing.md },
  summaryTitle: { fontSize: 12, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  summaryText: { fontSize: typography.sm, color: colors.text, marginBottom: 4 },

  primaryBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: spacing.xl },
  primaryBtnText: { color: '#fff', fontSize: typography.md, fontWeight: 'bold' },

  generateBtn: { marginTop: spacing.xl, borderRadius: borderRadius.lg, overflow: 'hidden' },
  generateBtnGradient: { flexDirection: 'row', paddingVertical: 14, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  generateBtnText: { color: '#fff', fontSize: typography.md, fontWeight: 'bold' },

  resultContainer: { gap: spacing.md },
  resultHeader: { padding: spacing.lg, borderRadius: borderRadius.lg },
  resultDest: { color: '#fff', fontSize: typography.xl, fontWeight: 'bold', marginBottom: 4 },
  resultMeta: { color: 'rgba(255,255,255,0.9)', fontSize: typography.sm },
  
  resultSubtitle: { fontSize: typography.lg, fontWeight: 'bold', color: colors.text, marginTop: spacing.sm },
  dayCard: { backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  dayNumber: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
  dayBudget: { fontSize: 12, fontWeight: 'bold', color: colors.primary, backgroundColor: colors.primary + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dayTitle: { fontSize: typography.base, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  actRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  actDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6 },
  actText: { flex: 1, fontSize: typography.sm, color: colors.textSecondary },

  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  costLabel: { fontSize: typography.sm, color: colors.textSecondary },
  costVal: { fontSize: typography.sm, fontWeight: 'bold', color: colors.text },

  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  actionBtnTextOutline: { fontSize: typography.sm, fontWeight: 'bold', color: colors.text },
  actionBtnSolid: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: borderRadius.md, backgroundColor: colors.primary },
  actionBtnTextSolid: { fontSize: typography.sm, fontWeight: 'bold', color: '#fff' },
});
