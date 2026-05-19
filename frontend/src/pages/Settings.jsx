import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const TABS = [
  { key: "company", label: "🏢 Company" },
  { key: "gst", label: "🏛️ GST" },
  { key: "billing", label: "🧾 Billing" },
  { key: "alerts", label: "🔔 Alerts" },
  { key: "gstr1", label: "📋 GSTR-1" },
];

const Field = ({ label, type = "text", placeholder = "", value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange}
      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>
);

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATES = [
  { name: "Andhra Pradesh", code: "37" },
  { name: "Delhi", code: "07" },
  { name: "Gujarat", code: "24" },
  { name: "Karnataka", code: "29" },
  { name: "Kerala", code: "32" },
  { name: "Maharashtra", code: "27" },
  { name: "Madhya Pradesh", code: "23" },
  { name: "Punjab", code: "03" },
  { name: "Rajasthan", code: "08" },
  { name: "Tamil Nadu", code: "33" },
  { name: "Telangana", code: "36" },
  { name: "Uttar Pradesh", code: "09" },
  { name: "West Bengal", code: "19" },
];

export default function Settings() {
  const [tab, setTab] = useState("company");
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [gstr1, setGstr1] = useState(null);
  const [gstMonth, setGstMonth] = useState(new Date().getMonth() + 1);
  const [gstYear, setGstYear] = useState(new Date().getFullYear());
  const [loadingGst, setLoadingGst] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/settings", { headers: headers() })
      .then((res) => setSettings(res.data))
      .catch((err) => console.error("Error fetching settings:", err));
  }, []);

  const handleSave = async () => {
    try {
      await axios.put("http://localhost:5000/api/settings", settings, {
        headers: headers(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Failed to save settings");
    }
  };

  const setField = (fieldKey) => (e) =>
    setSettings({ ...settings, [fieldKey]: e.target.value });

  const fetchGSTR1 = async () => {
    setLoadingGst(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/gst/gstr1?month=${gstMonth}&year=${gstYear}`,
        { headers: headers() },
      );
      setGstr1(res.data);
    } catch {
      alert("Failed to fetch GSTR-1 data");
    } finally {
      setLoadingGst(false);
    }
  };

  const exportCSV = () => {
    if (!gstr1 || !gstr1.b2c) return;
    const rows = [
      [
        "Bill No",
        "Date",
        "Customer",
        "Phone",
        "Taxable Value",
        "GST Amount",
        "Total",
        "Payment Mode",
      ],
      ...gstr1.b2c.map((b) => [
        b.billNo,
        b.date,
        b.customerName,
        b.phone,
        b.taxableValue,
        b.gstAmount,
        b.total,
        b.paymentMode,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GSTR1_${gstMonth}_${gstYear}.csv`;
    a.click();
  };

  if (!settings)
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-gray-400">
          Loading settings...
        </main>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">⚙️ Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure your business and system preferences
            </p>
          </div>
          {tab !== "gstr1" && (
            <button
              onClick={handleSave}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold shadow transition ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {saved ? "✅ Saved!" : "💾 Save Settings"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow p-8 max-w-3xl">
          {/* ── COMPANY TAB ── */}
          {tab === "company" && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-700 text-lg mb-4">
                Company Information
              </h2>
              <Field
                label="Company Name"
                value={settings.companyName}
                onChange={setField("companyName")}
                placeholder="Your Business Name"
              />
              <Field
                label="Company Address"
                value={settings.companyAddress}
                onChange={setField("companyAddress")}
                placeholder="Full address"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Phone"
                  value={settings.companyPhone}
                  onChange={setField("companyPhone")}
                  placeholder="+91 XXXXXXXXXX"
                />
                <Field
                  label="Email"
                  value={settings.companyEmail}
                  onChange={setField("companyEmail")}
                  type="email"
                  placeholder="info@company.com"
                />
              </div>
              <Field
                label="Drug License (DL) Number"
                value={settings.dlNumber}
                onChange={setField("dlNumber")}
                placeholder="e.g. MH-MZ3-123456"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    State
                  </label>
                  <select
                    value={settings.stateName || ""}
                    onChange={(e) => {
                      const s = STATES.find((st) => st.name === e.target.value);
                      setSettings({
                        ...settings,
                        stateName: s?.name || "",
                        stateCode: s?.code || "",
                      });
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Select State</option>
                    {STATES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="State Code"
                  value={settings.stateCode}
                  onChange={setField("stateCode")}
                  placeholder="e.g. 27"
                />
              </div>
            </div>
          )}

          {/* ── GST TAB ── */}
          {tab === "gst" && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-700 text-lg mb-4">
                GST Configuration
              </h2>
              <Field
                label="GSTIN Number"
                value={settings.gstNumber}
                onChange={setField("gstNumber")}
                placeholder="22AAAAA0000A1Z5"
              />
              <Field
                label="PAN Number"
                value={settings.panNumber}
                onChange={setField("panNumber")}
                placeholder="AAAAA0000A"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Financial Year
                  </label>
                  <select
                    value={settings.financialYear || "2024-25"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        financialYear: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {["2022-23", "2023-24", "2024-25", "2025-26"].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Currency
                  </label>
                  <select
                    value={settings.currency || "INR"}
                    onChange={(e) =>
                      setSettings({ ...settings, currency: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="INR">INR — Indian Rupee (₹)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                  </select>
                </div>
              </div>

              {/* GST Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                <p className="text-sm font-semibold text-blue-700 mb-2">
                  🏛️ GST Rate Reference
                </p>
                <div className="grid grid-cols-3 gap-3 text-xs text-blue-600">
                  {[
                    { rate: "0%", items: "Essential food, healthcare" },
                    { rate: "5%", items: "Packaged food, medicines" },
                    { rate: "12%", items: "Processed food, OTC drugs" },
                    { rate: "18%", items: "General goods, services" },
                    { rate: "28%", items: "Luxury, tobacco, aerated" },
                  ].map((g) => (
                    <div
                      key={g.rate}
                      className="bg-white rounded-lg p-2 border border-blue-100"
                    >
                      <p className="font-bold text-blue-800">{g.rate}</p>
                      <p className="opacity-70 mt-0.5">{g.items}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── BILLING TAB ── */}
          {tab === "billing" && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-700 text-lg mb-4">
                Billing Preferences
              </h2>
              <Field
                label="Invoice Prefix"
                value={settings.invoicePrefix}
                onChange={setField("invoicePrefix")}
                placeholder="INV"
              />
              <Field
                label="Invoice Footer Text"
                value={settings.printFooter}
                onChange={setField("printFooter")}
                placeholder="Thank you for your business!"
              />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bank Details (For Invoice)</label>
                <textarea rows={3} value={settings.bankDetails || ""} onChange={setField("bankDetails")}
                  placeholder="Bank Name: XYZ Bank&#10;A/C No: 123456789&#10;IFSC: XYZB000123"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Terms & Conditions</label>
                <textarea rows={3} value={settings.termsConditions || ""} onChange={setField("termsConditions")}
                  placeholder="1. Goods once sold will not be taken back.&#10;2. Subject to local jurisdiction."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Bill Number Preview</p>
                <p className="text-xs text-gray-500 mb-1">
                  Bills are numbered <strong>sequentially per financial year</strong> (Apr–Mar):
                </p>
                <div className="font-mono text-blue-600 font-bold text-sm bg-white border border-blue-100 rounded-lg px-3 py-2 mt-1">
                  INV-2526-0001 → INV-2526-0002 → INV-2526-0003…
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  The <strong>INV</strong> prefix can be customised using the "Invoice Prefix" field above (e.g. set "MED" to get MED-2526-0001).
                </p>
              </div>
            </div>
          )}

          {/* ── ALERTS TAB ── */}
          {tab === "alerts" && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-700 text-lg mb-4">
                Alert Preferences
              </h2>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Low Stock Alert Threshold (qty)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.lowStockAlert || 10}
                  onChange={(e) =>
                    setSettings({ ...settings, lowStockAlert: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Items with qty at or below this number will be flagged as low
                  stock.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Expiry Alert — Days Before Expiry
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.expiryAlertDays || 30}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      expiryAlertDays: e.target.value,
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Items expiring within this many days will appear in expiry
                  alerts.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-700 mb-1">
                  🔔 Alert Summary
                </p>
                <ul className="text-xs text-yellow-600 space-y-1 mt-2">
                  <li>
                    • Items with qty ≤{" "}
                    <strong>{settings.lowStockAlert || 10}</strong> → flagged as
                    Low Stock
                  </li>
                  <li>
                    • Items expiring within{" "}
                    <strong>{settings.expiryAlertDays || 30}</strong> days →
                    shown in Expiry Box
                  </li>
                  <li>
                    • Items already expired → shown as Critical in Reports
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ── GSTR-1 TAB ── */}
          {tab === "gstr1" && (
            <div className="space-y-6">
              <h2 className="font-semibold text-gray-700 text-lg">
                GSTR-1 Filing Report
              </h2>

              {/* Period Selector */}
              <div className="flex gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Month
                  </label>
                  <select
                    value={gstMonth}
                    onChange={(e) => setGstMonth(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i + 1} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Year
                  </label>
                  <select
                    value={gstYear}
                    onChange={(e) => setGstYear(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {[2023, 2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={fetchGSTR1}
                  disabled={loadingGst}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
                >
                  {loadingGst ? "Loading..." : "Generate Report"}
                </button>
                {gstr1 && (
                  <button
                    onClick={exportCSV}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
                  >
                    ⬇️ Export CSV
                  </button>
                )}
              </div>

              {gstr1 && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Total Bills",
                        value: gstr1.totalBills,
                        color: "bg-blue-600",
                      },
                      {
                        label: "Taxable Value",
                        value: `₹${gstr1.totalTaxable?.toFixed(2)}`,
                        color: "bg-indigo-600",
                      },
                      {
                        label: "Total GST",
                        value: `₹${gstr1.totalGst?.toFixed(2)}`,
                        color: "bg-purple-600",
                      },
                      {
                        label: "Total Revenue",
                        value: `₹${gstr1.totalRevenue?.toFixed(2)}`,
                        color: "bg-green-600",
                      },
                    ].map((c) => (
                      <div
                        key={c.label}
                        className={`${c.color} text-white rounded-xl p-4 shadow`}
                      >
                        <p className="text-xl font-bold">{c.value}</p>
                        <p className="text-xs opacity-80 mt-1">{c.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Rate Wise Breakup */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">
                      GST Rate-wise Breakup
                    </h3>
                    <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3 text-left">GST Rate</th>
                          <th className="px-4 py-3 text-right">
                            Taxable Value
                          </th>
                          <th className="px-4 py-3 text-right">CGST</th>
                          <th className="px-4 py-3 text-right">SGST</th>
                          <th className="px-4 py-3 text-right">Total GST</th>
                          <th className="px-4 py-3 text-right">
                            Invoice Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {gstr1.rateWise?.map((r) => (
                          <tr key={r.rate} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-blue-600">
                              {r.rate}%
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              ₹{r.taxable?.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              ₹{(r.gst / 2)?.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              ₹{(r.gst / 2)?.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-purple-600">
                              ₹{r.gst?.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">
                              ₹{r.total?.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        {!gstr1.rateWise?.length && (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-center py-8 text-gray-400"
                            >
                              No data for this period
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* B2C Bills */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">
                      B2C Sales Detail
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                          <tr>
                            <th className="px-4 py-3 text-left">Bill No</th>
                            <th className="px-4 py-3 text-left">Date</th>
                            <th className="px-4 py-3 text-left">Customer</th>
                            <th className="px-4 py-3 text-right">Taxable</th>
                            <th className="px-4 py-3 text-right">GST</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-left">Mode</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {gstr1.b2c?.map((b, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono text-blue-600 text-xs">
                                {b.billNo}
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs">
                                {b.date}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-800">
                                {b.customerName}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">
                                ₹{b.taxableValue?.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right text-purple-600">
                                ₹{b.gstAmount?.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-green-600">
                                ₹{b.total?.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 capitalize text-gray-500">
                                {b.paymentMode}
                              </td>
                            </tr>
                          ))}
                          {!gstr1.b2c?.length && (
                            <tr>
                              <td
                                colSpan={7}
                                className="text-center py-8 text-gray-400"
                              >
                                No bills for this period
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
