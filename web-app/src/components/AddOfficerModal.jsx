import React, { useState, useEffect } from 'react';

export default function AddOfficerModal({ isOpen, onClose, refreshData, authorities }) {
  const [formData, setFormData] = useState({ full_name: '', email: '', authority_id: '', employee_id_code: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null);

  useEffect(() => {
    if (formData.authority_id) {
      fetch(`http://localhost:5000/api/auth/admin/next-employee-id/${formData.authority_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setFormData(prev => ({ ...prev, employee_id_code: data.employee_id }));
        })
        .catch(err => console.error("Error fetching ID:", err));
    }
  }, [formData.authority_id]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/admin/add-officer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      
      if (result.success) {
        setGeneratedPassword(result.tempPassword);
        if (refreshData) refreshData();
      } else {
        alert("Failed to create officer: " + result.message);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAndReset = () => {
    setFormData({ full_name: '', email: '', authority_id: '', employee_id_code: '' });
    setGeneratedPassword(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-[#0041C7] px-6 py-5 flex justify-between items-center text-white">
          <h3 className="text-lg font-bold flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            Add New Officer
          </h3>
          {!generatedPassword && (
            <button onClick={handleCloseAndReset} className="hover:text-blue-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {generatedPassword ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-extrabold text-[#1E293B] mb-2">Account Created!</h3>
            <p className="text-[13px] text-[#64748B] mb-6">Please provide this temporary password securely to {formData.full_name}.</p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-8">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Temporary Password</p>
              <p className="text-2xl font-mono font-bold text-[#0041C7] tracking-wider select-all">{generatedPassword}</p>
            </div>

            <button onClick={handleCloseAndReset} className="w-full py-3 bg-[#1E293B] hover:bg-black text-white text-[13px] font-bold rounded-lg transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Full Name <span className="text-[#EF4444]">*</span></label>
              <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] focus:ring-2 focus:ring-[#0041C7] outline-none" />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Work Email <span className="text-[#EF4444]">*</span></label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] focus:ring-2 focus:ring-[#0041C7] outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Assigned Authority <span className="text-[#EF4444]">*</span></label>
                <select required value={formData.authority_id} onChange={e => setFormData({...formData, authority_id: e.target.value})} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] bg-white focus:ring-2 focus:ring-[#0041C7] outline-none">
                  <option value="" disabled>Select Authority</option>
                  {authorities.map(auth => (
                    <option key={auth.authority_id} value={auth.authority_id}>{auth.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5 flex justify-between">Employee ID <span className="text-slate-400 font-normal">Auto</span></label>
                <input type="text" readOnly value={formData.employee_id_code} placeholder="Select Authority..." className="w-full border border-[#E2E8F0] bg-slate-50 text-slate-500 rounded-lg px-3 py-2.5 text-[13px] outline-none font-mono cursor-not-allowed" />
              </div>
            </div>

            <div className="bg-[#F8FAFC] -mx-6 -mb-6 px-6 py-4 border-t border-[#E2E8F0] flex justify-end space-x-3 mt-6">
              <button type="button" onClick={handleCloseAndReset} className="px-4 py-2.5 text-[13px] font-bold text-[#64748B] hover:text-[#1E293B]">Cancel</button>
              <button type="submit" disabled={isSubmitting || !formData.authority_id} className="px-5 py-2.5 bg-[#0041C7] hover:bg-[#0033A0] text-white text-[13px] font-bold rounded-lg disabled:opacity-50">
                {isSubmitting ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}