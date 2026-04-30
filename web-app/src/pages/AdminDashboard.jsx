import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; 
import Header from '../components/Header'; 
import Footer from '../components/Footer'; 
import ReassignModal from '../components/ReassignModal'; 
import DetailsModal from '../components/DetailsModal';   
import { apiFetch } from '../utils/apiClient';

export default function AdminDashboard() {
  // 1. STATE & HOOKS
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, resolved: 0 });
  const [performance, setPerformance] = useState([]);
  const [recentData, setRecentData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignId, setReassignId] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState('');

  // 2. LIFECYCLE & UTILITIES
  useEffect(() => {
    const savedUser = localStorage.getItem('urbanSyncUser');
    if (!savedUser) { navigate('/login'); return; }
    
    const user = JSON.parse(savedUser);
    if (user.role !== 'super_admin') { navigate('/officer/dashboard'); return; }

    const fetchAllAdminData = async () => {
      try {
        setLoading(true);
        const [sRes, pRes, rRes] = await Promise.all([
          apiFetch('http://localhost:5000/api/complaints/admin/stats'),
          apiFetch('http://localhost:5000/api/complaints/admin/performance'),
          apiFetch('http://localhost:5000/api/complaints/admin/all-recent')
        ]);

        const sData = await sRes.json();
        const pData = await pRes.json();
        const rData = await rRes.json();

        if (sData.success) setStats(sData.data);
        if (pData.success) setPerformance(pData.data);
        if (rData.success) setRecentData(rData.data);
        
      } catch (error) {
        console.error("Dashboard Sync Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAdminData();
  }, [navigate]);

  // 3. HELPER FUNCTIONS
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const openReassign = (id) => { setReassignId(id); setIsReassignOpen(true); };
  const openDetails = (id) => { setDetailsId(id); setIsDetailsOpen(true); };

  // UNIFIED STATUS STYLE HELPER
  const getStatusBadgeStyle = (status) => {
    const s = status?.trim().toUpperCase();
    if (s === 'PENDING') return 'bg-orange-50 text-orange-600 border-orange-200';
    if (s === 'IN PROGRESS') return 'bg-blue-50 text-blue-600 border-blue-200';
    if (s === 'RESOLVED') return 'bg-green-50 text-green-600 border-green-200';
    if (s === 'REJECTED') return 'bg-red-100 text-red-700 border-red-300 animate-pulse';
    if (s === 'CANCELLED') return 'bg-red-50 text-red-600 border-red-200'; // Now it is red!
    return 'bg-slate-50 text-slate-600 border-slate-200'; // Fallback
  };

  // 4. UI RENDER
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header title="Super Admin Dashboard" />

        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
             <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Total Complaints</p>
                <h3 className="text-3xl font-extrabold text-[#0041C7]">{stats.total}</h3>
             </div>
             <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                <p className="text-[10px] font-bold text-[#EF4444] uppercase tracking-widest mb-1">National Pending</p>
                <h3 className="text-3xl font-extrabold text-[#EF4444]">{stats.pending}</h3>
             </div>
             <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                <p className="text-[10px] font-bold text-[#FF9F43] uppercase tracking-widest mb-1">In Progress</p>
                <h3 className="text-3xl font-extrabold text-[#FF9F43]">{stats.active}</h3>
             </div>
             <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                <p className="text-[10px] font-bold text-[#28C76F] uppercase tracking-widest mb-1">National Resolved</p>
                <h3 className="text-3xl font-extrabold text-[#28C76F]">{stats.resolved}</h3>
             </div>
          </div>

          <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm mb-8">
            <h3 className="text-lg font-extrabold text-[#1E293B] mb-6">Departmental Workload Distribution</h3>
            <div className="space-y-6">
              {performance.map((auth, idx) => (
                <div key={idx} className="w-full">
                  <div className="flex justify-between text-[12px] font-bold text-[#1E293B] mb-2 uppercase tracking-wide">
                    <span>{auth.name}</span>
                    <span className="text-[#64748B]">{auth.total_cases} Active Cases</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-2.5">
                    <div 
                      className="bg-[#0041C7] h-2.5 rounded-full transition-all duration-1000" 
                      style={{ width: `${stats.total > 0 ? (auth.total_cases / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden mb-8 flex-shrink-0">
            <div className="px-8 py-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
              <h3 className="text-[15px] font-bold text-[#1E293B]">Latest High-Priority Reports (Global)</h3>
              <button onClick={() => navigate('/admin/complaints')} className="text-[12px] font-bold text-[#0041C7] hover:underline">View Full Workbox</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F8FAFC] text-[10px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-4">ID & Date</th>
                    <th className="px-6 py-4">Subject & Category</th>
                    <th className="px-6 py-4">Assigned Authority</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-10 font-bold text-[#64748B]">Syncing...</td></tr>
                  ) : recentData.length > 0 ? recentData.map((c) => (
                    <tr key={c.complaint_id} className="hover:bg-[#F8FAFC] transition-colors group">
                      
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-bold text-[#0041C7]">#CMP-{c.complaint_id}</p>
                        <p className="text-[11px] font-medium text-[#64748B]">{formatDate(c.created_at)}</p>
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-[13px] font-bold text-[#1E293B] truncate">{c.title}</p>
                        <p className="text-[11px] font-medium text-[#64748B] truncate">{c.category}</p>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`text-[12px] font-bold ${c.authority_name ? 'text-[#1E293B]' : 'text-[#94A3B8] italic'}`}>
                          {c.authority_name || 'Pending Assignment'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                         <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase tracking-wider border ${getStatusBadgeStyle(c.status)}`}>
                           {c.status}
                         </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openDetails(c.complaint_id)} 
                            className="text-[11px] font-bold text-[#64748B] hover:text-[#1E293B] transition-colors"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={() => openReassign(c.complaint_id)} 
                            className="text-[11px] font-bold text-[#0041C7] hover:underline bg-blue-50 px-2 py-1 rounded transition-colors"
                          >
                            Reassign
                          </button>
                        </div>
                      </td>

                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="text-center py-10 text-[#64748B] italic text-sm">No recent activity detected.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <Footer />

          <ReassignModal isOpen={isReassignOpen} onClose={() => setIsReassignOpen(false)} complaintId={reassignId} />
          <DetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} complaintId={detailsId} />

        </main>
      </div>
    </div>
  );
}