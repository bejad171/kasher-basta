import { useState, useEffect, useRef } from "react";

// ─── Supabase ────────────────────────────────────────────────
const SB = "https://bznsriknwdutcjulsdkg.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bnNyaWtud2R1dGNqdWxzZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDcyOTgsImV4cCI6MjA5NTQ4MzI5OH0.DJ-NfC4wlwMcqUIumpnsUWd9pFEljifm4W8ckxU-KUk";
const H = { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` };

const api = {
  get: async (t, q = "") => {
    const r = await fetch(`${SB}/rest/v1/${t}?${q}`, { headers: H });
    if (!r.ok) return [];
    return r.json();
  },
  post: async (t, d) => {
    const r = await fetch(`${SB}/rest/v1/${t}`, {
      method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(d)
    });
    return r.json();
  },
  patch: async (t, id, d) => {
    await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`, {
      method: "PATCH", headers: H, body: JSON.stringify(d)
    });
  },
  delete: async (t, id) => {
    await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`, { method: "DELETE", headers: H });
  },
};

// ─── Helpers ─────────────────────────────────────────────────
const f = (n) => Number(n || 0).toFixed(2);
const stamp = () => new Date().toLocaleString("ar", {
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", calendar: "gregory"
});

// ─── PIN ─────────────────────────────────────────────────────
function PinScreen({ onUnlock }) {
  const [val, setVal] = useState("");
  const [shake, setShake] = useState(false);
  const PIN = "2323";

  const tap = (k) => {
    if (val.length >= 4) return;
    const nv = val + k;
    setVal(nv);
    if (nv.length === 4) {
      setTimeout(() => {
        if (nv === PIN) onUnlock();
        else { setShake(true); setTimeout(() => { setShake(false); setVal(""); }, 600); }
      }, 150);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"Cairo,sans-serif", padding:24 }}>
      <div style={{ width:80, height:80, borderRadius:"50%", background:"#e8f5e9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, marginBottom:16 }}>🚬</div>
      <div style={{ fontWeight:900, fontSize:22, color:"#1a1a2e", marginBottom:4 }}>3lewa Smoke</div>
      <div style={{ fontSize:13, color:"#888", marginBottom:36 }}>أدخل كلمة المرور</div>
      <div style={{ display:"flex", gap:16, marginBottom:12, animation: shake?"shake .5s":"none" }}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{ width:16, height:16, borderRadius:"50%", background: i<val.length ? "#1a7a4a":"#e0e0e0", transition:"all .15s" }}/>
        ))}
      </div>
      {shake && <div style={{ color:"#e53935", fontSize:12, marginBottom:8 }}>كلمة المرور خاطئة</div>}
      <div style={{ height:20, marginBottom:24 }}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,80px)", gap:10 }}>
        {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k,i)=>(
          <button key={i} onClick={()=> k==="⌫" ? setVal(v=>v.slice(0,-1)) : k ? tap(k) : null}
            style={{ height:68, borderRadius:16, border:"none", background: k?(k==="⌫"?"#ffebee":"#f8fafc"):"transparent",
              color: k==="⌫"?"#e53935":"#1a1a2e", fontSize: k==="⌫"?20:26, fontWeight:700,
              cursor: k?"pointer":"default", boxShadow: k?"0 2px 8px rgba(0,0,0,0.06)":"none", fontFamily:"Cairo,sans-serif" }}>
            {k}
          </button>
        ))}
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-10px)}75%{transform:translateX(10px)}}`}</style>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function App() {
  const [locked, setLocked] = useState(true);
  const [tab, setTab] = useState("home");
  const [customers, setCustomers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [capital, setCapital] = useState({ amount:0, profit:0 });
  const [ready, setReady] = useState(false);

  const load = async () => {
    const [c, d, s, p, cap] = await Promise.all([
      api.get("customers","order=name"),
      api.get("debts","order=raw_date.desc"),
      api.get("sales","order=raw_date.desc&limit=200"),
      api.get("products","order=name"),
      api.get("capital","id=eq.1"),
    ]);
    setCustomers(Array.isArray(c)?c:[]);
    setDebts(Array.isArray(d)?d:[]);
    setSales(Array.isArray(s)?s:[]);
    setProducts(Array.isArray(p)?p:[]);
    setCapital(Array.isArray(cap)&&cap[0]?cap[0]:{amount:0,profit:0});
    setReady(true);
  };

  useEffect(()=>{ load(); },[]);

  if (!ready) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Cairo", flexDirection:"column", gap:12, background:"#fff" }}>
      <div style={{ fontSize:48 }}>🚬</div>
      <div style={{ color:"#888" }}>جاري التحميل...</div>
    </div>
  );

  if (locked) return <PinScreen onUnlock={()=>setLocked(false)} />;

  // customer debt helpers
  const getDebt = (cid, cname) => debts.filter(d=>Number(d.customer_id)===Number(cid)||d.customer_name===cname).filter(d=>!d.paid).reduce((a,d)=>a+Number(d.amount),0);
  const getPaid = (cid, cname) => debts.filter(d=>Number(d.customer_id)===Number(cid)||d.customer_name===cname).filter(d=>d.paid).reduce((a,d)=>a+Number(d.amount),0);
  const getAll  = (cid, cname) => debts.filter(d=>Number(d.customer_id)===Number(cid)||d.customer_name===cname);

  const ctx = { customers, setCustomers, debts, setDebts, sales, setSales, products, setProducts, capital, setCapital, load, getDebt, getPaid, getAll, setLocked };

  return (
    <div style={{ fontFamily:"Cairo,sans-serif", direction:"rtl", background:"#f5f7fa", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#f5f7fa;font-family:Cairo,sans-serif;}
        button,input,select,textarea{font-family:Cairo,sans-serif;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px;}
        .page{padding:16px;padding-bottom:85px;}
        .card{background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,0.06);}
        .hdr{background:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:99;border-bottom:1px solid #f0f4f8;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
        .btn{border:none;border-radius:12px;padding:12px 18px;font-weight:700;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;justify-content:center;transition:opacity .15s;font-family:Cairo,sans-serif;}
        .btn:active{opacity:.8;}
        .btn-g{background:#1a7a4a;color:#fff;}
        .btn-r{background:#e53935;color:#fff;}
        .btn-b{background:#1976d2;color:#fff;}
        .btn-o{background:#f57c00;color:#fff;}
        .btn-k{background:#1a1a2e;color:#fff;}
        .btn-gray{background:#f0f4f8;color:#555;}
        .inp{background:#f8fafc;border:1.5px solid #e5e9ef;border-radius:12px;padding:11px 14px;font-size:14px;width:100%;outline:none;color:#1a1a2e;direction:rtl;}
        .inp:focus{border-color:#1a7a4a;}
        .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;}
        .bg{background:rgba(0,0,0,.45);position:fixed;inset:0;z-index:200;display:flex;align-items:flex-end;}
        .sheet{background:#fff;width:100%;border-radius:24px 24px 0 0;padding:20px;max-height:90vh;overflow-y:auto;}
        .handle{width:40px;height:4px;background:#e5e9ef;border-radius:2px;margin:0 auto 16px;}
        .nav{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #f0f4f8;display:flex;z-index:100;box-shadow:0 -4px 16px rgba(0,0,0,.06);}
        .nb{flex:1;padding:10px 0 8px;border:none;background:transparent;cursor:pointer;font-size:10px;color:#aaa;display:flex;flex-direction:column;align-items:center;gap:3px;border-top:2px solid transparent;font-family:Cairo,sans-serif;font-weight:600;}
        .nb.on{color:#1a7a4a;border-top-color:#1a7a4a;}
        .row{display:flex;gap:10px;align-items:center;}
        .col{display:flex;flex-direction:column;gap:10px;}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
        .fab{position:fixed;bottom:76px;left:16px;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#1a7a4a,#0d5c38);color:#fff;font-size:26px;border:none;box-shadow:0 4px 16px rgba(26,122,74,.4);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:98;}
        .tx{background:#fff;border-radius:14px;padding:14px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.04);border-right:4px solid transparent;}
        .chip{padding:8px 14px;border-radius:20px;border:1.5px solid #e5e9ef;background:#fff;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:Cairo,sans-serif;}
        .chip.on{background:#1a7a4a;color:#fff;border-color:#1a7a4a;}
      `}</style>

      {tab==="home"      && <HomePage      {...ctx} goTo={setTab} />}
      {tab==="debts"     && <DebtsPage     {...ctx} />}
      {tab==="pos"       && <PosPage       {...ctx} />}
      {tab==="inventory" && <InventoryPage {...ctx} />}
      {tab==="reports"   && <ReportsPage   {...ctx} />}
      {tab==="settings"  && <SettingsPage  {...ctx} />}

      <nav className="nav">
        {[
          {k:"home",icon:"🏠",label:"الرئيسية"},
          {k:"pos",icon:"🛒",label:"الكاشير"},
          {k:"debts",icon:"👥",label:"الديون"},
          {k:"inventory",icon:"📦",label:"المخزون"},
          {k:"reports",icon:"📊",label:"التقارير"},
        ].map(t=>(
          <button key={t.k} className={`nb ${tab===t.k?"on":""}`} onClick={()=>setTab(t.k)}>
            <span style={{fontSize:22}}>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HOME
// ══════════════════════════════════════════════════════════════
function HomePage({ customers, debts, sales, products, capital, getDebt, goTo, setLocked }) {
  const todaySales = sales.filter(s=>new Date(s.raw_date).toDateString()===new Date().toDateString());
  const todayRev   = todaySales.reduce((a,s)=>a+Number(s.total),0);
  const todayProfit= todaySales.reduce((a,s)=>a+Number(s.profit),0);
  const totalDebt  = customers.reduce((a,c)=>a+getDebt(c.id,c.name),0);
  const overLimit  = customers.filter(c=>getDebt(c.id,c.name)>Number(c.credit_limit||500)).length;
  const lowStock   = products.filter(p=>Number(p.stock)<10);

  return <>
    <div className="hdr">
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>setLocked(true)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22}}>🔒</button>
        <button onClick={()=>goTo("settings")} style={{background:"none",border:"none",cursor:"pointer",fontSize:22}}>⚙️</button>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontWeight:900,fontSize:16}}>3lewa Smoke 🚬</div>
        <div style={{fontSize:11,color:"#888"}}>نظام إدارة المبيعات والديون</div>
      </div>
      <div style={{width:60}}/>
    </div>
    <div className="page">
      {/* Main stats card */}
      <div className="card" style={{marginBottom:12,background:"linear-gradient(135deg,#1a7a4a,#0d5c38)",color:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div>
            <div style={{fontSize:12,opacity:.8}}>مبيعات اليوم</div>
            <div style={{fontSize:28,fontWeight:900}}>₪{f(todayRev)}</div>
          </div>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:12,opacity:.8}}>ربح اليوم</div>
            <div style={{fontSize:28,fontWeight:900}}>₪{f(todayProfit)}</div>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",background:"rgba(255,255,255,.15)",borderRadius:12,padding:"10px 14px"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,opacity:.8}}>ديون الزباين</div>
            <div style={{fontWeight:900,fontSize:15,color:"#ffcc80"}}>₪{f(totalDebt)}</div>
          </div>
          <div style={{width:1,background:"rgba(255,255,255,.2)"}}/>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,opacity:.8}}>عدد الزباين</div>
            <div style={{fontWeight:900,fontSize:15}}>{customers.length}</div>
          </div>
          <div style={{width:1,background:"rgba(255,255,255,.2)"}}/>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,opacity:.8}}>تجاوز الحد</div>
            <div style={{fontWeight:900,fontSize:15,color:"#ff8a80"}}>{overLimit}</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="g2" style={{marginBottom:12}}>
        {[
          {icon:"➕",label:"دين جديد",color:"#ffebee",tc:"#e53935",go:"debts"},
          {icon:"👤",label:"زبون جديد",color:"#e3f2fd",tc:"#1976d2",go:"debts"},
          {icon:"🛒",label:"كاشير",color:"#e8f5e9",tc:"#1a7a4a",go:"pos"},
          {icon:"📊",label:"التقارير",color:"#fff3e0",tc:"#f57c00",go:"reports"},
        ].map((a,i)=>(
          <button key={i} onClick={()=>goTo(a.go)} style={{background:a.color,border:"none",borderRadius:16,padding:"18px 0",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <span style={{fontSize:30}}>{a.icon}</span>
            <span style={{fontSize:13,fontWeight:700,color:a.tc,fontFamily:"Cairo"}}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Low stock warning */}
      {lowStock.length>0 && (
        <div className="card" style={{marginBottom:12,borderRight:"4px solid #f57c00"}}>
          <div style={{fontWeight:700,color:"#f57c00",marginBottom:8}}>⚠️ مخزون منخفض</div>
          {lowStock.map(p=>(
            <div key={p.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid #f5f7fa"}}>
              <span>{p.name}</span>
              <span style={{color:"#e53935",fontWeight:700}}>{p.stock} {p.unit}</span>
            </div>
          ))}
        </div>
      )}

      {/* Last 6 transactions */}
      <div style={{fontWeight:900,fontSize:15,marginBottom:10}}>آخر الحركات</div>
      {sales.slice(0,6).map((s,i)=>(
        <div key={i} className="tx" style={{borderRightColor:s.is_paid?"#1a7a4a":"#e53935"}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{s.product_name}</div>
              <div style={{fontSize:11,color:"#aaa",marginTop:2}}>{s.date}{!s.is_paid&&<span style={{color:"#e53935"}}> · {s.customer_name}</span>}</div>
            </div>
            <div style={{textAlign:"left"}}>
              <div style={{fontWeight:900,color:"#1a7a4a"}}>₪{f(s.total)}</div>
              <span className="badge" style={{background:s.is_paid?"#e8f5e9":"#ffebee",color:s.is_paid?"#1a7a4a":"#e53935"}}>{s.is_paid?"نقدي":"دين"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>;
}

// ══════════════════════════════════════════════════════════════
// DEBTS
// ══════════════════════════════════════════════════════════════
function DebtsPage({ customers, debts, capital, load, getDebt, getPaid, getAll }) {
  const [view, setView]         = useState("list"); // list | detail
  const [selId, setSelId]       = useState(null);
  const [search, setSearch]     = useState("");
  const [showAddC, setShowAddC] = useState(false);
  const [showAddD, setShowAddD] = useState(false);
  const [showPay, setShowPay]   = useState(false);
  const [loading, setLoading]   = useState(false);

  // forms
  const [cForm, setCForm] = useState({ name:"", phone:"", credit_limit:"500" });
  const [dForm, setDForm] = useState({ amount:"", note:"" });
  const [payAmt, setPayAmt] = useState("");

  const customer  = customers.find(c=>c.id===selId);
  const cDebts    = customer ? getAll(customer.id, customer.name) : [];
  const pending   = customer ? getDebt(customer.id, customer.name) : 0;
  const paid      = customer ? getPaid(customer.id, customer.name) : 0;
  const lastPay   = cDebts.filter(d=>d.paid).sort((a,b)=>new Date(b.raw_date)-new Date(a.raw_date))[0];

  const totalDebt = customers.reduce((a,c)=>a+getDebt(c.id,c.name),0);
  const overLimitCount = customers.filter(c=>getDebt(c.id,c.name)>Number(c.credit_limit||500)).length;

  const sorted = [...customers]
    .sort((a,b)=>a.name.localeCompare(b.name,"ar"))
    .filter(c=>c.name.includes(search)||(c.phone||"").includes(search));

  // ── Add customer ──
  async function addCustomer() {
    if (!cForm.name.trim()) return;
    setLoading(true);
    await api.post("customers",{ name:cForm.name.trim(), phone:cForm.phone, credit_limit:+cForm.credit_limit||500, balance:0 });
    await load();
    setCForm({name:"",phone:"",credit_limit:"500"});
    setShowAddC(false);
    setLoading(false);
  }

  // ── Add debt ──
  async function addDebt() {
    if (!dForm.amount||!customer) return;
    setLoading(true);
    await api.post("debts",{
      customer_id: customer.id,
      customer_name: customer.name,
      product_name: dForm.note||"دين مباشر",
      qty: 1,
      amount: +dForm.amount,
      date: stamp(),
      raw_date: new Date().toISOString(),
      paid: false,
    });
    await api.patch("customers", customer.id, { balance: pending + +dForm.amount });
    await load();
    setDForm({amount:"",note:""});
    setShowAddD(false);
    setLoading(false);
  }

  // ── Pay partial ──
  async function payPart() {
    const amt = +payAmt;
    if (!amt||amt<=0||!customer) return;
    setLoading(true);
    let rem = amt;
    const unpaid = cDebts.filter(d=>!d.paid).sort((a,b)=>a.id-b.id);
    for (const d of unpaid) {
      if (rem<=0) break;
      if (rem>=Number(d.amount)) { await api.patch("debts",d.id,{paid:true}); rem-=Number(d.amount); }
      else { await api.patch("debts",d.id,{amount:Number(d.amount)-rem}); rem=0; }
    }
    await api.patch("customers",customer.id,{balance:Math.max(0,pending-amt)});
    await load();
    setPayAmt("");
    setShowPay(false);
    setLoading(false);
  }

  // ── Pay all ──
  async function payAll() {
    if (!confirm(`سداد كامل الدين (₪${f(pending)}) من ${customer?.name}؟`)) return;
    setLoading(true);
    const unpaid = cDebts.filter(d=>!d.paid);
    for (const d of unpaid) await api.patch("debts",d.id,{paid:true});
    await api.patch("customers",customer.id,{balance:0});
    await load();
    setLoading(false);
  }

  // ── Delete customer ──
  async function deleteCustomer() {
    if (!confirm(`حذف ${customer?.name}؟ سيتم حذف جميع ديونه`)) return;
    setLoading(true);
    // delete all debts for this customer
    const all = cDebts;
    for (const d of all) await api.delete("debts",d.id);
    await api.delete("customers",customer.id);
    await load();
    setView("list");
    setLoading(false);
  }

  // ── Export ──
  function exportCustomer() {
    const lines = [
      `كشف حساب - ${customer?.name}`,
      `الهاتف: ${customer?.phone||"—"}`,
      `الحد الائتماني: ₪${f(customer?.credit_limit||500)}`,
      `الرصيد الحالي: ₪${f(pending)}`,
      `إجمالي الديون: ₪${f(pending+paid)}`,
      `إجمالي السداد: ₪${f(paid)}`,
      `آخر دفعة: ${lastPay?.date||"—"}`,
      "──────────────────",
      "سجل الحركات:",
      ...cDebts.map(d=>`${d.date} | ${d.product_name} | ₪${f(d.amount)} | ${d.paid?"مسدد":"دين"}`),
    ].join("\n");
    if (navigator.share) navigator.share({title:"كشف حساب",text:lines});
    else { navigator.clipboard?.writeText(lines); alert("تم نسخ الكشف!"); }
  }

  // ─────────────────── DETAIL VIEW ────────────────────────────
  if (view==="detail"&&customer) return <>
    <div className="hdr">
      <button onClick={()=>{setView("list");setSelId(null);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#555",fontFamily:"Cairo"}}>← رجوع</button>
      <div style={{fontWeight:900,fontSize:16}}>{customer.name}</div>
      <button onClick={deleteCustomer} style={{background:"#ffebee",border:"none",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:13,color:"#e53935",fontFamily:"Cairo"}}>🗑️ حذف</button>
    </div>
    <div className="page">
      {/* Profile card */}
      <div className="card" style={{marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"#e8f5e9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#1a7a4a"}}>
            {customer.name[0]}
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:17}}>{customer.name}</div>
            {customer.phone&&<div style={{fontSize:13,color:"#888",marginTop:2}}>📞 {customer.phone}</div>}
            <div style={{marginTop:4,display:"flex",gap:6,flexWrap:"wrap"}}>
              <span className="badge" style={{background:"#e3f2fd",color:"#1976d2"}}>الحد: ₪{f(customer.credit_limit||500)}</span>
              {pending>Number(customer.credit_limit||500)&&<span className="badge" style={{background:"#fff3e0",color:"#f57c00"}}>⚠️ تجاوز الحد</span>}
            </div>
          </div>
        </div>
        <div className="g2">
          <div style={{background:"#ffebee",borderRadius:12,padding:12,textAlign:"center"}}>
            <div style={{fontSize:11,color:"#888"}}>الرصيد الحالي</div>
            <div style={{fontSize:22,fontWeight:900,color:"#e53935"}}>₪{f(pending)}</div>
          </div>
          <div style={{background:"#e8f5e9",borderRadius:12,padding:12,textAlign:"center"}}>
            <div style={{fontSize:11,color:"#888"}}>إجمالي السداد</div>
            <div style={{fontSize:22,fontWeight:900,color:"#1a7a4a"}}>₪{f(paid)}</div>
          </div>
          <div style={{background:"#f5f7fa",borderRadius:12,padding:12,textAlign:"center"}}>
            <div style={{fontSize:11,color:"#888"}}>إجمالي الديون</div>
            <div style={{fontSize:22,fontWeight:900,color:"#1976d2"}}>₪{f(pending+paid)}</div>
          </div>
          <div style={{background:"#f5f7fa",borderRadius:12,padding:12,textAlign:"center"}}>
            <div style={{fontSize:11,color:"#888"}}>آخر دفعة</div>
            <div style={{fontSize:12,fontWeight:700,color:"#555"}}>{lastPay?.date||"—"}</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="g2" style={{marginBottom:12}}>
        <button className="btn btn-g" onClick={()=>setShowPay(true)} disabled={pending===0}>💰 تسجيل سداد</button>
        <button className="btn btn-r" onClick={()=>setShowAddD(true)}>➕ تسجيل دين</button>
        <button className="btn btn-k" onClick={exportCustomer}>📤 تصدير</button>
        <button className="btn btn-b" onClick={()=>{/* TODO: invoice */}}>📄 فاتورة</button>
      </div>

      {/* Transaction history */}
      <div style={{fontWeight:900,fontSize:15,marginBottom:10}}>سجل الحركات</div>
      {cDebts.length===0&&<div className="card" style={{textAlign:"center",color:"#aaa",padding:24}}>لا توجد حركات بعد</div>}
      {[...cDebts].sort((a,b)=>new Date(b.raw_date)-new Date(a.raw_date)).map((d,i)=>(
        <div key={i} className="tx" style={{borderRightColor:d.paid?"#1a7a4a":"#e53935"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14}}>{d.product_name}</div>
              <div style={{fontSize:11,color:"#aaa",marginTop:2}}>{d.date}</div>
            </div>
            <div style={{textAlign:"left"}}>
              <div style={{fontWeight:900,fontSize:16,color:d.paid?"#1a7a4a":"#e53935"}}>₪{f(d.amount)}</div>
              <span className="badge" style={{background:d.paid?"#e8f5e9":"#ffebee",color:d.paid?"#1a7a4a":"#e53935"}}>{d.paid?"✅ مسدد":"⏳ دين"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Pay sheet */}
    {showPay&&<div className="bg" onClick={()=>setShowPay(false)}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="handle"/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:16}}>💰 تسجيل دفعة</div>
        <div style={{background:"#f5f7fa",borderRadius:12,padding:12,marginBottom:14,textAlign:"center"}}>
          <div style={{fontSize:12,color:"#888"}}>المبلغ المتبقي</div>
          <div style={{fontSize:24,fontWeight:900,color:"#e53935"}}>₪{f(pending)}</div>
        </div>
        <div className="col">
          <input className="inp" type="number" value={payAmt} onChange={e=>setPayAmt(e.target.value)} placeholder="أدخل المبلغ ₪"/>
          <button className="btn btn-g" style={{width:"100%"}} onClick={payPart} disabled={loading||!payAmt}>
            {loading?"⏳...":"✅ تسجيل الدفعة"}
          </button>
          <button className="btn btn-r" style={{width:"100%"}} onClick={payAll} disabled={loading}>
            {loading?"⏳...":`سداد كامل ₪${f(pending)}`}
          </button>
        </div>
      </div>
    </div>}

    {/* Add debt sheet */}
    {showAddD&&<div className="bg" onClick={()=>setShowAddD(false)}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="handle"/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:16}}>➕ تسجيل دين على {customer.name}</div>
        <div className="col">
          <input className="inp" type="number" value={dForm.amount} onChange={e=>setDForm(f=>({...f,amount:e.target.value}))} placeholder="المبلغ ₪"/>
          <input className="inp" value={dForm.note} onChange={e=>setDForm(f=>({...f,note:e.target.value}))} placeholder="الملاحظة (اختياري)"/>
          <button className="btn btn-r" style={{width:"100%"}} onClick={addDebt} disabled={loading||!dForm.amount}>
            {loading?"⏳...":"✅ تسجيل الدين"}
          </button>
        </div>
      </div>
    </div>}
  </>;

  // ─────────────────── LIST VIEW ───────────────────────────────
  return <>
    <div className="hdr">
      <div style={{fontWeight:900,fontSize:18}}>👥 حسابات الديون</div>
      <div style={{fontWeight:700,fontSize:14,color:"#e53935"}}>₪{f(totalDebt)}</div>
    </div>
    <div className="page">
      {/* Summary */}
      <div className="card" style={{marginBottom:12,background:"linear-gradient(135deg,#1976d2,#1565c0)",color:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-around"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,opacity:.8}}>مجموع عليه</div>
            <div style={{fontSize:20,fontWeight:900,color:"#ff8a80"}}>₪{f(totalDebt)}</div>
          </div>
          <div style={{width:1,background:"rgba(255,255,255,.2)"}}/>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,opacity:.8}}>عدد الحسابات</div>
            <div style={{fontSize:20,fontWeight:900}}>{customers.length}</div>
          </div>
          <div style={{width:1,background:"rgba(255,255,255,.2)"}}/>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,opacity:.8}}>تجاوز الحد</div>
            <div style={{fontSize:20,fontWeight:900,color:"#ffcc80"}}>{overLimitCount}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input className="inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 ابحث بالاسم أو الهاتف..." style={{flex:1}}/>
        <button className="btn btn-g" style={{padding:"10px 14px"}} onClick={()=>setShowAddC(true)}>+ إضافة</button>
      </div>

      {/* Customer list */}
      {sorted.length===0&&<div className="card" style={{textAlign:"center",color:"#aaa",padding:30}}>لا يوجد زباين</div>}
      <div className="col">
        {sorted.map(c=>{
          const bal = getDebt(c.id,c.name);
          const over = bal>Number(c.credit_limit||500);
          return (
            <div key={c.id} className="card" style={{cursor:"pointer",borderRight:`4px solid ${bal>0?over?"#f57c00":"#e53935":"#1a7a4a"}`}}
              onClick={()=>{setSelId(c.id);setView("detail");}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:46,height:46,borderRadius:"50%",background:"#e8f5e9",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:"#1a7a4a",flexShrink:0}}>
                    {c.name[0]}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:15}}>{c.name}</div>
                    {c.phone&&<div style={{fontSize:12,color:"#888"}}>{c.phone}</div>}
                    <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}>
                      <span className="badge" style={{background:"#e3f2fd",color:"#1976d2",fontSize:10}}>الحد: ₪{f(c.credit_limit||500)}</span>
                      {over&&<span className="badge" style={{background:"#fff3e0",color:"#f57c00",fontSize:10}}>⚠️ تجاوز الحد</span>}
                    </div>
                  </div>
                </div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontWeight:900,fontSize:16,color:bal>0?"#e53935":"#1a7a4a"}}>
                    {bal>0?`₪${f(bal)}`:"✅ مسدد"}
                  </div>
                  <div style={{fontSize:11,color:"#aaa"}}>رصيد الزبون</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* FAB */}
    <button className="fab" onClick={()=>setShowAddC(true)}>+</button>

    {/* Add customer sheet */}
    {showAddC&&<div className="bg" onClick={()=>setShowAddC(false)}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="handle"/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:16}}>👤 إضافة زبون جديد</div>
        <div className="col">
          <input className="inp" value={cForm.name} onChange={e=>setCForm(f=>({...f,name:e.target.value}))} placeholder="اسم الزبون *"/>
          <input className="inp" type="tel" value={cForm.phone} onChange={e=>setCForm(f=>({...f,phone:e.target.value}))} placeholder="رقم الهاتف (اختياري)"/>
          <input className="inp" type="number" value={cForm.credit_limit} onChange={e=>setCForm(f=>({...f,credit_limit:e.target.value}))} placeholder="الحد الائتماني ₪"/>
          <button className="btn btn-g" style={{width:"100%"}} onClick={addCustomer} disabled={loading||!cForm.name.trim()}>
            {loading?"⏳...":"✅ إضافة الزبون"}
          </button>
        </div>
      </div>
    </div>}
  </>;
}

// ══════════════════════════════════════════════════════════════
// POS
// ══════════════════════════════════════════════════════════════
function PosPage({ products, customers, capital, load }) {
  const [cart, setCart]         = useState([]);
  const [search, setSearch]     = useState("");
  const [cat, setCat]           = useState("الكل");
  const [checkout, setCheckout] = useState(false);
  const [paid, setPaid]         = useState(true);
  const [custId, setCustId]     = useState("");
  const [wafaP, setWafaP]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const cats = ["الكل",...new Set(products.map(p=>p.category).filter(Boolean))];
  const list = products.filter(p=>(cat==="الكل"||p.category===cat)&&(!search||p.name.includes(search)));

  const total   = cart.reduce((a,i)=>a+i.lt,0);
  const profit  = cart.reduce((a,i)=>a+i.lp,0);

  function add(p, qty=1, type="unit") {
    const up = type==="cigarette" ? p.sell_price/3 : p.sell_price;
    const uc = type==="cigarette" ? p.buy_price/3  : p.buy_price;
    const gu = type==="cigarette" ? qty/3 : qty;
    setCart(c=>{
      const idx = c.findIndex(x=>x.id===p.id&&x.type===type);
      if (idx>=0) {
        const u=[...c]; u[idx]={...u[idx],qty:u[idx].qty+qty,gu:u[idx].gu+gu,lt:u[idx].lt+up*qty,lp:u[idx].lp+(up-uc)*qty};
        return u;
      }
      return [...c,{...p,qty,type,gu,lt:up*qty,lp:(up-uc)*qty,up}];
    });
    setWafaP(null);
  }

  function remove(i) { setCart(c=>c.filter((_,x)=>x!==i)); }

  async function confirm() {
    if (!paid&&!custId) { alert("اختر الزبون"); return; }
    const customer = customers.find(c=>c.id===+custId);
    for (const item of cart) {
      if (Number(item.stock)<item.gu) { alert(`مخزون ${item.name} غير كافٍ`); return; }
    }
    setLoading(true);
    for (const item of cart) {
      await api.post("sales",{
        product_id:item.id, product_name:item.name, qty:item.qty,
        sale_type:item.type, sell_price:item.sell_price, buy_price:item.buy_price,
        total:item.lt, profit:item.lp, is_paid:paid,
        customer_name:customer?.name||"", customer_id:customer?.id||null,
        date:stamp(), raw_date:new Date().toISOString(),
      });
      await api.patch("products",item.id,{stock:Number(item.stock)-item.gu});
      if (!paid&&customer) {
        await api.post("debts",{
          customer_id:customer.id, customer_name:customer.name,
          product_name:item.name, qty:item.qty,
          amount:item.lt, date:stamp(), raw_date:new Date().toISOString(), paid:false,
        });
        await api.patch("customers",customer.id,{balance:(Number(customer.balance)||0)+item.lt});
      } else if (paid) {
        await api.patch("capital",1,{
          amount:Number(capital.amount)+item.buy_price*item.gu,
          profit:Number(capital.profit)+item.lp,
        });
      }
    }
    await load();
    setCart([]); setCheckout(false); setPaid(true); setCustId(""); setLoading(false);
    alert("✅ تم تسجيل البيعة!");
  }

  return <>
    <div className="hdr">
      <div style={{fontWeight:900,fontSize:18}}>🛒 الكاشير</div>
      {cart.length>0&&<button className="btn btn-g" style={{padding:"8px 14px"}} onClick={()=>setCheckout(true)}>إتمام البيع ({cart.length})</button>}
    </div>
    <div className="page">
      <input className="inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 ابحث عن صنف..." style={{marginBottom:12}}/>
      <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:14,paddingBottom:4}}>
        {cats.map(c=><button key={c} className={`chip ${cat===c?"on":""}`} onClick={()=>setCat(c)}>{c}</button>)}
      </div>

      {cart.length>0&&(
        <div className="card" style={{marginBottom:14,borderRight:"4px solid #1a7a4a"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontWeight:700}}>
            <span>🛒 السلة ({cart.length})</span>
            <span style={{color:"#1a7a4a",fontWeight:900}}>₪{f(total)}</span>
          </div>
          {cart.map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<cart.length-1?"1px solid #f5f7fa":"none"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{item.name}</div>
                <div style={{fontSize:11,color:"#888"}}>{item.qty} × ₪{f(item.up)} {item.type==="cigarette"?"(سيجارة)":""}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontWeight:700,color:"#1a7a4a"}}>₪{f(item.lt)}</span>
                <button onClick={()=>remove(i)} style={{background:"#ffebee",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:14,color:"#e53935"}}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="g2">
        {list.map(p=>(
          <div key={p.id} style={{background:"#fff",borderRadius:16,border:"1.5px solid #e5e9ef",padding:"14px 10px",textAlign:"center",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}
            onClick={()=>p.is_wafa?setWafaP(p):add(p)}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{p.name}</div>
            {p.is_wafa&&<span className="badge" style={{background:"#fff3e0",color:"#f57c00",marginBottom:4,fontSize:10,display:"block"}}>دخان ضفة</span>}
            <div style={{color:"#1a7a4a",fontWeight:900,fontSize:16}}>₪{p.sell_price}</div>
            <div style={{fontSize:11,color:Number(p.stock)<10?"#e53935":"#888",marginTop:3}}>{p.stock} {p.unit}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Wafa type modal */}
    {wafaP&&<div className="bg" onClick={()=>setWafaP(null)}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="handle"/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:16}}>طريقة بيع {wafaP.name}</div>
        <div className="g2">
          <button className="btn btn-g" style={{padding:20,flexDirection:"column",gap:8,height:"auto"}} onClick={()=>add(wafaP,1,"gram")}>
            <span style={{fontSize:32}}>⚖️</span><span>بالجرام</span>
            <span style={{fontSize:12,opacity:.8}}>₪{wafaP.sell_price}/جرام</span>
          </button>
          <button className="btn btn-o" style={{padding:20,flexDirection:"column",gap:8,height:"auto"}} onClick={()=>add(wafaP,1,"cigarette")}>
            <span style={{fontSize:32}}>🚬</span><span>بالسيجارة</span>
            <span style={{fontSize:12,opacity:.8}}>كل 3 = جرام</span>
          </button>
        </div>
      </div>
    </div>}

    {/* Checkout */}
    {checkout&&<div className="bg">
      <div className="sheet">
        <div className="handle"/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:16}}>إتمام البيع</div>
        <div className="card" style={{marginBottom:14,background:"#f8fafc"}}>
          {cart.map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<cart.length-1?"1px solid #eee":"none",fontSize:14}}>
              <span>{item.name} × {item.qty}</span>
              <span style={{fontWeight:700}}>₪{f(item.lt)}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10,fontWeight:900,fontSize:18}}>
            <span>الإجمالي</span>
            <span style={{color:"#1a7a4a"}}>₪{f(total)}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <button onClick={()=>setPaid(true)} style={{flex:1,padding:16,borderRadius:14,border:`2px solid ${paid?"#1a7a4a":"#eee"}`,background:paid?"#e8f5e9":"#fff",color:paid?"#1a7a4a":"#555",fontWeight:700,cursor:"pointer",fontFamily:"Cairo"}}>💵 نقداً</button>
          <button onClick={()=>setPaid(false)} style={{flex:1,padding:16,borderRadius:14,border:`2px solid ${!paid?"#e53935":"#eee"}`,background:!paid?"#ffebee":"#fff",color:!paid?"#e53935":"#555",fontWeight:700,cursor:"pointer",fontFamily:"Cairo"}}>📋 دين</button>
        </div>
        {!paid&&(
          <select className="inp" value={custId} onChange={e=>setCustId(e.target.value)} style={{marginBottom:14}}>
            <option value="">— اختر الزبون —</option>
            {[...customers].sort((a,b)=>a.name.localeCompare(b.name,"ar")).map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-gray" style={{flex:1}} onClick={()=>setCheckout(false)}>إلغاء</button>
          <button className="btn btn-g" style={{flex:2}} onClick={confirm} disabled={loading}>
            {loading?"⏳...":"✅ تأكيد البيع"}
          </button>
        </div>
      </div>
    </div>}
  </>;
}

// ══════════════════════════════════════════════════════════════
// INVENTORY
// ══════════════════════════════════════════════════════════════
function InventoryPage({ products, load }) {
  const [view, setView]   = useState("list");
  const [editId, setEditId] = useState(null);
  const [cat, setCat]     = useState("الكل");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm]   = useState({ name:"", category:"سجائر", unit:"علبة", buy_price:"", sell_price:"", stock:"", is_wafa:false });

  const cats = ["الكل",...new Set(products.map(p=>p.category).filter(Boolean))];
  const list = products.filter(p=>(cat==="الكل"||p.category===cat)&&(!search||p.name.includes(search)));
  const totalBuy  = products.reduce((a,p)=>a+Number(p.buy_price)*Number(p.stock),0);
  const totalSell = products.reduce((a,p)=>a+Number(p.sell_price)*Number(p.stock),0);

  async function save() {
    if (!form.name||!form.sell_price) { alert("أكمل الحقول"); return; }
    setLoading(true);
    const d = { name:form.name, category:form.category, unit:form.unit, buy_price:+form.buy_price, sell_price:+form.sell_price, stock:+form.stock, is_wafa:form.is_wafa };
    if (editId) await api.patch("products",editId,d);
    else await api.post("products",d);
    await load();
    setLoading(false);
    setView("list");
    setEditId(null);
  }

  async function addStock(p) {
    const n = prompt(`إضافة مخزون لـ ${p.name} (حالي: ${p.stock})`);
    if (!n||isNaN(+n)) return;
    await api.patch("products",p.id,{stock:Number(p.stock)+(+n)});
    await load();
  }

  async function deleteProduct(p) {
    if (!confirm(`حذف ${p.name}؟`)) return;
    await api.delete("products",p.id);
    await load();
  }

  if (view!=="list") return <>
    <div className="hdr">
      <button onClick={()=>{setView("list");setEditId(null);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#555",fontFamily:"Cairo"}}>← رجوع</button>
      <div style={{fontWeight:900}}>{editId?"تعديل صنف":"صنف جديد"}</div>
      <div style={{width:40}}/>
    </div>
    <div className="page">
      <div className="card col">
        <div className="col"><label style={{fontSize:12,color:"#666"}}>الاسم *</label><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="اسم الصنف"/></div>
        <div className="col"><label style={{fontSize:12,color:"#666"}}>التصنيف</label>
          <select className="inp" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
            {["سجائر","ضفة","معسل","ورق","إكسسوار","أخرى"].map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="col"><label style={{fontSize:12,color:"#666"}}>الوحدة</label>
          <select className="inp" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
            {["علبة","جرام","قطعة","دفتر","كرتون","زجاجة"].map(u=><option key={u}>{u}</option>)}
          </select>
        </div>
        <div className="g2">
          <div className="col"><label style={{fontSize:12,color:"#666"}}>سعر الشراء ₪</label><input className="inp" type="number" value={form.buy_price} onChange={e=>setForm(f=>({...f,buy_price:e.target.value}))}/></div>
          <div className="col"><label style={{fontSize:12,color:"#666"}}>سعر البيع ₪ *</label><input className="inp" type="number" value={form.sell_price} onChange={e=>setForm(f=>({...f,sell_price:e.target.value}))}/></div>
        </div>
        <div className="col"><label style={{fontSize:12,color:"#666"}}>الكمية</label><input className="inp" type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/></div>
        <label style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0"}}>
          <input type="checkbox" checked={form.is_wafa} onChange={e=>setForm(f=>({...f,is_wafa:e.target.checked}))} style={{width:18,height:18}}/>
          <span style={{fontWeight:600,fontSize:14}}>دخان ضفة (يُباع بالجرام/سيجارة)</span>
        </label>
        <button className="btn btn-g" onClick={save} disabled={loading}>{loading?"⏳...":"💾 حفظ"}</button>
      </div>
    </div>
  </>;

  return <>
    <div className="hdr">
      <div style={{fontWeight:900,fontSize:18}}>📦 المخزون</div>
      <button className="btn btn-g" style={{padding:"8px 14px",fontSize:13}} onClick={()=>{setForm({name:"",category:"سجائر",unit:"علبة",buy_price:"",sell_price:"",stock:"",is_wafa:false});setView("add");}}>+ إضافة</button>
    </div>
    <div className="page">
      <div className="g2" style={{marginBottom:12}}>
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:11,color:"#888"}}>رصيد بسعر الجملة</div>
          <div style={{fontSize:18,fontWeight:900,color:"#1976d2"}}>₪{f(totalBuy)}</div>
        </div>
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:11,color:"#888"}}>الأرباح المتوقعة</div>
          <div style={{fontSize:18,fontWeight:900,color:"#1a7a4a"}}>₪{f(totalSell-totalBuy)}</div>
        </div>
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:11,color:"#888"}}>رصيد بسعر البيع</div>
          <div style={{fontSize:18,fontWeight:900,color:"#f57c00"}}>₪{f(totalSell)}</div>
        </div>
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:11,color:"#888"}}>عدد الأصناف</div>
          <div style={{fontSize:18,fontWeight:900,color:"#555"}}>{products.length}</div>
        </div>
      </div>

      <input className="inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 ابحث..." style={{marginBottom:12}}/>
      <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:14,paddingBottom:4}}>
        {cats.map(c=><button key={c} className={`chip ${cat===c?"on":""}`} onClick={()=>setCat(c)}>{c}</button>)}
      </div>

      <div className="col">
        {list.map(p=>(
          <div key={p.id} className="card" style={{borderRight:`4px solid ${Number(p.stock)<10?"#e53935":"#e5e9ef"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:15}}>{p.name}</span>
                  {p.is_wafa&&<span className="badge" style={{background:"#fff3e0",color:"#f57c00"}}>ضفة</span>}
                  {p.category&&<span className="badge" style={{background:"#e3f2fd",color:"#1976d2"}}>{p.category}</span>}
                </div>
                <div style={{fontSize:12,color:"#666",display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span>شراء: <b style={{color:"#1976d2"}}>₪{p.buy_price}</b></span>
                  <span>بيع: <b style={{color:"#1a7a4a"}}>₪{p.sell_price}</b></span>
                  <span>ربح: <b style={{color:"#f57c00"}}>₪{(p.sell_price-p.buy_price).toFixed(2)}</b></span>
                </div>
                <div style={{marginTop:6}}>
                  <span className="badge" style={{background:Number(p.stock)<10?"#ffebee":"#e8f5e9",color:Number(p.stock)<10?"#e53935":"#1a7a4a"}}>{p.stock} {p.unit}</span>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <button className="btn btn-g" style={{padding:"6px 10px",fontSize:12}} onClick={()=>addStock(p)}>+ مخزون</button>
                <button className="btn btn-gray" style={{padding:"6px 10px",fontSize:12}} onClick={()=>{setForm({name:p.name,category:p.category||"سجائر",unit:p.unit,buy_price:p.buy_price,sell_price:p.sell_price,stock:p.stock,is_wafa:p.is_wafa||false});setEditId(p.id);setView("edit");}}>تعديل</button>
                <button style={{padding:"6px 10px",fontSize:12,background:"#ffebee",color:"#e53935",border:"none",borderRadius:10,cursor:"pointer"}} onClick={()=>deleteProduct(p)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>;
}

// ══════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════
function ReportsPage({ sales, debts, customers, capital }) {
  const [period, setPeriod] = useState("today");
  const [opType, setOpType] = useState("all");
  const now = new Date();

  const filtered = sales.filter(s=>{
    const d=new Date(s.raw_date);
    if (period==="today") return d.toDateString()===now.toDateString();
    if (period==="week")  return (now-d)<7*86400000;
    if (period==="month") return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    return true;
  }).filter(s=> opType==="all"||(opType==="cash"?s.is_paid:!s.is_paid));

  const rev    = filtered.reduce((a,s)=>a+Number(s.total),0);
  const profit = filtered.reduce((a,s)=>a+Number(s.profit),0);
  const cash   = filtered.filter(s=>s.is_paid).reduce((a,s)=>a+Number(s.total),0);
  const debt   = filtered.filter(s=>!s.is_paid).reduce((a,s)=>a+Number(s.total),0);
  const totalDebt = debts.filter(d=>!d.paid).reduce((a,d)=>a+Number(d.amount),0);

  const pmap={};
  filtered.forEach(s=>{if(!pmap[s.product_name])pmap[s.product_name]=0;pmap[s.product_name]+=Number(s.total);});
  const top=Object.entries(pmap).sort((a,b)=>b[1]-a[1]).slice(0,5);

  return <>
    <div className="hdr"><div style={{fontWeight:900,fontSize:18}}>📊 التقارير</div></div>
    <div className="page">
      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:12,paddingBottom:4}}>
        {[["today","اليوم"],["week","الأسبوع"],["month","الشهر"],["all","الكل"]].map(([k,l])=>(
          <button key={k} className={`chip ${period===k?"on":""}`} onClick={()=>setPeriod(k)}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["all","الكل"],["cash","نقدي"],["debt","دين"]].map(([k,l])=>(
          <button key={k} className={`chip ${opType===k?"on":""}`} onClick={()=>setOpType(k)} style={{fontSize:12}}>{l}</button>
        ))}
      </div>

      <div className="g2" style={{marginBottom:12}}>
        {[
          {label:"إجمالي المبيعات",val:`₪${f(rev)}`,color:"#1976d2"},
          {label:"الربح الصافي",val:`₪${f(profit)}`,color:"#1a7a4a"},
          {label:"نقد مقبوض",val:`₪${f(cash)}`,color:"#1a7a4a"},
          {label:"دين مؤجل",val:`₪${f(debt)}`,color:"#e53935"},
          {label:"إجمالي الديون",val:`₪${f(totalDebt)}`,color:"#e53935"},
          {label:"رأس المال",val:`₪${f(capital.amount)}`,color:"#f57c00"},
        ].map((s,i)=>(
          <div key={i} className="card" style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:"#888",marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:18,fontWeight:900,color:s.color}}>{s.val}</div>
          </div>
        ))}
      </div>

      {top.length>0&&<>
        <div style={{fontWeight:900,fontSize:15,marginBottom:10}}>🏆 أكثر الأصناف مبيعاً</div>
        <div className="card" style={{marginBottom:14}}>
          {top.map(([n,t],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<top.length-1?"1px solid #f5f7fa":"none"}}>
              <span style={{fontWeight:600}}>{i+1}. {n}</span>
              <span style={{color:"#1a7a4a",fontWeight:700}}>₪{f(t)}</span>
            </div>
          ))}
        </div>
      </>}

      <div style={{fontWeight:900,fontSize:15,marginBottom:10}}>سجل الحركات</div>
      {filtered.slice(0,50).map((s,i)=>(
        <div key={i} className="tx" style={{borderRightColor:s.is_paid?"#1a7a4a":"#e53935"}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{s.product_name}</div>
              <div style={{fontSize:11,color:"#aaa"}}>{s.date} · الكمية: {s.qty}</div>
              {!s.is_paid&&<div style={{fontSize:11,color:"#e53935"}}>دين: {s.customer_name}</div>}
            </div>
            <div style={{textAlign:"left"}}>
              <div style={{fontWeight:900,color:"#1a7a4a"}}>₪{f(s.total)}</div>
              <div style={{fontSize:11,color:"#f57c00"}}>ربح: ₪{f(s.profit)}</div>
              <span className="badge" style={{background:s.is_paid?"#e8f5e9":"#ffebee",color:s.is_paid?"#1a7a4a":"#e53935"}}>{s.is_paid?"نقدي":"دين"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>;
}

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
function SettingsPage({ load }) {
  const [form, setForm] = useState({ store_name:"3lewa Smoke", pin:"2323", credit_limit:"500" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await api.patch("app_settings",1,{ store_name:form.store_name, pin:form.pin, credit_limit:+form.credit_limit });
    await load();
    setLoading(false);
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  }

  return <>
    <div className="hdr"><div style={{fontWeight:900,fontSize:18}}>⚙️ الإعدادات</div></div>
    <div className="page">
      <div className="card col">
        <div style={{fontWeight:900,fontSize:15,marginBottom:4}}>إعدادات المتجر</div>
        <div className="col"><label style={{fontSize:12,color:"#666"}}>اسم المتجر</label><input className="inp" value={form.store_name} onChange={e=>setForm(f=>({...f,store_name:e.target.value}))}/></div>
        <div className="col"><label style={{fontSize:12,color:"#666"}}>كلمة المرور (4 أرقام)</label><input className="inp" type="password" maxLength={4} value={form.pin} onChange={e=>setForm(f=>({...f,pin:e.target.value}))} placeholder="****"/></div>
        <div className="col"><label style={{fontSize:12,color:"#666"}}>الحد الائتماني الافتراضي ₪</label><input className="inp" type="number" value={form.credit_limit} onChange={e=>setForm(f=>({...f,credit_limit:e.target.value}))}/></div>
        <button className="btn btn-g" onClick={save} disabled={loading}>{loading?"⏳...":saved?"✅ تم الحفظ!":"💾 حفظ الإعدادات"}</button>
      </div>
    </div>
  </>;
                   }
