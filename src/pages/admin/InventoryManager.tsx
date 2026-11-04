import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from './AdminLayout';

// ---------------------------------------------------------------------------
// ABR Gadgets — Inventory Manager (inside the admin panel, but FULLY
// SEPARATE from the website — owner decision 2026-11-04, voice notes 172/173).
//
//  * Website admin panel ka system ALAG hai, ye inventory system ALAG hai.
//  * Website ke saath is ka KOI link nahi: na website orders sale me aate
//    hain, na website stock yahan aata hai.
//  * Owner khud add karta hai: inventory (product, quantity, khareed price),
//    sale (us asli price par jis par us ne becha — website price par mazeed
//    discount bhi hota hai, is liye website price use nahi hoti), kharcha.
//  * Profit = sale price − khareed price, phir minus total kharcha.
//  * Sab kuch sirf is phone/browser ke localStorage "bizmanager-v1" me hai.
//    Website ke products/orders yahan se delete ya change NAHI hote.
// ---------------------------------------------------------------------------

type StockProduct = { id: string; name: string; stock: number };


const LS_KEY = 'bizmanager-v1';
const EXPENSE_SUGGESTIONS = ['Stock Bilty', 'Packing', 'Shipping', 'Ads', 'Rent', 'Salary', 'Bills', 'Other'];

type ManualItem = { pid: string; name: string; qty: number; price: number; cost: number | null; ret: number; rl: { q: number; d: string }[] };
type ManualSale = { id: string; date: string; items: ManualItem[] };
type Expense = { id: string; cat: string; amount: number; date: string; note: string };
type WebReturn = { id: string; itemId: string; orderId: string; orderNumber: string; name: string; pid: string | null; qty: number; price: number; cost: number | null; date: string };
type LocalDb = {
  manualProducts: { id: string; name: string; qty: number }[];
  costById: Record<string, number>;
  webCost: Record<string, number | null>;
  expenses: Expense[];
  manualSales: ManualSale[];
  webReturns: WebReturn[];
  low: number;
};

