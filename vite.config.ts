import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite';
import { site } from './src/config/site.ts';

const OG_IMAGE_PATH = '/og-image.png';

function seoPlugin(rawSiteUrl: string): Plugin {
  const siteUrl = rawSiteUrl.trim().replace(/\/+$/, '');
  const { seo } = site;

  const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({
    tag: 'meta',
    attrs,
    injectTo: 'head',
  });

  return {
    name: 'mizu:seo',
    transformIndexHtml() {
      const tags: HtmlTagDescriptor[] = [
        { tag: 'title', children: seo.title, injectTo: 'head-prepend' },
        meta({ name: 'description', content: seo.description }),
        meta({ name: 'robots', content: 'index, follow, max-image-preview:large' }),
        meta({ name: 'theme-color', content: site.themeColor }),
        meta({ name: 'author', content: site.name }),
        meta({ property: 'og:type', content: 'website' }),
        meta({ property: 'og:site_name', content: site.name }),
        meta({ property: 'og:title', content: seo.title }),
        meta({ property: 'og:description', content: seo.description }),
        meta({ property: 'og:locale', content: site.locale }),
        meta({ name: 'twitter:card', content: 'summary_large_image' }),
        meta({ name: 'twitter:title', content: seo.title }),
        meta({ name: 'twitter:description', content: seo.description }),
      ];

      if (siteUrl) {
        const imageUrl = `${siteUrl}${OG_IMAGE_PATH}`;
        tags.push(
          { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' },
          meta({ property: 'og:url', content: `${siteUrl}/` }),
          meta({ property: 'og:image', content: imageUrl }),
          meta({ property: 'og:image:width', content: '1200' }),
          meta({ property: 'og:image:height', content: '630' }),
          meta({ property: 'og:image:alt', content: seo.imageAlt }),
          meta({ name: 'twitter:image', content: imageUrl }),
          meta({ name: 'twitter:image:alt', content: seo.imageAlt }),
        );
      }

      const graph = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            name: site.name,
            description: seo.description,
            inLanguage: site.language,
            ...(siteUrl && { url: `${siteUrl}/` }),
          },
          {
            '@type': 'Person',
            name: site.name,
            alternateName: site.nickname,
            jobTitle: 'Virtual streamer',
            description: seo.description,
            sameAs: site.platforms.map((platform) => platform.url),
            ...(siteUrl && { url: `${siteUrl}/`, image: `${siteUrl}${OG_IMAGE_PATH}` }),
          },
        ],
      };

      tags.push({
        tag: 'script',
        attrs: { type: 'application/ld+json' },
        children: JSON.stringify(graph).replace(/</g, '\\u003c'),
        injectTo: 'head',
      });

      return tags;
    },
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /', ...(siteUrl ? [`Sitemap: ${siteUrl}/sitemap.xml`] : [])];
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots.join('\n')}\n` });

      if (!siteUrl) {
        this.warn('VITE_SITE_URL is not set: canonical, Open Graph image URLs and sitemap.xml were skipped.');
        return;
      }

      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        `  <url><loc>${siteUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
        '</urlset>',
      ];
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `${sitemap.join('\n')}\n` });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), seoPlugin(env.VITE_SITE_URL ?? '')],
    build: {
      target: 'es2023',
      cssCodeSplit: false,
    },
  };
});
