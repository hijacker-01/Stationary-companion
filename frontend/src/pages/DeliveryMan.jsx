import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { Truck, CheckCircle, Package, UserPlus } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function DeliveryMan() {
  const [tab, setTab] = useState("master"); // master, dispatch, clearance
  const [dms, setDms] = useState([]);
  const [pendingBills, setPendingBills] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", vehicleNo: "", route: "" });

  // Dispatch state
  const [selectedDm, setSelectedDm] = useState("");
  const [selectedBills, setSelectedBills] = useState([]);

  // Clearance state
  const [clearanceDm, setClearanceDm] = useState("");
  const [dmBills, setDmBills] = useState([]); // Bills assigned to selected DM for clearance
  const [settlements, setSettlements] = useState({}); // { billId: { status, collectedAmount, mode } }

  const fetchData = async () => {
    try {
      const dmRes = await axios.get("http://localhost:5000/api/delivery-man", { headers: headers() });
      setDms(dmRes.data);
      const billsRes = await axios.get("http://localhost:5000/api/delivery-man/bills/pending", { headers: headers() });
      setPendingBills(billsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  // -- MASTER --
  const handleCreateDm = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/delivery-man", form, { headers: headers() });
      setForm({ name: "", phone: "", vehicleNo: "", route: "" });
      fetchData();
      alert("Delivery Man Added");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // -- DISPATCH --
  const handleAssign = async () => {
    if (!selectedDm || selectedBills.length === 0) return alert("Select a DM and at least one bill");
    try {
      await axios.post("http://localhost:5000/api/delivery-man/assign", {
        dmId: selectedDm,
        billIds: selectedBills
      }, { headers: headers() });
      alert("Bills dispatched successfully!");
      setSelectedBills([]);
      fetchData();
    } catch (err) {
      alert("Error assigning bills");
    }
  };

  // -- CLEARANCE --
  const fetchDmBills = async (dmId) => {
    try {
      // We can fetch all bills and filter by dmId and status "dispatched"
      const res = await axios.get("http://localhost:5000/api/billing", { headers: headers() });
      const assigned = res.data.filter(b => b.deliveryManId === parseInt(dmId) && b.deliveryStatus === "dispatched");
      setDmBills(assigned);
      const initialSettlements = {};
      assigned.forEach(b => {
        initialSettlements[b.id] = { status: "pending", collectedAmount: b.total, mode: "cash" };
      });
      setSettlements(initialSettlements);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (clearanceDm) fetchDmBills(clearanceDm);
    else setDmBills([]);
  }, [clearanceDm]);

  const handleClearance = async () => {
    const data = Object.keys(settlements)
      .map(billId => ({ billId, ...settlements[billId] }))
      .filter(s => s.status !== "pending"); // Only send delivered/returned
    
    if (data.length === 0) return alert("No actions selected");

    try {
      const res = await axios.post("http://localhost:5000/api/delivery-man/clearance", {
        dmId: clearanceDm,
        settlements: data
      }, { headers: headers() });
      alert(`Clearance completed! Collected: ₹${res.data.totalCollected}`);
      fetchDmBills(clearanceDm);
    } catch (err) {
      alert("Clearance failed");
    }
  };

  const tabs = [
    { key: "master", label: "DM Master", icon: UserPlus },
    { key: "dispatch", label: "Assign Dispatch", icon: Package },
    { key: "clearance", label: "Route Clearance", icon: CheckCircle },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Truck className="w-7 h-7 text-teal-600" /> Dispatch & Delivery Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage delivery personnel, assign routes, and settle payments</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-4">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                  tab === t.key
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}>
                <Icon className="w-4.5 h-4.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB: DM Master */}
        {tab === "master" && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Add New Delivery Man</h3>
              <form onSubmit={handleCreateDm} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vehicle Number</label>
                  <input value={form.vehicleNo} onChange={e => setForm({ ...form, vehicleNo: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Route/Area</label>
                  <input value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} className="form-input" />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
                  Save Record
                </button>
              </form>
            </div>
            <div className="col-span-2 data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                  </tr>
                </thead>
                <tbody>
                  {dms.map(d => (
                    <tr key={d.id}>
                      <td className="font-semibold text-slate-900">{d.name}</td>
                      <td className="text-slate-500">{d.phone}</td>
                      <td className="text-slate-500">{d.route}</td>
                      <td className="text-slate-500 font-mono text-xs">{d.vehicleNo}</td>
                    </tr>
                  ))}
                  {dms.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">No records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: DISPATCH */}
        {tab === "dispatch" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Assign To:</label>
                <select value={selectedDm} onChange={e => setSelectedDm(e.target.value)} className="form-input bg-white min-w-[200px]">
                  <option value="">-- Select DM --</option>
                  {dms.map(d => <option key={d.id} value={d.id}>{d.name} ({d.route})</option>)}
                </select>
              </div>
              <button onClick={handleAssign} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
                Dispatch {selectedBills.length} Bills
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-center"><input type="checkbox" onChange={e => setSelectedBills(e.target.checked ? pendingBills.map(b => b.id) : [])} checked={selectedBills.length === pendingBills.length && pendingBills.length > 0} /></th>
                    <th>Bill No</th>
                    <th>Customer</th>
                    <th>Area/Route</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBills.map(b => (
                    <tr key={b.id} className="hover:bg-teal-50/50">
                      <td className="text-center">
                        <input type="checkbox" checked={selectedBills.includes(b.id)} onChange={e => {
                          if (e.target.checked) setSelectedBills([...selectedBills, b.id]);
                          else setSelectedBills(selectedBills.filter(id => id !== b.id));
                        }} />
                      </td>
                      <td className="font-mono font-bold text-teal-600 text-xs">{b.billNo}</td>
                      <td className="font-semibold text-slate-900">{b.customerName}</td>
                      <td className="text-slate-500 text-xs">{b.customerAddress}</td>
                      <td className="text-right font-bold">₹{b.total?.toFixed(2)}</td>
                    </tr>
                  ))}
                  {pendingBills.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No pending bills ready for dispatch.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: CLEARANCE */}
        {tab === "clearance" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Clear Route For:</label>
                <select value={clearanceDm} onChange={e => setClearanceDm(e.target.value)} className="form-input bg-white min-w-[200px]">
                  <option value="">-- Select DM --</option>
                  {dms.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <button onClick={handleClearance} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
                Settle & Close Ledger
              </button>
            </div>

            {clearanceDm && (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bill No</th>
                      <th>Customer</th>
                      <th className="text-right">Bill Amt</th>
                      <th className="text-center">Delivery Status</th>
                      <th className="text-center">Collection Mode</th>
                      <th className="text-right">Collected (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dmBills.map(b => (
                      <tr key={b.id}>
                        <td className="font-mono font-bold text-teal-600 text-xs">{b.billNo}</td>
                        <td className="font-semibold text-slate-900">{b.customerName}</td>
                        <td className="text-right font-medium">₹{b.total?.toFixed(2)}</td>
                        <td className="text-center">
                          <select
                            value={settlements[b.id]?.status || "pending"}
                            onChange={e => setSettlements({ ...settlements, [b.id]: { ...settlements[b.id], status: e.target.value } })}
                            className="form-input bg-white text-xs font-medium"
                          >
                            <option value="pending" className="text-slate-500">Pending</option>
                            <option value="delivered" className="text-emerald-600 font-bold">Delivered (Cash Collected)</option>
                            <option value="returned" className="text-rose-600 font-bold">Returned / Bounced</option>
                          </select>
                        </td>
                        <td className="text-center">
                          <select
                            disabled={settlements[b.id]?.status !== "delivered"}
                            value={settlements[b.id]?.mode || "cash"}
                            onChange={e => setSettlements({ ...settlements, [b.id]: { ...settlements[b.id], mode: e.target.value } })}
                            className="form-input bg-white text-xs"
                          >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI/QR</option>
                            <option value="cheque">Cheque</option>
                          </select>
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            disabled={settlements[b.id]?.status !== "delivered"}
                            value={settlements[b.id]?.collectedAmount || ""}
                            onChange={e => setSettlements({ ...settlements, [b.id]: { ...settlements[b.id], collectedAmount: e.target.value } })}
                            className="form-input w-24 text-right text-sm font-bold"
                          />
                        </td>
                      </tr>
                    ))}
                    {dmBills.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">No active dispatched bills found for this DM.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {!clearanceDm && <div className="p-12 text-center text-slate-400">Select a Delivery Man to view assigned invoices.</div>}
          </div>
        )}
      </main>
    </div>
  );
}
