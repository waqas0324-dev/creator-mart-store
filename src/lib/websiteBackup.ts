// WHOLE-WEBSITE BACKUP (2026-11-10, Waqas): poori website ka data
// (products, categories, orders, order_items, reviews, site_settings)
// khud-ba-khud Supabase me save hota rahe — taake website kabhi lose
// bhi ho jaye to data wapis mil jaye.
//
// Website ka data pehle se hi Supabase tables me hai (localStorage me
// nahi) — ye backup un tables ka snapshot hai. Snapshot
// abr_inventory_backup table ki row id=2 me rehta hai (row id=1 =
// Inventory Manager backup; alag table banane ke liye Supabase
// dashboard chahiye hota, is liye maujooda backup table ki doosri row
// use ki hai). Restore SIRF secret code (abr123) se hota hai —
// Inventory Manager ke Settings me. Restore upsert-only hai: maujooda
// rows kabhi delete nahi hoti, sirf missing/changed rows wapis aati
// hain. User tables (admin_users / developer_users) snapshot me NAHI
// hain — un me login data hota hai.
import { supabase } from './supabase';

const TABLE = 'abr_inventory_backup';
const ROW_ID = 2;

export type WebsiteSnapshot = {
  products: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  order_items: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  site_settings: Record<string, unknown>[];
};

export type WebsiteBackupInfo = { products: number; orders: number; savedAt: string };

async function fetchTable(name: string): Promise<Record<string, unknown>[] | null> {
  const { data, error } = await supabase.from(name).select('*');
  if (error) return null;
  return (data as Record<string, unknown>[]) || [];
}

export async function fetchWebsiteSnapshot(): Promise<WebsiteSnapshot | null> {
  const [products, categories, orders, order_items, reviews, site_settings] = await Promise.all([
    fetchTable('products'), fetchTable('categories'), fetchTable('orders'),
    fetchTable('order_items'), fetchTable('reviews'), fetchTable('site_settings'),
  ]);
  if (products == null || categories == null || orders == null || order_items == null || reviews == null || site_settings == null) return null;
  return { products, categories, orders, order_items, reviews, site_settings };
}

function counts(s: WebsiteSnapshot) { return { products: s.products.length, orders: s.orders.length }; }

async function loadStored(): Promise<{ data: WebsiteSnapshot; updated_at: string } | null> {
  const { data, error } = await supabase.from(TABLE).select('data,updated_at').eq('id', ROW_ID).maybeSingle();
  if (error || !data) return null;
  const d = (data as { data: unknown }).data as Partial<WebsiteSnapshot>;
  if (!d || !Array.isArray(d.products) || !Array.isArray(d.orders)) return null;
  return { data: d as WebsiteSnapshot, updated_at: String((data as { updated_at: string }).updated_at ?? '') };
}

// FULLEST-STATE GUARD (Inventory backup wala usool): khaali ya halki
// snapshot achha backup overwrite NAHI karti.
export async function backupWebsiteData(): Promise<'saved' | 'kept' | 'failed' | 'empty'> {
  try {
    const snap = await fetchWebsiteSnapshot();
    if (!snap) return 'failed';
    const c = counts(snap);
    if (c.products === 0 && c.orders === 0 && snap.categories.length === 0) return 'empty';
    const stored = await loadStored();
    if (stored) {
      const sc = counts(stored.data);
      if (c.products < sc.products || c.orders < sc.orders) return 'kept';
    }
    const { error } = await supabase.from(TABLE).upsert({ id: ROW_ID, data: snap, updated_at: new Date().toISOString() });
    return error ? 'failed' : 'saved';
  } catch { return 'failed'; }
}

export async function getWebsiteBackupInfo(): Promise<WebsiteBackupInfo | null> {
  const stored = await loadStored();
  if (!stored) return null;
  const c = counts(stored.data);
  return { products: c.products, orders: c.orders, savedAt: stored.updated_at };
}

// Restore: upsert-only — maujooda data delete NAHI hota. Har table
// alag try hoti hai taake aik table fail ho to baaki phir bhi restore hon.
// NOTE: restore ko admin ki Supabase Auth session chahiye hoti hai —
// products/categories/site_settings par RLS anon key ko upsert nahi
// karne deti. Ye button sirf admin area ke andar secret code se khulta
// hai, jahan session hamesha maujood hoti hai (AdminLayout us ke baghair
// andar jaane nahi deta), is liye restore wahan kaam karta hai. Bina
// session ke (jaise Node test) RLS "violates row-level security" dega —
// woh test ka artifact hai, bug nahi.
export async function restoreWebsiteBackup(): Promise<{ restored: { products: number; categories: number; orders: number; order_items: number; reviews: number; site_settings: number }; failed: string[] } | null> {
  try {
    const stored = await loadStored();
    if (!stored) return null;
    const s = stored.data;
    const restored = { products: 0, categories: 0, orders: 0, order_items: 0, reviews: 0, site_settings: 0 };
    const failed: string[] = [];
    // FK order: categories -> products -> orders -> order_items -> reviews -> site_settings
    const steps: ['categories' | 'products' | 'orders' | 'order_items' | 'reviews' | 'site_settings', Record<string, unknown>[]][] = [
      ['categories', s.categories], ['products', s.products], ['orders', s.orders],
      ['order_items', s.order_items], ['reviews', s.reviews], ['site_settings', s.site_settings],
    ];
    for (const [table, rows] of steps) {
      if (rows.length === 0) continue;
      const { error } = await supabase.from(table).upsert(rows);
      if (error) failed.push(table);
      else restored[table] = rows.length;
    }
    return { restored, failed };
  } catch { return null; }
}

// Debounced auto-save: har change par foran save nahi — 2s ruk kar aik
// hi save hota hai, taake lagatar edits par baar baar call na jaye.
let backupTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleWebsiteBackup(delayMs = 2000) {
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(() => { backupTimer = null; backupWebsiteData(); }, delayMs);
}
