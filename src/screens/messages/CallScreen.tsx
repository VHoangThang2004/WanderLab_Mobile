import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export function CallScreen({ route, navigation }: any) {
  const { contactName, contactAvatar, isVideo = false } = route.params || {};
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!isVideo);

  const handleEndCall = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1f2937', '#111827', '#000000']} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Caller Info */}
        <View style={styles.callerInfo}>
          {!isVideoOff ? (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam-outline" size={48} color="rgba(255,255,255,0.5)" />
              <Text style={styles.videoText}>Camera đang bật</Text>
            </View>
          ) : (
            <Image source={{ uri: contactAvatar || 'https://via.placeholder.com/150' }} style={styles.avatar} contentFit="cover" />
          )}
          <Text style={styles.name}>{contactName || 'Người dùng'}</Text>
          <Text style={styles.status}>Đang gọi...</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]}
            onPress={() => setIsVideoOff(!isVideoOff)}
          >
            <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={28} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlBtn, styles.endCallBtn]}
            onPress={handleEndCall}
          >
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing['2xl'],
  },
  callerInfo: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  videoPlaceholder: {
    width: width * 0.9,
    height: height * 0.6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  videoText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.sm,
    fontSize: typography.sm,
  },
  name: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  status: {
    fontSize: typography.base,
    color: 'rgba(255,255,255,0.7)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  endCallBtn: {
    backgroundColor: colors.error,
  },
});
