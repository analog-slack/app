import type { Locale } from '../config';
import { en } from './en';
import { type Dictionary, ru } from './ru';

export const dictionaries: Record<Locale, Dictionary> = { ru, en };
export type { Dictionary };
