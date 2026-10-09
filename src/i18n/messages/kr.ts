import type { Messages } from '../types.ts';

export const kr: Messages = {
  skipLink: '본문으로 건너뛰기',

  common: {
    copyBlocked: '이 브라우저에서는 복사가 차단되어 있어요.',
    secretCode: '비밀 코드 발견! 색종이 폭풍이 열렸어요.',
  },

  loader: {
    title: '로딩 중',
    note: 'Mizu를 깨우는 중...',
    progress: '로딩 진행률',
  },

  header: {
    brandLabel: (name) => `${name}, 맨 위로 이동`,
    brandHomeLabel: (name) => `${name}, 홈페이지로`,
    primaryNav: '주요',
    mobileNav: '모바일',
    soundOn: '효과음 켜기',
    soundOff: '효과음 끄기',
    openMenu: '메뉴 열기',
    closeMenu: '메뉴 닫기',
    language: '언어',
  },

  nav: {
    about: '소개',
    schedule: '스케줄',
    emotes: '이모티콘',
    join: '참여',
    faq: 'FAQ',
    supports: '후원',
  },

  seo: {
    title: 'Mizu Hamzazu | 인도네시아 햄스터 버튜버',
    description: '인도네시아 햄스터 버튜버 Mizu Hamzazu의 공식 웹사이트. 프리토크·힐링 게임·노래 방송 주간 스케줄, 이모티콘 팩, Zutopian 커뮤니티를 확인하세요.',
    imageAlt: 'Mizu Hamzazu, 인도네시아 버추얼 유튜버',
    keywords: ['Mizu Hamzazu', '인도네시아 버튜버', '버추얼 유튜버', '햄스터 버튜버', 'Zutopian', '힐링 게임', '노래 방송'],
  },

  supports: {
    seo: {
      title: '후원 | Mizu Hamzazu',
      description: 'Mizu Hamzazu를 향한 후원 TOP 10과 시청자들의 따뜻한 메모. 고마워요, Zutopian!',
    },
    marquee: ['고마워요, Zutopian!', '작은 후원 하나하나가 쳇바퀴를 돌려요', 'Mizu Hamzazu', '메모는 사랑을 담아 붙여 두었어요'],
    cover: {
      sticker: '고마워요!',
      title: '후원',
      lead: 'Mizu의 쳇바퀴를 계속 돌려 주는 선물과 메모를 모은 스크랩북. 고마워요, Zutopian!',
      waysLabel: '후원하는 방법',
    },
    donations: {
      title: '후원 TOP 10',
      lead: '지금까지 Mizu에게 전해진 가장 큰 선물들이에요.',
      listLabel: '후원 TOP 10',
      rank: (rank) => `${rank}위`,
      via: (platform) => `${platform}로 후원`,
    },
    notes: {
      title: '시청자 메모',
      lead: '시청자들이 남긴 작은 메시지를 Mizu를 위해 붙여 두었어요.',
      listLabel: '시청자 메모',
      from: (name) => `${name}님이`,
      inviteTitle: '당신의 메모도 여기에',
      inviteLead: '선물과 함께 메시지를 보내면 이 벽에 붙을지도 몰라요.',
      inviteCta: '선물 보내기',
    },
  },

  profile: {
    tagline: '인도네시아 햄스터 버튜버: 프리토크, 힐링 게임, 노래 방송.',
    bio: 'Mizu Hamzazu는 2021년 11월 1일에 데뷔한 인도네시아 버추얼 유튜버(VTuber)입니다. 햄스터 캐릭터로, YouTube와 Twitch에서 프리토크, 힐링 게임, 노래 방송, 그리고 생산적인 방송 #RABUATIF를 진행하며, 팬 "Zutopian"과는 Discord 서버 Hamzazu Palace에서 함께 어울립니다.',
    species: '햄스터',
    nationality: '인도네시아',
    agency: '개인 활동',
    jobTitle: '버추얼 유튜버',
    languages: ['인도네시아어', '영어'],
    topics: ['버추얼 유튜버', '리뷰', '노래 방송', '프리토크 방송', '콜라보 방송'],
    labels: {
      species: '종족',
      birthday: '생일',
      height: '키',
      debut: '데뷔일',
      fanName: '팬 이름',
      nationality: '국적',
      languages: '사용 언어',
      agency: '소속',
      illustrator: '일러스트',
      riggerOrModeler: '리거 / 모델러',
    },
  },

  platforms: {
    youtube: { cta: 'YouTube에서 보기', blurb: '프리토크와 게임 방송.' },
    twitch: { cta: 'Twitch에서 보기', blurb: '영어 프리토크 방송.' },
    x: { cta: 'X 팔로우하기', blurb: 'Mizu의 모든 것.' },
    discord: { cta: 'Discord 참여하기', blurb: '다른 Zutopian들과 수다 떨어요.' },
  },

  hashtags: {
    general: '일반 게시물',
    fanart: '팬아트',
    live: '라이브',
    meme: '밈 게시물',
    clips: '클립 및 하이라이트',
  },

  socials: {
    instagram: '사진과 소식',
    tiktok: '숏폼 클립',
    trakteer: '후원 및 도네이션',
    linktree: '모든 링크 모음',
    tako: 'Tako에서 Mizu 응원하기',
    membership: 'Zutopian 멤버십 가입',
  },

  marquee: [
    '보고 싶었지? 디스코드에서 수다 떨자!',
    'Trakteer로 응원해 줘~',
    '멤버십 가입, 어때?',
    'Mizu Hamzazu',
    'Zutopian',
    '잠깐, 안 올 거야?',
  ],

  hero: {
    tag: '버추얼 유튜버',
    greeting: 'Cihuyyy,',
    iAm: (name) => `나는 ${name}!`,
    intro:
      'Mizu Hamzazu는 잃어버린 동생을 찾겠다는 단 하나의 목표를 안고 이세계에서 온 햄스터입니다. 영원한 18세인 Mizu는 지금 여정의 새로운 페이지를 넘기고 있어요.',
    liveNow: '지금 라이브 중',
    nextStream: '다음 방송',
    joinStream: '방송 참여하기',
    startsIn: (days, hours, minutes) => `${days}일 ${hours}시간 ${minutes}분 후 시작`,
    units: { day: '일', hour: '시간', minute: '분' },
    spinHint: '쳇바퀴를 돌려보세요. 반응해 줄 거예요.',
    welcome: '안녕, Zutopian!',
    pokeLabel: (pokes) => `쳇바퀴를 돌리고 Mizu를 콕 찌르기. ${pokes}번 찔렀어요.`,
    pokeLines: ['이건 플레이스홀더 1이에요', '이건 플레이스홀더 2예요'],
    pokeMilestones: {
      10: '이제 그만할 거야?',
      25: '아야, 아파!',
      50: '으으으으 어지러워...',
    },
  },

  about: {
    title: 'Mizu 알아보기',
    lead: '나에 대해 더 알아가 봐요...',
    storyTitle: '소개',
    profileTitle: '프로필',
    likesTitle: '좋아하는 것',
    dislikesTitle: '별로인 것',
    streamsTitle: '방송 콘텐츠',
    lore: ['그거 누구 아빠야, Mizu?', '더 GOAT.'],
    likes: ['Fikk', 'Valorant', 'Minecraft', 'Tomodachi Life', '스시', 'Cimol(튀긴 타피오카 간식)', '매운 음식', '말차', '커피', 'Teazzi'],
    dislikes: ['벌레', '공포 게임', '천둥번개', '민트 맛 음식'],
    streamTypes: {
      games: { title: '게임', description: '힐링 게임, 퍼즐, 스토리 게임 등.' },
      karaoke: { title: '노래 방송', description: '부를 수 있는 노래라면 뭐든 불러요.' },
      freetalk: { title: '프리토크', description: '랜덤 주제로 아무 이야기나 수다 떨어요.' },
    },
    streamEmoteAlt: (emote, title) => `${title}용 ${emote} 이모티콘`,
  },

  schedule: {
    title: '방송 스케줄',
    lead: '아래 시간은 내 시간대로 표시되니 따로 계산하지 않아도 돼요.',
    yourTimeZone: '내 시간대',
    showBaseTime: (zone) => `${zone} 시간으로 보기`,
    useMyTimeZone: '내 시간대로 보기',
    addAll: '모두 캘린더에 추가',
    weekLabel: (zone) => `향후 7일간의 방송 (${zone})`,
    today: '오늘',
    tomorrow: '내일',
    restDay: '휴방',
    liveNow: '라이브 중',
    members: '멤버 전용',
    membersOnlySuffix: ' (멤버 전용)',
    liveEnded: '방송 종료',
    thumbnailAlt: (title) => `${title} 방송 썸네일`,
    watchOn: (title, platform) => `${platform}에서 보기: ${title}`,
    addToCalendar: (title) => `${title}을(를) 캘린더에 추가`,
    note: (zone, city) =>
      `방송은 ${zone}(${city}) 시간 기준으로 계획돼요. 일정은 바뀔 수 있으니 깜짝 방송과 취소 소식은 X를 팔로우해서 확인하세요.`,
    calendarName: (name) => `${name} 방송`,
    calendarDownloaded: '캘린더 파일을 다운로드했어요.',
    reminder: (title) => `${title} 방송이 15분 후에 시작돼요`,
  },

  emotes: {
    title: '이모티콘 팩',
    lead: '채팅, Discord, 팬 프로젝트에서 자유롭게 사용할 수 있어요. 코드를 탭하면 복사돼요.',
    copied: (code) => `${code} 복사했어요`,
    imageAlt: (name, usage) => `${name} 이모티콘: ${usage}`,
    copyLabel: (label) => `${label} 코드 복사`,
    items: {
      mizuShy: { label: '부끄', usage: '얼굴이 빨개지고 수줍은 순간' },
      mizuHappyLove: { label: '러브~', usage: '좋은 분위기와 기쁜 소식' },
      mizuHuh: { label: '엥?', usage: '헷갈릴 때' },
      mizuLove: { label: '사랑', usage: '사랑해?' },
      mizuBuffer: { label: '버퍼링', usage: '렉, 로딩, 머리가 하얘질 때' },
      mizuAngry: { label: '화남', usage: '보스전과 잘못된 선택' },
      mizuHeadpat: { label: '쓰다듬기', usage: 'Mizu에게 칭찬, 위로, 쓰담쓰담' },
      mizuSmug: { label: '의기양양', usage: '채팅이 또 맞았을 때' },
      mizuSleepy: { label: '졸려', usage: '심야 채팅 분위기' },
      mizuHype: { label: '신남', usage: '결정적인 순간과 클러치 플레이' },
      mizuGG: { label: 'GG', usage: '이겨도 져도 좋은 게임이었을 때' },
      mizuUhh: { label: '으음', usage: '에휴, 몰라' },
    },
  },

  join: {
    title: 'Zutopian',
    lead: '팔로우는 무료예요. 조금 더 함께하고 싶은 분들을 위한 멤버십이 있어요.',
    platformsTitle: 'Mizu를 만날 수 있는 곳',
    platformCtaLabel: (cta, platform) => `${cta} (${platform})`,
    badgesLabel: (tiers) => `멤버십 배지: ${tiers}`,
    tier: (level) => `티어 ${level}`,
    perks: {
      membership: { title: '멤버 배지와 이모티콘', description: '함께 보기, 함께 플레이, 멤버 전용 라이브 방송.' },
      vod: { title: 'VOD Hayden James', description: '슬립콜에서 연인 롤플레이?' },
      discord: { title: 'Discord 채널', description: '디스코드에서 멤버 전용 채널과 함께 보기 채널이 열려요.' },
      info: { title: '핵심 정보를 먼저', description: 'Mizu 관련 소식을 더 빨리 받아봐요, 와우!' },
    },
  },

  faq: {
    title: '자주 묻는 질문',
    lead: '자주 묻는 질문과 그 밖의 이야기...',
    items: [
      {
        question: 'Mizu는 언제 방송하나요?',
        answer: '위에 있는 스케줄과 Discord 서버의 스케줄을 확인해 주세요.',
      },
      {
        question: 'Mizu는 어떤 방송을 하나요?',
        answer: '주로 힐링 게임, 노래 방송, 티어리스트, 프리토크, 그리고 생산적인 방송 #RABUATIF를 해요.',
      },
    ],
  },

  footer: {
    signoff: '네 최애는 무조건 나야! 알겠지?',
    socialNav: '소셜 링크',
    openInNewTab: (label, handle) => `${label}, ${handle} (새 탭에서 열림)`,
    hashtags: '해시태그',
    backToTop: '맨 위로',
    legal: (year, owner) => `© ${year} ${owner}. 팬아트와 클립은 언제나 환영이에요. 출처 표기와 링크를 남겨 주세요.`,
  },

  noscript: {
    findOnline: (name) => `온라인에서 ${name} 찾기`,
  },
};
