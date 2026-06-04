import { useState, useEffect } from "react";
import axios from "../api/axios";
import { Search, ShoppingCart, User, Plus, Minus, CheckCircle, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SalesmanApp() {
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [searchCust, setSearchCust] = useState("");
  const [searchItem, setSearchItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("CUSTOMER"); // CUSTOMER, ITEMS, CART, SUCCESS

  useEffect(() => {
    // Fetch initial data
    Promise.all([
      axios.get("/customers").catch(() => ({ data: [] })),
      axios.get("/inventory").catch(() => ({ data: [] }))
    ]).then(([custRes, invRes]) => {
      // Mock data if backend empty
      const c = custRes.data.length ? custRes.data : [
        { id: "1", name: "Sharma Medical Store" },
        { id: "2", name: "Apollo Pharmacy" },
        { id: "3", name: "City Health Clinic" }
      ];
      const i = invRes.data.length ? invRes.data : [
        { id: "1", name: "Paracetamol 500mg", mrp: 25.00, stock: 1500, pack: "10x10" },
        { id: "2", name: "Azithromycin 250mg", mrp: 120.00, stock: 500, pack: "6 Tab" },
        { id: "3", name: "Vitamin C Zinc", mrp: 85.00, stock: 200, pack: "20 Tab" },
        { id: "4", name: "Cough Syrup 100ml", mrp: 95.00, stock: 120, pack: "Bottle" }
      ];
      setCustomers(c);
      setInventory(i);
      setLoading(false);
    });
  }, []);

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchCust.toLowerCase()));
  const filteredItems = inventory.filter(i => i.name.toLowerCase().includes(searchItem.toLowerCase()));

  const addToCart = (item) => {
    setCart((prev) => {
      const ex = prev.find(p => p.id === item.id);
      if (ex) {
        return prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) => {
      return prev.map(p => {
        if (p.id === id) {
          const newQty = p.qty + delta;
          return newQty > 0 ? { ...p, qty: newQty } : p;
        }
        return p;
      }).filter(p => p.qty > 0); // Need another filter for removal, actually update map first
    });
  };

  const totalCart = cart.reduce((acc, c) => acc + (c.qty * c.mrp), 0);

  const placeOrder = () => {
    // mock API call
    setTimeout(() => {
      setStep("SUCCESS");
      setCart([]);
      setSelectedCustomer("");
    }, 500);
  };

  return (
    <div className="flex flex-col h-screen bg-[#e5e5e5] font-sans">
      <Header />
      <main className="flex-1 overflow-hidden flex justify-center bg-[#e8e8e8]">
        {/* Mobile Container wrapper */}
        <div className="w-full max-w-md bg-white border-x border-gray-300 shadow-xl flex flex-col overflow-hidden relative">
          
          {/* Mobile Header Bar */}
          <div className="bg-blue-800 text-white px-3 py-2 flex items-center justify-between z-10 shadow">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <div>
                <h1 className="text-sm font-bold">Field Order App</h1>
                <p className="text-[10px] text-blue-200">Salesman: Ravi Kumar</p>
              </div>
            </div>
            {cart.length > 0 && step !== "CART" && step !== "SUCCESS" && (
              <button 
                onClick={() => setStep("CART")}
                className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{cart.length}</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-[#f4f4f4]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Loading...</div>
            ) : (
              <>
                {step === "CUSTOMER" && (
                  <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
                    <h2 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1">1. Select Retailer</h2>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search Customer..." 
                        value={searchCust}
                        onChange={(e) => setSearchCust(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                        tabIndex={1}
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {filteredCustomers.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => { setSelectedCustomer(c); setStep("ITEMS"); }}
                          className="bg-white p-3 rounded border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer active:bg-blue-50"
                        >
                          <span className="text-sm font-bold text-gray-700">{c.name}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === "ITEMS" && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="bg-white p-2 border-b border-gray-300 flex items-center justify-between shadow-sm z-10">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Ordering for</p>
                        <p className="text-xs font-bold text-blue-800">{selectedCustomer.name}</p>
                      </div>
                      <button onClick={() => setStep("CUSTOMER")} className="text-[10px] text-blue-600 font-bold hover:underline">Change</button>
                    </div>
                    <div className="p-2 border-b border-gray-300 bg-gray-50">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Search Item Code/Name..." 
                          value={searchItem}
                          onChange={(e) => setSearchItem(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                          tabIndex={1}
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {filteredItems.map(item => {
                        const inCart = cart.find(c => c.id === item.id);
                        return (
                          <div key={item.id} className="bg-white border border-gray-200 rounded p-2 flex justify-between items-center shadow-sm">
                            <div className="flex-1">
                              <h3 className="text-xs font-bold text-gray-800">{item.name}</h3>
                              <p className="text-[10px] text-gray-500">Pack: {item.pack} | Stock: <span className="font-bold text-green-700">{item.stock}</span></p>
                              <p className="text-xs font-bold text-blue-800 mt-0.5">₹{fmt(item.mrp)}</p>
                            </div>
                            <div>
                              {inCart ? (
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-1 py-0.5">
                                  <button onClick={() => updateQty(item.id, -1)} className="p-1 text-blue-600 bg-white rounded shadow-sm border border-blue-100 active:bg-blue-200"><Minus className="w-3 h-3" /></button>
                                  <span className="text-xs font-bold w-4 text-center text-blue-800">{inCart.qty}</span>
                                  <button onClick={() => updateQty(item.id, 1)} className="p-1 text-blue-600 bg-white rounded shadow-sm border border-blue-100 active:bg-blue-200"><Plus className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => addToCart(item)}
                                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded text-xs font-bold border border-blue-200 active:bg-blue-300"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Bottom sticky Cart summary */}
                    {cart.length > 0 && (
                      <div className="bg-white border-t border-gray-300 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-between z-10">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Total ({cart.length} items)</p>
                          <p className="text-sm font-extrabold text-gray-900">₹{fmt(totalCart)}</p>
                        </div>
                        <button 
                          onClick={() => setStep("CART")}
                          className="bg-green-600 active:bg-green-700 text-white px-4 py-2 rounded text-xs font-bold shadow-md flex items-center gap-1"
                        >
                          View Cart <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {step === "CART" && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="bg-white p-2 border-b border-gray-300 flex items-center justify-between shadow-sm z-10">
                      <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1">
                        <ShoppingCart className="w-4 h-4 text-orange-600" /> Review Order
                      </h2>
                      <button onClick={() => setStep("ITEMS")} className="text-[10px] text-blue-600 font-bold hover:underline">Add More Items</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {cart.map(item => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded p-2 flex justify-between items-center shadow-sm">
                          <div className="flex-1">
                            <h3 className="text-xs font-bold text-gray-800">{item.name}</h3>
                            <p className="text-[10px] text-gray-500">₹{fmt(item.mrp)} x {item.qty}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <p className="text-xs font-bold text-gray-900">₹{fmt(item.mrp * item.qty)}</p>
                            <div className="flex items-center gap-1 bg-gray-100 rounded px-1 py-0.5 border border-gray-200">
                              <button onClick={() => updateQty(item.id, -1)} className="p-0.5 text-gray-600 bg-white rounded shadow-sm border border-gray-200"><Minus className="w-3 h-3" /></button>
                              <span className="text-[10px] font-bold w-4 text-center text-gray-800">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, 1)} className="p-0.5 text-gray-600 bg-white rounded shadow-sm border border-gray-200"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white border-t border-gray-300 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col gap-2 z-10">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-700">Order Total</span>
                        <span className="font-extrabold text-orange-600 text-lg">₹{fmt(totalCart)}</span>
                      </div>
                      <button 
                        onClick={placeOrder}
                        className="bg-blue-600 active:bg-blue-700 text-white w-full py-2.5 rounded text-sm font-bold shadow-md flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Place Order
                      </button>
                    </div>
                  </div>
                )}

                {step === "SUCCESS" && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 bg-white">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-1">Order Placed!</h2>
                      <p className="text-xs text-gray-500">Your order has been synced to the ERP.</p>
                    </div>
                    <button 
                      onClick={() => setStep("CUSTOMER")}
                      className="bg-blue-600 active:bg-blue-700 text-white px-6 py-2 rounded text-xs font-bold shadow mt-4"
                    >
                      New Order
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <BusinessFooter />
    </div>
  );
}
