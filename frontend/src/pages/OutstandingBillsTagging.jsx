import { useState } from "react";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import Sidebar from "../components/Sidebar";
import { Search, Loader2, Check } from "lucide-react";

export default function OutstandingBillsTagging() {
  const [search, setSearch] = useState("");
  const [remark, setRemark] = useState("");
  const [tagFor, setTagFor] = useState("Collection");
  const [tagIndex, setTagIndex] = useState("COLL-001 (Primary Collection)");
  const [negativeAmount, setNegativeAmount] = useState(false);
  const [loadCash, setLoadCash] = useState(false);
  const [wOrWithout, setWOrWithout] = useState("With");
  const [partyCategory, setPartyCategory] = useState("All Categories");
  
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTagging, setIsTagging] = useState(false);

  // No mock data as requested
  const bills = [];
  const filteredBills = bills.filter(b => b.partyName.toLowerCase().includes(search.toLowerCase()) || b.billNo.toLowerCase().includes(search.toLowerCase()));

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      setRemark("");
      setTagFor("Collection");
      setTagIndex("COLL-001 (Primary Collection)");
      setNegativeAmount(false);
      setLoadCash(false);
      setWOrWithout("With");
      setPartyCategory("All Categories");
      setIsResetting(false);
    }, 600);
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleTagBills = () => {
    setIsTagging(true);
    setTimeout(() => setIsTagging(false), 1200);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F3F4F6] overflow-hidden font-sans text-[#111827]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 flex gap-4">
          
          {/* Left Side: Outstanding Bills Table */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#FFFFFF] border border-[#D1D5DB] rounded shadow-sm">
            
            {/* Header & Search */}
            <div className="p-3 border-b border-[#D1D5DB] flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-[#0F4C75]">Outstanding Bills</h2>
            </div>
            <div className="p-3 border-b border-[#D1D5DB]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Party / Bill No. / Ref. No."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B5E8A] transition-colors"
                />
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead className="bg-[#F3F4F6] sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 border-b border-[#D1D5DB] w-10 text-center">
                      <input type="checkbox" className="rounded border-[#D1D5DB] text-[#0F4C75] focus:ring-[#1B5E8A]" />
                    </th>
                    <th className="text-left px-3 py-2 border-b border-[#D1D5DB] font-semibold text-[#111827]">Party Name</th>
                    <th className="text-left px-3 py-2 border-b border-[#D1D5DB] font-semibold text-[#111827]">Bill No.</th>
                    <th className="text-left px-3 py-2 border-b border-[#D1D5DB] font-semibold text-[#111827]">Bill Date</th>
                    <th className="text-left px-3 py-2 border-b border-[#D1D5DB] font-semibold text-[#111827]">Due Date</th>
                    <th className="text-left px-3 py-2 border-b border-[#D1D5DB] font-semibold text-[#111827]">Reference No.</th>
                    <th className="text-right px-3 py-2 border-b border-[#D1D5DB] font-semibold text-[#111827]">Outstanding Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.length > 0 ? (
                    filteredBills.map((bill, idx) => (
                      <tr key={idx} className={`border-b border-[#F3F4F6] hover:bg-[#eaf4fa] transition-colors ${idx % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#fbfbfb]"}`}>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" className="rounded border-[#D1D5DB] text-[#0F4C75] focus:ring-[#1B5E8A]" />
                        </td>
                        <td className="px-3 py-2 font-medium">{bill.partyName}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{bill.billNo}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{bill.billDate}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{bill.dueDate}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{bill.refNo}</td>
                        <td className="px-3 py-2 text-right font-semibold">{bill.amount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-[#6B7280] text-[13px]">
                        No outstanding bills found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="p-2 border-t border-[#D1D5DB] bg-[#F3F4F6] flex justify-between items-center text-[12px]">
              <span className="text-[#6B7280]">Total Records: {filteredBills.length}</span>
              <div className="flex gap-1">
                <button className="px-2 py-1 border border-[#D1D5DB] bg-white rounded text-[#6B7280] hover:bg-gray-50 transition-colors" disabled>&laquo;</button>
                <button className="px-2 py-1 border border-[#D1D5DB] bg-white rounded text-[#6B7280] hover:bg-gray-50 transition-colors" disabled>&lsaquo;</button>
                <button className="px-3 py-1 border border-[#D1D5DB] bg-white rounded font-medium">1</button>
                <button className="px-2 py-1 border border-[#D1D5DB] bg-white rounded text-[#6B7280] hover:bg-gray-50 transition-colors" disabled>&rsaquo;</button>
                <button className="px-2 py-1 border border-[#D1D5DB] bg-white rounded text-[#6B7280] hover:bg-gray-50 transition-colors" disabled>&raquo;</button>
              </div>
            </div>
          </div>

          {/* Right Side: Tagging Control */}
          <div className="w-80 flex flex-col bg-[#FFFFFF] border border-[#D1D5DB] rounded shadow-sm shrink-0">
            <div className="p-3 border-b border-[#D1D5DB]">
              <h2 className="text-[14px] font-semibold text-[#0F4C75]">Tagging Control</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 text-[12px]">
              
              {/* Tag Index */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#111827] flex items-center gap-1 font-medium">
                  Tag Index <span className="w-3.5 h-3.5 rounded-full border border-[#D1D5DB] inline-flex items-center justify-center text-[9px] text-[#6B7280] cursor-help">?</span>
                </label>
                <select 
                  className="w-full border border-[#D1D5DB] rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#1B5E8A] transition-colors bg-white hover:border-gray-400 cursor-pointer"
                  value={tagIndex}
                  onChange={(e) => setTagIndex(e.target.value)}
                >
                  <option value="COLL-001 (Primary Collection)">COLL-001 (Primary Collection)</option>
                  <option value="COLL-002 (Secondary Collection)">COLL-002 (Secondary Collection)</option>
                </select>
              </div>

              {/* Tag For */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#111827] font-medium">Tag For</label>
                <select 
                  className="w-32 border border-[#D1D5DB] rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#1B5E8A] transition-colors bg-white hover:border-gray-400 cursor-pointer"
                  value={tagFor}
                  onChange={(e) => setTagFor(e.target.value)}
                >
                  <option value="Collection">Collection</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>

              {/* Negative Amount Toggle */}
              <div className="flex items-center justify-between border-t border-[#F3F4F6] pt-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[#111827] font-medium flex items-center gap-1">
                    Negative Amount <span className="w-3.5 h-3.5 rounded-full border border-[#D1D5DB] inline-flex items-center justify-center text-[9px] text-[#6B7280] cursor-help">?</span>
                  </label>
                  <span className="text-[#6B7280] text-[11px] ml-6">P.D. Cheque</span>
                </div>
                <button 
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${negativeAmount ? 'bg-[#1B5E8A]' : 'bg-gray-300'}`}
                  onClick={() => setNegativeAmount(!negativeAmount)}
                >
                  <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${negativeAmount ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* W/o Repl./Adv. */}
              <div className="flex flex-col gap-2 border-t border-[#F3F4F6] pt-3">
                <label className="text-[#111827] font-medium flex items-center justify-between">
                  W/o Repl./Adv. 
                  <span className="w-3.5 h-3.5 rounded-full border border-[#D1D5DB] inline-flex items-center justify-center text-[9px] text-[#6B7280] cursor-help">?</span>
                </label>
                <div className="flex border border-[#D1D5DB] rounded overflow-hidden shadow-sm">
                  {["With", "Without", "Both"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setWOrWithout(opt)}
                      className={`flex-1 py-1.5 text-[12px] transition-colors focus:outline-none ${
                        wOrWithout === opt 
                        ? 'bg-[#0F4C75] text-white font-medium' 
                        : 'bg-white text-[#111827] hover:bg-gray-50 border-r border-[#D1D5DB] last:border-0'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Load Cash Toggle */}
              <div className="flex items-center justify-between border-t border-[#F3F4F6] pt-3">
                <label className="text-[#111827] font-medium flex items-center gap-1">
                  Load Cash <span className="w-3.5 h-3.5 rounded-full border border-[#D1D5DB] inline-flex items-center justify-center text-[9px] text-[#6B7280] cursor-help">?</span>
                </label>
                <button 
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${loadCash ? 'bg-[#1B5E8A]' : 'bg-gray-300'}`}
                  onClick={() => setLoadCash(!loadCash)}
                >
                  <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${loadCash ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Party Category */}
              <div className="flex flex-col gap-1.5 border-t border-[#F3F4F6] pt-3">
                <label className="text-[#111827] font-medium">Party Category</label>
                <select 
                  className="w-36 border border-[#D1D5DB] rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#1B5E8A] transition-colors bg-white hover:border-gray-400 cursor-pointer"
                  value={partyCategory}
                  onChange={(e) => setPartyCategory(e.target.value)}
                >
                  <option value="All Categories">All Categories</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
              </div>

              {/* Remark */}
              <div className="flex flex-col gap-1.5 border-t border-[#F3F4F6] pt-3">
                <label className="text-[#111827] font-medium">Remark</label>
                <textarea 
                  className="w-full border border-[#D1D5DB] rounded p-2 text-[13px] min-h-[60px] resize-none focus:outline-none focus:border-[#1B5E8A] transition-colors hover:border-gray-400"
                  placeholder="Enter remark here..."
                  maxLength={250}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
                <span className="text-[10px] text-[#6B7280] text-right">{remark.length}/250</span>
              </div>

              {/* More Options */}
              <div className="pt-1">
                <button className="text-[#0F4C75] font-semibold hover:underline text-[13px] focus:outline-none">
                  More Options
                </button>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-[#D1D5DB] flex gap-2 justify-end bg-[#fbfbfb]">
              <button 
                onClick={handleReset}
                disabled={isResetting}
                className="px-4 py-1.5 text-[13px] border border-[#D1D5DB] rounded text-[#111827] bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#1B5E8A] transition-all flex items-center justify-center min-w-[70px]"
              >
                {isResetting ? <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" /> : "Reset"}
              </button>
              <button 
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-4 py-1.5 text-[13px] border border-[#D1D5DB] rounded text-[#111827] bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#1B5E8A] transition-all flex items-center justify-center min-w-[100px]"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" /> : "Save as Draft"}
              </button>
              <button 
                onClick={handleTagBills}
                disabled={isTagging}
                className="px-4 py-1.5 text-[13px] bg-[#0F4C75] text-white rounded hover:bg-[#0c3a59] focus:outline-none focus:ring-2 focus:ring-[#0F4C75] focus:ring-offset-1 transition-all flex items-center justify-center gap-1.5 min-w-[100px] font-medium shadow-sm hover:shadow"
              >
                {isTagging ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Tag Bills
                  </>
                )}
              </button>
            </div>
          </div>
          
        </main>
      </div>
      <BusinessFooter />
    </div>
  );
}
