import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('urbanSyncUser', JSON.stringify(data.user));

        if (data.user.role === 'officer') {
          navigate('/officer/dashboard');
        } else if (data.user.role === 'super_admin') {
          navigate('/admin/dashboard');
        } else {
          setError("Authorized personnel only. Please use the mobile app.");
        }
      } else {
        setError(data.message || "Login failed. Check your credentials.");
      }
    } catch (err) {
      console.error("Login connection error:", err);
      setError("Cannot connect to server. Is your backend running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-white overflow-hidden">
      
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#003399] to-[#0D85D8] relative items-center justify-center">
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full border border-white/10"></div>
        <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full border border-white/20"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="bg-white p-4 rounded-2xl shadow-2xl mb-8">
            <img src="/smartlogo.png" alt="UrbanSync Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-white font-extrabold text-5xl tracking-tight mb-4">UrbanSync</h1>
          <p className="text-blue-100 text-lg font-medium max-w-sm leading-relaxed">
            The Centralized Digital Gateway for Municipal Management and Public Services.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col relative">
        
        <div className="flex-1 flex items-center justify-center px-6 sm:px-16 lg:px-24">
          <div className="w-full max-w-md">
            
            <div className="lg:hidden flex items-center space-x-3 mb-10">
              <img src="/smartlogo.png" alt="UrbanSync Logo" className="w-10 h-10 object-contain" />
              <h1 className="text-[#0F172A] font-extrabold text-2xl tracking-tight">UrbanSync</h1>
            </div>

            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Hello Again!</h2>
              <p className="text-slate-500 font-medium">Welcome back to the official portal.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  disabled={isSubmitting}
                  className="block w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0041C7] focus:border-transparent text-slate-800 placeholder-slate-400 transition-all disabled:opacity-50"
                  placeholder="Official Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isSubmitting}
                  className="block w-full pl-12 pr-12 py-4 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0041C7] focus:border-transparent text-slate-800 placeholder-slate-400 transition-all disabled:opacity-50"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#0041C7] transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword ? (
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-[#0041C7] hover:bg-blue-800 text-white text-sm font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center mt-2 disabled:bg-slate-300 disabled:shadow-none"
              >
                {isSubmitting ? "Authenticating..." : "Login"}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100">
              <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Authorized Access Only</p>
              <div className="flex justify-center space-x-4">
                <div className="flex items-center space-x-2 text-slate-500">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-xs font-bold uppercase">Super Admin</span>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-xs font-bold uppercase">Auth. Officer</span>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold leading-relaxed text-center">
                <span className="text-slate-500">Notice:</span> Unauthorized access to this municipal network is strictly prohibited and subject to administrative monitoring.
              </p>
            </div>

          </div>
        </div>

        <div className="p-6 text-center">
          <p className="text-xs text-slate-400 font-medium">
            &copy; 2026 National Governance Digital Division.
          </p>
        </div>
        
      </div>
    </div>
  );
}