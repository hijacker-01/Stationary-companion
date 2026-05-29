import { useState, useEffect } from "react";

export default function BusinessFooter() {
  const [time, setTime] = useState(new Date());
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const settings = JSON.parse(localStorage.getItem("settings") || "{}");
  
  const companyName = settings.companyName || "BPartners Pharma Pvt. Ltd.";
  const address = settings.companyAddress || "123 Health Street, Medicity";
  const phone = settings.companyPhone || "+91 9876543210";
  const gst = settings.gstNumber || "23AAPCB1234C1Z5";
  const fy = settings.financialYear || "Apr., 2026 - Mar., 2027";

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="w-full bg-[#f4f4f4] border-t border-gray-300 z-50 flex flex-col shadow-[0_-2px_4px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-stretch bg-[#eaeaea]">
        
        {/* Left: Company Details */}
        <div className="p-2 pl-4 flex flex-col justify-center text-[11px] font-mono leading-tight text-gray-800">
          <p className="font-bold text-[12px]">{companyName}-SM001</p>
          <p>{address}</p>
          <p>PHONE NO. {phone}</p>
          <p>GSTIN:{gst} {fy}</p>
        </div>

        {/* Right: Date/Time */}
        <div className="p-2 pr-6 border-l border-gray-300 flex flex-col justify-center text-[12px] font-mono text-gray-800 bg-[#e4e4e4]">
          <div className="flex gap-4">
            <span className="w-12 text-right">Date :</span>
            <span className="font-bold">{time.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '.,')}</span>
          </div>
          <div className="flex gap-4 mt-0.5">
            <span className="w-12 text-right">Day :</span>
            <span className="font-bold">{time.toLocaleDateString("en-GB", { weekday: 'long' })}</span>
          </div>
          <div className="flex gap-4 mt-0.5 items-center">
            <span className="w-12 text-right">Time :</span>
            <span className="font-bold bg-white px-1 border border-gray-300 rounded-sm text-[11px]">
              {time.toLocaleTimeString("en-GB", { hour12: false })}
            </span>
            <span className="ml-2 bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded shadow-sm">24x7 HELP</span>
          </div>
        </div>
      </div>

      {/* Bottom Shortcuts Bar */}
      <div className="bg-[#424242] text-white px-3 py-0.5 text-[10px] font-bold flex justify-between items-center shadow-inner">
        <div className="flex gap-3 text-[#a5d6a7]">
          <span>F1-Company</span>
          <span>Alt+I-Item</span>
          <span>Alt+L-Party</span>
          <span>Alt+U-User</span>
          <span>F1-Directory</span>
          <span>F10-Calendar</span>
          <span>F11-Printer</span>
        </div>
        <div className="flex gap-2">
          <span className="bg-gray-300 text-black px-1 border-r border-black shadow-sm">Update ERP</span>
          <span className="bg-gray-300 text-black px-1 border-r border-black shadow-sm">Graph Tool</span>
          <span className="bg-gray-300 text-black px-1 border-r border-black shadow-sm">What's New</span>
          <span className="bg-[#ffcdd2] text-[#c62828] px-1 font-extrabold shadow-sm">28% items Un-Maped</span>
        </div>
      </div>
    </footer>
  );
}
