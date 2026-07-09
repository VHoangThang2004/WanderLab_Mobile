import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, Platform, ActivityIndicator, KeyboardAvoidingView, Alert, Modal, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { diaryService } from '../../api/diaryService';
import { aiService } from '../../api/aiService';
import { CreateDiaryPayload } from '../../types/diary';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUsageLimits } from '../../hooks/useUsageLimits';

const PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
  "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
  "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên",
  "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An",
  "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng",
  "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang",
  "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

export function CreateDiaryScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { checkLimit, incrementUsage, checkMediaLimits } = useUsageLimits();

  React.useEffect(() => {
    checkLimit('create_diary', true).then(allowed => {
      if (!allowed) {
        navigation.goBack();
      }
    });
  }, []);

  // Step 1: Basic Info
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [style, setStyle] = useState('');
  
  // Step 2: Budget & Group
  const [budget, setBudget] = useState('');
  const [groupSize, setGroupSize] = useState('1');
  const [description, setDescription] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGenerateDescription = async () => {
    if (!location) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn địa điểm ở Bước 1 trước khi dùng AI.");
      return;
    }
    
    const allowed = await checkLimit('ai_assistant', true);
    if (!allowed) return;

    try {
      setIsGeneratingAI(true);
      const context = {
        location: location,
        budget: budget || 'chưa rõ',
        groupSize: groupSize || 1,
        style: style || 'tự do'
      };
      
      const response = await aiService.polishDescription(description, context, "vi");
      if (response) {
        setDescription(response);
        await incrementUsage('ai_assistant');
      }
    } catch (error) {
      Alert.alert("Lỗi AI", "Không thể tạo mô tả lúc này. Vui lòng thử lại sau.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Step 3: Timeline & Media
  const [timeline, setTimeline] = useState<any[]>([
    { day: 1, title: '', activities: [''], budget: '' }
  ]);

  // Step 4: Privacy
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Modals & Pickers
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [startDateObj, setStartDateObj] = useState(new Date());
  const [endDateObj, setEndDateObj] = useState(new Date());

  const STYLES = ['Trekking & Leo Núi', 'Ẩm Thực', 'Văn Hoá & Di Sản', 'Cao Cấp', 'Tiết Kiệm', 'Biển & Nghỉ Dưỡng'];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickTimelineImage = async () => {
    Alert.alert("Chức năng media", "Chọn file media sẽ được cập nhật đầy đủ trong phiên bản tới!");
  };

  const addTimelineDay = () => {
    setTimeline([...timeline, { day: timeline.length + 1, title: '', activities: [''], budget: '' }]);
  };

  const removeTimelineDay = (index: number) => {
    if (timeline.length > 1) {
      const newTimeline = timeline.filter((_, i) => i !== index);
      newTimeline.forEach((day, i) => { day.day = i + 1; });
      setTimeline(newTimeline);
    }
  };

  const addActivity = (dayIndex: number) => {
    const newTimeline = [...timeline];
    newTimeline[dayIndex].activities.push('');
    setTimeline(newTimeline);
  };

  const updateActivity = (dayIndex: number, actIndex: number, val: string) => {
    const newTimeline = [...timeline];
    newTimeline[dayIndex].activities[actIndex] = val;
    setTimeline(newTimeline);
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    const newTimeline = [...timeline];
    if (newTimeline[dayIndex].activities.length > 1) {
      newTimeline[dayIndex].activities.splice(actIndex, 1);
      setTimeline(newTimeline);
    }
  };

  const validateStep1 = () => {
    if (!title || !location || !startDate || !endDate || !style || !imageUri) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các mục bắt buộc ở Bước 1.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!budget || !groupSize || !description) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ ngân sách, số người và mô tả chuyến đi.');
      return false;
    }
    return true;
  };
  
  const validateStep4 = () => {
    if (!agreedToTerms) {
      Alert.alert('Điều khoản', 'Vui lòng đồng ý với các điều khoản dịch vụ để tiếp tục.');
      return false;
    }
    return true;
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleCreate = async () => {
    if (!validateStep4()) return;
    
    const allowed = await checkLimit('create_diary', true);
    if (!allowed) return;

    if (!checkMediaLimits(0, 1, 0, 0)) return; // 1 image (cover)

    setLoading(true);
    try {
      const coverUrl = await diaryService.uploadDiaryImage(imageUri!);
      
      const timelineFormatted = timeline.map(day => ({
        day: day.day,
        title: day.title || `Ngày ${day.day}`,
        activities: day.activities.filter((a: string) => a.trim() !== ""),
        budget: day.budget ? `${(parseInt(day.budget) / 1000000).toFixed(1)} tr` : "0đ",
        images: [], videos: [], audios: []
      }));

      const payload: CreateDiaryPayload = {
        title,
        location,
        country: 'Việt Nam',
        duration: `${timeline.length} ngày`,
        dates: `${startDate} - ${endDate}`,
        total_budget: `${(parseInt(budget) / 1000000).toFixed(1)} triệu ₫`,
        group_size: `${groupSize} người`,
        description,
        status: privacy === 'private' ? 'draft' : 'published',
        tips: ["Mang theo đồ cá nhân", "Chuẩn bị tiền mặt"],
        budget_notes: ["Giá cả có thể thay đổi"],
        timeline: timelineFormatted,
        budget_breakdown: [
          { category: "Di chuyển", amount: "Vừa phải", percentage: 30 },
          { category: "Ăn uống", amount: "Phải chăng", percentage: 40 },
          { category: "Lưu trú", amount: "Giá rẻ", percentage: 30 },
        ]
      };

      await diaryService.createDiary(payload, coverUrl);
      await incrementUsage('create_diary');
      
      Alert.alert('Thành công', 'Bài viết đã được tạo thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      console.warn(e);
      Alert.alert('Lỗi', 'Không thể tạo bài viết: ' + (e.message || JSON.stringify(e)));
    } finally {
      setLoading(false);
    }
  };

  const renderProgress = () => {
    const titles = ["Thông Tin", "Ngân Sách", "Lịch Trình", "Quyền Riêng Tư"];
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((n, i) => (
          <React.Fragment key={n}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.progressCircle, step >= n && styles.progressCircleActive]}>
                {step > n ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={[styles.progressText, step >= n && styles.progressTextActive]}>{n}</Text>}
              </View>
              <Text style={[styles.progressTitle, step >= n && styles.progressTitleActive]}>{titles[i]}</Text>
            </View>
            {n < 4 && <View style={[styles.progressLine, step > n && styles.progressLineActive]} />}
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        
        {/* Location Modal */}
        <Modal visible={showLocationModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn địa điểm</Text>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={PROVINCES}
                keyExtractor={(item) => item}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.provinceItem} 
                    onPress={() => { setLocation(item); setShowLocationModal(false); }}
                  >
                    <Ionicons name="location-outline" size={20} color={colors.primary} style={{marginRight: 10}} />
                    <Text style={styles.provinceText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Start Date Picker */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDateObj}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartDatePicker(Platform.OS === 'ios');
              if (date) {
                setStartDateObj(date);
                setStartDate(date.toLocaleDateString('vi-VN'));
              }
            }}
          />
        )}

        {/* End Date Picker */}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDateObj}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndDatePicker(Platform.OS === 'ios');
              if (date) {
                setEndDateObj(date);
                setEndDate(date.toLocaleDateString('vi-VN'));
              }
            }}
          />
        )}

        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name={step > 1 ? "arrow-back" : "close"} size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={{alignItems: 'center'}}>
            <View style={styles.notebookBadge}>
              <Ionicons name="book" size={14} color="#ff3131" style={{marginRight: 4}} />
              <Text style={styles.notebookBadgeText}>Sổ Tay Du Lịch</Text>
            </View>
            <Text style={styles.headerTitle}>Tạo Nhật Ký Mới</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderProgress()}
          
          <View style={styles.notebookPage}>
            <View style={styles.notebookMargin} />
            <Text style={styles.stepPercent}>{step * 25}%</Text>

            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepHeader}>Thông Tin Cơ Bản</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>✍️ Tiêu đề chuyến đi *</Text>
                  <TextInput style={styles.inputBox} placeholder="VD: Khám phá Vịnh Hạ Long 5 Ngày" value={title} onChangeText={setTitle} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>📍 Địa điểm *</Text>
                  <TouchableOpacity style={styles.dropdownBox} onPress={() => setShowLocationModal(true)}>
                    <Text style={location ? styles.dropdownText : styles.dropdownPlaceholder}>
                      {location || "Chọn tỉnh / thành phố"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>📅 Ngày bắt đầu *</Text>
                    <TouchableOpacity style={styles.dropdownBox} onPress={() => setShowStartDatePicker(true)}>
                      <Text style={startDate ? styles.dropdownText : styles.dropdownPlaceholder}>
                        {startDate || "Chọn ngày"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>📅 Ngày kết thúc *</Text>
                    <TouchableOpacity style={styles.dropdownBox} onPress={() => setShowEndDatePicker(true)}>
                      <Text style={endDate ? styles.dropdownText : styles.dropdownPlaceholder}>
                        {endDate || "Chọn ngày"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>🎨 Phong cách du lịch *</Text>
                  <View style={styles.chipRow}>
                    {STYLES.map(s => (
                      <TouchableOpacity key={s} style={[styles.chip, style === s && styles.chipActive]} onPress={() => setStyle(s)}>
                        <Text style={[styles.chipText, style === s && styles.chipTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>🖼️ Ảnh bìa chuyến đi *</Text>
                  <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.coverImage} contentFit="cover" />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="cloud-upload-outline" size={32} color="#aaa" />
                        <Text style={styles.imagePlaceholderText}>Nhấn để tải ảnh bìa lên</Text>
                        <Text style={styles.imagePlaceholderSubText}>JPG, PNG (Max 10MB)</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                  <Text style={styles.nextBtnText}>Tiếp theo</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepHeader}>Ngân Sách & Nhóm Du Lịch</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>💰 Tổng Ngân Sách (VND) *</Text>
                  <TextInput style={styles.inputBox} placeholder="VD: 5000000" keyboardType="numeric" value={budget} onChangeText={setBudget} />
                  <Text style={styles.helperText}>Bao gồm tất cả chi phí (lưu trú, ăn uống, di chuyển, tham quan)</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>👥 Số Người *</Text>
                  <TextInput style={styles.inputBox} placeholder="VD: 2" keyboardType="numeric" value={groupSize} onChangeText={setGroupSize} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>📝 Mô tả chuyến đi *</Text>
                  <TextInput
                    style={[styles.inputBox, { minHeight: 120 }]}
                    placeholder="Chia sẻ điều đặc biệt nhất của chuyến đi. Bao gồm điểm nổi bật, trải nghiệm đáng nhớ..."
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                  />
                  
                  <View style={styles.aiSuggestionCard}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Ionicons name="sparkles" size={20} color="#ff3131" style={{marginRight: 8}} />
                      <Text style={styles.aiSuggestionTitle}>Gợi Ý AI</Text>
                    </View>
                    <Text style={styles.aiSuggestionText}>Dựa trên địa điểm và ngày tháng của bạn, AI có thể gợi ý viết mô tả chuyến đi một cách tự nhiên và sinh động hơn.</Text>
                    <TouchableOpacity 
                      style={styles.aiBtn} 
                      onPress={handleGenerateDescription}
                      disabled={isGeneratingAI}
                    >
                      {isGeneratingAI ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.aiBtnText}>Bật Trợ Lý AI →</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                  <Text style={styles.nextBtnText}>Tiếp theo</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                  <Text style={styles.stepHeader}>Lịch Trình & Media</Text>
                  <TouchableOpacity onPress={addTimelineDay} style={styles.addDayBtn}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.addDayBtnText}>Thêm Ngày</Text>
                  </TouchableOpacity>
                </View>

                {timeline.map((day, dIdx) => (
                  <View key={dIdx} style={styles.dayCard}>
                    <View style={styles.dayHeader}>
                      <View style={styles.dayBadge}>
                        <Ionicons name="calendar" size={14} color="#fff" />
                        <Text style={styles.dayTitleText}>Ngày {day.day}</Text>
                      </View>
                      {timeline.length > 1 && (
                        <TouchableOpacity onPress={() => removeTimelineDay(dIdx)} style={{padding: 4}}>
                          <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <TextInput
                      style={styles.inputBoxSmall}
                      placeholder="Tiêu đề ngày (VD: Đến Hà Nội – Thăm Phố Cổ)"
                      value={day.title}
                      onChangeText={(val) => {
                        const newTimeline = [...timeline];
                        newTimeline[dIdx].title = val;
                        setTimeline(newTimeline);
                      }}
                    />

                    <Text style={styles.subLabel}>Hoạt Động</Text>
                    {day.activities.map((act: string, aIdx: number) => (
                      <View key={aIdx} style={styles.activityRow}>
                        <TextInput
                          style={styles.inputBoxSmallAct}
                          placeholder={`Hoạt động ${aIdx + 1}`}
                          value={act}
                          onChangeText={(val) => updateActivity(dIdx, aIdx, val)}
                        />
                        {day.activities.length > 1 && (
                          <TouchableOpacity onPress={() => removeActivity(dIdx, aIdx)} style={{marginLeft: 8}}>
                            <Ionicons name="close-circle" size={24} color={colors.textTertiary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity onPress={() => addActivity(dIdx)} style={{marginBottom: spacing.md}}>
                      <Text style={styles.addActText}>+ Thêm Hoạt Động</Text>
                    </TouchableOpacity>

                    <Text style={styles.subLabel}>Ngân Sách Ngày (VND)</Text>
                    <TextInput
                      style={styles.inputBoxSmall}
                      placeholder="Ngân sách ngày"
                      keyboardType="numeric"
                      value={day.budget}
                      onChangeText={(val) => {
                        const newTimeline = [...timeline];
                        newTimeline[dIdx].budget = val;
                        setTimeline(newTimeline);
                      }}
                    />

                    <View style={styles.divider} />
                    
                    <Text style={styles.subLabel}>Media (Ảnh/Video/Audio)</Text>
                    <View style={styles.mediaRow}>
                      <TouchableOpacity style={styles.mediaBtn} onPress={pickTimelineImage}>
                        <Ionicons name="image-outline" size={24} color="#666" />
                        <Text style={styles.mediaBtnText}>Ảnh</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.mediaBtn} onPress={pickTimelineImage}>
                        <Ionicons name="videocam-outline" size={24} color="#666" />
                        <Text style={styles.mediaBtnText}>Video</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.mediaBtn} onPress={pickTimelineImage}>
                        <Ionicons name="mic-outline" size={24} color="#666" />
                        <Text style={styles.mediaBtnText}>Audio</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                  <Text style={styles.nextBtnText}>Tiếp theo</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {step === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepHeader}>Quyền Riêng Tư</Text>
                
                <Text style={styles.label}>🔒 Ai có thể xem nhật ký này? *</Text>
                
                <TouchableOpacity 
                  style={[styles.privacyCard, privacy === 'public' && styles.privacyCardActive]}
                  onPress={() => setPrivacy('public')}
                >
                  <View style={[styles.privacyIconWrap, privacy === 'public' && styles.privacyIconWrapActive]}>
                    <Ionicons name="globe-outline" size={24} color={privacy === 'public' ? '#fff' : '#666'} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.privacyTitle}>Công khai</Text>
                    <Text style={styles.privacyDesc}>Tất cả mọi người đều có thể xem nhật ký này</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.privacyCard, privacy === 'friends' && styles.privacyCardActive]}
                  onPress={() => setPrivacy('friends')}
                >
                  <View style={[styles.privacyIconWrap, privacy === 'friends' && styles.privacyIconWrapActive]}>
                    <Ionicons name="people-outline" size={24} color={privacy === 'friends' ? '#fff' : '#666'} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.privacyTitle}>Bạn bè</Text>
                    <Text style={styles.privacyDesc}>Chỉ bạn bè mới có thể xem</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.privacyCard, privacy === 'private' && styles.privacyCardActive]}
                  onPress={() => setPrivacy('private')}
                >
                  <View style={[styles.privacyIconWrap, privacy === 'private' && styles.privacyIconWrapActive]}>
                    <Ionicons name="lock-closed-outline" size={24} color={privacy === 'private' ? '#fff' : '#666'} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.privacyTitle}>Riêng tư</Text>
                    <Text style={styles.privacyDesc}>Chỉ mình bạn có thể xem nhật ký này</Text>
                  </View>
                </TouchableOpacity>

                <LinearGradient colors={['#ff3131', '#ff914d']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.inspireCard}>
                  <Text style={styles.inspireTitle}>🎉 Sẵn Sàng Truyền Cảm Hứng!</Text>
                  <Text style={styles.inspireText}>Nhật ký của bạn sẽ được xem xét về tính xác thực và có thể được đề xuất trên trang chủ.</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
                    <Ionicons name="eye" size={16} color="#fff" style={{marginRight: 6}} />
                    <Text style={styles.inspireSub}>Ước tính 500+ người dùng sẽ xem nhật ký của bạn</Text>
                  </View>
                </LinearGradient>

                <TouchableOpacity style={styles.termsCard} onPress={() => setAgreedToTerms(!agreedToTerms)}>
                  <Ionicons name={agreedToTerms ? "checkbox" : "square-outline"} size={24} color={agreedToTerms ? "#ff3131" : "#999"} style={{marginRight: 10}} />
                  <Text style={styles.termsText}>
                    Tôi xác nhận tất cả thông tin là chính xác và đồng ý với <Text style={{color: '#ff3131', fontWeight: 'bold'}}>Điều Khoản Dịch Vụ</Text> của WanderLab.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.nextBtn} onPress={handleCreate} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.nextBtnText}>Hoàn thành & Chia sẻ</Text>
                      <Ionicons name="sparkles" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F3' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingTop: Platform.OS === 'ios' ? 10 : spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerBtn: { padding: spacing.xs, minWidth: 40, alignItems: 'center' },
  headerTitle: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.text, marginTop: 4 },
  notebookBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.1, shadowRadius:2, elevation:2 },
  notebookBadgeText: { fontSize: 12, fontWeight: '600', color: '#555' },
  
  scrollContent: { paddingBottom: spacing['4xl'], paddingHorizontal: spacing.md },
  
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.xl, paddingHorizontal: spacing.sm },
  progressCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ff914d30', alignItems: 'center', justifyContent: 'center' },
  progressCircleActive: { backgroundColor: '#ff3131' },
  progressText: { fontSize: 14, fontWeight: 'bold', color: '#ff914d' },
  progressTextActive: { color: '#fff' },
  progressTitle: { fontSize: 10, color: '#999', marginTop: 4, width: 60, textAlign: 'center', fontWeight: '600' },
  progressTitleActive: { color: '#ff3131', fontWeight: 'bold' },
  progressLine: { flex: 1, height: 3, backgroundColor: '#ff914d30', marginHorizontal: 4, borderRadius: 2, top: -8 },
  progressLineActive: { backgroundColor: '#ff3131' },

  notebookPage: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, paddingLeft: spacing.xl + 10, minHeight: 500, shadowColor: '#000', shadowOffset: {width:0,height:4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, overflow: 'hidden', position: 'relative' },
  notebookMargin: { position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, backgroundColor: '#ff313130' },
  stepPercent: { position: 'absolute', top: 16, right: 16, fontSize: 20, fontWeight: 'bold', color: '#ff3131' },
  
  stepContainer: { flex: 1, marginTop: spacing.md },
  stepHeader: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xl },
  
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  helperText: { fontSize: 12, color: '#666', marginTop: 4 },
  inputBox: { borderBottomWidth: 1.5, borderColor: '#eee', paddingVertical: 8, fontSize: typography.base, color: colors.text },
  dropdownBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1.5, borderColor: '#eee', paddingVertical: 8 },
  dropdownText: { fontSize: typography.base, color: colors.text },
  dropdownPlaceholder: { fontSize: typography.base, color: '#aaa' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', padding: spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  provinceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  provinceText: { fontSize: 16, color: colors.text },
  
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#eee', backgroundColor: '#f9f9f9' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sm, color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },

  imagePicker: { width: '100%', aspectRatio: 16/9, backgroundColor: '#f5f5f5', borderRadius: 12, borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  coverImage: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { marginTop: spacing.sm, fontSize: 14, color: '#555', fontWeight: '600' },
  imagePlaceholderSubText: { marginTop: 4, fontSize: 12, color: '#999' },
  
  aiSuggestionCard: { backgroundColor: '#fff5ec', padding: spacing.md, borderRadius: 12, marginTop: spacing.md, borderLeftWidth: 4, borderLeftColor: '#ff3131' },
  aiSuggestionTitle: { fontSize: 14, fontWeight: 'bold', color: '#ff914d' },
  aiSuggestionText: { fontSize: 13, color: '#666', marginVertical: 8, lineHeight: 18 },
  aiBtn: { alignSelf: 'flex-start' },
  aiBtnText: { fontSize: 13, fontWeight: 'bold', color: '#ff3131' },

  addDayBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.md, gap: 4 },
  addDayBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  dayCard: { backgroundColor: '#fff9f5', borderWidth: 1, borderColor: '#ffe0cc', borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  dayBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  dayTitleText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  
  subLabel: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8, marginTop: 12 },
  inputBoxSmall: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: 14, marginBottom: spacing.sm },
  activityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  inputBoxSmallAct: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 8, fontSize: 14 },
  addActText: { fontSize: 13, color: colors.primary, fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#eee', marginVertical: spacing.md },
  mediaRow: { flexDirection: 'row', gap: spacing.md },
  mediaBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 12, backgroundColor: '#fcfcfc' },
  mediaBtnText: { fontSize: 12, color: '#666', fontWeight: '600', marginTop: 4 },
  
  privacyCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 12, borderWidth: 2, borderColor: '#eee', marginBottom: spacing.sm, backgroundColor: '#fff' },
  privacyCardActive: { borderColor: '#ff3131', backgroundColor: '#fff9f5' },
  privacyIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  privacyIconWrapActive: { backgroundColor: colors.primary },
  privacyTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  privacyDesc: { fontSize: 13, color: '#666' },
  
  inspireCard: { borderRadius: 16, padding: spacing.lg, marginVertical: spacing.lg },
  inspireTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  inspireText: { fontSize: 14, color: '#fff', opacity: 0.9, lineHeight: 20 },
  inspireSub: { fontSize: 12, color: '#fff', opacity: 0.8 },
  
  termsCard: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, backgroundColor: '#f9f9f9', borderRadius: 12, marginBottom: spacing.xl },
  termsText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },

  nextBtn: { backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, marginTop: spacing.md, gap: 8 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
