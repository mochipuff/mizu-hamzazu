Here is a comprehensive architectural, SEO, performance, and code quality review of the **Mizu Hamzazu** landing page.

---

### Executive Verdict & Scorecard

| Category | Score | Summary |
|---|:---:|---|
| **Architecture & Code Quality** | **8.5 / 10** | Clean TypeScript, strict typing, isolated state, excellent GSAP motion scoping with reduced-motion support. |
| **SEO & Search Engine Dominance** | **6.5 / 10** | Strong schema.org foundations, but held back by title truncation, short meta descriptions, client-blocking loader, and empty client-side DOM. |
| **Performance & Core Web Vitals** | **6.0 / 10** | Artificial preloader blocks React mount with `await preloadCritical` up to 4s. High risk of poor LCP/FCP on Google Lighthouse. |
| **Localization & Internationalization** | **7.5 / 10** | Great message structure, but missing CJK/Japanese font subsets and Hangul fallbacks. |
| **Accessibility (WCAG 2.2 AA)** | **8.0 / 10** | Good semantics and ARIA live regions; minor touch-target and color-contrast issues on buttons/badges. |

---

### 1. Critical Bugs & Runtime Issues

#### 1.1. `TODO:` Email Leak in Contact Form and Mailto
In `src/config/site.ts`, `contactEmail` is set to `'TODO: business@mizu.id'`.
- In `Contact.tsx`, clicking submit triggers:
  ```ts
  window.location.href = buildMailto(site.contactEmail, form, topicLabel);
  ```
  This creates an invalid URL: `mailto:TODO:%20business@mizu.id?...`. When clicked, the user's OS mail client rejects the address as malformed.
- The UI renders `<p className={styles.address}>{site.contactEmail}</p>`, displaying the literal string `"TODO: business@mizu.id"`.
- `copyEmail()` copies the invalid `"TODO:"` string into the user's clipboard.

**Fix:** Strip `TODO:` or provide a guard before opening `mailto:` or copying:
```ts
export const getCleanEmail = (): string =>
  site.contactEmail.replace(/^TODO:\s*/i, '').trim();
```

#### 1.2. Missing Japanese & Korean Font Subsets
In `src/main.tsx`:
```ts
import '@fontsource/mochiy-pop-one/latin-400.css';
import '@fontsource/zen-maru-gothic/latin-500.css';
import '@fontsource/zen-maru-gothic/latin-700.css';
```
- Both *Mochiy Pop One* and *Zen Maru Gothic* are Japanese typefaces. Importing only the `latin-*.css` files means **Hiragana, Katakana, and Kanji are completely missing from the loaded font files**.
- On `/jp/`, Japanese text falls back to generic system fonts.
- On `/kr/`, neither font supports Hangul, but the CSS font stack lacks Korean system font fallbacks like `'Apple SD Gothic Neo'`, `'Malgun Gothic'`, or `'Pretendard'`.

**Fix:** Import the Japanese subsets in `main.tsx`:
```ts
import '@fontsource/mochiy-pop-one/japanese-400.css';
import '@fontsource/zen-maru-gothic/japanese-500.css';
import '@fontsource/zen-maru-gothic/japanese-700.css';
```
And add Korean font fallbacks in `src/styles/global.css`:
```css
--font-display: 'Mochiy Pop One', 'Zen Maru Gothic', 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', ui-rounded, system-ui, sans-serif;
--font-body: 'Zen Maru Gothic', 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', ui-rounded, system-ui, sans-serif;
```

#### 1.3. Drift in `useNow` Timer
In `src/hooks/useNow.ts`:
```ts
const scheduleTick = () => {
  timer = window.setTimeout(() => {
    currentTime = Date.now();
    listeners.forEach((notify) => notify());
    scheduleTick();
  }, MINUTE_MS - (Date.now() % MINUTE_MS));
};
```
Browsers don't guarantee exact millisecond precision. If `setTimeout` fires even 1ms early (e.g. at `:59.999`), `Date.now() % MINUTE_MS` will reschedule for `1ms`, firing double events or missing the minute transition.
**Fix:** Add a small 50ms buffer:
```ts
const remaining = MINUTE_MS - (Date.now() % MINUTE_MS) + 50;
timer = window.setTimeout(..., remaining);
```

---

### 2. SEO Masterplan: Getting to #1 on Search Engines

To rank #1 for **"Mizu Hamzazu"** and target related queries ("Mizu Hamzazu VTuber", "Mizu Hamzazu schedule", "VTuber Indonesia hamster"), address the following search signals:

