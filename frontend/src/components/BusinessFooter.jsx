import { Building2, Mail, MapPin, Phone, UserCircle2 } from "lucide-react";

const normalizeBusinessType = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (["retailer", "retail"].includes(raw)) return "Retailer";
  if (["wholesaler", "wholesale"].includes(raw)) return "Wholesaler";
  if (["company", "corporate", "firm"].includes(raw)) return "Company";
  return "Company";
};

export default function BusinessFooter() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const settings = JSON.parse(localStorage.getItem("settings") || "{}");

  const ownerName = user.name || settings.ownerName || "Not available";
  const ownerEmail = user.email || settings.companyEmail || "Not available";
  const phone = user.phone || settings.companyPhone || "Not available";
  const address = settings.companyAddress || user.address || "Not available";
  const state = settings.stateName || user.state || "Not available";
  const businessType = normalizeBusinessType(
    settings.businessType || user.businessType || user.role
  );

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-300 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-14 w-full max-w-[1800px] flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-[11px] text-slate-700 md:px-4">
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
          <Building2 className="h-3.5 w-3.5 text-[#1b4985]" />
          {businessType}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <UserCircle2 className="h-3.5 w-3.5 text-slate-500" />
          Owner: <strong>{ownerName}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-slate-500" />
          {ownerEmail}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-slate-500" />
          {phone}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-500" />
          {address}, {state}
        </span>
      </div>
    </footer>
  );
}
