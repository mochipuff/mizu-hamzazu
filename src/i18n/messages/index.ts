import type { Locale } from '../locales.ts';
import { en } from './en.ts';
import { id } from './id.ts';
import { jp } from './jp.ts';

type Widen<T> = T extends string
  ? string
  : T extends (...args: infer Args) => string
    ? (...args: Args) => string
    : T extends readonly (infer Item)[]
      ? readonly Widen<Item>[]
      : { [Key in keyof T]: Widen<T[Key]> };

export type Messages = Widen<typeof en>;

export const messages: Record<Locale, Messages> = { en, jp, id };