#### 2.1. Critical Title & Meta Description Optimization
Search engines rely heavily on title tags and meta descriptions for ranking and CTR:
1. **Title in `messages/en.ts` is truncated/abbreviated:**
   `'Mizu Hamzazu | Indonesian VT'` &rarr; No one searches for `"Indonesian VT"`.
   **Change to:** `'Mizu Hamzazu 🐹 Official Website | Indonesian Hamster VTuber'`
2. **Meta descriptions are far too short (~40–68 chars):**
   Google snippets support up to ~155–160 characters. A 50-character description wastes keyword real estate.
   **Updated Meta Descriptions:**
   - **EN:** `Official site of Mizu Hamzazu, the Indonesian hamster VTuber! Check weekly stream schedules, free chat emotes, YouTube karaoke, gaming VODs, and join the Zutopian palace.`
   - **ID:** `Website resmi Mizu Hamzazu, VTuber hamster asal Indonesia! Temukan jadwal streaming mingguan, paket emote chat, karaoke, game santai, dan gabung komunitas Zutopian.`
   - **JP:** `インドネシアのハムスターVTuber「Mizu Hamzazu」公式サイト！配信スケジュール、エモート、歌枠、ゲーム配信情報、Zutopianコミュニティはこちら！`
   - **KR:** `인도네시아 햄스터 버튜버 Mizu Hamzazu의 공식 웹사이트! 주간 방송 스케줄, 이모티콘 팩, 노래 방송, 게임 VOD 및 Zutopian 팬 커뮤니티 안내.`

#### 2.2. Schema.org (JSON-LD) Entity Knowledge Graph Fixes
In `vite/seoPlugin.ts`:
```ts
affiliation: isFilled(t.profile.agency) ? { '@type': 'Organization', name: t.profile.agency } : undefined,
```
- Because `agency` is set to `"Independent"`, `"Independen"`, or `"個人勢"`, Schema.org outputs an organization entity named `"Independent"`. Google interprets this as Mizu being signed to an agency called "Independent", corrupting the Knowledge Graph.
- Add an explicit check:
```ts
const isIndependent = /^(independent|independen|個人勢|개인 활동)$/i.test(t.profile.agency.trim());
affiliation: isFilled(t.profile.agency) && !isIndependent
  ? { '@type': 'Organization', name: t.profile.agency }
  : undefined,
```

#### 2.3. BreadcrumbList Schema
Add `BreadcrumbList` to `buildJsonLd`:
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://mizu.id/en/" }
  ]
}
```
Google uses this to display breadcrumb navigation directly in SERP snippets.

#### 2.4. Server-Side 302/307 Redirect for `/` Instead of Client-Side JS
In `buildRootPage`, `/` serves an empty HTML file that runs a JavaScript `location.replace()`.
- Search engines that hit `https://mizu.id/` see a blank page with no content and a JS redirect, which can be flagged as a "Soft 404" or thin content.
- In `vercel.json`, handle the root redirect at the edge/CDN level using Vercel rewrites/redirects, or set `<link rel="canonical" href="https://mizu.id/en/">` on `/` so Google doesn't index `/` as a duplicate thin page.

---

### 3. Performance & Core Web Vitals (CWV)

#### 3.1. Elimination of the Blocking Top-Level `await preloadCritical`
In `src/main.tsx`:
```tsx
await preloadCritical(updateLoader);

createRoot(container).render(
  <StrictMode>
    <App initialLocale={resolveInitialLocale()} />
  </StrictMode>,
);

await hideLoader();
```
**Why this hurts Core Web Vitals (LCP & FCP):**
1. React will **not even start mounting** until 3 fonts and 4 WebP images finish downloading (or time out after 4,000ms).
2. The user sees a full-screen loading overlay. Google Lighthouse scores this as 0% progress on main content during that time.
3. Once assets resolve, React renders, then `await hideLoader()` waits another `450ms` before removing the overlay.

**Solution:**
Mount React **immediately** so the DOM tree hydrates right away. Let `preloadCritical` manage the visual fade of `#loader` without blocking React execution:

```tsx
// src/main.tsx
createRoot(container).render(
  <StrictMode>
    <App initialLocale={resolveInitialLocale()} />
  </StrictMode>,
);

preloadCritical(updateLoader).finally(() => {
  hideLoader();
});
```

#### 3.2. Responsive Preloads in `seoPlugin.ts`
In `seoPlugin.ts`:
```ts
...images.map((href) => ({
  tag: 'link',
  attrs: { rel: 'preload', as: 'image', type: 'image/webp', href, fetchpriority: 'high' },
  injectTo: 'head'
}))
```
Preloading 4 images simultaneously over mobile networks can saturate bandwidth and delay critical CSS. Only the primary hero image/wheel art should have `fetchpriority="high"`.

