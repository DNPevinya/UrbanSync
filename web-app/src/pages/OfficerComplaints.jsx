import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { apiFetch } from '../utils/apiClient';

const getStatusBadgeStyle = (status) => {
  const s = status?.trim().toUpperCase();
  if (s === 'PENDING') return 'bg-orange-50 text-orange-600 border-orange-200';
  if (s === 'IN PROGRESS') return 'bg-blue-50 text-blue-600 border-blue-200';
  if (s === 'RESOLVED') return 'bg-green-50 text-green-600 border-green-200';
  if (s === 'REJECTED') return 'bg-red-100 text-red-700 border-red-300 animate-pulse';
  if (s === 'CANCELLED') return 'bg-red-50 text-red-600 border-red-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

export default function OfficerComplaints() {
  // 1. STATE & HOOKS
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [officerInfo, setOfficerInfo] = useState({ fullName: '', authority_id: null, authorityName: '' });

  // 2. LIFECYCLE & UTILITIES
  useEffect(() => {
    const savedUser = localStorage.getItem('urbanSyncUser');
    if (!savedUser) { navigate('/login'); return; }
    const parsedUser = JSON.parse(savedUser);
    setOfficerInfo(parsedUser);

    const fetchComplaints = async () => {
      try {
        const response = await apiFetch(`http://localhost:5000/api/complaints/authority/${parsedUser.authority_id}`);
        const result = await response.json();
        if (result.success) setComplaints(result.data); 
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, [navigate]);

  // 3. HELPER VARIABLES
  const filteredComplaints = complaints.filter(c => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = 
      (c.complaint_id?.toString() || '').includes(s) || 
      (c.title || '').toLowerCase().includes(s) || 
      (c.citizen_name || '').toLowerCase().includes(s) ||
      (c.citizen_phone || '').includes(s);
    
    const matchesStatus = statusFilter === 'All Statuses' || c.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  // 4. UI RENDER
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="officer" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header title={`Master Workbox | ${officerInfo.authorityName || ''}`} />
        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          <h2 className="text-2xl font-extrabold text-[#1E293B]">Assigned Workbox</h2>
          <div className="bg-white border border-[#E2E8F0] rounded-xl mt-6 shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="px-6 py-4 border-b flex justify-between bg-[#F8FAFC]">
              <input type="text" placeholder="Search by ID, Name or Phone..." className="w-80 px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0041C7]" onChange={(e) => setSearchQuery(e.target.value)} />
              <select className="border rounded-lg px-4 py-2 text-sm font-bold text-[#475569]" onChange={(e) => setStatusFilter(e.target.value)}>
                <option>All Statuses</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-[#F8FAFC] text-[10px] font-bold text-[#64748B] uppercase">
                    <th className="px-6 py-4">Complaint ID</th>
                    <th className="px-6 py-4">Citizen Info</th>
                    <th className="px-6 py-4">Issue / Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredComplaints.map((c) => (
                    <tr key={c.complaint_id} className="hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4 text-[13px] font-bold text-[#0041C7]">#CMP-{c.complaint_id}</td>
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-bold text-[#1E293B]">{c.citizen_name || 'N/A'}</p>
                        <p className="text-[11px] text-[#0041C7] font-bold">{c.citizen_phone || 'No Phone'}</p>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#64748B]">{c.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase border tracking-wider ${getStatusBadgeStyle(c.status)}`}>{c.status}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => navigate(`/officer/complaint-details?id=${c.complaint_id}`)} className="p-1.5 text-[#0041C7] bg-[#F0F5FF] rounded border border-[#DBEAFE] hover:bg-[#0041C7] hover:text-white transition-all">
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