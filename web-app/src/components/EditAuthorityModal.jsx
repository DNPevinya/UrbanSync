import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient';

export default function EditAuthorityModal({ isOpen, onClose, editData, refreshData, departments, regions }) {
  // 1. STATE & HOOKS
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [region, setRegion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. LIFECYCLE & UTILITIES
  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setDepartment(editData.department);
      setRegion(editData.region);
    }
  }, [editData]);

  if (!isOpen || !editData) return null;

  // 3. API HANDLERS
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`http://localhost:5000/api/complaints/admin/update-authority/${editData.authority_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, region })
      });
      const result = await response.json();
      if (result.success) {
        onClose();
        if (refreshData) refreshData();
      }
    } catch (error) {
      console.error("Error updating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. UI RENDER
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="bg-[#0041C7] px-6 py-5 flex justify-between items-center text-white">
          <h3 className="text-lg font-bold flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Edit Authority
          </h3>
          <button onClick={onClose} className="hover:text-blue-200"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Authority Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] font-bold text-[#1E293B] focus:ring-2 focus:ring-[#0041C7] outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Department Category</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] bg-white focus:ring-2 focus:ring-[#0041C7] outline-none">
                <option value="" disabled>Select Department</option>
                {departments && departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Region</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] bg-white focus:ring-2 focus:ring-[#0041C7] outline-none">
                <option value="" disabled>Select Region</option>
                {regions && regions.map((reg, index) => (
                  <option key={index} value={reg}>{reg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#F8FAFC] -mx-6 -mb-6 px-6 py-4 border-t border-[#E2E8F0] flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-[13px] font-bold text-[#64748B] hover:text-[#1E293B]">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-[#0041C7] hover:bg-[#0033A0] text-white text-[13px] font-bold rounded-lg disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}