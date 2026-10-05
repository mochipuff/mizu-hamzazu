import type { Messages } from '../i18n/types.ts';

export interface ContactInput {
  name: string;
  email: string;
  /** Id of the chosen topic (`contactTopicIds`), not its translated label. */
  topic: string;
  message: string;
}

export type ContactErrorMessages = Messages['contact']['errors'];

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

const MESSAGE_MIN = 20;
export const MESSAGE_MAX = 2000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HEADER_BREAK = /[\r\n]/;

export function validateContact(input: ContactInput, text: ContactErrorMessages): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (name.length === 0) errors.name = text.nameRequired;
  else if (name.length > 80) errors.name = text.nameTooLong;

  if (email.length === 0) errors.email = text.emailRequired;
  else if (!EMAIL_PATTERN.test(email) || HEADER_BREAK.test(email)) errors.email = text.emailInvalid;

  if (input.topic.trim().length === 0) errors.topic = text.topicRequired;

  if (message.length < MESSAGE_MIN) errors.message = text.messageTooShort(MESSAGE_MIN);
  else if (message.length > MESSAGE_MAX) errors.message = text.messageTooLong(MESSAGE_MAX);

  return errors;
}

/** `topicLabel` is passed in so the subject line stays in one language for whoever reads the inbox. */
export function buildMailto(to: string, input: ContactInput, topicLabel: string): string {
  const subject = `[${topicLabel.trim()}] ${input.name.trim()}`.replace(/[\r\n]+/g, ' ');
  const body = `${input.message.trim()}\n\n-\n${input.name.trim()}\n${input.email.trim()}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function hasErrors(errors: ContactErrors): boolean {
  return Object.keys(errors).length > 0;
}
