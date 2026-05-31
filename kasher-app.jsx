import { useState, useEffect } from "react";

const SB = "https://bznsriknwdutcjulsdkg.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bnNyaWtud2R1dGNqdWxzZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDcyOTgsImV4cCI6MjA5NTQ4MzI5OH0.DJ-NfC4wlwMcqUIumpnsUWd9pFEljifm4W8ckxU-KUk";
const H = { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` };

const db = {
  get: async (t, q = "") => { try { const r = await fetch(`${SB}/rest/v1/${t}?${q}`, { headers: H }); return await r.json(); } catch { return []; } },
  post: async (t, d) => { try { const r = await fetch(`${SB}/rest/v1/${t}`, { method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(d) }); return await r.json(); } catch { return null; } },
  patch: async (t, id, d) => { try { await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify(d) }); } catch {} },
  patchQ: async (t, q, d) => { try { await fetch(`${SB}/rest/v1/${t}?${q}`, { method: "PATCH", headers: H, body: JSON.stringify(d) }); } catch {} },
  del: async (t, id) => { try { await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`, { method: "DELETE", headers: H }); } catch {} },
};

const fmt = (n) => Number(n || 0).toFixed(2);
const ts = () => new Date().toLocaleString("ar", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", calendar: "gregory" });
const today = () => new Date().toDateString();

// ── PIN LOCK ──────────────────────────────────────────────────
function PinLock({ pin, onUnlock }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);

  const press = (k) => {
    if (val.length >= 4) return;
    const nv = val + k;
    setVal(nv);
    if (nv.length === 4) {
      setTimeout(() => {
        if (nv === pin) { onUnlock(); }
        else { setErr(true); setTimeout(() => { setErr(false); setVal(""); }, 700); }
      }, 150);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Cairo, sans-serif", padding: 20 }}>
      <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,#1a7a4a,#0d5c38)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 8px 24px rgba(26,122,74,0.3)" }}>
        <span style={{ fontSize: 42 }}>🚬</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e", marginBottom: 4 }}>3lewa Smoke</div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 32 }}>أدخل كلمة المرور للدخول</div>

      <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < val.length ? "#1a7a4a" : "#ddd", transition: "all .15s", transform: i < val.length ? "scale(1.2)" : "scale(1)" }}/>
        ))}
      </div>
      {err && <div style={{ color: "#e53935", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>كلمة المرور خاطئة ❌</div>}
      <div style={{ marginBottom: 32, height: 20 }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,80px)", gap: 10 }}>
        {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
          <button key={i} onClick={() => k === "⌫" ? setVal(v => v.slice(0,-1)) : k ? press(k) : null}
            style={{ height: 70, borderRadius: 16, border: "none", background: k ? (k === "⌫" ? "#fee2e2" : "#fff") : "transparent", color: k === "⌫" ? "#e53935" : "#1a1a2e", fontSize: k === "⌫" ? 20 : 26, fontWeight: 700, cursor: k ? "pointer" : "default", boxShadow: k ? "0 2px 8px rgba(0,0,0,0.08)" : "none", fontFamily: "Cairo, sans-serif" }}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [locked, setLocked] = useState(true);
  const [page, setPage] = useState("home");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [debts, setDebts] = useState([]);
  const [capital, setCapital] = useState({ amount: 0, profit: 0 });
  const [settings, setSettings] = useState({ store_name: "3lewa Smoke", pin: "2323", credit_limit: 500 });
  const [loaded, setLoaded] = useState(false);
  const [notifs, setNotifs] = useState([]);

  async function load() {
    const [p, c, s, d, cap, set] = await Promise.all([
      db.get("products", "order=name"),
      db.get("customers", "order=name"),
      db.get("sales", "order=raw_date.desc&limit=300"),
      db.get("debts", "order=raw_date.desc"),
      db.get("capital", "id=eq.1"),
      db.get("app_settings", "id=eq.1"),
    ]);
    setProducts(Array.isArray(p) ? p : []);
    setCustomers(Array.isArray(c) ? c : []);
    setSales(Array.isArray(s) ? s : []);
    setDebts(Array.isArray(d) ? d : []);
    setCapital(Array.isArray(cap) && cap[0] ? cap[0] : { amount: 0, profit: 0 });
    if (Array.isArray(set) && set[0]) setSettings(set[0]);

    // Check notifications
    const allCustomers = Array.isArray(c) ? c : [];
    const allDebts = Array.isArray(d) ? d : [];
    const nList = [];
    allCustomers.forEach(cu => {
      const bal = allDebts.filter(x => (x.customer_id === cu.id || x.customer_name === cu.name) && !x.paid).reduce((a, x) => a + Number(x.amount), 0);
      const lim = Number(cu.credit_limit || 500);
      if (bal > lim) nList.push({ type: "limit", name: cu.name, bal, lim });
    });
    setNotifs(nList);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Cairo" }}>
      <div style={{ fontSize: 48 }}>🚬</div>
      <div style={{ fontSize: 16, color: "#666", marginTop: 12 }}>جاري التحميل...</div>
    </div>
  );

  if (locked) return <PinLock pin={settings.pin || "2323"} onUnlock={() => setLocked(false)} />;

  const props = { products, customers, sales, debts, capital, settings, notifs, reload: load, db, fmt, ts, today };

  return (
    <div style={{ fontFamily: "Cairo, sans-serif", direction: "rtl", background: "#f5f7fa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f7fa; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        button, input, select, textarea { font-family: Cairo, sans-serif; }
        .page { padding: 16px; padding-bottom: 85px; }
        .card { background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .btn { border: none; border-radius: 12px; padding: 12px 18px; font-weight: 700; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; justify-content: center; transition: opacity .15s; }
        .btn:active { opacity: 0.8; }
        .btn-green { background: #1a7a4a; color: #fff; }
        .btn-red { background: #e53935; color: #fff; }
        .btn-blue { background: #1976d2; color: #fff; }
        .btn-orange { background: #f57c00; color: #fff; }
        .btn-gray { background: #f0f4f8; color: #555; }
        .btn-dark { background: #1a1a2e; color: #fff; }
        .input { background: #f8fafc; border: 1.5px solid #e5e9ef; border-radius: 12px; padding: 11px 14px; font-size: 14px; width: 100%; outline: none; color: #1a1a2e; direction: rtl; }
        .input:focus { border-color: #1a7a4a; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .badge-green { background: #e8f5e9; color: #1a7a4a; }
        .badge-red { background: #ffebee; color: #e53935; }
        .badge-orange { background: #fff3e0; color: #f57c00; }
        .badge-blue { background: #e3f2fd; color: #1976d2; }
        .divider { height: 1px; background: #f0f4f8; margin: 12px 0; }
        .row { display: flex; gap: 10px; align-items: center; }
        .col { display: flex; flex-direction: column; gap: 8px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .nav { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #f0f4f8; display: flex; z-index: 100; box-shadow: 0 -4px 16px rgba(0,0,0,0.06); padding-bottom: env(safe-area-inset-bottom); }
        .nav-btn { flex: 1; padding: 10px 0 8px; border: none; background: transparent; cursor: pointer; font-size: 10px; color: #aaa; display: flex; flex-direction: column; align-items: center; gap: 3px; border-top: 2px solid transparent; font-family: Cairo, sans-serif; font-weight: 600; }
        .nav-btn.active { color: #1a7a4a; border-top-color: #1a7a4a; }
        .nav-icon { font-size: 22px; }
        .header { background: #fff; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 99; border-bottom: 1px solid #f0f4f8; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .stat-card { background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .stat-label { font-size: 12px; color: #888; margin-bottom: 4px; }
        .stat-val { font-size: 22px; font-weight: 900; }
        .chip { padding: 8px 14px; border-radius: 20px; border: 1.5px solid #e5e9ef; background: #fff; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all .15s; font-family: Cairo, sans-serif; }
        .chip.active { background: #1a7a4a; color: #fff; border-color: #1a7a4a; }
        .product-btn { background: #fff; border-radius: 16px; border: 1.5px solid #e5e9ef; padding: 14px 10px; text-align: center; cursor: pointer; transition: all .15s; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .product-btn:active { transform: scale(0.96); border-color: #1a7a4a; }
        .customer-card { background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); cursor: pointer; transition: transform .15s; }
        .customer-card:active { transform: scale(0.98); }
        .tx-item { background: #fff; border-radius: 14px; padding: 14px 16px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border-right: 4px solid transparent; }
        .fab { position: fixed; bottom: 80px; left: 16px; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg,#1a7a4a,#0d5c38); color: #fff; font-size: 28px; border: none; box-shadow: 0 4px 16px rgba(26,122,74,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 98; }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: flex-end; }
        .modal { background: #fff; width: 100%; border-radius: 24px 24px 0 0; padding: 20px; max-height: 90vh; overflow-y: auto; }
        .modal-handle { width: 40px; height: 4px; background: #e5e9ef; border-radius: 2px; margin: 0 auto 16px; }
        .section-title { font-size: 16px; font-weight: 900; color: #1a1a2e; margin-bottom: 12px; }
      `}</style>

      {page === "home" && <HomePage {...props} onLock={() => setLocked(true)} setPage={setPage} />}
      {page === "pos" && <PosPage {...props} />}
      {page === "debts" && <DebtsPage {...props} />}
      {page === "inventory" && <InventoryPage {...props} />}
      {page === "reports" && <ReportsPage {...props} />}
      {page === "settings" && <SettingsPage {...props} setSettings={setSettings} />}

      <nav className="nav">
        {[
          { k: "home", icon: "🏠", label: "الرئيسية" },
          { k: "pos", icon: "🛒", label: "الكاشير" },
          { k: "debts", icon: "👥", label: "الديون" },
          { k: "inventory", icon: "📦", label: "المخزون" },
          { k: "reports", icon: "📊", label: "التقارير" },
        ].map(t => (
          <button key={t.k} className={`nav-btn ${page === t.k ? "active" : ""}`} onClick={() => setPage(t.k)}>
            <span className="nav-icon">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────
function HomePage({ sales, debts, customers, products, capital, settings, notifs, setPage, onLock }) {
  const [showNotifs, setShowNotifs] = useState(false);

  const todaySales = sales.filter(s => new Date(s.raw_date).toDateString() === new Date().toDateString());
  const todayRev = todaySales.reduce((a, s) => a + Number(s.total), 0);
  const todayProfit = todaySales.reduce((a, s) => a + Number(s.profit), 0);
  const totalDebt = debts.filter(d => !d.paid).reduce((a, d) => a + Number(d.amount), 0);
  const forMe = debts.filter(d => d.type === "for_me" && !d.paid).reduce((a, d) => a + Number(d.amount), 0);

  return (
    <>
      <div className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowNotifs(true)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: 22 }}>
            🔔
            {notifs.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#e53935", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{notifs.length}</span>}
          </button>
          <button onClick={() => setPage("settings")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22 }}>⚙️</button>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: "#1a1a2e" }}>{settings.store_name || "3lewa Smoke"}</div>
          <div style={{ fontSize: 11, color: "#888" }}>نظام إدارة الديون والمبيعات</div>
        </div>
        <button onClick={onLock} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22 }}>🔒</button>
      </div>

      <div className="page">
        {/* Stats */}
        <div className="card" style={{ marginBottom: 12, background: "linear-gradient(135deg,#1a7a4a,#0d5c38)", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, opacity: .8 }}>مبيعات اليوم</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>₪{fmt(todayRev)}</div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, opacity: .8 }}>ربح اليوم</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>₪{fmt(todayProfit)}</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: .8 }}>ديون الزباين</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#ffcc80" }}>₪{fmt(totalDebt)}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: .8 }}>عدد الزباين</div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{customers.length}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: .8 }}>تجاوز الحد</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#ff8a80" }}>{notifs.length}</div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid2" style={{ marginBottom: 12 }}>
          {[
            { icon: "➕", label: "دين جديد", color: "#ffebee", textColor: "#e53935", action: () => setPage("debts") },
            { icon: "👤", label: "زبون جديد", color: "#e3f2fd", textColor: "#1976d2", action: () => setPage("debts") },
            { icon: "📊", label: "التقارير", color: "#fff3e0", textColor: "#f57c00", action: () => setPage("reports") },
            { icon: "💰", label: "دفعة", color: "#e8f5e9", textColor: "#1a7a4a", action: () => setPage("debts") },
          ].map((a, i) => (
            <button key={i} onClick={a.action} style={{ background: a.color, border: "none", borderRadius: 16, padding: "18px 0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 28 }}>{a.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: a.textColor, fontFamily: "Cairo" }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Products quick */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>⚡ الأصناف السريعة</div>
          </div>
          <div className="grid2">
            {products.slice(0, 6).map(p => (
              <div key={p.id} className="product-btn" onClick={() => setPage("pos")}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                <div style={{ color: "#1a7a4a", fontWeight: 900, fontSize: 15 }}>₪{p.sell_price}</div>
                <div style={{ fontSize: 11, color: p.stock < 10 ? "#e53935" : "#888", marginTop: 3 }}>مخزون: {p.stock} {p.unit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Last transactions */}
        <div className="section-title">آخر الحركات</div>
        {sales.slice(0, 6).map((s, i) => (
          <div key={i} className="tx-item" style={{ borderRightColor: s.is_paid ? "#1a7a4a" : "#e53935" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.product_name}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{s.date}{!s.is_paid && <span style={{ color: "#e53935" }}> · {s.customer_name}</span>}</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 900, color: "#1a7a4a" }}>₪{fmt(s.total)}</div>
                <span className={`badge ${s.is_paid ? "badge-green" : "badge-red"}`}>{s.is_paid ? "نقد" : "دين"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications modal */}
      {showNotifs && (
        <div className="modal-bg" onClick={() => setShowNotifs(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div className="section-title" style={{ margin: 0 }}>التنبيهات</div>
              <button onClick={() => setShowNotifs(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {notifs.length === 0 ? <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}>لا توجد تنبيهات</div> :
              notifs.map((n, i) => (
                <div key={i} style={{ background: "#fff8e1", borderRadius: 14, padding: 14, marginBottom: 8, borderRight: "4px solid #f57c00" }}>
                  <div style={{ fontWeight: 700, color: "#f57c00", marginBottom: 4 }}>⚠️ تجاوز الحد الائتماني</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{n.name} تجاوز الحد. الرصيد ₪{fmt(n.bal)} والحد ₪{fmt(n.lim)}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </>
  );
}

// ── POS PAGE ──────────────────────────────────────────────────
function PosPage({ products, customers, reload, db, fmt, ts, capital }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("الكل");
  const [showCheckout, setShowCheckout] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saleTypeModal, setSaleTypeModal] = useState(null); // product for wafa modal

  const cats = ["الكل", ...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = products.filter(p => {
    const matchCat = catFilter === "الكل" || p.category === catFilter;
    const matchSearch = !search || p.name.includes(search);
    return matchCat && matchSearch;
  });

  const total = cart.reduce((a, i) => a + i.lineTotal, 0);
  const totalProfit = cart.reduce((a, i) => a + i.lineProfit, 0);

  function addToCart(product, qty = 1, saleType = "unit") {
    const gramsUsed = saleType === "cigarette" ? qty / 3 : qty;
    const unitPrice = saleType === "cigarette" ? product.sell_price / 3 : product.sell_price;
    const unitCost = saleType === "cigarette" ? product.buy_price / 3 : product.buy_price;
    const lineTotal = unitPrice * qty;
    const lineProfit = (unitPrice - unitCost) * qty;

    setCart(c => {
      const idx = c.findIndex(x => x.id === product.id && x.saleType === saleType);
      if (idx >= 0) {
        const updated = [...c];
        updated[idx] = {
          ...updated[idx],
          qty: updated[idx].qty + qty,
          gramsUsed: updated[idx].gramsUsed + gramsUsed,
          lineTotal: updated[idx].lineTotal + lineTotal,
          lineProfit: updated[idx].lineProfit + lineProfit,
        };
        return updated;
      }
      return [...c, { ...product, qty, saleType, gramsUsed, lineTotal, lineProfit, unitPrice }];
    });
    setSaleTypeModal(null);
  }

  function removeFromCart(idx) { setCart(c => c.filter((_, i) => i !== idx)); }

  async function checkout() {
    if (!isPaid && !customerId) { alert("اختر الزبون"); return; }
    setLoading(true);
    const customer = customers.find(c => c.id === +customerId);

    for (const item of cart) {
      if (item.stock < item.gramsUsed) { alert(`مخزون ${item.name} غير كافٍ`); setLoading(false); return; }
    }

    for (const item of cart) {
      await db.post("sales", {
        product_id: item.id, product_name: item.name, qty: item.qty,
        sale_type: item.saleType, sell_price: item.sell_price,
        buy_price: item.buy_price, total: item.lineTotal,
        profit: item.lineProfit, is_paid: isPaid,
        customer_name: customer?.name || "",
        customer_id: customer?.id || null,
        date: ts(), raw_date: new Date().toISOString(),
      });
      await db.patch("products", item.id, { stock: item.stock - item.gramsUsed });

      if (!isPaid && customer) {
        await db.post("debts", {
          customer_id: customer.id, customer_name: customer.name,
          product_name: item.name, qty: item.qty,
          amount: item.lineTotal, date: ts(),
          raw_date: new Date().toISOString(), paid: false,
        });
        await db.patch("customers", customer.id, { balance: (Number(customer.balance) || 0) + item.lineTotal });
      } else if (isPaid) {
        await db.patch("capital", 1, {
          amount: Number(capital.amount) + item.buy_price * item.gramsUsed,
          profit: Number(capital.profit) + item.lineProfit,
        });
      }
    }

    await reload();
    setCart([]);
    setShowCheckout(false);
    setIsPaid(true);
    setCustomerId("");
    setLoading(false);
    alert("✅ تم تسجيل البيعة!");
  }

  return (
    <>
      <div className="header">
        <div style={{ fontWeight: 900, fontSize: 18 }}>🛒 الكاشير</div>
        {cart.length > 0 && (
          <button className="btn btn-green" style={{ padding: "8px 16px" }} onClick={() => setShowCheckout(true)}>
            إتمام البيع ({cart.length})
          </button>
        )}
      </div>

      <div className="page">
        <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث عن صنف..." style={{ marginBottom: 12 }} />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
          {cats.map(c => <button key={c} className={`chip ${catFilter === c ? "active" : ""}`} onClick={() => setCatFilter(c)}>{c}</button>)}
        </div>

        {cart.length > 0 && (
          <div className="card" style={{ marginBottom: 14, borderRight: "4px solid #1a7a4a" }}>
            <div style={{ fontWeight: 700, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
              <span>🛒 السلة</span>
              <span style={{ color: "#1a7a4a", fontWeight: 900 }}>₪{fmt(total)}</span>
            </div>
            {cart.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < cart.length-1 ? "1px solid #f5f7fa" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{item.qty} × ₪{fmt(item.unitPrice)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, color: "#1a7a4a" }}>₪{fmt(item.lineTotal)}</span>
                  <button onClick={() => removeFromCart(i)} style={{ background: "#ffebee", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid2">
          {filtered.map(p => (
            <div key={p.id} className="product-btn" onClick={() => p.is_wafa ? setSaleTypeModal(p) : addToCart(p)}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
              {p.is_wafa && <span className="badge badge-orange" style={{ marginBottom: 4, fontSize: 10 }}>ضفة</span>}
              <div style={{ color: "#1a7a4a", fontWeight: 900, fontSize: 16 }}>₪{p.sell_price}</div>
              <div style={{ fontSize: 11, color: p.stock < 10 ? "#e53935" : "#888", marginTop: 3 }}>{p.stock} {p.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wafa sale type modal */}
      {saleTypeModal && (
        <div className="modal-bg" onClick={() => setSaleTypeModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="section-title">طريقة بيع {saleTypeModal.name}</div>
            <div className="grid2" style={{ marginBottom: 16 }}>
              <button className="btn btn-green" style={{ padding: 20, flexDirection: "column", gap: 8, height: "auto" }} onClick={() => addToCart(saleTypeModal, 1, "gram")}>
                <span style={{ fontSize: 30 }}>⚖️</span>
                <span>بالجرام</span>
                <span style={{ fontSize: 12, opacity: .8 }}>₪{saleTypeModal.sell_price} / جرام</span>
              </button>
              <button className="btn btn-orange" style={{ padding: 20, flexDirection: "column", gap: 8, height: "auto" }} onClick={() => addToCart(saleTypeModal, 1, "cigarette")}>
                <span style={{ fontSize: 30 }}>🚬</span>
                <span>بالسيجارة</span>
                <span style={{ fontSize: 12, opacity: .8 }}>كل 3 = جرام</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {showCheckout && (
        <div className="modal-bg">
          <div className="modal">
            <div className="modal-handle" />
            <div className="section-title">إتمام البيع</div>

            <div className="card" style={{ marginBottom: 14, background: "#f8fafc" }}>
              {cart.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < cart.length-1 ? "1px solid #eee" : "none", fontSize: 14 }}>
                  <span>{item.name} × {item.qty}</span>
                  <span style={{ fontWeight: 700 }}>₪{fmt(item.lineTotal)}</span>
                </div>
              ))}
              <div className="divider" />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 18 }}>
                <span>الإجمالي</span>
                <span style={{ color: "#1a7a4a" }}>₪{fmt(total)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <button onClick={() => setIsPaid(true)} style={{ flex: 1, padding: 16, borderRadius: 14, border: `2px solid ${isPaid ? "#1a7a4a" : "#eee"}`, background: isPaid ? "#e8f5e9" : "#fff", color: isPaid ? "#1a7a4a" : "#555", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo" }}>
                💵 نقداً
              </button>
              <button onClick={() => setIsPaid(false)} style={{ flex: 1, padding: 16, borderRadius: 14, border: `2px solid ${!isPaid ? "#e53935" : "#eee"}`, background: !isPaid ? "#ffebee" : "#fff", color: !isPaid ? "#e53935" : "#555", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo" }}>
                📋 دين
              </button>
            </div>

            {!isPaid && (
              <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)} style={{ marginBottom: 14 }}>
                <option value="">— اختر الزبون —</option>
                {[...customers].sort((a, b) => a.name.localeCompare(b.name, "ar")).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-gray" style={{ flex: 1 }} onClick={() => setShowCheckout(false)}>إلغاء</button>
              <button className="btn btn-green" style={{ flex: 2 }} onClick={checkout} disabled={loading}>
                {loading ? "⏳..." : "✅ تأكيد البيع"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── DEBTS PAGE ────────────────────────────────────────────────
function DebtsPage({ customers, debts, capital, reload, db, fmt, ts }) {
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", credit_limit: "500" });
  const [debtForm, setDebtForm] = useState({ customer_id: "", amount: "", note: "" });
  const [payAmount, setPayAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const totalDebt = debts.filter(d => !d.paid && d.type !== "for_me").reduce((a, d) => a + Number(d.amount), 0);
  const forMe = debts.filter(d => d.type === "for_me" && !d.paid).reduce((a, d) => a + Number(d.amount), 0);
  const overLimit = customers.filter(c => {
    const bal = debts.filter(d => (d.customer_id === c.id || d.customer_name === c.name) && !d.paid).reduce((a, d) => a + Number(d.amount), 0);
    return bal > Number(c.credit_limit || 500);
  }).length;

  const customer = customers.find(c => c.id === selectedId);
  const cDebts = debts.filter(d => d.customer_id === selectedId || d.customer_name === customer?.name);
  const pending = cDebts.filter(d => !d.paid).reduce((a, d) => a + Number(d.amount), 0);
  const paid = cDebts.filter(d => d.paid).reduce((a, d) => a + Number(d.amount), 0);
  const lastPay = cDebts.filter(d => d.paid).sort((a, b) => new Date(b.raw_date) - new Date(a.raw_date))[0];

  const sortedCustomers = [...customers]
    .sort((a, b) => a.name.localeCompare(b.name, "ar"))
    .filter(c => c.name.includes(search) || (c.phone || "").includes(search));

  async function addCustomer() {
    if (!form.name.trim()) return;
    await db.post("customers", { name: form.name.trim(), phone: form.phone, credit_limit: +form.credit_limit || 500, balance: 0 });
    await reload();
    setForm({ name: "", phone: "", credit_limit: "500" });
    setShowAddCustomer(false);
  }

  async function addDebt() {
    if (!debtForm.customer_id || !debtForm.amount) return;
    const c = customers.find(x => x.id === +debtForm.customer_id);
    if (!c) return;
    setLoading(true);
    await db.post("debts", { customer_id: c.id, customer_name: c.name, product_name: debtForm.note || "دين مباشر", qty: 1, amount: +debtForm.amount, date: ts(), raw_date: new Date().toISOString(), paid: false });
    await db.patch("customers", c.id, { balance: (Number(c.balance) || 0) + +debtForm.amount });
    await reload();
    setDebtForm({ customer_id: "", amount: "", note: "" });
    setShowAddDebt(false);
    setLoading(false);
  }

  async function payAll() {
    if (!confirm(`سداد كامل من ${customer?.name}؟`)) return;
    setLoading(true);
    await db.patchQ("debts", `customer_id=eq.${selectedId}&paid=eq.false`, { paid: true });
    await db.patch("customers", selectedId, { balance: 0 });
    await reload();
    setLoading(false);
  }

  async function payPart() {
    const amt = +payAmount;
    if (!amt || amt <= 0) return;
    setLoading(true);
    let rem = amt;
    const unpaid = cDebts.filter(d => !d.paid).sort((a, b) => a.id - b.id);
    for (const d of unpaid) {
      if (rem <= 0) break;
      if (rem >= Number(d.amount)) { await db.patch("debts", d.id, { paid: true }); rem -= Number(d.amount); }
      else { await db.patch("debts", d.id, { amount: Number(d.amount) - rem }); rem = 0; }
    }
    await db.patch("customers", selectedId, { balance: Math.max(0, Number(customer.balance) - amt) });
    await reload();
    setPayAmount("");
    setLoading(false);
  }

  async function deleteCustomer(id) {
    if (!confirm("حذف هذا الزبون؟")) return;
    await db.del("customers", id);
    await reload();
    setView("list");
  }

  if (view === "detail" && customer) return (
    <>
      <div className="header">
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#555" }}>← رجوع</button>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{customer.name}</div>
        <button onClick={() => deleteCustomer(customer.id)} style={{ background: "#ffebee", border: "none", borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 13, color: "#e53935" }}>حذف</button>
      </div>
      <div className="page">
        {/* Customer info */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#1a7a4a" }}>
              {customer.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{customer.name}</div>
              {customer.phone && <div style={{ fontSize: 13, color: "#888" }}>📞 {customer.phone}</div>}
              <span className="badge badge-blue">الحد: ₪{fmt(customer.credit_limit || 500)}</span>
            </div>
          </div>
          <div className="grid2">
            <div style={{ background: "#ffebee", borderRadius: 12, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888" }}>الرصيد الحالي</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#e53935" }}>₪{fmt(pending)}</div>
            </div>
            <div style={{ background: "#e8f5e9", borderRadius: 12, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888" }}>إجمالي السداد</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#1a7a4a" }}>₪{fmt(paid)}</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888" }}>إجمالي الديون</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#1976d2" }}>₪{fmt(pending + paid)}</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888" }}>آخر دفعة</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>{lastPay ? lastPay.date : "—"}</div>
            </div>
          </div>
        </div>

        {pending > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: "#1a7a4a", marginBottom: 10 }}>💰 تسجيل دفعة</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input className="input" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="المبلغ ₪" style={{ flex: 1 }} />
              <button className="btn btn-green" onClick={payPart} disabled={loading} style={{ padding: "11px 16px" }}>دفع</button>
            </div>
            <button className="btn btn-green" style={{ width: "100%" }} onClick={payAll} disabled={loading}>
              {loading ? "⏳..." : `✅ سداد كامل (₪${fmt(pending)})`}
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <button className="btn btn-red" onClick={() => { setDebtForm({ customer_id: customer.id, amount: "", note: "" }); setShowAddDebt(true); }}>➕ تسجيل دين</button>
          <button className="btn btn-dark" onClick={() => {
            const text = `كشف حساب - ${customer.name}\nالرصيد المتبقي: ₪${fmt(pending)}\nإجمالي الديون: ₪${fmt(pending + paid)}\nإجمالي السداد: ₪${fmt(paid)}`;
            if (navigator.share) navigator.share({ title: "كشف حساب", text });
            else alert(text);
          }}>📤 تصدير</button>
        </div>

        <div className="section-title">سجل الحركات</div>
        {[...cDebts].reverse().map((d, i) => (
          <div key={i} className="tx-item" style={{ borderRightColor: d.paid ? "#1a7a4a" : "#e53935" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{d.product_name}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{d.date}</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 900, color: d.paid ? "#1a7a4a" : "#e53935" }}>₪{fmt(d.amount)}</div>
                <span className={`badge ${d.paid ? "badge-green" : "badge-red"}`}>{d.paid ? "مسدد" : "دين"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddDebt && (
        <div className="modal-bg" onClick={() => setShowAddDebt(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="section-title">تسجيل دين جديد</div>
            <div className="col">
              <input className="input" type="number" value={debtForm.amount} onChange={e => setDebtForm(f => ({ ...f, amount: e.target.value }))} placeholder="المبلغ ₪" />
              <input className="input" value={debtForm.note} onChange={e => setDebtForm(f => ({ ...f, note: e.target.value }))} placeholder="ملاحظة (اختياري)" />
              <button className="btn btn-red" onClick={addDebt} disabled={loading}>{loading ? "⏳..." : "✅ تسجيل الدين"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="header">
        <div style={{ fontWeight: 900, fontSize: 18 }}>👥 حسابات الديون</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e53935" }}>₪{fmt(totalDebt)}</div>
      </div>
      <div className="page">
        <div className="card" style={{ marginBottom: 12, background: "linear-gradient(135deg,#1976d2,#1565c0)", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: .8 }}>مجموع عليه</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#ff8a80" }}>₪{fmt(totalDebt)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: .8 }}>عدد الحسابات</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{customers.length}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: .8 }}>تجاوز الحد</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#ffcc80" }}>{overLimit}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث باسم أو هاتف..." style={{ flex: 1 }} />
          <button className="btn btn-green" style={{ padding: "10px 14px" }} onClick={() => setShowAddCustomer(true)}>+ إضافة</button>
        </div>

        <div className="col">
          {sortedCustomers.map(c => {
            const bal = debts.filter(d => (d.customer_id === c.id || d.customer_name === c.name) && !d.paid).reduce((a, d) => a + Number(d.amount), 0);
            const isOver = bal > Number(c.credit_limit || 500);
            return (
              <div key={c.id} className="customer-card" onClick={() => { setSelectedId(c.id); setView("detail"); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#1a7a4a" }}>{c.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                      {c.phone && <div style={{ fontSize: 12, color: "#888" }}>{c.phone}</div>}
                      <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                        <span className="badge badge-blue" style={{ fontSize: 10 }}>الحد: ₪{fmt(c.credit_limit || 500)}</span>
                        {isOver && <span className="badge badge-orange" style={{ fontSize: 10 }}>⚠️ تجاوز الحد</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: bal > 0 ? "#e53935" : "#1a7a4a" }}>
                      {bal > 0 ? `₪${fmt(bal)}` : "✅ مسدد"}
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>رصيد الزبون</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="fab" onClick={() => setShowAddDebt(true)}>+</button>

      {showAddCustomer && (
        <div className="modal-bg" onClick={() => setShowAddCustomer(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="section-title">إضافة زبون جديد</div>
            <div className="col">
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="اسم الزبون *" />
              <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="رقم الهاتف" type="tel" />
              <input className="input" type="number" value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))} placeholder="الحد الائتماني ₪" />
              <button className="btn btn-green" onClick={addCustomer}>✅ إضافة</button>
            </div>
          </div>
        </div>
      )}

      {showAddDebt && (
        <div className="modal-bg" onClick={() => setShowAddDebt(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="section-title">تسجيل دين جديد</div>
            <div className="col">
              <select className="input" value={debtForm.customer_id} onChange={e => setDebtForm(f => ({ ...f, customer_id: e.target.value }))}>
                <option value="">— اختر الزبون —</option>
                {[...customers].sort((a, b) => a.name.localeCompare(b.name, "ar")).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="input" type="number" value={debtForm.amount} onChange={e => setDebtForm(f => ({ ...f, amount: e.target.value }))} placeholder="المبلغ ₪" />
              <input className="input" value={debtForm.note} onChange={e => setDebtForm(f => ({ ...f, note: e.target.value }))} placeholder="ملاحظة (اختياري)" />
              <button className="btn btn-red" onClick={addDebt} disabled={loading}>{loading ? "⏳..." : "✅ تسجيل الدين"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── INVENTORY PAGE ────────────────────────────────────────────
function InventoryPage({ products, reload, db, fmt }) {
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [catFilter, setCatFilter] = useState("الكل");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", category: "سجائر", unit: "علبة", buy_price: "", sell_price: "", stock: "", is_wafa: false });
  const [loading, setLoading] = useState(false);

  const cats = ["الكل", ...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = products.filter(p => {
    const matchCat = catFilter === "الكل" || p.category === catFilter;
    const matchSearch = !search || p.name.includes(search);
    return matchCat && matchSearch;
  });

  const totalBuy = products.reduce((a, p) => a + Number(p.buy_price) * p.stock, 0);
  const totalSell = products.reduce((a, p) => a + Number(p.sell_price) * p.stock, 0);
  const expectedProfit = totalSell - totalBuy;

  async function save() {
    if (!form.name || !form.sell_price) { alert("أكمل الحقول المطلوبة"); return; }
    setLoading(true);
    const data = { name: form.name, category: form.category, unit: form.unit, buy_price: +form.buy_price, sell_price: +form.sell_price, stock: +form.stock, is_wafa: form.is_wafa };
    if (editId) await db.patch("products", editId, data);
    else await db.post("products", data);
    await reload();
    setLoading(false);
    setView("list");
    setEditId(null);
  }

  async function addStock(p) {
    const amt = prompt(`إضافة مخزون لـ ${p.name} (حالي: ${p.stock})`);
    if (!amt || isNaN(+amt)) return;
    await db.patch("products", p.id, { stock: p.stock + +amt });
    await reload();
  }

  if (view !== "list") return (
    <>
      <div className="header">
        <button onClick={() => { setView("list"); setEditId(null); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#555" }}>← رجوع</button>
        <div style={{ fontWeight: 900 }}>{editId ? "تعديل صنف" : "صنف جديد"}</div>
        <div style={{ width: 40 }} />
      </div>
      <div className="page">
        <div className="card col">
          <div className="col"><label style={{ fontSize: 12, color: "#666" }}>الاسم *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="اسم الصنف" /></div>
          <div className="col"><label style={{ fontSize: 12, color: "#666" }}>التصنيف</label>
            <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {["سجائر", "ضفة", "معسل", "ورق", "إكسسوار", "أخرى"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col"><label style={{ fontSize: 12, color: "#666" }}>الوحدة</label>
            <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {["علبة", "جرام", "قطعة", "دفتر", "كرتون", "زجاجة"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="grid2">
            <div className="col"><label style={{ fontSize: 12, color: "#666" }}>سعر الشراء ₪</label><input className="input" type="number" value={form.buy_price} onChange={e => setForm(f => ({ ...f, buy_price: e.target.value }))} /></div>
            <div className="col"><label style={{ fontSize: 12, color: "#666" }}>سعر البيع ₪ *</label><input className="input" type="number" value={form.sell_price} onChange={e => setForm(f => ({ ...f, sell_price: e.target.value }))} /></div>
          </div>
          <div className="col"><label style={{ fontSize: 12, color: "#666" }}>الكمية</label><input className="input" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
          <label style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0" }}>
            <input type="checkbox" checked={form.is_wafa} onChange={e => setForm(f => ({ ...f, is_wafa: e.target.checked }))} style={{ width: 18, height: 18 }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>دخان ضفة (يُباع بالجرام/سيجارة)</span>
          </label>
          <button className="btn btn-green" onClick={save} disabled={loading}>{loading ? "⏳..." : "💾 حفظ"}</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="header">
        <div style={{ fontWeight: 900, fontSize: 18 }}>📦 المخزون</div>
        <button className="btn btn-green" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => { setForm({ name: "", category: "سجائر", unit: "علبة", buy_price: "", sell_price: "", stock: "", is_wafa: false }); setView("add"); }}>+ إضافة</button>
      </div>
      <div className="page">
        <div className="grid2" style={{ marginBottom: 12 }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888" }}>رصيد بسعر الجملة</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1976d2" }}>₪{fmt(totalBuy)}</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888" }}>الأرباح المتوقعة</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1a7a4a" }}>₪{fmt(expectedProfit)}</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888" }}>رصيد بسعر البيع</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#f57c00" }}>₪{fmt(totalSell)}</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888" }}>عدد الأصناف</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#555" }}>{products.length}</div>
          </div>
        </div>

        <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث..." style={{ marginBottom: 12 }} />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
          {cats.map(c => <button key={c} className={`chip ${catFilter === c ? "active" : ""}`} onClick={() => setCatFilter(c)}>{c}</button>)}
        </div>

        <div className="col">
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ borderRight: `4px solid ${p.stock < 10 ? "#e53935" : "#e5e9ef"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                    {p.is_wafa && <span className="badge badge-orange">ضفة</span>}
                    {p.category && <span className="badge badge-blue">{p.category}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#666", display: "flex", gap: 14 }}>
                    <span>شراء: <b style={{ color: "#1976d2" }}>₪{p.buy_price}</b></span>
                    <span>بيع: <b style={{ color: "#1a7a4a" }}>₪{p.sell_price}</b></span>
                    <span>ربح: <b style={{ color: "#f57c00" }}>₪{(p.sell_price - p.buy_price).toFixed(2)}</b></span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge ${p.stock < 10 ? "badge-red" : "badge-green"}`}>{p.stock} {p.unit}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button className="btn btn-green" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => addStock(p)}>+مخزون</button>
                  <button className="btn btn-gray" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => { setForm({ name: p.name, category: p.category || "سجائر", unit: p.unit, buy_price: p.buy_price, sell_price: p.sell_price, stock: p.stock, is_wafa: p.is_wafa || false }); setEditId(p.id); setView("edit"); }}>تعديل</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── REPORTS PAGE ──────────────────────────────────────────────
function ReportsPage({ sales, debts, customers, capital, fmt }) {
  const [filter, setFilter] = useState("today");
  const [opFilter, setOpFilter] = useState("all");
  const now = new Date();

  const filtered = sales.filter(s => {
    const d = new Date(s.raw_date);
    if (filter === "today") return d.toDateString() === now.toDateString();
    if (filter === "week") return (now - d) < 7 * 86400000;
    if (filter === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  }).filter(s => opFilter === "all" || (opFilter === "cash" ? s.is_paid : !s.is_paid));

  const totalRev = filtered.reduce((a, s) => a + Number(s.total), 0);
  const totalProfit = filtered.reduce((a, s) => a + Number(s.profit), 0);
  const cashSales = filtered.filter(s => s.is_paid).reduce((a, s) => a + Number(s.total), 0);
  const debtSales = filtered.filter(s => !s.is_paid).reduce((a, s) => a + Number(s.total), 0);
  const totalDebt = debts.filter(d => !d.paid).reduce((a, d) => a + Number(d.amount), 0);

  const productMap = {};
  filtered.forEach(s => {
    if (!productMap[s.product_name]) productMap[s.product_name] = 0;
    productMap[s.product_name] += Number(s.total);
  });
  const topProducts = Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <div className="header">
        <div style={{ fontWeight: 900, fontSize: 18 }}>📊 التقارير</div>
      </div>
      <div className="page">
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
          {[["today","اليوم"],["week","الأسبوع"],["month","الشهر"],["all","الكل"]].map(([k,l]) => (
            <button key={k} className={`chip ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[["all","كل العمليات"],["cash","نقدي"],["debt","دين"]].map(([k,l]) => (
            <button key={k} className={`chip ${opFilter === k ? "active" : ""}`} onClick={() => setOpFilter(k)} style={{ fontSize: 12 }}>{l}</button>
          ))}
        </div>

        <div className="grid2" style={{ marginBottom: 12 }}>
          {[
            { label: "إجمالي المبيعات", val: `₪${fmt(totalRev)}`, color: "#1976d2" },
            { label: "الربح الصافي", val: `₪${fmt(totalProfit)}`, color: "#1a7a4a" },
            { label: "نقد مقبوض", val: `₪${fmt(cashSales)}`, color: "#1a7a4a" },
            { label: "دين مؤجل", val: `₪${fmt(debtSales)}`, color: "#e53935" },
            { label: "إجمالي الديون", val: `₪${fmt(totalDebt)}`, color: "#e53935" },
            { label: "رأس المال", val: `₪${fmt(capital.amount)}`, color: "#f57c00" },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {topProducts.length > 0 && (
          <>
            <div className="section-title">🏆 أكثر الأصناف مبيعاً</div>
            <div className="card" style={{ marginBottom: 14 }}>
              {topProducts.map(([name, total], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < topProducts.length-1 ? "1px solid #f5f7fa" : "none" }}>
                  <span style={{ fontWeight: 600 }}>{i+1}. {name}</span>
                  <span style={{ color: "#1a7a4a", fontWeight: 700 }}>₪{fmt(total)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="section-title" style={{ margin: 0 }}>سجل الحركات</div>
        </div>
        {filtered.slice(0, 50).map((s, i) => (
          <div key={i} className="tx-item" style={{ borderRightColor: s.is_paid ? "#1a7a4a" : "#e53935" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.product_name}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{s.date} · الكمية: {s.qty}</div>
                {!s.is_paid && <div style={{ fontSize: 11, color: "#e53935" }}>دين: {s.customer_name}</div>}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 900, color: "#1a7a4a" }}>₪{fmt(s.total)}</div>
                <div style={{ fontSize: 11, color: "#f57c00" }}>ربح: ₪{fmt(s.profit)}</div>
                <span className={`badge ${s.is_paid ? "badge-green" : "badge-red"}`}>{s.is_paid ? "نقدي" : "دين"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── SETTINGS PAGE ─────────────────────────────────────────────
function SettingsPage({ settings, reload, db, setSettings }) {
  const [form, setForm] = useState({ store_name: settings.store_name || "3lewa Smoke", pin: settings.pin || "2323", credit_limit: settings.credit_limit || 500 });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await db.patch("app_settings", 1, { store_name: form.store_name, pin: form.pin, credit_limit: +form.credit_limit });
    setSettings(s => ({ ...s, ...form }));
    await reload();
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <div className="header">
        <div style={{ fontWeight: 900, fontSize: 18 }}>⚙️ الإعدادات</div>
      </div>
      <div className="page">
        <div className="card col">
          <div className="section-title">إعدادات المتجر</div>
          <div className="col"><label style={{ fontSize: 12, color: "#666" }}>اسم المتجر</label><input className="input" value={form.store_name} onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))} /></div>
          <div className="col"><label style={{ fontSize: 12, color: "#666" }}>كلمة المرور (4 أرقام)</label><input className="input" type="password" maxLength={4} value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))} placeholder="****" /></div>
          <div className="col"><label style={{ fontSize: 12, color: "#666" }}>الحد الائتماني الافتراضي ₪</label><input className="input" type="number" value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))} /></div>
          <button className="btn btn-green" onClick={save} disabled={loading}>{loading ? "⏳..." : saved ? "✅ تم الحفظ!" : "💾 حفظ الإعدادات"}</button>
        </div>
      </div>
    </>
  );
  }
