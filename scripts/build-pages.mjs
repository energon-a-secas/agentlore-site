#!/usr/bin/env node
/**
 * Emits one static HTML page per tutorial, plus the palette's search index,
 * the sitemap and llms.txt.
 *
 * It imports the site's own renderMarkdown rather than reimplementing it, so
 * the generated page and the in-app rendering cannot drift. Output is
 * committed; the site stays zero-build to serve.
 *
 *   node scripts/build-pages.mjs        (or: make pages)
 */

import { mkdir, writeFile, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { tutorials, CATEGORY_META, TOOLS, LEVEL_META, neighbours } from '../js/content/index.js';
import { MODELS, PROVIDERS, TIERS } from '../js/content/models.js';
import { ARMORY_SECTIONS, SKILL_TEMPLATES } from '../js/content/armory.js';
import { GLOSSARY } from '../js/content/glossary.js';
import { renderMarkdown, extractHeadings, escHtml } from '../js/utils.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://agentlore.neorgon.com';
const TODAY = new Date().toISOString().slice(0, 10);

const SECTIONS = [
  { label: 'Home', url: '#/', sub: 'Start here' },
  { label: 'The Path', url: '#/learn', sub: 'Training tracks' },
  { label: 'The Codex', url: '#/codex', sub: 'Model comparison and cost calculator' },
  { label: 'The Armory', url: '#/armory', sub: 'Grounded agent skills' },
  { label: 'Browse all guides', url: '#/browse', sub: `All ${tutorials.length} guides` },
];

/* ── Page template ─────────────────────────────────────────── */

function outline(headings) {
  if (headings.length < 3) return '';
  return `<nav class="reader-outline" aria-label="On this page">
  <p class="outline-title">On this page</p>
  <ul class="outline-list">
    ${headings.map(h => `<li class="outline-item outline-item--h${h.level}"><a class="outline-link" href="#${h.id}">${escHtml(h.text)}</a></li>`).join('')}
  </ul>
</nav>`;
}

function jsonLd(t) {
  return JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: t.title,
      description: t.description,
      url: `${ORIGIN}/t/${t.id}/`,
      inLanguage: 'en',
      articleSection: CATEGORY_META[t.category].label,
      proficiencyLevel: LEVEL_META[t.difficulty].label,
      keywords: [CATEGORY_META[t.category].label, ...t.tools.map(x => TOOLS[x] || x), 'AI agents'].join(', '),
      isPartOf: { '@type': 'WebSite', name: 'Agent Lore', url: `${ORIGIN}/` },
      publisher: { '@type': 'Organization', name: 'Neorgon', url: 'https://neorgon.com/' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Agent Lore', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: CATEGORY_META[t.category].label, item: `${ORIGIN}/#/browse?cat=${t.category}` },
        { '@type': 'ListItem', position: 3, name: t.title, item: `${ORIGIN}/t/${t.id}/` },
      ],
    },
  ], null, 2);
}

