import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BASE_URL } from '../config'; 

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`${BASE_URL}/api/auth/admin/citizens`);
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
    if (!window.confirm(`Are you sure you want to set this account to ${newStatus}?`)) return;

    try {
      const response = await apiFetch(`${BASE_URL}/api/auth/admin/suspend-citizen/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) fetchUsers(); 
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const filteredUsers = users.filter(user => 
    (user.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.nic || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.district || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header breadcrumbs={["Admin", "Citizen Directory"]} />
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-extrabold text-[#1E293B]">Citizen Directory</h1>
              </div>
              
              <div className="relative w-72">
                <input 
                  type="text"
                  placeholder="Search by name, NIC, email, or district..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0041C7] outline-none text-sm transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="w-4 h-4 text-[#64748B] absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[#F1F5F9]">
                      <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Citizen Name</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">NIC Number</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-10 text-center text-[#64748B]">
                          <div className="flex justify-center items-center gap-2">
                            <div className="w-4 h-4 border-2 border-[#0041C7] border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading database...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.citizen_id} className="hover:bg-slate-50 transition-colors text-sm">
                          <td className="px-6 py-4 font-bold text-[#1E293B]">{user.fullName}</td>
                          <td className="px-6 py-4 font-mono font-bold text-[#0041C7]">{user.nic}</td>
                          <td className="px-6 py-4 text-xs">
                            <div className="font-semibold text-[#1E293B]">{user.email}</div>
                            <div className="text-[#64748B]">{user.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[#1E293B]">{user.district || 'N/A'}</span>
                              <span className="text-[11px] text-[#64748B]">{user.division || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              user.status === 'Suspended' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {user.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleStatusToggle(user.citizen_id, user.status || 'Active')}
                              className={`text-[11px] font-bold hover:underline ${
                                user.status === 'Suspended' ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {user.status === 'Suspended' ? 'Re-activate' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-10 text-center text-slate-400 italic">No citizens found matching your criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}