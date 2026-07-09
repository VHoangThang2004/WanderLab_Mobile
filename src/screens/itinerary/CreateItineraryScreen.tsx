import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';
import { aiService } from '../../api/aiService';
import { useUsageLimits } from '../../hooks/useUsageLimits';

const { width } = Dimensions.get('window');

import { ALL_VIETNAM_DESTINATIONS } from '../../data/vietnamDestinations';

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

// Removed hardcoded PHU_QUOC_ITINERARY

export function CreateItineraryScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState("pq");
  const [duration, setDuration] = useState("5 ngày");
  const [groupSize, setGroupSize] = useState("Cặp đôi");
  const [budget, setBudget] = useState("Trung bình");
  const [interests, setInterests] = useState<string[]>(["Biển & Bơi lội", "Ẩm thực"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [itineraryResult, setItineraryResult] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState("Tất cả");
  const { checkLimit, incrementUsage } = useUsageLimits();

  const REGIONS = ["Tất cả", "Miền Bắc", "Miền Trung", "Miền Nam"];

  const filteredDestinations = selectedRegion === "Tất cả" 
    ? ALL_VIETNAM_DESTINATIONS 
    : ALL_VIETNAM_DESTINATIONS.filter(d => d.region === selectedRegion);

  React.useEffect(() => {
    checkLimit('create_itinerary', true).then(allowed => {
      if (!allowed) navigation.goBack();
    });
  }, []);

  const selectedDest = ALL_VIETNAM_DESTINATIONS.find((d) => d.id === destination) || ALL_VIETNAM_DESTINATIONS[0];

  const handleGenerate = async () => {
    const aiAllowed = await checkLimit('ai_itinerary', true);
    if (!aiAllowed) return;

    setIsGenerating(true);
    try {
      const result = await aiService.generateItinerary({
        destination: selectedDest.name,
        duration,
        groupSize,
        budget,
        interests
      }, "vi");
      await incrementUsage('ai_itinerary');
      setItineraryResult(result);
      setStep(4);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!itineraryResult) return;
    
    const html = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; }
            h1 { color: #2563eb; font-size: 24px; margin-bottom: 5px; }
            .meta { color: #666; margin-bottom: 20px; font-size: 14px; }
            .day-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #f9fafb; }
            .day-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #1f2937; }
            .day-meta { font-size: 12px; color: #2563eb; font-weight: bold; margin-bottom: 10px; }
            ul { margin: 0; padding-left: 20px; }
            li { margin-bottom: 5px; font-size: 14px; line-height: 1.5; }
            .budget-section { margin-top: 30px; border-top: 2px solid #e5e7eb; padding-top: 15px; }
            .budget-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .budget-total { font-weight: bold; font-size: 16px; margin-top: 10px; color: #2563eb; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <h1>${itineraryResult.title || selectedDest.name}</h1>
          <div class="meta">⏱ ${duration} | 👥 ${groupSize} | 💰 ${budget}</div>
          
          ${itineraryResult.days.map((day: any) => `
            <div class="day-card">
              <div class="day-meta">NGÀY ${day.day} &bull; ~${day.budget}</div>
              <div class="day-title">${day.title}</div>
              <ul>
                ${day.activities.map((act: string) => `<li>${act}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
          
          <div class="budget-section">
            <h2 style="font-size: 18px; margin-bottom: 15px;">Ước tính chi phí</h2>
            ${itineraryResult.budgetBreakdown?.map((cost: any) => `
              <div class="budget-row">
                <span>${cost.label}</span>
                <strong>${cost.amount}</strong>
              </div>
            `).join('')}
            <div class="budget-total">
              <span>Tổng cộng:</span>
              <span>${itineraryResult.totalBudget}</span>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo file PDF');
    }
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
            <View>
              <Text style={styles.stepTitle}>Bạn muốn đi đâu?</Text>
              <Text style={styles.stepSubtitle}>Chọn điểm đến mơ ước của bạn</Text>
            </View>
            <View style={{ marginBottom: spacing.sm }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}>
                {REGIONS.map(region => (
                  <TouchableOpacity
                    key={region}
                    style={[styles.regionChip, selectedRegion === region && styles.regionChipActive]}
                    onPress={() => setSelectedRegion(region)}
                  >
                    <Text style={[styles.regionChipText, selectedRegion === region && styles.regionChipTextActive]}>
                      {region}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.gridContainerWrapper, { maxHeight: 350 }]}>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                <View style={styles.gridContainer}>
                  {filteredDestinations.map(dest => (
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
                        <Text style={styles.destName} numberOfLines={1}>{dest.name}</Text>
                        <Text style={styles.destTag} numberOfLines={1}>{dest.tag}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
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

        {step === 4 && itineraryResult && (
          <View style={styles.resultContainer}>
            {/* AI Notes */}
            {itineraryResult.ai_notes && (
              <View style={styles.aiNotesCard}>
                <Text style={styles.aiNotesText}>🤖 {itineraryResult.ai_notes}</Text>
              </View>
            )}

            <LinearGradient colors={gradients.primary} style={styles.resultHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.resultHeaderTag}>KẾT QUẢ ĐỀ XUẤT</Text>
              </View>
              <Text style={styles.resultDest}>{selectedDest.name} · {duration}</Text>
              <View style={styles.resultMetaRow}>
                <View style={styles.resultMetaBadge}>
                  <Ionicons name="people" size={12} color="#fff" />
                  <Text style={styles.resultMetaText}>{groupSize}</Text>
                </View>
                <View style={styles.resultMetaBadge}>
                  <Ionicons name="wallet" size={12} color="#fff" />
                  <Text style={styles.resultMetaText}>{budget}</Text>
                </View>
                <View style={styles.resultMetaBadge}>
                  <Ionicons name="star" size={12} color="#fff" />
                  <Text style={styles.resultMetaText}>Độ phù hợp 96%</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={styles.resultSubtitle}>Lịch trình chi tiết</Text>
            </View>

            {itineraryResult.days.map((day: any) => (
              <View key={day.day} style={styles.dayCard2}>
                <View style={styles.dayHeader2}>
                  <View style={styles.dayHeaderLeft}>
                    <Text style={{ fontSize: 24 }}>{day.emoji || '☀️'}</Text>
                    <View style={{ marginLeft: spacing.sm }}>
                      <Text style={styles.dayNumber2}>NGÀY {day.day}</Text>
                      <Text style={styles.dayTitle2}>{day.title}</Text>
                    </View>
                  </View>
                  <View style={styles.dayBudgetBadge2}>
                    <Text style={styles.dayBudgetText2}>~{day.budget}</Text>
                  </View>
                </View>
                <View style={styles.dayBody2}>
                  {day.activities.map((act: string, idx: number) => (
                    <View key={idx} style={styles.actRow2}>
                      <View style={styles.actDot2} />
                      <Text style={styles.actText2}>{act}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.sectionHeader}>
              <Ionicons name="wallet" size={20} color={colors.primary} />
              <Text style={styles.resultSubtitle}>Ước tính chi phí</Text>
            </View>

            <View style={styles.dayCard2}>
              {itineraryResult.budgetBreakdown?.map((cost: any, idx: number) => (
                <View key={idx} style={styles.costRow2}>
                  <Text style={styles.costLabel2}>{cost.label}</Text>
                  <Text style={styles.costVal2}>{cost.amount}</Text>
                </View>
              ))}
              <View style={styles.costTotalRow2}>
                <Text style={styles.costTotalLabel2}>Tổng cộng</Text>
                <Text style={styles.costTotalVal2}>{itineraryResult.totalBudget}</Text>
              </View>
            </View>

            <View style={styles.actionRow2}>
              <TouchableOpacity style={styles.actionBtnOutline2} onPress={() => setStep(1)}>
                <Ionicons name="refresh" size={20} color={colors.textSecondary} />
                <Text style={styles.actionBtnTextOutline2}>Làm lại</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtnSolid2, isSaved && { backgroundColor: '#10b981' }]} 
                onPress={async () => {
                  setIsSaved(true);
                  try {
                    const existing = await AsyncStorage.getItem('@saved_itineraries');
                    const saved = existing ? JSON.parse(existing) : [];
                    saved.unshift({
                      id: Date.now().toString(),
                      destination: selectedDest.name,
                      destinationImage: selectedDest.image,
                      destinationRegion: selectedDest.region,
                      duration,
                      groupSize,
                      budget,
                      interests,
                      createdAt: new Date().toISOString(),
                      data: itineraryResult
                    });
                    await AsyncStorage.setItem('@saved_itineraries', JSON.stringify(saved));
                  } catch (e) {
                    console.error('Error saving itinerary', e);
                  }
                  setTimeout(() => {
                    navigation.navigate('AppShell', {
                      screen: 'ProfileMain',
                      params: { activeTab: 'itineraries' }
                    });
                  }, 1000);
                }}
              >
                <Ionicons name={isSaved ? "checkmark" : "bookmark"} size={20} color="#fff" />
                <Text style={styles.actionBtnTextSolid2}>{isSaved ? "Đã lưu" : "Lưu lại"}</Text>
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
  stepTitle: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.text, marginBottom: 2 },
  stepSubtitle: { fontSize: typography.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  
  regionChip: { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: 24, backgroundColor: '#e5e7eb', marginRight: spacing.sm },
  regionChipActive: { backgroundColor: colors.primary },
  regionChipText: { fontSize: typography.sm, color: '#374151', fontWeight: '600' },
  regionChipTextActive: { color: '#fff' },
  
  gridContainerWrapper: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  destCard: { width: '48%', height: 120, borderRadius: borderRadius.lg, overflow: 'hidden', position: 'relative', borderWidth: 2, borderColor: 'transparent', marginBottom: spacing.sm },
  destCardActive: { borderColor: colors.primary },
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
  aiNotesCard: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md },
  aiNotesText: { color: '#1e40af', fontSize: typography.sm, fontWeight: '500', lineHeight: 20 },
  
  resultHeader: { padding: spacing.lg, borderRadius: borderRadius.xl, marginBottom: spacing.xs },
  resultHeaderTag: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  resultDest: { color: '#fff', fontSize: typography['2xl'], fontWeight: 'bold', marginBottom: spacing.sm },
  resultMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resultMetaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resultMetaText: { color: '#fff', fontSize: 12, marginLeft: 4, fontWeight: '600' },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 6 },
  resultSubtitle: { fontSize: typography.lg, fontWeight: 'bold', color: colors.text },
  
  dayCard2: { backgroundColor: '#fff', borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  dayHeader2: { backgroundColor: 'rgba(255,49,49,0.05)', padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  dayNumber2: { fontSize: 12, fontWeight: 'bold', color: colors.primary, marginBottom: 2 },
  dayTitle2: { fontSize: typography.sm, fontWeight: 'bold', color: colors.text },
  dayBudgetBadge2: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  dayBudgetText2: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
  
  dayBody2: { padding: spacing.md, paddingTop: spacing.sm },
  actRow2: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  actDot2: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6 },
  actText2: { flex: 1, fontSize: typography.sm, color: colors.textSecondary, lineHeight: 20 },
  
  costRow2: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  costLabel2: { fontSize: typography.sm, color: colors.textSecondary },
  costVal2: { fontSize: typography.sm, fontWeight: 'bold', color: colors.text },
  costTotalRow2: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, borderStyle: 'dashed' },
  costTotalLabel2: { fontSize: typography.base, fontWeight: 'bold', color: colors.text },
  costTotalVal2: { fontSize: typography.lg, fontWeight: 'bold', color: colors.primary },
  
  actionRow2: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtnOutline2: { flex: 1, paddingVertical: 14, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#fff' },
  actionBtnTextOutline2: { color: colors.textSecondary, fontWeight: 'bold', fontSize: typography.sm },
  actionBtnSolid2: { flex: 2, paddingVertical: 14, borderRadius: borderRadius.lg, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionBtnTextSolid2: { color: '#fff', fontWeight: 'bold', fontSize: typography.sm },
});
