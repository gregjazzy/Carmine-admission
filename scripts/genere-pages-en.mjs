/**
 * Fabrique les pages vitrine anglaises (/en/…) et le sitemap.
 *
 * Les pages françaises portent des attributs data-i18n ; le visiteur les voit
 * traduites à la volée, mais les moteurs ne lisent que le français. Ce script
 * fige la traduction anglaise dans de vraies pages, à des adresses distinctes,
 * appairées aux françaises par hreflang — comme le blog l'est déjà.
 *
 * Lancé avant chaque build (prebuild) et avant le serveur de dev (predev) ;
 * le dossier en/ produit n'est pas commité. Le sitemap, lui, l'est.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://carmine-admission.com';
const lire = (p) => readFileSync(resolve(SITE, p), 'utf8');

// Pages vitrine traduisibles : fichier source, chemin FR, chemin EN.
const PAGES = [
  ['index.html', '/', '/en/'],
  ['consulting-admissions.html', '/consulting-admissions', '/en/consulting-admissions'],
  ['cours-particuliers.html', '/cours-particuliers', '/en/cours-particuliers'],
  ['about.html', '/about', '/en/about'],
  ['temoignages.html', '/temoignages', '/en/temoignages'],
  ['ressources.html', '/ressources', '/en/ressources'],
];
const EN_DE = Object.fromEntries(PAGES.map(([, fr, en]) => [fr, en]));

const en = JSON.parse(lire('public/locales/en/translation.json'));
const t = (key) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), en);

// Titre et description des pages qui n'en déclarent pas via data-i18n.
const META = {
  'about.html': ['pages.about.meta_title', 'pages.about.meta_description'],
  'consulting-admissions.html': ['pages.admissions.meta_title', 'pages.admissions.meta_description'],
  'temoignages.html': ['pages.testimonials.meta_title', 'pages.testimonials.meta_description'],
  'ressources.html': ['resources.meta_title', 'resources.meta_description'],
};

// Correspondance article FR → article EN, lue dans les hreflang des articles.
const articleEn = {};
for (const f of readdirSync(resolve(SITE, 'blog'))) {
  if (!f.endsWith('.html') || f.startsWith('_')) continue;
  const m = lire(`blog/${f}`).match(/hreflang="en" href="[^"]*(\/blog\/en\/[^"]+)"/);
  if (m) articleEn['/blog/' + f.replace(/\.html$/, '')] = m[1];
}

function lienEn(href) {
  const [path, hash] = href.split('#');
  const suffix = hash !== undefined ? '#' + hash : '';
  if (path === '/blog') return '/blog/en/' + suffix;
  if (EN_DE[path]) return EN_DE[path] + suffix;
  if (articleEn[path]) return articleEn[path] + suffix;
  return null;
}

mkdirSync(resolve(SITE, 'en'), { recursive: true });

for (const [file, frPath, enPath] of PAGES) {
  const $ = cheerio.load(lire(file));
  $('html').attr('lang', 'en');

  $('[data-i18n]').each((_, el) => {
    const v = t($(el).attr('data-i18n'));
    if (typeof v === 'string') $(el).html(v);
  });
  $('[data-i18n-placeholder]').each((_, el) => {
    const v = t($(el).attr('data-i18n-placeholder'));
    if (typeof v === 'string') $(el).attr('placeholder', v);
  });
  $('[data-i18n-option]').each((_, el) => {
    const v = t($(el).attr('data-i18n-option'));
    if (typeof v === 'string') $(el).text(v);
  });

  const titleKey = $('meta[data-i18n-title]').attr('data-i18n-title') || META[file]?.[0];
  const descKey = $('meta[data-i18n-desc]').attr('data-i18n-desc') || META[file]?.[1];
  const title = titleKey && t(titleKey);
  const desc = descKey && t(descKey);
  if (!title || !desc) throw new Error(`Titre ou description anglais manquant pour ${file}`);
  $('title').text(title);
  $('meta[name="description"]').attr('content', desc);
  $('meta[property="og:title"]').attr('content', title);
  $('meta[property="og:description"]').attr('content', desc);
  $('meta[property="og:url"]').attr('content', ORIGIN + enPath);
  $('meta[property="og:locale"]').attr('content', 'en_US');

  $('link[rel="canonical"]').attr('href', ORIGIN + enPath);
  $('link[rel="alternate"][hreflang]').remove();
  $('link[rel="canonical"]').after(
    `\n  <link rel="alternate" hreflang="fr" href="${ORIGIN}${frPath}">` +
    `\n  <link rel="alternate" hreflang="en" href="${ORIGIN}${enPath}">` +
    `\n  <link rel="alternate" hreflang="x-default" href="${ORIGIN}${frPath}">`
  );

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href.startsWith('/')) return;
    const cible = lienEn(href);
    if (cible) $(el).attr('href', cible);
  });

  // Le sélecteur de langue reflète la page affichée.
  $('.lang-toggle__btn').removeClass('active');
  $('.lang-toggle__btn[data-lang="en"]').addClass('active');
  $('.lang-toggle__selected .lang-flag').text('🇬🇧');

  // Le JSON-LD décrit la même entité ; seule la langue déclarée change.
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      data.inLanguage = 'en';
      $(el).html('\n' + JSON.stringify(data, null, 2) + '\n');
    } catch { /* JSON-LD illisible : on le laisse tel quel */ }
  });

  writeFileSync(resolve(SITE, 'en', file), $.html());
}

