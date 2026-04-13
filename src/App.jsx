import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

const STORAGE_KEY = "flip-tracker-properties-v3";
const TITLE_KEY = "flip-tracker-dashboard-title-v1";

const currency = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const sanitizeMoney = (value) => value.replace(/[^0-9.]/g, "");
const todayString = () => new Date().toISOString().slice(0, 10);
const toNumber = (value) => Number(value || 0);

const calcDaysHeld = (purchaseDate, saleDate) => {
  if (!purchaseDate || !saleDate) return 0;
  const start = new Date(`${purchaseDate}T00:00:00`);
  const end = new Date(`${saleDate}T00:00:00`);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const createProperty = (name = "New Property") => ({
  id: Date.now() + Math.random(),
  name,
  address: "",
  purchaseDate: "",
  saleDate: todayString(),
  purchasePrice: "",
  closingCosts: "",
  loanPoints: "",
  propertyTaxes: "",
  insurance: "",
  rehabLabor: "",
  rehabMaterials: "",
  holdingCostsBase: "",
  holdingCostItems: [],
  sellingCosts: "",
  dailyInterest: "",
  extraLineItems: [],
  salesPrice: "",
  cashInvested: "",
  isSold: false,
});

const initialProperties = [createProperty("123 Palm Ave")];

function portfolioMetrics(property) {
  const daysHeld = calcDaysHeld(property.purchaseDate, property.saleDate);
  const interest = toNumber(property.dailyInterest) * daysHeld;
  const holdingSubTotal =
    toNumber(property.holdingCostsBase) +
    property.holdingCostItems.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const extraCosts = property.extraLineItems.reduce((sum, item) => sum + toNumber(item.amount), 0);

  const totalExpenses =
    toNumber(property.closingCosts) +
    toNumber(property.loanPoints) +
    toNumber(property.propertyTaxes) +
    toNumber(property.insurance) +
    toNumber(property.rehabLabor) +
    toNumber(property.rehabMaterials) +
    holdingSubTotal +
    toNumber(property.sellingCosts) +
    interest +
    extraCosts;

  const totalProjectCost = totalExpenses + toNumber(property.purchasePrice);
  const profit = toNumber(property.salesPrice) - totalProjectCost;
  const profitMargin = toNumber(property.salesPrice) ? profit / toNumber(property.salesPrice) : 0;
  const cashOnCashReturn = toNumber(property.cashInvested)
    ? profit / toNumber(property.cashInvested)
    : 0;
  const annualizedDailyProfit = daysHeld ? (profit / daysHeld) * 365 : 0;
  const annualizedReturn = (() => {
    const cashInvested = toNumber(property.cashInvested);
    if (!cashInvested || !daysHeld) return 0;
    const periodReturn = profit / cashInvested;
    if (1 + periodReturn <= 0) return 0;
    const annualFactor = 365 / daysHeld;
    return Math.pow(1 + periodReturn, annualFactor) - 1;
  })();

  return {
    daysHeld,
    interest,
    totalExpenses,
    totalProjectCost,
    profit,
    profitMargin,
    cashOnCashReturn,
    annualizedDailyProfit,
    annualizedReturn,
  };
}

export default function App() {
  const [properties, setProperties] = useState(() => {
    if (typeof window === "undefined") return initialProperties;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialProperties;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length ? parsed : initialProperties;
    } catch {
      return initialProperties;
    }
  });

  const [dashboardTitle, setDashboardTitle] = useState(() => {
    if (typeof window === "undefined") return "Flip Dashboard";
    return window.localStorage.getItem(TITLE_KEY) || "Flip Dashboard";
  });

  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    }
  }, [properties]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TITLE_KEY, dashboardTitle);
    }
  }, [dashboardTitle]);

  const selectedProperty = properties.find((p) => p.id === selectedId) || null;

  const updateProperty = (id, field, value) => {
    setProperties((prev) =>
      prev.map((property) => {
        if (property.id !== id) return property;
        const next = { ...property, [field]: value };
        if (field === "isSold") {
          next.saleDate = value ? property.saleDate || todayString() : todayString();
        }
        if (!next.isSold) {
          next.saleDate = todayString();
        }
        return next;
      })
    );
  };

  const updateHoldingItem = (id, itemId, field, value) => {
    setProperties((prev) =>
      prev.map((property) =>
        property.id === id
          ? {
              ...property,
              holdingCostItems: property.holdingCostItems.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
              ),
            }
          : property
      )
    );
  };

  const updateExtraItem = (id, itemId, field, value) => {
    setProperties((prev) =>
      prev.map((property) =>
        property.id === id
          ? {
              ...property,
              extraLineItems: property.extraLineItems.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
              ),
            }
          : property
      )
    );
  };

  const addProperty = () => {
    const newProperty = createProperty(`Property ${properties.length + 1}`);
    setProperties((prev) => [...prev, newProperty]);
    setSelectedId(newProperty.id);
  };

  const deleteProperty = (id) => {
    const filtered = properties.filter((property) => property.id !== id);
    setProperties(filtered);
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const addHoldingCostItem = (id) => {
    setProperties((prev) =>
      prev.map((property) =>
        property.id === id
          ? {
              ...property,
              holdingCostItems: [
                ...property.holdingCostItems,
                { id: Date.now() + Math.random(), name: "", amount: "" },
              ],
            }
          : property
      )
    );
  };

  const removeHoldingCostItem = (id, itemId) => {
    setProperties((prev) =>
      prev.map((property) =>
        property.id === id
          ? {
              ...property,
              holdingCostItems: property.holdingCostItems.filter((item) => item.id !== itemId),
            }
          : property
      )
    );
  };

  const addExtraLineItem = (id) => {
    setProperties((prev) =>
      prev.map((property) =>
        property.id === id
          ? {
              ...property,
              extraLineItems: [
                ...property.extraLineItems,
                { id: Date.now() + Math.random(), name: "", amount: "" },
              ],
            }
          : property
      )
    );
  };

  const removeExtraLineItem = (id, itemId) => {
    setProperties((prev) =>
      prev.map((property) =>
        property.id === id
          ? {
              ...property,
              extraLineItems: property.extraLineItems.filter((item) => item.id !== itemId),
            }
          : property
      )
    );
  };

  if (!selectedProperty) {
    const portfolio = properties.map((property) => ({
      ...property,
      ...portfolioMetrics(property),
    }));

    const totalProfit = portfolio.reduce((sum, p) => sum + p.profit, 0);
    const totalSales = portfolio.reduce((sum, p) => sum + toNumber(p.salesPrice), 0);
    const totalCashInvested = portfolio.reduce((sum, p) => sum + toNumber(p.cashInvested), 0);
    const portfolioProfitMargin = totalSales ? totalProfit / totalSales : 0;
    const portfolioCoC = totalCashInvested ? totalProfit / totalCashInvested : 0;
    const portfolioAnnualizedDailyProfit = portfolio.reduce(
      (sum, p) => sum + p.annualizedDailyProfit,
      0
    );

    return (
      <div style={styles.page}>
        <div style={styles.dashboardWrap}>
          <div style={styles.card}>
            <div style={styles.topRow}>
              <div style={{ flex: 1, maxWidth: 500 }}>
                <Field label="Dashboard Title">
                  <input
                    style={styles.input}
                    value={dashboardTitle}
                    onChange={(e) => setDashboardTitle(e.target.value)}
                  />
                </Field>
              </div>
              <button style={styles.button} onClick={addProperty}>
                <Plus size={16} /> Add Property
              </button>
            </div>

            <h1 style={styles.dashboardTitle}>{dashboardTitle || "Flip Dashboard"}</h1>

            <div style={styles.cardGrid}>
              {portfolio.map((property) => (
                <button
                  key={property.id}
                  onClick={() => setSelectedId(property.id)}
                  style={styles.propertyCard}
                >
                  <div style={styles.propertyHeader}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      {property.name || "Untitled Property"}
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProperty(property.id);
                      }}
                      style={styles.deleteIcon}
                    >
                      <Trash2 size={16} />
                    </span>
                  </div>

                  <div style={styles.metricList}>
                    <MetricRow label="Purchase Price" value={currency(property.purchasePrice)} />
                    <MetricRow label="Sold Price" value={currency(property.salesPrice)} />
                    <MetricRow label="Profit" value={currency(property.profit)} />
                    <MetricRow
                      label="Profit Margin"
                      value={`${(property.profitMargin * 100).toFixed(2)}%`}
                    />
                    <MetricRow
                      label="CoC"
                      value={`${(property.cashOnCashReturn * 100).toFixed(2)}%`}
                    />
                    <div style={styles.metricRow}>
                      <span>Status</span>
                      <span style={property.isSold ? styles.badgeDark : styles.badgeLight}>
                        {property.isSold ? "Sold" : "Active"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div style={styles.summaryBox}>
              <div style={styles.summaryTitle}>Portfolio Summary</div>
              <div style={styles.summaryGrid}>
                <SummaryStat label="Total Profit" value={currency(totalProfit)} />
                <SummaryStat
                  label="Profit Margin"
                  value={`${(portfolioProfitMargin * 100).toFixed(2)}%`}
                />
                <SummaryStat
                  label="Cash on Cash Return"
                  value={`${(portfolioCoC * 100).toFixed(2)}%`}
                />
                <SummaryStat
                  label="Daily Profit on Yearly Basis"
                  value={currency(portfolioAnnualizedDailyProfit)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metrics = portfolioMetrics(selectedProperty);

  return (
    <div style={styles.page}>
      <div style={styles.detailWrap}>
        <div style={styles.backRow}>
          <button style={styles.linkButton} onClick={() => setSelectedId(null)}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div style={styles.smallMuted}>{dashboardTitle || "Flip Dashboard"}</div>
        </div>

        <section style={styles.card}>
          <h1 style={{ marginTop: 0 }}>{selectedProperty.name || "Property"}</h1>

          <Section title="Property Overview">
            <Field label="Property Name">
              <input
                style={styles.input}
                value={selectedProperty.name}
                onChange={(e) => updateProperty(selectedProperty.id, "name", e.target.value)}
              />
            </Field>

            <Field label="Property Address">
              <input
                style={styles.input}
                value={selectedProperty.address}
                onChange={(e) => updateProperty(selectedProperty.id, "address", e.target.value)}
              />
            </Field>

            <div style={styles.soldBar}>
              <div>
                <div style={styles.label}>Active / Sold</div>
                <div style={styles.helpText}>
                  When active, sale date stays on today. When sold, you can set the actual sale date.
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateProperty(selectedProperty.id, "isSold", !selectedProperty.isSold)}
                style={selectedProperty.isSold ? styles.toggleOn : styles.toggleOff}
              >
                <span style={selectedProperty.isSold ? styles.knobOn : styles.knobOff} />
              </button>
            </div>

            <div style={styles.grid3}>
              <Field label="Purchase Date">
                <input
                  type="date"
                  style={styles.input}
                  value={selectedProperty.purchaseDate}
                  onChange={(e) => updateProperty(selectedProperty.id, "purchaseDate", e.target.value)}
                />
              </Field>
              <Field label="Sale Date">
                <input
                  type="date"
                  style={styles.input}
                  value={selectedProperty.saleDate}
                  disabled={!selectedProperty.isSold}
                  onChange={(e) => updateProperty(selectedProperty.id, "saleDate", e.target.value)}
                />
              </Field>
              <Field label="Days Held">
                <div style={styles.readonly}>{metrics.daysHeld}</div>
              </Field>
            </div>
          </Section>

          <Section title="Acquisition and Carry">
            <div style={styles.grid2}>
              <MoneyField label="Purchase Price" value={selectedProperty.purchasePrice} onChange={(value) => updateProperty(selectedProperty.id, "purchasePrice", value)} />
              <MoneyField label="Closing Costs (Escrow and Title)" value={selectedProperty.closingCosts} onChange={(value) => updateProperty(selectedProperty.id, "closingCosts", value)} />
              <MoneyField label="Loan Points" value={selectedProperty.loanPoints} onChange={(value) => updateProperty(selectedProperty.id, "loanPoints", value)} />
              <MoneyField label="Property Taxes" value={selectedProperty.propertyTaxes} onChange={(value) => updateProperty(selectedProperty.id, "propertyTaxes", value)} />
              <MoneyField label="Insurance" value={selectedProperty.insurance} onChange={(value) => updateProperty(selectedProperty.id, "insurance", value)} />
              <MoneyField label="Holding Costs" value={selectedProperty.holdingCostsBase} onChange={(value) => updateProperty(selectedProperty.id, "holdingCostsBase", value)} />
            </div>

            <SubTable
              title="Holding Cost Subcategories"
              buttonLabel="Add Subcategory"
              rows={selectedProperty.holdingCostItems}
              onAdd={() => addHoldingCostItem(selectedProperty.id)}
              onRemove={(itemId) => removeHoldingCostItem(selectedProperty.id, itemId)}
              onNameChange={(itemId, value) => updateHoldingItem(selectedProperty.id, itemId, "name", value)}
              onAmountChange={(itemId, value) => updateHoldingItem(selectedProperty.id, itemId, "amount", value)}
            />
          </Section>

          <Section title="Rehab and Sale">
            <div style={styles.grid2}>
              <MoneyField label="Rehab Labor" value={selectedProperty.rehabLabor} onChange={(value) => updateProperty(selectedProperty.id, "rehabLabor", value)} />
              <MoneyField label="Rehab Materials" value={selectedProperty.rehabMaterials} onChange={(value) => updateProperty(selectedProperty.id, "rehabMaterials", value)} />
              <MoneyField label="Selling Costs" value={selectedProperty.sellingCosts} onChange={(value) => updateProperty(selectedProperty.id, "sellingCosts", value)} />
              <MoneyField label="Sales Price" value={selectedProperty.salesPrice} onChange={(value) => updateProperty(selectedProperty.id, "salesPrice", value)} />
            </div>
          </Section>

          <Section title="Interest and Other Costs">
            <div style={styles.grid2}>
              <MoneyField label="Daily Interest" value={selectedProperty.dailyInterest} onChange={(value) => updateProperty(selectedProperty.id, "dailyInterest", value)} />
              <Field label="Interest">
                <div style={styles.readonly}>{currency(metrics.interest)}</div>
              </Field>
            </div>

            <SubTable
              title="Other Costs"
              buttonLabel="Add Line Item"
              rows={selectedProperty.extraLineItems}
              onAdd={() => addExtraLineItem(selectedProperty.id)}
              onRemove={(itemId) => removeExtraLineItem(selectedProperty.id, itemId)}
              onNameChange={(itemId, value) => updateExtraItem(selectedProperty.id, itemId, "name", value)}
              onAmountChange={(itemId, value) => updateExtraItem(selectedProperty.id, itemId, "amount", value)}
            />
          </Section>

          <Section title="Returns Summary">
            <div style={styles.grid2}>
              <Field label="Total Expenses">
                <div style={styles.readonlyStrong}>{currency(metrics.totalExpenses)}</div>
              </Field>
              <Field label="Total Project Cost">
                <div style={styles.readonlyStrong}>{currency(metrics.totalProjectCost)}</div>
              </Field>
              <Field label="Profit">
                <div style={styles.readonlyStrong}>{currency(metrics.profit)}</div>
              </Field>
              <MoneyField label="Cash Invested" value={selectedProperty.cashInvested} onChange={(value) => updateProperty(selectedProperty.id, "cashInvested", value)} />
              <Field label="Cash on Cash Return">
                <div style={styles.readonlyStrong}>
                  {(metrics.cashOnCashReturn * 100).toFixed(2)}%
                </div>
              </Field>
              <Field label="Profit Margin %">
                <div style={styles.readonlyStrong}>
                  {(metrics.profitMargin * 100).toFixed(2)}%
                </div>
              </Field>
              <Field label="Daily Profit">
                <div style={styles.readonlyStrong}>
                  {currency(metrics.daysHeld ? metrics.profit / metrics.daysHeld : 0)}
                </div>
              </Field>
              <Field label="Annualized Return">
                <div style={styles.readonlyStrong}>
                  {Number.isFinite(metrics.annualizedReturn)
                    ? `${(metrics.annualizedReturn * 100).toFixed(2)}%`
                    : "—"}
                </div>
              </Field>
            </div>
          </Section>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

function MoneyField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <input
        style={styles.input}
        value={String(value ?? "")}
        onChange={(e) => onChange(sanitizeMoney(e.target.value))}
      />
    </Field>
  );
}

function MetricRow({ label, value }) {
  return (
    <div style={styles.metricRow}>
      <span>{label}</span>
      <span style={{ fontWeight: 600, color: "#0f172a" }}>{value}</span>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.smallMuted}>{label}</div>
      <div style={styles.summaryValue}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div style={{ display: "grid", gap: 16 }}>{children}</div>
    </section>
  );
}

function SubTable({ title, buttonLabel, rows, onAdd, onRemove, onNameChange, onAmountChange }) {
  return (
    <section style={styles.subCard}>
      <div style={styles.subHeader}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <button style={styles.smallButton} onClick={onAdd}>
          <Plus size={16} /> {buttonLabel}
        </button>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: "#64748b", marginBottom: 0 }}>No items yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.thSmall}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>
                    <input
                      style={styles.input}
                      value={String(item.name ?? "")}
                      onChange={(e) => onNameChange(item.id, e.target.value)}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      style={styles.input}
                      value={String(item.amount ?? "")}
                      onChange={(e) => onAmountChange(item.id, sanitizeMoney(e.target.value))}
                    />
                  </td>
                  <td style={styles.td}>
                    <button style={styles.iconButton} onClick={() => onRemove(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 16,
    color: "#0f172a",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  dashboardWrap: {
    maxWidth: 1400,
    margin: "0 auto",
  },
  detailWrap: {
    maxWidth: 980,
    margin: "0 auto",
    display: "grid",
    gap: 18,
  },
  card: {
    background: "white",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
    display: "grid",
    gap: 24,
  },
  topRow: {
    display: "flex",
    gap: 16,
    alignItems: "end",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  dashboardTitle: {
    margin: 0,
    fontSize: 34,
    fontWeight: 700,
  },
  cardGrid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  },
  propertyCard: {
    width: "100%",
    textAlign: "left",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
    cursor: "pointer",
  },
  propertyHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  deleteIcon: {
    display: "inline-flex",
    color: "#64748b",
  },
  metricList: {
    display: "grid",
    gap: 8,
    fontSize: 14,
    color: "#475569",
  },
  metricRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  badgeLight: {
    background: "#f1f5f9",
    color: "#0f172a",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  badgeDark: {
    background: "#0f172a",
    color: "white",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  summaryBox: {
    marginTop: 12,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 24,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
  },
  summaryGrid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  },
  summaryCard: {
    background: "white",
    borderRadius: 18,
    padding: 16,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 700,
  },
  backRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  linkButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "none",
    background: "transparent",
    color: "#475569",
    padding: 0,
    cursor: "pointer",
    fontSize: 14,
  },
  section: {
    display: "grid",
    gap: 16,
    paddingBottom: 28,
    borderBottom: "1px solid #f1f5f9",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  subCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: 18,
  },
  subHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
    flexWrap: "wrap",
  },
  grid2: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  },
  grid3: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: "#334155",
  },
  helpText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  smallMuted: {
    fontSize: 14,
    color: "#64748b",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    background: "white",
    fontSize: 14,
  },
  readonly: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    background: "#f8fafc",
    padding: "12px 14px",
    fontWeight: 600,
  },
  readonlyStrong: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    background: "#f8fafc",
    padding: "12px 14px",
    fontWeight: 700,
  },
  soldBar: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    background: "#f8fafc",
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  toggleOff: {
    width: 52,
    height: 30,
    borderRadius: 999,
    border: "none",
    background: "#cbd5e1",
    position: "relative",
    cursor: "pointer",
    padding: 0,
  },
  toggleOn: {
    width: 52,
    height: 30,
    borderRadius: 999,
    border: "none",
    background: "#0f172a",
    position: "relative",
    cursor: "pointer",
    padding: 0,
  },
  knobOff: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "white",
    position: "absolute",
    top: 3,
    left: 3,
  },
  knobOn: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "white",
    position: "absolute",
    top: 3,
    left: 25,
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 16px",
    borderRadius: 14,
    border: "none",
    background: "#0f172a",
    color: "white",
    cursor: "pointer",
  },
  smallButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 14,
    border: "none",
    background: "#0f172a",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
  },
  iconButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    fontSize: 13,
    color: "#64748b",
    padding: "10px 8px",
    borderBottom: "1px solid #e2e8f0",
  },
  thSmall: {
    width: 50,
    textAlign: "left",
    fontSize: 13,
    color: "#64748b",
    padding: "10px 8px",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "10px 8px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  },
};
