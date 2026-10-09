### 1. Analisis Arsitektur Sistem

Aplikasi ini mengadopsi pola **Hybrid Static SPA**:
1. **Routing & I18n Terpadu:** Tidak menggunakan routing library eksternal (seperti `react-router`). URL path (`/:locale/:page/`) adalah *single source of truth*. Komunikasi state URL menggunakan `useSyncExternalStore` yang mendengarkan event native browser (`popstate`) dan custom event (`mizu:navigate`).
2. **Build-Time SSG & Metaprogramming (`vite/seoPlugin.ts`):** 
   - Template root `index.html` dikompilasi menjadi halaman HTML statis per bahasa (`/en/`, `/jp/`, `/id/`, `/kr/`) lengkap dengan meta tags, hreflang, Open Graph, Breadcrumb/Person JSON-LD, image preloads, dan `<noscript>` fallback.
   - Root `/` dikompilasi menjadi halaman redirector ringan via client script yang membaca `localStorage` dan preferensi bahasa browser sebelum me-redirect.
3. **Audio Sintetik Tanpa Aset (`src/lib/audio.ts`):** Sound Effect (SFX) disintesis penuh via **Web Audio API** menggunakan oscillator (`sine`/`triangle`) dan gain ramps dinamis (0 byte overhead aset audio).
4. **Motion Orchestration (`src/lib/motion.ts`, `useGsap`):** GSAP 3 + ScrollTrigger yang terisolasi dan sadar preferensi aksesibilitas (`prefers-reduced-motion`).
5. **Type Invariance:** Dictionary bahasa Inggris (`src/i18n/messages/en.ts`) bertindak sebagai *master schema*. Tipe TypeScript diderivasi secara ketat (`Messages = Widen<typeof en>`), memastikan penambahan atau pengubahan key langsung memicu type error di translasi lain (`id`, `jp`, `kr`).

---

### 2. Visualisasi Knowledge Graph (Arsitektur & Aliran Dependensi)

