import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type SignalPayload = {
  type: 'offer' | 'answer' | 'ice-candidate' | 'end-call';
  sdp?: any;
  candidate?: any;
  callerId: string;
  callerName?: string;
  callerAvatar?: string;
  isVideo?: boolean;
};

class WebRTCService {
  private channel: RealtimeChannel | null = null;
  public currentUserId: string | null = null;
  private listeners: Set<(payload: SignalPayload) => void> = new Set();
  
  // Cache to store ice-candidates that arrive before CallScreen mounts
  private signalBuffer: SignalPayload[] = [];

  addListener(listener: (payload: SignalPayload) => void) {
    this.listeners.add(listener);
    // Send buffered signals to the new listener
    this.signalBuffer.forEach(payload => listener(payload));
  }

  removeListener(listener: (payload: SignalPayload) => void) {
    this.listeners.delete(listener);
  }

  consumeBuffer() {
    const buffer = [...this.signalBuffer];
    this.signalBuffer = [];
    return buffer;
  }

  clearBuffer() {
    this.signalBuffer = [];
  }

  init(userId: string, onSignal?: (payload: SignalPayload) => void) {
    if (this.channel) {
      this.channel.unsubscribe();
    }
    
    this.currentUserId = userId;
    if (onSignal) {
      this.addListener(onSignal);
    }

    // Lắng nghe trên kênh riêng của user này
    this.channel = supabase.channel(`webrtc:${userId}`);
    
    this.channel.on('broadcast', { event: 'webrtc-signal' }, (payload) => {
      const signalPayload = payload.payload as SignalPayload;
      
      // If only AppNavigator is listening (size === 1) and it's an ice-candidate, buffer it
      if (this.listeners.size <= 1 && signalPayload.type === 'ice-candidate') {
        this.signalBuffer.push(signalPayload);
      }
      
      this.listeners.forEach(listener => listener(signalPayload));
    });

    this.channel.subscribe();
  }

  sendSignal(targetUserId: string, payload: SignalPayload) {
    if (!this.currentUserId) return;
    
    // Gửi signal tới kênh của user đích
    const targetChannel = supabase.channel(`webrtc:${targetUserId}`);
    targetChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        targetChannel.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: {
            ...payload,
            callerId: this.currentUserId // Luôn đính kèm ID của người gửi
          }
        }).then(() => {
          // Sau khi gửi xong thì có thể unsubscribe để tiết kiệm tài nguyên
          setTimeout(() => targetChannel.unsubscribe(), 500); // Thêm một chút delay để đảm bảo gửi xong
        });
      }
    });
  }

  cleanup() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.onSignalReceived = null;
    this.currentUserId = null;
  }
}

export const webrtcService = new WebRTCService();
