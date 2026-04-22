import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Terms() {
  const navigate = useNavigate();
  const [role, setRole] = useState('officer');

  useEffect(() => {
    const savedUser = localStorage.getItem('urbanSyncUser');
    if (!savedUser) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(savedUser);
    setRole(user.role);
  }, [navigate]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header breadcrumbs={['Legal', 'Terms of Conditions']} />

        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          <div className="max-w-4xl mx-auto w-full flex-1">
            
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-[#1E293B]">Terms of Conditions</h2>
              <p className="text-[13px] text-[#64748B] mt-1">Official Rules of Operation for Government Personnel</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-8 space-y-8">
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-2">
                <p className="text-[12px] text-amber-800 font-medium">
                  <span className="font-bold block mb-1">Notice of Binding Agreement:</span>
                  By logging into the UrbanSync Portal, you agree to abide by these operational terms. Unauthorized access or abuse of this system is punishable under national cyber law.
                </p>
              </div>

              <section>
                <h3 className="text-lg font-bold text-[#1E293B] mb-3">1. Authorized Use</h3>
                <p className="text-[13px] text-[#475569] leading-relaxed">
                  This system is provided exclusively for authorized officers and administrators of recognized municipal authorities. You may only access, update, or escalate complaints that fall within the jurisdiction of your assigned department.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#1E293B] mb-3">2. Account Integrity</h3>
                <p className="text-[13px] text-[#475569] leading-relaxed">
                  You are responsible for maintaining the confidentiality of your Employee ID and password. Passwords must be a minimum of 8 characters. Do not share your login credentials with other staff members. If you suspect your account is compromised, you must immediately utilize the "Settings" tab to update your password or notify the System Administrator to suspend your account.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#1E293B] mb-3">3. Complaint Handling & Escalation</h3>
                <p className="text-[13px] text-[#475569] leading-relaxed mb-3">
                  Officers are expected to transition complaints sequentially from <strong>Pending</strong> to <strong>In Progress</strong> to <strong>Resolved</strong>. 
                </p>
                <ul className="list-disc pl-5 text-[13px] text-[#475569] leading-relaxed space-y-1">
                  <li>Complaints falling outside your department's scope must be immediately marked as <strong>Rejected</strong> and escalated with a clear, professional reason attached in the system notes.</li>
                  <li>Permanent deletion of citizen records is strictly restricted to Super Administrators.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#1E293B] mb-3">4. Termination of Access</h3>
                <p className="text-[13px] text-[#475569] leading-relaxed">
                  System Administrators reserve the right to alter your account status to "Inactive" or permanently delete your account if you no longer require access or if you are found to be abusing the escalation features.
                </p>
              </section>

            </div>
          </div>
          
          <div className="mt-8">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}