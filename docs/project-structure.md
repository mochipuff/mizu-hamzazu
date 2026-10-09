# System Context & Architecture: `mizu-hamzazu`

## 1. Executive Summary & Architectural Paradigm

`mizu-hamzazu` is a high-performance, single-page application (SPA) with static-site generation (SSG) hybrid characteristics, built for the virtual streamer **Mizu Hamzazu**.

* **Core Stack:** React 19, TypeScript (target ES2023, strict mode), Vite 8 (using Rolldown and LightningCSS), GSAP 3 with ScrollTrigger.
* **Routing & Localisation:** Every page exists once per language: `/<locale>/` (home) and `/<locale>/supports/` for `en`, `jp`, `id`, `kr`. A path without a language (`/`, `/supports/`) is a small redirect page. `src/i18n/pages.ts` lists the pages and their URLs; add a page there, then in `pages` of `src/App.tsx`. The URL is the single source of truth for the language: `src/i18n/navigation.ts` reads it through `useSyncExternalStore` and changes it with the History API (`pushState`/`popstate`), without page reloads.
* **Build-Time Metaprogramming:** A proprietary Vite plugin (`vite/seoPlugin.ts`) compiles distinct static HTML landing pages per language, outputs localized `llms.txt`, generates `robots.txt` with AI crawler rules, dynamically constructs `sitemap.xml`, and emits structured Schema.org JSON-LD and zero-JS `<noscript>` fallbacks.
* **Asset & Audio Engineering:** Synthesizes sound effects entirely via the browser's native **Web Audio API** (zero external audio payload). Critical above-the-fold assets and web fonts are preloaded before initial paint to eliminate layout shifts and hydration jumps.

---

## 2. Directory Tree & File Breakdown

