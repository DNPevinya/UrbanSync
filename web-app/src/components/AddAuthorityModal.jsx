import React, { useState } from 'react';

export default function AddAuthorityModal({ isOpen, onClose, refreshData, departments, regions }) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [region, setRegion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/complaints/admin/add-authority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, region })
      });

      const result = await response.json();
      if (result.success) {
        setName(''); setDepartment(''); setRegion('');
        onClose();
        if (refreshData) refreshData();
      } else {
        alert("Failed to add: " + result.message);
      }
    } catch (error) {
      console.error("Error adding authority:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        <div className="bg-[#0041C7] px-6 py-5 flex justify-between items-center">
          <div className="flex items-center text-white">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
            <h3 className="text-lg font-bold">Add New Authority</h3>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Official Authority Name <span className="text-[#EF4444]">*</span></label>
            <input 
              type="text" 
              required
              placeholder="e.g. NWSDB Regional Office - Kandy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] focus:ring-2 focus:ring-[#0041C7] outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Department Category <span className="text-[#EF4444]">*</span></label>
              <select 
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] focus:ring-2 focus:ring-[#0041C7] outline-none bg-white"
              >
                <option value="" disabled>Select Department</option>
                {departments && departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Jurisdiction Region <span className="text-[#EF4444]">*</span></label>
              <select 
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] focus:ring-2 focus:ring-[#0041C7] outline-none bg-white"
              >
                <option value="" disabled>Select Region</option>
                {regions && regions.map((reg, index) => (
                  <option key={index} value={reg}>{reg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
             <p className="text-[11px] text-[#0041C7] font-semibold">
               <span className="font-extrabold block mb-1">Note on Staffing:</span>
               To assign officers to this new authority, please navigate to the User Management tab after creation.
             </p>
          </div>

          <div className="bg-[#F8FAFC] -mx-6 -mb-6 px-6 py-4 border-t border-[#E2E8F0] flex justify-end items-center space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-[13px] font-bold text-[#64748B] hover:text-[#1E293B]">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-[#0041C7] hover:bg-[#0033A0] text-white text-[13px] font-bold rounded-lg flex items-center disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Add Authority"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}