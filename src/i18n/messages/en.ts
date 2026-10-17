/**
 * English is the source of truth. `Messages` (see ./index.ts) is derived from this object, so adding or renaming
 * a key here makes the compiler list every other language that has to follow.
 * Strings that need a value are functions, so each language can place the value where its grammar wants it.
 */
export const en = {
  skipLink: 'Skip to content',

  common: {
    loadFailed: 'This could not be loaded. Please try again later.',
    retry: 'Try again',
    loading: 'Loading…',
    empty: 'Nothing here yet.',
    copyBlocked: 'Copy is blocked in this browser.',
    secretCode: 'Secret code found! Confetti storm unlocked.',
  },

  leave: {
    title: 'You are leaving this site',
    youtubeTitle: 'Opening YouTube',
    body: (host: string) => `This link goes to ${host}, which is not part of Mizu’s site.`,
    cancel: 'Stay here',
    open: 'Open link',
  },

  // Shown before the app loads. Keep in step with the literal text in index.html.
  loader: {
    title: 'Loading',
    note: 'Waking up mizu...',
    progress: 'Loading progress',
  },

  header: {
    brandMenuLabel: (name: string) => `${name}, open the quick menu`,
    primaryNav: 'Primary',
    mobileNav: 'Mobile',
    soundOn: 'Sfx: on',
    soundOff: 'Sfx: off',
    comingSoon: 'Coming soon',
    bondingCard: 'Bonding card',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Language',
  },

  nav: {
    home: 'Home',
    about: 'About',
    lore: 'Lore',
    schedule: 'Schedule',
    emotes: 'Emotes',
    join: 'Join',
    faq: 'FAQ',
    supports: 'Supports',
    content: 'Content',
    collab: 'Collab',
  },

  // Search engines, link previews and AI crawlers.
  seo: {
    title: 'Mizu Hamzazu | Indonesian Hamster VTuber',
    description: 'Official site of Mizu Hamzazu, an Indonesian hamster VTuber. Weekly stream schedule for freetalk, cozy games and karaoke, emotes, and the Zutopian community.',
    imageAlt: 'Mizu Hamzazu, an Indonesian virtual youtuber',
    keywords: ['Mizu Hamzazu', 'VTuber Indonesia', 'Indonesian virtual youtuber', 'hamster VTuber', 'Zutopian', 'cozy gaming', 'karaoke stream'],
  },

  supports: {
    seo: {
      title: 'Supports | Mizu Hamzazu',
      description: 'The sweetest fan art for Mizu Hamzazu. Thank you, Zutopian!',
    },
    marquee: ['Thank you, Zutopian!', 'Every treat keeps the wheel spinning', 'Mizu Hamzazu', 'Fan art from the Zutopian'],
    cover: {
      sticker: 'thank you!',
      title: 'Supports',
      lead: 'A scrapbook of the treats and fan art that keep Mizu’s wheel spinning. Thank you, Zutopian!',
      waysLabel: 'Ways to support',
    },
    fanart: {
      title: 'Fan art',
      lead: 'Drawings made for Mizu by the Zutopian. Every one of them is a treat!',
      listLabel: 'Fan art',
      alt: (username: string) => `Fan art by @${username}`,
      loadMore: 'Load more',
      view: (username: string) => `View fan art by @${username} larger`,
      close: 'Close preview',
      openOriginal: 'Open original',
    },
  },

  content: {
    seo: {
      title: 'Content | Mizu Hamzazu',
      description: 'Watch Mizu Hamzazu’s streams, Shorts and videos from YouTube in one place.',
    },
    title: 'Content',
    lead: 'Streams, Shorts and videos from Mizu’s YouTube channel.',
    tabsLabel: 'Type of content',
    kinds: { live: 'Streams', short: 'Shorts', vod: 'Videos', song: 'Songs' },
    tags: { live: 'Stream', short: 'Short', vod: 'Video', original: 'Original song', cover: 'Cover song' },
  },

  collab: {
    seo: {
      title: 'Collab | Mizu Hamzazu',
      description: 'The VTubers and friends Mizu Hamzazu has streamed with, ranked by how many collabs they have done together.',
    },
    title: 'Collab',
    lead: 'The friends Mizu has streamed with, ranked by how many collabs they did together. Thank you for playing with her!',
    listLabel: 'Collab partners, most collabs first',
    count: (count: number) => `${count} ${count === 1 ? 'collab' : 'collabs'}`,
  },

  // Not published yet (see `HIDDEN_PAGES` in src/i18n/pages.ts).
  game: {
    seo: {
      title: 'Bonding card | Mizu Hamzazu',
      description: 'The Bonding card of Mizu Hamzazu, on its way.',
    },
    title: 'Bonding card',
    lead: 'A little game for Mizu and the Zutopian. It is still in the burrow, so come back soon!',
  },

  // Where the API sends a visitor who opens one of its addresses in the browser (see api/index.ts).
  forbidden: {
    seo: {
      title: 'Forbidden | Mizu Hamzazu',
      description: 'This address is not open to visitors.',
    },
    sticker: 'error 403',
    title: 'Forbidden',
    lead: 'Mizu’s data stays safe in the burrow. This address can’t be opened directly, so please use the website instead.',
    homeCta: 'Back to home',
  },

  profile: {
    tagline: 'Indonesian hamster VTuber: freetalk, cozy games and karaoke.',
    bio: 'Mizu Hamzazu is an Indonesian virtual youtuber (VTuber) who debuted on November 1, 2021. She is a hamster who streams freetalk, cozy games, karaoke and the productive #RABUATIF stream on YouTube and Twitch, and hangs out with her fans, the Zutopian, in the Hamzazu Palace Discord.',
    species: 'Hamster',
    nationality: 'Indonesia',
    agency: 'Independent',
    jobTitle: 'Virtual YouTuber',
    languages: ['Indonesian', 'English'],
    topics: ['Virtual YouTubers', 'Reviews', 'Karaoke', 'Freetalk streams', 'Collabs stream'],
    labels: {
      species: 'Species',
      birthday: 'Birthday',
      height: 'Height',
      debut: 'Debut',
      fanName: 'Fan name',
      nationality: 'Nationality',
      languages: 'Languages',
      agency: 'Agency',
      illustrator: 'Illustrator',
      riggerOrModeler: 'Rigger / modeler',
    },
  },

  platforms: {
    youtube: { cta: 'Watch on YouTube', blurb: 'Freetalk and gaming stream.' },
    twitch: { cta: 'Watch on Twitch', blurb: 'Freetalk stream in English.' },
    x: { cta: 'Follow on X', blurb: 'All about mizu.' },
    discord: { cta: 'Join the Discord', blurb: 'Chat with other Zutopian.' },
  },

  hashtags: {
    general: 'General posts',
    fanart: 'Fan art',
    live: 'Live',
    meme: 'Meme posts',
    clips: 'Clips and highlights',
  },

  socials: {
    instagram: 'Photos and updates',
    tiktok: 'Short clips',
    trakteer: 'Support and donations',
    linktree: 'All links in one place',
    tako: 'Support mizu on Tako',
    membership: 'Join Zutopian membership',
  },

  marquee: [
    'Missing me? Come chat on Discord',
    'Support me via Trakteer, okay?',
    'Joining the membership is a good idea',
    'Mizu Hamzazu',
    'Zutopian',
    'Hold on, aren’t you coming?',
  ],

  hero: {
    tag: 'Virtual Youtuber',
    greeting: 'Cihuyyy,',
    iAm: (name: string) => `I’m ${name}!`,
    intro:
      'Mizu Hamzazu is an isekai hamster who arrived with one primary mission: to find her lost younger sibling. Eternally 18 years old, Mizu is turning a new page in her journey.',
    liveNow: 'Live right now',
    nextStream: 'Next stream',
    joinStream: 'Join the stream',
    nowLive: 'Now live',
    nowLiveOn: (platform: string) => `Now live on ${platform}, open the stream`,
    startsIn: (days: number, hours: number, minutes: number) => `Starts in ${days} days, ${hours} hours, ${minutes} minutes`,
    units: { day: 'd', hour: 'h', minute: 'm' },
    spinHint: 'Give the wheel a spin, she reacts.',
    welcome: 'Hi, Zutopian!',
    pokeLabel: (pokes: number) => `Spin the wheel and poke Mizu. Poked ${pokes} ${pokes === 1 ? 'time' : 'times'}.`,
    pokeLines: ['This is placeholder 1', 'This is placeholder 2'],
    pokeMilestones: {
      10: 'Done yet?',
      25: 'Ouch, that hurts!',
      50: 'Uhhhhhhhh I’m dizzy...',
    } as Record<number, string>,
  },

  about: {
    title: 'Meet Mizu',
    lead: 'Know me better...',
    storyTitle: 'Lore',
    profileTitle: 'Profile',
    likesTitle: 'Likes',
    dislikesTitle: 'Not so much',
    streamsTitle: 'What she streams',
    lore: ['Whose dad is that, Mizu?', 'The goat.'],
    streamTypes: {
      games: { title: 'Games', description: 'Cozy games, puzzles and story games.' },
      karaoke: { title: 'Karaoke', description: 'Singing any song that can be sung.' },
      freetalk: { title: 'Freetalk', description: 'Chatting about anything, with random topics.' },
    },
    streamEmoteAlt: (emote: string, title: string) => `${emote} emote for ${title}`,
  },

  schedule: {
    title: 'Stream schedule',
    lead: 'Times below are shown in your time zone, so you never have to do the math.',
    yourTimeZone: 'Your time zone',
    showBaseTime: (zone: string) => `Show ${zone} time`,
    useMyTimeZone: 'Use my time zone',
    addAll: 'Add all to calendar',
    weekLabel: (zone: string) => `Streams for the next 7 days in ${zone}`,
    today: 'Today',
    tomorrow: 'Tomorrow',
    restDay: 'Rest day',
    loadFailed: 'The schedule could not be loaded. Please try again later.',
    liveNow: 'Live now',
    members: 'Members',
    membersOnlySuffix: ' (Members only)',
    liveEnded: 'Live ended',
    thumbnailAlt: (title: string) => `${title} stream thumbnail`,
    watchOn: (title: string, platform: string) => `${title} on ${platform}`,
    addToCalendar: (title: string) => `Add ${title} to your calendar`,
    note: (zone: string, city: string) =>
      `Streams are planned in ${zone} time (${city}). Plans can change, so follow on X for surprise streams and cancellations.`,
    calendarName: (name: string) => `${name} streams`,
    calendarDownloaded: 'Calendar file downloaded.',
    reminder: (title: string) => `${title} starts in 15 minutes`,
  },

  emotes: {
    title: 'Emote pack',
    lead: 'Free to use in chat, Discord and fan projects. Tap a code to copy it.',
    copied: (code: string) => `Copied ${code}`,
    imageAlt: (name: string, usage: string) => `${name} emote: ${usage}`,
    copyLabel: (label: string) => `Copy the code for ${label}`,
    items: {
      mizuShy: { label: 'Shy', usage: 'Blushing and bashful moments' },
      mizuHappyLove: { label: 'Lovee', usage: 'Good vibes and good news' },
      mizuHuh: { label: 'Huh?', usage: 'Confusing' },
      mizuLove: { label: 'Love', usage: 'Love you?' },
      mizuBuffer: { label: 'Buffer', usage: 'Lag, loading and brain freezes' },
      mizuAngry: { label: 'Angry', usage: 'Boss fights and bad decisions' },
      mizuHeadpat: { label: 'Headpat', usage: 'Praise, comfort and pats for Mizu' },
      mizuSmug: { label: 'Smug', usage: 'When chat is right again' },
      mizuSleepy: { label: 'Sleepy', usage: 'Late-night chat energy' },
      mizuHype: { label: 'Hype', usage: 'Big moments and clutch plays' },
      mizuGG: { label: 'GG', usage: 'Wins, losses and good games' },
      mizuUhh: { label: 'Uhh', usage: 'Whatever, forget it' },
    },
  },

  join: {
    title: 'Zutopian',
    lead: 'Following is free. Memberships are for anyone who wants to do a little more.',
    platformsTitle: 'Find Mizu here',
    platformCtaLabel: (cta: string, platform: string) => `${cta} (${platform})`,
    badgesLabel: (tiers: string) => `Membership badges: ${tiers}`,
    tier: (level: number) => `Tier ${level}`,
    perks: {
      membership: { title: 'Member badge and emotes', description: 'Watch-alongs, play-togethers and exclusive livestreams.' },
      vod: { title: 'VOD Hayden James', description: 'Roleplay as your partner on a sleepcall?' },
      discord: { title: 'Discord channels', description: 'Unlock exclusive member channels and watch-alongs on Discord.' },
      info: { title: 'Get the inside info first', description: 'Get news about Mizu sooner, wow!' },
    },
  },

  faq: {
    title: 'Questions',
    lead: 'Frequently asked questions and more...',
    items: [
      {
        question: 'When does Mizu stream?',
        answer: 'Follow the schedule listed above and the schedule in the Discord server.',
      },
      {
        question: 'What does Mizu stream?',
        answer: 'Mostly cozy games, karaoke, tier lists, freetalk and the productive #RABUATIF stream.',
      },
    ],
  },

  footer: {
    signoff: 'Your oshi has to be me, okay?',
    socialNav: 'Social links',
    openInNewTab: (label: string, handle: string) => `${label}, ${handle} (opens in a new tab)`,
    hashtags: 'Hashtags',
    backToTop: 'Back to top',
    builtWith: 'Built with',
    legal: (year: number, owner: string) => `© ${year} ${owner}. Fan art and clips are welcome, please credit and link back.`,
  },

  // The no-JavaScript fallback page that search engines read.
  noscript: {
    findOnline: (name: string) => `Find ${name} online`,
  },
};
