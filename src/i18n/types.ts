import type { en } from './messages/en.ts';

/** Widens the literal strings of `en` so every other language can fill the same shape with its own text. */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer Args) => string
    ? (...args: Args) => string
    : T extends readonly (infer Item)[]
      ? readonly Widen<Item>[]
      : { [Key in keyof T]: Widen<T[Key]> };

/** English is the source of truth: add a key there and the compiler lists every language that still needs it. */
export type Messages = Widen<typeof en>;
