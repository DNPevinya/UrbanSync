import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ReassignModal from '../components/ReassignModal';
import DetailsModal from '../components/DetailsModal';

export default function AdminComplaints() {
  const navigate = useNavigate();

  // --- 1. DATA STATE ---
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // --- 2. FILTER STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [filterDate, setFilterDate] = useState('');

  // --- 3. PAGINATION STATE (NEW) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- 4. MODAL STATE ---
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignId, setReassignId] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState('');

  // Fetch Data
  useEffect(() => {
    const savedUser = localStorage.getItem('urbanSyncUser');
    if (!savedUser) { navigate('/login'); return; }
    
    const user = JSON.parse(savedUser);
    if (user.role !== 'super_admin') { navigate('/officer/dashboard'); return; }

    const fetchMasterData = async () => {
      try {
        setLoading(true);
        const [statsRes, complaintsRes] = await Promise.all([
          fetch('http://localhost:5000/api/complaints/admin/stats'),
          fetch('http://localhost:5000/api/complaints/admin/all')
        ]);
        const statsData = await statsRes.json();
        const complaintsData = await complaintsRes.json();
        if (statsData.success) setStats(statsData.data);
        if (complaintsData.success) setComplaints(complaintsData.data);
      } catch (error) {
        console.error("Master Workbox Sync Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMasterData();
  }, [navigate]);

  // Reset to page 1 whenever a filter is changed
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus, filterDate]);

  // --- FILTER LOGIC (ROBUST) ---
  const filteredComplaints = complaints.filter(c => {
    const safeTitle = c.title || "";
    const safeStatus = c.status || "";
    const safeCategory = c.category || "";

    const matchesSearch = safeTitle.toLowerCase().includes(searchTerm.toLowerCase()) || c.complaint_id.toString().includes(searchTerm);
    const matchesCategory = filterCategory === 'All Categories' || safeCategory === filterCategory;
    
    // FIX: Using .trim() to handle hidden spaces from the database
    const matchesStatus = filterStatus === 'All Statuses' || safeStatus.trim().toUpperCase() === filterStatus.trim().toUpperCase();

    let matchesDate = true;
    if (filterDate && c.created_at) {
      const complaintDate = new Date(c.created_at).toISOString().split('T')[0];
      matchesDate = complaintDate === filterDate;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  // --- PAGINATION MATH (NEW) ---
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  // This physically slices the array to only show the current 10 (or 25/50) rows
  const currentRows = filteredComplaints.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredComplaints.length / rowsPerPage);

  const clearFilters = () => {
    setSearchTerm(''); setFilterCategory('All Categories'); setFilterStatus('All Statuses'); setFilterDate('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header breadcrumbs={['Admin', 'System-Wide Workbox']} />
        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          
          {/* STATS (Hidden for brevity, keep your existing 4 stat cards here) */}
          
          {/* FILTER BAR */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 mt-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                type="text" placeholder="Search Subject or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0041C7] text-[#1E293B]" 
              />
            </div>
            
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-[13px] text-[#1E293B] bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0041C7]">
              <option value="All Categories">All Categories</option>
              <option value="Water Supply Services">Water Supply Services</option>
              <option value="Urban Infrastructure & Municipal Services">Urban Infrastructure</option>
              <option value="Public Safety & Law Enforcement">Public Safety</option>
              <option value="Environmental & Public Health">Public Health</option>
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-[13px] text-[#1E293B] bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0041C7]">
              <option value="All Statuses">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-[13px] text-[#64748B] bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0041C7]" />
            <button onClick={clearFilters} className="text-[13px] font-bold text-[#64748B] hover:text-[#EF4444] px-4 py-2.5 transition-colors">Clear</button>
          </div>

          {/* TABLE SECTION */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl flex-1 flex flex-col shadow-sm">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                Showing {filteredComplaints.length === 0 ? 0 : indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredComplaints.length)} of {filteredComplaints.length} results
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">ID & Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Subject & Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Assigned Authority</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-10 font-bold text-slate-400">Loading Master List...</td></tr>
                  ) : currentRows.length > 0 ? (
                    currentRows.map((c) => (
                      <tr key={c.complaint_id} className="hover:bg-[#F8FAFC] transition-colors group">
                        
                        <td className="px-6 py-4">
                          <p className="text-[13px] font-bold text-[#0041C7]">#CMP-{c.complaint_id}</p>
                          <p className="text-[11px] font-medium text-[#64748B]">{formatDate(c.created_at)}</p>
                        </td>

                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-[13px] font-bold text-[#1E293B] truncate">{c.title}</p>
                          <p className="text-[11px] font-medium text-[#64748B] truncate">{c.category}</p>
                        </td>

                        {/* UI FIX: Removed the dark box. Made it clean, bold text. */}
                        <td className="px-6 py-4">
                          <span className={`text-[12px] font-bold ${c.authority_name ? 'text-[#1E293B]' : 'text-[#94A3B8] italic'}`}>
                            {c.authority_name || 'Pending Assignment'}
                          </span>
                        </td>

                        {/* STATUS PILL: Softened colors so it doesn't scream */}
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
                            c.status?.trim().toUpperCase() === 'PENDING' ? 'bg-red-50 text-red-600 border border-red-100' : 
                            c.status?.trim().toUpperCase() === 'RESOLVED' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {c.status}
                          </span>
                        </td>

                        {/* UI FIX: Actions are clear, but not visually heavy */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-4 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setDetailsId(c.complaint_id) || setIsDetailsOpen(true)} 
                              className="text-[12px] font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => setReassignId(c.complaint_id) || setIsReassignOpen(true)} 
                              className="text-[12px] font-bold text-[#0041C7] hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              Reassign
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-10 text-slate-400 italic">No complaints match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* REAL PAGINATION CONTROLS */}
            <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center text-[13px] text-[#64748B]">
                Rows per page: 
                <select 
                  value={rowsPerPage} 
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="ml-2 bg-transparent font-bold text-[#1E293B] focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <span className="text-[13px] font-bold text-[#1E293B] px-2">
                  Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
                </span>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="w-8 h-8 flex items-center justify-center rounded border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
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