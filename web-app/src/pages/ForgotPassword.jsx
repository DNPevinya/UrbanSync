import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() { 
  const [email, setEmail] = useState('');
  const navigate = useNavigate(); // <-- THIS MAKES THE BUTTON WORK!

  const handleReset = (e) => {
    e.preventDefault();
    console.log("Sending recovery link to:", email);
  };

  return (
    <div className="h-screen bg-[#F4F6F8] flex flex-col font-sans overflow-hidden">
      
      {/* Top Left Logo */}
      <div className="absolute top-6 left-8 flex items-center space-x-3 hidden sm:flex">
        <img src="/smartlogo.png" alt="UrbanSync Logo" className="w-14 h-14 object-contain" />
        <div>
          <h1 className="text-[#0F172A] font-extrabold text-xl tracking-wide leading-tight">UrbanSync</h1>
          <p className="text-[#64748B] text-[10px] font-bold tracking-widest uppercase mt-0.5">Official Portal</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
          
          <div className="p-8 pb-6">
            {/* Back Button */}
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 mb-6 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Reset Your Password</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Enter the email address associated with your account. We will send a secure link to reset your password.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Registered Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold text-lg">@</span>
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-11 pr-3 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-slate-50 text-slate-800 placeholder-slate-400"
                    placeholder="officer@department.gov.lk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full py-3.5 px-4 bg-[#1D4ED8] hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex justify-center items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Recovery Link
              </button>
            </form>
          </div>

          {/* Security Notice Box from your UI design */}
          <div className="bg-slate-50 border-t border-slate-100 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Security Notice</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unable to access your email? Please contact the IT Support Desk at <a href="mailto:support@department.gov.lk" className="text-blue-600 font-semibold hover:underline">support@department.gov.lk</a> or call <span className="font-semibold text-slate-700">+94 11 234 5678</span>.
                </p>
              </div>
            </div>
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