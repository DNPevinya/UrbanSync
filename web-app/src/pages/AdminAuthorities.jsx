import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AddAuthorityModal from '../components/AddAuthorityModal';
import EditAuthorityModal from '../components/EditAuthorityModal';
import DeleteModal from '../components/DeleteModal';
import { apiFetch } from '../utils/apiClient';

export default function AdminAuthorities() {
  // 1. STATE & HOOKS
  const [authorities, setAuthorities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [regions, setRegions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // 2. API HANDLERS
  const fetchAuthorities = async () => {
    setLoading(true);
    try {
      const [authRes, deptRes, regRes] = await Promise.all([
        apiFetch('http://localhost:5000/api/complaints/admin/authorities-list'),
        apiFetch('http://localhost:5000/api/complaints/admin/departments-list'),
        apiFetch('http://localhost:5000/api/complaints/admin/regions-list')
      ]);
      
      const authData = await authRes.json();
      const deptData = await deptRes.json();
      const regData = await regRes.json();

      if (authData.success) setAuthorities(authData.data);
      if (deptData.success) setDepartments(deptData.data);
      if (regData.success) setRegions(regData.data);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. LIFECYCLE & UTILITIES
  useEffect(() => {
    fetchAuthorities();
  }, []);

  // 4. HELPER VARIABLES
  const filteredAuths = authorities.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAuthorities = authorities.length;
  const totalOfficers = authorities.reduce((sum, a) => sum + (a.officer_count || 0), 0);
  const authoritiesWithCoverage = authorities.filter(a => a.officer_count > 0).length;
  const activeNetworkPercentage = totalAuthorities > 0 
    ? Math.round((authoritiesWithCoverage / totalAuthorities) * 100) 
    : 0;

  const openEdit = (auth) => { setEditData(auth); setIsEditOpen(true); };
  const openDelete = (id) => { setDeleteId(id); setIsDeleteOpen(true); };

  // 5. UI RENDER
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header breadcrumbs={['Admin', 'Authorities']} />

        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-extrabold text-[#1E293B]">Authority Management</h2>
              <p className="text-[13px] text-[#64748B] mt-1">Configure and manage municipal authorities.</p>
            </div>
            <button 
              onClick={() => setIsAddOpen(true)} 
              className="px-5 py-2.5 bg-[#0041C7] hover:bg-[#0033A0] text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Add Authority
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0] flex items-center shadow-sm">
              <div className="w-10 h-10 rounded bg-[#F0F5FF] flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-[#0041C7]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 100 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Total Authorities</p>
                <h3 className="text-2xl font-extrabold text-[#1E293B]">{totalAuthorities}</h3>
              </div>
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0] flex items-center shadow-sm">
              <div className="w-10 h-10 rounded bg-[#DCFCE7] flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-[#16A34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Active Network</p>
                <h3 className="text-2xl font-extrabold text-[#1E293B]">{activeNetworkPercentage}%</h3>
              </div>
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0] flex items-center shadow-sm">
              <div className="w-10 h-10 rounded bg-[#F0F5FF] flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-[#0041C7]" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Assigned Officers</p>
                <h3 className="text-2xl font-extrabold text-[#1E293B]">{totalOfficers}</h3>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl flex-1 flex flex-col shadow-sm">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center">
              <div className="relative w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search authorities..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-[13px] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0041C7] text-[#1E293B]" 
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Authority Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Department Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Region</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-center">Officer Count</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-bold">Loading...</td></tr>
                  ) : filteredAuths.map((auth) => (
                    <tr key={auth.authority_id} className="hover:bg-[#F8FAFC] transition-colors group">
                      <td className="px-6 py-4 flex items-center">
                        <div className="w-8 h-8 rounded bg-[#F0F5FF] text-[#0041C7] flex items-center justify-center mr-3 font-bold text-[10px]">
                          #{auth.authority_id}
                        </div>
                        <span className="text-[13px] font-bold text-[#1E293B]">{auth.name}</span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#64748B] font-semibold">{auth.department}</td>
                      <td className="px-6 py-4 text-[13px] font-bold text-[#1E293B]">{auth.region}</td>
                      <td className="px-6 py-4 text-[13px] font-bold text-[#0041C7] text-center">
                        <span className={`px-2 py-1 rounded ${auth.officer_count === 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50'}`}>
                          {auth.officer_count} Officers
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-4 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEdit(auth)} 
                            className="text-[#64748B] hover:text-[#0041C7] transition-colors"
                            title="Edit Authority"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button 
                            onClick={() => openDelete(auth.authority_id)} 
                            className="text-[#64748B] hover:text-[#EF4444] transition-colors"
                            title="Delete Authority"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAuths.length === 0 && !loading && (
                    <tr><td colSpan="5" className="text-center py-10 text-slate-400 italic">No authorities match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <Footer />

          <AddAuthorityModal 
            isOpen={isAddOpen} 
            onClose={() => setIsAddOpen(false)} 
            refreshData={fetchAuthorities} 
            departments={departments}
            regions={regions}
          />
          
          <EditAuthorityModal 
            isOpen={isEditOpen} 
            onClose={() => setIsEditOpen(false)} 
            editData={editData} 
            refreshData={fetchAuthorities} 
            departments={departments}
            regions={regions}
          />
          
          <DeleteModal 
            isOpen={isDeleteOpen} 
            onClose={() => setIsDeleteOpen(false)} 
            deleteId={deleteId} 
            authorities={authorities} 
            refreshData={fetchAuthorities} 
          />

        </main>
      </div>
    </div>
  );
}