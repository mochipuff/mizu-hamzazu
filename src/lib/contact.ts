export interface ContactInput {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

export const MESSAGE_MIN = 20;
export const MESSAGE_MAX = 2000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HEADER_BREAK = /[\r\n]/;

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (name.length === 0) errors.name = 'Please tell us your name.';
  else if (name.length > 80) errors.name = 'That name is a little long. Please shorten it.';

  if (email.length === 0) errors.email = 'Please add an email address so we can reply.';
  else if (!EMAIL_PATTERN.test(email) || HEADER_BREAK.test(email)) errors.email = 'That email address does not look right.';

  if (input.topic.trim().length === 0) errors.topic = 'Please pick a topic.';

  if (message.length < MESSAGE_MIN) errors.message = `Please write at least ${MESSAGE_MIN} characters so we have enough to go on.`;
  else if (message.length > MESSAGE_MAX) errors.message = `Please keep it under ${MESSAGE_MAX} characters.`;

  return errors;
}

export function buildMailto(to: string, input: ContactInput): string {
  const subject = `[${input.topic.trim()}] ${input.name.trim()}`.replace(/[\r\n]+/g, ' ');
  const body = `${input.message.trim()}\n\n-\n${input.name.trim()}\n${input.email.trim()}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function hasErrors(errors: ContactErrors): boolean {
  return Object.keys(errors).length > 0;
}
