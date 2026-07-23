import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  RTCPeerConnection, 
  RTCIceCandidate, 
  RTCSessionDescription, 
  RTCView, 
  mediaDevices, 
  MediaStream 
} from 'react-native-webrtc';
import { webrtcService, SignalPayload } from '../../api/webrtcService';
import { useAuthStore } from '../../stores/authStore';

const { width, height } = Dimensions.get('window');

const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export function CallScreen({ route, navigation }: any) {
  const { 
    contactId, 
    contactName, 
    contactAvatar, 
    isVideo = false, 
    isIncoming = false,
    incomingOffer = null 
  } = route.params || {};
  
  const { user } = useAuthStore();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!isVideo);
  const [callStatus, setCallStatus] = useState(isIncoming ? 'Cuộc gọi đến...' : 'Đang đổ chuông...');
  const [duration, setDuration] = useState(0);

  const pc = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    // Add signal listener
    const handleSignal = async (payload: SignalPayload) => {
      // Ignore if not from the contact we are calling
      if (payload.callerId !== contactId) return;

      switch (payload.type) {
        case 'answer':
          if (pc.current && payload.sdp) {
            await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            setCallStatus('Đã kết nối');
          }
          break;
        case 'ice-candidate':
          if (pc.current && payload.candidate) {
            await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
          break;
        case 'end-call':
          handleEndCall(false); // don't send end signal back
          break;
      }
    };
    
    webrtcService.addListener(handleSignal);
    return () => webrtcService.removeListener(handleSignal);
  }, [contactId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'Đã kết nối') {
      interval = setInterval(() => setDuration(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Khởi tạo luồng phương tiện
  const setupMedia = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { facingMode: 'user' } : false,
      });
      setLocalStream(stream as MediaStream);
      return stream as MediaStream;
    } catch (e) {
      console.error('Lỗi getUserMedia', e);
      return null;
    }
  };

  const setupPeerConnection = async (stream: MediaStream) => {
    pc.current = new RTCPeerConnection(configuration);
    
    // Thêm track vào PeerConnection
    stream.getTracks().forEach((track) => {
      pc.current?.addTrack(track, stream);
    });

    pc.current.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0] as MediaStream);
        setCallStatus('Đã kết nối');
      }
    };

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        webrtcService.sendSignal(contactId, {
          type: 'ice-candidate',
          callerId: user?.id || '',
          candidate: event.candidate,
        });
      }
    };

    return pc.current;
  };

  const startCall = async () => {
    const stream = await setupMedia();
    if (!stream) return;

    const peerConnection = await setupPeerConnection(stream);
    
    const offer = await peerConnection.createOffer({});
    await peerConnection.setLocalDescription(offer);

    webrtcService.sendSignal(contactId, {
      type: 'offer',
      callerId: user?.id || '',
      callerName: (user as any)?.full_name || 'Người dùng',
      callerAvatar: (user as any)?.avatar_url || '',
      sdp: peerConnection.localDescription,
      isVideo
    });
  };

  const acceptCall = async () => {
    const stream = await setupMedia();
    if (!stream) return;

    const peerConnection = await setupPeerConnection(stream);
    
    if (incomingOffer) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      webrtcService.sendSignal(contactId, {
        type: 'answer',
        callerId: user?.id || '',
        sdp: peerConnection.localDescription,
      });
      setCallStatus('Đã kết nối');
    }
  };

  useEffect(() => {
    if (!isIncoming) {
      // Nếu là người gọi, bắt đầu tạo cuộc gọi ngay
      startCall();
    }
    
    return () => {
      // Cleanup on unmount
      if (localStream) {
        localStream.getTracks().forEach((t: any) => t.stop());
      }
      if (pc.current) {
        pc.current.close();
      }
    };
  }, []);

  const handleEndCall = (sendSignal = true) => {
    if (sendSignal) {
      webrtcService.sendSignal(contactId, {
        type: 'end-call',
        callerId: user?.id || ''
      });
    }
    
    if (localStream) {
      localStream.getTracks().forEach((t: any) => t.stop());
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    
    navigation.goBack();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1f2937', '#111827', '#000000']} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Remote Video Background (if available) */}
        {remoteStream && !isVideoOff && (
          <View style={StyleSheet.absoluteFillObject}>
            <RTCView streamURL={remoteStream.toURL()} style={StyleSheet.absoluteFillObject} objectFit="cover" />
          </View>
        )}

        {/* Local Video Thumbnail */}
        {localStream && !isVideoOff && (
          <View style={styles.localVideoContainer}>
            <RTCView streamURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" />
          </View>
        )}

        {/* Caller Info Header */}
        <View style={styles.callerInfo}>
          {(!remoteStream || isVideoOff) && (
            <Image source={{ uri: contactAvatar || 'https://via.placeholder.com/150' }} style={styles.avatar} contentFit="cover" />
          )}
          <Text style={styles.name}>{contactName || 'Người dùng'}</Text>
          <Text style={styles.status}>
            {callStatus === 'Đã kết nối' ? formatDuration(duration) : callStatus}
          </Text>
        </View>

        {/* Incoming Call Accept Button */}
        {isIncoming && callStatus === 'Cuộc gọi đến...' && (
          <View style={styles.incomingControls}>
            <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.success }]} onPress={acceptCall}>
              <Ionicons name="call" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {callStatus !== 'Cuộc gọi đến...' && (
            <>
              <TouchableOpacity 
                style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                onPress={toggleMute}
              >
                <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]}
                onPress={toggleVideo}
              >
                <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={28} color="#fff" />
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            style={[styles.controlBtn, styles.endCallBtn]}
            onPress={() => handleEndCall(true)}
          >
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1, justifyContent: 'space-between', paddingVertical: spacing['2xl'] },
  callerInfo: { alignItems: 'center', marginTop: height * 0.1, zIndex: 10 },
  avatar: { width: 140, height: 140, borderRadius: 70, marginBottom: spacing.xl, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  name: { fontSize: typography['3xl'], fontWeight: 'bold', color: '#fff', marginBottom: spacing.xs, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
  status: { fontSize: typography.base, color: 'rgba(255,255,255,0.7)', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xl, paddingBottom: spacing.xl, zIndex: 10 },
  incomingControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xl, paddingBottom: spacing.xl, zIndex: 10, position: 'absolute', bottom: 120, width: '100%' },
  controlBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  controlBtnActive: { backgroundColor: 'rgba(255,255,255,0.4)' },
  endCallBtn: { backgroundColor: colors.error },
  localVideoContainer: { position: 'absolute', top: 60, right: 20, width: 100, height: 150, borderRadius: 12, overflow: 'hidden', zIndex: 20, elevation: 5, backgroundColor: '#222' },
  localVideo: { flex: 1 },
});
