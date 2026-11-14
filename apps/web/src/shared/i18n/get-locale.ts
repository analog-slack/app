import { cookies } from 'next/headers';

import { DEFAULT_LOCALE, isLocale, type Locale, LOCALE_COOKIE } from './config';

/** Язык из cookie. Только для серверных компонентов. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
