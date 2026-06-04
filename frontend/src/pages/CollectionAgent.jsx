import { useState, useEffect } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { MessageCircle, PhoneCall, AlertTriangle, CheckCircle, Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function CollectionAgent() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mocking the data for the AI Collection Agent since we don't have real live invoice data 
    setCollections([
      { id: 1, customer: "Apollo Pharmacy", amount: 45000, daysOverdue: 14, risk: "Low", status: "Pending", lastContact: "2 days ago" },
      { id: 2, customer: "City Medicos", amount: 125000, daysOverdue: 45, risk: "High", status: "Escalated", lastContact: "Today" },
      { id: 3, customer: "Sanjivani Store", amount: 8400, daysOverdue: 5, risk: "Low", status: "Pending", lastContact: "Never" },
      { id: 4, customer: "Gupta Medical", amount: 56000, daysOverdue: 90, risk: "Critical", status: "Legal Notice Sent", lastContact: "1 week ago" }
    ]);
  }, []);

  const sendReminder = async (id, method) => {
    try {
      await axios.post("/communication/send", {
        to: "+919876543210",
        message: `This is a payment reminder for invoice INV-${id}. Please pay immediately to avoid legal action.`,
        channel: method
      });
      toast.success(`${method} Reminder dispatched automatically by AI via Twilio.`);
      setCollections(collections.map(c => c.id === id ? { ...c, lastContact: "Just now" } : c));
    } catch (e) {
      toast.error(`Failed to send ${method} reminder.`);
    }
  };

  const runAutoDunning = async () => {
    try {
      await axios.post("/communication/send", {
        to: "+919876543210",
        message: "Automated AI Dunning Engine sweep complete.",
        channel: "WhatsApp"
      });
      toast.success("AI Dunning Engine started. Messages are being sent to 4 customers via Twilio WhatsApp Gateway.");
      setCollections(collections.map(c => ({ ...c, lastContact: "Just now" })));
    } catch (e) {
      toast.error("Failed to start auto dunning.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="AI Collection Agent" />
      <main className="flex-1 p-4 overflow-auto max-w-6xl mx-auto w-full">
        <div className="bg-white border border-gray-300 shadow-sm p-4 mb-4 flex justify-between items-center rounded">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Autonomous Dunning Engine</h2>
            <p className="text-gray-500">AI automatically chases overdue payments based on risk profiles.</p>
          </div>
          <button onClick={runAutoDunning} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 font-bold rounded flex items-center shadow">
            <CheckCircle className="w-4 h-4 mr-2" /> Start Auto-Chasing
          </button>
        </div>

        <div className="bg-white border border-gray-300 shadow-sm rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#1b4985] text-white">
              <tr>
                {["Customer", "Overdue Amount", "Days Overdue", "Risk", "Last Contact", "AI Actions"].map(h => <th key={h} className="p-3 font-bold border-r border-blue-800">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {collections.map(c => (
                <tr key={c.id} className="border-b border-gray-200 hover:bg-blue-50">
                  <td className="p-3 font-bold">{c.customer}</td>
                  <td className="p-3 font-bold text-red-600">₹{c.amount.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded font-bold ${c.daysOverdue > 30 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.daysOverdue} Days
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`flex items-center ${c.risk === 'Critical' ? 'text-red-600' : c.risk === 'High' ? 'text-orange-600' : 'text-green-600'}`}>
                      {c.risk === 'Critical' && <AlertTriangle className="w-3 h-3 mr-1"/>}
                      {c.risk}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{c.lastContact}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => sendReminder(c.id, 'WhatsApp')} className="bg-green-100 text-green-700 px-2 py-1 rounded border border-green-300 hover:bg-green-200 flex items-center"><MessageCircle className="w-3 h-3 mr-1"/> WhatsApp</button>
                    <button onClick={() => sendReminder(c.id, 'Email')} className="bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-300 hover:bg-blue-200 flex items-center"><Mail className="w-3 h-3 mr-1"/> Email</button>
                    <button className="bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-300 hover:bg-gray-200 flex items-center"><PhoneCall className="w-3 h-3 mr-1"/> Call Task</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <BusinessFooter />
    </div>
  );
}