```text
├── index.html                     # Root HTML template with critical inline loader CSS and injection markers
├── package.json                   # Dependency definitions, engine constraints (>=20.19.0), npm scripts
├── tsconfig.json                  # Root TypeScript configuration with project references
├── tsconfig.app.json              # Client-side React compiler options (strict, bundler module resolution)
├── tsconfig.node.json             # Build tool/Node environment compiler options
├── vercel.json                    # Vite framework preset, CDN edge caching, security headers
├── .vercelignore                  # Keeps the Python test server out of the Vercel deployment
├── requirements.txt               # Python deps for the local gzip test server only (starlette, uvicorn)
├── vite.config.ts                 # Vite bundle configuration and SEO plugin registration
│
├── public/                        # Static assets served as-is (images are supplied by you and are not in git)
│   ├── favicon.svg                # Vector site icon
│   ├── favicon-32.png             # Bitmap fallback icon
│   ├── apple-touch-icon.png       # Apple device icon
│   ├── manifest.webmanifest       # PWA metadata configuration
│   └── og-image.png               # Social share preview card (1200x630)
│
├── server/                        # Local production-build server (not deployed)
│   └── app.py                     # Starlette app for `uvicorn server.app:app`: serves dist/ and sends the prebuilt .gz files
│
├── vite/                          # Vite custom build plugins
│   ├── seoPlugin.ts               # Multi-locale HTML compiler, sitemap, llms.txt, & JSON-LD generator; also writes the language redirect page (`/`)
│   └── gzipPlugin.ts              # Writes <file>.gz beside every text file in dist/ (skipped on Vercel)
│
└── src/                           # Application source code
    ├── main.tsx                   # Critical preload orchestration, React 19 root mounting, hydration
    ├── App.tsx                    # Providers composition and the shared layout: header, home page, footer
    │
    ├── config/                    # Global immutable configurations
    │   └── site.ts                # Streamer profile, platform links, hashtags, social URLs, site metadata
    │
    ├── context/                   # React Context and State Providers
    │   ├── sound.ts               # SoundContext API interface and hook definition
    │   ├── SoundProvider.tsx      # Web Audio activation, mute state persistence, and SFX dispatcher
    │   ├── toast.ts               # ToastContext API interface and hook definition
    │   ├── ToastProvider.tsx      # Temporary notification queue and lifecycle dispatcher
    │   └── ToastProvider.module.css # Toast positioning and container styling
    │
    ├── data/                      # Structured domain content and data models
    │   ├── supports.ts            # Top donations and viewer notes (sample data for now), support links
    │   ├── content.ts             # Navigation IDs, profile fact formatters, perk definitions
    │   ├── criticalImages.ts      # First-paint images (loader waits for them, build preloads them)
    │   ├── emotes.ts              # Emote identifiers and typed union definitions
    │   ├── hero.ts                # Hero scene asset bindings and reaction mood maps
    │   ├── membership.ts          # Membership tier definitions and badge asset mappers
    │   ├── schedule.ts            # Fixed schedule slots, localized descriptions, YouTube metadata
    │   └── streams.ts             # Content stream categories (Games, Karaoke, Freetalk)
    │
    ├── hooks/                     # Custom React lifecycle and reactive primitives
    │   ├── useGsap.ts             # Scoped GSAP lifecycle management respecting prefers-reduced-motion
    │   ├── useKonami.ts           # Keyboard sequence listener for easter egg triggers
    │   ├── useLocalStorage.ts     # Synchronized localStorage state wrapper with JSON serialization
    │   ├── useNow.ts              # Global time ticker synchronizing once per minute via useSyncExternalStore
    │   ├── useOutsidePointerDown.ts # Calls back when a press lands outside an element (menus)
    │   └── useScrollSpy.ts        # IntersectionObserver-based active section detector
    │
    ├── i18n/                      # Internationalization Subsystem
    │   ├── pages.ts               # Page list, pagePath() / pageFromPath(): the one place that knows page URLs
    │   ├── detect.ts              # Pathname and navigator.languages subtag matchers
    │   ├── i18n.ts                # I18nContext API interface and useI18n hook
    │   ├── I18nProvider.tsx       # Locale provider (locale comes from the URL), document lang/title/meta updates
    │   ├── initial.ts             # Initial locale resolution engine (URL > Storage > Browser > Fallback)
    │   ├── locales.ts             # Locale constants, BCP 47 mapping, and OG locale metadata
    │   ├── navigation.ts          # usePathname() and navigate() on top of the History API
    │   ├── types.ts               # Compile-time inferred message type structure derived from en.ts
    │   └── messages/
    │       ├── index.ts           # Locale dictionary registry map
    │       ├── en.ts              # English source of truth (determines type schema)
    │       ├── id.ts              # Indonesian translations
    │       ├── jp.ts              # Japanese translations
    │       └── kr.ts              # Korean translations
    │
    ├── pages/                     # What fills the space between the shared header and footer
    │   ├── HomePage.tsx           # The landing page sections
    │   └── SupportsPage.tsx       # /supports: cover, top 10 donations, viewer notes
    │
    ├── lib/                       # Pure utilities, domain algorithms, and low-level helpers
    │   ├── assets.ts              # Typed path resolution for generated WebP assets
    │   ├── audio.ts               # Custom Web Audio API synthesizer (sine/triangle oscillator ramps)
    │   ├── clipboard.ts           # Modern navigator.clipboard wrapper with textarea fallback
    │   ├── download.ts            # Client-side Blob download trigger utility
    │   ├── events.ts              # Custom window Event dispatcher for cross-component triggers
    │   ├── ics.ts                 # RFC 5545 iCalendar format generator with 75-byte line-folding
    │   ├── loader.ts              # DOM-level critical loading screen controller
    │   ├── math.ts                # Deterministic PRNG and range interpolation helpers
    │   ├── motion.ts              # GSAP plugin initialization and standard easing curves
    │   ├── preload.ts             # Font and above-the-fold image preloader (waits for decode) with timeout guards
    │   └── schedule.ts            # Timezone-aware date arithmetic, occurrence and week column calculator
    │
    ├── styles/                    # Global styles and design system variables
    │   └── global.css             # Design tokens, color palette, typography definitions, reset
    │
    └── components/                # React Presentational and Interactive Components
        ├── character/             # Interactive character canvas/scene
        │   ├── HamsterWheelScene.tsx        # Interactive SVG/WebP character with rotational physics
        │   └── HamsterWheelScene.module.css # Wheel transforms, speech bubble, and ripple styles
        ├── layout/                # Persistent page framing
        │   ├── Header.tsx                   # Sticky responsive header with scroll detection and a plain anchor nav
        │   ├── Header.module.css
        │   ├── Footer.tsx                   # Responsive footer with social links and copyright
        │   ├── Footer.module.css
        │   └── LanguageSelect.tsx           # Locale switcher: a Dropdown with the globe icon
        ├── sections/              # Page content sections
        │   ├── Hero.tsx                     # Landing hero with next stream countdown
        │   ├── Hero.module.css
        │   ├── About.tsx                    # Bio, character lore, profile stats, stream genres
        │   ├── About.module.css
        │   ├── Schedule.tsx                 # Interactive week schedule: timezone Dropdown, day cards sized by their content
        │   ├── Schedule.module.css
        │   ├── StreamCard.tsx               # One stream of a day: thumbnail, time, status, watch and calendar buttons, "live ended" effect
        │   ├── Emotes.tsx                   # Emote gallery with one-click code copy
        │   ├── Emotes.module.css
        │   ├── Join.tsx                     # Membership perks, tier badges, community links
        │   ├── Join.module.css
        │   ├── Faq.tsx                      # Accordion FAQ powered by semantic HTML <details>
        │   ├── Faq.module.css
        │   ├── SupportsCover.tsx            # /supports cover: ribbon label, title, thank-you note, support links, loose stickers
        │   ├── TopDonations.tsx             # Top 10 donations: polaroid podium for 1 to 3, paper tickets for 4 to 10
        │   └── ViewerNotes.tsx              # Wall of sticky notes, index cards and scraps, plus a note inviting new ones
        └── ui/                    # Reusable, design-system primitives
            ├── AmbientSeeds.tsx             # Canvas-free falling background seeds, one small <Seed> component per seed
            ├── AmbientSeeds.module.css
            ├── Button.tsx                   # Standardized accessible button and link variants
            ├── Button.module.css
            ├── Link.tsx                     # Internal link that changes page without a reload
            ├── Paper.tsx                    # Scrapbook paper: tone, ruled/dots/gingham, torn edge, washi tape
            ├── Stickers.tsx                 # Die-cut SVG stickers: Heart, Star, Crown, Bow, Flower, Burst
            ├── Dropdown.tsx                 # Custom div-based select (combobox + listbox): keyboard, type-ahead, outside click (useOutsidePointerDown)
            ├── Dropdown.module.css
            ├── Doodles.tsx                  # Hand-drawn decorative SVG vectors (Paw, Sparkle, Clover, Branch)
            ├── FloatingBadges.tsx           # Floating membership badge cluster with bobbing motion
            ├── FloatingBadges.module.css
            ├── Garland.tsx                  # Decorative leaf garland corner adornment
            ├── Garland.module.css
            ├── Icon.tsx                     # Lightweight inline SVG icon library
            ├── KonamiStorm.tsx              # Easter egg observer triggering seed bursts
            ├── Marquee.tsx                  # Continuous hardware-accelerated ticker tape
            ├── Marquee.module.css
            ├── Panel.tsx                    # Textured card container with custom borders and shapes
            ├── Panel.module.css
            ├── platformIcon.ts              # Platform-to-icon mapping lookup
            ├── Reveal.tsx                   # Scroll-triggered entrance animation wrapper
            ├── SectionHeading.tsx           # Section header with decorative SVG sidepins
            ├── SectionHeading.module.css
            ├── StreamDecor.tsx              # Animated retro TV doodle with signal scanlines
            ├── StreamDecor.module.css
            ├── WaveDivider.tsx              # Infinitely moving dual-layered SVG wave divider
            └── WaveDivider.module.css
```

