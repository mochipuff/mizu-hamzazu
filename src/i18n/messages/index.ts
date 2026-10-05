import type { Locale } from '../locales.ts';
import type { Messages } from '../types.ts';
import { en } from './en.ts';
import { id } from './id.ts';
import { jp } from './jp.ts';
import { kr } from './kr.ts';

export const messages: Record<Locale, Messages> = { en, jp, id, kr };
