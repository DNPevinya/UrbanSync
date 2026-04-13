import React, { useState } from 'react';

export default function DeleteModal({ isOpen, onClose, deleteId, authorities, refreshData }) {
  const [fallbackId, setFallbackId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !deleteId) return null;

  const otherAuthorities = authorities.filter(a => a.authority_id !== deleteId);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/complaints/admin/delete-authority/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fallback_authority_id: fallbackId })
      });
      const result = await response.json();
      if (result.success) {
        setFallbackId('');
        onClose();
        if (refreshData) refreshData();
      } else {
        alert("Delete failed: " + result.message);
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center border border-[#E2E8F0]">
        
        <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h3 className="text-xl font-extrabold text-[#1E293B] mb-2">Delete Authority?</h3>
        <p className="text-[13px] text-[#64748B] mb-6 leading-relaxed">
          This action <span className="font-bold text-[#1E293B]">cannot be undone</span>. All assigned complaints must be reassigned before the authority can be removed.
        </p>

        <div className="text-left mb-6">
          <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">Select Authority for Reassignment <span className="text-[#EF4444]">*</span></label>
          <select 
            value={fallbackId}
            onChange={(e) => setFallbackId(e.target.value)}
            className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
          >
            <option value="" disabled>Choose an authority...</option>
            {otherAuthorities.map(a => (
              <option key={a.authority_id} value={a.authority_id}>{a.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-[#94A3B8] mt-1.5">* All pending complaints will be moved automatically.</p>
        </div>

        <div className="flex space-x-3 mb-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#E2E8F0] text-[#64748B] text-[13px] font-bold rounded-lg hover:bg-[#F8FAFC]">Cancel</button>
          <button 
            onClick={handleDelete}
            disabled={!fallbackId || isDeleting}
            className="flex-1 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] font-bold rounded-lg flex items-center justify-center disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}