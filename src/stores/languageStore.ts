import { create } from 'zustand';

interface LanguageState {
  language: 'vi' | 'en';
  setLanguage: (lang: 'vi' | 'en') => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'vi',
  setLanguage: (lang) => set({ language: lang }),
  toggleLanguage: () => set((state) => ({ language: state.language === 'vi' ? 'en' : 'vi' })),
}));
