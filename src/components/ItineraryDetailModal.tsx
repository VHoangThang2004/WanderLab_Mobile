import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { height } = Dimensions.get('window');

interface Props {
  itinerary: any;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const ItineraryDetailModal: React.FC<Props> = ({ itinerary, visible, onClose, onDelete }) => {
  const insets = useSafeAreaInsets();

  if (!itinerary) return null;

  const dataObj = itinerary.data || itinerary;
  const days = itinerary.days || dataObj.days || [];
  const budgetBreakdown = itinerary.budgetBreakdown || dataObj.budgetBreakdown || [];
  const totalBudget = itinerary.estimatedTotal || dataObj.totalBudget || '';

  const handleDownloadPDF = async () => {
    try {
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Lịch Trình – ${itinerary.destination}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #1f2937; background: #fff; padding: 32px; }
          .header { background: linear-gradient(135deg,#ff3131,#ff914d); color: #fff; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
          .header h1 { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
          .header .meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; opacity: .9; }
          .section-title { font-size: 15px; font-weight: 700; color: #111827; margin: 20px 0 12px; display: flex; align-items: center; gap: 6px; }
          .day-card { border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
          .day-header { background: #fff5f3; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; }
          .day-num { font-size: 11px; font-weight: 700; color: #ff3131; text-transform: uppercase; }
          .day-title { font-size: 14px; font-weight: 700; color: #111827; }
          .day-budget { font-size: 13px; font-weight: 700; color: #ff3131; }
          .day-body { padding: 10px 16px; }
          .day-body ul { list-style: none; }
          .day-body li { font-size: 13px; color: #374151; padding: 3px 0; padding-left: 14px; position: relative; }
          .day-body li::before { content: "•"; position: absolute; left: 0; color: #ff914d; }
          .budget-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .budget-table td { padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
          .budget-table td:last-child { text-align: right; font-weight: 600; }
          .budget-total { font-weight: 800; font-size: 15px; color: #ff3131; }
          .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
          .tag { background: #fff5f3; color: #ff3131; border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 600; }
          .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
          .emoji { margin-right: 4px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✈️ Lịch Trình ${itinerary.destination}</h1>
          <p style="font-size:13px;opacity:.8;margin-bottom:10px">${itinerary.destinationRegion}</p>
          <div class="meta">
            <span>📅 ${itinerary.duration}</span>
            <span>👥 ${itinerary.groupSize}</span>
            <span>💳 Ngân sách ${itinerary.budget}</span>
            <span>⭐ Phù hợp 96%</span>
          </div>
        </div>

        <div class="section-title">📅 Lịch trình từng ngày</div>
        ${days.map((day: any) => `
          <div class="day-card">
            <div class="day-header">
              <div>
                <div class="day-num">Ngày ${day.day}</div>
                <div class="day-title"><span class="emoji">${day.emoji}</span>${day.title}</div>
              </div>
              <div class="day-budget">~${day.budget}</div>
            </div>
            <div class="day-body">
              <ul>
                ${day.activities.map((a: string) => `<li>${a}</li>`).join("")}
              </ul>
            </div>
          </div>
        `).join("")}

        <div class="section-title">💰 Ước tính chi phí</div>
        <table class="budget-table">
          ${budgetBreakdown.map((b: any) => `
            <tr><td>${b.label}</td><td>${b.amount}</td></tr>
          `).join("")}
          <tr>
            <td class="budget-total">Tổng ước tính</td>
            <td class="budget-total">${totalBudget}</td>
          </tr>
        </table>

        ${itinerary.interests && itinerary.interests.length > 0 ? `
          <div class="section-title">🎯 Sở thích</div>
          <div class="tags">
            ${itinerary.interests.map((t: string) => `<span class="tag">${t}</span>`).join("")}
          </div>
        ` : ""}

        <div class="footer">
          Tạo bởi WanderLab AI · wanderlab.vn · Lưu lúc ${itinerary.savedAt || new Date().toLocaleDateString('vi-VN')}
        </div>
      </body>
      </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { marginTop: insets.top + 40, paddingBottom: insets.bottom }]}>
          
          {/* Hero Image Header */}
          <View style={styles.heroContainer}>
            <Image
              source={itinerary.destinationImage}
              style={styles.heroImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.heroGradient}
            />
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.aiBadgeText}>AI Generated</Text>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.heroTitle}>{itinerary.destination}</Text>
              <View style={styles.regionRow}>
                <Ionicons name="location" size={14} color="#fff" />
                <Text style={styles.heroRegion}>{itinerary.destinationRegion}</Text>
              </View>
            </View>
          </View>

          {/* Meta Chips */}
          <View style={styles.metaChipsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metaChipsScroll}>
              <View style={styles.chip}>
                <Ionicons name="time-outline" size={14} color="#ff3131" />
                <Text style={styles.chipText}>{itinerary.duration}</Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name="people-outline" size={14} color="#ff3131" />
                <Text style={styles.chipText}>{itinerary.groupSize}</Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name="wallet-outline" size={14} color="#ff3131" />
                <Text style={styles.chipText}>Ngân sách {itinerary.budget}</Text>
              </View>
              {itinerary.interests?.slice(0, 2).map((tag: string, index: number) => (
                <View key={index} style={[styles.chip, styles.chipGray]}>
                  <Text style={styles.chipTextGray}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Scrollable Content */}
          <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentPadding}>
            
            {/* Days Schedule */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="calendar-outline" size={18} color="#ff3131" />
                <Text style={styles.sectionTitle}>Lịch trình từng ngày</Text>
              </View>
              
              {days.map((day: any, idx: number) => (
                <View key={idx} style={styles.dayCard}>
                  <LinearGradient colors={['rgba(255,49,49,0.1)', 'rgba(255,145,77,0.1)']} style={styles.dayHeader}>
                    <View style={styles.dayHeaderLeft}>
                      <Text style={styles.dayEmoji}>{day.emoji}</Text>
                      <View>
                        <Text style={styles.dayNum}>NGÀY {day.day}</Text>
                        <Text style={styles.dayTitle}>{day.title}</Text>
                      </View>
                    </View>
                    <View style={styles.dayBudgetBadge}>
                      <Text style={styles.dayBudgetText}>~{day.budget}</Text>
                    </View>
                  </LinearGradient>
                  <View style={styles.dayBody}>
                    {day.activities.map((act: string, aIdx: number) => (
                      <View key={aIdx} style={styles.activityRow}>
                        <Ionicons name="chevron-forward" size={16} color="#ff914d" style={styles.activityBullet} />
                        <Text style={styles.activityText}>{act}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {/* Budget Breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="wallet-outline" size={18} color="#ff3131" />
                <Text style={styles.sectionTitle}>Ước tính chi phí</Text>
              </View>
              <View style={styles.budgetCard}>
                {budgetBreakdown.map((b: any, idx: number) => (
                  <View key={idx} style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>{b.label}</Text>
                    <Text style={styles.budgetValue}>{b.amount}</Text>
                  </View>
                ))}
                <View style={styles.budgetTotalRow}>
                  <Text style={styles.budgetTotalLabel}>Tổng ước tính</Text>
                  <Text style={styles.budgetTotalValue}>{totalBudget}</Text>
                </View>
              </View>
            </View>

            {/* Interests */}
            {itinerary.interests && itinerary.interests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="star-outline" size={18} color="#ff3131" />
                  <Text style={styles.sectionTitle}>Sở thích đã chọn</Text>
                </View>
                <View style={styles.interestsContainer}>
                  {itinerary.interests.map((tag: string, idx: number) => (
                    <View key={idx} style={styles.interestTag}>
                      <Text style={styles.interestTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.footerText}>
              Đã lưu {itinerary.savedAt} · Tạo bởi WanderLab AI
            </Text>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerActions}>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => {
                onDelete(itinerary.id);
                onClose();
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.pdfButton} onPress={handleDownloadPDF}>
              <LinearGradient colors={['#ff3131', '#ff914d']} style={styles.pdfButtonGradient}>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.pdfButtonText}>Tải PDF</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <View style={styles.doneButtonInner}>
                <Text style={styles.doneButtonTextAlt}>Đóng</Text>
              </View>
            </TouchableOpacity>
          </View>
          
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.9,
    overflow: 'hidden',
  },
  heroContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroRegion: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginLeft: 4,
  },
  metaChipsContainer: {
    backgroundColor: '#FFF5F3',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4E1',
    paddingVertical: 12,
  },
  metaChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FFE4E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    marginRight: 8,
  },
  chipText: {
    color: '#ff3131',
    fontSize: 12,
    fontWeight: '600',
  },
  chipGray: {
    borderColor: '#E5E7EB',
  },
  chipTextGray: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '500',
  },
  contentScroll: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dayEmoji: {
    fontSize: 24,
  },
  dayNum: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ff3131',
    marginBottom: 2,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  dayBudgetBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  dayBudgetText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff3131',
  },
  dayBody: {
    padding: 16,
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityBullet: {
    marginTop: 2,
    marginRight: 6,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    gap: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  budgetTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: '#E5E7EB',
  },
  budgetTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  budgetTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ff3131',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#FFE4E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  interestTagText: {
    color: '#ff3131',
    fontSize: 13,
    fontWeight: '500',
  },
  footerText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 16,
  },
  footerActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
    gap: 12,
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfButton: {
    flex: 2,
    height: 48,
  },
  pdfButtonGradient: {
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    flex: 1,
    height: 48,
  },
  doneButtonInner: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  doneButtonTextAlt: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
