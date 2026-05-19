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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-600" /> Dispatch & Delivery Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage delivery personnel, assign routes, and settle payments</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-6 p-1 border border-gray-100 flex gap-1">
          <button
            onClick={() => setTab("master")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl flex justify-center items-center gap-2 transition ${tab === "master" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <UserPlus className="w-4 h-4" /> DM Master
          </button>
          <button
            onClick={() => setTab("dispatch")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl flex justify-center items-center gap-2 transition ${tab === "dispatch" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Package className="w-4 h-4" /> Assign Dispatch
          </button>
          <button
            onClick={() => setTab("clearance")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl flex justify-center items-center gap-2 transition ${tab === "clearance" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <CheckCircle className="w-4 h-4" /> Route Clearance
          </button>
        </div>

        {/* TAB: DM Master */}
        {tab === "master" && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Add New Delivery Man</h3>
              <form onSubmit={handleCreateDm} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Number</label>
                  <input value={form.vehicleNo} onChange={e=>setForm({...form,vehicleNo:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Route/Area</label>
                  <input value={form.route} onChange={e=>setForm({...form,route:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition">Save Record</button>
              </form>
            </div>
            <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Route</th>
                    <th className="px-6 py-3">Vehicle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dms.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-gray-800">{d.name}</td>
                      <td className="px-6 py-3 text-gray-600">{d.phone}</td>
                      <td className="px-6 py-3 text-gray-600">{d.route}</td>
                      <td className="px-6 py-3 text-gray-600 font-mono text-xs">{d.vehicleNo}</td>
                    </tr>
                  ))}
                  {dms.length===0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">No records found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: DISPATCH */}
        {tab === "dispatch" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">Assign To:</label>
                <select value={selectedDm} onChange={e=>setSelectedDm(e.target.value)} className="border rounded-lg px-4 py-2 text-sm min-w-[200px] outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">-- Select DM --</option>
                  {dms.map(d => <option key={d.id} value={d.id}>{d.name} ({d.route})</option>)}
                </select>
              </div>
              <button onClick={handleAssign} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition">
                Dispatch {selectedBills.length} Bills
              </button>
            </div>

            <table className="w-full text-sm text-left border">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="p-3 text-center"><input type="checkbox" onChange={e => setSelectedBills(e.target.checked ? pendingBills.map(b=>b.id) : [])} checked={selectedBills.length === pendingBills.length && pendingBills.length > 0} /></th>
                  <th className="p-3">Bill No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Area/Route</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingBills.map(b => (
                  <tr key={b.id} className="hover:bg-blue-50/50">
                    <td className="p-3 text-center">
                      <input type="checkbox" checked={selectedBills.includes(b.id)} onChange={e => {
                        if (e.target.checked) setSelectedBills([...selectedBills, b.id]);
                        else setSelectedBills(selectedBills.filter(id => id !== b.id));
                      }}/>
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-600 text-xs">{b.billNo}</td>
                    <td className="p-3 font-semibold text-gray-800">{b.customerName}</td>
                    <td className="p-3 text-gray-500 text-xs">{b.customerAddress}</td>
                    <td className="p-3 text-right font-bold">₹{b.total?.toFixed(2)}</td>
                  </tr>
                ))}
                {pendingBills.length===0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No pending bills ready for dispatch.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: CLEARANCE */}
        {tab === "clearance" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">Clear Route For:</label>
                <select value={clearanceDm} onChange={e=>setClearanceDm(e.target.value)} className="border rounded-lg px-4 py-2 text-sm min-w-[200px] outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">-- Select DM --</option>
                  {dms.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <button onClick={handleClearance} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition">
                Settle & Close Ledger
              </button>
            </div>

            {clearanceDm && (
              <table className="w-full text-sm text-left border">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="p-3">Bill No</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3 text-right">Bill Amt</th>
                    <th className="p-3 text-center">Delivery Status</th>
                    <th className="p-3 text-center">Collection Mode</th>
                    <th className="p-3 text-right">Collected (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dmBills.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-blue-600 text-xs">{b.billNo}</td>
                      <td className="p-3 font-semibold text-gray-800">{b.customerName}</td>
                      <td className="p-3 text-right font-medium">₹{b.total?.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <select 
                          value={settlements[b.id]?.status || "pending"} 
                          onChange={e => setSettlements({...settlements, [b.id]: {...settlements[b.id], status: e.target.value}})}
                          className="border rounded px-2 py-1 text-xs outline-none bg-white font-medium"
                        >
                          <option value="pending" className="text-gray-500">Pending</option>
                          <option value="delivered" className="text-emerald-600 font-bold">Delivered (Cash Collected)</option>
                          <option value="returned" className="text-rose-600 font-bold">Returned / Bounced</option>
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <select
                          disabled={settlements[b.id]?.status !== "delivered"}
                          value={settlements[b.id]?.mode || "cash"}
                          onChange={e => setSettlements({...settlements, [b.id]: {...settlements[b.id], mode: e.target.value}})}
                          className="border rounded px-2 py-1 text-xs outline-none bg-white"
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI/QR</option>
                          <option value="cheque">Cheque</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          disabled={settlements[b.id]?.status !== "delivered"}
                          value={settlements[b.id]?.collectedAmount || ""}
                          onChange={e => setSettlements({...settlements, [b.id]: {...settlements[b.id], collectedAmount: e.target.value}})}
                          className="border rounded px-2 py-1 w-24 text-right text-sm outline-none focus:ring-1 focus:ring-blue-400 font-bold"
                        />
                      </td>
                    </tr>
                  ))}
                  {dmBills.length===0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No active dispatched bills found for this DM.</td></tr>}
                </tbody>
              </table>
            )}
            {!clearanceDm && <div className="p-12 text-center text-gray-400">Select a Delivery Man to view assigned invoices.</div>}
          </div>
        )}
      </main>
    </div>
  );
}
