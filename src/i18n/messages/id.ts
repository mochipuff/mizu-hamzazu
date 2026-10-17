import type { Messages } from './index.ts';

export const id: Messages = {
  skipLink: 'Lewati ke konten',

  common: {
    loadFailed: 'Belum bisa dimuat. Coba lagi nanti ya.',
    retry: 'Coba lagi',
    loading: 'Memuat…',
    empty: 'Belum ada apa-apa di sini.',
    copyBlocked: 'Penyalinan diblokir di browser ini.',
    secretCode: 'Kode rahasia ditemukan! Badai konfeti terbuka.',
  },

  leave: {
    title: 'Kamu akan meninggalkan situs ini',
    youtubeTitle: 'Membuka YouTube',
    body: (host) => `Tautan ini menuju ${host}, yang bukan bagian dari situs Mizu.`,
    cancel: 'Tetap di sini',
    open: 'Buka tautan',
  },

  loader: {
    title: 'Memuat',
    note: 'Membangunkan mizu...',
    progress: 'Progres pemuatan',
  },

  header: {
    brandMenuLabel: (name) => `${name}, buka menu cepat`,
    primaryNav: 'Utama',
    mobileNav: 'Seluler',
    soundOn: 'Sfx: nyala',
    soundOff: 'Sfx: mati',
    comingSoon: 'Segera hadir',
    bondingCard: 'Kartu bonding',
    openMenu: 'Buka menu',
    closeMenu: 'Tutup menu',
    language: 'Bahasa',
  },

  nav: {
    home: 'Beranda',
    about: 'Tentang',
    lore: 'Lore',
    schedule: 'Jadwal',
    emotes: 'Emote',
    join: 'Gabung',
    faq: 'FAQ',
    supports: 'Dukungan',
    content: 'Konten',
    collab: 'Kolaborasi',
  },

  seo: {
    title: 'Mizu Hamzazu | VTuber Hamster Indonesia',
    description: 'Situs resmi Mizu Hamzazu, VTuber hamster asal Indonesia. Jadwal stream mingguan freetalk, cozy games, dan karaoke, emote, serta komunitas Zutopian.',
    imageAlt: 'Mizu Hamzazu, virtual youtuber asal Indonesia',
    keywords: ['Mizu Hamzazu', 'VTuber Indonesia', 'virtual youtuber Indonesia', 'VTuber hamster', 'Zutopian', 'cozy gaming', 'karaoke stream'],
  },

  supports: {
    seo: {
      title: 'Dukungan | Mizu Hamzazu',
      description: 'Fan art manis untuk Mizu Hamzazu. Terima kasih, Zutopian!',
    },
    marquee: ['Terima kasih, Zutopian!', 'Setiap traktiran bikin kincir terus berputar', 'Mizu Hamzazu', 'Fan art dari para Zutopian'],
    cover: {
      sticker: 'makasih!',
      title: 'Dukungan',
      lead: 'Buku tempel berisi traktiran dan fan art yang bikin kincir Mizu terus berputar. Terima kasih, Zutopian!',
      waysLabel: 'Cara mendukung',
    },
    fanart: {
      title: 'Fan art',
      lead: 'Gambar-gambar untuk Mizu dari para Zutopian. Setiap gambar adalah traktiran!',
      listLabel: 'Fan art',
      alt: (username) => `Fan art oleh @${username}`,
      loadMore: 'Muat lebih banyak',
      view: (username) => `Lihat fan art oleh @${username} lebih besar`,
      close: 'Tutup pratinjau',
      openOriginal: 'Buka gambar asli',
    },
  },

  content: {
    seo: {
      title: 'Konten | Mizu Hamzazu',
      description: 'Tonton live stream, Shorts, dan video Mizu Hamzazu dari YouTube di satu tempat.',
    },
    title: 'Konten',
    lead: 'Live stream, Shorts, dan video dari kanal YouTube Mizu.',
    tabsLabel: 'Jenis konten',
    kinds: { live: 'Live stream', short: 'Shorts', vod: 'Video', song: 'Lagu' },
    tags: { live: 'Live stream', short: 'Shorts', vod: 'Video', original: 'Lagu original', cover: 'Lagu cover' },
  },

  collab: {
    seo: {
      title: 'Kolaborasi | Mizu Hamzazu',
      description: 'VTuber dan teman-teman yang pernah kolaborasi stream dengan Mizu Hamzazu, diurutkan dari yang paling sering.',
    },
    title: 'Kolaborasi',
    lead: 'Teman-teman yang pernah stream bareng Mizu, diurutkan dari jumlah kolaborasi terbanyak. Terima kasih sudah main bareng!',
    listLabel: 'Partner kolaborasi, dari yang paling banyak',
    count: (count: number) => `${count} kolaborasi`,
  },

  // Not published yet (see `HIDDEN_PAGES` in src/i18n/pages.ts).
  game: {
    seo: {
      title: 'Kartu bonding | Mizu Hamzazu',
      description: 'Kartu bonding Mizu Hamzazu, segera hadir.',
    },
    title: 'Kartu bonding',
    lead: 'Game kecil untuk Mizu dan para Zutopian. Masih disiapkan di dalam sarang, jadi tunggu ya!',
  },

  // Where the API sends a visitor who opens one of its addresses in the browser (see api/index.ts).
  forbidden: {
    seo: {
      title: 'Akses Ditolak | Mizu Hamzazu',
      description: 'Alamat ini tidak bisa dibuka langsung.',
    },
    sticker: 'error 403',
    title: 'Akses Ditolak',
    lead: 'Data Mizu aman di dalam sarang. Alamat ini tidak bisa dibuka langsung, jadi silakan gunakan situsnya.',
    homeCta: 'Kembali ke beranda',
  },

  profile: {
    tagline: 'VTuber hamster Indonesia: freetalk, cozy games, dan karaoke.',
    bio: 'Mizu Hamzazu adalah virtual youtuber (VTuber) asal Indonesia yang debut pada 1 November 2021. Ia seekor hamster yang streaming freetalk, cozy games, karaoke, dan stream produktif #RABUATIF di YouTube dan Twitch, serta nongkrong bareng para penggemarnya, Zutopian, di Discord Hamzazu Palace.',
    species: 'Hamster',
    nationality: 'Indonesia',
    agency: 'Independen',
    jobTitle: 'Virtual YouTuber',
    languages: ['Bahasa Indonesia', 'Bahasa Inggris'],
    topics: ['Virtual YouTuber', 'Review', 'Karaoke', 'Stream freetalk', 'Stream kolaborasi'],
    labels: {
      species: 'Spesies',
      birthday: 'Ulang tahun',
      height: 'Tinggi badan',
      debut: 'Debut',
      fanName: 'Nama fandom',
      nationality: 'Kewarganegaraan',
      languages: 'Bahasa',
      agency: 'Agensi',
      illustrator: 'Ilustrator',
      riggerOrModeler: 'Rigger / modeler',
    },
  },

  platforms: {
    youtube: { cta: 'Tonton di YouTube', blurb: 'Stream freetalk dan gaming.' },
    twitch: { cta: 'Tonton di Twitch', blurb: 'Stream freetalk dalam bahasa Inggris.' },
    x: { cta: 'Ikuti di X', blurb: 'Semua tentang mizu.' },
    discord: { cta: 'Gabung Discord', blurb: 'Ngobrol bareng sesama Zutopian.' },
  },

  hashtags: {
    general: 'Postingan umum',
    fanart: 'Fan art',
    live: 'Live',
    meme: 'Postingan meme',
    clips: 'Klip dan highlight',
  },

  socials: {
    instagram: 'Foto dan kabar terbaru',
    tiktok: 'Klip pendek',
    trakteer: 'Dukungan dan donasi',
    linktree: 'Semua tautan di satu tempat',
    tako: 'Dukung mizu lewat Tako',
    membership: 'Gabung membership Zutopian',
  },

  marquee: [
    'Kangen? Ngobrol di discord yuk',
    'Support aku via Trakteer ya',
    'Join member sabi sih',
    'Mizu Hamzazu',
    'Zutopian',
    'EITS gak nih?',
  ],

  hero: {
    tag: 'Virtual Youtuber',
    greeting: 'Cihuyyy,',
    iAm: (name) => `Aku ${name}!`,
    intro:
      'Mizu Hamzazu adalah hamster isekai yang datang dengan satu misi utama: menemukan adiknya yang hilang. Berusia 18 tahun selamanya, Mizu kini membuka lembaran baru dalam perjalanannya.',
    liveNow: 'Sedang live sekarang',
    nextStream: 'Stream berikutnya',
    joinStream: 'Gabung stream',
    nowLive: 'Sedang live',
    nowLiveOn: (platform) => `Sedang live di ${platform}, buka siarannya`,
    startsIn: (days, hours, minutes) => `Mulai dalam ${days} hari, ${hours} jam, ${minutes} menit`,
    units: { day: 'hr', hour: 'j', minute: 'mnt' },
    spinHint: 'Putar rodanya, nanti dia bereaksi.',
    welcome: 'Halo, zutopians!',
    pokeLabel: (pokes) => `Putar roda dan colek Mizu. Sudah dicolek ${pokes} kali.`,
    pokeLines: ['Ini placeholder 1', 'Ini placeholder 2'],
    pokeMilestones: {
      10: 'Udah stop?',
      25: 'Sakit weh',
      50: 'Uhhhhhhhh pusing...',
    },
  },

  about: {
    title: 'Kenalan sama Mizu',
    lead: 'Kenali aku lebih dekat...',
    storyTitle: 'Lore',
    profileTitle: 'Profil',
    likesTitle: 'Suka',
    dislikesTitle: 'Kurang suka',
    streamsTitle: 'Konten stream',
    lore: ['Ayah siapa itu mizu?', 'The goat.'],
    streamTypes: {
      games: { title: 'Game', description: 'Cozy game, puzzle, dan game cerita.' },
      karaoke: { title: 'Karaoke', description: 'Nyanyiin lagu yang bisa dinyanyiin.' },
      freetalk: { title: 'Freetalk', description: 'Ngobrol apapun dengan topik random.' },
    },
    streamEmoteAlt: (emote, title) => `Emote ${emote} untuk ${title}`,
  },

  schedule: {
    title: 'Jadwal stream',
    lead: 'Waktu di bawah ditampilkan sesuai zona waktumu, jadi tidak perlu menghitung sendiri.',
    yourTimeZone: 'Zona waktumu',
    showBaseTime: (zone) => `Tampilkan waktu ${zone}`,
    useMyTimeZone: 'Pakai zona waktuku',
    addAll: 'Tambahkan semua ke kalender',
    weekLabel: (zone) => `Stream 7 hari ke depan (${zone})`,
    today: 'Hari ini',
    tomorrow: 'Besok',
    restDay: 'Hari libur',
    loadFailed: 'Jadwal belum bisa dimuat. Coba lagi nanti ya.',
    liveNow: 'Live sekarang',
    members: 'Member',
    membersOnlySuffix: ' (Khusus member)',
    liveEnded: 'Live selesai',
    thumbnailAlt: (title) => `Thumbnail stream ${title}`,
    watchOn: (title, platform) => `${title} di ${platform}`,
    addToCalendar: (title) => `Tambahkan ${title} ke kalendermu`,
    note: (zone, city) =>
      `Stream direncanakan dalam waktu ${zone} (${city}). Jadwal bisa berubah, jadi ikuti X untuk info stream dadakan dan pembatalan.`,
    calendarName: (name) => `Stream ${name}`,
    calendarDownloaded: 'File kalender diunduh.',
    reminder: (title) => `${title} mulai 15 menit lagi`,
  },

  emotes: {
    title: 'Paket emote',
    lead: 'Bebas dipakai di chat, Discord, dan proyek fan. Ketuk kode untuk menyalinnya.',
    copied: (code) => `${code} disalin`,
    imageAlt: (name, usage) => `Emote ${name}: ${usage}`,
    copyLabel: (label) => `Salin kode untuk ${label}`,
    items: {
      mizuShy: { label: 'Malu-malu', usage: 'Saat tersipu dan malu-malu' },
      mizuHappyLove: { label: 'Lovee', usage: 'Suasana asyik dan kabar baik' },
      mizuHuh: { label: 'Hah?', usage: 'Bingung' },
      mizuLove: { label: 'Cinta', usage: 'Sayang kamu?' },
      mizuBuffer: { label: 'Buffer', usage: 'Lag, loading, dan otak nge-freeze' },
      mizuAngry: { label: 'Marah', usage: 'Boss fight dan keputusan buruk' },
      mizuHeadpat: { label: 'Elus kepala', usage: 'Pujian, hiburan, dan elusan untuk Mizu' },
      mizuSmug: { label: 'Songong', usage: 'Saat chat benar lagi' },
      mizuSleepy: { label: 'Ngantuk', usage: 'Energi chat tengah malam' },
      mizuHype: { label: 'Hype', usage: 'Momen besar dan clutch play' },
      mizuGG: { label: 'GG', usage: 'Menang, kalah, dan game seru' },
      mizuUhh: { label: 'Uhh', usage: 'Dahlah' },
    },
  },

  join: {
    title: 'Zutopian',
    lead: 'Mengikuti itu gratis. Membership untuk kamu yang ingin ikut lebih jauh.',
    platformsTitle: 'Temukan Mizu di sini',
    platformCtaLabel: (cta, platform) => `${cta} (${platform})`,
    badgesLabel: (tiers) => `Badge membership: ${tiers}`,
    tier: (level) => `Tier ${level}`,
    perks: {
      membership: { title: 'Badge dan emote member', description: 'Sesi nonton bareng, main bareng dan livestream exclusive.' },
      vod: { title: 'VOD Hayden James', description: 'Roleplay jadi pacar pas sleepcall?' },
      discord: { title: 'Channel Discord', description: 'Unlock channel exclusive member dan nonton bareng di discord.' },
      info: { title: 'Dapat info A1 lebih cepat', description: 'Dapat informasi terkait mizu lebih cepat, wow!' },
    },
  },

  faq: {
    title: 'Pertanyaan',
    lead: 'Apa yang sering ditanyakan dan lainnya...',
    items: [
      {
        question: 'Kapan Mizu stream?',
        answer: 'Sesuai jadwal tertera diatas dan schedule di discord server.',
      },
      {
        question: 'Mizu stream apa aja?',
        answer: 'Mostly cozy games, karaoke, tierlist, freetalk, dan produktif stream #RABUATIF.',
      },
    ],
  },

  footer: {
    signoff: 'Oshi kamu pokoknya harus aku! ya?',
    socialNav: 'Tautan sosial media',
    openInNewTab: (label, handle) => `${label}, ${handle} (dibuka di tab baru)`,
    hashtags: 'Hashtag',
    backToTop: 'Kembali ke atas',
    builtWith: 'Dibuat dengan',
    legal: (year, owner) => `© ${year} ${owner}. Fan art dan klip sangat disambut, mohon cantumkan kredit dan tautan kembali.`,
  },

  noscript: {
    findOnline: (name) => `Temukan ${name} secara online`,
  },
};
