import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { HtmlTagDescriptor, IndexHtmlTransformContext, Plugin } from 'vite';
import { getContactEmail, isFilled, profileUrls, site } from '../src/config/site.ts';
import { getOfficialProfiles, getProfileFacts } from '../src/data/content.ts';
import { emoteNames } from '../src/data/emotes.ts';
import { heroDefaultMood, heroImages } from '../src/data/hero.ts';
import { browserLanguageMap, localeFromPath } from '../src/i18n/detect.ts';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, LOCALES, localeInfo, localePath, type Locale } from '../src/i18n/locales.ts';
import { messages } from '../src/i18n/messages/index.ts';
import { emoteUrl } from '../src/lib/assets.ts';

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

const IMAGE_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }[seo.image.path.split('.').pop()?.toLowerCase() ?? ''];
const MAX_IMAGE_BYTES = 600 * 1024;

// Google requires a full ISO 8601 datetime with a UTC offset. site.scheduleTimeZone (Asia/Jakarta) has no DST, so the offset is fixed.
const SITE_UTC_OFFSET = '+07:00';
const toDateTime = (isoDate: string): string | undefined => (isFilled(isoDate) ? `${isoDate}T00:00:00${SITE_UTC_OFFSET}` : undefined);

// index.html carries these markers; every language page is that file with the markers filled in.
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

const publishable = (values: string[]): string[] => values.filter(isFilled);

const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'meta', attrs });
const link = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'link', attrs });

const VOID_TAGS = new Set(['meta', 'link']);

const renderAttrs = (attrs: HtmlTagDescriptor['attrs']): string =>
  Object.entries(attrs ?? {})
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([name, value]) => (value === true ? ` ${name}` : ` ${name}="${escapeHtml(String(value))}"`))
    .join('');

/** `children` is inserted as is: callers escape text, and JSON-LD must stay raw. */
const renderTag = ({ tag, attrs, children }: HtmlTagDescriptor): string =>
  VOID_TAGS.has(tag) ? `<${tag}${renderAttrs(attrs)}>` : `<${tag}${renderAttrs(attrs)}>${typeof children === 'string' ? children : ''}</${tag}>`;

const pageUrl = (siteUrl: string, locale: Locale): string => `${siteUrl}${localePath(locale)}`;

