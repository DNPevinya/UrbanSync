import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function OfficerComplaints() {
  const navigate = useNavigate();
  
  // 1. STATE MANAGEMENT (Same logic as Dashboard)
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [officerInfo, setOfficerInfo] = useState({ 
    fullName: '', 
    authority_id: null,
    authorityName: ''
  });

  // 2. FILTER STATES (Specific to this page)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  useEffect(() => {
    // SECURITY CHECK: Matches Dashboard logic
    const savedUser = localStorage.getItem('urbanSyncUser');
    
    if (!savedUser) {
      navigate('/login');
      return; 
    }

    const parsedUser = JSON.parse(savedUser);
    
    if (parsedUser.role !== 'officer') {
      navigate('/login');
      return;
    }

    setOfficerInfo(parsedUser);

    // FETCH ALL DATA (Master List)
    const fetchComplaints = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/complaints/authority/${parsedUser.authority_id}`);
        const result = await response.json();
        
        if (result.success) {
          setComplaints(result.data); 
        }
      } catch (error) {
        console.error("Error fetching master workbox:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [navigate]);

  // 3. FILTERING LOGIC
  const filteredComplaints = complaints.filter(complaint => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (complaint.complaint_id?.toString() || '').includes(searchLower) ||
      (complaint.title || '').toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'All Statuses' || complaint.status === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="officer" />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Consistent Title Style */}
        <Header title={`Master Workbox | ${officerInfo.authorityName || ''}`} />

        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-[#1E293B]">Assigned Workbox</h2>
            <p className="text-[13px] text-[#64748B] mt-1">Manage and view all historical records for your department.</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl flex-1 flex flex-col shadow-sm">
            
            {/* Filter Bar (Specific to the full list) */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC] rounded-t-xl">
              <div className="relative w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search by ID or Issue..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0041C7] text-[#1E293B]" 
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-[#E2E8F0] rounded-lg px-4 py-2 text-[13px] font-semibold text-[#475569] bg-white focus:outline-none cursor-pointer"
              >
                <option>All Statuses</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </div>

            {/* TABLE: Mirrored exactly from Dashboard columns */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Complaint ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Citizen Info</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Type / Issue</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Date Received</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0041C7]"></div>
                        <p className="mt-2 text-[#64748B] text-sm">Syncing with UrbanSync DB...</p>
                      </td>
                    </tr>
                  ) : filteredComplaints.map((complaint) => (
                    <tr key={complaint.complaint_id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 text-[13px] font-bold text-[#0041C7]">#CMP-{complaint.complaint_id}</td>
                      <td className="px-6 py-4 text-[13px] font-bold text-[#1E293B]">Citizen #{complaint.user_id}</td>
                      <td className="px-6 py-4 text-[13px] text-[#64748B] font-medium">{complaint.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-[#F1F5F9] text-[#475569] text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#64748B]">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => navigate(`/officer/complaint-details?id=${complaint.complaint_id}`)} 
                          className="p-1.5 text-[#0041C7] bg-[#F0F5FF] rounded hover:bg-[#DCE7F9] transition-colors inline-flex border border-[#DBEAFE]"
                          title="View Process Details"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
              
              {!loading && filteredComplaints.length === 0 && (
                <div className="p-12 text-center text-[#64748B] text-[13px]">
                  No matching records found in the database.
                </div>
              )}

            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}