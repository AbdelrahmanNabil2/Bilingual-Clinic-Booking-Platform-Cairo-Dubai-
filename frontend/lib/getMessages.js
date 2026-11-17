import en from '@/messages/en.json';
import ar from '@/messages/ar.json';

const dictionaries = { en, ar };

export function getMessages(locale) {
  return dictionaries[locale] || dictionaries.en;
}

export const LOCALES = ['en', 'ar'];
export const DEFAULT_LOCALE = 'en';
