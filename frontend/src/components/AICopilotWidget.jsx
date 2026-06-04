import { useState } from "react";
import { MessageSquare, X, Send, BrainCircuit, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AICopilotWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I am your AI ERP Copilot. Ask me anything about sales, profits, or stock." }
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = () => {
    if (!query.trim()) return;
    setMessages([...messages, { role: "user", text: query }]);
    setQuery("");
    setLoading(true);
    
    // Simulate AI thinking and responding
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "ai", 
        text: "I am analyzing your data. Currently, your inventory turnover is healthy, but 3 items are nearing expiry. Would you like me to draft a liquidation plan?" 
      }]);
      setLoading(false);
    }, 1500);
  };

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-[#1b4985] text-white p-4 rounded-full shadow-2xl hover:bg-blue-800 transition-all z-50 animate-bounce hover:animate-none flex items-center gap-2"
      >
        <BrainCircuit className="w-6 h-6" />
        <span className="font-bold text-sm hidden md:inline">Ask AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-[#1b4985] text-white p-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2 font-bold">
          <BrainCircuit className="w-5 h-5 text-blue-200" />
          ERP Copilot
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setOpen(false); navigate("/copilot"); }} className="p-1 hover:bg-blue-700 rounded" title="Open Full Screen">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-blue-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 p-3 overflow-y-auto bg-gray-50 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`p-2.5 rounded-lg max-w-[85%] text-[11px] shadow-sm ${
              m.role === "user" ? "bg-[#1b4985] text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-2.5 rounded-lg rounded-bl-none shadow-sm flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-2 bg-white border-t border-gray-200 flex gap-2 shrink-0">
        <input 
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ask Copilot..." 
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-[11px] outline-none focus:border-blue-500"
        />
        <button 
          onClick={handleSend}
          disabled={!query.trim()}
          className="bg-[#1b4985] text-white p-2 rounded disabled:opacity-50 hover:bg-blue-800"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
