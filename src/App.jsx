import React, { useMemo, useState } from "react";
import { DollarSign, Hammer, Home, TrendingUp, AlertTriangle, Plus, Trash2 } from "lucide-react";

const currency = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const initialBudget = [
  { category: "Purchase Price", amount: 850000 },
  { category: "Closing Costs", amount: 18000 },
  { category: "Demo", amount: 12000 },
  { category: "Kitchen", amount: 35000 },
  { category: "Bathrooms", amount: 22000 },
  { category: "Flooring", amount: 14000 },
  { category: "Paint", amount: 9000 },
  { category: "Landscaping", amount: 8000 },
  { category: "Holding Costs", amount: 24000 },
  { category: "Staging / Sales Prep", amount: 7500 },
];

const initialTasks = [
  { id: 1, task: "Walk property with contractor", owner: "Me", due: "2026-04-15", done: false },
  { id: 2, task: "Finalize rehab budget", owner: "Me", due: "2026-04-16", done: false },
  { id: 3, task: "Order cabinets", owner: "Project Manager", due: "2026-04-22", done: false },
  { id: 4, task: "Schedule photography", owner: "Agent", due: "2026-05-29", done: false },
];

const initialSpend = [
  { id: 1, date: "2026-04-10", vendor: "ABC Demo", amount: 4500, note: "Deposit" },
  { id: 2, date: "2026-04-12", vendor: "Flooring Outlet", amount: 3200, note: "Materials" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("budget");
  const [propertyName, setPropertyName] = useState("123 Palm Ave");
  const [address, setAddress] = useState("San Jose, CA");
  const [purchasePrice, setPurchasePrice] = useState("850000");
  const [arv, setArv] = useState("1250000");
  const [targetProfit, setTargetProfit] = useState("125000");
  const [status, setStatus] = useState("Renovation");
  const [startDate, setStartDate] = useState("2026-04-10");
  const [listDate, setListDate] = useState("2026-06-15");
  const [notes, setNotes] = useState("Focus on kitchen, baths, curb appeal, and fast timeline.");
  const [budgetItems, setBudgetItems] = useState(initialBudget);
  const [tasks, setTasks] = useState(initialTasks);
  const [spendItems, setSpendItems] = useState(initialSpend);

  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newVendor, setNewVendor] = useState("");
  const [newSpendAmount, setNewSpendAmount] = useState("");
  const [newSpendDate, setNewSpendDate] = useState("");
  const [newSpendNote, setNewSpendNote] = useState("");

  const totalBudget = useMemo(() => budgetItems.reduce((sum, item) => sum + Number(item.amount || 0), 0), [budgetItems]);
  const totalSpent = useMemo(() => spendItems.reduce((sum, item) => sum + Number(item.amount || 0), 0), [spendItems]);
  const remainingBudget = totalBudget - totalSpent;
  const projectedProfit = Number(arv || 0) - totalBudget;
  const profitGap = projectedProfit - Number(targetProfit || 0);
  const budgetUsedPct = totalBudget ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const completedTasks = tasks.filter((t) => t.done).length;
  const taskPct = tasks.length ? (completedTasks / tasks.length) * 100 : 0;
  const dealHealth =
    projectedProfit >= Number(targetProfit || 0) ? "On Track" : projectedProfit > 0 ? "Tight" : "At Risk";

  const sanitizeNumber = (val) => val.replace(/[^0-9.]/g, "");

  const addBudgetItem = () => {
    if (!newCategory || !newAmount) return;
    setBudgetItems([...budgetItems, { category: newCategory, amount: Number(newAmount) }]);
    setNewCategory("");
    setNewAmount("");
  };

  const addTask = () => {
    if (!newTask) return;
    setTasks([...tasks, { id: Date.now(), task: newTask, owner: newOwner || "Unassigned", due: newDue || "", done: false }]);
    setNewTask("");
    setNewOwner("");
    setNewDue("");
  };

  const addSpend = () => {
    if (!newVendor || !newSpendAmount) return;
    setSpendItems([...spendItems, { id: Date.now(), date: newSpendDate || "", vendor: newVendor, amount: Number(newSpendAmount), note: newSpendNote }]);
    setNewVendor("");
    setNewSpendAmount("");
    setNewSpendDate("");
    setNewSpendNote("");
  };

  return (
    <div style={{ minHeight: "100vh", padding: 16, background: "#f8fafc", color: "#0f172a", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={styles.hero}>
          <div>
            <div style={styles.muted}>Flip Project Dashboard</div>
            <h1 style={{ margin: "6px 0 0", fontSize: 34 }}>{propertyName}</h1>
            <div style={{ ...styles.muted, marginTop: 6 }}>{address}</div>
          </div>
          <div style={styles.badgeWrap}>
            <span style={styles.badge}>{status}</span>
            <span style={dealHealth === "On Track" ? styles.badgeDark : styles.badge}>{dealHealth}</span>
          </div>
        </div>

        <div style={styles.grid4}>
          <MetricCard title="Projected Sale" value={currency(arv)} icon={<TrendingUp size={20} />} subtext="After repair value" />
          <MetricCard title="Total Budget" value={currency(totalBudget)} icon={<Hammer size={20} />} subtext="All-in projected cost" />
          <MetricCard title="Spent So Far" value={currency(totalSpent)} icon={<DollarSign size={20} />} subtext={`${budgetUsedPct.toFixed(0)}% of budget used`} />
          <MetricCard title="Projected Profit" value={currency(projectedProfit)} icon={<Home size={20} />} subtext={profitGap >= 0 ? `${currency(profitGap)} above target` : `${currency(Math.abs(profitGap))} below target`} />
        </div>

        <div style={styles.gridMain}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Project Snapshot</div>
            <div style={styles.formGrid}>
              <Field label="Property Name"><input style={styles.input} value={propertyName} onChange={(e) => setPropertyName(e.target.value)} /></Field>
              <Field label="Address"><input style={styles.input} value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
              <Field label="Purchase Price"><input style={styles.input} value={purchasePrice} onChange={(e) => setPurchasePrice(sanitizeNumber(e.target.value))} /></Field>
              <Field label="ARV"><input style={styles.input} value={arv} onChange={(e) => setArv(sanitizeNumber(e.target.value))} /></Field>
              <Field label="Target Profit"><input style={styles.input} value={targetProfit} onChange={(e) => setTargetProfit(sanitizeNumber(e.target.value))} /></Field>
              <Field label="Status">
                <select style={styles.input} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>Lead</option>
                  <option>Under Contract</option>
                  <option>Renovation</option>
                  <option>Listed</option>
                  <option>Sold</option>
                </select>
              </Field>
              <Field label="Start Date"><input type="date" style={styles.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
              <Field label="Target List Date"><input type="date" style={styles.input} value={listDate} onChange={(e) => setListDate(e.target.value)} /></Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Notes"><textarea style={{ ...styles.input, minHeight: 100, resize: "vertical" }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Progress</div>
            <ProgressBlock label="Budget used" value={`${budgetUsedPct.toFixed(0)}%`} pct={budgetUsedPct} detail={`Remaining budget: ${currency(remainingBudget)}`} />
            <ProgressBlock label="Tasks completed" value={`${completedTasks}/${tasks.length}`} pct={taskPct} />
            <div style={styles.warnBox}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, marginBottom: 8 }}>
                <AlertTriangle size={16} /> Deal Check
              </div>
              <div>
                {dealHealth === "On Track"
                  ? "Profit target is currently being met based on your entered numbers."
                  : dealHealth === "Tight"
                  ? "This deal still shows profit, but it is below your target. Watch rehab and holding costs closely."
                  : "Current numbers show risk. Revisit scope, price, or exit strategy."}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.tabRow}>
            {["budget", "tasks", "spend"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? styles.activeTab : styles.tab}>
                {tab === "budget" ? "Budget" : tab === "tasks" ? "Tasks" : "Spend Log"}
              </button>
            ))}
          </div>

          {activeTab === "budget" && (
            <>
              <div style={styles.toolbar}>
                <div style={styles.cardTitle}>Budget Breakdown</div>
                <div style={styles.inlineForm}>
                  <input style={styles.input} placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                  <input style={styles.input} placeholder="Amount" value={newAmount} onChange={(e) => setNewAmount(sanitizeNumber(e.target.value))} />
                  <button style={styles.button} onClick={addBudgetItem}><Plus size={16} /> Add Item</button>
                </div>
              </div>
              <DataTable
                headers={["Category", "Amount", ""]}
                rows={budgetItems.map((item, index) => [
                  <input key={`cat-${index}`} style={styles.input} value={item.category} onChange={(e) => {
                    const copy = [...budgetItems];
                    copy[index].category = e.target.value;
                    setBudgetItems(copy);
                  }} />,
                  <input key={`amt-${index}`} style={{ ...styles.input, textAlign: "right" }} value={item.amount} onChange={(e) => {
                    const copy = [...budgetItems];
                    copy[index].amount = Number(sanitizeNumber(e.target.value));
                    setBudgetItems(copy);
                  }} />,
                  <button key={`del-${index}`} style={styles.iconButton} onClick={() => setBudgetItems(budgetItems.filter((_, i) => i !== index))}><Trash2 size={16} /></button>,
                ])}
              />
            </>
          )}

          {activeTab === "tasks" && (
            <>
              <div style={styles.inlineForm}>
                <input style={styles.input} placeholder="Task" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
                <input style={styles.input} placeholder="Owner" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
                <input type="date" style={styles.input} value={newDue} onChange={(e) => setNewDue(e.target.value)} />
                <button style={styles.button} onClick={addTask}><Plus size={16} /> Add Task</button>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {tasks.map((task) => (
                  <div key={task.id} style={styles.taskRow}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <input type="checkbox" checked={task.done} onChange={(e) => setTasks(tasks.map((t) => (t.id === task.id ? { ...t, done: e.target.checked } : t)))} />
                      <div>
                        <div style={{ fontWeight: 600, textDecoration: task.done ? "line-through" : "none", color: task.done ? "#94a3b8" : "inherit" }}>{task.task}</div>
                        <div style={styles.muted}>{task.owner} • {task.due || "No due date"}</div>
                      </div>
                    </div>
                    <button style={styles.iconButton} onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "spend" && (
            <>
              <div style={styles.inlineForm}>
                <input style={styles.input} placeholder="Vendor" value={newVendor} onChange={(e) => setNewVendor(e.target.value)} />
                <input style={styles.input} placeholder="Amount" value={newSpendAmount} onChange={(e) => setNewSpendAmount(sanitizeNumber(e.target.value))} />
                <input type="date" style={styles.input} value={newSpendDate} onChange={(e) => setNewSpendDate(e.target.value)} />
                <input style={styles.input} placeholder="Note" value={newSpendNote} onChange={(e) => setNewSpendNote(e.target.value)} />
                <button style={styles.button} onClick={addSpend}><Plus size={16} /> Add Spend</button>
              </div>
              <DataTable
                headers={["Date", "Vendor", "Note", "Amount", ""]}
                rows={spendItems.map((draw) => [
                  draw.date || "—",
                  draw.vendor,
                  draw.note || "—",
                  <div style={{ textAlign: "right" }}>{currency(draw.amount)}</div>,
                  <button style={styles.iconButton} onClick={() => setSpendItems(spendItems.filter((d) => d.id !== draw.id))}><Trash2 size={16} /></button>,
                ])}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, subtext }) {
  return (
    <div style={styles.metricCard}>
      <div>
        <div style={styles.muted}>{title}</div>
        <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{value}</div>
        <div style={{ ...styles.muted, fontSize: 12, marginTop: 4 }}>{subtext}</div>
      </div>
      <div style={styles.metricIcon}>{icon}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

function ProgressBlock({ label, value, pct, detail }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${pct}%` }} />
      </div>
      {detail ? <div style={{ ...styles.muted, fontSize: 12, marginTop: 8 }}>{detail}</div> : null}
    </div>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i} style={styles.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>{row.map((cell, c) => <td key={c} style={styles.td}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  hero: { background: "white", borderRadius: 24, padding: 24, boxShadow: "0 2px 10px rgba(15,23,42,0.05)", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" },
  badgeWrap: { display: "flex", gap: 8, flexWrap: "wrap" },
  badge: { background: "#f1f5f9", padding: "8px 14px", borderRadius: 999, fontSize: 14, fontWeight: 600 },
  badgeDark: { background: "#111827", color: "white", padding: "8px 14px", borderRadius: 999, fontSize: 14, fontWeight: 600 },
  grid4: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" },
  gridMain: { display: "grid", gap: 16, gridTemplateColumns: "2fr 1fr" },
  card: { background: "white", borderRadius: 24, padding: 24, boxShadow: "0 2px 10px rgba(15,23,42,0.05)" },
  cardTitle: { fontSize: 20, fontWeight: 700, marginBottom: 16 },
  formGrid: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" },
  input: { width: "100%", padding: "12px 14px", borderRadius: 14, border: "1px solid #e2e8f0", background: "white" },
  metricCard: { background: "white", borderRadius: 24, padding: 24, boxShadow: "0 2px 10px rgba(15,23,42,0.05)", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  metricIcon: { background: "#f1f5f9", padding: 12, borderRadius: 16, color: "#334155" },
  muted: { color: "#64748b", fontSize: 14 },
  progressTrack: { width: "100%", height: 10, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", background: "#111827", borderRadius: 999 },
  warnBox: { background: "#fef3c7", color: "#92400e", borderRadius: 18, padding: 16, fontSize: 14 },
  tabRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 },
  tab: { border: "1px solid #e2e8f0", background: "#f8fafc", padding: "12px 14px", borderRadius: 16 },
  activeTab: { border: "1px solid #111827", background: "#111827", color: "white", padding: "12px 14px", borderRadius: 16 },
  toolbar: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 },
  inlineForm: { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", marginBottom: 16 },
  button: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#111827", color: "white", border: "none", padding: "12px 16px", borderRadius: 14 },
  iconButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid #e2e8f0", padding: 10, borderRadius: 12 },
  taskRow: { display: "flex", justifyContent: "space-between", gap: 12, padding: 16, border: "1px solid #e2e8f0", borderRadius: 18, alignItems: "center" },
  th: { textAlign: "left", fontSize: 14, color: "#64748b", padding: "12px 8px", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "12px 8px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" },
};
