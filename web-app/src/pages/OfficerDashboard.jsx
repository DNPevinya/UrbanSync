import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [officerInfo, setOfficerInfo] = useState({ fullName: '', authority_id: null, authorityName: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('urbanSyncUser');
    if (!savedUser) { navigate('/login'); return; }
    const parsedUser = JSON.parse(savedUser);
    setOfficerInfo(parsedUser);

    const fetchComplaints = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/complaints/authority/${parsedUser.authority_id}`);
        const result = await response.json();
        if (result.success) setComplaints(result.data); 
      } catch (error) {
        console.error("Error fetching live complaints:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, [navigate]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="officer" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header title={`Welcome, Officer ${officerInfo.fullName || ''} | ${officerInfo.authorityName || ''}`} />
        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm relative">
              <span className="absolute top-6 right-6 text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded">Live</span>
              <p className="text-[11px] font-bold text-[#64748B] mb-1">Total Assigned Cases</p>
              <h3 className="text-3xl font-extrabold text-[#1E293B]">{loading ? "..." : complaints.length}</h3>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl flex-1 flex flex-col shadow-sm">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center bg-white rounded-t-xl">
              <h3 className="text-[15px] font-bold text-[#1E293B]">Recent Activity</h3>
              <button 
                onClick={() => navigate('/officer/complaints')}
                className="text-[11px] font-extrabold text-[#0041C7] hover:text-[#0033A0] uppercase tracking-wider flex items-center"
              >
                View Full Workbox
                <svg className="w-3 h-3 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Complaint ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Citizen Info</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Issue Description</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase text-center tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-10 text-[#64748B]">Syncing records...</td></tr>
                  ) : complaints.slice(0, 5).map((c) => (
                    <tr key={c.complaint_id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 text-[13px] font-bold text-[#0041C7]">#CMP-{c.complaint_id}</td>
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-bold text-[#1E293B]">{c.citizen_name || `User #${c.user_id}`}</p>
                        <p className="text-[11px] text-[#0041C7] font-bold">{c.citizen_phone || 'Contact Missing'}</p>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#64748B] font-medium truncate max-w-xs">{c.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                          c.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                          c.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => navigate(`/officer/complaint-details?id=${c.complaint_id}`)} 
                          className="p-1.5 text-[#0041C7] bg-[#F0F5FF] rounded hover:bg-[#DCE7F9] transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}