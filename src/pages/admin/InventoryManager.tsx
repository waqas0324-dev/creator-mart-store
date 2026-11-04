import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem, Product } from '../../types';

// ---------------------------------------------------------------------------
// ABR Gadgets — Inventory Manager (inside the website admin panel only).
//
// WEBSITE LINK (the rule this page is built around):
//  * Website products (Supabase table `products`: id, name, price, stock)
//    are the ONLY stock list. There is no second stock list.
//  * Website orders (Supabase tables `orders` + `order_items`: order_number,
//    created_at, status, total; order_items: product_id, product_name,
//    price, quantity, subtotal) appear here as sales, read-only.
//  * A manager sale / return / Stock In updates `products.stock` in
//    Supabase, so the website and the manager always show the same stock.
//
// MANAGER-ONLY DATA (the website has no cost, expense or return columns):
//  * localStorage key "bizmanager-v1":
//      costById:   { [productId]: asli cost of 1 piece }
//      webCost:    { [orderItemId]: cost snapshot at first sight, or null }
//      expenses:   [{ id, cat, amount, date, note }]
//      manualSales:[{ id, date, items: [{ pid, name, qty, price, cost, ret, rl }] }]
//      webReturns: [{ id, itemId, orderId, orderNumber, name, pid, qty, price, cost, date }]
//      low:        low-stock threshold (default 5)
//  * Website sales are NEVER copied into manualSales, so they are never
//    counted twice. Website profit uses the webCost snapshot only: if no
//    cost was ever recorded for that item, its profit is 0 and the UI
//    says "cost nahi hai" — a cost is never invented.
//  * React escapes all user text by default; this file uses no
//    dangerouslySetInnerHTML, and never uses confirm()/alert()/prompt().
// ---------------------------------------------------------------------------

const LS_KEY = 'bizmanager-v1';
const EXPENSE_SUGGESTIONS = ['Stock Bilty', 'Packing', 'Shipping', 'Ads', 'Rent', 'Salary', 'Bills', 'Other'];

type ManualItem = { pid: string; name: string; qty: number; price: number; cost: number | null; ret: number; rl: { q: number; d: string }[] };
type ManualSale = { id: string; date: string; items: ManualItem[] };
type Expense = { id: string; cat: string; amount: number; date: string; note: string };
type WebReturn = { id: string; itemId: string; orderId: string; orderNumber: string; name: string; pid: string | null; qty: number; price: number; cost: number | null; date: string };
type LocalDb = {
  costById: Record<string, number>;
  webCost: Record<string, number | null>;
  expenses: Expense[];
  manualSales: ManualSale[];
  webReturns: WebReturn[];
  low: number;
};

const EMPTY_DB: LocalDb = { costById: {}, webCost: {}, expenses: [], manualSales: [], webReturns: [], low: 5 };

function loadLocal(): LocalDb {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...EMPTY_DB };
    const parsed = JSON.parse(raw) as Partial<LocalDb>;
    // Old-format manual sales {pid,name,qty,price,cost,date} -> order format.
    const manualSales: ManualSale[] = Array.isArray(parsed.manualSales)
      ? parsed.manualSales.map((s, i) => {
          const anySale = s as unknown as Record<string, unknown>;
          if (Array.isArray(anySale.items)) return s as ManualSale;
          return {
            id: String(anySale.id ?? `old-${i}`),
            date: String(anySale.date ?? new Date().toISOString().slice(0, 10)),
            items: [{
              pid: String(anySale.pid ?? ''), name: String(anySale.name ?? ''),
              qty: Number(anySale.qty ?? 0), price: Number(anySale.price ?? 0),
              cost: anySale.cost == null ? null : Number(anySale.cost), ret: 0, rl: [],
            }],
          };
        })
      : [];
    return {
      costById: parsed.costById ?? {},
      webCost: parsed.webCost ?? {},
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      manualSales,
      webReturns: Array.isArray(parsed.webReturns) ? parsed.webReturns : [],
      low: typeof parsed.low === 'number' ? parsed.low : 5,
    };
  } catch {
    return { ...EMPTY_DB };
  }
}

