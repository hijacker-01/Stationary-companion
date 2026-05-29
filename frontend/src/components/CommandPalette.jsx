import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Search, X } from "lucide-react";

const ROUTES = [
  { name: "New Bill", path: "/billing" },
  { name: "Sales Challan", path: "/sales-challan" },
  { name: "Purchase Challan", path: "/purchase-challan" },
  { name: "Receipt Voucher", path: "/receipt-voucher" },
  { name: "Payment Voucher", path: "/payment-voucher" },
  { name: "Dashboard", path: "/dashboard" },
  { name: "Inventory", path: "/inventory" },
  { name: "Ledger", path: "/ledger" },
  { name: "Debtors", path: "/debtors" },
  { name: "Creditors", path: "/creditors" },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearch("");
      setIsListening(false);
    }
  }, [isOpen]);

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    
    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      // Auto-navigate if match found
      const match = ROUTES.find(r => r.name.toLowerCase().includes(transcript.toLowerCase()));
      if (match) {
        navigate(match.path);
        setIsOpen(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  if (!isOpen) return null;

  const filteredRoutes = ROUTES.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && filteredRoutes.length > 0) {
      handleSelect(filteredRoutes[0].path);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-start pt-[15vh] z-[9999]">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-2" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
            placeholder="Search commands or routes (e.g. 'New Bill') or use Voice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleInputKeyDown}
            tabIndex={0}
          />
          <button
            type="button"
            className={`p-1.5 rounded-md mx-2 transition-colors ${
              isListening ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
            onClick={toggleVoice}
            title="Use Voice Command"
            tabIndex={-1}
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            onClick={() => setIsOpen(false)}
            tabIndex={-1}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2 bg-[#f4f4f4]">
          {filteredRoutes.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No results found.
            </div>
          ) : (
            filteredRoutes.map((route, index) => (
              <button
                key={route.path}
                className="w-full text-left px-3 py-2.5 rounded-md text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 focus:bg-teal-50 focus:text-teal-700 focus:outline-none transition-colors mb-1 flex items-center justify-between group"
                onClick={() => handleSelect(route.path)}
                tabIndex={0}
              >
                <span className="font-medium">{route.name}</span>
                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 uppercase tracking-wider font-semibold">Enter</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
