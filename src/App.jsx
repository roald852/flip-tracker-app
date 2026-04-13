
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";

const STORAGE_KEY = "flip-tracker-properties-v5";
const TITLE_KEY = "flip-tracker-dashboard-title-v3";

const currency = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const percent = (n) => `${(Number(n || 0) * 100).toFixed(2)}%`;

const formatNumberInput = (value) => {
  if (value === "" || value == null) return "";
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

const sanitizeMoney = (value) => {
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
};

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

const createDealAnalyzer = () => ({
  purchasePrice: "850000",
  closingCosts: "18000",
  rehabLabor: "40000",
  rehabMaterials: "30000",
  holdingCosts: "25000",
  sellingCosts: "50000",
  dailyInterest: "250",
  daysHeld: "180",
  salesPrice: "1250000",
  cashInvested: "200000",
});

function propertyMetrics(property) {
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
    annualizedReturn,
  };
}

function analyzerMetrics(deal) {
  const daysHeld = toNumber(deal.daysHeld);
  const interest = toNumber(deal.dailyInterest) * daysHeld;
  const totalExpenses =
    toNumber(deal.closingCosts) +
    toNumber(deal.rehabLabor) +
    toNumber(deal.rehabMaterials) +
    toNumber(deal.holdingCosts) +
    toNumber(deal.sellingCosts) +
    interest;
  const totalProjectCost = totalExpenses + toNumber(deal.purchasePrice);
  const profit = toNumber(deal.salesPrice) - totalProjectCost;
  const profitMargin = toNumber(deal.salesPrice) ? profit / toNumber(deal.salesPrice) : 0;
  const coc = toNumber(deal.cashInvested) ? profit / toNumber(deal.cashInvested) : 0;
  const annualizedReturn =
    toNumber(deal.cashInvested) && daysHeld
      ? Math.pow(1 + profit / toNumber(deal.cashInvested), 365 / daysHeld) - 1
      : 0;

  return {
    interest,
    totalExpenses,
    totalProjectCost,
    profit,
    profitMargin,
    coc,
    annualizedReturn,
    dailyProfit: profit / 365,
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

  const [title, setTitle] = useState(() => {
    if (typeof window === "undefined") return "Flip Dashboard";
    return window.localStorage.getItem(TITLE_KEY) || "Flip Dashboard";
  });

  const [page, setPage] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [dealAnalyzer, setDealAnalyzer] = useState(createDealAnalyzer);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    }
  }, [properties]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TITLE_KEY, title);
    }
  }, [title]);

  const selectedProperty = properties.find((p) => p.id === selectedId) || null;

  const updateProperty = (id, field, value) => {
    setProperties((prev) =>
      prev.map((property) => {
        if (property.id !== id) return property;
        const next = { ...property, [field]: value };
        if (field === "isSold") {
          next.saleDate = value ? property.saleDate || todayString() : todayString();
        }
        if (!next.isSold) next.saleDate = todayString();
        return next;
      })
    );
  };

  const addProperty = () => {
    const newProperty = createProperty(`Property ${properties.length + 1}`);
    setProperties((prev) => [...prev, newProperty]);
    setSelectedId(newProperty.id);
    setPage("property");
  };

  const deleteProperty = (id) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setPage("dashboard");
    }
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

  const updateDealAnalyzer = (field, value) => {
    setDealAnalyzer((prev) => ({ ...prev, [field]: value }));
  };

  if (page === "deal_analyzer") {
    const m = analyzerMetrics(dealAnalyzer);
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <Button variant="ghost" onClick={() => setPage("dashboard")} className="rounded-2xl px-0 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>

          <div className="rounded-3xl bg-white p-6 shadow-sm space-y-8">
            <h1 className="text-2xl font-bold">Deal Analyzer</h1>

            <Section title="Inputs">
              <div className="grid gap-4 md:grid-cols-2">
                <MoneyField label="Purchase Price" value={dealAnalyzer.purchasePrice} onChange={(v) => updateDealAnalyzer("purchasePrice", v)} />
                <MoneyField label="Closing Costs" value={dealAnalyzer.closingCosts} onChange={(v) => updateDealAnalyzer("closingCosts", v)} />
                <MoneyField label="Rehab Labor" value={dealAnalyzer.rehabLabor} onChange={(v) => updateDealAnalyzer("rehabLabor", v)} />
                <MoneyField label="Rehab Materials" value={dealAnalyzer.rehabMaterials} onChange={(v) => updateDealAnalyzer("rehabMaterials", v)} />
                <MoneyField label="Holding Costs" value={dealAnalyzer.holdingCosts} onChange={(v) => updateDealAnalyzer("holdingCosts", v)} />
                <MoneyField label="Selling Costs" value={dealAnalyzer.sellingCosts} onChange={(v) => updateDealAnalyzer("sellingCosts", v)} />
                <MoneyField label="Daily Interest" value={dealAnalyzer.dailyInterest} onChange={(v) => updateDealAnalyzer("dailyInterest", v)} />
                <MoneyField label="Days Held" value={dealAnalyzer.daysHeld} onChange={(v) => updateDealAnalyzer("daysHeld", v)} />
                <MoneyField label="Sales Price" value={dealAnalyzer.salesPrice} onChange={(v) => updateDealAnalyzer("salesPrice", v)} />
                <MoneyField label="Cash Invested" value={dealAnalyzer.cashInvested} onChange={(v) => updateDealAnalyzer("cashInvested", v)} />
              </div>
            </Section>

            <Section title="Deal Analyzer Results">
              <div className="grid gap-4 md:grid-cols-2">
                <ReadOnlyField label="Interest" value={currency(m.interest)} />
                <ReadOnlyField label="Total Expenses" value={currency(m.totalExpenses)} />
                <ReadOnlyField label="Total Project Cost" value={currency(m.totalProjectCost)} />
                <ReadOnlyField label="Profit" value={currency(m.profit)} />
                <ReadOnlyField label="Profit Margin" value={percent(m.profitMargin)} />
                <ReadOnlyField label="Cash on Cash Return" value={percent(m.coc)} />
                <ReadOnlyField label="Daily Profit" value={currency(m.dailyProfit)} />
                <ReadOnlyField label="Annualized Return" value={percent(m.annualizedReturn)} />
              </div>
            </Section>
          </div>
        </div>
      </div>
    );
  }

  if (page === "property" && selectedProperty) {
    const metrics = propertyMetrics(selectedProperty);

    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <Button variant="ghost" onClick={() => setPage("dashboard")} className="rounded-2xl px-0 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>

          <div className="rounded-3xl bg-white p-6 shadow-sm space-y-8">
            <h1 className="text-2xl font-bold">{selectedProperty.name || "Property"}</h1>

            <Section title="Property Overview">
              <Field label="Property Name">
                <input className={inputClass} value={selectedProperty.name} onChange={(e) => updateProperty(selectedProperty.id, "name", e.target.value)} />
              </Field>
              <Field label="Property Address">
                <input className={inputClass} value={selectedProperty.address} onChange={(e) => updateProperty(selectedProperty.id, "address", e.target.value)} />
              </Field>
              <div className="flex items-center justify-between rounded-2xl border bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-700">Active / Sold</div>
                  <div className="text-xs text-slate-500">When active, sale date stays on today. When sold, you can set the actual sale date.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateProperty(selectedProperty.id, "isSold", !selectedProperty.isSold)}
                  className={`relative h-8 w-14 rounded-full transition ${selectedProperty.isSold ? "bg-slate-900" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${selectedProperty.isSold ? "left-7" : "left-1"}`} />
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Purchase Date">
                  <input type="date" className={inputClass} value={selectedProperty.purchaseDate} onChange={(e) => updateProperty(selectedProperty.id, "purchaseDate", e.target.value)} />
                </Field>
                <Field label="Sale Date">
                  <input type="date" className={inputClass} value={selectedProperty.saleDate} disabled={!selectedProperty.isSold} onChange={(e) => updateProperty(selectedProperty.id, "saleDate", e.target.value)} />
                </Field>
                <ReadOnlyField label="Days Held" value={metrics.daysHeld} />
              </div>
            </Section>

            <Section title="Acquisition and Carry">
              <div className="grid gap-4 md:grid-cols-2">
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
              <div className="grid gap-4 md:grid-cols-2">
                <MoneyField label="Rehab Labor" value={selectedProperty.rehabLabor} onChange={(value) => updateProperty(selectedProperty.id, "rehabLabor", value)} />
                <MoneyField label="Rehab Materials" value={selectedProperty.rehabMaterials} onChange={(value) => updateProperty(selectedProperty.id, "rehabMaterials", value)} />
                <MoneyField label="Selling Costs" value={selectedProperty.sellingCosts} onChange={(value) => updateProperty(selectedProperty.id, "sellingCosts", value)} />
                <MoneyField label="Sales Price" value={selectedProperty.salesPrice} onChange={(value) => updateProperty(selectedProperty.id, "salesPrice", value)} />
              </div>
            </Section>

            <Section title="Interest and Other Costs">
              <div className="grid gap-4 md:grid-cols-2">
                <MoneyField label="Daily Interest" value={selectedProperty.dailyInterest} onChange={(value) => updateProperty(selectedProperty.id, "dailyInterest", value)} />
                <ReadOnlyField label="Interest" value={currency(metrics.interest)} />
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
              <div className="grid gap-4 md:grid-cols-2">
                <ReadOnlyField label="Total Expenses" value={currency(metrics.totalExpenses)} />
                <ReadOnlyField label="Total Project Cost" value={currency(metrics.totalProjectCost)} />
                <ReadOnlyField label="Profit" value={currency(metrics.profit)} />
                <MoneyField label="Cash Invested" value={selectedProperty.cashInvested} onChange={(value) => updateProperty(selectedProperty.id, "cashInvested", value)} />
                <ReadOnlyField label="Cash on Cash Return" value={percent(metrics.cashOnCashReturn)} />
                <ReadOnlyField label="Profit Margin %" value={percent(metrics.profitMargin)} />
                <ReadOnlyField label="Daily Profit" value={currency(metrics.profit / 365)} />
                <ReadOnlyField label="Annualized Return" value={percent(metrics.annualizedReturn)} />
              </div>
            </Section>
          </div>
        </div>
      </div>
    );
  }

  const portfolio = properties.map((property) => ({ ...property, ...propertyMetrics(property) }));
  const totalProfit = portfolio.reduce((sum, p) => sum + p.profit, 0);
  const totalSales = portfolio.reduce((sum, p) => sum + toNumber(p.salesPrice), 0);
  const totalCashInvested = portfolio.reduce((sum, p) => sum + toNumber(p.cashInvested), 0);
  const portfolioProfitMargin = totalSales ? totalProfit / totalSales : 0;
  const portfolioCoC = totalCashInvested ? totalProfit / totalCashInvested : 0;
  const portfolioDailyProfit = totalProfit / 365;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm space-y-4">
          <input
            className="w-full max-w-xl rounded-2xl border border-slate-200 px-4 py-3 text-3xl font-bold"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button onClick={addProperty} className="rounded-2xl">
            <Plus className="mr-2 h-4 w-4" /> Add Property
          </Button>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {portfolio.map((property) => (
              <button
                key={property.id}
                onClick={() => {
                  setSelectedId(property.id);
                  setPage("property");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-900">{property.name || "Untitled Property"}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProperty(property.id);
                    }}
                    className="inline-flex text-slate-500 hover:text-slate-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-slate-600">
                  <MetricRow label="Purchase Price" value={currency(property.purchasePrice)} />
                  <MetricRow label="Sold Price" value={currency(property.salesPrice)} />
                  <MetricRow label="Profit" value={currency(property.profit)} />
                  <MetricRow label="Profit Margin" value={percent(property.profitMargin)} />
                  <MetricRow label="CoC" value={percent(property.cashOnCashReturn)} />
                  <div className="flex items-center justify-between gap-3">
                    <span>Status</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${property.isSold ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
                      {property.isSold ? "Sold" : "Active"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 text-lg font-semibold text-slate-900">Portfolio Summary</div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryStat label="Total Profit" value={currency(totalProfit)} />
              <SummaryStat label="Profit Margin" value={percent(portfolioProfitMargin)} />
              <SummaryStat label="Cash on Cash Return" value={percent(portfolioCoC)} />
              <SummaryStat label="Daily Profit" value={currency(portfolioDailyProfit)} />
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={() => setPage("deal_analyzer")} className="rounded-2xl">
              <Search className="mr-2 h-4 w-4" /> Deal Analyzer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-2xl border border-slate-200 px-4 py-3";
const readonlyClass = "rounded-2xl border bg-slate-50 px-4 py-3 font-medium";

function Section({ title, children }) {
  return (
    <section className="space-y-4 border-b border-slate-100 pb-8 last:border-b-0 last:pb-0">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <Field label={label}>
      <div className={readonlyClass}>{value}</div>
    </Field>
  );
}

function MoneyField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <input
        className={inputClass}
        value={formatNumberInput(value)}
        onChange={(e) => onChange(sanitizeMoney(e.target.value))}
      />
    </Field>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SubTable({ title, buttonLabel, rows, onAdd, onRemove, onNameChange, onAmountChange }) {
  return (
    <section className="rounded-3xl border border-slate-200 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button onClick={onAdd} className="rounded-2xl">
          <Plus className="mr-2 h-4 w-4" /> {buttonLabel}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No items yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-slate-200 px-2 py-2 text-left text-sm text-slate-500">Name</th>
                <th className="border-b border-slate-200 px-2 py-2 text-left text-sm text-slate-500">Amount</th>
                <th className="w-12 border-b border-slate-200 px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td className="border-b border-slate-100 px-2 py-2">
                    <input className={inputClass} value={String(item.name ?? "")} onChange={(e) => onNameChange(item.id, e.target.value)} />
                  </td>
                  <td className="border-b border-slate-100 px-2 py-2">
                    <input className={inputClass} value={formatNumberInput(item.amount)} onChange={(e) => onAmountChange(item.id, sanitizeMoney(e.target.value))} />
                  </td>
                  <td className="border-b border-slate-100 px-2 py-2">
                    <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

function Button({ children, className = "", variant, size, ...props }) {
  const base =
    variant === "ghost"
      ? "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm"
      : "inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm text-white";
  const extra = size === "icon" ? " h-10 w-10 px-0 py-0 bg-transparent text-slate-700" : "";
  return (
    <button className={`${base}${extra} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
