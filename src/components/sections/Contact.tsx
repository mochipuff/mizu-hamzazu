import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { site } from '../../config/site.ts';
import { useSound } from '../../context/sound.ts';
import { useToast } from '../../context/toast.ts';
import { contactTopics } from '../../data/content.ts';
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

export function Contact() {
  const toast = useToast();
  const sound = useSound();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<ContactInput>(emptyForm);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [prepared, setPrepared] = useState(false);

  const update = (field: keyof ContactInput) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setPrepared(false);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateContact(form);
    setErrors(found);

    if (hasErrors(found)) {
      const first = FIELD_ORDER.find((field) => found[field]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    sound.play('sparkle');
    setPrepared(true);
    window.location.href = buildMailto(site.contactEmail, form);
  };

  const copyEmail = async () => {
    const ok = await copyText(site.contactEmail);
    if (ok) sound.play('copy');
    toast.notify(ok ? 'Email address copied.' : 'Copy is blocked in this browser.');
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
        <SectionHeading headingId="contact-title" title="Get in touch">
          Business and collaboration enquiries only. For everything else, chat on stream is the fastest way to reach Mizu.
        </SectionHeading>

        <div className={styles.layout}>
          <Reveal variant="swing" className={styles.formWrap}>
            <Panel tone="white" shape="leaf" tape>
              <form ref={formRef} className={styles.form} onSubmit={submit} noValidate>
                <div className={styles.field}>
                  <label htmlFor={`${formId}-name`}>Your name</label>
                  <input {...fieldProps('name')} type="text" autoComplete="name" maxLength={80} required />
                  {error('name')}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${formId}-email`}>Your email</label>
                  <input {...fieldProps('email')} type="email" autoComplete="email" inputMode="email" required />
                  {error('email')}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${formId}-topic`}>Topic</label>
                  <select {...fieldProps('topic')} required>
                    <option value="">Choose one</option>
                    {contactTopics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                  {error('topic')}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${formId}-message`}>Message</label>
                  <textarea {...fieldProps('message')} rows={6} maxLength={MESSAGE_MAX + 200} required />
                  <p className={styles.count} aria-hidden="true">
                    {form.message.trim().length} / {MESSAGE_MAX}
                  </p>
                  {error('message')}
                </div>

                <Button type="submit" variant="primary" size="lg" icon="send">
                  Write the email
                </Button>

                <p className={styles.note} role="status">
                  {prepared
                    ? 'Your email app should be opening with the message ready to send. If nothing happened, copy the address and write to us directly.'
                    : 'This opens your email app with the message filled in. Nothing is sent until you press send there.'}
                </p>
              </form>
            </Panel>
          </Reveal>

          <Reveal variant="pop" delay={120} className={styles.side}>
            <Panel tone="sun" shape="ticket" tilt={1.5}>
              <h3 className={styles.sideTitle}>Prefer to write directly?</h3>
              <p className={styles.address}>{site.contactEmail}</p>
              <Button variant="secondary" size="sm" icon="copy" onClick={copyEmail}>
                Copy address
              </Button>
              <p className={styles.sideNote}>Please include links to your channel or company. Replies can take a few days.</p>
            </Panel>
            <p className={styles.fanNote}>
              <Icon name="heart" size={18} />
              Fan art, clips and messages for Mizu belong on stream and on X, not in this inbox.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