---

### 4. Accessibility (a11y) & UX Polish

1. **Touch Target Size for Calendar Buttons:**
   In `src/components/sections/Schedule.module.css`:
   ```css
   .calendarButton {
     width: 2.2rem;
     height: 2.2rem; /* ~35px */
   }
   ```
   WCAG 2.5.5 and mobile search engine audits require target sizes of at least **44x44px** (or 48x48px on Android).
   **Fix:** Increase dimensions:
   ```css
   .calendarButton {
     width: 2.75rem;
     height: 2.75rem;
   }
   ```

2. **Residual Color Inconsistency (`#16245f` Navy Artifacts):**
   Several files contain hardcoded `rgb(22 36 95 / 0.3)` and `#16245f` (a deep navy blue) instead of the theme color `--ink` (`#373332`):
   - `About.module.css`: `border-bottom: 2px dashed rgb(22 36 95 / 0.3);`
   - `Schedule.module.css`: `border-bottom: 2px dashed rgb(22 36 95 / 0.3);`
   - `Contact.module.css`: inline select SVG arrow has `stroke='%2316245f'`.
   - `Schedule.module.css`: inline select SVG arrow has `stroke='%2316245f'`.
   - `Panel.module.css`: `.tape::before` uses `rgb(22 36 95 / 0.18)`.
   **Fix:** Replace with `color-mix(in srgb, var(--ink) 30%, transparent)` or `%23373332` for consistent branding.

3. **Color Contrast:**
   `.time { color: var(--ink-soft); }` on `.event[data-status='live']` (`#f6ddb8`) produces a contrast ratio around ~3.6:1, below the 4.5:1 requirement for small text. Changing text inside live status cards to `var(--ink)` restores full WCAG AA compliance.

---

### 5. Implementation Patches

#### Patch 1: Non-blocking Preloader (`src/main.tsx`)
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/mochiy-pop-one/latin-400.css';
import '@fontsource/mochiy-pop-one/japanese-400.css';
import '@fontsource/zen-maru-gothic/latin-500.css';
import '@fontsource/zen-maru-gothic/japanese-500.css';
import '@fontsource/zen-maru-gothic/latin-700.css';
import '@fontsource/zen-maru-gothic/japanese-700.css';
import './styles/global.css';
import { App } from './App.tsx';
import { resolveInitialLocale } from './i18n/initial.ts';
import { hideLoader, updateLoader } from './lib/loader.ts';
import { preloadCritical } from './lib/preload.ts';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found.');

createRoot(container).render(
  <StrictMode>
    <App initialLocale={resolveInitialLocale()} />
  </StrictMode>,
);

void preloadCritical(updateLoader).finally(() => {
  void hideLoader();
});
```

#### Patch 2: Sanitized Contact Email (`src/components/sections/Contact.tsx`)
```tsx
// Inside Contact.tsx
const cleanEmail = site.contactEmail.replace(/^TODO:\s*/i, '').trim();

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
  const topicId = contactTopicIds.find((id) => id === form.topic);
  const topicLabel = topicId ? messages.en.contact.topics[topicId] : form.topic;
  window.location.href = buildMailto(cleanEmail, form, topicLabel);
};

const copyEmail = async () => {
  const ok = await copyText(cleanEmail);
  if (ok) sound.play('copy');
  toast.notify(ok ? contact.emailCopied : t.common.copyBlocked);
};
```

#### Patch 3: Schema Knowledge Graph Agency Fix (`vite/seoPlugin.ts`)
```ts
const isIndependent = /^(independent|independen|個人勢|개인 활동)$/i.test(t.profile.agency.trim());

const person = compact({
  '@type': 'Person',
  '@id': id('person'),
  name: site.name,
  alternateName: publishable(profile.alternateNames),
  description: t.profile.bio,
  jobTitle: t.profile.jobTitle,
  nationality: { '@type': 'Country', name: t.profile.nationality },
  height: { '@type': 'QuantitativeValue', value: profile.heightCm, unitCode: 'CMT' },
  knowsAbout: t.profile.topics,
  knowsLanguage: ['id', 'en'],
  affiliation: isFilled(t.profile.agency) && !isIndependent
    ? { '@type': 'Organization', name: t.profile.agency }
    : undefined,
  sameAs: profileUrls(),
  url: siteUrl ? url : undefined,
  image,
});
```

Applying these optimizations will eliminate asset-loading bottlenecks, ensure proper multilingual typography, improve Core Web Vitals metrics, and strengthen Google Knowledge Graph signals to help the site achieve top search rankings.