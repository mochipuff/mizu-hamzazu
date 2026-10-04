import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { HtmlTagDescriptor, Plugin } from 'vite';
import { isFilled, profileUrls, site } from '../src/config/site.ts';
import { faqItems, profileFacts } from '../src/data/content.ts';
import { emotes } from '../src/data/emotes.ts';
import { heroImages } from '../src/data/hero.ts';
import { emotePng } from '../src/lib/assets.ts';

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

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** Drops empty values so unfilled placeholders never reach the published markup. */
const compact = (entries: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(entries).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== '';
    }),
  );

const publishable = (values: string[]): string[] => values.filter(isFilled);

const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'meta', attrs, injectTo: 'head' });

function buildJsonLd(siteUrl: string): string {
  const id = (fragment: string) => `${siteUrl}/#${fragment}`;
  const image = siteUrl ? `${siteUrl}${seo.image.path}` : undefined;

  const person = compact({
    '@type': 'Person',
    '@id': id('person'),
    name: site.name,
    alternateName: publishable(profile.alternateNames),
    description: profile.bio,
    jobTitle: 'Virtual YouTuber',
    nationality: { '@type': 'Country', name: profile.nationality },
    height: { '@type': 'QuantitativeValue', value: profile.heightCm, unitCode: 'CMT' },
    knowsAbout: profile.topics,
    knowsLanguage: profile.languages,
    affiliation: isFilled(profile.agency) ? { '@type': 'Organization', name: profile.agency } : undefined,
    sameAs: profileUrls(),
    url: siteUrl ? `${siteUrl}/` : undefined,
    image,
  });

  const graph = [
    compact({
      '@type': 'WebSite',
      '@id': id('website'),
      name: site.name,
      description: seo.description,
      inLanguage: site.language,
      url: siteUrl ? `${siteUrl}/` : undefined,
      publisher: { '@id': id('person') },
    }),
    compact({
      '@type': 'ProfilePage',
      '@id': id('profile'),
      name: seo.title,
      description: seo.description,
      dateCreated: profile.debut,
      isPartOf: { '@id': id('website') },
      mainEntity: { '@id': id('person') },
      primaryImageOfPage: image ? { '@type': 'ImageObject', url: image, width: seo.image.width, height: seo.image.height } : undefined,
    }),
    person,
    {
      '@type': 'FAQPage',
      '@id': id('faq'),
      mainEntity: faqItems.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ];

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

function buildHead(siteUrl: string): HtmlTagDescriptor[] {
  const home = `${siteUrl}/`;
  const tags: HtmlTagDescriptor[] = [
    { tag: 'title', children: seo.title, injectTo: 'head-prepend' },
    meta({ name: 'description', content: seo.description }),
    meta({ name: 'keywords', content: seo.keywords.join(', ') }),
    meta({ name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' }),
    meta({ name: 'theme-color', content: site.themeColor }),
    meta({ name: 'author', content: site.name }),
    meta({ name: 'application-name', content: site.name }),
    meta({ name: 'referrer', content: 'strict-origin-when-cross-origin' }),
    meta({ property: 'og:type', content: 'profile' }),
    meta({ property: 'og:site_name', content: site.name }),
    meta({ property: 'og:title', content: seo.title }),
    meta({ property: 'og:description', content: seo.description }),
    meta({ property: 'og:locale', content: site.locale }),
    meta({ property: 'profile:username', content: site.name }),
    meta({ name: 'twitter:card', content: 'summary_large_image' }),
    meta({ name: 'twitter:title', content: seo.title }),
    meta({ name: 'twitter:description', content: seo.description }),
    { tag: 'link', attrs: { rel: 'alternate', type: 'text/plain', href: '/llms.txt', title: 'Summary for AI assistants' }, injectTo: 'head' },
    {
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      children: buildJsonLd(siteUrl),
      injectTo: 'head',
    },
  ];

  if (twitterHandle) {
    tags.push(meta({ name: 'twitter:site', content: twitterHandle }), meta({ name: 'twitter:creator', content: twitterHandle }));
  }

  if (siteUrl) {
    const imageUrl = `${siteUrl}${seo.image.path}`;
    tags.push(
      { tag: 'link', attrs: { rel: 'canonical', href: home }, injectTo: 'head' },
      { tag: 'link', attrs: { rel: 'alternate', hreflang: site.language, href: home }, injectTo: 'head' },
      { tag: 'link', attrs: { rel: 'alternate', hreflang: 'x-default', href: home }, injectTo: 'head' },
      meta({ property: 'og:url', content: home }),
      meta({ property: 'og:image', content: imageUrl }),
      meta({ property: 'og:image:secure_url', content: imageUrl }),
      ...(IMAGE_MIME ? [meta({ property: 'og:image:type', content: IMAGE_MIME })] : []),
      meta({ property: 'og:image:width', content: String(seo.image.width) }),
      meta({ property: 'og:image:height', content: String(seo.image.height) }),
      meta({ property: 'og:image:alt', content: seo.imageAlt }),
      meta({ name: 'twitter:image', content: imageUrl }),
      meta({ name: 'twitter:image:alt', content: seo.imageAlt }),
    );
  }

  return tags;
}

const facts = (): Array<[string, string]> => [
  ...profileFacts.map(({ label, value }): [string, string] => [label, value]),
  ['Nationality', profile.nationality],
  ['Languages', profile.languages.join(', ')],
  ['Agency', profile.agency],
  ['Illustrator', profile.illustrator],
  ['Rigger / modeler', profile.riggerOrModeler],
];

const publishableFacts = (): Array<[string, string]> => facts().filter(([, value]) => isFilled(value));

/** Plain HTML for crawlers that do not run JavaScript. Built from the same data as the visible page. */
function buildNoscript(): HtmlTagDescriptor {
  const links = [...site.platforms.map(({ label, url, blurb }) => ({ label, url, purpose: blurb })), ...profile.socials]
    .filter(({ url }) => isFilled(url))
    .map(({ label, url, purpose }) => `<li><a href="${escapeHtml(url)}" rel="me noopener">${escapeHtml(label)}</a>: ${escapeHtml(purpose)}</li>`);

  const html = `
<main style="max-width:40rem;margin:4rem auto;padding:0 1.5rem;font-family:system-ui,sans-serif;line-height:1.6">
  <h1>${escapeHtml(site.name)}</h1>
  <p>${escapeHtml(profile.bio)}</p>
  <h2>Profile</h2>
  <dl>${publishableFacts()
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join('')}</dl>
  <h2>Find ${escapeHtml(site.nickname)} online</h2>
  <ul>${links.join('')}</ul>
  <h2>Hashtags</h2>
  <ul>${site.hashtags.map(({ tag, purpose }) => `<li>${escapeHtml(tag)}: ${escapeHtml(purpose)}</li>`).join('')}</ul>
  <h2>FAQ</h2>
  ${faqItems.map(({ question, answer }) => `<h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p>`).join('')}
  <p>Business inquiries: <a href="mailto:${escapeHtml(site.contactEmail)}">${escapeHtml(site.contactEmail)}</a></p>
</main>`;

  return { tag: 'noscript', children: html, injectTo: 'body' };
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

/** llms.txt: a short Markdown brief for AI assistants (https://llmstxt.org). */
function buildLlmsTxt(siteUrl: string): string {
  const lines = [
    `# ${site.name}`,
    '',
    `> ${profile.tagline} ${profile.bio}`,
    '',
    '## Facts',
    ...publishableFacts().map(([label, value]) => `- ${label}: ${value}`),
    '',
    '## Official profiles',
    ...[...site.platforms.map(({ label, url, blurb }) => ({ label, url, purpose: blurb })), ...profile.socials]
      .filter(({ url }) => isFilled(url))
      .map(({ label, url, purpose }) => `- [${label}](${url}): ${purpose}`),
    '',
    '## Hashtags',
    ...site.hashtags.map(({ tag, purpose }) => `- ${tag}: ${purpose}`),
    '',
    '## FAQ',
    ...faqItems.flatMap(({ question, answer }) => [`- ${question} ${answer}`]),
    '',
    '## Contact',
    `- Business: ${site.contactEmail}`,
    ...(siteUrl ? ['', '## Website', `- [${site.name}](${siteUrl}/)`] : []),
    '',
  ];
  return lines.join('\n');
}

const sitemapImage = (siteUrl: string, path: string): string => `    <image:image><image:loc>${siteUrl}${path}</image:loc></image:image>`;

function buildSitemap(siteUrl: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const imagePaths = [seo.image.path, ...Object.values(heroImages), ...emotes.map(({ name }) => emotePng(name))];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    '  <url>',
    `    <loc>${siteUrl}/</loc>`,
    `    <lastmod>${today}</lastmod>`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>1.0</priority>',
    ...imagePaths.map((path) => sitemapImage(siteUrl, path)),
    '  </url>',
    '</urlset>',
    '',
  ].join('\n');
}

/** Warns at build time when the share image would be rejected or ignored by social platforms. */
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

  return {
    name: 'mizu:seo',
    transformIndexHtml: () => [...buildHead(siteUrl), buildNoscript()],
    generateBundle() {
      const emit = (fileName: string, source: string) => this.emitFile({ type: 'asset', fileName, source });

      checkShareImage((message) => this.warn(message));
      emit('robots.txt', buildRobots(siteUrl));
      emit('llms.txt', buildLlmsTxt(siteUrl));

      if (!siteUrl) {
        this.warn('VITE_SITE_URL is not set (and no Vercel production domain was found): canonical, hreflang, Open Graph image URLs and sitemap.xml were skipped.');
        return;
      }
      emit('sitemap.xml', buildSitemap(siteUrl));
    },
  };
}
