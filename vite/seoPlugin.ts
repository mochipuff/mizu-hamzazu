import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { HtmlTagDescriptor, IndexHtmlTransformContext, Plugin } from 'vite';
import { site } from '../src/config/site.ts';
import { getProfileFacts } from '../src/data/content.ts';
import { criticalImages, emoteNames, emoteUrl, heroImages } from '../src/data/images.ts';
import { browserLanguageMap, DEFAULT_LOCALE, LOCALE_STORAGE_KEY, LOCALES, localeFromPath, localeInfo, localePath, type Locale } from '../src/i18n/locales.ts';
import { messages } from '../src/i18n/messages/index.ts';
import { FORBIDDEN_PATH, HIDDEN_PAGES, isHiddenPage, pageFromPath, PAGES, pagePath, pageSeo, type PageId, type PublicPageId } from '../src/i18n/pages.ts';

const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
] as const;

const { seo, profile } = site;
const twitterHandle = site.platforms.find(({ id }) => id === 'x')?.handle;

const IMAGE_MIME = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg' }[seo.image.path.split('.').pop()?.toLowerCase() ?? ''];
const MAX_IMAGE_BYTES = 600 * 1024;
const EMOTE_SIZE_PX = 512;

const SITE_UTC_OFFSET = '+07:00';
const toDateTime = (isoDate: string): string => `${isoDate}T00:00:00${SITE_UTC_OFFSET}`;

const lastModified = ((): string | undefined => {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined;
  } catch {
    return undefined;
  }
})();

const HEAD_MARKER = '<!--locale-head-->';
const NOSCRIPT_MARKER = '<!--locale-noscript-->';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const compact = (entries: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(entries).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== '';
    }),
  );

const toJsonLd = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c');

const profileUrls = [...site.platforms.map(({ url }) => url), ...site.profile.socials.map(({ url }) => url)];

const officialProfiles = (t: (typeof messages)[Locale]): { label: string; url: string; purpose: string }[] => [
  ...site.platforms.map(({ id, label, url }) => ({ label, url, purpose: t.platforms[id].blurb })),
  ...site.profile.socials.map(({ label, url, purpose }) => ({ label, url, purpose: t.socials[purpose] })),
];

const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'meta', attrs });
const link = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'link', attrs });

const iconTags = (): HtmlTagDescriptor[] => [
  link({ rel: 'icon', href: '/favicon.ico', sizes: '48x48' }),
  link({ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }),
  link({ rel: 'manifest', href: '/manifest.webmanifest' }),
];

const VOID_TAGS = new Set(['meta', 'link']);

const renderAttrs = (attrs: HtmlTagDescriptor['attrs']): string =>
  Object.entries(attrs ?? {})
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([name, value]) => (value === true ? ` ${name}` : ` ${name}="${escapeHtml(String(value))}"`))
    .join('');

const renderTag = ({ tag, attrs, children }: HtmlTagDescriptor): string =>
  VOID_TAGS.has(tag) ? `<${tag}${renderAttrs(attrs)}>` : `<${tag}${renderAttrs(attrs)}>${typeof children === 'string' ? children : ''}</${tag}>`;

const localeUrl = (siteUrl: string, locale: Locale): string => `${siteUrl}${localePath(locale)}`;
const pageUrl = (siteUrl: string, locale: Locale, page: PageId): string => `${siteUrl}${pagePath(locale, page)}`;

const languageAlternates = (siteUrl: string, page: PageId): HtmlTagDescriptor[] => [
  ...LOCALES.map((locale) => link({ rel: 'alternate', hreflang: localeInfo[locale].htmlLang, href: pageUrl(siteUrl, locale, page) })),
  link({ rel: 'alternate', hreflang: 'x-default', href: page === 'home' ? `${siteUrl}/` : pageUrl(siteUrl, DEFAULT_LOCALE, page) }),
];

