import { createClient } from '@supabase/supabase-js';

// Runs on Vercel as a serverless function at /api/sitemap.xml (see vercel.json
// rewrite for /sitemap.xml -> this). Regenerates the sitemap on every request
// straight from the live products/categories table, so newly added products
// and categories show up automatically — no manual editing needed.

const SITE_URL = 'https://abrgadgets.pk';

export default async function handler(_req: unknown, res: {
  setHeader: (k: string, v: string) => void;
  status: (n: number) => { send: (body: string) => void };
}) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  const staticUrls = [
    { loc: '/', priority: '1.0' },
    { loc: '/#shop', priority: '0.9' },
    { loc: '/#new-arrivals', priority: '0.7' },
    { loc: '/#best-sellers', priority: '0.7' },
    { loc: '/#about', priority: '0.5' },
    { loc: '/#contact', priority: '0.5' },
    { loc: '/#return-policy', priority: '0.3' },
    { loc: '/#privacy-policy', priority: '0.3' },
  ];

  let dynamicUrls: { loc: string; priority: string }[] = [];

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase.from('products').select('slug'),
      supabase.from('categories').select('slug'),
    ]);

    dynamicUrls = [
      ...((products || []) as { slug: string }[]).map(p => ({
        loc: `/#product&productSlug=${encodeURIComponent(p.slug)}`,
        priority: '0.8',
      })),
      ...((categories || []) as { slug: string }[]).map(c => ({
        loc: `/#shop&categorySlug=${encodeURIComponent(c.slug)}`,
        priority: '0.7',
      })),
    ];
  } catch {
    // If Supabase is briefly unreachable, still serve the static pages
    // rather than a broken/empty sitemap.
  }

  const allUrls = [...staticUrls, ...dynamicUrls];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls
    .map(u => `  <url><loc>${SITE_URL}${u.loc}</loc><priority>${u.priority}</priority></url>`)
    .join('\n')}\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
}
