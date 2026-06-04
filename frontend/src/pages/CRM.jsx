import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { Users, Calendar, Brain, Phone, MapPin, Search } from "lucide-react";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function CRM() {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Simulated fetch
    const fetchCRM = async () => {
      try {
        const { data } = await axios.get("/api/enterprise/crm/leads");
        setContacts(data.data || data);
      } catch (err) {
        setContacts([
          { id: 'C001', name: 'Dr. Sharma', type: 'Doctor', specialty: 'Cardiology', phone: '9876543210', location: 'City Center', lastVisit: '2023-10-10', nextAction: 'Pitch new heart health supplement combo', status: 'Warm' },
          { id: 'C002', name: 'Apollo Pharmacy', type: 'Chemist', specialty: 'Retail', phone: '9123456780', location: 'West End', lastVisit: '2023-10-05', nextAction: 'Remind about payment overdue & upcoming scheme', status: 'Hot' },
          { id: 'C003', name: 'Dr. Gupta', type: 'Doctor', specialty: 'Pediatrics', phone: '9988776655', location: 'North Square', lastVisit: '2023-09-20', nextAction: 'Schedule follow-up visit, drop samples', status: 'Cold' },
        ]);
      }
    };
    fetchCRM();
  }, []);

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.type.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="CRM - Contacts & AI Insights" />
      
      <main className="flex-1 p-2 flex flex-col gap-2 overflow-hidden">
        {/* Filters/Search */}
        <div className="bg-white border border-gray-300 p-2 flex items-center shadow-sm">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input 
            type="text" 
            placeholder="Search Doctors, Chemists..." 
            className="border border-gray-300 px-2 py-1 focus:outline-none focus:border-blue-500 w-64 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            tabIndex={1}
          />
          <div className="ml-auto flex gap-2">
            <button className="bg-gray-200 border border-gray-300 px-3 py-1 hover:bg-gray-300 focus:outline-none">All</button>
            <button className="bg-white border border-gray-300 px-3 py-1 hover:bg-gray-100 focus:outline-none">Doctors</button>
            <button className="bg-white border border-gray-300 px-3 py-1 hover:bg-gray-100 focus:outline-none">Chemists</button>
          </div>
        </div>

        {/* Contacts Table */}
        <section className="flex-1 bg-white border border-gray-300 shadow-sm flex flex-col">
          <div className="bg-gray-200 border-b border-gray-300 p-2 font-bold flex items-center">
            <Users className="w-4 h-4 mr-2" /> Contact Directory & Actions
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 sticky top-0 border-b border-gray-300 shadow-sm z-10">
                <tr>
                  <th className="p-1.5 border-r border-gray-300">ID</th>
                  <th className="p-1.5 border-r border-gray-300">Name</th>
                  <th className="p-1.5 border-r border-gray-300">Type</th>
                  <th className="p-1.5 border-r border-gray-300">Contact / Loc</th>
                  <th className="p-1.5 border-r border-gray-300">Last Visit</th>
                  <th className="p-1.5 border-r border-gray-300 bg-blue-50 text-blue-800">
                    <span className="flex items-center"><Brain className="w-3 h-3 mr-1"/> AI Next Action</span>
                  </th>
                  <th className="p-1.5 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(c => (
                  <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-1.5 border-r border-gray-300 font-mono text-gray-500">{c.id}</td>
                    <td className="p-1.5 border-r border-gray-300 font-bold">{c.name}</td>
                    <td className="p-1.5 border-r border-gray-300">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${c.type === 'Doctor' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'}`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="p-1.5 border-r border-gray-300">
                      <div className="flex items-center text-gray-600 mb-0.5"><Phone className="w-3 h-3 mr-1"/> {c.phone}</div>
                      <div className="flex items-center text-gray-600"><MapPin className="w-3 h-3 mr-1"/> {c.location}</div>
                    </td>
                    <td className="p-1.5 border-r border-gray-300">
                      <div className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-gray-400"/> {c.lastVisit}</div>
                    </td>
                    <td className="p-1.5 border-r border-gray-300 bg-blue-50/30 text-blue-900 font-medium italic">
                      {c.nextAction}
                    </td>
                    <td className="p-1.5 text-center">
                      <button className="bg-blue-600 text-white px-2 py-1 rounded shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-800 w-full" tabIndex={0}>
                        Log Visit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">No contacts found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <BusinessFooter />
    </div>
  );
}
