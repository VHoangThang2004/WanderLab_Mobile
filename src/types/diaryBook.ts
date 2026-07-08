export interface DiaryBook {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cover_image_url: string;
  created_at: string;
  diaries_count?: number;
}

export interface CreateDiaryBookPayload {
  title: string;
  description: string;
  cover_image_url?: string;
}
