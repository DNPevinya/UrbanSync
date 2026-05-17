import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BASE_URL } from '../config';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [newIssueName, setNewIssueName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const token = localStorage.getItem('urbanSyncToken'); 
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const catRes = await fetch(`${BASE_URL}/api/admin/categories`, { headers });
        const catData = await catRes.json();
        if (catData.success) setCategories(catData.data);

        const deptRes = await fetch(`${BASE_URL}/api/admin/departments-list`, { headers });
        const deptData = await deptRes.json();
        if (deptData.success) setDepartments(deptData.data);
      } catch (err) {
        console.error("Failed to load dropdowns", err);
      }
    };
    fetchDropdownData();
  }, []);

  const handleAddIssue = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId || !selectedDepartmentId || !newIssueName.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('urbanSyncToken');
      const res = await fetch(`${BASE_URL}/api/admin/issues`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          category_id: selectedCategoryId,
          department_id: selectedDepartmentId,
          issue_name: newIssueName
        })
      });
      const result = await res.json();

      if (result.success) {
        setMessage({ type: 'success', text: `Successfully configured "${newIssueName}" in the system!` });
        setNewIssueName(''); 
        setSelectedCategoryId('');
        setSelectedDepartmentId('');
      } else {
        setMessage({ type: 'error', text: 'Failed to add issue.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header breadcrumbs={['Admin', 'Category Management']} />

        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-extrabold text-[#1E293B]">Category Management</h2>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl flex-1 flex flex-col shadow-sm p-8">
            
            <div className="max-w-2xl">
              <h3 className="text-lg font-bold text-[#1E293B] mb-6 border-b border-[#E2E8F0] pb-3">Add New Complaint/ Service Reqest Type</h3>
              
              {message.text && (
                <div className={`p-4 mb-6 rounded-lg text-[13px] font-bold flex items-center ${message.type === 'success' ? 'bg-[#E8F8EE] text-[#28C76F] border border-[#28C76F]/20' : 'bg-red-50 text-[#EF4444] border border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleAddIssue} className="space-y-6">
                <div>
                  <label className="block text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2">1. Parent Category</label>
                  <select 
                    value={selectedCategoryId} 
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="block w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-[13px] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0041C7] text-[#1E293B]"
                  >
                    <option value="">-- Select a Category --</option>
                    {categories.map(cat => (
                      <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2">2. Specific Issue/ Request Name</label>
                  <input 
                    type="text" 
                    value={newIssueName} 
                    onChange={(e) => setNewIssueName(e.target.value)}
                    placeholder="e.g., Delay in Garbage Collection"
                    className="block w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-[13px] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0041C7] text-[#1E293B]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2">3. Routing Department</label>
                  <select 
                    value={selectedDepartmentId} 
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    className="block w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-[13px] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0041C7] text-[#1E293B]"
                  >
                    <option value="">-- Select Target Department --</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-3 bg-[#0041C7] hover:bg-[#0033A0] text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center w-full sm:w-auto"
                  >
                    {loading ? 'Saving...' : 'Add Complaint Type'}
                  </button>
                </div>
              </form>
            </div>

          </div>
          
          <Footer />

        </main>
      </div>
    </div>
  );
}