```mermaid
graph TD
    %% Global Build & Config Layer
    subgraph Build_Config ["1. Build, Compiler & Config Layer"]
        IndexHTML["index.html"]
        ViteConfig["vite.config.ts"]
        SeoPlugin["vite/seoPlugin.ts"]
        GzipPlugin["vite/gzipPlugin.ts"]
        SiteConfig["src/config/site.ts"]
    end

    %% I18n & Navigation Subsystem
    subgraph I18n_Subsystem ["2. i18n & Navigation Subsystem"]
        I18nTypes["src/i18n/types.ts"]
        Locales["src/i18n/locales.ts"]
        Detect["src/i18n/detect.ts"]
        Initial["src/i18n/initial.ts"]
        PagesConfig["src/i18n/pages.ts"]
        NavEngine["src/i18n/navigation.ts"]
        MessagesEN["messages/en.ts (Master)"]
        MessagesID["messages/id.ts"]
        MessagesJP["messages/jp.ts"]
        MessagesKR["messages/kr.ts"]
        MessagesIndex["messages/index.ts"]
        I18nProvider["src/i18n/I18nProvider.tsx"]
        UseI18n["src/i18n/i18n.ts"]
    end

    %% State & Context Layer
    subgraph State_Context ["3. Reactive Primitives & Context Providers"]
        SoundCtx["context/sound.ts & SoundProvider.tsx"]
        ToastCtx["context/toast.ts & ToastProvider.tsx"]
        UseNow["hooks/useNow.ts (Ticker)"]
        UseGsap["hooks/useGsap.ts"]
        UseOutside["hooks/useOutsidePointerDown.ts"]
        UseScrollSpy["hooks/useScrollSpy.ts"]
        UseKonami["hooks/useKonami.ts"]
    end

    %% Domain Data & Core Engines
    subgraph Data_Engines ["4. Domain Data & Pure Utilities"]
        AudioEngine["lib/audio.ts (Web Audio)"]
        ScheduleEngine["lib/schedule.ts & ics.ts"]
        MotionEngine["lib/motion.ts (GSAP)"]
        PreloadEngine["lib/preload.ts & loader.ts"]
        ContentData["data/content.ts"]
        ScheduleData["data/schedule.ts"]
        EmotesData["data/emotes.ts"]
        HeroData["data/hero.ts"]
        SupportsData["data/supports.ts"]
    end

    %% Entry & Shell
    subgraph Entry_Shell ["5. App Shell & Layout"]
        MainTSX["src/main.tsx"]
        AppTSX["src/App.tsx"]
        Header["components/layout/Header.tsx"]
        Footer["components/layout/Footer.tsx"]
        LangSelect["components/layout/LanguageSelect.tsx"]
    end

    %% Pages & Sections
    subgraph Pages_Sections ["6. Pages & Content Sections"]
        HomePage["pages/HomePage.tsx"]
        SupportsPage["pages/SupportsPage.tsx"]
        HeroSec["sections/Hero.tsx"]
        AboutSec["sections/About.tsx"]
        ScheduleSec["sections/Schedule.tsx"]
        StreamCard["sections/StreamCard.tsx"]
        EmotesSec["sections/Emotes.tsx"]
        JoinSec["sections/Join.tsx"]
        FaqSec["sections/Faq.tsx"]
        CoverSec["sections/SupportsCover.tsx"]
        DonationsSec["sections/TopDonations.tsx"]
        NotesSec["sections/ViewerNotes.tsx"]
        WheelScene["character/HamsterWheelScene.tsx"]
    end

    %% UI Atom & Molecular System
    subgraph UI_Kit ["7. UI Primitives & Vector Doodles"]
        ButtonUI["ui/Button.tsx"]
        DropdownUI["ui/Dropdown.tsx"]
        PanelUI["ui/Panel.tsx"]
        PaperUI["ui/Paper.tsx"]
        RevealUI["ui/Reveal.tsx"]
        SeedsUI["ui/AmbientSeeds.tsx"]
        DoodlesUI["ui/Doodles.tsx & Stickers.tsx"]
        MarqueeUI["ui/Marquee.tsx"]
        WaveUI["ui/WaveDivider.tsx"]
        StreamDecorUI["ui/StreamDecor.tsx"]
    end

    %% Dependency Connections
    ViteConfig --> SeoPlugin
    ViteConfig --> GzipPlugin
    SeoPlugin -.->|Reads Schema & Templates| IndexHTML
    SeoPlugin --> SiteConfig
    SeoPlugin --> MessagesIndex
    SeoPlugin --> ContentData

    MessagesEN --> I18nTypes
    I18nTypes -.->|Enforces Schema| MessagesID
    I18nTypes -.->|Enforces Schema| MessagesJP
    I18nTypes -.->|Enforces Schema| MessagesKR
    MessagesIndex --> MessagesEN & MessagesID & MessagesJP & MessagesKR

    MainTSX --> PreloadEngine
    MainTSX --> Initial
    MainTSX --> AppTSX

    AppTSX --> I18nProvider
    AppTSX --> SoundCtx
    AppTSX --> ToastCtx
    AppTSX --> Header & Footer
    AppTSX --> HomePage & SupportsPage

    I18nProvider --> NavEngine
    I18nProvider --> Detect
    I18nProvider --> MessagesIndex
    I18nProvider --> PagesConfig

    Header --> LangSelect
    Header --> UseScrollSpy
    Header --> NavEngine
    LangSelect --> DropdownUI

    SoundCtx --> AudioEngine

    HomePage --> HeroSec & AboutSec & ScheduleSec & EmotesSec & JoinSec & FaqSec & MarqueeUI & WaveUI
    SupportsPage --> CoverSec & DonationsSec & NotesSec & MarqueeUI & WaveUI

    HeroSec --> WheelScene
    HeroSec --> UseNow
    HeroSec --> ScheduleEngine
    WheelScene --> HeroData
    WheelScene --> AudioEngine

    ScheduleSec --> ScheduleData
    ScheduleSec --> ScheduleEngine
    ScheduleSec --> StreamCard
    ScheduleSec --> DropdownUI
    StreamCard --> MotionEngine

    AboutSec --> ContentData
    JoinSec --> ContentData
    EmotesSec --> EmotesData
    DonationsSec --> SupportsData
    NotesSec --> SupportsData

    SectionsCommon = HeroSec & AboutSec & ScheduleSec & EmotesSec & JoinSec & FaqSec & CoverSec & DonationsSec & NotesSec
    SectionsCommon --> PanelUI
    SectionsCommon --> PaperUI
    SectionsCommon --> RevealUI
    SectionsCommon --> ButtonUI
    SectionsCommon --> DoodlesUI
    SectionsCommon --> UseI18n
```

