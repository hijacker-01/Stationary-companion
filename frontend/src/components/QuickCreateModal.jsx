import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";

const CREATE_OPTIONS = [
  { label: "New Cash/Credit Bill", path: "/billing" },
  { label: "New Purchase Bill", path: "/purchase-bills" },
  { label: "New Sales Challan", path: "/sales-challan" },
  { label: "New Receipt Voucher", path: "/receipt-voucher" },
  { label: "New Payment Voucher", path: "/payment-voucher" },
  { label: "New Customer", path: "/customers" },
  { label: "New Supplier", path: "/suppliers" },
  { label: "New Item/Product", path: "/inventory" },
];

export default function QuickCreateModal({ isOpen, onClose }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      // useModalFocus will automatically focus the first focusable element.
      // We will make the buttons focusable so they get focus.
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < CREATE_OPTIONS.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : CREATE_OPTIONS.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      navigate(CREATE_OPTIONS[activeIndex].path);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onKeyDown={handleKeyDown}>
        <div className="px-4 py-3 bg-[#1b4985] text-white flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Quick Create (Alt + N)</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded focus:outline-none focus:ring-2 focus:ring-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2" ref={containerRef}>
          {CREATE_OPTIONS.map((opt, i) => {
            const isActive = activeIndex === i;
            return (
              <button
                key={i}
                tabIndex={isActive ? 0 : -1}
                className={`w-full text-left px-4 py-2.5 rounded text-sm font-semibold mb-1 transition-colors outline-none
                  ${isActive ? 'bg-[#1b4985] text-white' : 'text-slate-700 hover:bg-slate-100'}
                `}
                onFocus={() => setActiveIndex(i)}
                onClick={() => {
                  navigate(opt.path);
                  onClose();
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
          <span>Use <kbd className="bg-white border rounded px-1">↑</kbd> <kbd className="bg-white border rounded px-1">↓</kbd> to navigate</span>
          <span><kbd className="bg-white border rounded px-1">Enter</kbd> to select</span>
        </div>
      </div>
    </div>
  );
}