function buildJsonLd(siteUrl: string, locale: Locale): string {
  const t = messages[locale];
  const url = localeUrl(siteUrl, locale);
  const id = (fragment: string) => `${url}#${fragment}`;
  const personId = `${siteUrl}/#person`;
  const image = siteUrl ? `${siteUrl}${seo.image.path}` : undefined;

  const person = compact({
    '@type': 'Person',
    '@id': personId,
    name: site.name,
    alternateName: profile.alternateNames,
    description: t.profile.bio,
    jobTitle: t.profile.jobTitle,
    nationality: { '@type': 'Country', name: t.profile.nationality },
    height: { '@type': 'QuantitativeValue', value: profile.heightCm, unitCode: 'CMT' },
    knowsAbout: t.profile.topics,
    knowsLanguage: t.profile.languages,
    affiliation: !profile.independent && t.profile.agency ? { '@type': 'Organization', name: t.profile.agency } : undefined,
    sameAs: profileUrls,
    url: siteUrl ? url : undefined,
    image,
  });

  const emoteGallery = siteUrl
    ? [
        compact({
          '@type': 'ImageGallery',
          '@id': id('emotes'),
          name: t.emotes.title,
          inLanguage: localeInfo[locale].htmlLang,
          isPartOf: { '@id': id('website') },
          hasPart: emoteNames.map((name) => {
            const { label, usage } = t.emotes.items[name];
            return compact({
              '@type': 'ImageObject',
              contentUrl: `${siteUrl}${emoteUrl(name)}`,
              name: label,
              description: t.emotes.imageAlt(label, usage),
              encodingFormat: 'image/webp',
              width: EMOTE_SIZE_PX,
              height: EMOTE_SIZE_PX,
              creator: profile.illustrator ? { '@type': 'Person', name: profile.illustrator } : undefined,
              copyrightHolder: { '@id': personId },
              creditText: site.name,
            });
          }),
        }),
      ]
    : [];

  const graph = [
    compact({
      '@type': 'WebSite',
      '@id': id('website'),
      name: site.name,
      description: t.seo.description,
      inLanguage: localeInfo[locale].htmlLang,
      url: siteUrl ? url : undefined,
      publisher: { '@id': personId },
    }),
    compact({
      '@type': 'ProfilePage',
      '@id': id('profile'),
      name: t.seo.title,
      description: t.seo.description,
      inLanguage: localeInfo[locale].htmlLang,
      dateCreated: toDateTime(profile.debut),
      dateModified: lastModified && toDateTime(lastModified),
      isPartOf: { '@id': id('website') },
      mainEntity: { '@id': personId },
      primaryImageOfPage: image ? { '@type': 'ImageObject', url: image, width: seo.image.width, height: seo.image.height, caption: t.seo.imageAlt } : undefined,
    }),
    person,
    {
      '@type': 'FAQPage',
      '@id': id('faq'),
      mainEntity: t.faq.items.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
    ...emoteGallery,
  ];

  return toJsonLd({ '@context': 'https://schema.org', '@graph': graph });
}

function buildBreadcrumbJsonLd(siteUrl: string, locale: Locale, page: Exclude<PublicPageId, 'home'>): string {
  const t = messages[locale];
  const trail = [
    { name: site.name, url: pageUrl(siteUrl, locale, 'home') },
    { name: t.nav[page], url: pageUrl(siteUrl, locale, page) },
  ];
  return toJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(({ name, url }, index) => ({ '@type': 'ListItem', position: index + 1, name, item: url })),
  });
}

