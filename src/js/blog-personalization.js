import supabase from './supabase.js';

const STORAGE_KEY = 'carmine_blog_selection';

/**
 * Get article slug from the canonical URL or pathname.
 * e.g. /blog/integrer-jeanine-manuel-retour-expatriation → integrer-jeanine-manuel-retour-expatriation
 */
function getArticleSlug() {
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    const url = new URL(canonical.href);
    const parts = url.pathname.replace(/\.html$/, '').split('/').filter(Boolean);
    return parts[parts.length - 1];
  }
  const path = window.location.pathname.replace(/\.html$/, '');
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

/**
 * Load saved selection from localStorage.
 */
function loadSelection() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Save selection to localStorage.
 */
function saveSelection(origin, target) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ origin, target }));
  } catch {
    // localStorage unavailable
  }
}

/**
 * Fetch content blocks from Supabase with fallback logic:
 * 1. Exact match (origin + target)
 * 2. Target-only match (origin IS NULL)
 * 3. No replacement (keep static HTML)
 */
async function fetchContentBlocks(slug, origin, target) {
  // Fetch both exact matches and target-only fallbacks in one query
  const { data, error } = await supabase
    .from('carmine_content_blocks')
    .select('block_key, origin_school, target_school, content_fr, content_en')
    .eq('article_slug', slug)
    .eq('target_school', target)
    .or(`origin_school.eq.${origin},origin_school.is.null`);

  if (error) {
    console.warn('Supabase fetch error:', error.message);
    return {};
  }

  // Build a map of block_key → content, preferring exact matches
  const blocks = {};
  if (data) {
    for (const row of data) {
      const isExact = row.origin_school === origin;
      const existing = blocks[row.block_key];
      // Exact match wins over fallback
      if (!existing || isExact) {
        blocks[row.block_key] = row.content_fr;
      }
    }
  }

  return blocks;
}

/**
 * Replace data-block elements with personalized content.
 * Stores original static HTML so it can be restored.
 */
function applyBlocks(blocks) {
  document.querySelectorAll('[data-block]').forEach((el) => {
    const key = el.getAttribute('data-block');
    if (blocks[key]) {
      // Save original content for potential restore
      if (!el.hasAttribute('data-original')) {
        el.setAttribute('data-original', el.innerHTML);
      }
      el.innerHTML = blocks[key];
      el.classList.add('article__block--personalized');
    }
  });
}

/**
 * Restore all data-block elements to their original static content.
 */
function restoreBlocks() {
  document.querySelectorAll('[data-block][data-original]').forEach((el) => {
    el.innerHTML = el.getAttribute('data-original');
    el.removeAttribute('data-original');
    el.classList.remove('article__block--personalized');
  });
}

/**
 * Handle selection change: fetch and apply personalized content.
 */
async function onSelectionChange() {
  const originSelect = document.getElementById('origin-school');
  const targetSelect = document.getElementById('target-school');

  const origin = originSelect.value;
  const target = targetSelect.value;

  // Save selection regardless
  if (origin || target) {
    saveSelection(origin, target);
  }

  // Need at least target to personalize
  if (!target) {
    restoreBlocks();
    return;
  }

  const slug = getArticleSlug();
  const blocks = await fetchContentBlocks(slug, origin, target);

  if (Object.keys(blocks).length > 0) {
    applyBlocks(blocks);
  } else {
    restoreBlocks();
  }
}

/**
 * Initialize blog personalization on article pages.
 */
export function initBlogPersonalization() {
  const personalizer = document.getElementById('blog-personalizer');
  if (!personalizer) return;

  const originSelect = document.getElementById('origin-school');
  const targetSelect = document.getElementById('target-school');

  if (!originSelect || !targetSelect) return;

  // Restore saved selection
  const saved = loadSelection();
  if (saved) {
    if (saved.origin) originSelect.value = saved.origin;
    if (saved.target) targetSelect.value = saved.target;
  }

  // Listen for changes
  originSelect.addEventListener('change', onSelectionChange);
  targetSelect.addEventListener('change', onSelectionChange);

  // If there's a saved selection with a target, auto-fetch
  if (saved && saved.target) {
    onSelectionChange();
  }
}
