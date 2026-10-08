import type { SyntheticEvent } from 'react';
import { useI18n } from '../../i18n/i18n.ts';
import { gsap, prefersReducedMotion } from '../../lib/motion.ts';
import { Icon } from '../ui/Icon.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import styles from './Faq.module.css';

const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
  const details = event.currentTarget;
  if (!details.open || prefersReducedMotion()) return;
  gsap.from(details.querySelector(`.${styles.answer}`), { opacity: 0, y: -6, duration: 0.3, ease: 'power1.out', clearProps: 'opacity,transform' });
};

export function Faq() {
  const { t } = useI18n();

  return (
    <section id="faq" className={styles.section} aria-labelledby="faq-title">
      <div className="container">
        <SectionHeading headingId="faq-title" title={t.faq.title}>
          {t.faq.lead}
        </SectionHeading>

        <div className={styles.list}>
          {t.faq.items.map((item, index) => (
            <Reveal key={item.question} variant="pop" delay={Math.min(index, 3) * 70}>
              <details className={styles.item} name="faq" onToggle={handleToggle}>
                <summary className={styles.question}>
                  <span>{item.question}</span>
                  <span className={styles.toggle} aria-hidden="true">
                    <Icon name="plus" size={20} />
                  </span>
                </summary>
                <div className={styles.answer}>
                  <p>{item.answer}</p>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