function buildHead(siteUrl: string, locale: Locale, page: PageId): HtmlTagDescriptor[] {
  const t = messages[locale];
  const { title, description } = pageSeo(t, page);
  const isHome = page === 'home';
  const canonical = pageUrl(siteUrl, locale, page);
  const tags: HtmlTagDescriptor[] = [
    { tag: 'title', children: escapeHtml(title) },
    meta({ name: 'description', content: description }),
    meta({ name: 'keywords', content: t.seo.keywords.join(', ') }),
    meta({ name: 'robots', content: isHiddenPage(page) ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' }),
    meta({ name: 'theme-color', content: site.themeColor }),
    meta({ name: 'author', content: site.name }),
    meta({ name: 'application-name', content: site.name }),
    meta({ name: 'referrer', content: 'strict-origin-when-cross-origin' }),
    meta({ property: 'og:type', content: isHome ? 'profile' : 'website' }),
    meta({ property: 'og:site_name', content: site.name }),
    meta({ property: 'og:title', content: title }),
    meta({ property: 'og:description', content: description }),
    meta({ property: 'og:locale', content: localeInfo[locale].ogLocale }),
    ...LOCALES.filter((other) => other !== locale).map((other) => meta({ property: 'og:locale:alternate', content: localeInfo[other].ogLocale })),
    ...(isHome ? [meta({ property: 'profile:username', content: site.name })] : []),
    meta({ name: 'twitter:card', content: 'summary_large_image' }),
    meta({ name: 'twitter:title', content: title }),
    meta({ name: 'twitter:description', content: description }),
    ...iconTags(),
    link({ rel: 'alternate', type: 'text/plain', href: `${localePath(locale)}llms.txt`, title: 'Summary for AI assistants' }),
    ...(page === 'home'
      ? [{ tag: 'script', attrs: { type: 'application/ld+json' }, children: buildJsonLd(siteUrl, locale) }]
      : siteUrl && !isHiddenPage(page)
        ? [{ tag: 'script', attrs: { type: 'application/ld+json' }, children: buildBreadcrumbJsonLd(siteUrl, locale, page) }]
        : []),
    ...criticalImages.map((href) => link({ rel: 'preload', as: 'image', type: 'image/webp', href, fetchpriority: 'high' })),
  ];

  if (twitterHandle) {
    tags.push(meta({ name: 'twitter:site', content: twitterHandle }), meta({ name: 'twitter:creator', content: twitterHandle }));
  }

  if (siteUrl && !isHiddenPage(page)) {
    const imageUrl = `${siteUrl}${seo.image.path}`;
    tags.push(
      link({ rel: 'canonical', href: canonical }),
      ...languageAlternates(siteUrl, page),
      meta({ property: 'og:url', content: canonical }),
      meta({ property: 'og:image', content: imageUrl }),
      meta({ property: 'og:image:secure_url', content: imageUrl }),
      ...(IMAGE_MIME ? [meta({ property: 'og:image:type', content: IMAGE_MIME })] : []),
      meta({ property: 'og:image:width', content: String(seo.image.width) }),
      meta({ property: 'og:image:height', content: String(seo.image.height) }),
      meta({ property: 'og:image:alt', content: t.seo.imageAlt }),
      meta({ name: 'twitter:image', content: imageUrl }),
      meta({ name: 'twitter:image:alt', content: t.seo.imageAlt }),
    );
  }

  return tags;
}

const FONT_FILE = /(mochiy-pop-one|zen-maru-gothic)-latin-\d+-normal.*\.woff2$/;

function buildPreloads(bundle: IndexHtmlTransformContext['bundle']): HtmlTagDescriptor[] {
  const fonts = Object.keys(bundle ?? {}).filter((file) => FONT_FILE.test(file));
  return fonts.map((file): HtmlTagDescriptor => ({ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: true }, injectTo: 'head' }));
}

const facts = (locale: Locale): Array<[string, string]> => {
  const t = messages[locale];
  const { labels } = t.profile;
  return [
    ...getProfileFacts(locale, t).map(({ label, value }): [string, string] => [label, value]),
    [labels.nationality, t.profile.nationality],
    [labels.languages, t.profile.languages.join(', ')],
    [labels.agency, t.profile.agency],
    [labels.illustrator, profile.illustrator],
    [labels.riggerOrModeler, profile.riggerOrModeler],
  ];
};

const publishableFacts = (locale: Locale): Array<[string, string]> => facts(locale).filter(([, value]) => value);

function buildNoscript(locale: Locale): string {
  const t = messages[locale];
  const links = officialProfiles(t).map(
    ({ label, url, purpose }) => `<li><a href="${escapeHtml(url)}" rel="me noopener">${escapeHtml(label)}</a>: ${escapeHtml(purpose)}</li>`,
  );

  return `<noscript>
<main style="max-width:40rem;margin:4rem auto;padding:0 1.5rem;font-family:system-ui,sans-serif;line-height:1.6">
  <h1>${escapeHtml(site.name)}</h1>
  <p>${escapeHtml(t.profile.bio)}</p>
  <h2>${escapeHtml(t.about.profileTitle)}</h2>
  <dl>${publishableFacts(locale)
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join('')}</dl>
  <h2>${escapeHtml(t.noscript.findOnline(site.nickname))}</h2>
  <ul>${links.join('')}</ul>
  <h2>${escapeHtml(t.footer.hashtags)}</h2>
  <ul>${site.hashtags.map(({ tag, purpose }) => `<li>${escapeHtml(tag)}: ${escapeHtml(t.hashtags[purpose])}</li>`).join('')}</ul>
  <h2>${escapeHtml(t.faq.title)}</h2>
  ${t.faq.items.map(({ question, answer }) => `<h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p>`).join('')}
</main>
</noscript>`;
}

function fillTemplate(template: string, locale: Locale, siteUrl: string, page: PageId): string {
  const { loader } = messages[locale];
  const values: Record<string, string> = {
    htmlLang: localeInfo[locale].htmlLang,
    loaderTitle: escapeHtml(loader.title),
    loaderNote: escapeHtml(loader.note),
    loaderProgress: escapeHtml(loader.progress),
  };

  return template
    .replace(HEAD_MARKER, () => buildHead(siteUrl, locale, page).map(renderTag).join('\n    '))
    .replace(NOSCRIPT_MARKER, () => buildNoscript(locale))
    .replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
}

const REDIRECT_SCRIPT = 'redirect.js';

function buildRedirectScript(): string {
  return `(function(){
  var map=${JSON.stringify(Object.fromEntries(browserLanguageMap))},locales=${JSON.stringify(LOCALES)},locale=null;
  try{locale=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)})}catch(e){}
  if(locales.indexOf(locale)<0){
    locale=null;
    var languages=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];
    for(var i=0;i<languages.length&&!locale;i++)locale=map[String(languages[i]).toLowerCase().split('-')[0]]||null;
  }
  location.replace('/'+(locale||${JSON.stringify(DEFAULT_LOCALE)})+'/'+location.search+location.hash);
})();
`;
}

function buildRootPage(siteUrl: string): string {
  const { title, description } = messages[DEFAULT_LOCALE].seo;

  const rootTags: HtmlTagDescriptor[] = [
    ...iconTags(),
    ...(siteUrl
      ? [
          link({ rel: 'canonical', href: `${siteUrl}/` }),
          ...languageAlternates(siteUrl, 'home'),
          {
            tag: 'script',
            attrs: { type: 'application/ld+json' },
            children: toJsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, alternateName: profile.alternateNames, url: `${siteUrl}/` }),
          },
        ]
      : []),
  ];

  const languageLinks = LOCALES.map(
    (locale) => `<li><a href="${localePath(locale)}" hreflang="${localeInfo[locale].htmlLang}" lang="${localeInfo[locale].htmlLang}">${escapeHtml(localeInfo[locale].label)}</a></li>`,
  );

  return `<!doctype html>
<html lang="${localeInfo[DEFAULT_LOCALE].htmlLang}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index, follow">
    ${rootTags.map(renderTag).join('\n    ')}
    <script src="/${REDIRECT_SCRIPT}"></script>
    <noscript><meta http-equiv="refresh" content="0;url=${localePath(DEFAULT_LOCALE)}"></noscript>
  </head>
  <body>
    <main style="max-width:40rem;margin:4rem auto;padding:0 1.5rem;font-family:system-ui,sans-serif;line-height:1.6">
      <h1>${escapeHtml(site.name)}</h1>
      <ul>${languageLinks.join('')}</ul>
    </main>
  </body>
</html>
`;
}

