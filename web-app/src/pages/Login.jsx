import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Logging in with:", email, password);
  };

  return (
    <div className="h-screen bg-[#F4F6F8] flex flex-col font-sans overflow-hidden">
      <div className="absolute top-6 left-8 flex items-center space-x-3">
        <img src="/smartlogo.png" alt="UrbanSync Logo" className="w-14 h-14 object-contain" />
        <div>
          <h1 className="text-[#0F172A] font-extrabold text-xl tracking-wide leading-tight">UrbanSync</h1>
          <p className="text-[#64748B] text-[10px] font-bold tracking-widest uppercase mt-0.5">Official Portal</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
          
          <div className="p-8 pb-5">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Sign In</h2>
              <p className="text-slate-500 text-sm">Access the administrative dashboard and complaint management system.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Username or Official Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-11 pr-3 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-slate-50 text-slate-800 placeholder-slate-400"
                    placeholder="Enter your credentials"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                  <a href="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-800">Forgot Password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-11 pr-11 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-slate-50 text-slate-800 placeholder-slate-400"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
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
              </div>

              {/* Login Button */}
              <button 
                type="submit" 
                className="w-full py-3.5 px-4 bg-[#1D4ED8] hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex justify-center items-center mt-3"
              >
                Secure Login 
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              </button>
            </form>


            <div className="mt-8">
              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Authorized roles for this gateway:</p>
              <div className="flex justify-center space-x-3">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  ADMINISTRATOR
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  DEPT. OFFICER
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFBEB] border-t border-[#FEF3C7] p-4 text-center">
            <p className="text-[9px] text-[#D97706] uppercase font-bold leading-relaxed px-4">
              WARNING: This is a government computer system. Unauthorized access or use of this system may subject you to administrative, civil, or criminal actions.
            </p>
          </div>
          
        </div>
      </div>

      {/* FOOTER */}
      <div className="w-full p-4 border-t border-slate-200 bg-transparent">
        <div className="flex flex-col items-center justify-center max-w-7xl mx-auto px-4">
          <p className="text-xs text-slate-500 font-medium mb-2">&copy; 2026 National Governance Digital Division. All Rights Reserved.</p>
          <div className="flex space-x-4">
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 font-medium">Privacy Policy</a>
            <span className="text-slate-300">|</span>
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 font-medium">Terms of Conditions</a>
          </div>
        </div>
      </div>
      
    </div>
  );
}