import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AddOfficerModal from '../components/AddOfficerModal';
import EditOfficerModal from '../components/EditOfficerModal';
import DeleteOfficerModal from '../components/DeleteOfficerModal';
import { apiFetch } from '../utils/apiClient';

export default function AdminOfficerManagement() {
  // 1. STATE & HOOKS
  const [officers, setOfficers] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FUNCTIONAL FILTERS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // --- MODALS ---
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  // 2. API HANDLERS
  const fetchData = async () => {
    setLoading(true);
    try {
      const [offRes, authRes] = await Promise.all([
        apiFetch('http://localhost:5000/api/auth/admin/officers-list'),
        apiFetch('http://localhost:5000/api/complaints/admin/authorities-list')
      ]);
      const offData = await offRes.json();
      const authData = await authRes.json();

      if (offData.success) setOfficers(offData.data);
      if (authData.success) setAuthorities(authData.data);
    } catch (error) {
      console.error("Error syncing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. LIFECYCLE & UTILITIES
  useEffect(() => { fetchData(); }, []);

  // 4. HELPER VARIABLES
  const filteredOfficers = officers.filter(o => {
    const matchesSearch = 
      o.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.employee_id_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = filterDept === 'All' || o.authority_id?.toString() === filterDept;
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const openEdit = (officer) => { setSelectedOfficer(officer); setIsEditOpen(true); };
  const openDelete = (officer) => { setSelectedOfficer(officer); setIsDeleteOpen(true); };

  // 5. HELPER FUNCTIONS
  const getInitials = (name) => {
    if (!name) return "O";
    const parts = name.split(" ");
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // 6. UI RENDER
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header breadcrumbs={['Admin', 'Officer Management']} />

        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-extrabold text-[#1E293B]">Officer Management</h2>
              <p className="text-[13px] text-[#64748B] mt-1">Manage department officers, system access levels, and credentials.</p>
            </div>
            <button 
              onClick={() => setIsAddOpen(true)} 
              className="px-5 py-2.5 bg-[#0041C7] hover:bg-[#0033A0] text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add New Officer
            </button>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl flex-1 flex flex-col shadow-sm">
            
            {/* FUNCTIONAL TOOLBAR */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search by name, ID, or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0041C7] text-[#1E293B]" 
                />
              </div>
              
              <div className="flex space-x-3">
                <select 
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-[13px] text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0041C7]"
                >
                  <option value="All">All Departments</option>
                  {authorities.map(auth => (
                    <option key={auth.authority_id} value={auth.authority_id.toString()}>{auth.name}</option>
                  ))}
                </select>

                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-[13px] text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0041C7]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Officer Detail</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Assigned Authority</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-10 font-bold text-slate-400">Syncing database...</td></tr>
                  ) : filteredOfficers.map(officer => (
                    <tr key={officer.user_id} className={`hover:bg-[#F8FAFC] transition-colors group ${officer.status === 'Inactive' ? 'opacity-60 bg-slate-50/50' : ''}`}>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold mr-3 ${officer.status === 'Active' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                            {getInitials(officer.full_name)}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-[#1E293B]">{officer.full_name}</p>
                            <p className="text-[11px] text-[#64748B]">{officer.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-[13px] text-[#64748B] font-mono font-semibold">
                        {officer.employee_id_code}
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="text-[12px] font-bold text-[#1E293B]">
                          {officer.authority_name || 'Unassigned'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold flex items-center ${officer.status === 'Active' ? 'text-[#28C76F]' : 'text-slate-400'}`}>
                           <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${officer.status === 'Active' ? 'bg-[#28C76F]' : 'bg-slate-400'}`}></span>
                           {officer.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(officer)} className="text-[#64748B] hover:text-[#0041C7] transition-colors" title="Edit Officer">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => openDelete(officer)} className="text-[#64748B] hover:text-[#EF4444] transition-colors" title="Permanently Delete">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOfficers.length === 0 && !loading && (
                    <tr><td colSpan="5" className="text-center py-10 italic text-slate-400">No officers match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <Footer />

          <AddOfficerModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} refreshData={fetchData} authorities={authorities} />
          <EditOfficerModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} refreshData={fetchData} authorities={authorities} officerData={selectedOfficer} />
          <DeleteOfficerModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} refreshData={fetchData} officerData={selectedOfficer} />

        </main>
      </div>
    </div>
  );
}