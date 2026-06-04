import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function ReorderCenter() {
  const [formData, setFormData] = useState({
    generateReorder: 'Re-Order',
    selectSupplier: '',
    selectedCompany: 'MARG ERP LTD.-PHARMA DISTRIBUTION',
    reorderBasesOn: 'SALES',
    selectItems: 'A All Items',
    selectStore: 'No',
    reorderDate: '2026-05-29',
    reorderDaysX: '7 X 1.00',
    calculateDays: '7',
    supplierSelection: 'LAST SUPPLIER BASE',
    lessPurchaseOrder: 'No',
    orderQtyRoundoff: '3 Box/Min.Ord',
    roundedUpper: 'Yes',
    orderConvertScheme: 'Yes',
    ignoreSalesRate: 'No',
    moreOptions: 'No'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const SelectInput = ({ name, value, options }) => (
    <select
      name={name}
      value={value}
      onChange={handleChange}
      className="w-full h-7 px-2 text-[13px] text-gray-800 bg-white border border-gray-300 rounded-sm focus:outline-none focus:border-[#1b4985] focus:ring-1 focus:ring-[#1b4985] shadow-sm transition-colors"
    >
      <option value=""></option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );

  const TextInput = ({ name, value, type = "text", readOnly = false }) => (
    <input
      type={type}
      name={name}
      value={value}
      onChange={handleChange}
      readOnly={readOnly}
      className={`w-full h-7 px-2 text-[13px] text-gray-800 bg-white border border-gray-300 rounded-sm focus:outline-none focus:border-[#1b4985] focus:ring-1 focus:ring-[#1b4985] shadow-sm transition-colors ${
        readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
      }`}
    />
  );

  // Helper component for horizontal fields
  const FieldRow = ({ label, children }) => (
    <div className="flex items-center mb-1.5">
      <div className="w-[300px] flex-shrink-0 text-gray-700 text-[13px] font-semibold pl-2">
        {label}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#e5e5e5] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-100 to-gray-200">
          
          {/* Main ERP Modal Container */}
          <div className="w-full max-w-[850px] bg-white border border-[#1b4985] rounded-t shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
            
            {/* Blue Header */}
            <div className="bg-[#1b4985] text-white flex items-center justify-between px-4 py-2 border-b border-[#1b4985]">
              <h2 className="text-[14px] font-bold tracking-wider">REORDER ON SALES BASES</h2>
              <div className="flex items-center gap-2">
                <button className="w-6 h-6 flex items-center justify-center bg-[#153b6b] rounded text-xs font-bold hover:bg-[#102d51] transition-colors">?</button>
                <button className="w-6 h-6 flex items-center justify-center bg-[#153b6b] rounded text-xs font-bold hover:bg-red-500 transition-colors">X</button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 px-8 bg-[#f8f9fa] border-b border-gray-200">
              <div className="flex flex-col gap-1">
                
                <FieldRow label="Generate Reorder/Expiry">
                  <SelectInput name="generateReorder" value={formData.generateReorder} options={['Re-Order', 'Expiry']} />
                </FieldRow>

                <FieldRow label="Select Supplier">
                  <SelectInput name="selectSupplier" value={formData.selectSupplier} options={['Supplier A', 'Supplier B']} />
                </FieldRow>

                <FieldRow label="Selected COMPANY">
                  <TextInput name="selectedCompany" value={formData.selectedCompany} readOnly={true} />
                </FieldRow>

                <FieldRow label="Reorder Bases On">
                  <SelectInput name="reorderBasesOn" value={formData.reorderBasesOn} options={['SALES', 'PURCHASE', 'INVENTORY']} />
                </FieldRow>

                <FieldRow label="Select Items">
                  <SelectInput name="selectItems" value={formData.selectItems} options={['A All Items', 'S Selected Items']} />
                </FieldRow>

                <FieldRow label="Select Store">
                  <SelectInput name="selectStore" value={formData.selectStore} options={['No', 'Yes']} />
                </FieldRow>

                <FieldRow label="Re-Order as on Date">
                  <TextInput name="reorderDate" value={formData.reorderDate} type="date" />
                </FieldRow>

                <FieldRow label="Re-Order for Days X">
                  <TextInput name="reorderDaysX" value={formData.reorderDaysX} />
                </FieldRow>

                <FieldRow label="Calculate for Days">
                  <TextInput name="calculateDays" value={formData.calculateDays} />
                </FieldRow>

                <FieldRow label="Supplier Selection">
                  <SelectInput name="supplierSelection" value={formData.supplierSelection} options={['LAST SUPPLIER BASE', 'BEST RATE', 'DEFAULT']} />
                </FieldRow>

                <FieldRow label="Less Purchase Order">
                  <SelectInput name="lessPurchaseOrder" value={formData.lessPurchaseOrder} options={['No', 'Yes']} />
                </FieldRow>

                <FieldRow label="Order Qty. Roundoff in">
                  <SelectInput name="orderQtyRoundoff" value={formData.orderQtyRoundoff} options={['3 Box/Min.Ord', '1 Piece', '2 Dozen']} />
                </FieldRow>

                <FieldRow label="Rounded in Upper">
                  <SelectInput name="roundedUpper" value={formData.roundedUpper} options={['Yes', 'No']} />
                </FieldRow>

                <FieldRow label="Order Convert in Scheme">
                  <SelectInput name="orderConvertScheme" value={formData.orderConvertScheme} options={['Yes', 'No']} />
                </FieldRow>

                <FieldRow label="Ignore Sales of Rate">
                  <SelectInput name="ignoreSalesRate" value={formData.ignoreSalesRate} options={['No', 'Yes']} />
                </FieldRow>

                <FieldRow label="More Options">
                  <SelectInput name="moreOptions" value={formData.moreOptions} options={['No', 'Yes']} />
                </FieldRow>

              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex justify-center gap-4 py-4 bg-white border-t border-gray-200 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
              <button className="px-6 py-1.5 bg-gray-100 border border-gray-300 rounded text-gray-700 text-[13px] font-bold hover:bg-gray-200 transition-colors shadow-sm">
                Generate Order
              </button>
              <button className="px-6 py-1.5 bg-gray-100 border border-gray-300 rounded text-gray-700 text-[13px] font-bold hover:bg-gray-200 transition-colors shadow-sm">
                Cancel
              </button>
              <button 
                onClick={() => alert("🤖 AI Reorder Agent starting... analyzing 90-day velocity.")}
                className="px-6 py-1.5 ml-4 bg-gradient-to-r from-purple-600 to-indigo-600 border border-purple-800 rounded shadow-sm text-white text-[13px] font-bold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02]"
              >
                ✨ Run AI Reorder Agent
              </button>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
