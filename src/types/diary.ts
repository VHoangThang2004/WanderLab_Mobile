export type DiaryStatus = 'draft' | 'pending' | 'published' | 'flagged' | 'removed';

export interface DiaryAuthor {
  id: string;
  full_name: string;
  avatar_url: string | null;
  diaries_count: number;
  followers_count: number;
}

export interface DiaryDay {
  day: number;
  title: string;
  activities: string[];
  budget: string;
}

export interface BudgetItem {
  category: string;
  amount: string;
  percentage: number;
}

export interface ReviewPhoto {
  url: string;
  reviewer: string;
  avatar: string;
  caption: string;
  rating: number;
  date: string;
}

/** Lightweight diary for feed/list views */
export interface DiaryFeedItem {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  image: string;
  location: string;
  date: string;
  caption: string;
  likes: number;
  comments: number;
  is_liked: boolean;
  is_saved: boolean;
  group_size: string;
}

export interface DiaryExploreItem {
  id: string;
  title: string;
  location: string;
  country: string;
  image: string;
  budget: string;
  budgetNum: number;
  duration: string;
  durationDays: number;
  trustScore: number;
  author: string;
}

export interface DiaryDetail {
  id: string;
  title: string;
  location: string;
  country: string;
  image: string;
  gallery: string[];
  author: {
    id: string;
    name: string;
    avatar: string;
    diariesCount: number;
    followersCount: number;
  };
  trustScore: number;
  duration: string;
  dates: string;
  totalBudget: string;
  groupSize: string;
  description: string;
  likesCount: number;
  commentsCount: number;
  timeline: DiaryDay[];
  budgetBreakdown: BudgetItem[];
  budgetNotes: string[];
  tips: string[];
}
