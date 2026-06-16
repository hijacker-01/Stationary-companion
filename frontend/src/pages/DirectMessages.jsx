import { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import { MessageSquare, Send, User } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function DirectMessages() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreads, setUnreads] = useState({});
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const messagesEndRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/users");
      setUsers(res.data.filter(u => u.id !== currentUser.id));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnreadCounts = async () => {
    if (!currentUser.id) return;
    try {
      const res = await axios.get(`/messages/unread/${currentUser.id}`);
      setUnreads(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (otherId) => {
    if (!currentUser.id || !otherId) return;
    try {
      const res = await axios.get(`/messages/history/${currentUser.id}/${otherId}`);
      setMessages(res.data?.rows || res.data?.items || res.data?.data || res.data || []);
      scrollToBottom();
      fetchUnreadCounts(); // refresh unread counts since viewing them marks them read
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUnreadCounts();
    // In a real app we'd use WebSockets. For now, simple polling.
    const interval = setInterval(() => {
      fetchUnreadCounts();
      if (selectedUser) {
        fetchMessages(selectedUser.id);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const selectUser = (u) => {
    setSelectedUser(u);
    setMessages([]);
    fetchMessages(u.id);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    
    try {
      await axios.post("/messages/send", {
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: selectedUser.id,
        receiverName: selectedUser.name,
        message: newMessage
      });
      
      setNewMessage("");
      fetchMessages(selectedUser.id);
    } catch (err) {
      
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex p-8 gap-6 overflow-y-auto max-h-screen">
        
        {/* User List Panel */}
        <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-slate-900">Team Chat</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => selectUser(u)}
                className={`w-full flex items-center justify-between p-3 mb-1 rounded-xl transition cursor-pointer ${selectedUser?.id === u.id ? "bg-brand-50 border border-brand-200" : "hover:bg-slate-50 border border-transparent"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedUser?.id === u.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{u.role}</p>
                  </div>
                </div>
                {unreads[u.id] > 0 && (
                  <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreads[u.id]}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500 capitalize">{selectedUser.role}</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {messages.length === 0 && (
                  <div className="text-center text-slate-400 mt-20 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                )}
                {messages.map(m => {
                  const isMine = m.senderId === currentUser.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isMine ? "bg-brand-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-900 rounded-tl-sm shadow-sm"}`}>
                        <p>{m.message}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMine ? "text-brand-200" : "text-slate-400"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="form-input flex-1 !rounded-full"
                  />
                  <button type="submit" className="w-10 h-10 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex items-center justify-center transition shadow-sm cursor-pointer">
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a team member to start chatting</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
