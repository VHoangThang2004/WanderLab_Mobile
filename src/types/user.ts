export type UserRole = 'explorer' | 'planner' | 'local_provider' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  bio: string | null;
  location: string | null;
  role: UserRole;
  status: UserStatus;
  plan?: string;
  reputation_score: number;
  diaries_count: number;
  followers_count: number;
  following_count: number;
  likes_received?: number;
  comments_received?: number;
  saves_received?: number;
  created_at: string;
  updated_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}