function buildRobots(siteUrl: string): string {
  const crawlerRule = seo.allowAiCrawlers ? 'Allow: /' : 'Disallow: /';
  return [
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_CRAWLERS.flatMap((bot) => [`User-agent: ${bot}`, crawlerRule, '']),
    ...(siteUrl ? [`Sitemap: ${siteUrl}/sitemap.xml`, `Sitemap: ${siteUrl}/sitemap-images.xml`] : []),
    '',
  ].join('\n');
}

function buildLlmsTxt(siteUrl: string, locale: Locale): string {
  const t = messages[locale];
  const lines = [
    `# ${site.name}`,
    '',
    `> ${t.profile.tagline} ${t.profile.bio}`,
    '',
    '## Facts',
    ...publishableFacts(locale).map(([label, value]) => `- ${label}: ${value}`),
    '',
    '## Official profiles',
    ...officialProfiles(t).map(({ label, url, purpose }) => `- [${label}](${url}): ${purpose}`),
    '',
    '## Hashtags',
    ...site.hashtags.map(({ tag, purpose }) => `- ${tag}: ${t.hashtags[purpose]}`),
    '',
    '## FAQ',
    ...t.faq.items.map(({ question, answer }) => `- ${question} ${answer}`),
    ...(siteUrl ? ['', '## Website', ...LOCALES.map((other) => `- [${site.name} (${localeInfo[other].label})](${localeUrl(siteUrl, other)})`)] : []),
    '',
  ];
  return lines.join('\n');
}