function saveLocal(db: LocalDb) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(db)); } catch { /* page must work when storage is empty/blocked */ }
}

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString('en-PK')}`;
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
// Weighted average: (oldQty*oldCost + addQty*newPrice) / (oldQty + addQty)
const wavg = (oldQty: number, oldCost: number, addQty: number, newPrice: number) =>
  oldQty + addQty === 0 ? newPrice : round2((oldQty * oldCost + addQty * newPrice) / (oldQty + addQty));

// Two-tap delete: first tap arms ("Pakka? Dobara dabayen"), second deletes.
// Resets after 4 seconds. No confirm()/alert()/prompt() anywhere.
function TwoTapDelete({ onDelete }: { onDelete: () => void }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <button
      type="button"
      onClick={() => {
        if (armed) { if (timer.current) clearTimeout(timer.current); setArmed(false); onDelete(); return; }
        setArmed(true);
        timer.current = setTimeout(() => setArmed(false), 4000);
      }}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${armed ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}
    >
      {armed ? 'Pakka? Dobara dabayen' : 'Delete'}
    </button>
  );
}

type Tab = 'dashboard' | 'inventory' | 'sales' | 'returns' | 'expenses';
const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
  { id: 'returns', label: 'Returns' },
  { id: 'expenses', label: 'Expenses' },
];

export function InventoryManager() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [db, setDb] = useState<LocalDb>(loadLocal);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [backupText, setBackupText] = useState('');

  // Website data: products.stock is the single stock source; orders are sales.
  const fetchWebsite = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [{ data: prods, error: pErr }, { data: ords, error: oErr }] = await Promise.all([
        supabase.from('products').select('id,name,price,stock').order('name'),
        supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
      ]);
      if (pErr) throw new Error(pErr.message);
      if (oErr) throw new Error(oErr.message);
      setProducts(((prods as unknown) as Product[]) || []);
      const list = ((ords as unknown) as Order[]) || [];
      setOrders(list);
      // Snapshot website costs ONCE per order item, so editing a cost later
      // never rewrites past profit. Unknown cost stays null (never invented).
      setDb(prev => {
        const webCost = { ...prev.webCost };
        let changed = false;
        for (const o of list) {
          for (const it of o.order_items ?? []) {
            if (!(it.id in webCost)) {
              webCost[it.id] = it.product_id && prev.costById[it.product_id] != null ? prev.costById[it.product_id] : null;
              changed = true;
            }
          }
        }
        if (!changed) return prev;
        const next = { ...prev, webCost };
        saveLocal(next);
        return next;
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Website data load nahi hua.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWebsite(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDb = (next: LocalDb) => { setDb(next); saveLocal(next); };

  // --- Unified totals: website orders + manual sales, never double-counted.
  const webReturned = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of db.webReturns) m.set(r.itemId, (m.get(r.itemId) ?? 0) + r.qty);
    return m;
  }, [db.webReturns]);

  const totals = useMemo(() => {
    let totalSale = 0, saleProfit = 0, costMissing = false;
    for (const o of orders) {
      for (const it of o.order_items ?? []) {
        const rem = it.quantity - (webReturned.get(it.id) ?? 0);
        totalSale += rem * it.price;
        const cost = db.webCost[it.id];
        if (cost == null) costMissing = true;
        else saleProfit += rem * (it.price - cost);
      }
    }
    for (const s of db.manualSales) {
      for (const it of s.items) {
        const rem = it.qty - it.ret;
        totalSale += rem * it.price;
        if (it.cost == null) costMissing = true;
        else saleProfit += rem * (it.price - it.cost);
      }
    }
    const totalExpenses = db.expenses.reduce((s, e) => s + e.amount, 0);
    return { totalSale, saleProfit, totalExpenses, netProfit: saleProfit - totalExpenses, costMissing };
  }, [orders, db, webReturned]);

  const stockValue = useMemo(() => {
    let value = 0, known = false;
    for (const p of products) {
      const c = db.costById[p.id];
      if (c != null) { value += p.stock * c; known = true; }
    }
    return { value, known };
  }, [products, db.costById]);

  const totalQty = products.reduce((s, p) => s + p.stock, 0);
  const newOrders = orders.filter(o => o.status === 'new').length;
  const expenseByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of db.expenses) m.set(e.cat, (m.get(e.cat) ?? 0) + e.amount);
    return [...m.entries()];
  }, [db.expenses]);

  // Update one website product's stock in Supabase, then refresh local list.
  const setWebsiteStock = async (pid: string, newStock: number) => {
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', pid);
    if (error) throw new Error(error.message);
    setProducts(prev => prev.map(p => (p.id === pid ? { ...p, stock: newStock } : p)));
  };

  // Return helper shared by Returns tab + Sales history buttons.
  // itemCost: manual snapshot, or website cost snapshot (may be null).
  // Stock comes back at that original cost (weighted average on costById).
  const applyReturn = async (kind: 'website' | 'manual', orderId: string, orderNumber: string, itemId: string, pid: string | null, name: string, price: number, itemCost: number | null, q: number) => {
    const prod = pid ? products.find(p => p.id === pid) : undefined;
    if (prod) {
      const oldCost = db.costById[pid as string];
      const nextCost = itemCost == null ? oldCost : (oldCost == null ? itemCost : wavg(prod.stock, oldCost, q, itemCost));
      await setWebsiteStock(prod.id, prod.stock + q);
      if (nextCost != null) updateDb({ ...db, costById: { ...db.costById, [prod.id]: nextCost } });
    }
    if (kind === 'website') {
      updateDb({ ...db, webReturns: [...db.webReturns, { id: uid(), itemId, orderId, orderNumber, name, pid, qty: q, price, cost: itemCost, date: today() }] });
    } else {
      updateDb({
        ...db,
        manualSales: db.manualSales.map(s => s.id === orderId
          ? { ...s, items: s.items.map(it => it.pid === pid && it.name === name ? { ...it, ret: it.ret + q, rl: [...it.rl, { q, d: today() }] } : it) }
          : s),
      });
    }
    setMsg(`Return ho gaya: ${name} x ${q} stock mein wapis.`);
  };

  const downloadBackup = () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), totals, stock: products.map(p => ({ id: p.id, name: p.name, stock: p.stock, cost: db.costById[p.id] ?? null })), localDb: db }, null, 2);
    setBackupText(payload);
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'abr-inventory-backup.json';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* copy box below is the fallback */ }
  };

  return (
    <AdminLayout>
      <div className="max-w-[720px] mx-auto w-full overflow-x-hidden">
        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold ${tab === t.id ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
              {t.label}
            </button>
          ))}
          <button type="button" onClick={fetchWebsite} className="ml-auto px-3 py-2 rounded-lg text-xs font-bold bg-black text-white">Refresh website data</button>
        </div>
        {loadError && <p className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm p-3">Website data load nahi hua: {loadError} — manager-only data phir bhi kaam kare ga, dobara Refresh dabayen.</p>}
        {loading && <p className="text-sm text-gray-500 mb-3">Website orders aur stock load ho rahe hain...</p>}
        {msg && <p className="mb-3 rounded-lg bg-green-50 text-green-800 text-sm p-3">{msg}</p>}
        <p className="text-xs text-gray-500 mb-4">
          Website orders: {orders.length} | Naye orders: {newOrders} | Stock website se live hai — alag stock list nahi hai.
          {totals.costMissing && ' | Kuch sales ki cost nahi hai, un ka profit 0 ginna gaya hai (cost invent nahi ki gayi).'}
        </p>
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs leading-5 text-gray-800">
          <p className="font-bold">Ye kya hai, seedhe lafzon me:</p>
          <p>Ye ABR website ka stock aur sale ka hisab hai. Website pe jo order aata hai, wo yahan sale me dikhta hai. Website ka stock hi yahan stock hai.</p>
          <p><b>Cost nahi hai?</b> Inventory tab me ja kar har product ki asli cost aik dafa likh dein, phir profit aur stock value nikle gi. Cost likhe baghair profit 0 dikhe ga.</p>
          <p><b>Galat cheez edit/delete karni ho to:</b> Manual sale galat ho to Sales tab me Edit/Delete, expense galat ho to Expenses tab me Edit/Delete, cost galat ho to Inventory tab me cost badlein ya Delete dabayen. Website ka order galat ho to wo Orders page se edit/delete hoga, yahan se nahi, taake aik order do jagah se na bigre.</p>
        </div>

        {tab === 'dashboard' && (
          <DashboardTab
            totals={totals} expenseByName={expenseByName} products={products} costById={db.costById} onGoInventory={() => setTab('inventory')}
            totalQty={totalQty} stockValue={stockValue} low={db.low}
            onLow={v => updateDb({ ...db, low: v })} onBackup={downloadBackup} backupText={backupText}
          />
        )}
        {tab === 'inventory' && (
          <InventoryTab products={products} costById={db.costById} low={db.low}
            onCost={(pid, cost) => updateDb({ ...db, costById: { ...db.costById, [pid]: cost } })}
            onStockIn={async (pid, addQty, newPrice) => {
              const prod = products.find(p => p.id === pid);
              if (!prod) return 'Product nahi mila.';
              const oldCost = db.costById[pid];
              const nextCost = oldCost == null ? newPrice : wavg(prod.stock, oldCost, addQty, newPrice);
              try {
                await setWebsiteStock(pid, prod.stock + addQty);
                updateDb({ ...db, costById: { ...db.costById, [pid]: nextCost } });
                setMsg(`Stock In: ${prod.name} +${addQty}, nayi asli cost ${rs(nextCost)}.`);
                return null;
              } catch (e) { return e instanceof Error ? e.message : 'Stock update nahi hua.'; }
            }}
            onDeleteCost={pid => { const c = { ...db.costById }; delete c[pid]; updateDb({ ...db, costById: c }); }}
          />
        )}
        {tab === 'sales' && (
          <SalesTab products={products} orders={orders} webReturned={webReturned} webCost={db.webCost}
            manualSales={db.manualSales} costById={db.costById}
            onManualSale={async (sale) => {
              // Stock check + Supabase stock update, all items at once.
              for (const it of sale.items) {
                const prod = products.find(p => p.id === it.pid);
                if (!prod) return 'Product nahi mila.';
                if (it.qty > prod.stock) return `Is product ka sirf ${prod.stock} stock bacha hai.`;
              }
              try {
                for (const it of sale.items) {
                  const prod = products.find(p => p.id === it.pid)!;
                  await setWebsiteStock(it.pid, prod.stock - it.qty);
                }
                updateDb({ ...db, manualSales: [sale, ...db.manualSales] });
                setMsg('Poori sale save ho gayi, stock update ho gaya.');
                return null;
              } catch (e) { return e instanceof Error ? e.message : 'Sale save nahi hui.'; }
            }}
            onReturn={(orderId, item, q) => applyReturn('manual', orderId, '', item.pid, item.pid, item.name, item.price, item.cost, q)}
            onWebReturn={(o, it, q) => applyReturn('website', o.id, o.order_number, it.id, it.product_id, it.product_name, it.price, db.webCost[it.id] ?? null, q)}
            onEditManual={async (sale, edited) => {
              for (const it of edited.items) {
                const orig = sale.items.find(x => x.pid === it.pid && x.name === it.name);
                const diff = it.qty - (orig?.qty ?? 0);
                const prod = products.find(p => p.id === it.pid);
                if (!prod) return 'Product nahi mila.';
                if (it.qty < it.ret) return 'Quantity wapis ki hui quantity se kam nahi ho sakti.';
                if (diff > 0 && diff > prod.stock) return `Is product ka sirf ${prod.stock} stock bacha hai.`;
              }
              try {
                for (const it of edited.items) {
                  const orig = sale.items.find(x => x.pid === it.pid && x.name === it.name);
                  const diff = it.qty - (orig?.qty ?? 0);
                  if (diff !== 0) {
                    const prod = products.find(p => p.id === it.pid)!;
                    await setWebsiteStock(it.pid, prod.stock - diff);
                  }
                }
                updateDb({ ...db, manualSales: db.manualSales.map(s => s.id === sale.id ? edited : s) });
                setMsg('Sale edit ho gayi.');
                return null;
              } catch (e) { return e instanceof Error ? e.message : 'Edit save nahi hui.'; }
            }}
            onDeleteManual={async (sale) => {
              try {
                for (const it of sale.items) {
                  const rem = it.qty - it.ret;
                  if (rem <= 0) continue;
                  const prod = products.find(p => p.id === it.pid);
                  if (!prod) continue;
                  const oldCost = db.costById[it.pid];
                  const nextCost = it.cost == null ? oldCost : (oldCost == null ? it.cost : wavg(prod.stock, oldCost, rem, it.cost));
                  await setWebsiteStock(it.pid, prod.stock + rem);
                  if (nextCost != null) setDb(prev => ({ ...prev, costById: { ...prev.costById, [it.pid]: nextCost } }));
                }
                updateDb({ ...db, manualSales: db.manualSales.filter(s => s.id !== sale.id) });
                setMsg('Sale delete ho gayi, bacha hua stock wapis aa gaya.');
              } catch (e) { setMsg(e instanceof Error ? e.message : 'Delete nahi hua.'); }
            }}
          />
        )}
        {tab === 'returns' && (
          <ReturnsTab orders={orders} webReturned={webReturned} webCost={db.webCost}
            manualSales={db.manualSales} webReturns={db.webReturns}
            onReturn={(kind, orderId, orderNumber, itemId, pid, name, price, cost, q) => applyReturn(kind, orderId, orderNumber, itemId, pid, name, price, cost, q)}
          />
        )}
        {tab === 'expenses' && (
          <ExpensesTab expenses={db.expenses} suggestions={[...new Set([...EXPENSE_SUGGESTIONS, ...db.expenses.map(e => e.cat)])]}
            total={totals.totalExpenses}
            onAdd={e => updateDb({ ...db, expenses: [e, ...db.expenses] })}
            onEdit={(id, e) => updateDb({ ...db, expenses: db.expenses.map(x => x.id === id ? { ...x, ...e } : x) })}
            onDelete={id => updateDb({ ...db, expenses: db.expenses.filter(x => x.id !== id) })}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// ---------------------------------------------------------------- Dashboard
function DashboardTab({ totals, expenseByName, products, costById, totalQty, stockValue, low, onLow, onBackup, backupText, onGoInventory }: {
  totals: { totalSale: number; saleProfit: number; totalExpenses: number; netProfit: number };
  expenseByName: [string, number][]; products: Product[]; costById: Record<string, number>;
  totalQty: number; stockValue: { value: number; known: boolean }; low: number;
  onLow: (v: number) => void; onBackup: () => void; backupText: string; onGoInventory: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-bold text-gray-900 border-l-4 border-orange-500 pl-2">Total sale (return minus hone ke baad)</h2>
        <p className="text-xl font-black text-orange-600 mt-2">{rs(totals.totalSale)}</p>
        <p className="text-xs text-gray-500">Website orders + manual sales, dono return minus kar ke.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-bold text-gray-900 border-l-4 border-orange-500 pl-2">Total expenses</h2>
        <p className="text-xl font-black mt-2">{rs(totals.totalExpenses)}</p>
        {expenseByName.map(([n, v]) => <p key={n} className="text-sm text-gray-600 flex justify-between"><span>{n}</span><span>{rs(v)}</span></p>)}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-bold text-gray-900 border-l-4 border-orange-500 pl-2">Net profit</h2>
        <p className={`text-xl font-black mt-2 ${totals.netProfit < 0 ? 'text-red-600' : 'text-green-700'}`}>{rs(totals.netProfit)}</p>
        <p className="text-xs text-gray-500">Sale se profit {rs(totals.saleProfit)} minus expenses {rs(totals.totalExpenses)}</p>
      </div>
      <h2 className="font-bold text-gray-900 border-l-4 border-orange-500 pl-2">In stock</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-sm text-gray-500">Total quantity</p><p className="text-xl font-black">{totalQty}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-sm text-gray-500">Stock ki asli value</p><p className="text-xl font-black">{stockValue.known ? rs(stockValue.value) : 'Cost nahi hai'}</p></div>
      </div>
      {products.map(p => {
        const cost = costById[p.id];
        return (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex justify-between gap-3">
              <p className="text-sm font-semibold leading-5">{p.name}</p>
              <p className={`text-sm font-bold shrink-0 ${p.stock <= low ? 'text-amber-700' : ''}`}>{p.stock}{p.stock <= low ? ' (kam)' : ''}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{cost != null ? `Cost ${rs(cost)} x ${p.stock} = ${rs(p.stock * cost)}` : `Sale price ${rs(p.price)} x ${p.stock} — Cost nahi hai`}</p>
            <button type="button" onClick={onGoInventory} className="mt-2 text-xs font-bold text-orange-600">Cost daalein / badlein → Inventory tab</button>
          </div>
        );
      })}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="font-bold border-l-4 border-orange-500 pl-2">Settings</h2>
        <label className="flex items-center justify-between gap-3 text-sm font-semibold">Kam stock alert (is se kam ya barabar)
          <input type="number" min={0} value={low} onChange={e => onLow(Number(e.target.value) || 0)} className="border rounded-lg px-2 py-1.5 w-20 text-right" />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onBackup} className="px-4 py-2 rounded-lg bg-black text-white text-sm font-bold">Backup download</button>
        </div>
        {backupText && <textarea readOnly value={backupText} rows={6} className="w-full border rounded-lg p-2 text-xs font-mono" aria-label="Backup JSON copy karein" />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Inventory
function InventoryTab({ products, costById, low, onCost, onStockIn, onDeleteCost }: {
  products: Product[]; costById: Record<string, number>; low: number;
  onCost: (pid: string, cost: number) => void;
  onStockIn: (pid: string, addQty: number, newPrice: number) => Promise<string | null>;
  onDeleteCost: (pid: string) => void;
}) {
  const [pid, setPid] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [newPrice, setNewPrice] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const selected = products.find(p => p.id === pid);
  useEffect(() => { if (selected) setNewPrice(String(costById[pid] ?? '')); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);
  return (
    <div className="space-y-4">
      <h2 className="font-bold border-l-4 border-orange-500 pl-2">Stock list — website stock hi asli stock hai</h2>
      {products.map(p => {
        const cost = costById[p.id];
        return (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between gap-3">
              <p className="text-sm font-semibold leading-5">{p.name} {p.stock <= low && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Kam stock</span>}</p>
              <TwoTapDelete onDelete={() => onDeleteCost(p.id)} />
            </div>
            <p className="text-sm text-gray-500">Asli price: {cost != null ? rs(cost) : 'Cost nahi hai'} | Quantity: {p.stock} | Stock value: {cost != null ? rs(p.stock * cost) : 'Cost nahi hai'}</p>
            <label className="flex items-center gap-2 mt-2 text-sm font-semibold">Asli price / cost (1 piece)
              <input type="number" min={0} defaultValue={cost ?? ''} key={`${p.id}-${cost ?? 'none'}`} placeholder="Cost likhein"
                onBlur={e => { const v = Number(e.target.value); if (v > 0) onCost(p.id, v); }}
                className="border rounded-lg px-2 py-1.5 w-28 text-right" />
            </label>
            <p className="text-xs text-gray-500">Cost badalne se purani sales ka profit nahi badle ga (snapshot mehfooz hai).</p>
          </div>
        );
      })}
      {products.length > 0 && (
        <form className="bg-white rounded-xl border border-gray-200 p-4 space-y-3" onSubmit={async e => {
          e.preventDefault(); setErr(null);
          if (!pid) { setErr('Product chunein.'); return; }
          if (addQty < 1 || !newPrice || Number(newPrice) <= 0) { setErr('Sahi quantity aur asli price likhein.'); return; }
          const errMsg = await onStockIn(pid, addQty, Number(newPrice));
          if (errMsg) setErr(errMsg);
        }}>
          <h2 className="font-bold border-l-4 border-orange-500 pl-2">Stock In (naya maal aaya)</h2>
          <select value={pid} onChange={e => setPid(e.target.value)} className="w-full border rounded-lg px-3 py-2">
            <option value="">Product chunein</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock {p.stock})</option>)}
          </select>
          <input type="number" min={1} value={addQty} onChange={e => setAddQty(Number(e.target.value))} placeholder="Kitna maal aaya" className="w-full border rounded-lg px-3 py-2" />
          <input type="number" min={0} value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Asli price (1 piece)" className="w-full border rounded-lg px-3 py-2" />
          <p className="text-xs text-gray-500">Weighted average: nayi cost = (purana stock x purani cost + naya maal x nayi price) / total stock.</p>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button type="submit" className="w-full py-2.5 rounded-lg bg-orange-500 text-white font-bold">Stock In karein</button>
        </form>
      )}
    </div>
  );
}

// ------------------------------------------------------------------- Sales
type CartLine = { pid: string; name: string; qty: number; price: number };

function SalesTab({ products, orders, webReturned, webCost, manualSales, costById, onManualSale, onReturn, onWebReturn, onEditManual, onDeleteManual }: {
  products: Product[]; orders: Order[]; webReturned: Map<string, number>; webCost: Record<string, number | null>;
  manualSales: ManualSale[]; costById: Record<string, number>;
  onManualSale: (sale: ManualSale) => Promise<string | null>;
  onReturn: (orderId: string, item: ManualItem, q: number) => void;
  onWebReturn: (o: Order, it: OrderItem, q: number) => void;
  onEditManual: (sale: ManualSale, edited: ManualSale) => Promise<string | null>;
  onDeleteManual: (sale: ManualSale) => void;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selPid, setSelPid] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(today());
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<ManualSale | null>(null);
  const [editErr, setEditErr] = useState<string | null>(null);

  const cartTotal = cart.reduce((s, l) => s + l.qty * l.price, 0);
  const cartProfit = cart.reduce((s, l) => s + l.qty * (l.price - (costById[l.pid] ?? l.price)), 0);

  const addToCart = () => {
    setErr(null);
    const prod = products.find(p => p.id === selPid);
    if (!prod) { setErr('Product chunein.'); return; }
    if (!price || Number(price) <= 0) { setErr('Sale price likhein.'); return; }
    const inCart = cart.filter(l => l.pid === selPid).reduce((s, l) => s + l.qty, 0);
    const remaining = prod.stock - inCart;
    if (qty < 1 || qty > remaining) { setErr(`Is product ka sirf ${remaining} stock bacha hai.`); return; }
    const p = Number(price);
    setCart(prev => {
      const same = prev.find(l => l.pid === selPid && l.price === p);
      if (same) return prev.map(l => l === same ? { ...l, qty: l.qty + qty } : l);
      return [...prev, { pid: selPid, name: prod.name, qty, price: p }];
    });
    setPrice(''); // sale price har dafa khud likhni hai, prefill nahi hoti
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="font-bold border-l-4 border-orange-500 pl-2">Nayi sale (ek ya zyada products)</h2>
        <select value={selPid} onChange={e => setSelPid(e.target.value)} className="w-full border rounded-lg px-3 py-2">
          <option value="">Product chunein</option>
          {products.map(p => {
            const inCart = cart.filter(l => l.pid === p.id).reduce((s, l) => s + l.qty, 0);
            return <option key={p.id} value={p.id}>{p.name} (stock {p.stock - inCart})</option>;
          })}
        </select>
        <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} placeholder="Quantity" className="w-full border rounded-lg px-3 py-2" />
        <input type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} placeholder="Sale price (1 piece)" className="w-full border rounded-lg px-3 py-2" />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="button" onClick={addToCart} className="w-full py-2.5 rounded-lg bg-black text-white font-bold">+ Sale mein add karein</button>
        <h3 className="font-bold">Is sale mein</h3>
        {cart.map((l, i) => (
          <p key={i} className="text-sm flex justify-between gap-2"><span>{l.name} x {l.qty} — {rs(l.qty * l.price)}</span>
            <button type="button" onClick={() => setCart(cart.filter((_, j) => j !== i))} className="text-red-600 font-bold">Hatayen</button></p>
        ))}
        <p className="text-sm font-bold flex justify-between"><span>Total sale</span><span>{rs(cartTotal)}</span></p>
        <p className="text-sm text-gray-500 flex justify-between"><span>Profit (cost maloom ho to)</span><span>{rs(cartProfit)}</span></p>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        <button type="button" className="w-full py-3 rounded-lg bg-orange-500 text-white font-black" onClick={async () => {
          if (cart.length === 0) { setErr('Cart khaali hai.'); return; }
          const sale: ManualSale = { id: uid(), date, items: cart.map(l => ({ pid: l.pid, name: l.name, qty: l.qty, price: l.price, cost: costById[l.pid] ?? null, ret: 0, rl: [] })) };
          const errMsg = await onManualSale(sale);
          if (errMsg) setErr(errMsg); else { setCart([]); setErr(null); }
        }}>Poori sale save karein</button>
      </div>

      <h2 className="font-bold border-l-4 border-orange-500 pl-2">Website sales (live — edit/delete yahan nahi, Orders page se)</h2>
      {orders.map(o => {
        const items = o.order_items ?? [];
        const total = items.reduce((s, it) => s + (it.quantity - (webReturned.get(it.id) ?? 0)) * it.price, 0);
        const profit = items.reduce((s, it) => { const c = webCost[it.id]; return c == null ? s : s + (it.quantity - (webReturned.get(it.id) ?? 0)) * (it.price - c); }, 0);
        const costMissing = items.some(it => webCost[it.id] == null);
        return (
          <div key={o.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <p className="font-bold flex justify-between gap-2"><span>{o.order_number} — {o.created_at.slice(0, 10)}</span><span className="text-sm font-semibold text-gray-500">{o.status}</span></p>
            <p className="text-sm text-gray-500">{o.customer_name} | Total {rs(total)} | Profit {costMissing ? `${rs(profit)} (kuch cost nahi hai)` : rs(profit)}</p>
            {items.map(it => {
              const rem = it.quantity - (webReturned.get(it.id) ?? 0);
              return (
                <p key={it.id} className="text-sm flex flex-wrap justify-between gap-2">
                  <span>{it.product_name} x {it.quantity}{webReturned.get(it.id) ? ` (${webReturned.get(it.id)} wapis)` : ''} — {rs(rem * it.price)}</span>
                  {rem > 0 && <button type="button" onClick={() => onWebReturn(o, it, 1)} className="text-orange-600 font-bold">1 Return karein</button>}
                </p>
              );
            })}
          </div>
        );
      })}

      <h2 className="font-bold border-l-4 border-orange-500 pl-2">Manual sales history (newest first)</h2>
      {manualSales.map(s => {
        const profit = s.items.reduce((sum, it) => sum + (it.qty - it.ret) * (it.price - (it.cost ?? it.price)), 0);
        return (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <p className="font-bold flex justify-between"><span>{s.date}</span><span>Profit {rs(profit)}</span></p>
            {s.items.map((it, i) => (
              <p key={i} className="text-sm flex flex-wrap justify-between gap-2">
                <span>{it.name} x {it.qty}{it.ret ? ` (${it.ret} wapis)` : ''} — {rs((it.qty - it.ret) * it.price)}</span>
                {it.qty - it.ret > 0 && <button type="button" onClick={() => onReturn(s.id, it, 1)} className="text-orange-600 font-bold">1 Return karein</button>}
              </p>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(s)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold">Edit</button>
              <TwoTapDelete onDelete={() => onDeleteManual(s)} />
            </div>
          </div>
        );
      })}
      {editing && (
        <EditManualSale sale={editing} onCancel={() => setEditing(null)} err={editErr}
          onSave={async (edited) => { const e = await onEditManual(editing, edited); if (e) setEditErr(e); else setEditing(null); }} />
      )}
    </div>
  );
}

function EditManualSale({ sale, onCancel, onSave, err }: { sale: ManualSale; onCancel: () => void; onSave: (s: ManualSale) => Promise<void>; err: string | null }) {
  const [date, setDate] = useState(sale.date);
  const [items, setItems] = useState(sale.items.map(it => ({ ...it })));
  return (
    <form className="bg-white rounded-xl border-2 border-orange-500 p-4 space-y-3" onSubmit={e => { e.preventDefault(); onSave({ ...sale, date, items }); }}>
      <h3 className="font-bold">Sale edit karein</h3>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
      {items.map((it, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <p className="font-bold text-sm">{it.name} (wapis: {it.ret})</p>
          <label className="block text-sm">Quantity <input type="number" min={it.ret} value={it.qty} onChange={e => setItems(items.map((x, j) => j === i ? { ...x, qty: Number(e.target.value) } : x))} className="w-full border rounded-lg px-2 py-1.5" /></label>
          <label className="block text-sm">Sale price <input type="number" min={0} value={it.price} onChange={e => setItems(items.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} className="w-full border rounded-lg px-2 py-1.5" /></label>
          <label className="block text-sm">Asli price <input type="number" min={0} value={it.cost ?? ''} onChange={e => setItems(items.map((x, j) => j === i ? { ...x, cost: e.target.value === '' ? null : Number(e.target.value) } : x))} className="w-full border rounded-lg px-2 py-1.5" /></label>
        </div>
      ))}
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-2"><button type="submit" className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold">Save</button><button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100 font-bold">Cancel</button></div>
    </form>
  );
}

// ----------------------------------------------------------------- Returns
function ReturnsTab({ orders, webReturned, webCost, manualSales, webReturns, onReturn }: {
  orders: Order[]; webReturned: Map<string, number>; webCost: Record<string, number | null>;
  manualSales: ManualSale[]; webReturns: WebReturn[];
  onReturn: (kind: 'website' | 'manual', orderId: string, orderNumber: string, itemId: string, pid: string | null, name: string, price: number, cost: number | null, q: number) => void;
}) {
  type Option = { kind: 'website' | 'manual'; orderId: string; orderNumber: string; itemId: string; pid: string | null; name: string; price: number; cost: number | null; remaining: number; date: string };
  const options: Option[] = [];
  for (const o of orders) for (const it of o.order_items ?? []) {
    const rem = it.quantity - (webReturned.get(it.id) ?? 0);
    if (rem > 0) options.push({ kind: 'website', orderId: o.id, orderNumber: o.order_number, itemId: it.id, pid: it.product_id, name: it.product_name, price: it.price, cost: webCost[it.id] ?? null, remaining: rem, date: o.created_at.slice(0, 10) });
  }
  for (const s of manualSales) for (const it of s.items) {
    const rem = it.qty - it.ret;
    if (rem > 0) options.push({ kind: 'manual', orderId: s.id, orderNumber: '', itemId: it.pid, pid: it.pid, name: it.name, price: it.price, cost: it.cost, remaining: rem, date: s.date });
  }
  const [sel, setSel] = useState(0);
  const [q, setQ] = useState(1);
  const opt = options[sel];
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="font-bold border-l-4 border-orange-500 pl-2">Return daalein</h2>
        <select value={sel} onChange={e => { setSel(Number(e.target.value)); setQ(1); }} className="w-full border rounded-lg px-3 py-2">
          {options.map((o, i) => <option key={i} value={i}>{o.name} | {o.date} | sale {rs(o.price)} x {o.remaining}</option>)}
        </select>
        {opt ? (
          <>
            <input type="number" min={1} max={opt.remaining} value={q} onChange={e => setQ(Math.min(opt.remaining, Math.max(1, Number(e.target.value) || 1)))} className="w-full border rounded-lg px-3 py-2" />
            <p className="text-sm text-gray-600">Sale minus {rs(q * opt.price)} | Profit minus {opt.cost == null ? 'cost nahi hai (0)' : rs(q * (opt.price - opt.cost))} | Stock mein wapis {opt.cost == null ? 'qty + qty, value cost nahi hai' : rs(q * opt.cost)}</p>
            <button type="button" onClick={() => onReturn(opt.kind, opt.orderId, opt.orderNumber, opt.itemId, opt.pid, opt.name, opt.price, opt.cost, q)} className="w-full py-2.5 rounded-lg bg-orange-500 text-white font-bold">Return karein</button>
          </>
        ) : <p className="text-sm text-gray-500">Koi wapis karne wali sale nahi hai.</p>}
      </div>
      <h2 className="font-bold border-l-4 border-orange-500 pl-2">Return history</h2>
      {webReturns.map(r => (
        <p key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 text-sm">{r.name} x {r.qty} — {r.date} | Sale minus {rs(r.qty * r.price)} | Profit minus {r.cost == null ? 'cost nahi hai' : rs(r.qty * (r.price - r.cost))} | Stock mein wapis {r.cost == null ? 'qty' : rs(r.qty * r.cost)}</p>
      ))}
      {manualSales.flatMap(s => s.items.flatMap(it => it.rl.map((r, i) => (
        <p key={`${s.id}-${i}`} className="bg-white rounded-xl border border-gray-200 p-4 text-sm">{it.name} x {r.q} — {r.d} | Sale minus {rs(r.q * it.price)} | Profit minus {it.cost == null ? 'cost nahi hai' : rs(r.q * (it.price - it.cost))} | Stock mein wapis {it.cost == null ? 'qty' : rs(r.q * it.cost)}</p>
      ))))}
    </div>
  );
}

// ---------------------------------------------------------------- Expenses
function ExpensesTab({ expenses, suggestions, total, onAdd, onEdit, onDelete }: {
  expenses: Expense[]; suggestions: string[]; total: number;
  onAdd: (e: Expense) => void; onEdit: (id: string, e: Partial<Expense>) => void; onDelete: (id: string) => void;
}) {
  const [cat, setCat] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  return (
    <div className="space-y-4">
      <form className="bg-white rounded-xl border border-gray-200 p-4 space-y-3" onSubmit={e => {
        e.preventDefault(); setErr(null);
        if (!cat.trim() || !amount || Number(amount) <= 0) { setErr('Expense ka naam aur sahi amount likhein.'); return; }
        onAdd({ id: uid(), cat: cat.trim(), amount: Number(amount), date, note: note.trim() });
        setCat(''); setAmount(''); setNote(''); setDate(today());
      }}>
        <h2 className="font-bold border-l-4 border-orange-500 pl-2">Naya expense add karein</h2>
        <input list="exp-names" value={cat} onChange={e => setCat(e.target.value)} placeholder="Expense ka naam (khud likhein)" className="w-full border rounded-lg px-3 py-2" />
        <datalist id="exp-names">{suggestions.map(s => <option key={s} value={s} />)}</datalist>
        <input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full border rounded-lg px-3 py-2" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" className="w-full border rounded-lg px-3 py-2" />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" className="w-full py-2.5 rounded-lg bg-orange-500 text-white font-bold">Expense add karein</button>
      </form>
      <h2 className="font-bold border-l-4 border-orange-500 pl-2">Total expenses: {rs(total)}</h2>
      {expenses.map(ex => editing?.id === ex.id ? (
        <form key={ex.id} className="bg-white rounded-xl border-2 border-orange-500 p-4 space-y-2" onSubmit={e => { e.preventDefault(); onEdit(ex.id, editing); setEditing(null); }}>
          <input value={editing.cat} onChange={e => setEditing({ ...editing, cat: e.target.value })} className="w-full border rounded-lg px-2 py-1.5" />
          <input type="number" value={editing.amount} onChange={e => setEditing({ ...editing, amount: Number(e.target.value) })} className="w-full border rounded-lg px-2 py-1.5" />
          <input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} className="w-full border rounded-lg px-2 py-1.5" />
          <input value={editing.note} onChange={e => setEditing({ ...editing, note: e.target.value })} className="w-full border rounded-lg px-2 py-1.5" />
          <div className="flex gap-2"><button type="submit" className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold">Save</button><button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg bg-gray-100 font-bold">Cancel</button></div>
        </form>
      ) : (
        <div key={ex.id} className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between gap-3">
          <div><p className="font-bold">{rs(ex.amount)} — {ex.cat}</p><p className="text-sm text-gray-500">{ex.date}{ex.note ? ` | ${ex.note}` : ''}</p></div>
          <div className="flex gap-2 shrink-0"><button type="button" onClick={() => setEditing(ex)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold">Edit</button><TwoTapDelete onDelete={() => onDelete(ex.id)} /></div>
        </div>
      ))}
    </div>
  );
}
