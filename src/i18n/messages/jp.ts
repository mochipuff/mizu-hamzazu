import type { Messages } from './index.ts';

export const jp: Messages = {
  skipLink: 'コンテンツへスキップ',

  common: {
    copyBlocked: 'このブラウザではコピーがブロックされています。',
    secretCode: '隠しコード発見！紙吹雪の嵐が解放されました。',
  },

  loader: {
    title: '読み込み中',
    note: 'Mizuを起こしています…',
    progress: '読み込みの進行状況',
  },

  header: {
    brandLabel: (name) => `${name}、ページの先頭へ戻る`,
    brandHomeLabel: (name) => `${name}、ホームページへ`,
    primaryNav: 'メイン',
    mobileNav: 'モバイル',
    soundOn: '効果音をオンにする',
    soundOff: '効果音をオフにする',
    openMenu: 'メニューを開く',
    closeMenu: 'メニューを閉じる',
    language: '言語',
  },

  nav: {
    about: '紹介',
    schedule: 'スケジュール',
    emotes: 'エモート',
    join: '参加',
    faq: 'FAQ',
    supports: 'サポート',
  },

  seo: {
    title: 'Mizu Hamzazu | インドネシアのハムスターVTuber',
    description: 'インドネシア出身のハムスターVTuber「Mizu Hamzazu」の公式サイト。フリートーク・まったりゲーム・歌枠の配信スケジュール、エモート、Zutopianコミュニティをご案内。',
    imageAlt: 'Mizu Hamzazu、インドネシアのバーチャルYouTuber',
    keywords: ['Mizu Hamzazu', 'インドネシア VTuber', 'バーチャルYouTuber', 'ハムスター VTuber', 'Zutopian', 'まったりゲーム', '歌枠'],
  },

  supports: {
    seo: {
      title: 'サポート | Mizu Hamzazu',
      description: 'Mizu Hamzazuへの支援TOP10と、視聴者からのやさしいメッセージ。ありがとう、Zutopian！',
    },
    marquee: ['ありがとう、Zutopian！', 'ひとつひとつの差し入れが車輪を回してくれる', 'Mizu Hamzazu', 'メッセージは愛を込めて貼り出し中'],
    cover: {
      sticker: 'ありがとう！',
      title: 'サポート',
      lead: 'Mizuの車輪を回し続けてくれる、差し入れとメッセージのスクラップブック。ありがとう、Zutopian！',
      waysLabel: '応援する方法',
    },
    donations: {
      title: '支援 TOP10',
      lead: 'これまでにMizuへ贈られた、いちばん大きな差し入れ。',
      listLabel: '支援 TOP10',
      rank: (rank) => `${rank}位`,
      via: (platform) => `${platform}経由`,
    },
    notes: {
      title: '視聴者のメッセージ',
      lead: '視聴者から届いた小さなメッセージを、Mizuのために貼り出しました。',
      listLabel: '視聴者からのメッセージ',
      from: (name) => `${name}より`,
      inviteTitle: 'あなたのメッセージもここに',
      inviteLead: '差し入れにメッセージを添えて送ると、この壁に貼られるかもしれません。',
      inviteCta: '差し入れを送る',
    },
  },

  profile: {
    tagline: 'インドネシアのハムスターVTuber。フリートーク、まったりゲーム、歌枠。',
    bio: 'Mizu Hamzazuは、2021年11月1日にデビューしたインドネシア出身のバーチャルYouTuber（VTuber）。ハムスターの女の子で、YouTubeとTwitchでフリートーク、まったりゲーム、歌枠、そして生産的な配信「#RABUATIF」をお届けしています。ファンの「Zutopian」とは、Discordサーバー「Hamzazu Palace」で交流しています。',
    species: 'ハムスター',
    nationality: 'インドネシア',
    agency: '個人勢',
    jobTitle: 'バーチャルYouTuber',
    languages: ['インドネシア語', '英語'],
    topics: ['バーチャルYouTuber', 'レビュー', '歌枠', 'フリートーク配信', 'コラボ配信'],
    labels: {
      species: '種族',
      birthday: '誕生日',
      height: '身長',
      debut: 'デビュー日',
      fanName: 'ファンネーム',
      nationality: '国籍',
      languages: '話す言語',
      agency: '所属',
      illustrator: 'イラスト',
      riggerOrModeler: 'リガー・モデラー',
    },
  },

  platforms: {
    youtube: { cta: 'YouTubeで見る', blurb: 'フリートークとゲーム配信。' },
    twitch: { cta: 'Twitchで見る', blurb: '英語でのフリートーク配信。' },
    x: { cta: 'Xをフォロー', blurb: 'Mizuのあれこれ。' },
    discord: { cta: 'Discordに参加', blurb: '他のZutopianとおしゃべり。' },
  },

  hashtags: {
    general: '日常の投稿',
    fanart: 'ファンアート',
    live: 'ライブ配信',
    meme: 'ミーム投稿',
    clips: '切り抜き・ハイライト',
  },

  socials: {
    instagram: '写真と近況',
    tiktok: 'ショート動画',
    trakteer: '応援・投げ銭',
    linktree: 'リンクまとめ',
    tako: 'Takoで応援',
    membership: 'Zutopianメンバーシップに参加',
  },

  marquee: [
    '会いたかった？Discordでおしゃべりしよ！',
    'TrakteerでMizuを応援してね',
    'メンバーシップ、入っちゃう？',
    'Mizu Hamzazu',
    'Zutopian',
    'ちょっと待って、来ないの？',
  ],

  hero: {
    tag: 'バーチャルYouTuber',
    greeting: 'Cihuyyy！',
    iAm: (name) => `${name}だよ！`,
    intro:
      'Mizu Hamzazuは、はぐれてしまった弟妹を探すという使命を胸に、異世界からやってきたハムスター。永遠の18歳の彼女は、いま新しい旅のページをめくろうとしています。',
    liveNow: 'ただいま配信中',
    nextStream: '次の配信',
    joinStream: '配信に参加',
    startsIn: (days, hours, minutes) => `開始まであと${days}日${hours}時間${minutes}分`,
    units: { day: '日', hour: '時間', minute: '分' },
    spinHint: 'ホイールを回してみて。反応してくれるよ。',
    welcome: 'やっほー、Zutopian！',
    pokeLabel: (pokes) => `ホイールを回してMizuをつつく。${pokes}回つつきました。`,
    pokeLines: ['これはプレースホルダー1です', 'これはプレースホルダー2です'],
    pokeMilestones: {
      10: 'もうやめた？',
      25: 'いたいってば',
      50: 'うぅぅぅ…目が回る…',
    },
  },

  about: {
    title: 'Mizuを知ろう',
    lead: 'もっと私のことを知ってね…',
    storyTitle: '自己紹介',
    profileTitle: 'プロフィール',
    likesTitle: '好きなもの',
    dislikesTitle: '苦手なもの',
    streamsTitle: '配信内容',
    lore: ['それ、誰のお父さん？Mizu', 'ザ・GOAT。'],
    likes: ['Fikk', 'Valorant', 'Minecraft', 'トモダチコレクション', 'お寿司', 'Cimol（揚げタピオカ団子）', '辛いもの', '抹茶', 'コーヒー', 'Teazzi'],
    dislikes: ['虫', 'ホラーゲーム', '雷', 'ミント味の食べ物'],
    streamTypes: {
      games: { title: 'ゲーム', description: 'まったり系ゲーム、パズル、ストーリーゲームなど。' },
      karaoke: { title: '歌枠', description: '歌える曲なら何でも歌っちゃう。' },
      freetalk: { title: 'フリートーク', description: 'ランダムな話題で何でもおしゃべり。' },
    },
    streamEmoteAlt: (emote, title) => `${title}の${emote}エモート`,
  },

  schedule: {
    title: '配信スケジュール',
    lead: '下の時間はお使いのタイムゾーンで表示されるので、時差の計算は不要です。',
    yourTimeZone: 'タイムゾーン',
    showBaseTime: (zone) => `${zone}の時間で表示`,
    useMyTimeZone: '自分のタイムゾーンに戻す',
    addAll: 'すべてカレンダーに追加',
    weekLabel: (zone) => `今後7日間の配信（${zone}）`,
    today: '今日',
    tomorrow: '明日',
    restDay: 'お休み',
    loadFailed: 'スケジュールを読み込めませんでした。しばらくしてからもう一度お試しください。',
    liveNow: '配信中',
    members: 'メンバー限定',
    membersOnlySuffix: '（メンバー限定）',
    liveEnded: '配信終了',
    thumbnailAlt: (title) => `${title}の配信サムネイル`,
    watchOn: (title, platform) => `${platform}で見る：${title}`,
    addToCalendar: (title) => `${title}をカレンダーに追加`,
    note: (zone, city) =>
      `配信は${zone}（${city}）の時間で予定されています。予定は変更されることがあるので、突発配信や中止のお知らせはXをフォローしてチェックしてね。`,
    calendarName: (name) => `${name} 配信`,
    calendarDownloaded: 'カレンダーファイルをダウンロードしました。',
    reminder: (title) => `${title}があと15分で始まります`,
  },

  emotes: {
    title: 'エモートパック',
    lead: 'チャット、Discord、ファン活動で自由に使えます。コードをタップするとコピーできます。',
    copied: (code) => `${code}をコピーしました`,
    imageAlt: (name, usage) => `${name}エモート：${usage}`,
    copyLabel: (label) => `${label}のコードをコピー`,
    items: {
      mizuShy: { label: 'てれ', usage: '照れたり恥ずかしがったりする時' },
      mizuHappyLove: { label: 'らぶ～', usage: 'いい雰囲気やうれしいニュースに' },
      mizuHuh: { label: 'えっ？', usage: '混乱した時' },
      mizuLove: { label: 'らぶ', usage: '大好きだよ？' },
      mizuBuffer: { label: 'バッファ', usage: 'ラグ、読み込み、頭が真っ白な時' },
      mizuAngry: { label: 'おこ', usage: 'ボス戦や判断ミスの時' },
      mizuHeadpat: { label: 'なでなで', usage: 'Mizuをほめたり、なぐさめたり、なでたりする時' },
      mizuSmug: { label: 'どや', usage: 'チャットがまた正しかった時' },
      mizuSleepy: { label: 'ねむい', usage: '深夜のチャットのノリ' },
      mizuHype: { label: 'もりあがり', usage: 'ここぞという場面やクラッチプレイ' },
      mizuGG: { label: 'GG', usage: '勝っても負けても、いい試合だった時' },
      mizuUhh: { label: 'うーん', usage: 'もういいや' },
    },
  },

  join: {
    title: 'Zutopian',
    lead: 'フォローは無料。もう少し応援したい人のために、メンバーシップがあります。',
    platformsTitle: 'Mizuはここにいるよ',
    platformCtaLabel: (cta, platform) => `${cta}（${platform}）`,
    badgesLabel: (tiers) => `メンバーシップバッジ：${tiers}`,
    tier: (level) => `ティア${level}`,
    perks: {
      membership: { title: 'メンバーバッジとエモート', description: '同時視聴会、いっしょにプレイ、メンバー限定ライブ配信。' },
      vod: { title: 'VOD Hayden James', description: 'スリープコールで恋人ロールプレイ？' },
      discord: { title: 'Discordチャンネル', description: 'Discordでメンバー限定チャンネルや同時視聴を解放。' },
      info: { title: '一番乗りで最新情報', description: 'Mizuの情報をいち早くゲット、すごい！' },
    },
  },

  faq: {
    title: 'よくある質問',
    lead: 'よく聞かれることなど…',
    items: [
      {
        question: 'Mizuはいつ配信しますか？',
        answer: '上のスケジュールと、Discordサーバーのスケジュールをご確認ください。',
      },
      {
        question: 'Mizuは何を配信しますか？',
        answer: '主にまったりゲーム、歌枠、ティアリスト、フリートーク、そして生産的な配信「#RABUATIF」です。',
      },
    ],
  },

  footer: {
    signoff: '推しはぜったい私だよ？ね？',
    socialNav: 'ソーシャルリンク',
    openInNewTab: (label, handle) => `${label}、${handle}（新しいタブで開きます）`,
    hashtags: 'ハッシュタグ',
    backToTop: 'ページの先頭へ',
    legal: (year, owner) => `© ${year} ${owner}. ファンアートや切り抜きは大歓迎です。クレジット表記とリンクをお願いします。`,
  },

  noscript: {
    findOnline: (name) => `${name}をオンラインで探す`,
  },
};
