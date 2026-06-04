import { useState, useRef, useEffect } from "react";
import axios from "../api/axios";
import { Bot, Send, User } from "lucide-react";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function AICopilot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your ERP Copilot. How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/ai/copilot", { prompt: input });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.response || "Here is your data." }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm sorry, I encountered an error answering your request." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#e5e5e5] overflow-hidden font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#f4f4f4] p-3 flex flex-col gap-2">
          {/* Top Bar */}
          <div className="bg-white border border-gray-300 rounded shadow-sm px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-gray-800">AI Copilot</span>
            </div>
          </div>
          
          {/* Chat Box */}
          <div className="flex-1 bg-white border border-gray-300 rounded shadow-sm flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded text-xs border ${msg.role === "assistant" ? "bg-gray-50 border-gray-300 text-gray-800" : "bg-blue-50 border-blue-200 text-blue-900"}`}>
                    <div className="flex items-center gap-1 font-bold mb-1 border-b pb-1 border-opacity-30 border-gray-400">
                      {msg.role === "assistant" ? <Bot className="w-3 h-3 text-blue-600" /> : <User className="w-3 h-3 text-blue-600" />}
                      {msg.role === "assistant" ? "ERP Copilot" : "You"}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] px-3 py-2 rounded text-xs border bg-gray-50 border-gray-300 text-gray-800">
                    <Bot className="w-3 h-3 inline mr-1 animate-pulse text-blue-600" /> Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Box */}
            <div className="p-2 border-t border-gray-300 bg-[#e8e8e8] flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 shadow-inner"
                placeholder="Ask something, e.g. 'Why did profit fall?'"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                tabIndex={1}
                autoFocus
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                tabIndex={2}
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </div>
        </main>
      </div>
      <BusinessFooter />
    </div>
  );
}
