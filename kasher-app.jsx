import { useState, useEffect, useCallback } from "react";

// ============================================================
// STORAGE HELPERS (using Claude artifact persistent storage)
// ============================================================
const KEYS = {
  products: "kasher:products",
  sales: "kasher:sales",
  debts: "kasher:debts",
  capital: "kasher:capital",
};

async function loadData(key) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}

async function saveData(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value));
  } catch (e) { console.error("storage error", e); }
}

// ============================================================
// SAMPLE INITIAL PRODUCTS
// ============================================================
const DEFAULT_PRODUCTS = [
  { id: 1, name: "مارلبورو أحمر", buyPrice: 10, sellPrice: 13, stock: 50, unit: "علبة" },
  { id: 2, name: "وينستون أزرق", buyPrice: 9, sellPrice: 12, stock: 40, unit: "علبة" },
  { id: 3, name: "كنت سوبر", buyPrice: 8, sellPrice: 11, stock: 30, unit: "علبة" },
  { id: 4, name: "شيشة فاخرة", buyPrice: 25, sellPrice: 35, stock: 20, unit: "علبة" },
];

// ============================================================
// DATE HELPERS
// ============================================================
function nowStr() {
  return new Date().toLocaleString("ar-SA", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
    calendar: "gregory",
  });
}

// ============================================================
// ICONS
// ============================================================
const Icon = {
  pos: "🏪",
  products: "📦",
  debts: "📋",
  reports: "📊",
  add: "➕",
  minus: "➖",
  check: "✅",
  debt: "💸",
  trash: "🗑️",
  pay: "💰",
  back: "←",
  save: "💾",
  search: "🔍",
};

// ============================================================
// COLOURS & STYLE CONSTANTS
// ============================================================
const C = {
  bg: "#0f0f14",
  card: "#1a1a24",
  border: "#2a2a3a",
  accent: "#f5a623",
  accentDim: "#c4841a",
  green: "#2ecc71",
  red: "#e74c3c",
  blue: "#3498db",
  text: "#eee",
  muted: "#888",
  radius: "14px",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.text}; font-family: 'Cairo', sans-serif; direction: rtl; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }
  input, select { font-family: 'Cairo', sans-serif; direction: rtl; }
  button { font-family: 'Cairo', sans-serif; cursor: pointer; border: none; }
