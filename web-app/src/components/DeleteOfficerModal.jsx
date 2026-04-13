import React, { useState } from 'react';

export default function DeleteOfficerModal({ isOpen, onClose, refreshData, officerData }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !officerData) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/auth/admin/delete-officer/${officerData.user_id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
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
        <h3 className="text-xl font-extrabold text-[#1E293B] mb-2">Delete Account?</h3>
        <p className="text-[13px] text-[#64748B] mb-6 leading-relaxed">
          Are you sure you want to permanently delete <span className="font-bold text-[#1E293B]">{officerData.full_name}</span>? This action cannot be undone.
        </p>
        <div className="flex space-x-3 mb-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#E2E8F0] text-[#64748B] text-[13px] font-bold rounded-lg hover:bg-[#F8FAFC]">Cancel</button>
          <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] font-bold rounded-lg flex items-center justify-center disabled:opacity-50">
            {isDeleting ? "Deleting..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}