// Build-time prerenderer for product pages. (rebuild trigger: product data updated 2026-10-02)
//
// Problem: WhatsApp/Facebook crawlers don't execute JavaScript, so when a
// product link is shared they only see the static index.html meta tags
// (site logo) instead of the product's own image/title.
//
// Solution: after `vite build`, this script writes dist/product/<slug>/index.html
// for every product with product-specific <title>, meta description,
// Open Graph + Twitter tags (absolute og:image) and Product JSON-LD.
// Vercel serves these static files directly (they take precedence over the
// SPA rewrite), so crawlers get correct previews while real browsers still
// boot the SPA bundle from the same HTML.
//
// Usage: node scripts/prerender.mjs   (runs via `npm run build`)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SITE_URL = 'https://abrgadgets.vercel.app';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absUrl(u) {
  if (!u) return SITE_URL + '/images/logo/abr-gadgets.png';
  if (/^https?:\/\//i.test(u)) return u;
  return SITE_URL + (u.startsWith('/') ? u : '/' + u);
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchProducts() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=slug,name,mini_description,description,image_url,images,price,original_price,stock&order=name`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  return res.json();
}

function productJsonLd(p, url, img) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: [img],
    description: stripHtml(p.mini_description || p.description).slice(0, 300),
    brand: { '@type': 'Brand', name: 'ABR Gadgets' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'PKR',
      price: p.price,
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}

function renderProductHtml(template, p) {
  const url = `${SITE_URL}/product/${p.slug}`;
  const title = `${p.name} | ABR Gadgets`;
  const desc =
    stripHtml(p.mini_description).slice(0, 160) ||
    stripHtml(p.description).slice(0, 160) ||
    'ABR Gadgets - creator gear and gadgets in Pakistan with Cash on Delivery.';
  const img = absUrl(p.image_url || (p.images && p.images[0]));

  let html = template;
  // Title
  html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`);
  // Meta description
  html = html.replace(
    /<meta name="description" content=".*?" \/>/,
    `<meta name="description" content="${esc(desc)}" />`
  );
  // Open Graph
  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/,
    `<meta property="og:title" content="${esc(title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/,
    `<meta property="og:description" content="${esc(desc)}" />`
  );
  html = html.replace(
    /<meta property="og:image" content=".*?" \/>/,
    `<meta property="og:image" content="${esc(img)}" />`
  );
  html = html.replace(
    /<meta property="og:type" content=".*?" \/>/,
    `<meta property="og:type" content="product" />`
  );
  // og:url + canonical (point at the product page)
  if (/og:url/.test(html)) {
    html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${esc(url)}" />`);
  } else {
    html = html.replace('</head>', `    <meta property="og:url" content="${esc(url)}" />\n  </head>`);
  }
  html = html.replace(
    /<link rel="canonical" href=".*?" \/>/,
    `<link rel="canonical" href="${esc(url)}" />`
  );
  // Twitter
  html = html.replace(
    /<meta name="twitter:title" content=".*?" \/>/,
    `<meta name="twitter:title" content="${esc(title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?" \/>/,
    `<meta name="twitter:description" content="${esc(desc)}" />`
  );
  html = html.replace(
    /<meta name="twitter:image" content=".*?" \/>/,
    `<meta name="twitter:image" content="${esc(img)}" />`
  );
  // Product JSON-LD + crawler hints before </head>
  const crawlerMeta = [
    `<meta name="robots" content="index,follow,max-image-preview:large" />`,
    `<meta property="og:image:alt" content="${esc(p.name)}" />`,
    `<meta name="twitter:image:alt" content="${esc(p.name)}" />`,
  ].join('\n    ');
  html = html.replace('</head>', `    ${crawlerMeta}\n    ${productJsonLd(p, url, img)}\n  </head>`);
  return html;
}

async function main() {
  const templatePath = join(DIST, 'index.html');
  if (!existsSync(templatePath)) {
    console.log('[prerender] dist/index.html not found — skipping.');
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('[prerender] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — skipping product prerender.');
    return;
  }
  const template = readFileSync(templatePath, 'utf8');
  let products;
  try {
    products = await fetchProducts();
  } catch (e) {
    console.log('[prerender] Could not fetch products:', e.message, '— skipping.');
    return;
  }
  let count = 0;
  const productUrls = [];
  for (const p of products) {
    if (!p.slug) continue;
    const dir = join(DIST, 'product', p.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderProductHtml(template, p));
    productUrls.push(`${SITE_URL}/product/${p.slug}`);
    count++;
  }

  const staticUrls = [
    '/', '/shop', '/new-arrivals', '/best-sellers', '/flash-deals',
    '/about', '/contact', '/return-policy', '/privacy-policy', '/terms', '/faq',
  ].map(path => `${SITE_URL}${path}`);
  const sitemapUrls = [...staticUrls, ...productUrls];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>
`;
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap);
  console.log(`[prerender] Wrote ${count} product pages + sitemap (${sitemapUrls.length} URLs).`);
}

main();