---

## 3. Subsystem Deep Dive & Technical Implementation

### A. Static SEO & Multi-Locale Compilation (`vite/seoPlugin.ts`)
The application executes a unique hybrid build approach:
1. **Template Parsing (`index.html`):** The root HTML contains `<!--locale-head-->` and `<!--locale-noscript-->` markers, as well as template strings `{{htmlLang}}`, `{{loaderTitle}}`, `{{loaderNote}}`, and `{{loaderProgress}}`.
2. **Bundle Phase (`generateBundle`):**
   * Emits `robots.txt` dynamically allowing or blocking specific AI crawlers (`GPTBot`, `ClaudeBot`, `PerplexityBot`, etc.) according to `site.seo.allowAiCrawlers`.
   * Generates localized `llms.txt` documents providing concise context for LLMs and AI search engines.
   * Compiles an XML sitemap (`sitemap.xml`) with every language, `xhtml:link` hreflang alternates, `x-default`, and media entries.
3. **Output Emission (`closeBundle`):**
   * Takes the compiled `dist/index.html` as a template.
   * Generates one file per language: `/en/index.html`, `/jp/index.html`, `/id/index.html`, `/kr/index.html`, each with its own title, metadata, hreflang, image preloads, and the full Person/FAQ structured data graph.
   * Replaces root `dist/index.html` with a standalone vanilla JS redirector that evaluates `localStorage` -> `navigator.languages` -> fallback default (`en`) before redirecting via `location.replace()`.

