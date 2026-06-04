import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { Mail, Lock, ArrowRight, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.post("/auth/login", form);
      toast.success("Login Successful!");
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError('Invalid email or password');
      } else if (!err.response) {
        setError('Unable to connect to server');
      } else {
        setError(err.response?.data?.error || 'An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden selection:bg-teal-200">
      {/* Animated Background Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-violet-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-5xl mx-4 z-10 animate-fade-in-up">
        <div className="glass-panel rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
          
          {/* Left Side: Branding & Info */}
          <div className="md:w-5/12 bg-gradient-to-br from-teal-700 to-indigo-900 text-white p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Overlay Patterns */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full border-4 border-white/10 opacity-50"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full border-4 border-white/10 opacity-50"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-white text-teal-700 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                  M
                </div>
                <span className="text-2xl font-bold tracking-wide">Marg ERP</span>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Empower your <br/> <span className="text-teal-300">Business</span>
              </h2>
              <p className="text-teal-100 mb-10 text-lg font-light leading-relaxed">
                The all-in-one comprehensive solution for inventory, billing, and accounting management.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-teal-200" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Lightning Fast</h4>
                    <p className="text-teal-200 text-sm">Optimized for high performance</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-teal-200" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Bank-level Security</h4>
                    <p className="text-teal-200 text-sm">Your data is safe with us</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5 text-teal-200" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Smart Analytics</h4>
                    <p className="text-teal-200 text-sm">Real-time business insights</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 mt-12 text-sm text-teal-200/80">
              © {new Date().getFullYear()} Marg ERP Clone. All rights reserved.
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="md:w-7/12 p-10 lg:p-16 bg-white/60">
            <div className="max-w-md mx-auto">
              <div className="mb-10 text-center md:text-left">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h3>
                <p className="text-gray-500">Please enter your details to sign in.</p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg mb-8 shadow-sm flex items-start animate-fade-in-up" style={{animationDuration: '0.3s'}}>
                  <div className="flex-1 text-sm">{error}</div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="admin@company.com"
                      className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white/80 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-teal-600 transition-all duration-200 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                    <a href="#" className="text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors">Forgot password?</a>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white/80 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-teal-600 transition-all duration-200 shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                    Remember me for 30 days
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-teal-600/30 transition-all duration-200 flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {isLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await axios.post("/settings/backup");
                      alert(res.data.message + ": " + res.data.filepath);
                    } catch(e) { alert("Backup failed: Are you authorized?"); }
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg transition-all duration-200 mt-3"
                >
                  Emergency Database Backup
                </button>
              </form>
              
              <div className="mt-10 text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{" "}
                  <button
                    onClick={() => navigate("/register")}
                    className="font-semibold text-teal-600 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    Register/Sign Up
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}