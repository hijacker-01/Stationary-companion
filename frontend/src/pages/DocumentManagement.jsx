import React, { useState } from 'react';
import Header from '../components/Header';
import BusinessFooter from '../components/BusinessFooter';
import { FileText, Download, Eye, Upload, Search } from 'lucide-react';
import axios from 'axios';

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function DocumentManagement() {
  const [documents, setDocuments] = useState([
    { id: 'DOC-001', type: 'Drug License (Form 20)', number: 'MH-MZ1-123456', issueDate: '2020-01-15', expiryDate: '2025-01-14', status: 'Active' },
    { id: 'DOC-002', type: 'Drug License (Form 21)', number: 'MH-MZ1-123457', issueDate: '2020-01-15', expiryDate: '2025-01-14', status: 'Active' },
    { id: 'DOC-003', type: 'GST Certificate', number: '27AAAAA0000A1Z5', issueDate: '2018-04-01', expiryDate: 'N/A', status: 'Active' },
    { id: 'DOC-004', type: 'FSSAI License', number: '11518000000123', issueDate: '2022-06-10', expiryDate: '2024-06-09', status: 'Expired' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = documents.filter(doc => 
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-gray-800 font-sans text-xs">
      <Header />
      <div className="flex-1 p-2 flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-2">
          <h1 className="text-sm font-bold uppercase flex items-center gap-2">
            <FileText className="w-4 h-4" /> Document Management System
          </h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search Documents..." 
                className="pl-6 pr-2 py-1 border border-gray-300 w-48 focus:outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                tabIndex={0}
              />
            </div>
            <button className="flex items-center gap-1 bg-[#d0e0e3] border border-[#a2b9bc] px-2 py-1 font-semibold hover:bg-[#b8d1d5] focus:outline-none focus:ring-1 focus:ring-blue-500" tabIndex={0}>
              <Upload className="w-3 h-3" /> Upload New
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-300 shadow-sm flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200 border-b border-gray-300 text-gray-700">
                <th className="p-1.5 font-semibold border-r border-gray-300">Doc ID</th>
                <th className="p-1.5 font-semibold border-r border-gray-300">Document Type</th>
                <th className="p-1.5 font-semibold border-r border-gray-300">License / Reg. Number</th>
                <th className="p-1.5 font-semibold border-r border-gray-300 w-24">Issue Date</th>
                <th className="p-1.5 font-semibold border-r border-gray-300 w-24">Expiry Date</th>
                <th className="p-1.5 font-semibold border-r border-gray-300 w-20">Status</th>
                <th className="p-1.5 font-semibold w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-200 hover:bg-yellow-50 focus-within:bg-blue-50">
                  <td className="p-1.5 border-r border-gray-200">{doc.id}</td>
                  <td className="p-1.5 border-r border-gray-200 font-semibold">{doc.type}</td>
                  <td className="p-1.5 border-r border-gray-200">{doc.number}</td>
                  <td className="p-1.5 border-r border-gray-200">{doc.issueDate}</td>
                  <td className={`p-1.5 border-r border-gray-200 font-bold ${doc.status === 'Expired' ? 'text-red-600' : ''}`}>
                    {doc.expiryDate}
                  </td>
                  <td className="p-1.5 border-r border-gray-200">
                    <span className={`px-1 py-0.5 text-white ${doc.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-1.5 flex gap-1 justify-center">
                    <button className="bg-gray-100 hover:bg-gray-200 border border-gray-300 p-1 focus:outline-none focus:ring-1 focus:ring-blue-500" title="View" tabIndex={0}>
                      <Eye className="w-3 h-3 text-blue-600" />
                    </button>
                    <button className="bg-gray-100 hover:bg-gray-200 border border-gray-300 p-1 focus:outline-none focus:ring-1 focus:ring-blue-500" title="Download" tabIndex={0}>
                      <Download className="w-3 h-3 text-gray-700" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-500">No documents found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <BusinessFooter />
    </div>
  );
}
