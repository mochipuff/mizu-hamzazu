import type { SyntheticEvent } from 'react';
import { faqItems } from '../../data/content.ts';
import { gsap, prefersReducedMotion } from '../../lib/motion.ts';
import { Icon } from '../ui/Icon.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import styles from './Faq.module.css';

// The answer slides in each time its question opens.
const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
  const details = event.currentTarget;
  if (!details.open || prefersReducedMotion()) return;
  gsap.from(details.querySelector(`.${styles.answer}`), { opacity: 0, y: -6, duration: 0.3, ease: 'power1.out', clearProps: 'opacity,transform' });
};

export function Faq() {
  return (
    <section id="faq" className={styles.section} aria-labelledby="faq-title">
      <div className="container">
        <SectionHeading headingId="faq-title" title="Questions">
          Apa yang sering ditanyakan dan lainnya...
        </SectionHeading>

        <div className={styles.list}>
          {faqItems.map((item, index) => (
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
