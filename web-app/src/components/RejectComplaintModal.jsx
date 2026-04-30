import React, { useState } from 'react';
import { apiFetch } from '../utils/apiClient';

export default function RejectComplaintModal({ isOpen, onClose, complaint, refreshData, officerName }) {
  // 1. STATE & HOOKS
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !complaint) return null;

  // 2. API HANDLERS
  const handleReject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiFetch(`http://localhost:5000/api/complaints/officer/reject-complaint/${complaint.complaint_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: reason,
          officerName: officerName 
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setReason('');
        onClose();
        if (refreshData) refreshData();
      } else {
        alert("Failed to reject: " + result.message);
      }
    } catch (error) {
      console.error("Error rejecting complaint:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. UI RENDER
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        <div className="bg-[#EF4444] px-6 py-5 flex justify-between items-center text-white">
          <h3 className="text-lg font-bold flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Reject & Escalate
          </h3>
          <button onClick={onClose} className="hover:text-red-200"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <form onSubmit={handleReject} className="p-6 space-y-5">
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <p className="text-[12px] text-red-800 font-medium">
              <span className="font-bold block mb-1">Warning:</span>
              Rejecting this complaint will remove it from your department's queue and send it back to the Super Admin for manual review.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5 uppercase tracking-wider">Reason for Rejection <span className="text-[#EF4444]">*</span></label>
            <textarea 
              required
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., This is a road issue, not a water pipe issue..."
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] text-[#1E293B] focus:ring-2 focus:ring-[#EF4444] outline-none resize-none"
            ></textarea>
          </div>

          <div className="bg-[#F8FAFC] -mx-6 -mb-6 px-6 py-4 border-t border-[#E2E8F0] flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-[13px] font-bold text-[#64748B] hover:text-[#1E293B]">Cancel</button>
            <button type="submit" disabled={isSubmitting || !reason} className="px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] font-bold rounded-lg disabled:opacity-50">
              {isSubmitting ? "Processing..." : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}