`;

// ============================================================
// REUSABLE COMPONENTS
// ============================================================
function Card({ children, style }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: C.radius, padding: "16px", ...style
    }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, color = C.accent, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "#333" : color, color: disabled ? "#666" : "#000",
      fontWeight: 700, padding: "10px 18px", borderRadius: "10px",
      fontSize: "14px", transition: "opacity 0.15s",
      opacity: disabled ? 0.5 : 1, ...style
    }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", ...style }}>
      {label && <label style={{ fontSize: "12px", color: C.muted }}>{label}</label>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: "#11111a", border: `1px solid ${C.border}`, color: C.text,
          padding: "10px 12px", borderRadius: "10px", fontSize: "14px", outline: "none",
          width: "100%",
        }}
      />
    </div>
  );
}

// ============================================================
// NAVBAR
// ============================================================
function Navbar({ page, setPage, capital, profit }) {
  const tabs = [
    { key: "pos", label: "البيع", icon: Icon.pos },
    { key: "products", label: "المخزون", icon: Icon.products },
    { key: "debts", label: "الديون", icon: Icon.debts },
    { key: "reports", label: "التقارير", icon: Icon.reports },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: C.card, borderTop: `1px solid ${C.border}`,
      display: "flex", justifyContent: "space-around", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => setPage(t.key)} style={{
          flex: 1, padding: "12px 0", background: "transparent",
          color: page === t.key ? C.accent : C.muted,
          borderTop: page === t.key ? `2px solid ${C.accent}` : "2px solid transparent",
          fontSize: "11px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
        }}>
          <span style={{ fontSize: "20px" }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// POS PAGE
// ============================================================
function PosPage({ products, onSale }) {
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [isPaid, setIsPaid] = useState(true);
  const [debtorName, setDebtorName] = useState("");
  const [debtorSearch, setDebtorSearch] = useState("");
  const [step, setStep] = useState("list"); // list | confirm

  const product = products.find(p => p.id === selected);

  function handleSelect(id) { setSelected(id); setQty(1); setStep("confirm"); }
  function handleBack() { setSelected(null); setStep("list"); setIsPaid(true); setDebtorName(""); }

  function handleConfirm() {
    if (!product) return;
    if (!isPaid && !debtorName.trim()) { alert("أدخل اسم المدين"); return; }
    if (product.stock < qty) { alert("الكمية المطلوبة أكثر من المخزون!"); return; }
    onSale({
      productId: product.id,
      productName: product.name,
      qty,
      sellPrice: product.sellPrice,
      buyPrice: product.buyPrice,
      total: product.sellPrice * qty,
      profit: (product.sellPrice - product.buyPrice) * qty,
      isPaid,
      debtorName: isPaid ? "" : debtorName.trim(),
      date: nowStr(),
    });
    handleBack();
  }

  if (step === "confirm" && product) {
    return (
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        <button onClick={handleBack} style={{ background: "transparent", color: C.muted, fontSize: "20px", marginBottom: "12px" }}>
          {Icon.back} رجوع
        </button>

        <Card style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "18px", fontWeight: 900, color: C.accent }}>{product.name}</div>
          <div style={{ color: C.muted, fontSize: "13px", marginTop: "4px" }}>
            سعر البيع: <span style={{ color: C.green }}>{product.sellPrice} ر.س</span> &nbsp;|&nbsp;
            مخزون: <span style={{ color: C.blue }}>{product.stock}</span>
          </div>
        </Card>

        <Card style={{ marginBottom: "12px" }}>
          <div style={{ fontWeight: 700, marginBottom: "10px" }}>الكمية</div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Btn onClick={() => setQty(q => Math.max(1, q - 1))} color="#333" style={{ color: C.text, fontSize: "20px", padding: "8px 16px" }}>−</Btn>
            <span style={{ fontSize: "28px", fontWeight: 900, flex: 1, textAlign: "center" }}>{qty}</span>
            <Btn onClick={() => setQty(q => Math.min(product.stock, q + 1))} color="#333" style={{ color: C.text, fontSize: "20px", padding: "8px 16px" }}>+</Btn>
          </div>
        </Card>

        <Card style={{ marginBottom: "12px" }}>
          <div style={{ fontWeight: 700, marginBottom: "10px" }}>طريقة الدفع</div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Btn onClick={() => setIsPaid(true)} color={isPaid ? C.green : "#333"} style={{ flex: 1, color: isPaid ? "#000" : C.text }}>
              {Icon.check} واصل
            </Btn>
            <Btn onClick={() => setIsPaid(false)} color={!isPaid ? C.red : "#333"} style={{ flex: 1, color: !isPaid ? "#fff" : C.text }}>
              {Icon.debt} دين
            </Btn>
          </div>

          {!isPaid && (
            <div style={{ marginTop: "12px" }}>
              <Input
                label="اسم المدين"
                value={debtorName}
                onChange={setDebtorName}
                placeholder="أدخل اسم الزبون"
              />
            </div>
          )}
        </Card>

        <Card style={{
          marginBottom: "16px",
          background: "linear-gradient(135deg, #1a2a1a, #1a1a24)",
          border: `1px solid ${C.green}33`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: C.muted }}>الإجمالي</span>
            <span style={{ color: C.green, fontWeight: 900, fontSize: "20px" }}>{(product.sellPrice * qty).toFixed(2)} ر.س</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: C.muted }}>الربح</span>
            <span style={{ color: C.accent, fontWeight: 700 }}>{((product.sellPrice - product.buyPrice) * qty).toFixed(2)} ر.س</span>
          </div>
        </Card>

        <Btn onClick={handleConfirm} style={{ width: "100%", padding: "14px", fontSize: "16px" }}>
          {isPaid ? `${Icon.check} تسجيل البيعة` : `${Icon.debt} تسجيل الدين`}
        </Btn>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", paddingBottom: "80px" }}>
      <h2 style={{ fontWeight: 900, color: C.accent, marginBottom: "14px", fontSize: "20px" }}>
        {Icon.pos} اختر الصنف
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {products.map(p => (
          <button key={p.id} onClick={() => handleSelect(p.id)} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: C.radius, padding: "14px 10px",
            textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>{p.name}</div>
            <div style={{ color: C.green, fontWeight: 900, fontSize: "18px" }}>{p.sellPrice} ر.س</div>
            <div style={{ color: p.stock < 5 ? C.red : C.muted, fontSize: "12px", marginTop: "4px" }}>
              مخزون: {p.stock}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PRODUCTS PAGE
// ============================================================
function ProductsPage({ products, onAdd, onEdit, onDelete }) {
  const [mode, setMode] = useState("list"); // list | add | edit
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", buyPrice: "", sellPrice: "", stock: "", unit: "علبة" });

  function openAdd() { setForm({ name: "", buyPrice: "", sellPrice: "", stock: "", unit: "علبة" }); setMode("add"); }
  function openEdit(p) { setForm({ name: p.name, buyPrice: p.buyPrice, sellPrice: p.sellPrice, stock: p.stock, unit: p.unit }); setEditId(p.id); setMode("edit"); }

  function handleSave() {
    if (!form.name || !form.buyPrice || !form.sellPrice || !form.stock) { alert("أكمل جميع الحقول"); return; }
    const data = { name: form.name, buyPrice: +form.buyPrice, sellPrice: +form.sellPrice, stock: +form.stock, unit: form.unit };
    if (mode === "add") onAdd(data);
    else onEdit(editId, data);
    setMode("list");
  }

  if (mode !== "list") {
    return (
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        <button onClick={() => setMode("list")} style={{ background: "transparent", color: C.muted, fontSize: "18px", marginBottom: "14px" }}>
          {Icon.back} رجوع
        </button>
        <h2 style={{ fontWeight: 900, color: C.accent, marginBottom: "16px" }}>
          {mode === "add" ? "إضافة صنف جديد" : "تعديل الصنف"}
        </h2>
        <Card style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input label="اسم الصنف" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="مثال: مارلبورو أحمر" />
          <Input label="سعر الشراء (ر.س)" type="number" value={form.buyPrice} onChange={v => setForm(f => ({ ...f, buyPrice: v }))} />
          <Input label="سعر البيع (ر.س)" type="number" value={form.sellPrice} onChange={v => setForm(f => ({ ...f, sellPrice: v }))} />
          <Input label="الكمية في المخزون" type="number" value={form.stock} onChange={v => setForm(f => ({ ...f, stock: v }))} />
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "12px", color: C.muted }}>الوحدة</label>
            <select
              value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              style={{ background: "#11111a", border: `1px solid ${C.border}`, color: C.text, padding: "10px 12px", borderRadius: "10px", fontSize: "14px" }}
            >
              {["علبة", "كرتون", "قطعة", "كيس", "لفة"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <Btn onClick={handleSave} style={{ marginTop: "8px" }}>{Icon.save} حفظ</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", paddingBottom: "80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h2 style={{ fontWeight: 900, color: C.accent, fontSize: "20px" }}>{Icon.products} المخزون</h2>
        <Btn onClick={openAdd} style={{ padding: "8px 14px", fontSize: "13px" }}>{Icon.add} صنف جديد</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {products.map(p => (
          <Card key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>{p.name}</div>
                <div style={{ fontSize: "12px", color: C.muted, display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span>شراء: <b style={{ color: C.blue }}>{p.buyPrice}</b></span>
                  <span>بيع: <b style={{ color: C.green }}>{p.sellPrice}</b></span>
                  <span>ربح: <b style={{ color: C.accent }}>{p.sellPrice - p.buyPrice}</b></span>
                  <span style={{ color: p.stock < 5 ? C.red : C.muted }}>مخزون: <b>{p.stock} {p.unit}</b></span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => openEdit(p)} style={{ background: "#1e2a3a", color: C.blue, border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "13px" }}>تعديل</button>
                <button onClick={() => { if (confirm(`حذف ${p.name}؟`)) onDelete(p.id); }} style={{ background: "#2a1a1a", color: C.red, border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "13px" }}>{Icon.trash}</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// DEBTS PAGE
// ============================================================
function DebtsPage({ debts, onPay, onPayPart }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  const grouped = {};
  debts.forEach(d => {
    if (!grouped[d.debtorName]) grouped[d.debtorName] = [];
    grouped[d.debtorName].push(d);
  });

  const sorted = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "ar"));
  const filtered = sorted.filter(name => name.includes(search));

  if (selected) {
    const person = grouped[selected] || [];
    const total = person.filter(d => !d.paid).reduce((s, d) => s + d.amount, 0);
    const paidTotal = person.filter(d => d.paid).reduce((s, d) => s + d.amount, 0);

    return (
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        <button onClick={() => setSelected(null)} style={{ background: "transparent", color: C.muted, fontSize: "18px", marginBottom: "14px" }}>
          {Icon.back} رجوع
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h2 style={{ fontWeight: 900, fontSize: "18px" }}>{selected}</h2>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: C.red, fontWeight: 900 }}>{total.toFixed(2)} ر.س</div>
            <div style={{ color: C.muted, fontSize: "11px" }}>متبقي</div>
          </div>
        </div>

        {total > 0 && (
          <Card style={{ marginBottom: "12px", border: `1px solid ${C.green}44` }}>
            <div style={{ fontWeight: 700, marginBottom: "8px", color: C.green }}>تسجيل دفعة</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Input value={payAmount} onChange={setPayAmount} type="number" placeholder="المبلغ" style={{ flex: 1 }} />
              <Btn onClick={() => {
                const amt = +payAmount;
                if (!amt || amt <= 0) return;
                onPayPart(selected, amt);
                setPayAmount("");
              }} color={C.green} style={{ padding: "10px 14px", fontSize: "13px" }}>
                {Icon.pay} دفع
              </Btn>
            </div>
            <Btn onClick={() => { if (confirm("تسجيل كامل المبلغ مدفوع؟")) { onPay(selected); } }} color="#1a3a1a" style={{ marginTop: "8px", width: "100%", color: C.green, border: `1px solid ${C.green}44` }}>
              سداد كامل ({total.toFixed(2)} ر.س)
            </Btn>
          </Card>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {person.sort((a, b) => new Date(b.date) - new Date(a.date)).map((d, i) => (
            <Card key={i} style={{ opacity: d.paid ? 0.5 : 1, borderColor: d.paid ? C.green + "44" : C.border }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{d.productName}</div>
                  <div style={{ color: C.muted, fontSize: "11px" }}>{d.date} · الكمية: {d.qty}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: d.paid ? C.green : C.red, fontWeight: 700 }}>{d.amount.toFixed(2)} ر.س</div>
                  <div style={{ color: C.muted, fontSize: "11px" }}>{d.paid ? "✅ مسدد" : "⏳ دين"}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalAllDebts = Object.values(grouped).flat().filter(d => !d.paid).reduce((s, d) => s + d.amount, 0);

  return (
    <div style={{ padding: "16px", paddingBottom: "80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h2 style={{ fontWeight: 900, color: C.accent, fontSize: "20px" }}>{Icon.debts} الديون</h2>
        <div style={{ color: C.red, fontWeight: 900, fontSize: "16px" }}>{totalAllDebts.toFixed(2)} ر.س</div>
      </div>

      <div style={{ position: "relative", marginBottom: "12px" }}>
        <Input value={search} onChange={setSearch} placeholder="🔍 ابحث عن اسم..." />
      </div>

      {filtered.length === 0 && (
        <Card style={{ textAlign: "center", color: C.muted, padding: "30px" }}>لا توجد ديون 🎉</Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map(name => {
          const items = grouped[name];
          const pending = items.filter(d => !d.paid).reduce((s, d) => s + d.amount, 0);
          return (
            <button key={name} onClick={() => setSelected(name)} style={{
              background: C.card, border: `1px solid ${pending > 0 ? C.red + "44" : C.green + "44"}`,
              borderRadius: C.radius, padding: "14px 16px", textAlign: "right",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "16px" }}>{name}</div>
                <div style={{ color: C.muted, fontSize: "12px", marginTop: "2px" }}>{items.length} معاملة</div>
              </div>
              <div style={{ color: pending > 0 ? C.red : C.green, fontWeight: 900, fontSize: "16px" }}>
                {pending > 0 ? `${pending.toFixed(2)} ر.س` : "✅ مسدد"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// REPORTS PAGE
// ============================================================
function ReportsPage({ sales, capital, profit, products }) {
  const [filter, setFilter] = useState("today"); // today | week | all

  const now = new Date();
  const filtered = sales.filter(s => {
    const d = new Date(s.rawDate || now);
    if (filter === "today") return d.toDateString() === now.toDateString();
    if (filter === "week") return (now - d) < 7 * 86400000;
    return true;
  });

  const totalSales = filtered.reduce((s, x) => s + x.total, 0);
  const totalProfit = filtered.reduce((s, x) => s + x.profit, 0);
  const totalCost = filtered.reduce((s, x) => s + (x.buyPrice * x.qty), 0);
  const paidSales = filtered.filter(x => x.isPaid).reduce((s, x) => s + x.total, 0);
  const debtSales = filtered.filter(x => !x.isPaid).reduce((s, x) => s + x.total, 0);

  const StatBox = ({ label, value, color }) => (
    <Card style={{ flex: 1, textAlign: "center", minWidth: "140px" }}>
      <div style={{ color: C.muted, fontSize: "12px", marginBottom: "6px" }}>{label}</div>
      <div style={{ color, fontWeight: 900, fontSize: "20px" }}>{value}</div>
    </Card>
  );

  return (
    <div style={{ padding: "16px", paddingBottom: "80px" }}>
      <h2 style={{ fontWeight: 900, color: C.accent, marginBottom: "14px", fontSize: "20px" }}>{Icon.reports} التقارير</h2>

      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        {[["today", "اليوم"], ["week", "الأسبوع"], ["all", "الكل"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            flex: 1, padding: "8px", borderRadius: "10px", fontSize: "13px", fontWeight: 700,
            background: filter === k ? C.accent : C.card,
            color: filter === k ? "#000" : C.muted,
            border: `1px solid ${filter === k ? C.accent : C.border}`,
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
        <StatBox label="إجمالي المبيعات" value={`${totalSales.toFixed(2)} ر.س`} color={C.green} />
        <StatBox label="الربح الصافي" value={`${totalProfit.toFixed(2)} ر.س`} color={C.accent} />
        <StatBox label="تكلفة البضاعة" value={`${totalCost.toFixed(2)} ر.س`} color={C.blue} />
        <StatBox label="نقد مقبوض" value={`${paidSales.toFixed(2)} ر.س`} color={C.green} />
        <StatBox label="دين مؤجل" value={`${debtSales.toFixed(2)} ر.س`} color={C.red} />
        <StatBox label="رأس المال الكلي" value={`${capital.toFixed(2)} ر.س`} color="#a78bfa" />
      </div>

      <h3 style={{ fontWeight: 700, marginBottom: "10px", color: C.muted, fontSize: "14px" }}>آخر العمليات</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[...filtered].reverse().slice(0, 30).map((s, i) => (
          <Card key={i} style={{ borderColor: s.isPaid ? C.green + "33" : C.red + "33" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{s.productName}</div>
                <div style={{ color: C.muted, fontSize: "11px", marginTop: "2px" }}>
                  {s.date} · الكمية: {s.qty}
                  {!s.isPaid && <span style={{ color: C.red }}> · دين: {s.debtorName}</span>}
                </div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 700, color: C.green }}>{s.total.toFixed(2)} ر.س</div>
                <div style={{ color: C.accent, fontSize: "12px" }}>ربح: {s.profit.toFixed(2)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [page, setPage] = useState("pos");
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [debts, setDebts] = useState([]);
  const [capital, setCapital] = useState(0);
  const [profit, setProfit] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Load from storage
  useEffect(() => {
    (async () => {
      const p = await loadData(KEYS.products);
      const s = await loadData(KEYS.sales);
      const d = await loadData(KEYS.debts);
      const c = await loadData(KEYS.capital);
      setProducts(p || DEFAULT_PRODUCTS);
      setSales(s || []);
      setDebts(d || []);
      setCapital(c?.capital || 0);
      setProfit(c?.profit || 0);
      setLoaded(true);
    })();
  }, []);

  // Auto-save
  useEffect(() => { if (loaded) saveData(KEYS.products, products); }, [products, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.sales, sales); }, [sales, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.debts, debts); }, [debts, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.capital, { capital, profit }); }, [capital, profit, loaded]);

  function handleSale(sale) {
    // Update stock
    setProducts(prev => prev.map(p =>
      p.id === sale.productId ? { ...p, stock: p.stock - sale.qty } : p
    ));

    // Record sale
    const saleRecord = { ...sale, rawDate: new Date().toISOString() };
    setSales(prev => [...prev, saleRecord]);

    // Update capital & profit if paid
    if (sale.isPaid) {
      setCapital(c => c + sale.buyPrice * sale.qty); // recover cost
      setProfit(p => p + sale.profit);
    }

    // Record debt if unpaid
    if (!sale.isPaid) {
      setDebts(prev => [...prev, {
        debtorName: sale.debtorName,
        productName: sale.productName,
        qty: sale.qty,
        amount: sale.total,
        date: sale.date,
        rawDate: new Date().toISOString(),
        paid: false,
        saleId: saleRecord,
      }]);
    }
  }

  function handleAddProduct(data) {
    const newId = Math.max(0, ...products.map(p => p.id)) + 1;
    setProducts(prev => [...prev, { id: newId, ...data }]);
  }

  function handleEditProduct(id, data) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }

  function handleDeleteProduct(id) {
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  function handlePayDebt(name) {
    setDebts(prev => prev.map(d => d.debtorName === name ? { ...d, paid: true } : d));
    // Add recovered amount to capital & profit
    const unpaid = debts.filter(d => d.debtorName === name && !d.paid);
    const total = unpaid.reduce((s, d) => s + d.amount, 0);
    // Find profit from sales records
    const profitAmount = sales
      .filter(s => !s.isPaid && s.debtorName === name)
      .reduce((s, x) => s + x.profit, 0);
    setCapital(c => c + (total - profitAmount));
    setProfit(p => p + profitAmount);
  }

  function handlePayPart(name, amount) {
    let remaining = amount;
    setDebts(prev => {
      const updated = [...prev];
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].debtorName === name && !updated[i].paid && remaining > 0) {
          if (remaining >= updated[i].amount) {
            remaining -= updated[i].amount;
            updated[i] = { ...updated[i], paid: true };
          } else {
            updated[i] = { ...updated[i], amount: updated[i].amount - remaining };
            remaining = 0;
          }
        }
      }
      return updated;
    });
    setCapital(c => c + amount * 0.75); // approximate
    setProfit(p => p + amount * 0.25); // approximate
  }

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.accent, fontSize: "20px", fontFamily: "Cairo" }}>
      جاري التحميل...
    </div>
  );

  return (
    <>
      <style>{css}</style>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.card}, #111118)`,
        borderBottom: `1px solid ${C.border}`,
        padding: "12px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 99,
      }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: "16px", color: C.accent }}>🏪 كاشير البسطة</div>
          <div style={{ fontSize: "11px", color: C.muted }}>رأس المال: <span style={{ color: "#a78bfa" }}>{capital.toFixed(0)} ر.س</span></div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "11px", color: C.muted }}>الربح الكلي</div>
          <div style={{ color: C.green, fontWeight: 900, fontSize: "16px" }}>{profit.toFixed(2)} ر.س</div>
        </div>
      </div>

      {/* Pages */}
      <div style={{ minHeight: "calc(100vh - 60px)" }}>
        {page === "pos" && <PosPage products={products} onSale={handleSale} />}
        {page === "products" && <ProductsPage products={products} onAdd={handleAddProduct} onEdit={handleEditProduct} onDelete={handleDeleteProduct} />}
        {page === "debts" && <DebtsPage debts={debts} onPay={handlePayDebt} onPayPart={handlePayPart} />}
        {page === "reports" && <ReportsPage sales={sales} capital={capital} profit={profit} products={products} />}
      </div>

      <Navbar page={page} setPage={setPage} capital={capital} profit={profit} />
    </>
  );
}
