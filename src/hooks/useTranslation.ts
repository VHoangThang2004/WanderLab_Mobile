import { useLanguageStore } from '../stores/languageStore';
import { vi } from '../locales/vi';
import { en } from '../locales/en';

type Dictionary = typeof vi;

export function useTranslation() {
  const { language } = useLanguageStore();
  const dict: Dictionary = language === 'en' ? en : vi;

  // Simple nested key resolver, e.g. t('settings.title')
  const t = (keyString: string): string => {
    const keys = keyString.split('.');
    let current: any = dict;
    
    for (const k of keys) {
      if (current[k] === undefined) {
        return keyString; // Fallback to key if not found
      }
      current = current[k];
    }
    
    return typeof current === 'string' ? current : keyString;
  };

  return { t, language };
}
