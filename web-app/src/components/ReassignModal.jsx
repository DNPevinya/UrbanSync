import React, { useState, useEffect } from 'react';

export default function ReassignModal({ isOpen, onClose, complaintId, onReassignSuccess }) {
  const [currentData, setCurrentData] = useState(null);
  const [authorities, setAuthorities] = useState([]);
  const [officers, setOfficers] = useState([]);
  
  const [targetAuthority, setTargetAuthority] = useState('');
  const [targetOfficer, setTargetOfficer] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && complaintId) {
      fetch(`http://localhost:5000/api/complaints/${complaintId}`)
        .then(res => res.json())
        .then(data => { if (data.success) setCurrentData(data.data); });

      fetch(`http://localhost:5000/api/complaints/admin/authorities`)
        .then(res => res.json())
        .then(data => { if (data.success) setAuthorities(data.data); });
    }
  }, [isOpen, complaintId]);

  useEffect(() => {
    if (targetAuthority) {
      setTargetOfficer(''); 
      fetch(`http://localhost:5000/api/complaints/admin/officers/${targetAuthority}`)
        .then(res => res.json())
        .then(data => { if (data.success) setOfficers(data.data); });
    } else {
      setOfficers([]);
    }
  }, [targetAuthority]);

  const handleReassign = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/complaints/reassign/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          new_authority_id: targetAuthority,
          assigned_officer_id: targetOfficer, 
          reason: reason
        })
      });

      const result = await response.json();
      if (result.success) {
        onClose(); 
        if (onReassignSuccess) onReassignSuccess(); 
      } else {
        alert("Failed to reassign: " + result.message);
      }
    } catch (error) {
      console.error("Reassignment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="bg-[#0041C7] px-6 py-5 flex justify-between items-start">
          <div>
            <h3 className="text-white text-lg font-bold">Reassign Complaint</h3>
            <p className="text-blue-100 text-xs font-medium mt-1">COMPLAINT ID: #{complaintId}</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          
          <div className="mb-6">
            <h4 className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center mb-3">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              Current Assignment
            </h4>
            
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#64748B] font-semibold mb-1">Assigned Authority</p>
                <span className="text-[13px] font-bold text-[#1E293B]">
                  {currentData ? (currentData.authority_name || 'Unassigned') : 'Loading...'}
                </span>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                currentData?.status === 'PENDING' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {currentData ? currentData.status : '...'}
              </span>
            </div>
          </div>

          <hr className="border-[#E2E8F0] mb-6" />

          <div>
            <h4 className="text-[10px] font-bold text-[#0041C7] uppercase tracking-wider flex items-center mb-4">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              New Assignment
            </h4>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Target Authority <span className="text-[#EF4444]">*</span></label>
                <select 
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0041C7]"
                  value={targetAuthority}
                  onChange={(e) => setTargetAuthority(e.target.value)}
                >
                  <option value="" disabled>Select Department...</option>
                  {authorities.map(auth => (
                    <option key={auth.authority_id} value={auth.authority_id}>
                      {auth.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Target Officer <span className="text-[#EF4444]">*</span></label>
                <select 
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0041C7]"
                  value={targetOfficer}
                  onChange={(e) => setTargetOfficer(e.target.value)}
                  disabled={!targetAuthority || officers.length === 0}
                >
                  <option value="" disabled>
                    {!targetAuthority ? "Select Authority First" : officers.length === 0 ? "No Officers Found" : "Select Officer..."}
                  </option>
                  {officers.map(off => (
                    <option key={off.user_id} value={off.user_id}>
                      {off.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-[11px] font-bold text-[#1E293B] mb-1.5">Reason for Reassignment <span className="text-[#EF4444]">*</span></label>
              <textarea 
                rows="2"
                placeholder="Briefly explain why this complaint is being moved..."
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[13px] text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0041C7] resize-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              ></textarea>
            </div>
            
            <div className="flex items-center mt-3">
              <input type="checkbox" id="notify" className="w-3.5 h-3.5 text-[#0041C7] border-[#E2E8F0] rounded focus:ring-[#0041C7]" defaultChecked />
              <label htmlFor="notify" className="ml-2 text-[11px] font-semibold text-[#64748B]">Notify target officer immediately via priority email</label>
            </div>

          </div>
        </div>

        <div className="bg-[#F8FAFC] px-6 py-4 border-t border-[#E2E8F0] flex justify-end items-center gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-[13px] font-bold text-[#64748B] hover:text-[#1E293B] transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleReassign}
            className="px-5 py-2.5 bg-[#0041C7] hover:bg-[#0033A0] text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors flex items-center disabled:opacity-50"
            disabled={!targetAuthority || !targetOfficer || !reason || isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Confirm Reassignment"}
          </button>
        </div>

      </div>
    </div>
  );
}