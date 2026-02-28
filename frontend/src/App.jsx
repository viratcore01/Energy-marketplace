import { useState, useEffect } from "react";
import Chatbot from "./components/Chatbot";

// ─── MOCK DATA & STATE ENGINE ────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const toConsumerUI = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  city: row.city,
  address: row.address,
  centerId: row.center_id,
  pricePerUnit: Number(row.price_per_unit || 0),
  monthlyUsage: Number(row.monthly_usage || 0),
  monthlyBill: Number(row.monthly_bill || 0),
  connectionCost: Number(row.connection_cost || 0),
  connected: true,
  createdAt: row.created_at,
});

const toProducerUI = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  city: row.city,
  centerId: row.center_id,
  pricePerUnit: Number(row.price_per_unit || 0),
  unitsAvailable: Number(row.units_available || 0),
  earnings: Number(row.earnings || 0),
  createdAt: row.created_at,
});

const toCenterUI = (row) => ({
  id: row.id,
  name: row.name,
  city: row.city,
  stored: Number(row.stored || 0),
  capacity: Number(row.capacity || 0),
  producers: 0,
});

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return data;
}

function getDistance(city1, city2) {
  const coords = { Delhi: [28.7, 77.1], Kolkata: [22.5, 88.3], Chennai: [13.0, 80.2], Mumbai: [19.0, 72.8] };
  const c1 = coords[city1] || [20, 78]; const c2 = coords[city2] || [20, 78];
  return Math.round(Math.sqrt(Math.pow((c1[0]-c2[0])*111, 2) + Math.pow((c1[1]-c2[1])*111, 2)));
}