// ---------- Sitemap ----------
// Date de dernière modification réelle : celle du JSON-LD (dateModified puis
// datePublished) pour un article, sinon celle du dernier commit qui touche le
// fichier. Sur un clone superficiel (Netlify), git ne sait rien : on garde
// alors la date que portait le sitemap commité. Jamais la date du build,
// que Google finirait par ignorer.
const sitemapPrecedent = (() => {
  try {
    const m = {};
    for (const [, loc, d] of lire('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) m[loc.replace(ORIGIN, '')] = d;
    return m;
  } catch { return {}; }
})();
let gitFiable = false;
try { gitFiable = Number(execSync('git rev-list --count HEAD', { cwd: SITE, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()) > 5; } catch { /* pas de git */ }
const dateDe = (p, loc) => {
  const src = lire(p);
  const m = src.match(/"dateModified":\s*"(\d{4}-\d{2}-\d{2})"/) || src.match(/"datePublished":\s*"(\d{4}-\d{2}-\d{2})"/);
  if (m) return m[1];
  if (gitFiable) {
    try { const d = execSync(`git log -1 --format=%cs -- "${p}"`, { cwd: SITE, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); if (d) return d; } catch { /* fichier non suivi */ }
  }
  return sitemapPrecedent[loc] || new Date().toISOString().slice(0, 10);
};
const urls = [];
const ajoute = (loc, lastmod, changefreq, priority) => urls.push({ loc, lastmod, changefreq, priority });
for (const [file, fr, enP] of PAGES) {
  const prio = fr === '/' ? '1.0' : fr.includes('consulting') || fr.includes('cours') ? '0.9' : '0.7';
  ajoute(fr, dateDe(file, fr), 'monthly', prio);
  ajoute(enP, dateDe(file, enP), 'monthly', prio);
}
ajoute('/blog', dateDe('blog.html', '/blog'), 'weekly', '0.8');
ajoute('/blog/en/', dateDe('blog/en/index.html', '/blog/en/'), 'weekly', '0.8');
const articles = (dir) => readdirSync(resolve(SITE, dir)).filter((f) => f.endsWith('.html') && !f.startsWith('_') && f !== 'index.html').sort();
for (const f of articles('blog')) { const loc = '/blog/' + f.replace(/\.html$/, ''); ajoute(loc, dateDe('blog/' + f, loc), 'monthly', '0.6'); }
for (const f of articles('blog/en')) { const loc = '/blog/en/' + f.replace(/\.html$/, ''); ajoute(loc, dateDe('blog/en/' + f, loc), 'monthly', '0.6'); }

const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((u) => `  <url>\n    <loc>${ORIGIN}${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`),
  '</urlset>', ''].join('\n');
writeFileSync(resolve(SITE, 'public/sitemap.xml'), xml);

console.log(`Pages anglaises : ${PAGES.length} · sitemap : ${urls.length} URL`);