const EMPTY_DB: LocalDb = { manualProducts: [], costById: {}, webCost: {}, expenses: [], manualSales: [], webReturns: [], low: 5 };

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
      manualProducts: Array.isArray(parsed.manualProducts) ? parsed.manualProducts : [],
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
  const products: StockProduct[] = useMemo(() => db.manualProducts.map(mp => ({ id: mp.id, name: mp.name, stock: mp.qty })), [db.manualProducts]);
  const [msg, setMsg] = useState<string | null>(null);
  const [backupText, setBackupText] = useState('');


  const updateDb = (next: LocalDb | ((prev: LocalDb) => LocalDb)) => {
    setDb(prev => {
      const n = typeof next === 'function' ? (next as (p: LocalDb) => LocalDb)(prev) : next;
      saveLocal(n);
      return n;
    });
  };

  // --- Totals: SIRF manual sales (owner 2026-11-04). Website orders
  // sale me nahi ginay jate, kyunki owner khud asli sale price add karta hai.
  const totals = useMemo(() => {
    let totalSale = 0, saleProfit = 0, costMissing = false;
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
  }, [db]);

  const stockValue = useMemo(() => {
    let value = 0, known = false;
    for (const p of products) {
      const c = db.costById[p.id];
      if (c != null) { value += p.stock * c; known = true; }
    }
    return { value, known };
  }, [products, db.costById]);

  const totalQty = products.reduce((s, p) => s + p.stock, 0);
  const expenseByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of db.expenses) m.set(e.cat, (m.get(e.cat) ?? 0) + e.amount);
    return [...m.entries()];
  }, [db.expenses]);

  // Return helper: sirf manual sales ke liye. Stock usi asli cost par
  // wapis aata hai (weighted average on costById). Aik hi update me
  // stock + cost + sale ka return, taake koi update doosre ko na mita de.
  const applyReturn = async (orderId: string, item: ManualItem, q: number) => {
    const { pid, name, cost: itemCost } = item;
    updateDb(prev => {
      const prod = prev.manualProducts.find(mp => mp.id === pid);
      const oldCost = prev.costById[pid];
      const nextCost = !prod ? oldCost : (itemCost == null ? oldCost : (oldCost == null ? itemCost : wavg(prod.qty, oldCost, q, itemCost)));
      return {
        ...prev,
        manualProducts: prev.manualProducts.map(mp => mp.id === pid ? { ...mp, qty: mp.qty + q } : mp),
        costById: nextCost == null ? prev.costById : { ...prev.costById, [pid]: nextCost },
        manualSales: prev.manualSales.map(s => s.id === orderId
          ? { ...s, items: s.items.map(it => it.pid === pid && it.name === name ? { ...it, ret: it.ret + q, rl: [...it.rl, { q, d: today() }] } : it) }
          : s),
      };
    });
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
        </div>
        {msg && <p className="mb-3 rounded-lg bg-green-50 text-green-800 text-sm p-3">{msg}</p>}
        <p className="text-xs text-gray-500 mb-4">
          Alag hisab: website se koi link nahi. Inventory, sale, kharcha aur cost tum khud add karo, us asli price par jis par becha.
          {totals.costMissing && ' • Kuch sales ki cost nahi hai, un ka profit 0 hai.'}
        </p>


        {tab === 'dashboard' && (
          <DashboardTab
            totals={totals} expenseByName={expenseByName} products={products} onGoInventory={() => setTab('inventory')}
            totalQty={totalQty} stockValue={stockValue} low={db.low}
            onLow={v => updateDb({ ...db, low: v })} onBackup={downloadBackup} backupText={backupText}
            onZero={() => { downloadBackup(); updateDb({ ...EMPTY_DB, low: db.low }); setMsg('Sab kuch zero ho gaya — naya hisab shuru. Purana data backup me save ho gaya hai.'); }}
          />
        )}
        {tab === 'inventory' && (
          <InventoryTab products={products} costById={db.costById} low={db.low}
            onCost={(pid, cost) => updateDb(prev => ({ ...prev, costById: { ...prev.costById, [pid]: cost } }))}
            onAddProduct={(name, qty, cost) => {
              const id = uid();
              updateDb(prev => ({ ...prev, manualProducts: [...prev.manualProducts, { id, name, qty }], costById: cost == null ? prev.costById : { ...prev.costById, [id]: cost } }));
              setMsg(`Inventory me add ho gaya: ${name} x ${qty}.`);
            }}
            onEditProduct={(id, name, qty, cost) => updateDb(prev => ({ ...prev, manualProducts: prev.manualProducts.map(mp => mp.id === id ? { ...mp, name, qty } : mp), costById: cost == null ? prev.costById : { ...prev.costById, [id]: cost } }))}
            onDeleteProduct={id => updateDb(prev => ({ ...prev, manualProducts: prev.manualProducts.filter(mp => mp.id !== id) }))}
            onStockIn={async (pid, addQty, newPrice) => {
              const prod = products.find(p => p.id === pid);
              if (!prod) return 'Product nahi mila.';
              updateDb(prev => {
                const oldCost = prev.costById[pid];
                const nextCost = oldCost == null ? newPrice : wavg(prod.stock, oldCost, addQty, newPrice);
                return { ...prev, manualProducts: prev.manualProducts.map(mp => mp.id === pid ? { ...mp, qty: mp.qty + addQty } : mp), costById: { ...prev.costById, [pid]: nextCost } };
              });
              setMsg(`Stock In: ${prod.name} +${addQty}.`);
              return null;
            }}
            onDeleteCost={pid => updateDb(prev => { const c = { ...prev.costById }; delete c[pid]; return { ...prev, costById: c }; })}
          />
        )}
        {tab === 'sales' && (
          <SalesTab products={products}
            manualSales={db.manualSales} costById={db.costById}
            onManualSale={async (sale) => {
              for (const it of sale.items) {
                const prod = products.find(p => p.id === it.pid);
                if (!prod) return 'Product nahi mila.';
                if (it.qty > prod.stock) return `Is product ka sirf ${prod.stock} stock bacha hai.`;
              }
              updateDb(prev => ({
                ...prev,
                manualProducts: prev.manualProducts.map(mp => {
                  const used = sale.items.filter(it => it.pid === mp.id).reduce((s, it) => s + it.qty, 0);
                  return used ? { ...mp, qty: mp.qty - used } : mp;
                }),
                manualSales: [sale, ...prev.manualSales],
              }));
              setMsg('Poori sale save ho gayi, stock update ho gaya.');
              return null;
            }}
            onReturn={(orderId, item, q) => applyReturn(orderId, item, q)}
            onEditManual={async (sale, edited) => {
              for (const it of edited.items) {
                const orig = sale.items.find(x => x.pid === it.pid && x.name === it.name);
                const diff = it.qty - (orig?.qty ?? 0);
                const prod = products.find(p => p.id === it.pid);
                if (!prod) return 'Product nahi mila.';
                if (it.qty < it.ret) return 'Quantity wapis ki hui quantity se kam nahi ho sakti.';
                if (diff > 0 && diff > prod.stock) return `Is product ka sirf ${prod.stock} stock bacha hai.`;
              }
              updateDb(prev => ({
                ...prev,
                manualProducts: prev.manualProducts.map(mp => {
                  const diff = edited.items.filter(it => it.pid === mp.id).reduce((s, it) => {
                    const orig = sale.items.find(x => x.pid === it.pid && x.name === it.name);
                    return s + (it.qty - (orig?.qty ?? 0));
                  }, 0);
                  return diff ? { ...mp, qty: mp.qty - diff } : mp;
                }),
                manualSales: prev.manualSales.map(s => s.id === sale.id ? edited : s),
              }));
              setMsg('Sale edit ho gayi.');
              return null;
            }}
            onDeleteManual={async (sale) => {
              updateDb(prev => {
                let costById = { ...prev.costById };
                let manualProducts = [...prev.manualProducts];
                for (const it of sale.items) {
                  const rem = it.qty - it.ret;
                  if (rem <= 0) continue;
                  const prod = manualProducts.find(mp => mp.id === it.pid);
                  if (!prod) continue;
                  const oldCost = costById[it.pid];
                  const nextCost = it.cost == null ? oldCost : (oldCost == null ? it.cost : wavg(prod.qty, oldCost, rem, it.cost));
                  if (nextCost != null) costById[it.pid] = nextCost;
                  manualProducts = manualProducts.map(mp => mp.id === it.pid ? { ...mp, qty: mp.qty + rem } : mp);
                }
                return { ...prev, manualProducts, costById, manualSales: prev.manualSales.filter(s => s.id !== sale.id) };
              });
              setMsg('Sale delete ho gayi, bacha hua stock wapis aa gaya.');
            }}
          />
        )}
        {tab === 'returns' && (
          <ReturnsTab
            manualSales={db.manualSales}
            onReturn={(orderId, item, q) => applyReturn(orderId, item, q)}
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
function DashboardTab({ totals, expenseByName, products, totalQty, stockValue, low, onLow, onBackup, backupText, onGoInventory, onZero }: {
  totals: { totalSale: number; saleProfit: number; totalExpenses: number; netProfit: number };
  expenseByName: [string, number][]; products: StockProduct[];
  totalQty: number; stockValue: { value: number; known: boolean }; low: number;
  onLow: (v: number) => void; onBackup: () => void; backupText: string; onGoInventory: () => void; onZero: () => void;
}) {
  const [zeroArmed, setZeroArmed] = useState(false);
  const zeroTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (zeroTimer.current) clearTimeout(zeroTimer.current); }, []);
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-100 shadow-md p-4">
        <p className="text-xs font-bold tracking-wide text-orange-600">TOTAL SALE</p>
        <p className="text-xl font-black text-gray-900 mt-1">{rs(totals.totalSale)}</p>
        <p className="text-xs text-gray-500 mt-1">Sirf wo sales jo tum ne khud add ki hain, return minus kar ke. Website se koi link nahi.</p>
      </div>
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 shadow-md p-4">
        <p className="text-xs font-bold tracking-wide text-gray-500">TOTAL KHARCHA</p>
        <p className="text-xl font-black text-gray-900 mt-1">{rs(totals.totalExpenses)}</p>
        {expenseByName.map(([n, v]) => <p key={n} className="text-sm text-gray-600 flex justify-between"><span>{n}</span><span>{rs(v)}</span></p>)}
      </div>
      <div className={`rounded-2xl border shadow-md p-4 ${totals.netProfit < 0 ? 'bg-gradient-to-br from-red-50 to-white border-red-200' : 'bg-gradient-to-br from-green-50 to-white border-green-200'}`}>
        <h2 className="font-bold border-l-4 border-orange-500 pl-2">{totals.netProfit < 0 ? 'LOSS hai — sab kharcha nikalne ke baad' : 'BACHAT hai — sab kharcha nikalne ke baad'}</h2>
        <p className={`text-xl font-black mt-2 ${totals.netProfit < 0 ? 'text-red-600' : 'text-green-700'}`}>{rs(totals.netProfit)}</p>
        <p className="text-sm text-gray-700 mt-1">
          {totals.netProfit < 0
            ? `Loss me hain: kharcha sale profit se ${rs(-totals.netProfit)} zyada hai. (Sale profit ${rs(totals.saleProfit)} − kharcha ${rs(totals.totalExpenses)})`
            : `Bachat hui hai: sale profit ${rs(totals.saleProfit)} − kharcha ${rs(totals.totalExpenses)} = bachat ${rs(totals.netProfit)}`}
        </p>
      </div>
      <h2 className="font-bold text-gray-900 border-l-4 border-orange-500 pl-2">In stock (sirf total)</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"><p className="text-sm text-gray-500">Total quantity</p><p className="text-xl font-black">{totalQty}</p></div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"><p className="text-sm text-gray-500">Stock ki asli value</p><p className="text-xl font-black">{stockValue.known ? rs(stockValue.value) : 'Cost nahi hai'}</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex justify-between items-center gap-3">
        <p className="text-sm">Kam stock wale products: <b className="text-amber-700">{products.filter(p => p.stock <= low).length}</b> — poori list Inventory tab me hai.</p>
        <button type="button" onClick={onGoInventory} className="shrink-0 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold">Inventory kholein →</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="font-bold border-l-4 border-orange-500 pl-2">Settings</h2>
        <label className="flex items-center justify-between gap-3 text-sm font-semibold">Kam stock alert (is se kam ya barabar)
          <input type="number" min={0} value={low} onChange={e => onLow(Number(e.target.value) || 0)} className="border rounded-lg px-2 py-1.5 w-20 text-right" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onBackup} className="px-4 py-2 rounded-lg bg-black text-white text-sm font-bold">Backup download</button>
          <button type="button" onClick={() => {
            if (zeroArmed) { if (zeroTimer.current) clearTimeout(zeroTimer.current); setZeroArmed(false); onZero(); return; }
            setZeroArmed(true);
            zeroTimer.current = setTimeout(() => setZeroArmed(false), 4000);
          }} className={`px-4 py-2 rounded-lg text-sm font-bold ${zeroArmed ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}>
            {zeroArmed ? 'Pakka? Dobara dabayen — sab zero ho jaye ga' : 'Sab kuch zero kar dein (naya hisab)'}
          </button>
        </div>
        <p className="text-xs text-gray-500">Zero dabane se pehle backup download ho jaye ga. Website ke products/orders is se delete nahi hote — sirf is manager ka hisab zero hota hai.</p>
        {backupText && <textarea readOnly value={backupText} rows={6} className="w-full border rounded-lg p-2 text-xs font-mono" aria-label="Backup JSON copy karein" />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Inventory
// Cost likhne ka saaf tareeqa: number likhein, Save dabayen, "Save ho gaya" nazar aaye ga.
function CostField({ initial, onSave }: { initial: number | undefined; onSave: (v: number) => void }) {
  const [val, setVal] = useState(initial == null ? '' : String(initial));
  const [saved, setSaved] = useState(false);
  return (
    <span className="flex items-center gap-1">
      <input type="number" min={0} value={val} placeholder="Cost" aria-label="Cost"
        onChange={e => { setVal(e.target.value); setSaved(false); }}
        className="border rounded-lg px-2 py-1.5 w-20 text-right text-sm" />
      <button type="button" onClick={() => { const v = Number(val); if (v > 0) { onSave(v); setSaved(true); } }}
        className="px-2 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold">Save</button>
      {saved && <span className="text-xs font-bold text-green-700">✓ Save ho gaya</span>}
    </span>
  );
}

function InventoryTab({ products, costById, low, onCost, onStockIn, onDeleteCost, onAddProduct, onEditProduct, onDeleteProduct }: {
  products: StockProduct[]; costById: Record<string, number>; low: number;
  onCost: (pid: string, cost: number) => void;
  onStockIn: (pid: string, addQty: number, newPrice: number) => Promise<string | null>;
  onDeleteCost: (pid: string) => void;
  onAddProduct: (name: string, qty: number, cost: number | null) => void;
  onEditProduct: (id: string, name: string, qty: number, cost: number | null) => void;
  onDeleteProduct: (id: string) => void;
}) {
  const [pid, setPid] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [newPrice, setNewPrice] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newCost, setNewCost] = useState('');
  const [addErr, setAddErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string; qty: number; cost: string } | null>(null);
  const selected = products.find(p => p.id === pid);
  useEffect(() => { if (selected) setNewPrice(String(costById[pid] ?? '')); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);
  return (
    <div className="space-y-4">
      <h2 className="font-bold border-l-4 border-orange-500 pl-2">Stock list — sirf naam aur stock</h2>
      <p className="text-xs text-gray-500">Har line me: product ka naam — aage stock — stock kam ho to LOW ALERT. Cost isi line me likh kar Save dabayen, galat ho to Delete dabayen.</p>
      <form className="bg-white rounded-xl border-2 border-orange-500 p-4 space-y-3" onSubmit={e => {
        e.preventDefault(); setAddErr(null);
        if (!newName.trim() || newQty < 1) { setAddErr('Product ka naam aur sahi quantity likhein.'); return; }
        onAddProduct(newName.trim(), newQty, newCost === '' ? null : Number(newCost));
        setNewName(''); setNewQty(1); setNewCost('');
      }}>
        <h2 className="font-bold border-l-4 border-orange-500 pl-2">Naya product add karein (inventory khud add karein)</h2>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Product ka naam" className="w-full border rounded-lg px-3 py-2" />
        <input type="number" min={1} value={newQty} onChange={e => setNewQty(Number(e.target.value))} placeholder="Quantity (kitni inventory hai)" className="w-full border rounded-lg px-3 py-2" />
        <input type="number" min={0} value={newCost} onChange={e => setNewCost(e.target.value)} placeholder="Khareed price / cost (1 piece, optional)" className="w-full border rounded-lg px-3 py-2" />
        {addErr && <p className="text-sm text-red-600">{addErr}</p>}
        <button type="submit" className="w-full py-2.5 rounded-lg bg-orange-500 text-white font-bold">Inventory me add karein</button>
      </form>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {products.map(p => {
          const cost = costById[p.id];
          const isLow = p.stock <= low;
          if (editing?.id === p.id) {
            return (
              <div key={p.id} className="px-3 py-2.5 space-y-2">
                <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                <input type="number" min={0} value={editing.qty} onChange={e => setEditing({ ...editing, qty: Number(e.target.value) })} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                <input value={editing.cost} onChange={e => setEditing({ ...editing, cost: e.target.value })} placeholder="Cost (khali chhorein to purani cost rahe gi)" className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => { onEditProduct(p.id, editing.name.trim() || p.name, editing.qty, editing.cost === '' ? null : Number(editing.cost)); setEditing(null); }} className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold text-sm">Save</button>
                  <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg bg-gray-100 font-bold text-sm">Cancel</button>
                </div>
              </div>
            );
          }
          return (
            <div key={p.id} className="px-3 py-2.5 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold leading-5 min-w-0">
                {p.name}
                {isLow && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">LOW ALERT</span>}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-sm font-bold ${isLow ? 'text-red-700' : ''}`}>Stock: {p.stock}</span>
                <CostField key={`${p.id}-${cost ?? 'none'}`} initial={cost} onSave={v => onCost(p.id, v)} />
                {cost != null && <TwoTapDelete onDelete={() => onDeleteCost(p.id)} />}
                <button type="button" onClick={() => setEditing({ id: p.id, name: p.name, qty: p.stock, cost: cost == null ? '' : String(cost) })} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold">Edit</button>
                <TwoTapDelete onDelete={() => onDeleteProduct(p.id)} />
              </div>
            </div>
          );
        })}
        {products.length === 0 && <p className="px-3 py-3 text-sm text-gray-500">Koi product nahi hai.</p>}
      </div>
      <p className="text-xs text-gray-500">Cost badalne se purani sales ka profit nahi badle ga (snapshot mehfooz hai).</p>
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