function page(t) {
  const { prev, next, position } = neighbours(t.id);
  const meta = CATEGORY_META[t.category];
  const headings = extractHeadings(t.content);
  const body = renderMarkdown(t.content);
  const toolNames = t.tools.map(x => TOOLS[x] || x).join(', ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline' https://gc.zgo.at https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://cdn.neorgon.org; font-src 'self'; img-src 'self' data: https://cdn.neorgon.org https://neorgon.goatcounter.com; connect-src 'self' https://neorgon.goatcounter.com https://cloudflareinsights.com">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<title>${escHtml(t.title)} | Agent Lore</title>
<meta name="description" content="${escHtml(t.description)}">
<meta property="og:title" content="${escHtml(t.title)} — Agent Lore">
<meta property="og:description" content="${escHtml(t.description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${ORIGIN}/t/${t.id}/">
<meta property="og:site_name" content="Neorgon">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${ORIGIN}/og-preview.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Agent Lore — ${escHtml(t.title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(t.title)} — Agent Lore">
<meta name="twitter:description" content="${escHtml(t.description)}">
<meta name="twitter:image" content="${ORIGIN}/og-preview.jpg">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${ORIGIN}/t/${t.id}/">
<meta name="theme-color" content="#040714">
<meta name="neo-theme-switcher" content="footer">
<meta name="neo-repo" content="https://github.com/energon-a-secas/agentlore-site">
<meta name="neo-version" content="v2.0.0">
<meta name="neo-updated" content="updated Aug 2026">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="stylesheet" href="/css/style.css">
<script>(function(){var m=location.search.match(/[?&]theme=([\\w-]+)/)||document.cookie.match(/(?:^|;\\s*)neo_theme=([\\w-]+)/);if(m&&m[1]!=='default')document.documentElement.dataset.theme=decodeURIComponent(m[1]);})();</script>
<link rel="stylesheet" href="/css/neorgon-header.css">
<link rel="stylesheet" href="/css/neorgon-themes.css">
<link rel="stylesheet" href="/css/neorgon-footer.css">
<link rel="stylesheet" href="https://cdn.neorgon.org/v1.0.0/header/season.css">
<script defer src="/js/neorgon-header.js"></script>
<script defer src="/js/neorgon-footer.js"></script>
${prev ? `<link rel="prev" href="${ORIGIN}/t/${prev.id}/">` : ''}
${next ? `<link rel="next" href="${ORIGIN}/t/${next.id}/">` : ''}
<script type="application/ld+json">
${jsonLd(t)}
</script>
</head>
<body data-tutorial="${escHtml(t.id)}">

<a class="skip-link" href="#main">Skip to content</a>

<header class="header-bar" data-header-mode="content">
  <div class="header-logo">
    <a href="https://neorgon.com/" target="_blank" rel="noopener noreferrer" aria-label="Neorgon home (opens in new tab)">
      <img src="/energon-classic-logo.png" class="header-logo-img" alt="Neorgon" width="36" height="36">
    </a>
    <a href="/#/" class="header-title-link">
      <h1>Agent Lore</h1>
      <div class="header-subtitle">Learn the agents. Pick the model. Ship the skill.</div>
    </a>
  </div>
  <div class="header-right">
    <nav class="header-actions header-nav" aria-label="Sections">
      <a class="nav-tab" href="/#/learn">Path</a>
      <a class="nav-tab" href="/#/codex">Codex</a>
      <a class="nav-tab" href="/#/armory">Armory</a>
      <a class="nav-tab" href="/#/browse">Browse</a>
    </nav>
    <button id="open-palette" class="header-btn palette-btn" data-keep-mobile type="button" aria-label="Search (press / or Command K)" title="Search — / or ⌘K">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <kbd>/</kbd>
    </button>
    <a class="header-home" href="https://neorgon.com/" title="neorgon.com" aria-label="Neorgon home">
      <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
    </a>
  </div>
</header>

<main id="main">
  <div class="container reader-container">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="/#/">Agent Lore</a>
      <span aria-hidden="true">/</span>
      <a href="/#/browse?cat=${escHtml(t.category)}">${escHtml(meta.label)}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${escHtml(t.title)}</span>
    </nav>

    <article class="reader" style="--card-cat:${meta.accent}">
      <header class="reader-head">
        <div class="reader-badges">
          <span class="badge badge-category" style="--badge-accent:${meta.accent}">${escHtml(meta.label)}</span>
          ${t.tools.map(x => `<span class="badge badge-tool ${x}">${escHtml(TOOLS[x] || x)}</span>`).join('')}
          <span class="badge badge-difficulty ${t.difficulty}">${escHtml(LEVEL_META[t.difficulty].label)}</span>
        </div>
        <h2 class="reader-title">${escHtml(t.title)}</h2>
        <p class="reader-desc">${escHtml(t.description)}</p>
        <div class="reader-actions">
          <button id="mark-done" class="done-btn" type="button" aria-pressed="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span class="done-label">Mark complete</span>
          </button>
          <span class="reader-position">${position} of ${tutorials.length}</span>
        </div>
      </header>

      ${outline(headings)}

      <div class="reader-body prose">
${body}
      </div>
    </article>

    <nav class="reader-nav" aria-label="Guide navigation">
      ${prev ? `<a class="reader-nav-link reader-nav-link--prev" data-nav="prev" href="/t/${prev.id}/">
        <span class="reader-nav-dir">← Previous</span>
        <span class="reader-nav-title">${escHtml(prev.title)}</span>
      </a>` : '<span></span>'}
      ${next ? `<a class="reader-nav-link reader-nav-link--next" data-nav="next" href="/t/${next.id}/">
        <span class="reader-nav-dir">Next →</span>
        <span class="reader-nav-title">${escHtml(next.title)}</span>
      </a>` : '<span></span>'}
    </nav>

    <p class="reader-foot">Working out which model to run this on? See <a href="/#/codex">The Codex</a>. Packaging it as a reusable skill? See <a href="/#/armory">The Armory</a>.</p>
  </div>
</main>

<footer class="neo-footer" data-footer-mode="content">
  <p class="neo-footer-note">${escHtml(t.title)} — a guide for ${escHtml(toolNames)}. Part of the Agent Lore archive.</p>
</footer>

<script type="module" src="/js/reader.js"></script>
</body>
</html>
`;
}

/* ── Search index ──────────────────────────────────────────── */

function searchIndex() {
  const entries = [];

  for (const s of SECTIONS) {
    entries.push({ kind: 'Section', label: s.label, sub: s.sub, url: s.url, keywords: s.sub });
  }

  for (const t of tutorials) {
    entries.push({
      kind: 'Guide',
      label: t.title,
      sub: t.description,
      url: `/t/${t.id}/`,
      keywords: [CATEGORY_META[t.category].label, ...t.tools.map(x => TOOLS[x] || x), t.difficulty, t.id].join(' '),
    });
  }

  for (const m of MODELS) {
    entries.push({
      kind: 'Model',
      label: m.name,
      sub: `${PROVIDERS[m.provider].label} · ${TIERS[m.tier].label} · ${m.bestAt[0]}`,
      url: '#/codex',
      keywords: [m.apiId || '', m.provider, m.tier, ...m.bestAt, ...(m.avoidFor || [])].join(' '),
    });
  }

  for (const s of ARMORY_SECTIONS) {
    entries.push({ kind: 'Armory', label: s.title, sub: s.tagline, url: `#/armory?s=${s.id}`, keywords: s.content.slice(0, 600) });
  }

  for (const t of SKILL_TEMPLATES) {
    entries.push({ kind: 'Template', label: t.name, sub: t.blurb, url: '#/armory?s=templates', keywords: `skill template ${t.grounds}` });
  }

  for (const g of GLOSSARY) {
    entries.push({
      kind: 'Term',
      label: g.term,
      sub: g.def.length > 110 ? g.def.slice(0, 108) + '…' : g.def,
      url: g.see ? `/t/${g.see}/` : '#/browse',
      keywords: [...(g.aliases || []), g.def].join(' '),
    });
  }

  return { generated: TODAY, count: entries.length, entries };
}

/* ── Sitemap + llms.txt ────────────────────────────────────── */

function sitemap() {
  const urls = [
    { loc: `${ORIGIN}/`, priority: '1.0' },
    ...tutorials.map(t => ({ loc: `${ORIGIN}/t/${t.id}/`, priority: '0.8' })),
  ];
  const body = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function llmsTxt() {
  const byCategory = {};
  for (const t of tutorials) (byCategory[t.category] ||= []).push(t);

  return `# Agent Lore

> Practical reference for working with AI coding agents: ${tutorials.length} guides for Claude Code, Cursor and local AI, a model comparison with verified pricing and a cost calculator, and patterns for building grounded agent skills.

Site: ${ORIGIN}/
Updated: ${TODAY}

## Sections

- [The Path](${ORIGIN}/#/learn): structured training tracks, Claude Code and Cursor side by side.
- [The Codex](${ORIGIN}/#/codex): ${MODELS.length} models compared on context, price and fit, with a monthly-cost calculator and a routing guide. Prices carry the date they were verified.
- [The Armory](${ORIGIN}/#/armory): how to build agent skills grounded in sources you control, with ${SKILL_TEMPLATES.length} working templates.
- [Browse](${ORIGIN}/#/browse): all guides, filterable.

## Guides

${Object.entries(byCategory).map(([cat, items]) => `### ${CATEGORY_META[cat].label}

${items.map(t => `- [${t.title}](${ORIGIN}/t/${t.id}/): ${t.description}`).join('\n')}`).join('\n\n')}
`;
}

/* ── Run ───────────────────────────────────────────────────── */

async function main() {
  const outDir = join(ROOT, 't');

  if (existsSync(outDir)) {
    const known = new Set(tutorials.map(t => t.id));
    for (const name of await readdir(outDir)) {
      if (!known.has(name)) await rm(join(outDir, name), { recursive: true, force: true });
    }
  }

  for (const t of tutorials) {
    const dir = join(outDir, t.id);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), page(t));
  }

  const index = searchIndex();
  await writeFile(join(ROOT, 'search-index.json'), JSON.stringify(index));
  await writeFile(join(ROOT, 'sitemap.xml'), sitemap());
  await writeFile(join(ROOT, 'llms.txt'), llmsTxt());

  console.log(`✓ ${tutorials.length} reader pages → t/<id>/index.html`);
  console.log(`✓ search-index.json — ${index.count} entries`);
  console.log(`✓ sitemap.xml — ${tutorials.length + 1} URLs`);
  console.log(`✓ llms.txt`);
}

main().catch(err => { console.error(err); process.exit(1); });
