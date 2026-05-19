import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Mail, Lock, Building, Phone, MapPin, Shield, Check, ArrowRight, ArrowLeft } from "lucide-react";

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyPhone: "",
    companyAddress: "",
    companyEmail: "",
    gstNumber: "",
    panNumber: "",
    stateName: "",
    stateCode: "",
    dlNumber: "",
    financialYear: "2026-27"
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step === 1) {
      if (!form.name || !form.email || !form.password) {
        return setError("Please fill in all credential fields");
      }
      if (form.password !== form.confirmPassword) {
        return setError("Passwords do not match");
      }
    } else if (step === 2) {
      if (!form.companyName || !form.companyPhone || !form.companyAddress) {
        return setError("Please fill in all company information fields");
      }
    }
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      alert("Registration completed successfully! Please log in.");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden selection:bg-blue-200">
      {/* Background blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
      
      <div className="w-full max-w-4xl mx-4 z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
          
          {/* Brand Panel */}
          <div className="md:w-5/12 bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full border-4 border-white/10 opacity-30"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-white text-blue-700 rounded-xl flex items-center justify-center font-bold text-xl shadow">M</div>
                <span className="text-xl font-bold tracking-wide">Marg ERP</span>
              </div>
              <h2 className="text-3xl font-extrabold mb-4 leading-tight">Create Company & Account</h2>
              <p className="text-blue-100 text-sm font-light leading-relaxed">
                Setup your pharma distribution business workspace with professional compliance tracking and billing systems in a few simple steps.
              </p>
            </div>

            {/* Stepper indicators */}
            <div className="relative z-10 space-y-4 my-8">
              {[
                { s: 1, title: "Administrator", desc: "Access credentials" },
                { s: 2, title: "Company Profile", desc: "Contact details" },
                { s: 3, title: "Compliance & Taxes", desc: "GSTIN, PAN & DL" }
              ].map(item => (
                <div key={item.s} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${
                    step === item.s 
                      ? "bg-white text-blue-700 border-white shadow" 
                      : step > item.s 
                        ? "bg-emerald-500 text-white border-emerald-500" 
                        : "bg-white/10 text-blue-200 border-white/20"
                  }`}>
                    {step > item.s ? <Check className="w-4 h-4" /> : item.s}
                  </div>
                  <div>
                    <p className={`text-xs font-bold leading-none ${step === item.s ? "text-white" : "text-blue-200/70"}`}>{item.title}</p>
                    <p className="text-[10px] text-blue-200/50 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative z-10 text-xs text-blue-200/80">
              © {new Date().getFullYear()} Marg ERP Suite.
            </div>
          </div>

          {/* Form Content Panel */}
          <div className="md:w-7/12 p-8 lg:p-12 flex flex-col justify-center bg-white">
            <div className="w-full max-w-md mx-auto">
              <div className="mb-6">
                <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">Step {step} of 3</span>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {step === 1 && "Create Admin Account"}
                  {step === 2 && "Company Basic Info"}
                  {step === 3 && "Tax & Compliance Setup"}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {step === 1 && "Setup credentials to manage your business dashboard."}
                  {step === 2 && "Enter details printed on your billing letterhead."}
                  {step === 3 && "Input drug scheduling and tax identity values."}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-xs mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                {/* STEP 1 */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          placeholder="John Doe"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          required
                          placeholder="admin@company.com"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Company/Firm Name</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. BPartner Pharma Wholesalers"
                          value={form.companyName}
                          onChange={e => setForm({ ...form, companyName: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Company Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            placeholder="Phone No"
                            value={form.companyPhone}
                            onChange={e => setForm({ ...form, companyPhone: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Company Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            placeholder="billing@company.com"
                            value={form.companyEmail}
                            onChange={e => setForm({ ...form, companyEmail: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Company Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <textarea
                          rows="3"
                          required
                          placeholder="Full Street address, building number, area..."
                          value={form.companyAddress}
                          onChange={e => setForm({ ...form, companyAddress: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">GSTIN</label>
                        <input
                          type="text"
                          placeholder="22AAAAA0000A1Z5"
                          value={form.gstNumber}
                          onChange={e => setForm({ ...form, gstNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">PAN Number</label>
                        <input
                          type="text"
                          placeholder="ABCDE1234F"
                          value={form.panNumber}
                          onChange={e => setForm({ ...form, panNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Drug License (DL) No</label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="DL-12345"
                            value={form.dlNumber}
                            onChange={e => setForm({ ...form, dlNumber: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Financial Year</label>
                        <select
                          value={form.financialYear}
                          onChange={e => setForm({ ...form, financialYear: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="2025-26">2025-26</option>
                          <option value="2026-27">2026-27</option>
                          <option value="2027-28">2027-28</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">State Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Delhi"
                          value={form.stateName}
                          onChange={e => setForm({ ...form, stateName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">State Code</label>
                        <input
                          type="text"
                          placeholder="e.g. 07"
                          value={form.stateCode}
                          onChange={e => setForm({ ...form, stateCode: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2 transition"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/20"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-75"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <>Complete Setup <Check className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Already have an account?{" "}
                  <button onClick={() => navigate("/")} className="text-blue-600 hover:underline font-bold">Sign In</button>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
