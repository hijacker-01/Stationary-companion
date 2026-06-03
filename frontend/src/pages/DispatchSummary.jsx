import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  Calendar, Package, LayoutTemplate, Filter,
  Wand2, Search, Download, ChevronRight, ChevronLeft, Save
} from 'lucide-react';

const DispatchSummary = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Form State based on the new screenshot
  const [formData, setFormData] = useState({
    // Step 1: Date & Billing
    dispatchDate: '',
    billingPeriodStart: '',
    billingPeriodEnd: '',
    invoiceNumber: '',
    customerAccount: '',
    billingAddress: '',
    paymentTerms: '',
    taxCode: '',
    currency: '',
    amountDue: '',
    billable: true,
    
    // Step 2: Item & Supply Details
    lineItemSku: '',
    itemDescription: '',
    quantityOrdered: '',
    unitOfMeasure: '',
    unitPrice: '',
    lineTotal: '',
    warehouseLocation: '',
    stockStatus: '',
    supplierId: '',
    backorderAllowed: false,
    specialInstructions: '',

    // Step 3: Report Formatting
    reportTemplate: '',
    titleFontSize: '',
    bodyFontSize: '',
    showHeader: true,
    showFooter: true,
    pageOrientation: '',
    exportFormat: '',
    columnVisibility: [],
    sortBy: '',
    groupBy: '',
    includeSummaryStats: true,

    // Step 4: Hierarchy Filters
    region: '',
    division: '',
    department: '',
    team: '',
    salesperson: '',
    projectCode: '',
    customerType: '',
    productCategory: '',
    marketSegment: '',
    businessUnit: '',
    activeStatusOnly: true
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleField = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const steps = [
    { id: 1, title: "Date & Billing", icon: <Calendar className="w-4 h-4" /> },
    { id: 2, title: "Item & Supply Details", icon: <Package className="w-4 h-4" /> },
    { id: 3, title: "Report Formatting", icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: 4, title: "Hierarchy Filters", icon: <Filter className="w-4 h-4" /> }
  ];

  // Helper components for UI
  const HorizontalInputGroup = ({ label, children }) => (
    <div className="flex items-center gap-4 mb-3">
      <label className="text-[13px] font-semibold text-gray-700 w-[160px] flex-shrink-0">
        {label}
      </label>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );

  const StyledInput = ({ type = "text", value, onChange, placeholder, icon, readOnly = false }) => (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full h-9 px-3 text-[13px] text-gray-800 bg-white border border-gray-300 rounded focus:outline-none focus:border-[#1b4985] focus:ring-1 focus:ring-[#1b4985] transition-shadow placeholder-gray-400 ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
      />
      {icon && (
        <div className="absolute right-2.5 top-2 text-gray-400">
          {icon}
        </div>
      )}
    </div>
  );

  const StyledTextarea = ({ value, onChange, placeholder }) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-20 px-3 py-2 text-[13px] text-gray-800 bg-white border border-gray-300 rounded focus:outline-none focus:border-[#1b4985] focus:ring-1 focus:ring-[#1b4985] transition-shadow placeholder-gray-400 resize-none"
    />
  );

  const StyledSelect = ({ value, onChange, options, placeholder = "Select option..." }) => (
    <select
      value={value}
      onChange={onChange}
      className="w-full h-9 px-3 text-[13px] text-gray-800 bg-white border border-gray-300 rounded focus:outline-none focus:border-[#1b4985] focus:ring-1 focus:ring-[#1b4985] transition-shadow"
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((opt, i) => (
        <option key={i} value={opt}>{opt}</option>
      ))}
    </select>
  );

  const PillToggle = ({ checked, onChange }) => (
    <div className="inline-flex bg-gray-200 rounded-full p-0.5 cursor-pointer select-none border border-gray-300" onClick={onChange}>
      <div className={`px-3 py-0.5 text-xs font-bold rounded-full transition-colors ${checked ? 'bg-[#1b4985] text-white shadow' : 'text-gray-500'}`}>Y</div>
      <div className={`px-3 py-0.5 text-xs font-bold rounded-full transition-colors ${!checked ? 'bg-gray-400 text-white shadow' : 'text-gray-500'}`}>N</div>
    </div>
  );

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(c => c + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1000px] mx-auto p-6 md:p-8">
            
            {/* Top Header & Toolbar */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Dispatch Summary Form
              </h1>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-[#eef2f6] border border-gray-300 rounded hover:bg-gray-200 transition-colors">
                  <Wand2 className="w-3.5 h-3.5" /> AI Report Generator
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-[#eef2f6] border border-gray-300 rounded hover:bg-gray-200 transition-colors">
                  <Search className="w-3.5 h-3.5" /> NLP Search
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-[#eef2f6] border border-gray-300 rounded hover:bg-gray-200 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
              {steps.map(step => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-[#f8f9fa] px-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    currentStep === step.id ? 'border-[#1b4985] bg-[#1b4985] text-white shadow-md' :
                    currentStep > step.id ? 'border-[#1b4985] bg-white text-[#1b4985]' :
                    'border-gray-300 bg-white text-gray-400'
                  }`}>
                    {step.icon}
                  </div>
                  <span className={`text-xs font-bold ${currentStep === step.id ? 'text-[#1b4985]' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Main Form Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 lg:p-8 min-h-[450px]">
              
              {/* Step 1: Date & Billing */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                  <div className="flex flex-col">
                    <HorizontalInputGroup label="Dispatch Date">
                      <StyledInput type="date" value={formData.dispatchDate} onChange={(e) => handleInputChange('dispatchDate', e.target.value)} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Billing Period Start">
                      <StyledInput type="date" value={formData.billingPeriodStart} onChange={(e) => handleInputChange('billingPeriodStart', e.target.value)} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Billing Period End">
                      <StyledInput type="date" value={formData.billingPeriodEnd} onChange={(e) => handleInputChange('billingPeriodEnd', e.target.value)} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Invoice Number">
                      <StyledInput value={formData.invoiceNumber} onChange={(e) => handleInputChange('invoiceNumber', e.target.value)} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Customer Account">
                      <StyledSelect value={formData.customerAccount} onChange={(e) => handleInputChange('customerAccount', e.target.value)} options={['Acct 001', 'Acct 002', 'Acct 003']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Billing Address">
                      <StyledTextarea value={formData.billingAddress} onChange={(e) => handleInputChange('billingAddress', e.target.value)} />
                    </HorizontalInputGroup>
                  </div>
                  <div className="flex flex-col">
                    <HorizontalInputGroup label="Payment Terms">
                      <StyledSelect value={formData.paymentTerms} onChange={(e) => handleInputChange('paymentTerms', e.target.value)} options={['Net 30', 'Net 60', 'Due on Receipt']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Tax Code">
                      <StyledSelect value={formData.taxCode} onChange={(e) => handleInputChange('taxCode', e.target.value)} options={['GST 5%', 'GST 12%', 'GST 18%', 'Exempt']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Currency">
                      <StyledSelect value={formData.currency} onChange={(e) => handleInputChange('currency', e.target.value)} options={['INR', 'USD', 'EUR']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Amount Due">
                      <StyledInput value={formData.amountDue} onChange={(e) => handleInputChange('amountDue', e.target.value)} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Billable?">
                      <PillToggle checked={formData.billable} onChange={() => toggleField('billable')} />
                    </HorizontalInputGroup>
                  </div>
                </div>
              )}

              {/* Step 2: Item & Supply Details */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                  <div className="flex flex-col">
                    <HorizontalInputGroup label="Line Item SKU">
                      <StyledInput value={formData.lineItemSku} onChange={(e) => handleInputChange('lineItemSku', e.target.value)} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Item Description">
                      <StyledInput value={formData.itemDescription} onChange={(e) => handleInputChange('itemDescription', e.target.value)} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Quantity Ordered">
                      <StyledInput type="number" value={formData.quantityOrdered} onChange={(e) => handleInputChange('quantityOrdered', e.target.value)} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Unit of Measure">
                      <StyledSelect value={formData.unitOfMeasure} onChange={(e) => handleInputChange('unitOfMeasure', e.target.value)} options={['Box', 'Piece', 'Kg', 'Liter']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Unit Price">
                      <StyledInput type="number" value={formData.unitPrice} onChange={(e) => handleInputChange('unitPrice', e.target.value)} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Line Total">
                      <StyledInput value={formData.lineTotal} readOnly={true} placeholder="Auto-calculated" />
                    </HorizontalInputGroup>
                  </div>
                  <div className="flex flex-col">
                    <HorizontalInputGroup label="Warehouse Location">
                      <StyledSelect value={formData.warehouseLocation} onChange={(e) => handleInputChange('warehouseLocation', e.target.value)} options={['Main WH', 'North Zone', 'South Zone']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Stock Status">
                      <StyledSelect value={formData.stockStatus} onChange={(e) => handleInputChange('stockStatus', e.target.value)} options={['In Stock', 'Out of Stock', 'Low Stock']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Supplier ID">
                      <StyledInput value={formData.supplierId} onChange={(e) => handleInputChange('supplierId', e.target.value)} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Backorder Allowed?">
                      <PillToggle checked={formData.backorderAllowed} onChange={() => toggleField('backorderAllowed')} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Special Instructions">
                      <StyledTextarea value={formData.specialInstructions} onChange={(e) => handleInputChange('specialInstructions', e.target.value)} />
                    </HorizontalInputGroup>
                  </div>
                </div>
              )}

              {/* Step 3: Report Formatting */}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                  <div className="flex flex-col">
                    <HorizontalInputGroup label="Report Template">
                      <StyledSelect value={formData.reportTemplate} onChange={(e) => handleInputChange('reportTemplate', e.target.value)} options={['Standard', 'Detailed', 'Executive Summary']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Title Font Size">
                      <StyledSelect value={formData.titleFontSize} onChange={(e) => handleInputChange('titleFontSize', e.target.value)} options={['12pt', '14pt', '16pt', '18pt']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Body Font Size">
                      <StyledSelect value={formData.bodyFontSize} onChange={(e) => handleInputChange('bodyFontSize', e.target.value)} options={['10pt', '11pt', '12pt']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Show Header?">
                      <PillToggle checked={formData.showHeader} onChange={() => toggleField('showHeader')} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Show Footer?">
                      <PillToggle checked={formData.showFooter} onChange={() => toggleField('showFooter')} />
                    </HorizontalInputGroup>
                  </div>
                  <div className="flex flex-col">
                    <HorizontalInputGroup label="Page Orientation">
                      <StyledSelect value={formData.pageOrientation} onChange={(e) => handleInputChange('pageOrientation', e.target.value)} options={['Portrait', 'Landscape']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Export Format">
                      <StyledSelect value={formData.exportFormat} onChange={(e) => handleInputChange('exportFormat', e.target.value)} options={['PDF', 'Excel', 'CSV', 'Word']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Column Visibility">
                      <StyledSelect value={formData.columnVisibility} onChange={(e) => handleInputChange('columnVisibility', e.target.value)} options={['All Columns', 'Essential Only', 'Custom']} placeholder="Multiselect Dropdown" />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Sort By">
                      <StyledSelect value={formData.sortBy} onChange={(e) => handleInputChange('sortBy', e.target.value)} options={['Date (Asc)', 'Date (Desc)', 'Amount', 'Customer']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Group By">
                      <StyledSelect value={formData.groupBy} onChange={(e) => handleInputChange('groupBy', e.target.value)} options={['None', 'Category', 'Region', 'Salesperson']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Include Summary Stats?">
                      <PillToggle checked={formData.includeSummaryStats} onChange={() => toggleField('includeSummaryStats')} />
                    </HorizontalInputGroup>
                  </div>
                </div>
              )}

              {/* Step 4: Hierarchy Filters */}
              {currentStep === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                  <div className="flex flex-col">
                    <HorizontalInputGroup label="Region">
                      <StyledSelect value={formData.region} onChange={(e) => handleInputChange('region', e.target.value)} options={['North', 'South', 'East', 'West']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Division">
                      <StyledSelect value={formData.division} onChange={(e) => handleInputChange('division', e.target.value)} options={['Retail', 'Wholesale', 'Institutional']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Department">
                      <StyledSelect value={formData.department} onChange={(e) => handleInputChange('department', e.target.value)} options={['Sales', 'Marketing', 'Operations']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Team">
                      <StyledSelect value={formData.team} onChange={(e) => handleInputChange('team', e.target.value)} options={['Alpha', 'Beta', 'Gamma']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Salesperson">
                      <StyledSelect value={formData.salesperson} onChange={(e) => handleInputChange('salesperson', e.target.value)} options={['John Doe', 'Jane Smith', 'Mike Johnson']} />
                    </HorizontalInputGroup>
                  </div>
                  <div className="flex flex-col">
                    <HorizontalInputGroup label="Project Code">
                      <StyledSelect value={formData.projectCode} onChange={(e) => handleInputChange('projectCode', e.target.value)} options={['PRJ-001', 'PRJ-002', 'PRJ-003']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Customer Type">
                      <StyledSelect value={formData.customerType} onChange={(e) => handleInputChange('customerType', e.target.value)} options={['Regular', 'VIP', 'New']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Product Category">
                      <StyledSelect value={formData.productCategory} onChange={(e) => handleInputChange('productCategory', e.target.value)} options={['Electronics', 'Apparel', 'FMCG']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Market Segment">
                      <StyledSelect value={formData.marketSegment} onChange={(e) => handleInputChange('marketSegment', e.target.value)} options={['Enterprise', 'SMB', 'Consumer']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Business Unit">
                      <StyledSelect value={formData.businessUnit} onChange={(e) => handleInputChange('businessUnit', e.target.value)} options={['BU1', 'BU2', 'BU3']} />
                    </HorizontalInputGroup>
                    <HorizontalInputGroup label="Active Status Only?">
                      <PillToggle checked={formData.activeStatusOnly} onChange={() => toggleField('activeStatusOnly')} />
                    </HorizontalInputGroup>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>

        {/* Bottom Navigation Bar */}
        <div className="bg-white border-t border-gray-200 p-4 px-8 flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div>
            <button 
              onClick={() => {}}
              className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded transition-colors ${
                currentStep === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            
            {currentStep < 4 ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-[#1b4985] rounded hover:bg-[#153b6b] transition-colors"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                className="flex items-center gap-1.5 px-6 py-2 text-sm font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Save & Generate
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DispatchSummary;