function SalesTab({ products, manualSales, costById, onManualSale, onReturn, onEditManual, onDeleteManual }: {
  products: StockProduct[];
  manualSales: ManualSale[]; costById: Record<string, number>;
  onManualSale: (sale: ManualSale) => Promise<string | null>;
  onReturn: (orderId: string, item: ManualItem, q: number) => void;
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
        <input type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} placeholder="Asli sale price (1 piece) — jis par becha, discount ke baad wali" className="w-full border rounded-lg px-3 py-2" />
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

      <h2 className="font-bold border-l-4 border-orange-500 pl-2">Sales history (sirf wo sales jo tum ne khud add ki hain)</h2>
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
function ReturnsTab({ manualSales, onReturn }: {
  manualSales: ManualSale[];
  onReturn: (orderId: string, item: ManualItem, q: number) => void;
}) {
  type Option = { orderId: string; item: ManualItem; name: string; price: number; cost: number | null; remaining: number; date: string };
  const options: Option[] = [];
  for (const s of manualSales) for (const it of s.items) {
    const rem = it.qty - it.ret;
    if (rem > 0) options.push({ orderId: s.id, item: it, name: it.name, price: it.price, cost: it.cost, remaining: rem, date: s.date });
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
            <p className="text-sm text-gray-600">Sale minus {rs(q * opt.price)} | Profit minus {opt.cost == null ? 'cost nahi hai (0)' : rs(q * (opt.price - opt.cost))} | Stock mein wapis {opt.cost == null ? 'qty' : rs(q * opt.cost)}</p>
            <button type="button" onClick={() => onReturn(opt.orderId, opt.item, q)} className="w-full py-2.5 rounded-lg bg-orange-500 text-white font-bold">Return karein</button>
          </>
        ) : <p className="text-sm text-gray-500">Koi wapis karne wali sale nahi hai.</p>}
      </div>
      <h2 className="font-bold border-l-4 border-orange-500 pl-2">Return history</h2>
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
