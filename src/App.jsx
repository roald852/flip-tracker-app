import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

const STORAGE_KEY = "flip-tracker-properties-v2";

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

export default function App() {
  const [properties, setProperties] = useState(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!saved) return initialProperties;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length ? parsed : initialProperties;
    } catch {
      return initialProperties;
    }
  });

  const [selectedId, setSelectedId] = useState(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!saved) return initialProperties[0].id;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length ? parsed[0].id : initialProperties[0].id;
    } catch {
      return initialProperties[0].id;
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    }
  }, [properties]);

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
    if (filtered.length) setSelectedId(filtered[0].id);
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
    return (
      <div style={styles.page}>
        <div style={styles.emptyCard}>
          <h1 style={{ margin: 0 }}>Flip Dashboard</h1>
          <button style={styles.button} onClick={addProperty}>
            <Plus size={16} /> Add Property
          </button>
        </div>
      </div>
    );
  }

  const daysHeld = calcDaysHeld(selectedProperty.purchaseDate, selectedProperty.saleDate);
  const interest = toNumber(selectedProperty.dailyInterest) * daysHeld;
  const holdingSubTotal =
    toNumber(selectedProperty.holdingCostsBase) +
    selectedProperty.holdingCostItems.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const extraCosts = selectedProperty.extraLineItems.reduce(
    (sum, item) => sum + toNumber(item.amount),
    0
  );

  const totalExpenses =
    toNumber(selectedProperty.closingCosts) +
    toNumber(selectedProperty.loanPoints) +
    toNumber(selectedProperty.propertyTaxes) +
    toNumber(selectedProperty.insurance) +
    toNumber(selectedProperty.rehabLabor) +
    toNumber(selectedProperty.rehabMaterials) +
    holdingSubTotal +
    toNumber(selectedProperty.sellingCosts) +
    interest +
    extraCosts;

  const totalProjectCost = totalExpenses + toNumber(selectedProperty.purchasePrice);
  const profit =
    toNumber(selectedProperty.salesPrice) -
    (totalExpenses + toNumber(selectedProperty.purchasePrice));
  const profitMargin = toNumber(selectedProperty.salesPrice)
    ? profit / toNumber(selectedProperty.salesPrice)
    : 0;
  const dailyProfit = daysHeld ? profit / daysHeld : 0;
  const cashOnCashReturn = toNumber(selectedProperty.cashInvested)
    ? profit / toNumber(selectedProperty.cashInvested)
    : 0;
  const internalRateOfReturn = (() => {
    const cashInvested = toNumber(selectedProperty.cashInvested);
    if (!cashInvested || !daysHeld) return 0;
    const periodReturn = profit / cashInvested;
    if (1 + periodReturn <= 0) return 0;
    const annualFactor = 365 / daysHeld;
    return Math.pow(1 + periodReturn, annualFactor) - 1;
  })();

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <aside style={styles.sidebarCard}>
          <div style={styles.sidebarHeader}>
            <h2 style={{ margin: 0 }}>Dashboard</h2>
            <button style={styles.smallButton} onClick={addProperty}>
              <Plus size={16} /> Add
            </button>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {properties.map((property) => (
              <button
                key={property.id}
                onClick={() => setSelectedId(property.id)}
                style={property.id === selectedId ? styles.propertyActive : styles.propertyButton}
              >
                <div style={styles.propertyRow}>
                  <span style={{ fontWeight: 600 }}>{property.name || "Untitled Property"}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProperty(property.id);
                    }}
                    style={styles.iconWrap}
                  >
                    <Trash2 size={16} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main style={{ display: "grid", gap: 18 }}>
          <div style={styles.detailHeader}>
            <ArrowLeft size={16} />
            <span>Property details</span>
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
                  <div style={styles.label}>Sold</div>
                  <div style={styles.helpText}>
                    When off, sale date stays on today. When on, you can set the actual sale date.
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
                  <div style={styles.readonly}>{daysHeld}</div>
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
                  <div style={styles.readonly}>{currency(interest)}</div>
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
                  <div style={styles.readonlyStrong}>{currency(totalExpenses)}</div>
                </Field>
                <Field label="Total Project Cost">
                  <div style={styles.readonlyStrong}>{currency(totalProjectCost)}</div>
                </Field>
                <Field label="Profit">
                  <div style={styles.readonlyStrong}>{currency(profit)}</div>
                </Field>
                <MoneyField label="Cash Invested" value={selectedProperty.cashInvested} onChange={(value) => updateProperty(selectedProperty.id, "cashInvested", value)} />
                <Field label="Cash on Cash Return">
                  <div style={styles.readonlyStrong}>{(cashOnCashReturn * 100).toFixed(2)}%</div>
                </Field>
                <Field label="Profit Margin %">
                  <div style={styles.readonlyStrong}>{(profitMargin * 100).toFixed(2)}%</div>
                </Field>
                <Field label="Daily Profit">
                  <div style={styles.readonlyStrong}>{currency(dailyProfit)}</div>
                </Field>
                <Field label="Internal Rate of Return">
                  <div style={styles.readonlyStrong}>
                    {Number.isFinite(internalRateOfReturn) ? `${(internalRateOfReturn * 100).toFixed(2)}%` : "—"}
                  </div>
                </Field>
              </div>
            </Section>
          </section>
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <div>
        <h3 style={styles.sectionTitle}>{title}</h3>
      </div>
      <div style={{ display: "grid", gap: 16 }}>{children}</div>
    </section>
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
      <input style={styles.input} value={String(value ?? "")} onChange={(e) => onChange(sanitizeMoney(e.target.value))} />
    </Field>
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
                    <input style={styles.input} value={item.name} onChange={(e) => onNameChange(item.id, e.target.value)} />
                  </td>
                  <td style={styles.td}>
                    <input style={styles.input} value={item.amount} onChange={(e) => onAmountChange(item.id, sanitizeMoney(e.target.value))} />
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
  layout: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "grid",
    gap: 24,
    gridTemplateColumns: "320px 1fr",
  },
  emptyCard: {
    maxWidth: 900,
    margin: "0 auto",
    background: "white",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sidebarCard: {
    background: "white",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
    height: "fit-content",
    position: "sticky",
    top: 16,
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  propertyButton: {
    width: "100%",
    textAlign: "left",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: "14px 16px",
    cursor: "pointer",
  },
  propertyActive: {
    width: "100%",
    textAlign: "left",
    background: "#0f172a",
    color: "white",
    border: "1px solid #0f172a",
    borderRadius: 16,
    padding: "14px 16px",
    cursor: "pointer",
  },
  propertyRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  iconWrap: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#475569",
    fontSize: 14,
  },
  card: {
    background: "white",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
    display: "grid",
    gap: 28,
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
