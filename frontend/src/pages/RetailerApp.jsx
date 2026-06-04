import { useState, useEffect } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { ShoppingBag, Search, Plus, Minus, Package } from "lucide-react";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function RetailerApp() {
  const [tab, setTab] = useState("catalog");
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get(`/api/marketplace/catalog?search=${search}`).then(r => setItems(r.data)).catch(() => setItems([{ id: 1, name: "Paracetamol 500mg", mrp: 30, selling_price: 25, stock_qty: 500, schemes: [{ name: "Buy 10 Get 2", type: "buy_get_free" }] }]));
    axios.get("/api/marketplace/orders").then(r => setOrders(r.data)).catch(() => {});
  }, [search]);

  const addToCart = (item) => { const ex = cart.find(c => c.id === item.id); if (ex) setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)); else setCart([...cart, { ...item, qty: 1, rate: item.selling_price || item.mrp }]); };
  const updateQty = (id, delta) => setCart(cart.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  const cartTotal = cart.reduce((s, c) => s + c.qty * c.rate, 0);
  const placeOrder = async () => { try { await axios.post("/api/marketplace/order", { customerId: 1, customerName: "Retail Customer", items: cart.map(c => ({ id: c.id, name: c.name, qty: c.qty, rate: c.rate })) }); setCart([]);  const r = await axios.get("/api/marketplace/orders"); setOrders(r.data); setTab("orders"); } catch (e) {  } };
  const statusBadge = (s) => ({ placed: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700", dispatched: "bg-indigo-100 text-indigo-700", delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" }[s] || "bg-gray-200");

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Retailer Ordering App" />
      <main className="flex-1 p-2 overflow-auto">
        <div className="flex gap-1 mb-2 bg-white border border-gray-300 p-1">{[["catalog","Product Catalog"],["orders","My Orders"]].map(([k,l]) => <button key={k} onClick={() => setTab(k)} className={`px-3 py-1 text-xs font-bold rounded ${tab === k ? "bg-blue-600 text-white" : "bg-gray-100"}`}>{l}</button>)}</div>
        {tab === "catalog" && <div className="flex gap-2">
          <div className="flex-1"><div className="flex items-center gap-2 mb-2"><Search className="w-4 h-4 text-gray-400"/><input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 border border-gray-300 p-1.5 rounded text-xs"/></div>
            <div className="grid grid-cols-3 gap-2">{items.map(item => <div key={item.id} className="bg-white border border-gray-300 p-2 shadow-sm hover:shadow-md transition-shadow"><div className="font-bold text-sm">{item.name}</div><div className="flex justify-between mt-1"><span className="text-gray-500 line-through">₹{item.mrp}</span><span className="text-green-700 font-bold">₹{item.selling_price || item.mrp}</span></div><div className="text-[10px] text-gray-500 mt-0.5">Stock: {item.stock_qty}</div>{(item.schemes || []).map((s, i) => <span key={i} className="bg-purple-100 text-purple-700 px-1 rounded text-[8px] font-bold mr-1">{s.name}</span>)}<button onClick={() => addToCart(item)} className="mt-2 w-full bg-blue-600 text-white py-1 rounded text-[10px] font-bold hover:bg-blue-700"><Plus className="w-3 h-3 inline"/> Add to Cart</button></div>)}</div>
          </div>
          {cart.length > 0 && <div className="w-64 bg-white border border-gray-300 p-2 shadow-sm h-fit sticky top-2"><div className="font-bold mb-2 flex items-center"><ShoppingBag className="w-4 h-4 mr-1"/> Cart ({cart.length})</div>{cart.map(c => <div key={c.id} className="flex justify-between items-center py-1 border-b border-gray-100"><div><div className="font-bold">{c.name}</div><div className="text-gray-500">₹{c.rate} × {c.qty}</div></div><div className="flex items-center gap-1"><button onClick={() => updateQty(c.id, -1)} className="bg-red-100 p-0.5 rounded"><Minus className="w-3 h-3"/></button><span className="font-bold w-5 text-center">{c.qty}</span><button onClick={() => updateQty(c.id, 1)} className="bg-green-100 p-0.5 rounded"><Plus className="w-3 h-3"/></button></div></div>)}<div className="border-t border-gray-300 pt-2 mt-2"><div className="flex justify-between font-bold text-sm"><span>Total</span><span>₹{cartTotal.toLocaleString()}</span></div><button onClick={placeOrder} className="mt-2 w-full bg-green-600 text-white py-1.5 rounded font-bold text-xs hover:bg-green-700">Place Order</button></div></div>}
        </div>}
        {tab === "orders" && <div className="bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex items-center"><Package className="w-4 h-4 mr-2"/> My Orders</div><table className="w-full text-left border-collapse"><thead className="bg-gray-100 border-b border-gray-300"><tr>{["Order#","Date","Items","Total ₹","Status","Payment"].map(h => <th key={h} className="p-1.5 border-r border-gray-300">{h}</th>)}</tr></thead><tbody>{orders.map(o => <tr key={o.id} className="border-b border-gray-200 hover:bg-blue-50"><td className="p-1.5 border-r border-gray-300 font-bold text-blue-700">{o.orderNo}</td><td className="p-1.5 border-r border-gray-300">{new Date(o.createdAt).toLocaleDateString()}</td><td className="p-1.5 border-r border-gray-300">{o.itemCount}</td><td className="p-1.5 border-r border-gray-300 font-bold">₹{(o.total||0).toLocaleString()}</td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 py-0.5 rounded text-[9px] font-bold ${statusBadge(o.status)}`}>{o.status}</span></td><td className="p-1.5"><span className="text-[9px]">{o.paymentStatus || "Not Entered"}</span></td></tr>)}</tbody></table></div>}
      </main>
      <BusinessFooter />
    </div>
  );
}