const sitemapImage = (siteUrl: string, path: string): string => `    <image:image><image:loc>${siteUrl}${path}</image:loc></image:image>`;

const sitemapImagePaths = [seo.image.path, ...Object.values(heroImages), ...emoteNames.map((name) => emoteUrl(name))];

function buildImageSitemap(siteUrl: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...LOCALES.flatMap((locale) => [
      '  <url>',
      `    <loc>${pageUrl(siteUrl, locale, 'home')}</loc>`,
      ...sitemapImagePaths.map((path) => sitemapImage(siteUrl, path)),
      '  </url>',
    ]),
    '</urlset>',
    '',
  ].join('\n');
}

function buildSitemap(siteUrl: string): string {
  const alternates = (page: PageId): string[] => [
    ...LOCALES.map((locale) => `    <xhtml:link rel="alternate" hreflang="${localeInfo[locale].htmlLang}" href="${pageUrl(siteUrl, locale, page)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${page === 'home' ? `${siteUrl}/` : pageUrl(siteUrl, DEFAULT_LOCALE, page)}"/>`,
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...PAGES.flatMap((page) =>
      LOCALES.flatMap((locale) => [
        '  <url>',
        `    <loc>${pageUrl(siteUrl, locale, page)}</loc>`,
        ...(lastModified ? [`    <lastmod>${lastModified}</lastmod>`] : []),
        ...alternates(page),
        '  </url>',
      ]),
    ),
    '</urlset>',
    '',
  ].join('\n');
}

function checkShareImage(warn: (message: string) => void): void {
  const file = join(process.cwd(), 'public', seo.image.path);
  if (!existsSync(file)) return warn(`${seo.image.path} is missing from public/, so link previews will have no image.`);

  const { size } = statSync(file);
  if (size > MAX_IMAGE_BYTES) warn(`${seo.image.path} is ${Math.round(size / 1024)} KB. Keep it under ${MAX_IMAGE_BYTES / 1024} KB so WhatsApp and Facebook accept it.`);

  const bytes = readFileSync(file);
  const isPng = bytes.subarray(1, 4).toString('ascii') === 'PNG';
  if (!isPng) return;
  const [width, height] = [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  if (width !== seo.image.width || height !== seo.image.height) {
    warn(`${seo.image.path} is ${width}x${height}, but site.ts declares ${seo.image.width}x${seo.image.height}.`);
  }
}

function checkIcons(warn: (message: string) => void): void {
  for (const name of ['favicon.svg', 'manifest.webmanifest']) {
    if (!existsSync(join(process.cwd(), 'public', name))) warn(`${name} is missing from public/, but every page links to it.`);
  }

  const file = join(process.cwd(), 'public', 'favicon.ico');
  if (!existsSync(file)) return warn('favicon.ico is missing from public/, so Google has no favicon to show for the site.');

  const bytes = readFileSync(file);
  if (bytes.readUInt16LE(2) !== 1) return warn('public/favicon.ico is not a real ICO file (a renamed PNG does not count).');

  const sizes = Array.from({ length: bytes.readUInt16LE(4) }, (_, index) => bytes[6 + index * 16] || 256);
  if (!sizes.some((size) => size % 48 === 0)) warn(`public/favicon.ico only holds ${sizes.join(', ')} px images. Google skips favicons that are not a multiple of 48 px, so add a 48x48 image to it.`);
}

export function seoPlugin(rawSiteUrl: string): Plugin {
  const siteUrl = rawSiteUrl.trim().replace(/\/+$/, '');
  let isBuild = false;
  let outDir = '';

  return {
    name: 'mizu:seo',
    configResolved(config) {
      isBuild = config.command === 'build';
      outDir = resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: (html, { bundle, originalUrl }) => {
      const tags = buildPreloads(bundle);
      if (isBuild) return { html, tags };

      const { pathname } = new URL(originalUrl ?? '/', 'http://localhost');
      const locale = localeFromPath(pathname) ?? DEFAULT_LOCALE;
      return { html: fillTemplate(html, locale, siteUrl, pageFromPath(pathname)), tags };
    },
    generateBundle() {
      const emit = (fileName: string, source: string) => this.emitFile({ type: 'asset', fileName, source });

      checkShareImage((message) => this.warn(message));
      checkIcons((message) => this.warn(message));
      emit('robots.txt', buildRobots(siteUrl));
      emit('llms.txt', buildLlmsTxt(siteUrl, DEFAULT_LOCALE));
      LOCALES.forEach((locale) => emit(`${locale}/llms.txt`, buildLlmsTxt(siteUrl, locale)));

      if (!siteUrl) {
        this.warn('VITE_SITE_URL is not set (and no Vercel production domain was found): canonical, hreflang, Open Graph image URLs and sitemap.xml were skipped.');
        return;
      }
      emit('sitemap.xml', buildSitemap(siteUrl));
      emit('sitemap-images.xml', buildImageSitemap(siteUrl));
    },
    closeBundle() {
      if (!isBuild) return;

      const rootFile = join(outDir, 'index.html');
      const template = readFileSync(rootFile, 'utf8');
      if (![HEAD_MARKER, NOSCRIPT_MARKER].every((marker) => template.includes(marker))) {
        throw new Error(`mizu:seo: ${rootFile} has lost the ${HEAD_MARKER} or ${NOSCRIPT_MARKER} marker from index.html, so the language pages cannot be generated.`);
      }

      for (const locale of LOCALES) {
        for (const page of [...PAGES, ...HIDDEN_PAGES]) {
          const folder = join(outDir, pagePath(locale, page));
          mkdirSync(folder, { recursive: true });
          writeFileSync(join(folder, 'index.html'), fillTemplate(template, locale, siteUrl, page));
        }
      }

      const forbiddenFolder = join(outDir, FORBIDDEN_PATH);
      mkdirSync(forbiddenFolder, { recursive: true });
      writeFileSync(join(forbiddenFolder, 'index.html'), fillTemplate(template, DEFAULT_LOCALE, siteUrl, 'forbidden'));

      writeFileSync(rootFile, buildRootPage(siteUrl));
      writeFileSync(join(outDir, REDIRECT_SCRIPT), buildRedirectScript());
    },
  };
}
