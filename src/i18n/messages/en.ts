export const en = {
  skipLink: 'Skip to content',

  common: {
    copyBlocked: 'Copy is blocked in this browser.',
    secretCode: 'Secret code found! Confetti storm unlocked.',
  },

  loader: {
    title: 'Loading',
    note: 'Waking up mizu...',
    progress: 'Loading progress',
  },

  header: {
    brandLabel: (name: string) => `${name}, back to top`,
    primaryNav: 'Primary',
    mobileNav: 'Mobile',
    soundOn: 'Turn sound effects on',
    soundOff: 'Turn sound effects off',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Language',
  },

  nav: {
    about: 'About',
    schedule: 'Schedule',
    emotes: 'Emotes',
    join: 'Join',
    faq: 'FAQ',
    contact: 'Contact',
  },

  seo: {
    title: 'Mizu Hamzazu | Indonesian Hamster VTuber',
    description: 'Official site of Mizu Hamzazu, an Indonesian hamster VTuber. Weekly stream schedule for freetalk, cozy games and karaoke, emotes, and the Zutopian community.',
    imageAlt: 'Mizu Hamzazu, an Indonesian virtual youtuber',
    keywords: ['Mizu Hamzazu', 'VTuber Indonesia', 'Indonesian virtual youtuber', 'hamster VTuber', 'Zutopian', 'cozy gaming', 'karaoke stream'],
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
    storyTitle: 'About',
    profileTitle: 'Profile',
    likesTitle: 'Likes',
    dislikesTitle: 'Not so much',
    streamsTitle: 'What she streams',
    lore: ['Whose dad is that, Mizu?', 'The goat.'],
    likes: ['Fikk', 'Valorant', 'Minecraft', 'Tomodachi Life', 'Sushi', 'Cimol', 'Spicy food', 'Matcha', 'Coffee', 'Teazzi'],
    dislikes: ['Insects', 'Horror games', 'Thunderstorms', 'Mint-flavored food'],
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

  contact: {
    title: 'Get in touch',
    lead: 'Business and collaboration enquiries only. For everything else, chat on stream is the fastest way to reach Mizu.',
    name: 'Your name',
    email: 'Your email',
    topic: 'Topic',
    topicPlaceholder: 'Choose one',
    topics: {
      collaboration: 'Collaboration',
      sponsorship: 'Sponsorship',
      press: 'Press or interview',
      other: 'Something else',
    },
    message: 'Message',
    submit: 'Write the email',
    notePrepared: 'Your email app should be opening with the message ready to send. If nothing happened, copy the address and write to us directly.',
    noteIdle: 'This opens your email app with the message filled in. Nothing is sent until you press send there.',
    sideTitle: 'Prefer to write directly?',
    copyAddress: 'Copy address',
    emailCopied: 'Email address copied.',
    sideNote: 'Please include links to your channel or company. Replies can take a few days.',
    fanNote: 'Fan art, clips and messages for Mizu belong on stream and on X, not in this inbox.',
    errors: {
      nameRequired: 'Please tell us your name.',
      nameTooLong: 'That name is a little long. Please shorten it.',
      emailRequired: 'Please add an email address so we can reply.',
      emailInvalid: 'That email address does not look right.',
      topicRequired: 'Please pick a topic.',
      messageTooShort: (min: number) => `Please write at least ${min} characters so we have enough to go on.`,
      messageTooLong: (max: number) => `Please keep it under ${max} characters.`,
    },
  },

  footer: {
    signoff: 'Your oshi has to be me, okay?',
    socialNav: 'Social links',
    openInNewTab: (label: string, handle: string) => `${label}, ${handle} (opens in a new tab)`,
    hashtags: 'Hashtags',
    backToTop: 'Back to top',
    legal: (year: number, owner: string) => `© ${year} ${owner}. Fan art and clips are welcome, please credit and link back.`,
  },

  noscript: {
    findOnline: (name: string) => `Find ${name} online`,
    business: 'Business inquiries',
  },
};