function calcConnectionCost(type, city, centers) {
  if (!centers.length) return null;
  const nearest = centers.reduce((a, b) => {
    return getDistance(city, a.city) < getDistance(city, b.city) ? a : b;
  });
  const dist = getDistance(city, nearest.city);
  const base = type === "Industry" ? 15000 : 5000;
  return { cost: base + dist * 120, centerId: nearest.id, centerName: nearest.name, distKm: dist };
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
  const icons = {
    sun: "☀️", wind: "💨", leaf: "🌿", zap: "⚡", home: "🏠", factory: "🏭",
    chart: "📊", transfer: "🔄", user: "👤", plus: "➕", check: "✅",
    warning: "⚠️", bolt: "🔌", money: "💰", battery: "🔋", grid: "⚙️",
    arrow: "→", fire: "🔥", water: "💧",
  };
  return <span style={{ fontSize: size }}>{icons[name] || "•"}</span>;
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0f1e 0%, #0d1f12 50%, #0a0f1e 100%)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#e8f5e9",
  },
  header: {
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(76, 175, 80, 0.3)",
    padding: "0 32px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    height: 64, position: "sticky", top: 0, zIndex: 100,
  },
  logo: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5,
    background: "linear-gradient(90deg, #69f0ae, #40c4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  navBtn: (active) => ({
    padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 600, transition: "all 0.2s",
    background: active ? "linear-gradient(135deg, #1b5e20, #004d40)" : "transparent",
    color: active ? "#69f0ae" : "#90a4ae",
    boxShadow: active ? "0 0 16px rgba(105, 240, 174, 0.3)" : "none",
  }),
  card: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(105, 240, 174, 0.15)",
    borderRadius: 16, padding: 24, backdropFilter: "blur(10px)",
  },
  cardGlow: {
    background: "rgba(105, 240, 174, 0.06)", border: "1px solid rgba(105, 240, 174, 0.3)",
    borderRadius: 16, padding: 24, backdropFilter: "blur(10px)",
    boxShadow: "0 0 30px rgba(105, 240, 174, 0.1)",
  },
  h1: { fontSize: 28, fontWeight: 800, marginBottom: 4, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: 700, marginBottom: 16 },
  h3: { fontSize: 15, fontWeight: 600, marginBottom: 8, color: "#69f0ae" },
  label: { fontSize: 12, fontWeight: 600, color: "#90a4ae", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 0.8 },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(105, 240, 174, 0.2)",
    color: "#e8f5e9", fontSize: 14, outline: "none", boxSizing: "border-box",
  },
  select: {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    background: "#0d1f12", border: "1px solid rgba(105, 240, 174, 0.2)",
    color: "#e8f5e9", fontSize: 14, outline: "none", boxSizing: "border-box",
  },
  btnPrimary: {
    padding: "12px 28px", borderRadius: 10, border: "none", cursor: "pointer",
    background: "linear-gradient(135deg, #1b5e20, #004d40)", color: "#69f0ae",
    fontSize: 14, fontWeight: 700, transition: "all 0.2s",
    boxShadow: "0 4px 20px rgba(105, 240, 174, 0.25)",
  },
  btnSecondary: {
    padding: "10px 22px", borderRadius: 10, border: "1px solid rgba(105, 240, 174, 0.3)",
    cursor: "pointer", background: "transparent", color: "#69f0ae",
    fontSize: 13, fontWeight: 600,
  },
  btnDanger: {
    padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
    background: "rgba(244, 67, 54, 0.2)", color: "#ef9a9a", fontSize: 13, fontWeight: 600,
  },
  badge: (color) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11,
    fontWeight: 700, background: color === "green" ? "rgba(105,240,174,0.15)" : color === "blue" ? "rgba(64,196,255,0.15)" : "rgba(255,183,77,0.15)",
    color: color === "green" ? "#69f0ae" : color === "blue" ? "#40c4ff" : "#ffb74d",
  }),
  statCard: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(105, 240, 174, 0.1)",
    borderRadius: 12, padding: "20px 24px", textAlign: "center",
  },
  statNum: { fontSize: 32, fontWeight: 800, color: "#69f0ae" },
  statLabel: { fontSize: 12, color: "#78909c", marginTop: 4 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  grid4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 },
  section: { padding: "32px", maxWidth: 1200, margin: "0 auto" },
  formGroup: { marginBottom: 16 },
  divider: { borderTop: "1px solid rgba(105,240,174,0.1)", margin: "24px 0" },
  tag: { display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11, background: "rgba(105,240,174,0.1)", color: "#69f0ae", marginRight: 6 },
  progressBar: (pct, color = "#69f0ae") => ({
    height: 8, borderRadius: 4, background: `rgba(255,255,255,0.08)`,
    position: "relative", overflow: "hidden",
  }),
  progressFill: (pct, color = "#69f0ae") => ({
    height: "100%", width: `${pct}%`, borderRadius: 4,
    background: `linear-gradient(90deg, ${color}, ${color}88)`,
    transition: "width 0.8s ease",
  }),
};

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────
function BarChart({ data, label, color = "#69f0ae" }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div>
      <div style={{ fontSize: 12, color: "#78909c", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", background: color + "33", borderRadius: "3px 3px 0 0", position: "relative", height: 64, display: "flex", alignItems: "flex-end" }}>
              <div style={{ width: "100%", background: color, borderRadius: "3px 3px 0 0", height: `${(d.value / max) * 64}px`, transition: "height 0.8s ease" }} />
            </div>
            <div style={{ fontSize: 9, color: "#78909c" }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CONSUMER PORTAL ─────────────────────────────────────────────────────────
function ConsumerPortal({ consumers, producers, centers, refreshConsumers }) {
  const [step, setStep] = useState("list"); // list | buy | myAccount
  const [form, setForm] = useState({ name: "", connType: "Household", city: "Delhi", address: "" });
  const [quote, setQuote] = useState(null);
  const [myId, setMyId] = useState(null);

  const myConsumer = consumers.find(c => c.id === myId);
  const marketProducers = producers.filter(p => !form.city || p.city === form.city || true);

  const getQuote = () => {
    if (!form.name || !form.city) return;
    const q = calcConnectionCost(form.connType, form.city, centers);
    if (!q) return;
    setQuote(q);
  };

  const buyConnection = async () => {
    if (!quote) return;
    const pricePerUnit = producers.find(p => p.centerId === quote.centerId)?.pricePerUnit || 4.5;
    try {
      const created = await apiRequest("/api/consumers", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          type: form.connType,
          city: form.city,
          address: form.address,
          center_id: quote.centerId,
          price_per_unit: pricePerUnit,
          monthly_usage: 0,
          monthly_bill: 0,
          connection_cost: quote.cost,
        }),
      });
      await refreshConsumers();
      setMyId(created.id);
      setStep("myAccount");
    } catch (err) {
      alert(err.message || "Failed to create consumer");
    }
  };

  if (step === "myAccount" && myConsumer) {
    return (
      <div style={S.section}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setStep("list")} style={S.btnSecondary}>← Back</button>
          <div>
            <div style={S.h1}>My Energy Account <span style={S.badge("green")}>Connected</span></div>
            <div style={{ color: "#78909c", fontSize: 13 }}>Consumer ID: {myConsumer.id}</div>
          </div>
        </div>
        <div style={{ ...S.grid4, marginBottom: 24 }}>
          {[
            { label: "Connection Type", value: myConsumer.type, icon: myConsumer.type === "Industry" ? "factory" : "home" },
            { label: "Energy Center", value: centers.find(e => e.id === myConsumer.centerId)?.name, icon: "grid" },
            { label: "Price/Unit", value: `₹${myConsumer.pricePerUnit}/kWh`, icon: "bolt" },
            { label: "Connection Cost", value: `₹${myConsumer.connectionCost?.toLocaleString()}`, icon: "money" },
          ].map((s, i) => (
            <div key={i} style={S.statCard}>
              <div style={{ fontSize: 28, marginBottom: 8 }}><Icon name={s.icon} size={28} /></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e8f5e9" }}>{s.value}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={S.grid2}>
          <div style={S.cardGlow}>
            <div style={S.h3}>📊 Usage & Billing</div>
            <UsageSimulator consumer={myConsumer} refreshConsumers={refreshConsumers} />
          </div>
          <div style={S.card}>
            <div style={S.h3}>🔋 Live Market Prices</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {producers.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#78909c" }}>{p.type} · {p.city} · {p.unitsAvailable} kWh available</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#69f0ae" }}>₹{p.pricePerUnit}</div>
                    <div style={{ fontSize: 10, color: "#78909c" }}>per kWh</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "buy") {
    return (
      <div style={S.section}>
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => setStep("list")} style={S.btnSecondary}>← Back</button>
        </div>
        <div style={{ maxWidth: 560 }}>
          <div style={S.h1}>Buy Connection</div>
          <div style={{ color: "#78909c", marginBottom: 28 }}>Get connected to clean, decentralized energy</div>
          <div style={S.cardGlow}>
            <div style={S.formGroup}>
              <label style={S.label}>Your Name</label>
              <input style={S.input} placeholder="Enter your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Connection Type</label>
              <select style={S.select} value={form.connType} onChange={e => { setForm(f => ({ ...f, connType: e.target.value })); setQuote(null); }}>
                <option>Household</option>
                <option>Industry</option>
              </select>
              <div style={{ fontSize: 11, color: "#78909c", marginTop: 4 }}>
                {form.connType === "Household" ? "⚡ Residential use – Base ₹5,000 + distance charges" : "⚡ Industrial use – Base ₹15,000 + distance charges"}
              </div>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>City</label>
              <select style={S.select} value={form.city} onChange={e => { setForm(f => ({ ...f, city: e.target.value })); setQuote(null); }}>
                {["Delhi", "Mumbai", "Chennai", "Kolkata", "Bangalore", "Hyderabad", "Pune"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Address / Location Details</label>
              <input style={S.input} placeholder="Sector, locality, landmark..." value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <button style={S.btnPrimary} onClick={getQuote}>Get Quote ⚡</button>

            {quote && (
              <div style={{ marginTop: 20, padding: 20, background: "rgba(105,240,174,0.08)", border: "1px solid rgba(105,240,174,0.3)", borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#69f0ae", marginBottom: 12 }}>📋 Connection Quote</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#90a4ae", fontSize: 13 }}>Nearest Energy Center</span>
                    <span style={{ fontWeight: 600 }}>{quote.centerName}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#90a4ae", fontSize: 13 }}>Distance</span>
                    <span style={{ fontWeight: 600 }}>{quote.distKm} km</span>
                  </div>
                  <div style={{ ...S.divider, margin: "8px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#90a4ae", fontSize: 13 }}>One-Time Connection Cost</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#69f0ae" }}>₹{quote.cost.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#78909c" }}>Monthly billing based on actual usage at market rate</div>
                </div>
                <button style={{ ...S.btnPrimary, marginTop: 16, width: "100%" }} onClick={buyConnection}>
                  Confirm & Pay ₹{quote.cost.toLocaleString()} ✅
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={S.h1}><Icon name="bolt" /> Consumer Portal</div>
          <div style={{ color: "#78909c" }}>Buy clean energy connections · Pay per usage · No hidden charges</div>
        </div>
        <button style={S.btnPrimary} onClick={() => setStep("buy")}>+ Buy Connection</button>
      </div>
      <div style={{ ...S.grid3, marginBottom: 28 }}>
        <div style={S.statCard}><div style={S.statNum}>{consumers.length}</div><div style={S.statLabel}>Active Consumers</div></div>
        <div style={S.statCard}><div style={S.statNum}>₹{(consumers.reduce((s, c) => s + (c.monthlyBill || 0), 0)).toLocaleString()}</div><div style={S.statLabel}>Monthly Revenue Generated</div></div>
        <div style={S.statCard}><div style={S.statNum}>{consumers.reduce((s, c) => s + (c.monthlyUsage || 0), 0).toLocaleString()} kWh</div><div style={S.statLabel}>Total Monthly Consumption</div></div>
      </div>
      <div style={S.card}>
        <div style={S.h3}>All Consumers</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {consumers.map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{c.type === "Industry" ? "🏭" : "🏠"}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{c.name} <span style={S.badge("green")}>Connected</span></div>
                  <div style={{ fontSize: 12, color: "#78909c" }}>{c.city} · {c.type} · Center: {centers.find(e => e.id === c.centerId)?.name}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#40c4ff" }}>₹{c.monthlyBill?.toLocaleString() || 0}</div>
                <div style={{ fontSize: 11, color: "#78909c" }}>{c.monthlyUsage} kWh this month</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── USAGE SIMULATOR ─────────────────────────────────────────────────────────
function UsageSimulator({ consumer, refreshConsumers }) {
  const [units, setUnits] = useState("");
  const bill = units ? (parseFloat(units) * (consumer.pricePerUnit || 4.5)).toFixed(2) : null;

  const submitUsage = async () => {
    if (!units) return;
    try {
      await apiRequest(`/api/consumers/${consumer.id}`, {
        method: "PUT",
        body: JSON.stringify({
          monthly_usage: parseFloat(units),
          monthly_bill: parseFloat(bill),
        }),
      });
      await refreshConsumers();
      setUnits("");
      alert(`✅ Usage recorded! Monthly bill: ₹${bill}`);
    } catch (err) {
      alert(err.message || "Failed to update usage");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div><div style={{ fontSize: 24, fontWeight: 800, color: "#69f0ae" }}>{consumer.monthlyUsage} kWh</div><div style={{ fontSize: 11, color: "#78909c" }}>Current month usage</div></div>
        <div><div style={{ fontSize: 24, fontWeight: 800, color: "#40c4ff" }}>₹{consumer.monthlyBill?.toLocaleString() || 0}</div><div style={{ fontSize: 11, color: "#78909c" }}>Estimated bill</div></div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input style={{ ...S.input, flex: 1 }} type="number" placeholder="Enter kWh used" value={units} onChange={e => setUnits(e.target.value)} />
        <button style={S.btnPrimary} onClick={submitUsage}>Update</button>
      </div>
      {bill && <div style={{ marginTop: 8, padding: 10, background: "rgba(105,240,174,0.08)", borderRadius: 8, fontSize: 13 }}>
        💡 Estimated bill: <strong style={{ color: "#69f0ae" }}>₹{bill}</strong> at ₹{consumer.pricePerUnit}/kWh
      </div>}
    </div>
  );
}

// ─── PRODUCER PORTAL ─────────────────────────────────────────────────────────
function ProducerPortal({ producers, consumers, centers, refreshProducers }) {
  const [step, setStep] = useState("market");
  const [form, setForm] = useState({ name: "", type: "Solar", city: "Delhi", pricePerUnit: "", unitsAvailable: "" });
  const [editId, setEditId] = useState(null);

  const registerProducer = async () => {
    if (!form.name || !form.pricePerUnit || !form.unitsAvailable) return;
    if (!centers.length) return;
    const nearest = centers.reduce((a, b) => getDistance(form.city, a.city) < getDistance(form.city, b.city) ? a : b);
    try {
      if (editId) {
        await apiRequest(`/api/producers/${editId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name,
            type: form.type,
            city: form.city,
            center_id: nearest.id,
            price_per_unit: parseFloat(form.pricePerUnit),
            units_available: parseInt(form.unitsAvailable, 10),
          }),
        });
      } else {
        await apiRequest("/api/producers", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            type: form.type,
            city: form.city,
            center_id: nearest.id,
            price_per_unit: parseFloat(form.pricePerUnit),
            units_available: parseInt(form.unitsAvailable, 10),
            earnings: 0,
          }),
        });
      }
      await refreshProducers();
      setStep("market");
      setEditId(null);
      setForm({ name: "", type: "Solar", city: "Delhi", pricePerUnit: "", unitsAvailable: "" });
    } catch (err) {
      alert(err.message || "Failed to save producer");
    }
  };

  const typeIcons = { Solar: "☀️", Wind: "💨", Biogas: "🌿", Hydro: "💧" };
  const totalGenerated = producers.reduce((s, p) => s + p.unitsAvailable, 0);
  const totalEarnings = producers.reduce((s, p) => s + (p.earnings || 0), 0);

  return (
    <div style={S.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={S.h1}>⚡ Producer Portal</div>
          <div style={{ color: "#78909c" }}>Sell energy directly · Set your price · Earn transparently</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.navBtn(step === "market"), borderRadius: 8, padding: "8px 16px" }} onClick={() => setStep("market")}>Market</button>
          <button style={S.btnPrimary} onClick={() => { setStep("register"); setEditId(null); }}>+ List Energy</button>
        </div>
      </div>

      <div style={{ ...S.grid4, marginBottom: 28 }}>
        <div style={S.statCard}><div style={S.statNum}>{producers.length}</div><div style={S.statLabel}>Active Producers</div></div>
        <div style={S.statCard}><div style={S.statNum}>{totalGenerated.toLocaleString()}</div><div style={S.statLabel}>kWh Available</div></div>
        <div style={S.statCard}><div style={S.statNum}>₹{(totalEarnings / 1000).toFixed(1)}K</div><div style={S.statLabel}>Total Earnings</div></div>
        <div style={S.statCard}><div style={S.statNum}>₹{(producers.reduce((s, p) => s + p.pricePerUnit, 0) / producers.length || 0).toFixed(2)}</div><div style={S.statLabel}>Avg Price/kWh</div></div>
      </div>

      {step === "register" && (
        <div style={{ maxWidth: 560, marginBottom: 32 }}>
          <div style={S.cardGlow}>
            <div style={S.h2}>{editId ? "Update Listing" : "List Your Energy"}</div>
            <div style={S.formGroup}>
              <label style={S.label}>Producer / Farm Name</label>
              <input style={S.input} placeholder="e.g. Sunrise Solar Farm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={S.grid2}>
              <div style={S.formGroup}>
                <label style={S.label}>Energy Type</label>
                <select style={S.select} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {["Solar", "Wind", "Biogas", "Hydro"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>City</label>
                <select style={S.select} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
                  {["Delhi", "Mumbai", "Chennai", "Kolkata"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={S.grid2}>
              <div style={S.formGroup}>
                <label style={S.label}>Price per kWh (₹)</label>
                <input style={S.input} type="number" step="0.1" placeholder="e.g. 4.50" value={form.pricePerUnit} onChange={e => setForm(f => ({ ...f, pricePerUnit: e.target.value }))} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Units Available (kWh)</label>
                <input style={S.input} type="number" placeholder="e.g. 1000" value={form.unitsAvailable} onChange={e => setForm(f => ({ ...f, unitsAvailable: e.target.value }))} />
              </div>
            </div>
            {form.pricePerUnit && form.unitsAvailable && (
              <div style={{ padding: 12, background: "rgba(105,240,174,0.08)", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                💰 Potential revenue: <strong style={{ color: "#69f0ae" }}>₹{(parseFloat(form.pricePerUnit) * parseInt(form.unitsAvailable || 0)).toLocaleString()}</strong>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.btnPrimary} onClick={registerProducer}>{editId ? "Update ✅" : "List Energy ⚡"}</button>
              <button style={S.btnSecondary} onClick={() => setStep("market")}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        <div style={S.h3}>Active Energy Listings</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {producers.map(p => {
            const center = centers.find(e => e.id === p.centerId);
            const demand = consumers.filter(c => c.centerId === p.centerId).reduce((s, c) => s + (c.monthlyUsage || 0), 0);
            return (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 16, padding: "16px 20px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 36 }}>{typeIcons[p.type] || "⚡"}</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{p.name} <span style={S.tag}>{p.type}</span></div>
                  <div style={{ fontSize: 12, color: "#78909c" }}>📍 {p.city} · Center: {center?.name} · {p.unitsAvailable} kWh available</div>
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 11, color: "#78909c", marginBottom: 3 }}>Supply coverage</div>
                    <div style={S.progressBar()}>
                      <div style={S.progressFill(Math.min(100, (p.unitsAvailable / (demand + 1)) * 100))} />
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#69f0ae" }}>₹{p.pricePerUnit}</div>
                  <div style={{ fontSize: 10, color: "#78909c" }}>per kWh</div>
                  <div style={{ fontSize: 13, color: "#40c4ff", marginTop: 4 }}>₹{p.earnings.toLocaleString()} earned</div>
                </div>
                <button style={S.btnSecondary} onClick={() => {
                  setForm({ name: p.name, type: p.type, city: p.city, pricePerUnit: p.pricePerUnit, unitsAvailable: p.unitsAvailable });
                  setEditId(p.id); setStep("register");
                }}>Edit</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PORTAL ─────────────────────────────────────────────────────────────
function AdminPortal({ producers, consumers, centers, refreshCenters }) {
  const [transferForm, setTransferForm] = useState({ from: "EC001", to: "EC002", amount: "" });
  const [transferLog, setTransferLog] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);

  const totalGenerated = producers.reduce((s, p) => s + p.unitsAvailable, 0);
  const totalConsumed = consumers.reduce((s, c) => s + (c.monthlyUsage || 0), 0);
  const totalStored = centers.reduce((s, c) => s + c.stored, 0);
  const totalCapacity = centers.reduce((s, c) => s + c.capacity, 0);

  const loadTransfers = async () => {
    try {
      const data = await apiRequest("/api/centers/transfers");
      setTransferLog(data);
    } catch (err) {
      alert(err.message || "Failed to load transfer log");
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const doTransfer = async () => {
    const amt = parseInt(transferForm.amount);
    if (!amt || transferForm.from === transferForm.to) return;
    try {
      await apiRequest("/api/centers/transfer", {
        method: "POST",
        body: JSON.stringify({
          from_center: transferForm.from,
          to_center: transferForm.to,
          amount: amt,
        }),
      });
      await refreshCenters();
      await loadTransfers();
      setTransferForm(f => ({ ...f, amount: "" }));
    } catch (err) {
      alert(err.message || "Failed to transfer energy");
    }
  };

  const monthLabels = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  const consumptionData = monthLabels.map((label, i) => ({ label, value: 2000 + i * 800 + Math.random() * 500 }));
  const productionData = monthLabels.map((label, i) => ({ label, value: 2400 + i * 600 + Math.random() * 400 }));

  return (
    <div style={S.section}>
      <div style={{ marginBottom: 28 }}>
        <div style={S.h1}>⚙️ Energy Center Admin</div>
        <div style={{ color: "#78909c" }}>Grid oversight · Storage management · Inter-center transfers</div>
      </div>

      <div style={{ ...S.grid4, marginBottom: 28 }}>
        {[
          { label: "Total Generated", value: `${totalGenerated.toLocaleString()} kWh`, icon: "⚡", color: "#69f0ae" },
          { label: "Total Consumed", value: `${totalConsumed.toLocaleString()} kWh`, icon: "🔌", color: "#40c4ff" },
          { label: "Total Stored", value: `${totalStored.toLocaleString()} kWh`, icon: "🔋", color: "#ffb74d" },
          { label: "Grid Efficiency", value: `${Math.round((totalConsumed / totalGenerated) * 100) || 0}%`, icon: "📊", color: "#ef9a9a" },
        ].map((s, i) => (
          <div key={i} style={{ ...S.statCard, borderColor: s.color + "30" }}>
            <div style={{ fontSize: 32 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Demand vs Supply visual */}
      <div style={{ ...S.grid2, marginBottom: 24 }}>
        <div style={S.card}>
          <div style={S.h3}>📈 Consumption Trend (6 months)</div>
          <BarChart data={consumptionData} label="kWh consumed per month" color="#40c4ff" />
        </div>
        <div style={S.card}>
          <div style={S.h3}>⚡ Production Trend (6 months)</div>
          <BarChart data={productionData} label="kWh produced per month" color="#69f0ae" />
        </div>
      </div>

      {/* Energy Centers Grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...S.h2, marginBottom: 16 }}>🗺️ Energy Centers Status</div>
        <div style={S.grid2}>
          {centers.map(center => {
            const centerProducers = producers.filter(p => p.centerId === center.id);
            const centerConsumers = consumers.filter(c => c.centerId === center.id);
            const storagePct = Math.round((center.stored / center.capacity) * 100);
            const isSelected = selectedCenter === center.id;
            return (
              <div key={center.id} style={{ ...S.card, cursor: "pointer", border: isSelected ? "1px solid rgba(105,240,174,0.5)" : "1px solid rgba(105,240,174,0.1)" }} onClick={() => setSelectedCenter(isSelected ? null : center.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div><div style={{ fontSize: 16, fontWeight: 700 }}>{center.name}</div><div style={{ fontSize: 12, color: "#78909c" }}>📍 {center.city}</div></div>
                  <span style={S.badge("green")}>Online</span>
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: "#69f0ae" }}>{centerProducers.length}</div><div style={{ fontSize: 10, color: "#78909c" }}>Producers</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: "#40c4ff" }}>{centerConsumers.length}</div><div style={{ fontSize: 10, color: "#78909c" }}>Consumers</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: "#ffb74d" }}>{storagePct}%</div><div style={{ fontSize: 10, color: "#78909c" }}>Storage</div></div>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#78909c", marginBottom: 4 }}>
                    <span>Storage: {center.stored.toLocaleString()} / {center.capacity.toLocaleString()} kWh</span>
                    <span>{storagePct}%</span>
                  </div>
                  <div style={S.progressBar()}>
                    <div style={S.progressFill(storagePct, storagePct > 80 ? "#69f0ae" : storagePct > 40 ? "#ffb74d" : "#ef5350")} />
                  </div>
                </div>
                {isSelected && (
                  <div style={{ marginTop: 12, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#69f0ae", marginBottom: 8 }}>Connected Producers:</div>
                    {centerProducers.map(p => <div key={p.id} style={{ fontSize: 11, color: "#90a4ae", marginBottom: 3 }}>• {p.name} — {p.unitsAvailable} kWh @ ₹{p.pricePerUnit}</div>)}
                    {centerConsumers.length > 0 && <>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#40c4ff", marginBottom: 8, marginTop: 8 }}>Connected Consumers:</div>
                      {centerConsumers.map(c => <div key={c.id} style={{ fontSize: 11, color: "#90a4ae", marginBottom: 3 }}>• {c.name} — {c.monthlyUsage} kWh/mo</div>)}
                    </>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Center-to-Center Transfer */}
      <div style={{ ...S.grid2, gap: 24 }}>
        <div style={S.cardGlow}>
          <div style={S.h3}>🔄 Center-to-Center Transfer</div>
          <div style={{ fontSize: 12, color: "#78909c", marginBottom: 16 }}>Balance energy between grids to prevent shortages</div>
          <div style={S.formGroup}>
            <label style={S.label}>Transfer From</label>
            <select style={S.select} value={transferForm.from} onChange={e => setTransferForm(f => ({ ...f, from: e.target.value }))}>
              {centers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.stored} kWh)</option>)}
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Transfer To</label>
            <select style={S.select} value={transferForm.to} onChange={e => setTransferForm(f => ({ ...f, to: e.target.value }))}>
              {centers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.capacity - c.stored} kWh free)</option>)}
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Amount (kWh)</label>
            <input style={S.input} type="number" placeholder="e.g. 500" value={transferForm.amount} onChange={e => setTransferForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <button style={S.btnPrimary} onClick={doTransfer}>Execute Transfer 🔄</button>
        </div>

        <div style={S.card}>
          <div style={S.h3}>📋 Transfer Log</div>
          {transferLog.length === 0 ? (
            <div style={{ color: "#78909c", fontSize: 13, padding: "20px 0" }}>No transfers yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {transferLog.map((t, i) => (
                <div key={i} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 12 }}>
                  <div style={{ color: "#69f0ae", fontWeight: 600 }}>✅ {t.amount.toLocaleString()} kWh transferred</div>
                  <div style={{ color: "#90a4ae" }}>
                    {(centers.find((c) => c.id === t.from_center)?.name || t.from_center)} → {(centers.find((c) => c.id === t.to_center)?.name || t.to_center)}
                  </div>
                  <div style={{ color: "#78909c", fontSize: 11 }}>at {new Date(t.created_at).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [portal, setPortal] = useState("consumer");
  const [consumers, setConsumers] = useState([]);
  const [producers, setProducers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshConsumers = async () => {
    const rows = await apiRequest("/api/consumers");
    setConsumers(rows.map(toConsumerUI));
  };

  const refreshProducers = async () => {
    const rows = await apiRequest("/api/producers");
    setProducers(rows.map(toProducerUI));
  };

  const refreshCenters = async () => {
    const rows = await apiRequest("/api/centers");
    setCenters(rows.map(toCenterUI));
  };

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        await Promise.all([refreshConsumers(), refreshProducers(), refreshCenters()]);
      } catch (err) {
        alert(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Sync producer counts into center cards
  useEffect(() => {
    setCenters((prev) =>
      prev.map((c) => ({
        ...c,
        producers: producers.filter((p) => p.centerId === c.id).length,
      }))
    );
  }, [producers]);

  const navItems = [
    { id: "consumer", label: "⚡ Consumer", desc: "Buy connections · Pay per usage" },
    { id: "producer", label: "☀️ Producer",  desc: "Sell energy · Set prices" },
    { id: "admin",    label: "⚙️ Admin",     desc: "Grid management · Transfers" },
  ];

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.logo}>⚡ EnergyDAO</div>
        <nav style={{ display: "flex", gap: 6 }}>
          {navItems.map(n => (
            <button key={n.id} style={S.navBtn(portal === n.id)} onClick={() => setPortal(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{ fontSize: 12, color: "#78909c" }}>
          🟢 {consumers.length} consumers · {producers.length} producers · {centers.length} centers
        </div>
      </header>

      <main>
        {loading ? (
          <div style={{ padding: "32px", color: "#90a4ae" }}>Loading...</div>
        ) : (
          <>
            {portal === "consumer" && (
              <ConsumerPortal
                consumers={consumers}
                producers={producers}
                centers={centers}
                refreshConsumers={refreshConsumers}
              />
            )}
            {portal === "producer" && (
              <ProducerPortal
                producers={producers}
                consumers={consumers}
                centers={centers}
                refreshProducers={refreshProducers}
              />
            )}
            {portal === "admin" && (
              <AdminPortal
                producers={producers}
                consumers={consumers}
                centers={centers}
                refreshCenters={refreshCenters}
              />
            )}
          </>
        )}
      </main>
      <Chatbot />
    </div>
  );
}
