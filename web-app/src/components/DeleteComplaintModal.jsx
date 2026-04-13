import React, { useState } from 'react';

export default function DeleteComplaintModal({ isOpen, onClose, complaintId, refreshData }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !complaintId) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/complaints/admin/delete-complaint/${complaintId}`, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center border border-[#E2E8F0] animate-in fade-in zoom-in duration-200">
        
        <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <h3 className="text-xl font-extrabold text-[#1E293B] mb-2">Delete Complaint?</h3>
        <p className="text-[13px] text-[#64748B] mb-6 leading-relaxed">
          Are you sure you want to permanently delete Complaint <span className="font-bold text-[#1E293B]">#CMP-{complaintId}</span>? This action cannot be undone and will remove it from all analytics.
        </p>

        <div className="flex space-x-3 mb-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#E2E8F0] text-[#64748B] text-[13px] font-bold rounded-lg hover:bg-[#F8FAFC] transition-colors">Cancel</button>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] font-bold rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
          >
            {isDeleting ? "Deleting..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}