import { dislikes, likes, lore, profileFacts } from '../../data/content.ts';
import { streamTypes } from '../../data/streams.ts';
import { emotePng } from '../../lib/assets.ts';
import { Paw } from '../ui/Doodles.tsx';
import { Panel } from '../ui/Panel.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import styles from './About.module.css';

const STREAM_TILTS = [-1.2, 0, 1.2] as const;

export function About() {
  return (
    <section id="about" className={styles.section} aria-labelledby="about-title">
      <div className="container">
        <SectionHeading headingId="about-title" title="Meet Mizu">
          Know me better...
        </SectionHeading>

        <div className={styles.layout}>
          <Reveal variant="swing" className={styles.story}>
            <Panel tone="white" shape="leaf" tape>
              <h3 className={styles.storyTitle}>About</h3>
              {lore.map((paragraph) => (
                <p key={paragraph} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
            </Panel>
          </Reveal>

          <Reveal variant="pop" delay={120} className={styles.profile}>
            <Panel tone="sun" shape="ticket" tilt={1.5}>
              <h3 className={styles.profileTitle}>Profile</h3>
              <dl className={styles.facts}>
                {profileFacts.map((fact) => (
                  <div key={fact.label} className={styles.fact}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </Reveal>

          <Reveal variant="drop" delay={80} className={styles.likes}>
            <Panel tone="mint" shape="soft">
              <h3 className={styles.listTitle}>
                <Paw className={styles.listIcon} color="var(--lagoon)" />
                Likes
              </h3>
              <ul className={styles.list}>
                {likes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Panel>
          </Reveal>

          <Reveal variant="drop" delay={200} className={styles.dislikes}>
            <Panel tone="pink" shape="soft">
              <h3 className={styles.listTitle}>
                <Paw className={styles.listIcon} color="var(--rust)" />
                Not so much
              </h3>
              <ul className={styles.list}>
                {dislikes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Panel>
          </Reveal>
        </div>

        <div className={styles.streams}>
          <h3 className={styles.streamsTitle}>What she streams</h3>
          <ul className={styles.streamGrid}>
            {streamTypes.map((type, index) => (
              <li key={type.title}>
                <Reveal variant="pop" delay={index * 110} className={styles.streamReveal}>
                  <Panel tone={index === 1 ? 'lilac' : 'white'} tilt={STREAM_TILTS[index] ?? 0} className={styles.streamCard} garland={index % 2 === 0 ? 'top-right' : 'top-left'}>
                    <img
                      className={styles.streamFace}
                      src={emotePng(type.emote)}
                      alt={`${type.emote} emote for ${type.title}`}
                      width={512}
                      height={512}
                      decoding="async"
                      draggable={false}
                    />
                    <h4 className={styles.streamName}>{type.title}</h4>
                    <p>{type.description}</p>
                  </Panel>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
