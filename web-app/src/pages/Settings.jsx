import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ADD { role = 'admin' } HERE
export default function Settings({ role = 'admin' }) {
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* PASS THE ROLE TO THE SIDEBAR HERE */}
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        <Header breadcrumbs={['Settings & Profile']} />

        {/* 1. Main container is now full width so the scrollbar stays on the far right edge */}
        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          
          {/* 2. Added a wrapper div here to center the content nicely without dragging the scrollbar with it */}
          <div className="max-w-4xl mx-auto w-full flex-1">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-[#1E293B]">Settings & Profile</h2>
              <p className="text-[13px] text-[#64748B] mt-1">Manage your security preferences and view your assigned identity.</p>
            </div>

            {/* PERSONAL PROFILE SECTION */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm mb-8">
              <div className="px-8 py-6 border-b border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-[#1E293B]">Personal Profile</h3>
                  <p className="text-[13px] text-[#64748B]">Your core identity is managed centrally by the System Administrator.</p>
                </div>
                <span className="bg-[#F1F5F9] text-[#64748B] px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                  Read-Only
                </span>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1E293B] mb-2">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <input type="text" defaultValue="Admin User" className="block w-full pl-10 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] font-bold text-[#94A3B8] bg-[#F8FAFC] outline-none cursor-not-allowed" readOnly />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1E293B] mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <input type="email" defaultValue="admin@UrbanSync.gov.lk" className="block w-full pl-10 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] font-bold text-[#94A3B8] bg-[#F8FAFC] outline-none cursor-not-allowed" readOnly />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1E293B] mb-2">Department & Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <input type="text" defaultValue="System Administrator" className="block w-full pl-10 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] font-bold text-[#94A3B8] bg-[#F8FAFC] outline-none cursor-not-allowed" readOnly />
                  </div>
                  <p className="text-[10px] text-[#94A3B8] mt-2">To request changes to your profile data, please contact IT Support.</p>
                </div>
              </div>
            </div>

            {/* SECURITY SETTINGS SECTION */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm mb-8">
              <div className="px-8 py-6 border-b border-[#E2E8F0] flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-[#1E293B]">Security Settings</h3>
                  <p className="text-[13px] text-[#64748B]">Ensure your account remains secure with a complex password.</p>
                </div>
                <span className="bg-[#DCFCE7] text-[#16A34A] px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center">
                  Secure Account
                </span>
              </div>
              
              <div className="p-8 space-y-6">
                
                <div>
                  <label className="block text-[11px] font-bold text-[#1E293B] mb-2">Current Password</label>
                  <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <input type="password" defaultValue="••••••••••••" className="block w-full pl-10 pr-10 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] text-[#1E293B] focus:ring-2 focus:ring-[#0041C7] outline-none" />
                    <button className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#1E293B]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1E293B] mb-2">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <input type="password" placeholder="Min. 12 characters" className="block w-full pl-10 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] text-[#1E293B] focus:ring-2 focus:ring-[#0041C7] outline-none" />
                    </div>
                    <div className="flex mt-2 space-x-1">
                      <div className="h-1 w-1/3 bg-[#F59E0B] rounded-full"></div>
                      <div className="h-1 w-1/3 bg-[#F59E0B] rounded-full"></div>
                      <div className="h-1 w-1/3 bg-[#E2E8F0] rounded-full"></div>
                    </div>
                    <p className="text-[9px] font-bold text-[#F59E0B] mt-1">Password strength: Moderate</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#1E293B] mb-2">Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <input type="password" placeholder="Repeat new password" className="block w-full pl-10 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] text-[#1E293B] focus:ring-2 focus:ring-[#0041C7] outline-none bg-[#F8FAFC]" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#F0F5FF] border border-[#DCE7F9] rounded-xl p-4 flex items-start">
                  <svg className="w-5 h-5 text-[#0041C7] mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  <div>
                    <h4 className="text-[12px] font-bold text-[#0041C7] mb-2">Security Requirements</h4>
                    <ul className="space-y-1.5">
                      <li className="flex items-center text-[11px] font-bold text-[#16A34A]">
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Minimum 12 characters
                      </li>
                      <li className="flex items-center text-[11px] font-bold text-[#16A34A]">
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> At least one special character (@#$%^&*)
                      </li>
                      <li className="flex items-center text-[11px] font-medium text-[#94A3B8]">
                        <span className="w-1.5 h-1.5 bg-[#94A3B8] rounded-full mr-2.5 ml-1"></span> Include a mix of uppercase and lowercase
                      </li>
                    </ul>
                  </div>
                </div>

              </div>

              <div className="bg-[#F8FAFC] px-8 py-4 border-t border-[#E2E8F0] flex justify-between items-center rounded-b-xl">
                <span className="text-[11px] text-[#94A3B8]">Last changed: October 24, 2023</span>
                <button className="px-5 py-2.5 bg-[#0041C7] hover:bg-[#0033A0] text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors">
                  Update Security
                </button>
              </div>
            </div>
            
          </div>
          
          <Footer />

        </main>
      </div>
    </div>
  );
}