### B. Internationalization (i18n) Architecture
* **Single Source of Truth:** `src/i18n/messages/en.ts` is the master translation dictionary.
* **Type Invariance:** `src/i18n/types.ts` computes `Messages = Widen<typeof en>`. Any added, deleted, or altered translation key in `en.ts` instantly raises a TypeScript compilation error across `jp.ts`, `id.ts`, and `kr.ts`.
* **Interpolation via Closures:** Dynamic strings are written as pure functions (e.g., `(name: string) => string`) to respect varying language syntax and grammar word order.
* **In-Memory Locale Switching:** The `I18nProvider` derives the locale from the URL, so a language switch is just `navigate()` to the same address in another language. It syncs `<html lang="...">`, the document `<title>` and `<meta name="description">`, without hitting the network.

### B2. Routing (`src/i18n/navigation.ts`)
* **One page:** the site is a single landing page per language. There is no page registry; `App.tsx` renders the header, `HomePage` and the footer.
* **Links:** navigation inside the page is plain anchors (`#about`, `#top`), so open-in-new-tab, copy link and crawlers work and the browser keeps the smooth scrolling. Only the language menu calls `navigate()`.
* **Removed pages:** the old `/milestones/` and `/<locale>/milestones/` addresses are permanent redirects to the home page in `vercel.json`.
* **Adding a page later:** give it its own folder in `src/pages/`, make the URL carry a page again (the language code stays the first segment), and teach `vite/seoPlugin.ts` to write one file per page and language. Git history before this change has a working version of that registry.

