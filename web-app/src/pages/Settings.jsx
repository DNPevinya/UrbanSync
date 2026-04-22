import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Settings() {
  const [userInfo, setUserInfo] = useState({ 
    fullName: 'Loading...', 
    email: 'Loading...', 
    authorityName: 'Loading...', 
    role: 'officer'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('urbanSyncUser');
    
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      
      setUserInfo({
        fullName: parsed.fullName || (parsed.role === 'super_admin' ? 'System Administrator' : 'Official User'),
        email: parsed.email || 'No email found',
        authorityName: parsed.authorityName || (parsed.role === 'super_admin' ? 'UrbanSync Central System' : 'Unassigned Department'),
        role: parsed.role || 'officer'
      });
    }
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatus({ type: 'error', message: 'Mismatch Error: The new password and confirmation do not match.' });
      return; 
    }

    if (passwordData.newPassword.length < 8) {
      setStatus({ type: 'error', message: 'Length Error: Password must be at least 8 characters.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userInfo.email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: data.message });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (err) {
      console.error("Password Update Error:", err);
      setStatus({ type: 'error', message: 'Network Error: Cannot reach UrbanSync servers.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const EyeIcon = ({ isVisible, toggle }) => (
    <button type="button" onClick={toggle} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#1E293B]">
      {isVisible ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role={userInfo.role} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header breadcrumbs={['Settings & Profile']} />

        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          <div className="max-w-4xl mx-auto w-full flex-1">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-[#1E293B]">Settings & Profile</h2>
              <p className="text-[13px] text-[#64748B] mt-1">Manage security and view assigned department identity.</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm mb-8">
              <div className="px-8 py-6 border-b border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-[#1E293B]">Official Identity</h3>
                  <p className="text-[13px] text-[#64748B]">Core identity managed by System Administrators.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${userInfo.role === 'super_admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {userInfo.role === 'super_admin' ? 'Super Admin' : 'Dept. Officer'}
                  </span>
                  <span className="bg-[#F1F5F9] text-[#64748B] px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Locked
                  </span>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1E293B] mb-2 uppercase">Full Name</label>
                    <input type="text" value={userInfo.fullName} className="block w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] font-bold text-[#94A3B8] bg-[#F8FAFC] outline-none cursor-not-allowed" readOnly />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1E293B] mb-2 uppercase">Official Email</label>
                    <input type="email" value={userInfo.email} className="block w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] font-bold text-[#94A3B8] bg-[#F8FAFC] outline-none cursor-not-allowed" readOnly />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1E293B] mb-2 uppercase">Assigned Department / Role</label>
                  <input type="text" value={userInfo.authorityName} className="block w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] font-bold text-[#94A3B8] bg-[#F8FAFC] outline-none cursor-not-allowed" readOnly />
                  <p className="text-[10px] text-[#94A3B8] mt-2 font-medium italic">Contact System Admin to request profile or department transfers.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm mb-8">
              <div className="px-8 py-6 border-b border-[#E2E8F0]">
                  <h3 className="text-lg font-bold text-[#1E293B]">Security Settings</h3>
                  <p className="text-[13px] text-[#64748B]">Update password to maintain account integrity.</p>
              </div>
              
              <div className="p-8 space-y-6">
                
                {status.message && (
                  <div className={`p-4 rounded-lg flex items-center border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    <p className="text-[12px] font-bold uppercase tracking-wider">{status.message}</p>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[#1E293B] mb-2 uppercase">Current Password</label>
                  <div className="relative max-w-md">
                    <input 
                      type={showCurrent ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="block w-full pl-4 pr-10 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] text-[#1E293B] focus:ring-2 focus:ring-[#0041C7] outline-none" 
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    />
                    <EyeIcon isVisible={showCurrent} toggle={() => setShowCurrent(!showCurrent)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1E293B] mb-2 uppercase">New Password</label>
                    <div className="relative">
                      <input 
                        type={showNew ? "text" : "password"}
                        required
                        placeholder="Min. 8 characters" 
                        className="block w-full pl-4 pr-10 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] text-[#1E293B] focus:ring-2 focus:ring-[#0041C7] outline-none" 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                      <EyeIcon isVisible={showNew} toggle={() => setShowNew(!showNew)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1E293B] mb-2 uppercase">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type={showConfirm ? "text" : "password"}
                        required
                        placeholder="Repeat new password" 
                        className="block w-full pl-4 pr-10 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] text-[#1E293B] focus:ring-2 focus:ring-[#0041C7] outline-none" 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                      <EyeIcon isVisible={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                    </div>
                  </div>
                </div>

                <div className="bg-[#F0F5FF] border border-[#DCE7F9] rounded-xl p-4 flex items-center">
                  <svg className="w-5 h-5 text-[#0041C7] mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  <p className="text-[11px] font-bold text-[#0041C7] uppercase tracking-wide">Requirement: Minimum 8 characters long.</p>
                </div>
              </div>

              <div className="bg-[#F8FAFC] px-8 py-4 border-t border-[#E2E8F0] flex justify-between items-center rounded-b-xl">
                <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-widest italic">UrbanSync Portal Security</span>
                <button 
                  type="submit"
                  disabled={isSubmitting || passwordData.newPassword.length < 8}
                  className="px-6 py-2.5 bg-[#0041C7] hover:bg-[#0033A0] text-white text-[13px] font-extrabold rounded-lg shadow-sm transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}