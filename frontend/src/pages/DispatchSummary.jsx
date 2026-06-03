import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  Calendar, 
  Package, 
  LayoutTemplate, 
  Filter,
  Wand2,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';

const DispatchSummary = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [wizardMode, setWizardMode] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Date & Billing
    selectionStyle: 'Custom',
    dateFrom: '',
    dateTo: '',
    tagFilter: '',
    type: 'A Sale',
    operatorName: '',
    billSeries: '',
    billFrom: '',
    billNumberFormat: '3 Length',
    cashCredit: 'Both',
    
    // Step 2: Item & Supply Details
    withChallan: true,
    suppliedItem: false,
    freeSeparate: true,
    itemSelection: 'All',
    itemIndexOn: 'P-Company',
    itemSet: '',
    mrpStock: 'BOTH',
    unitSelection: '1-Stock in 1st Unit',
    transport: '',

    // Step 3: Report Formatting
    billIndexOn: 'No',
    splitSummaryOn: 'N-No',
    reportFor: 'No Detail',
    lineOption: false,
    printFormat: 'Merge',
    printControl: 'No',
    format16DSelf: '5',
    singleAcGroup: false,
    selectGroup: 'All',

    // Step 4: Hierarchy Filters
    selectedParty: { active: false, tags: ['Max-Pharma Inc.', 'Apex Distributors'] },
    selectedCompany: { active: false, tags: [] },
    selectedArea: false,
    selectedMR: false,
    selectedRoute: { active: false, tags: ['South-East Route 12', 'Local Loop 5'] },
    selectedDeliveryMan: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleHierarchy = (field) => {
    setFormData(prev => {
      const current = prev[field];
      if (typeof current === 'object') {
        return { ...prev, [field]: { ...current, active: !current.active } };
      }
      return { ...prev, [field]: !current };
    });
  };

  const removeTag = (field, indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        tags: prev[field].tags.filter((_, i) => i !== indexToRemove)
      }
    }));
  };

  const steps = [
    {
      id: 1,
      title: "Date & Billing",
      subtitle: "Dispatch dates and billing information",
      icon: <Calendar className="w-5 h-5 text-emerald-600" />
    },
    {
      id: 2,
      title: "Item & Supply Details",
      subtitle: "Product and inventory information",
      icon: <Package className="w-5 h-5 text-emerald-600" />
    },
    {
      id: 3,
      title: "Report Formatting",
      subtitle: "Report template and export settings",
      icon: <LayoutTemplate className="w-5 h-5 text-emerald-600" />
    },
    {
      id: 4,
      title: "Hierarchy Filters",
      subtitle: "Organization and filtering options",
      icon: <Filter className="w-5 h-5 text-emerald-600" />
    }
  ];

  // Helper components for UI
  const InputGroup = ({ label, children, required = false }) => (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[13px] font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );

  const StyledInput = ({ type = "text", value, onChange, placeholder, icon }) => (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-10 px-3 text-[13px] text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-shadow placeholder-gray-400"
      />
      {icon && (
        <div className="absolute right-3 top-2.5 text-gray-400">
          {icon}
        </div>
      )}
    </div>
  );

  const StyledSelect = ({ value, onChange, options }) => (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full h-10 px-3 appearance-none text-[13px] text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-shadow cursor-pointer"
      >
        {options.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  );

  const ModernToggle = ({ checked, onChange, label }) => (
    <div className="flex items-center gap-3 mt-1 mb-4">
      <button
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${
          checked ? 'bg-emerald-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${
            checked ? 'transform translate-x-5' : ''
          }`}
        />
      </button>
      {label && <span className="text-[13px] font-medium text-gray-700">{label}</span>}
    </div>
  );

  const HierarchyToggle = ({ label, active, tags, field }) => (
    <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <button
        onClick={() => toggleHierarchy(field)}
        className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md font-bold text-sm transition-colors ${
          active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-200 text-gray-500'
        }`}
      >
        {active ? 'Y' : 'N'}
      </button>
      <div className="flex-1">
        <div className="text-[14px] font-medium text-gray-800 mb-2">{label}</div>
        {active && tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-md shadow-sm">
                <span className="text-[12px] text-gray-700 font-medium">{tag}</span>
                <button onClick={() => removeTag(field, idx)} className="text-gray-400 hover:text-red-500 focus:outline-none">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1000px] mx-auto p-6 md:p-8">
            
            {/* Top Header & Toolbar */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  LogiTrack ERP
                </h1>
                <p className="text-sm text-gray-500 mt-1">Dispatch Summary Form</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm">
                  <Wand2 className="w-4 h-4" /> AI Report Generator
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm">
                  <Search className="w-4 h-4" /> NLP Search
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm">
                  <Download className="w-4 h-4" /> Export
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button 
                  onClick={() => setWizardMode(!wizardMode)}
                  className={`flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md transition-all shadow-sm ${
                    wizardMode 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Wand2 className="w-4 h-4" /> Wizard Mode
                </button>
              </div>
            </div>

            {/* Accordion Layout */}
            <div className="space-y-4 pb-24">
              {steps.map((step) => {
                const isActive = activeStep === step.id;
                
                return (
                  <div 
                    key={step.id} 
                    className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
                      isActive ? 'border-emerald-200 shadow-md' : 'border-gray-200 shadow-sm hover:border-gray-300'
                    }`}
                  >
                    {/* Accordion Header */}
                    <button 
                      onClick={() => setActiveStep(step.id)}
                      className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
                        isActive ? 'bg-emerald-50/30' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-emerald-100' : 'bg-gray-100'
                        }`}>
                          {step.icon}
                        </div>
                        <div>
                          <h3 className={`text-base font-bold ${isActive ? 'text-gray-900' : 'text-gray-800'}`}>
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">{step.subtitle}</p>
                        </div>
                      </div>
                      <div className={`p-1 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400'}`}>
                        {isActive ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </button>

                    {/* Accordion Content */}
                    <div className={`transition-all duration-500 ease-in-out ${isActive ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="p-6 pt-2 border-t border-gray-100">
                        
                        {/* Content for Step 1: Date & Billing */}
                        {step.id === 1 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            <InputGroup label="Selection Style">
                              <StyledSelect value={formData.selectionStyle} onChange={(e) => handleInputChange('selectionStyle', e.target.value)} options={['Custom', 'Standard', 'Monthly', 'Yearly']} />
                            </InputGroup>
                            <InputGroup label="Tag Filter">
                              <StyledInput value={formData.tagFilter} onChange={(e) => handleInputChange('tagFilter', e.target.value)} placeholder="0" />
                            </InputGroup>

                            <InputGroup label="Date From" required>
                              <StyledInput type="date" value={formData.dateFrom} onChange={(e) => handleInputChange('dateFrom', e.target.value)} />
                            </InputGroup>
                            <InputGroup label="Date To" required>
                              <StyledInput type="date" value={formData.dateTo} onChange={(e) => handleInputChange('dateTo', e.target.value)} />
                            </InputGroup>

                            <InputGroup label="Type">
                              <StyledSelect value={formData.type} onChange={(e) => handleInputChange('type', e.target.value)} options={['A Sale', 'B Sale', 'Estimate', 'Challan']} />
                            </InputGroup>
                            <InputGroup label="Operator Name">
                              <StyledInput value={formData.operatorName} onChange={(e) => handleInputChange('operatorName', e.target.value)} placeholder="Select an operator" />
                            </InputGroup>

                            <InputGroup label="Bill Series">
                              <StyledInput value={formData.billSeries} onChange={(e) => handleInputChange('billSeries', e.target.value)} placeholder="e.g. SR01" />
                            </InputGroup>
                            <InputGroup label="Bill From">
                              <StyledInput value={formData.billFrom} onChange={(e) => handleInputChange('billFrom', e.target.value)} placeholder="Starting Bill No." />
                            </InputGroup>

                            <InputGroup label="Bill Number Format">
                              <StyledSelect value={formData.billNumberFormat} onChange={(e) => handleInputChange('billNumberFormat', e.target.value)} options={['3 Length', '4 Length', 'Full Length']} />
                            </InputGroup>
                            <InputGroup label="Cash/Credit Filter">
                              <StyledSelect value={formData.cashCredit} onChange={(e) => handleInputChange('cashCredit', e.target.value)} options={['Both', 'Cash', 'Credit']} />
                            </InputGroup>
                          </div>
                        )}

                        {/* Content for Step 2: Item & Supply Details */}
                        {step.id === 2 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            <InputGroup label="Item Selection">
                              <StyledSelect value={formData.itemSelection} onChange={(e) => handleInputChange('itemSelection', e.target.value)} options={['All', 'Specific Category', 'Selected Items']} />
                            </InputGroup>
                            <InputGroup label="Transport Details">
                              <StyledInput value={formData.transport} onChange={(e) => handleInputChange('transport', e.target.value)} placeholder="Transport name or ID" />
                            </InputGroup>

                            <InputGroup label="Item Index On">
                              <StyledSelect value={formData.itemIndexOn} onChange={(e) => handleInputChange('itemIndexOn', e.target.value)} options={['P-Company', 'Item Name', 'Item Code', 'Category']} />
                            </InputGroup>
                            <InputGroup label="Item Set">
                              <StyledSelect value={formData.itemSet} onChange={(e) => handleInputChange('itemSet', e.target.value)} options={['All Sets', 'None']} />
                            </InputGroup>

                            <InputGroup label="MRP/Stock Selection">
                              <StyledSelect value={formData.mrpStock} onChange={(e) => handleInputChange('mrpStock', e.target.value)} options={['BOTH', 'MRP Only', 'Stock Only']} />
                            </InputGroup>
                            <InputGroup label="Unit Selection">
                              <StyledSelect value={formData.unitSelection} onChange={(e) => handleInputChange('unitSelection', e.target.value)} options={['1-Stock in 1st Unit', '2-Stock in 2nd Unit']} />
                            </InputGroup>

                            <div className="col-span-1 md:col-span-2 pt-2 pb-2">
                              <h4 className="text-[13px] font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Toggles</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <ModernToggle checked={formData.withChallan} onChange={() => toggleHierarchy('withChallan')} label="With Challan" />
                                <ModernToggle checked={formData.suppliedItem} onChange={() => toggleHierarchy('suppliedItem')} label="Supplied Item" />
                                <ModernToggle checked={formData.freeSeparate} onChange={() => toggleHierarchy('freeSeparate')} label="Free Separate" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Content for Step 3: Report Formatting */}
                        {step.id === 3 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            <InputGroup label="Bill Index On">
                              <StyledSelect value={formData.billIndexOn} onChange={(e) => handleInputChange('billIndexOn', e.target.value)} options={['No', 'Yes', 'Date-wise', 'Party-wise']} />
                            </InputGroup>
                            <InputGroup label="Split Summary On">
                              <StyledSelect value={formData.splitSummaryOn} onChange={(e) => handleInputChange('splitSummaryOn', e.target.value)} options={['N-No', 'Y-Yes', 'By Area']} />
                            </InputGroup>

                            <InputGroup label="Report For">
                              <StyledSelect value={formData.reportFor} onChange={(e) => handleInputChange('reportFor', e.target.value)} options={['No Detail', 'Detailed', 'Summary']} />
                            </InputGroup>
                            <InputGroup label="Print Format">
                              <StyledSelect value={formData.printFormat} onChange={(e) => handleInputChange('printFormat', e.target.value)} options={['Merge', 'Separate', 'Condensed']} />
                            </InputGroup>

                            <InputGroup label="Format 1-6/D/Self">
                              <StyledSelect value={formData.format16DSelf} onChange={(e) => handleInputChange('format16DSelf', e.target.value)} options={['5', '1', '2', '3', '4', '6', 'D', 'Self']} />
                            </InputGroup>
                            <InputGroup label="Print Control (Second Option)">
                              <StyledSelect value={formData.printControl} onChange={(e) => handleInputChange('printControl', e.target.value)} options={['No', 'Yes']} />
                            </InputGroup>
                            
                            <InputGroup label="Select Data">
                              <StyledSelect value={formData.selectGroup} onChange={(e) => handleInputChange('selectGroup', e.target.value)} options={['All', 'Specific']} />
                            </InputGroup>
                            
                            <div className="pt-6 pl-2 flex gap-8">
                                <ModernToggle checked={formData.lineOption} onChange={() => toggleHierarchy('lineOption')} label="Line Option" />
                                <ModernToggle checked={formData.singleAcGroup} onChange={() => toggleHierarchy('singleAcGroup')} label="Single A/c Group" />
                            </div>
                          </div>
                        )}

                        {/* Content for Step 4: Hierarchy Filters */}
                        {step.id === 4 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <HierarchyToggle 
                              label="Selected Party Filter" 
                              active={formData.selectedParty.active} 
                              tags={formData.selectedParty.tags} 
                              field="selectedParty" 
                            />
                            <HierarchyToggle 
                              label="Selected Route Filter" 
                              active={formData.selectedRoute.active} 
                              tags={formData.selectedRoute.tags} 
                              field="selectedRoute" 
                            />
                            <HierarchyToggle 
                              label="Selected Company Filter" 
                              active={formData.selectedCompany.active} 
                              tags={formData.selectedCompany.tags} 
                              field="selectedCompany" 
                            />
                            <HierarchyToggle 
                              label="Selected Area Filter" 
                              active={formData.selectedArea} 
                              field="selectedArea" 
                            />
                            <HierarchyToggle 
                              label="Selected M.R. Filter" 
                              active={formData.selectedMR} 
                              field="selectedMR" 
                            />
                            <HierarchyToggle 
                              label="Selected Delivery Man Filter" 
                              active={formData.selectedDeliveryMan} 
                              field="selectedDeliveryMan" 
                            />
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
        </main>

        {/* Bottom Action Bar */}
        <div className="bg-white border-t border-gray-200 p-4 px-8 flex justify-end gap-3 fixed bottom-0 right-0 w-[calc(100%-16rem)] z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            Cancel
          </button>
          <button className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2">
            Generate Report
          </button>
        </div>

      </div>
    </div>
  );
};

export default DispatchSummary;