### C. Web Audio Synthesis Engine (`src/lib/audio.ts`)
The project achieves zero network overhead for sound effects by generating audio entirely through procedural synthesis:
* Initializes an `AudioContext` lazily on first user interaction to comply with browser autoplay policies (`unlockAudio`).
* Synthesizes audio using custom exponential gain and frequency ramps:
  * **`bloop`:** Sine oscillator sweeping from 300Hz to 820Hz over 160ms.
  * **`pop`:** Triangle oscillator dropping sharply from 920Hz to 260Hz.
  * **`gold` / `sparkle`:** Multi-step arpeggios constructed using staggered micro-delays on musical frequencies (e.g., A5, C#6, E6, A6).
  * **`toggle` / `copy`:** Snappy dual-tone confirmation chimes.

### D. Timezone & Schedule Processing Engine (`src/lib/schedule.ts` & `src/lib/ics.ts`)
* **Timezone Arithmetic:** Avoids external heavy date libraries (e.g., `moment` or `date-fns`) by leveraging the native `Intl.DateTimeFormat` API with `formatToParts`.
* **Wall-Clock Translation:** Slots are declared in the streamer's base timezone (`Asia/Jakarta`, UTC+7). The engine calculates offsets and translates future stream instances to any target IANA timezone selected by the user.
* **RFC 5545 iCalendar Generator (`src/lib/ics.ts`):** 
  * Generates native `.ics` files client-side.
  * Enforces the RFC 5545 requirement of **75-byte line-folding** (breaking multibyte UTF-8 characters across lines safely with leading spaces).
  * Includes recurrence rules (`RRULE:FREQ=WEEKLY`) and local alarm triggers (`TRIGGER:-PT15M`).

### E. Motion & Performance Architecture (`src/lib/motion.ts` & `src/hooks/useGsap.ts`)
* **Reduced Motion Compliance:** Animations run exclusively within `useGsap` wrappers mapped to `(prefers-reduced-motion: no-preference)`. When reduced motion is requested, GSAP scripts do not execute, and the UI immediately renders in its final resting state via CSS fallbacks.
* **Component-Scoped MatchMedia:** Ensures all GSAP tweens, timelines, and ScrollTrigger instances are garbage-collected and killed on component unmount via `mm.revert()`.
* **Off-Thread CSS Animations:** Continuous background visual tasks (such as scroll-driven opacity veils, loader striping, and marquee translation) are executed on the browser compositor thread via native CSS `@keyframes` and modern CSS features (`animation-timeline: scroll()`).

### F. Critical Rendering Path & Loader Lifecycle
1. **Critical CSS & Inline Markup:** Critical styles for `#loader` are embedded inside `index.html`'s `<style>` block.
2. **Preload Phase (`src/lib/preload.ts`):** React mounts immediately behind the loader (it is never blocked by assets). Meanwhile the application waits for `@font-face` definitions to load via `document.fonts.load()` alongside the critical above-the-fold images (`src/data/criticalImages.ts`), which are downloaded *and decoded* (`HTMLImageElement.decode()`) so they paint the moment the loader fades.
3. **Safety Timeout:** A hard 4,000ms timeout prevents network failures from locking the loading screen indefinitely; a file that fails counts as done and its timer is cleared once preloading settles.
4. **Reveal:** once preloading settles, `src/main.tsx` calls `hideLoader()`, which fades the loader overlay using GSAP before purging the DOM node.

---

## 4. Key Data Invariants & Coding Guidelines for AI Agents

1. **Translations:** Do not modify `src/i18n/messages/{id,jp,kr}.ts` without updating `src/i18n/messages/en.ts` first. The type system relies on `en.ts` as the schema master.
2. **TODO Placeholders:** Fields in `src/config/site.ts` prefixed with `"TODO"` (e.g., `"TODO: ..."` ) are programmatically excluded from public display, structured JSON-LD schemas, and `llms.txt`. Do not remove the `isFilled()` check when rendering profile data. `profile.independent` keeps an agency-less creator out of the JSON-LD `affiliation`.
3. **Motion Safety:** Never execute raw `gsap.to()` or `gsap.from()` inside React `useEffect` without wrapping it inside `useGsap` or verifying `prefersReducedMotion()`.
4. **Styling Paradigm:** Prefer CSS Modules (`*.module.css`) for component styling. Leverage global variables defined in `src/styles/global.css` (e.g., `var(--ink)`, `var(--sun)`, `var(--pop)`). Do not hardcode hex values inside component modules.
5. **Fonts:** only the Latin subsets are bundled on purpose (the Japanese subsets are 1 to 1.5 MB each, or hundreds of CSS rules when sliced). Kana, kanji and Hangul render with the system fonts in `--font-cjk-fallback` (`global.css`).
6. **Dropdowns:** never use a native `<select>`. Use `src/components/ui/Dropdown.tsx` (`variant="pill"` for the header, `"field"` for forms) so every list looks the same and keeps its icon. Outside-press handling goes through `src/hooks/useOutsidePointerDown.ts`.
7. **Compression:** `npm run build` writes `.gz` files next to text assets (`vite/gzipPlugin.ts`) for `server/app.py`. Vercel compresses on its own, so nothing there depends on them. If you add a text file type to `dist/`, add its extension to `COMPRESSIBLE` in the plugin.
8. **Asset Pipeline:** WebP images in `/public` are generated from source PNGs via `npm run images`. When referencing internal assets, use helper functions from `src/lib/assets.ts` (`emoteUrl`, `heroUrl`, `membershipBadgeUrl`).
9. **Naming:** event handlers start with `handle` (`handleCopy`, `handleScroll`), and platforms are looked up with `getPlatform()` from `src/config/site.ts` instead of searching `site.platforms` again.