function buildJsonLd(siteUrl: string, locale: Locale): string {
  const t = messages[locale];
  const url = pageUrl(siteUrl, locale);
  const id = (fragment: string) => `${url}#${fragment}`;
  const image = siteUrl ? `${siteUrl}${seo.image.path}` : undefined;

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
    knowsLanguage: t.profile.languages,
    affiliation: !profile.independent && isFilled(t.profile.agency) ? { '@type': 'Organization', name: t.profile.agency } : undefined,
    sameAs: profileUrls(),
    url: siteUrl ? url : undefined,
    image,
  });

  const graph = [
    compact({
      '@type': 'WebSite',
      '@id': id('website'),
      name: site.name,
      description: t.seo.description,
      inLanguage: localeInfo[locale].htmlLang,
      url: siteUrl ? url : undefined,
      publisher: { '@id': id('person') },
    }),
    compact({
      '@type': 'ProfilePage',
      '@id': id('profile'),
      name: t.seo.title,
      description: t.seo.description,
      inLanguage: localeInfo[locale].htmlLang,
      dateCreated: toDateTime(profile.debut),
      isPartOf: { '@id': id('website') },
      mainEntity: { '@id': id('person') },
      primaryImageOfPage: image ? { '@type': 'ImageObject', url: image, width: seo.image.width, height: seo.image.height } : undefined,
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
  ];

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

function buildHead(siteUrl: string, locale: Locale): HtmlTagDescriptor[] {
  const t = messages[locale];
  const home = pageUrl(siteUrl, locale);
  const tags: HtmlTagDescriptor[] = [
    { tag: 'title', children: escapeHtml(t.seo.title) },
    meta({ name: 'description', content: t.seo.description }),
    meta({ name: 'keywords', content: t.seo.keywords.join(', ') }),
    meta({ name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' }),
    meta({ name: 'theme-color', content: site.themeColor }),
    meta({ name: 'author', content: site.name }),
    meta({ name: 'application-name', content: site.name }),
    meta({ name: 'referrer', content: 'strict-origin-when-cross-origin' }),
    meta({ property: 'og:type', content: 'profile' }),
    meta({ property: 'og:site_name', content: site.name }),
    meta({ property: 'og:title', content: t.seo.title }),
    meta({ property: 'og:description', content: t.seo.description }),
    meta({ property: 'og:locale', content: localeInfo[locale].ogLocale }),
    ...LOCALES.filter((other) => other !== locale).map((other) => meta({ property: 'og:locale:alternate', content: localeInfo[other].ogLocale })),
    meta({ property: 'profile:username', content: site.name }),
    meta({ name: 'twitter:card', content: 'summary_large_image' }),
    meta({ name: 'twitter:title', content: t.seo.title }),
    meta({ name: 'twitter:description', content: t.seo.description }),
    link({ rel: 'alternate', type: 'text/plain', href: `${localePath(locale)}llms.txt`, title: 'Summary for AI assistants' }),
    { tag: 'script', attrs: { type: 'application/ld+json' }, children: buildJsonLd(siteUrl, locale) },
  ];

  if (twitterHandle) {
    tags.push(meta({ name: 'twitter:site', content: twitterHandle }), meta({ name: 'twitter:creator', content: twitterHandle }));
  }

  if (siteUrl) {
    const imageUrl = `${siteUrl}${seo.image.path}`;
    tags.push(
      link({ rel: 'canonical', href: home }),
      ...LOCALES.map((other) => link({ rel: 'alternate', hreflang: localeInfo[other].htmlLang, href: pageUrl(siteUrl, other) })),
      link({ rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}/` }),
      meta({ property: 'og:url', content: home }),
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

/** Lets the browser start the above-the-fold images and fonts while the JS bundle is still downloading. Same for every language. */
function buildPreloads(bundle: IndexHtmlTransformContext['bundle']): HtmlTagDescriptor[] {
  const fonts = Object.keys(bundle ?? {}).filter((file) => FONT_FILE.test(file));
  const images = [...Object.values(heroImages), emoteUrl(heroDefaultMood)];
  return [
    ...fonts.map((file): HtmlTagDescriptor => ({ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: true }, injectTo: 'head' })),
    ...images.map((href): HtmlTagDescriptor => ({ tag: 'link', attrs: { rel: 'preload', as: 'image', type: 'image/webp', href, fetchpriority: 'high' }, injectTo: 'head' })),
  ];
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

const publishableFacts = (locale: Locale): Array<[string, string]> => facts(locale).filter(([, value]) => isFilled(value));

function buildNoscript(locale: Locale): string {
  const t = messages[locale];
  const email = getContactEmail();
  const links = getOfficialProfiles(t).map(
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
  ${email ? `<p>${escapeHtml(t.noscript.business)}: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>` : ''}
</main>
</noscript>`;
}

/** Turns the index.html template into the page for one language. */
function fillTemplate(template: string, locale: Locale, siteUrl: string): string {
  const { loader } = messages[locale];
  const values: Record<string, string> = {
    htmlLang: localeInfo[locale].htmlLang,
    loaderTitle: escapeHtml(loader.title),
    loaderNote: escapeHtml(loader.note),
    loaderProgress: escapeHtml(loader.progress),
  };

  return template
    .replace(HEAD_MARKER, () => buildHead(siteUrl, locale).map(renderTag).join('\n    '))
    .replace(NOSCRIPT_MARKER, () => buildNoscript(locale))
    .replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
}

/**
 * What `/` serves: a tiny page that sends the visitor to their language without downloading the app.
 * Saved choice first, then the device languages, then the default. Mirrors `resolveInitialLocale` in src/i18n/initial.ts.
 */
function buildRootPage(siteUrl: string): string {
  const t = messages[DEFAULT_LOCALE];
  const redirect = `(function(){
  var map=${JSON.stringify(Object.fromEntries(browserLanguageMap))},locales=${JSON.stringify(LOCALES)},locale=null;
  try{locale=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)})}catch(e){}
  if(locales.indexOf(locale)<0){
    locale=null;
    var languages=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];
    for(var i=0;i<languages.length&&!locale;i++)locale=map[String(languages[i]).toLowerCase().split('-')[0]]||null;
  }
  location.replace('/'+(locale||${JSON.stringify(DEFAULT_LOCALE)})+'/'+location.search+location.hash);
})();`;

  const alternates = siteUrl
    ? [
        ...LOCALES.map((locale) => link({ rel: 'alternate', hreflang: localeInfo[locale].htmlLang, href: pageUrl(siteUrl, locale) })),
        link({ rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}/` }),
      ].map(renderTag)
    : [];

  const languageLinks = LOCALES.map(
    (locale) => `<li><a href="${localePath(locale)}" hreflang="${localeInfo[locale].htmlLang}" lang="${localeInfo[locale].htmlLang}">${escapeHtml(localeInfo[locale].label)}</a></li>`,
  );

  return `<!doctype html>
<html lang="${localeInfo[DEFAULT_LOCALE].htmlLang}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(t.seo.title)}</title>
    <meta name="description" content="${escapeHtml(t.seo.description)}">
    <meta name="robots" content="index, follow">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    ${alternates.join('\n    ')}
    <script>${redirect}</script>
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
    ...(siteUrl ? [`Sitemap: ${siteUrl}/sitemap.xml`] : []),
    '',
  ].join('\n');
}

function buildLlmsTxt(siteUrl: string, locale: Locale): string {
  const t = messages[locale];
  const email = getContactEmail();
  const lines = [
    `# ${site.name}`,
    '',
    `> ${t.profile.tagline} ${t.profile.bio}`,
    '',
    '## Facts',
    ...publishableFacts(locale).map(([label, value]) => `- ${label}: ${value}`),
    '',
    '## Official profiles',
    ...getOfficialProfiles(t).map(({ label, url, purpose }) => `- [${label}](${url}): ${purpose}`),
    '',
    '## Hashtags',
    ...site.hashtags.map(({ tag, purpose }) => `- ${tag}: ${t.hashtags[purpose]}`),
    '',
    '## FAQ',
    ...t.faq.items.map(({ question, answer }) => `- ${question} ${answer}`),
    ...(email ? ['', '## Contact', `- ${t.noscript.business}: ${email}`] : []),
    ...(siteUrl ? ['', '## Website', ...LOCALES.map((other) => `- [${site.name} (${localeInfo[other].label})](${pageUrl(siteUrl, other)})`)] : []),
    '',
  ];
  return lines.join('\n');
}

const sitemapImage = (siteUrl: string, path: string): string => `    <image:image><image:loc>${siteUrl}${path}</image:loc></image:image>`;

function buildSitemap(siteUrl: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const imagePaths = [seo.image.path, ...Object.values(heroImages), ...emoteNames.map((name) => emoteUrl(name))];
  const alternates = [
    ...LOCALES.map((locale) => `    <xhtml:link rel="alternate" hreflang="${localeInfo[locale].htmlLang}" href="${pageUrl(siteUrl, locale)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/"/>`,
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...LOCALES.flatMap((locale) => [
      '  <url>',
      `    <loc>${pageUrl(siteUrl, locale)}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      `    <priority>${locale === DEFAULT_LOCALE ? '1.0' : '0.9'}</priority>`,
      ...alternates,
      ...imagePaths.map((path) => sitemapImage(siteUrl, path)),
      '  </url>',
    ]),
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
      // A build keeps the markers: closeBundle fills them once per language. The dev server fills them for the URL being requested.
      if (isBuild) return { html, tags };

      const locale = localeFromPath(new URL(originalUrl ?? '/', 'http://localhost').pathname) ?? DEFAULT_LOCALE;
      return { html: fillTemplate(html, locale, siteUrl), tags };
    },
    generateBundle() {
      const emit = (fileName: string, source: string) => this.emitFile({ type: 'asset', fileName, source });

      checkShareImage((message) => this.warn(message));
      emit('robots.txt', buildRobots(siteUrl));
      emit('llms.txt', buildLlmsTxt(siteUrl, DEFAULT_LOCALE));
      LOCALES.forEach((locale) => emit(`${locale}/llms.txt`, buildLlmsTxt(siteUrl, locale)));

      if (!siteUrl) {
        this.warn('VITE_SITE_URL is not set (and no Vercel production domain was found): canonical, hreflang, Open Graph image URLs and sitemap.xml were skipped.');
        return;
      }
      emit('sitemap.xml', buildSitemap(siteUrl));
    },
    // Runs after the files are written: index.html becomes /en/, /jp/, /id/, /kr/ pages, and the root page becomes the language redirect.
    closeBundle() {
      if (!isBuild) return;

      const rootFile = join(outDir, 'index.html');
      const template = readFileSync(rootFile, 'utf8');
      if (![HEAD_MARKER, NOSCRIPT_MARKER].every((marker) => template.includes(marker))) {
        throw new Error(`mizu:seo: ${rootFile} has lost the ${HEAD_MARKER} or ${NOSCRIPT_MARKER} marker from index.html, so the language pages cannot be generated.`);
      }

      for (const locale of LOCALES) {
        mkdirSync(join(outDir, locale), { recursive: true });
        writeFileSync(join(outDir, locale, 'index.html'), fillTemplate(template, locale, siteUrl));
      }
      writeFileSync(rootFile, buildRootPage(siteUrl));
    },
  };
}
