import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSound } from '../../context/sound.ts';
import { useToast } from '../../context/toast.ts';
import { contactTopicIds } from '../../data/content.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { messages } from '../../i18n/messages/index.ts';
import { copyText } from '../../lib/clipboard.ts';
import {
  buildMailto,
  hasErrors,
  MESSAGE_MAX,
  validateContact,
  type ContactErrors,
  type ContactInput,
} from '../../lib/contact.ts';
import { Button } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';
import { Panel } from '../ui/Panel.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import styles from './Contact.module.css';

const emptyForm: ContactInput = { name: '', email: '', topic: '', message: '' };
const FIELD_ORDER: readonly (keyof ContactInput)[] = ['name', 'email', 'topic', 'message'];

export function Contact({ email }: { email: string }) {
  const { locale, t } = useI18n();
  const { contact } = t;
  const toast = useToast();
  const sound = useSound();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<ContactInput>(emptyForm);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [prepared, setPrepared] = useState(false);

  // Messages already on screen are in the old language, so a switch clears them rather than leaving them behind.
  useEffect(() => {
    setErrors({});
  }, [locale]);

  const update = (field: keyof ContactInput) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setPrepared(false);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateContact(form, contact.errors);
    setErrors(found);

    if (hasErrors(found)) {
      const first = FIELD_ORDER.find((field) => found[field]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    sound.play('sparkle');
    setPrepared(true);
    // The subject line always uses the English topic, so the inbox stays in one language whatever the visitor reads.
    const topicId = contactTopicIds.find((id) => id === form.topic);
    const topicLabel = topicId ? messages.en.contact.topics[topicId] : form.topic;
    window.location.href = buildMailto(email, form, topicLabel);
  };

  const copyEmail = async () => {
    const ok = await copyText(email);
    if (ok) sound.play('copy');
    toast.notify(ok ? contact.emailCopied : t.common.copyBlocked);
  };

  const fieldProps = (field: keyof ContactInput) => ({
    id: `${formId}-${field}`,
    name: field,
    value: form[field],
    onChange: update(field),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `${formId}-${field}-error` : undefined,
  });

  const error = (field: keyof ContactInput) =>
    errors[field] ? (
      <p id={`${formId}-${field}-error`} className={styles.error} role="alert">
        {errors[field]}
      </p>
    ) : null;

  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <div className="container">
        <SectionHeading headingId="contact-title" title={contact.title}>
          {contact.lead}
        </SectionHeading>

        <div className={styles.layout}>
          <Reveal variant="swing" className={styles.formWrap}>
            <Panel tone="white" shape="leaf" tape>
              <form ref={formRef} className={styles.form} onSubmit={submit} noValidate>
                <div className={styles.field}>
                  <label htmlFor={`${formId}-name`}>{contact.name}</label>
                  <input {...fieldProps('name')} type="text" autoComplete="name" maxLength={80} required />
                  {error('name')}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${formId}-email`}>{contact.email}</label>
                  <input {...fieldProps('email')} type="email" autoComplete="email" inputMode="email" required />
                  {error('email')}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${formId}-topic`}>{contact.topic}</label>
                  <select {...fieldProps('topic')} required>
                    <option value="">{contact.topicPlaceholder}</option>
                    {contactTopicIds.map((id) => (
                      <option key={id} value={id}>
                        {contact.topics[id]}
                      </option>
                    ))}
                  </select>
                  {error('topic')}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${formId}-message`}>{contact.message}</label>
                  <textarea {...fieldProps('message')} rows={6} maxLength={MESSAGE_MAX + 200} required />
                  <p className={styles.count} aria-hidden="true">
                    {form.message.trim().length} / {MESSAGE_MAX}
                  </p>
                  {error('message')}
                </div>

                <Button type="submit" variant="primary" size="lg" icon="send">
                  {contact.submit}
                </Button>

                <p className={styles.note} role="status">
                  {prepared ? contact.notePrepared : contact.noteIdle}
                </p>
              </form>
            </Panel>
          </Reveal>

          <Reveal variant="pop" delay={120} className={styles.side}>
            <Panel tone="sun" shape="ticket" tilt={1.5}>
              <h3 className={styles.sideTitle}>{contact.sideTitle}</h3>
              <p className={styles.address}>{email}</p>
              <Button variant="secondary" size="sm" icon="copy" onClick={copyEmail}>
                {contact.copyAddress}
              </Button>
              <p className={styles.sideNote}>{contact.sideNote}</p>
            </Panel>
            <p className={styles.fanNote}>
              <Icon name="heart" size={18} />
              {contact.fanNote}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
