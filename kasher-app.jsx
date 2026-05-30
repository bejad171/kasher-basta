import { useState, useEffect, useRef } from "react";

// ── PIN Lock Screen ───────────────────────────────────────────
const CORRECT_PIN = "1234"; // غير هذا الرقم لكلمة مرورك

function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);

  function pressKey(k) {
    if (pin.length >= 4) return;
    const newPin = pin + k;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => {
        if (newPin === CORRECT_PIN) {
          onUnlock();
        } else {
          setShake(true);
          setAttempts(a => a + 1);
          setTimeout(() => { setShake(false); setPin(""); }, 600);
        }
      }, 200);
    }
  }

  function pressDelete() { setPin(p => p.slice(0, -1)); }

  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "Cairo, sans-serif", padding: 24,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{
          width: 110, height: 110, borderRadius: "50%",
          background: "linear-gradient(135deg,#1a0a2e,#0a2010)",
          border: "3px solid #39ff14", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 12px", fontSize: 52,
          boxShadow: "0 0 24px #39ff1466",
        }}>🚬</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#39ff14", letterSpacing: 2, textShadow: "0 0 10px #39ff1488" }}>3lewa</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#bf00ff", letterSpacing: 6, textShadow: "0 0 8px #bf00ff88" }}>SMOKE</div>
      </div>

      <div style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>أدخل كلمة المرور</div>

      {/* PIN dots */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32, animation: shake ? "shake 0.5s" : "none" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: "50%",
            background: i < pin.length ? "#39ff14" : "transparent",
            border: `2px solid ${i < pin.length ? "#39ff14" : "#444"}`,
            boxShadow: i < pin.length ? "0 0 8px #39ff14" : "none",
            transition: "all 0.15s",
          }}/>
        ))}
      </div>

      {attempts > 0 && (
        <div style={{ color: "#ff4444", fontSize: 12, marginBottom: 16 }}>
          كلمة المرور خاطئة — المحاولة {attempts}
        </div>
      )}

      {/* Keypad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, width: 260 }}>
        {keys.map((k, i) => (
          <button key={i} onClick={() => k === "⌫" ? pressDelete() : k ? pressKey(k) : null}
            style={{
              height: 70, borderRadius: 16, border: "none", cursor: k ? "pointer" : "default",
              background: k === "⌫" ? "#2a1a1a" : k ? "linear-gradient(135deg,#1a1a2e,#0d2a1a)" : "transparent",
              color: k === "⌫" ? "#ff6666" : "#fff", fontSize: k === "⌫" ? 22 : 26,
              fontWeight: 700, fontFamily: "Cairo, sans-serif",
              border: k && k !== "⌫" ? "1px solid #2a3a2a" : "none",
              boxShadow: k && k !== "⌫" ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
              transition: "transform 0.1s",
            }}
            onMouseDown={e => { if(k) e.currentTarget.style.transform = "scale(0.93)"; }}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          >{k}</button>
        ))}
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-10px)}
          40%{transform:translateX(10px)}
          60%{transform:translateX(-8px)}
          80%{transform:translateX(8px)}
        }
      `}</style>
    </div>
  );
}

// ── Supabase ──────────────────────────────────────────────────
const SB_URL = "https://bznsriknwdutcjulsdkg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bnNyaWtud2R1dGNqdWxzZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDcyOTgsImV4cCI6MjA5NTQ4MzI5OH0.DJ-NfC4wlwMcqUIumpnsUWd9pFEljifm4W8ckxU-KUk";
const H = { "Content-Type": "application/json", apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

const sb = {
  async get(t, q = "") { const r = await fetch(`${SB_URL}/rest/v1/${t}?${q}`, { headers: H }); return r.json(); },
  async post(t, d) { const r = await fetch(`${SB_URL}/rest/v1/${t}`, { method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(d) }); return r.json(); },
  async patch(t, id, d) { await fetch(`${SB_URL}/rest/v1/${t}?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify(d) }); },
  async patchWhere(t, f, v, d) { await fetch(`${SB_URL}/rest/v1/${t}?${f}=eq.${encodeURIComponent(v)}`, { method: "PATCH", headers: H, body: JSON.stringify(d) }); },
  async delete(t, id) { await fetch(`${SB_URL}/rest/v1/${t}?id=eq.${id}`, { method: "DELETE", headers: H }); },
};

// ── Helpers ───────────────────────────────────────────────────
const now = () => new Date().toLocaleString("ar", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", calendar: "gregory" });
const fmt = (n) => Number(n || 0).toFixed(2);

// ── Default products ──────────────────────────────────────────
const DEFAULT_PRODUCTS = [
  { name: "ضفة ١", category: "ضفة", unit: "جرام", buy_price: 3, sell_price: 5, stock: 100, is_wafa: true },
  { name: "ضفة ٢", category: "ضفة", unit: "جرام", buy_price: 3.5, sell_price: 6, stock: 100, is_wafa: true },
  { name: "فرجينيا", category: "ضفة", unit: "جرام", buy_price: 4, sell_price: 7, stock: 100, is_wafa: true },
  { name: "نيكوتين", category: "سجائر", unit: "علبة", buy_price: 8, sell_price: 12, stock: 50, is_wafa: false },
  { name: "إمبريال", category: "سجائر", unit: "علبة", buy_price: 7, sell_price: 11, stock: 50, is_wafa: false },
  { name: "مانشستر", category: "سجائر", unit: "علبة", buy_price: 7, sell_price: 11, stock: 50, is_wafa: false },
  { name: "معسل سائل", category: "معسل", unit: "قطعة", buy_price: 10, sell_price: 15, stock: 30, is_wafa: false },
  { name: "ورق أوتومان", category: "ورق", unit: "دفتر", buy_price: 2, sell_price: 4, stock: 100, is_wafa: false },
  { name: "ورق لزق", category: "ورق", unit: "دفتر", buy_price: 1.5, sell_price: 3, stock: 100, is_wafa: false },
  { name: "ورق بديل", category: "ورق", unit: "دفتر", buy_price: 1.5, sell_price: 3, stock: 100, is_wafa: false },
  { name: "كرتيلات", category: "إكسسوار", unit: "قطعة", buy_price: 0.5, sell_price: 1, stock: 200, is_wafa: false },
  { name: "غاز قداحات", category: "إكسسوار", unit: "قطعة", buy_price: 2, sell_price: 4, stock: 50, is_wafa: false },
  { name: "حجار قداحات", category: "إكسسوار", unit: "قطعة", buy_price: 0.5, sell_price: 1, stock: 100, is_wafa: false },
];

// ── CSS ───────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body{font-family:'Cairo',sans-serif;direction:rtl;background:#f0f4f8;color:#1a1a2e;min-height:100vh;}
button,input,select,textarea{font-family:'Cairo',sans-serif;}
::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#c0cfe0;border-radius:4px;}
.page{padding:16px;padding-bottom:80px;min-height:100vh;}
.card{background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,0.06);}
.card-green{background:linear-gradient(135deg,#00b09b,#96c93d);color:#fff;}
.card-blue{background:linear-gradient(135deg,#2193b0,#6dd5ed);color:#fff;}
.card-red{background:linear-gradient(135deg,#f5515f,#9f041b);color:#fff;}
.card-orange{background:linear-gradient(135deg,#f7971e,#ffd200);color:#fff;}
.btn{border:none;border-radius:12px;padding:12px 18px;font-weight:700;font-size:14px;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;justify-content:center;}
.btn-primary{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;}
.btn-green{background:linear-gradient(135deg,#11998e,#38ef7d);color:#fff;}
.btn-red{background:linear-gradient(135deg,#f5515f,#9f041b);color:#fff;}
.btn-orange{background:linear-gradient(135deg,#f7971e,#ffd200);color:#1a1a2e;}
.btn-gray{background:#e8edf3;color:#555;}
.btn:active{transform:scale(0.97);}
.btn:disabled{opacity:0.5;cursor:default;}
.input{background:#f5f7fa;border:1.5px solid #e0e7ef;border-radius:10px;padding:10px 14px;font-size:14px;width:100%;outline:none;color:#1a1a2e;direction:rtl;}
.input:focus{border-color:#667eea;}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;}
.badge-green{background:#e8faf0;color:#11998e;}
.badge-red{background:#fef0f0;color:#e53935;}
.badge-blue{background:#e8f4fd;color:#2193b0;}
.badge-orange{background:#fff8e1;color:#f7971e;}
.row{display:flex;gap:10px;align-items:center;}
.col{display:flex;flex-direction:column;gap:8px;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.divider{height:1px;background:#e8edf3;margin:12px 0;}
.stat-label{font-size:11px;opacity:.8;margin-bottom:2px;}
.stat-value{font-size:22px;font-weight:900;}
.nav{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e8edf3;display:flex;z-index:100;box-shadow:0 -4px 20px rgba(0,0,0,0.06);}
.nav-btn{flex:1;padding:10px 0;border:none;background:transparent;cursor:pointer;font-size:10px;color:#aab;display:flex;flex-direction:column;align-items:center;gap:2px;border-top:2px solid transparent;transition:all .15s;font-family:'Cairo',sans-serif;font-weight:600;}
.nav-btn.active{color:#667eea;border-top-color:#667eea;}
.nav-icon{font-size:20px;}
.section-title{font-size:16px;font-weight:900;color:#1a1a2e;margin-bottom:12px;}
.customer-row{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.05);cursor:pointer;transition:transform .15s;}
.customer-row:active{transform:scale(0.98);}
.tag{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:#f0f4f8;color:#667eea;}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:flex-end;}
.modal{background:#fff;width:100%;border-radius:24px 24px 0 0;padding:20px;max-height:85vh;overflow-y:auto;}
.modal-handle{width:40px;height:4px;background:#e0e7ef;border-radius:2px;margin:0 auto 16px;}
.product-chip{padding:10px 14px;background:#f5f7fa;border-radius:12px;border:2px solid transparent;cursor:pointer;text-align:center;transition:all .15s;}
.product-chip.selected{background:#ede9ff;border-color:#667eea;}
.product-chip:active{transform:scale(0.96);}
.qty-btn{width:44px;height:44px;border-radius:12px;border:none;font-size:22px;font-weight:900;cursor:pointer;background:#f0f4f8;color:#1a1a2e;display:flex;align-items:center;justify-content:center;}
.sale-type-btn{flex:1;padding:14px;border-radius:14px;border:2px solid #e0e7ef;background:#fff;font-weight:700;font-size:14px;cursor:pointer;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:4px;}
.sale-type-btn.selected{border-color:#667eea;background:#ede9ff;color:#667eea;}
.history-item{padding:14px;background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.04);margin-bottom:8px;}
.header{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:99;}
.avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:18px;}
.wafa-indicator{font-size:10px;color:#f7971e;font-weight:700;}
.tabs{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px;}
.tab{padding:8px 16px;border-radius:20px;border:none;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;background:#e8edf3;color:#666;font-family:'Cairo',sans-serif;}
.tab.active{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;}
`;

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [locked, setLocked] = useState(true);
  const [page, setPage] = useState("home");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [debts, setDebts] = useState([]);
  const [capital, setCapital] = useState({ amount: 0, profit: 0 });
  const [loaded, setLoaded] = useState(false);

  async function loadAll() {
    const [p, c, s, d, cap] = await Promise.all([
      sb.get("products", "order=name"),
      sb.get("customers", "order=name"),
      sb.get("sales", "order=raw_date.desc&limit=200"),
      sb.get("debts", "order=customer_name"),
      sb.get("capital", "id=eq.1"),
    ]);
    setProducts(Array.isArray(p) ? p : []);
    setCustomers(Array.isArray(c) ? c : []);
    setSales(Array.isArray(s) ? s : []);
    setDebts(Array.isArray(d) ? d : []);
    setCapital(Array.isArray(cap) && cap[0] ? cap[0] : { amount: 0, profit: 0 });
    setLoaded(true);
  }

  async function initProducts() {
    const existing = await sb.get("products", "select=id");
    if (Array.isArray(existing) && existing.length === 0) {
      for (const p of DEFAULT_PRODUCTS) await sb.post("products", p);
      await loadAll();
    }
  }

  useEffect(() => { loadAll().then(initProducts); }, []);

  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;

  if (!loaded) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0a", color: "#39ff14", fontFamily: "Cairo" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚬</div>
      <div style={{ fontSize: 20, fontWeight: 900 }}>3lewa Smoke</div>
      <div style={{ fontSize: 14, opacity: .8, marginTop: 8, color: "#888" }}>جاري التحميل...</div>
    </div>
  );

  const props = { products, customers, sales, debts, capital, reload: loadAll, sb, now, fmt };

  return (
    <>
      <style>{css}</style>
      {page === "home" && <HomePage {...props} onLock={() => setLocked(true)} />}
      {page === "pos" && <PosPage {...props} />}
      {page === "customers" && <CustomersPage {...props} />}
      {page === "inventory" && <InventoryPage {...props} />}
      {page === "reports" && <ReportsPage {...props} />}
      <nav className="nav">
        {[
          { key: "home", icon: "🏠", label: "الرئيسية" },
          { key: "pos", icon: "🛒", label: "الكاشير" },
          { key: "customers", icon: "👥", label: "الديون" },
          { key: "inventory", icon: "📦", label: "المخزون" },
          { key: "reports", icon: "📊", label: "التقارير" },
        ].map(t => (
          <button key={t.key} className={`nav-btn ${page === t.key ? "active" : ""}`} onClick={() => setPage(t.key)}>
            <span className="nav-icon">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </>
  );
}

// ── HOME ──────────────────────────────────────────────────────
function HomePage({ sales, debts, capital, customers, products, onLock }) {
  const todaySales = sales.filter(s => {
    const d = new Date(s.raw_date);
    return d.toDateString() === new Date().toDateString();
  });
  const todayRevenue = todaySales.reduce((a, s) => a + Number(s.total), 0);
  const todayProfit = todaySales.reduce((a, s) => a + Number(s.profit), 0);
  const totalDebt = debts.filter(d => !d.paid).reduce((a, d) => a + Number(d.amount), 0);
  const lowStock = products.filter(p => p.stock < 10);

  return (
    <>
      <div className="header" style={{ background: "linear-gradient(135deg,#0a2010,#1a0a2e)" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#39ff14", textShadow: "0 0 8px #39ff1466" }}>🚬 3lewa Smoke</div>
          <div style={{ fontSize: 11, opacity: .7, color: "#aaa" }}>{new Date().toLocaleDateString("ar", { weekday: "long", year: "numeric", month: "long", day: "numeric", calendar: "gregory" })}</div>
        </div>
        <button onClick={onLock} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid #444", color: "#fff", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "Cairo" }}>🔒 قفل</button>
      </div>
      <div className="page">
        <div className="grid2" style={{ marginBottom: 12 }}>
          <div className="card card-green">
            <div className="stat-label">مبيعات اليوم</div>
            <div className="stat-value">₪{fmt(todayRevenue)}</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: .9 }}>{todaySales.length} عملية</div>
          </div>
          <div className="card card-blue">
            <div className="stat-label">ربح اليوم</div>
            <div className="stat-value">₪{fmt(todayProfit)}</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: .9 }}>صافي الربح</div>
          </div>
          <div className="card card-red">
            <div className="stat-label">إجمالي الديون</div>
            <div className="stat-value">₪{fmt(totalDebt)}</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: .9 }}>{customers.length} عميل</div>
          </div>
          <div className="card card-orange">
            <div className="stat-label">رأس المال</div>
            <div className="stat-value">₪{fmt(capital.amount)}</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: .9 }}>الربح الكلي: ₪{fmt(capital.profit)}</div>
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="card" style={{ marginBottom: 12, borderRight: "4px solid #f7971e" }}>
            <div style={{ fontWeight: 700, color: "#f7971e", marginBottom: 8 }}>⚠️ مخزون منخفض</div>
            {lowStock.map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f5f7fa" }}>
                <span>{p.name}</span>
                <span style={{ color: "#e53935", fontWeight: 700 }}>{p.stock} {p.unit}</span>
              </div>
            ))}
          </div>
        )}

        <div className="section-title">آخر العمليات</div>
        {sales.slice(0, 8).map((s, i) => (
          <div key={i} className="history-item">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.product_name}</div>
                <div style={{ fontSize: 11, color: "#aab", marginTop: 2 }}>{s.date}{!s.is_paid && <span style={{ color: "#e53935" }}> · دين: {s.customer_name}</span>}</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 900, color: "#11998e" }}>₪{fmt(s.total)}</div>
                <div style={{ fontSize: 11, color: "#f7971e" }}>ربح: ₪{fmt(s.profit)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── POS ───────────────────────────────────────────────────────
function PosPage({ products, customers, reload, sb, now, fmt, capital }) {
  const [step, setStep] = useState("select"); // select | config | payment
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saleType, setSaleType] = useState("unit"); // unit | gram | cigarette
  const [qty, setQty] = useState(1);
  const [isPaid, setIsPaid] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [catFilter, setCatFilter] = useState("الكل");

  const cats = ["الكل", ...new Set(products.map(p => p.category))];
  const filtered = catFilter === "الكل" ? products : products.filter(p => p.category === catFilter);

  const product = products.find(p => p.id === selectedProduct);

  // For wafa (ضفة) products sold by cigarette: 3 cigarettes = 1 gram
  const getGramsUsed = () => {
    if (!product) return 0;
    if (saleType === "cigarette") return qty / 3;
    if (saleType === "gram") return qty;
    return qty;
  };

  const getTotal = () => {
    if (!product) return 0;
    if (saleType === "cigarette") return (product.sell_price / 3) * qty;
    return product.sell_price * qty;
  };

  const getProfit = () => {
    if (!product) return 0;
    if (saleType === "cigarette") return ((product.sell_price - product.buy_price) / 3) * qty;
    return (product.sell_price - product.buy_price) * qty;
  };

  function reset() { setStep("select"); setSelectedProduct(null); setSaleType("unit"); setQty(1); setIsPaid(true); setCustomerId(""); }

  async function handleSale() {
    if (!product) return;
    if (!isPaid && !customerId) { alert("اختر العميل"); return; }
    const gramsUsed = getGramsUsed();
    if (product.stock < gramsUsed) { alert("الكمية أكثر من المخزون!"); return; }
    setLoading(true);

    const total = getTotal();
    const profit = getProfit();
    const customer = customers.find(c => c.id === +customerId);

    await sb.post("sales", {
      product_id: product.id,
      product_name: product.name,
      qty,
      sale_type: saleType,
      sell_price: product.sell_price,
      buy_price: product.buy_price,
      total,
      profit,
      is_paid: isPaid,
      customer_name: customer?.name || "",
      customer_id: customer?.id || null,
      date: now(),
      raw_date: new Date().toISOString(),
    });

    await sb.patch("products", product.id, { stock: product.stock - gramsUsed });

    if (!isPaid && customer) {
      await sb.post("debts", {
        customer_id: customer.id,
        customer_name: customer.name,
        product_name: product.name,
        qty,
        amount: total,
        date: now(),
        raw_date: new Date().toISOString(),
        paid: false,
      });
      await sb.patch("customers", customer.id, { balance: (Number(customer.balance) || 0) + total });
    } else if (isPaid) {
      await sb.patch("capital", 1, {
        amount: Number(capital.amount) + product.buy_price * gramsUsed,
        profit: Number(capital.profit) + profit,
      });
    }

    await reload();
    setLoading(false);
    reset();
    alert("✅ تم تسجيل البيعة!");
  }

  if (step === "select") return (
    <>
      <div className="header">
        <div style={{ fontWeight: 900, fontSize: 18 }}>🛒 الكاشير</div>
        <div style={{ fontSize: 12, opacity: .8 }}>اختر الصنف</div>
      </div>
      <div className="page">
        <div className="tabs">
          {cats.map(c => <button key={c} className={`tab ${catFilter === c ? "active" : ""}`} onClick={() => setCatFilter(c)}>{c}</button>)}
        </div>
        <div className="grid2">
          {filtered.map(p => (
            <div key={p.id} className="product-chip" onClick={() => { setSelectedProduct(p.id); setSaleType(p.is_wafa ? "gram" : "unit"); setStep("config"); }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
              {p.is_wafa && <div className="wafa-indicator">دخان ضفة</div>}
              <div style={{ color: "#11998e", fontWeight: 900, fontSize: 16 }}>₪{p.sell_price}</div>
              <div style={{ fontSize: 11, color: p.stock < 10 ? "#e53935" : "#aab", marginTop: 2 }}>مخزون: {p.stock} {p.unit}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  if (step === "config" && product) return (
    <>
      <div className="header">
        <button onClick={() => setStep("select")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo" }}>← رجوع</button>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{product.name}</div>
        <div style={{ width: 60 }} />
      </div>
      <div className="page">
        {product.is_wafa && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="section-title">طريقة البيع</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className={`sale-type-btn ${saleType === "gram" ? "selected" : ""}`} onClick={() => { setSaleType("gram"); setQty(1); }}>
                <span style={{ fontSize: 24 }}>⚖️</span>
                <span>بالجرام</span>
              </button>
              <button className={`sale-type-btn ${saleType === "cigarette" ? "selected" : ""}`} onClick={() => { setSaleType("cigarette"); setQty(1); }}>
                <span style={{ fontSize: 24 }}>🚬</span>
                <span>بالسيجارة</span>
                <span style={{ fontSize: 10, color: "#f7971e" }}>كل 3 = جرام</span>
              </button>
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-title">{saleType === "cigarette" ? "عدد السجائر" : saleType === "gram" ? "عدد الجرامات" : "الكمية"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
            <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span style={{ fontSize: 36, fontWeight: 900, minWidth: 60, textAlign: "center" }}>{qty}</span>
            <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
          </div>
          {saleType === "cigarette" && (
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "#f7971e", fontWeight: 700 }}>
              = {(qty / 3).toFixed(2)} جرام من المخزون
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#666" }}>الإجمالي</span>
            <span style={{ fontWeight: 900, fontSize: 20, color: "#11998e" }}>₪{fmt(getTotal())}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>الربح</span>
            <span style={{ fontWeight: 700, color: "#f7971e" }}>₪{fmt(getProfit())}</span>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: "100%", padding: 14, fontSize: 16 }} onClick={() => setStep("payment")}>
          التالي ← اختيار الدفع
        </button>
      </div>
    </>
  );

  if (step === "payment") return (
    <>
      <div className="header">
        <button onClick={() => setStep("config")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo" }}>← رجوع</button>
        <div style={{ fontWeight: 900, fontSize: 16 }}>طريقة الدفع</div>
        <div style={{ width: 60 }} />
      </div>
      <div className="page">
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button className={`sale-type-btn ${isPaid ? "selected" : ""}`} onClick={() => setIsPaid(true)} style={{ borderColor: isPaid ? "#11998e" : "#e0e7ef", background: isPaid ? "#e8faf0" : "#fff", color: isPaid ? "#11998e" : "#666" }}>
              <span style={{ fontSize: 28 }}>💵</span>
              <span>نقداً</span>
            </button>
            <button className={`sale-type-btn ${!isPaid ? "selected" : ""}`} onClick={() => setIsPaid(false)} style={{ borderColor: !isPaid ? "#e53935" : "#e0e7ef", background: !isPaid ? "#fef0f0" : "#fff", color: !isPaid ? "#e53935" : "#666" }}>
              <span style={{ fontSize: 28 }}>📋</span>
              <span>دين</span>
            </button>
          </div>
        </div>

        {!isPaid && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="section-title">اختر العميل</div>
            <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">— اختر العميل —</option>
              {[...customers].sort((a, b) => a.name.localeCompare(b.name, "ar")).map(c => (
                <option key={c.id} value={c.id}>{c.name} — رصيد: ₪{fmt(c.balance)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="card" style={{ marginBottom: 16, background: "linear-gradient(135deg,#f5f7fa,#e8edf3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#666" }}>الصنف</span>
            <span style={{ fontWeight: 700 }}>{product?.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#666" }}>الكمية</span>
            <span style={{ fontWeight: 700 }}>{qty} {saleType === "cigarette" ? "سيجارة" : saleType === "gram" ? "جرام" : product?.unit}</span>
          </div>
          <div className="divider" />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>الإجمالي</span>
            <span style={{ fontWeight: 900, fontSize: 20, color: "#11998e" }}>₪{fmt(getTotal())}</span>
          </div>
        </div>

        <button className="btn btn-green" style={{ width: "100%", padding: 16, fontSize: 16 }} onClick={handleSale} disabled={loading}>
          {loading ? "⏳ جاري الحفظ..." : isPaid ? "✅ تأكيد البيع نقداً" : "📋 تسجيل الدين"}
        </button>
      </div>
    </>
  );
}

// ── CUSTOMERS ─────────────────────────────────────────────────
function CustomersPage({ customers, debts, reload, sb, now, fmt, capital }) {
  const [view, setView] = useState("list"); // list | detail | add
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [payAmount, setPayAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const totalDebt = debts.filter(d => !d.paid).reduce((a, d) => a + Number(d.amount), 0);
  const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name, "ar")).filter(c => c.name.includes(search));
  const customer = customers.find(c => c.id === selected);
  const customerDebts = debts.filter(d => d.customer_id === selected);
  const pendingDebt = customerDebts.filter(d => !d.paid).reduce((a, d) => a + Number(d.amount), 0);
  const paidDebt = customerDebts.filter(d => d.paid).reduce((a, d) => a + Number(d.amount), 0);

  async function addCustomer() {
    if (!form.name.trim()) return;
    await sb.post("customers", { name: form.name.trim(), phone: form.phone.trim(), balance: 0 });
    await reload();
    setForm({ name: "", phone: "" });
    setView("list");
  }

  async function payAll() {
    if (!confirm(`تسجيل سداد كامل من ${customer?.name}؟`)) return;
    setLoading(true);
    await sb.patchWhere("debts", "customer_id", selected, { paid: true });
    await sb.patch("customers", selected, { balance: 0 });
    await sb.patch("capital", 1, {
      amount: Number(capital.amount) + pendingDebt * 0.75,
      profit: Number(capital.profit) + pendingDebt * 0.25,
    });
    await reload();
    setLoading(false);
  }

  async function payPart() {
    const amt = +payAmount;
    if (!amt || amt <= 0) return;
    setLoading(true);
    let remaining = amt;
    const unpaid = customerDebts.filter(d => !d.paid).sort((a, b) => a.id - b.id);
    for (const d of unpaid) {
      if (remaining <= 0) break;
      if (remaining >= Number(d.amount)) { await sb.patch("debts", d.id, { paid: true }); remaining -= Number(d.amount); }
      else { await sb.patch("debts", d.id, { amount: Number(d.amount) - remaining }); remaining = 0; }
    }
    const newBalance = Math.max(0, Number(customer.balance) - amt);
    await sb.patch("customers", selected, { balance: newBalance });
    await sb.patch("capital", 1, { amount: Number(capital.amount) + amt * 0.75, profit: Number(capital.profit) + amt * 0.25 });
    await reload();
    setPayAmount("");
    setLoading(false);
  }

  if (view === "add") return (
    <>
      <div className="header">
        <button onClick={() => setView("list")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo" }}>← رجوع</button>
        <div style={{ fontWeight: 900, fontSize: 16 }}>إضافة عميل جديد</div>
        <div style={{ width: 60 }} />
      </div>
      <div className="page">
        <div className="card col">
          <div className="col">
            <label style={{ fontSize: 12, color: "#666" }}>الاسم *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="اسم العميل" />
          </div>
          <div className="col">
            <label style={{ fontSize: 12, color: "#666" }}>رقم الهاتف</label>
            <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="05xxxxxxxx" type="tel" />
          </div>
          <button className="btn btn-primary" onClick={addCustomer}>✅ إضافة العميل</button>
        </div>
      </div>
    </>
  );

  if (view === "detail" && customer) return (
    <>
      <div className="header">
        <button onClick={() => setView("list")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo" }}>← رجوع</button>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{customer.name}</div>
        <div style={{ fontSize: 12, opacity: .8 }}>{customer.phone}</div>
      </div>
      <div className="page">
        <div className="grid2" style={{ marginBottom: 12 }}>
          <div className="card" style={{ background: "linear-gradient(135deg,#f5515f,#9f041b)", color: "#fff" }}>
            <div className="stat-label">المتبقي</div>
            <div className="stat-value">₪{fmt(pendingDebt)}</div>
          </div>
          <div className="card" style={{ background: "linear-gradient(135deg,#11998e,#38ef7d)", color: "#fff" }}>
            <div className="stat-label">المسدد</div>
            <div className="stat-value">₪{fmt(paidDebt)}</div>
          </div>
        </div>

        {pendingDebt > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ color: "#11998e" }}>💰 تسجيل دفعة</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input className="input" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="المبلغ ₪" style={{ flex: 1 }} />
              <button className="btn btn-green" onClick={payPart} disabled={loading}>دفع</button>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={payAll} disabled={loading}>
              {loading ? "⏳..." : `سداد كامل (₪${fmt(pendingDebt)})`}
            </button>
          </div>
        )}

        <div className="section-title">سجل الحركات</div>
        {[...customerDebts].reverse().map((d, i) => (
          <div key={i} className="history-item" style={{ borderRight: `3px solid ${d.paid ? "#11998e" : "#f5515f"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{d.product_name}</div>
                <div style={{ fontSize: 11, color: "#aab" }}>{d.date} · الكمية: {d.qty}</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 900, color: d.paid ? "#11998e" : "#e53935" }}>₪{fmt(d.amount)}</div>
                <span className={`badge ${d.paid ? "badge-green" : "badge-red"}`}>{d.paid ? "✅ مسدد" : "⏳ دين"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      <div className="header">
        <div style={{ fontWeight: 900, fontSize: 18 }}>👥 حسابات الديون</div>
        <div style={{ fontSize: 14, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20 }}>₪{fmt(totalDebt)}</div>
      </div>
      <div className="page">
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث عن عميل..." style={{ flex: 1 }} />
          <button className="btn btn-primary" style={{ padding: "10px 14px" }} onClick={() => setView("add")}>+ إضافة</button>
        </div>
        {sorted.length === 0 && <div className="card" style={{ textAlign: "center", color: "#aab", padding: 30 }}>لا يوجد عملاء بعد</div>}
        <div className="col">
          {sorted.map(c => {
            const bal = Number(c.balance) || 0;
            return (
              <div key={c.id} className="customer-row" onClick={() => { setSelected(c.id); setView("detail"); }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                  {c.phone && <div style={{ fontSize: 12, color: "#aab" }}>{c.phone}</div>}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 900, color: bal > 0 ? "#e53935" : "#11998e", fontSize: 16 }}>
                    {bal > 0 ? `₪${fmt(bal)}` : "✅ مسدد"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── INVENTORY ─────────────────────────────────────────────────
function InventoryPage({ products, reload, sb, fmt }) {
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", category: "سجائر", unit: "علبة", buy_price: "", sell_price: "", stock: "", is_wafa: false });
  const [loading, setLoading] = useState(false);
  const [catFilter, setCatFilter] = useState("الكل");

  const cats = ["الكل", ...new Set(products.map(p => p.category))];
  const filtered = catFilter === "الكل" ? products : products.filter(p => p.category === catFilter);

  async function save() {
    if (!form.name || !form.sell_price) { alert("أكمل الحقول المطلوبة"); return; }
    setLoading(true);
    const data = { name: form.name, category: form.category, unit: form.unit, buy_price: +form.buy_price, sell_price: +form.sell_price, stock: +form.stock, is_wafa: form.is_wafa };
    if (editId) await sb.patch("products", editId, data);
    else await sb.post("products", data);
    await reload();
    setLoading(false);
    setView("list");
    setEditId(null);
  }

  async function addStock(id, current) {
    const amt = prompt("كم تبي تضيف للمخزون؟");
    if (!amt || isNaN(amt)) return;
    await sb.patch("products", id, { stock: current + +amt });
    await reload();
  }

  if (view !== "list") return (
    <>
      <div className="header">
        <button onClick={() => { setView("list"); setEditId(null); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo" }}>← رجوع</button>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{editId ? "تعديل صنف" : "صنف جديد"}</div>
        <div style={{ width: 60 }} />
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
          <div className="col"><label style={{ fontSize: 12, color: "#666" }}>الكمية الأولية</label><input className="input" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
          <label style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0" }}>
            <input type="checkbox" checked={form.is_wafa} onChange={e => setForm(f => ({ ...f, is_wafa: e.target.checked }))} style={{ width: 18, height: 18 }} />
            <span style={{ fontWeight: 600 }}>دخان ضفة (يُباع بالجرام/السيجارة)</span>
          </label>
          <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? "⏳..." : "💾 حفظ"}</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="header">
        <div style={{ fontWeight: 900, fontSize: 18 }}>📦 المخزون</div>
        <button className="btn btn-orange" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => { setForm({ name: "", category: "سجائر", unit: "علبة", buy_price: "", sell_price: "", stock: "", is_wafa: false }); setView("add"); }}>+ جديد</button>
      </div>
      <div className="page">
        <div className="tabs">
          {cats.map(c => <button key={c} className={`tab ${catFilter === c ? "active" : ""}`} onClick={() => setCatFilter(c)}>{c}</button>)}
        </div>
        <div className="col">
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ borderRight: p.stock < 10 ? "4px solid #f5515f" : "4px solid transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                    {p.is_wafa && <span className="badge badge-orange">ضفة</span>}
                    <span className="badge badge-blue">{p.category}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#666", display: "flex", gap: 12 }}>
                    <span>شراء: <b style={{ color: "#2193b0" }}>₪{p.buy_price}</b></span>
                    <span>بيع: <b style={{ color: "#11998e" }}>₪{p.sell_price}</b></span>
                    <span>ربح: <b style={{ color: "#f7971e" }}>₪{p.sell_price - p.buy_price}</b></span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge ${p.stock < 10 ? "badge-red" : "badge-green"}`}>{p.stock} {p.unit}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-green" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => addStock(p.id, p.stock)}>+مخزون</button>
                  <button className="btn btn-gray" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => { setForm({ name: p.name, category: p.category, unit: p.unit, buy_price: p.buy_price, sell_price: p.sell_price, stock: p.stock, is_wafa: p.is_wafa || false }); setEditId(p.id); setView("edit"); }}>تعديل</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── REPORTS ───────────────────────────────────────────────────
function ReportsPage({ sales, capital, fmt }) {
  const [filter, setFilter] = useState("today");
  const now2 = new Date();

  const filtered = sales.filter(s => {
    const d = new Date(s.raw_date);
    if (filter === "today") return d.toDateString() === now2.toDateString();
    if (filter === "week") return (now2 - d) < 7 * 86400000;
    return true;
  });

  const totalRev = filtered.reduce((a, s) => a + Number(s.total), 0);
  const totalProfit = filtered.reduce((a, s) => a + Number(s.profit), 0);
  const totalCost = filtered.reduce((a, s) => a + Number(s.buy_price) * s.qty, 0);
  const cashSales = filtered.filter(s => s.is_paid).reduce((a, s) => a + Number(s.total), 0);
  const debtSales = filtered.filter(s => !s.is_paid).reduce((a, s) => a + Number(s.total), 0);

  const productMap = {};
  filtered.forEach(s => {
    if (!productMap[s.product_name]) productMap[s.product_name] = { total: 0, qty: 0 };
    productMap[s.product_name].total += Number(s.total);
    productMap[s.product_name].qty += Number(s.qty);
  });
  const topProducts = Object.entries(productMap).sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  return (
    <>
      <div className="header">
        <div style={{ fontWeight: 900, fontSize: 18 }}>📊 التقارير</div>
      </div>
      <div className="page">
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["today", "اليوم"], ["week", "الأسبوع"], ["all", "الكل"]].map(([k, l]) => (
            <button key={k} className={`tab ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        <div className="grid2" style={{ marginBottom: 12 }}>
          {[
            { label: "إجمالي المبيعات", value: `₪${fmt(totalRev)}`, color: "#11998e" },
            { label: "الربح الصافي", value: `₪${fmt(totalProfit)}`, color: "#f7971e" },
            { label: "تكلفة البضاعة", value: `₪${fmt(totalCost)}`, color: "#2193b0" },
            { label: "نقد مقبوض", value: `₪${fmt(cashSales)}`, color: "#11998e" },
            { label: "دين مؤجل", value: `₪${fmt(debtSales)}`, color: "#e53935" },
            { label: "رأس المال الكلي", value: `₪${fmt(capital.amount)}`, color: "#764ba2" },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#aab", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {topProducts.length > 0 && (
          <>
            <div className="section-title">🏆 أكثر الأصناف مبيعاً</div>
            <div className="card" style={{ marginBottom: 12 }}>
              {topProducts.map(([name, data], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < topProducts.length - 1 ? "1px solid #f5f7fa" : "none" }}>
                  <span style={{ fontWeight: 600 }}>{i + 1}. {name}</span>
                  <span style={{ color: "#11998e", fontWeight: 700 }}>₪{fmt(data.total)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="section-title">آخر العمليات</div>
        {filtered.slice(0, 30).map((s, i) => (
          <div key={i} className="history-item" style={{ borderRight: `3px solid ${s.is_paid ? "#11998e" : "#e53935"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.product_name}</div>
                <div style={{ fontSize: 11, color: "#aab" }}>{s.date} · {s.qty} {s.sale_type === "cigarette" ? "سيجارة" : s.sale_type === "gram" ? "جرام" : ""}</div>
                {!s.is_paid && <div style={{ fontSize: 11, color: "#e53935" }}>دين: {s.customer_name}</div>}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 900, color: "#11998e" }}>₪{fmt(s.total)}</div>
                <div style={{ fontSize: 11, color: "#f7971e" }}>ربح: ₪{fmt(s.profit)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
      }