---

### 3. Matriks Relasi Antar-Entitas (Entity Relation Matrix)

| Entitas Target | Sumber Referensi / Pengimpor Utama | Peran Arsitektural |
|---|---|---|
| **`src/config/site.ts`** | `vite/seoPlugin.ts`, `data/content.ts`, `data/supports.ts`, `Header`, `Hero`, `Footer` | **Konfigurasi Global & Identitas**: Memuat URL platform, profil streamer, aturan sanitasi (`isFilled`), dan metadata teknis (Timezone, Dimensi SEO). |
| **`src/i18n/messages/en.ts`** | `src/i18n/types.ts`, `src/i18n/messages/index.ts` | **Contract Source of Truth**: Mendefinisikan kontrak interface tipe `Messages`. |
| **`src/i18n/navigation.ts`** | `src/i18n/I18nProvider.tsx`, `Header.tsx`, `Link.tsx` | **Stateful URL Driver**: Menggantikan router dengan hook sinkronisasi URL (`useSyncExternalStore`) via History API. |
| **`src/lib/audio.ts`** | `src/context/SoundProvider.tsx`, `HamsterWheelScene.tsx` | **Audio Synthesizer Engine**: Pembangkit nada prosedural (Bloop, Pop, Gold, Sparkle, Toggle) via Web Audio API. |
| **`src/lib/schedule.ts` & `ics.ts`** | `src/components/sections/Schedule.tsx`, `StreamCard.tsx`, `Hero.tsx` | **Date-Time & RFC 5545 Engine**: Melakukan komputasi zona waktu IANA tanpa dependensi eksternal serta formatting iCalendar RFC 5545 75-byte line-folding. |
| **`src/lib/preload.ts` & `loader.ts`** | `src/main.tsx`, `index.html` | **Critical Render Orchestrator**: Menangani decoding gambar dan loading font sebelum menghapus DOM loader statis dari viewport. |
| **`src/hooks/useGsap.ts`** | Hampir semua komponen `sections/*`, `character/*`, dan `ui/*` | **Motion Lifecycle Guard**: Mengunci eksekusi animasi GSAP di bawah kondisi preferensi gerak (`prefers-reduced-motion`) dan membersihkan timeline saat unmount. |

---

### 4. Poin Kunci & Karakteristik Arsitektur

1. **Zero External Media Payload (Audio):**
   Suara klik, putaran roda hamster, dan konfeti tidak mengunduh berkas `.mp3` atau `.wav`, melainkan disintesis secara real-time via `AudioContext` Web Audio API.
2. **Decoupled Data vs View:**
   Semua data struktural (`streams.ts`, `schedule.ts`, `emotes.ts`, `membership.ts`) hanya memegang ID, tipe data, waktu, dan key. Seluruh label teks, deskripsi, dan lokalisasi diambil melalui lookup dinamis ke `src/i18n/messages/*.ts`.
3. **Resilient Loading Lifecycle:**
   `src/main.tsx` me-mount komponen React terlebih dahulu di balik overlay `#loader`. `preloadCritical` menjalankan unduhan font serta `HTMLImageElement.decode()` secara konkuren dengan timeout guard (maksimal 4.000 ms) agar aplikasi tidak pernah mengalami *infinite freeze*.
