import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient';

export default function DetailsModal({ isOpen, onClose, complaintId }) {
  // 1. STATE & HOOKS
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. LIFECYCLE & UTILITIES
  useEffect(() => {
    if (isOpen && complaintId) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const response = await apiFetch(`http://localhost:5000/api/complaints/${complaintId}`);
          const result = await response.json();
          if (result.success) {
            setData(result.data);
          }
        } catch (error) {
          console.error("Error fetching complaint details:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, complaintId]);

  if (!isOpen) return null;

  // 3. HELPER FUNCTIONS
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  const evidenceImages = data?.image_url ? data.image_url.split(',') : [];

  // 4. UI RENDER
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center bg-white">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-[#0041C7] mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
            <h3 className="text-[#1E293B] text-lg font-extrabold mr-4">Complaint #{complaintId}</h3>
            
            {!loading && data && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                data.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
                data.status === 'RESOLVED' ? 'bg-green-50 text-green-600' : 
                data.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {data.status}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto bg-[#F8FAFC] max-h-[80vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <svg className="w-8 h-8 animate-spin mb-4 text-[#0041C7]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="font-bold">Retrieving secure records...</p>
            </div>
          ) : !data ? (
            <div className="text-center text-red-500 font-bold py-10">Failed to load complaint data.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              
              <div className="md:col-span-3 space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center mb-3">
                    <svg className="w-4 h-4 mr-1.5 text-[#0041C7]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    Citizen Details
                  </h4>
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-[10px] text-[#64748B] font-semibold mb-1">Full Name</p>
                        <p className="text-[13px] font-bold text-[#1E293B]">{data.citizen_name || 'Anonymous User'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-semibold mb-1">NIC Number</p>
                        <p className="text-[13px] font-bold text-[#0041C7]">{data.citizen_nic || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-[#64748B] font-semibold mb-1">Phone Number</p>
                        <p className="text-[13px] font-bold text-[#1E293B]">{data.citizen_phone || 'Not Provided'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B] font-semibold mb-1">Email Address</p>
                        <p className="text-[13px] font-bold text-[#1E293B]">{data.citizen_email || 'Not Provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center mb-3">
                    <svg className="w-4 h-4 mr-1.5 text-[#0041C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                    Issue Description: {data.title}
                  </h4>
                  <div className="text-[13px] text-[#475569] leading-relaxed bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
                    <p>{data.description || 'No detailed description provided by the citizen.'}</p>
                  </div>
                </div>

                {data.admin_notes && (
                  <div className="bg-[#FEF2F2] border-l-4 border-[#DC2626] p-5 rounded-xl shadow-sm">
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 text-[#DC2626] mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      <h4 className="text-[12px] font-extrabold text-[#DC2626] uppercase tracking-wider">Officer Escalation Notes</h4>
                    </div>
                    <div className="text-[14px] text-[#1E293B] font-medium leading-relaxed">
                      <p className="whitespace-pre-wrap">{data.admin_notes.trim()}</p>
                    </div>
                  </div>
                )}

                {data.latitude && data.longitude && (
                  <div>
                    <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center mb-3 mt-6">
                      <svg className="w-4 h-4 mr-1.5 text-[#0041C7]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                      Live GPS Location
                    </h4>
                    <div className="w-full h-64 rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-slate-100 relative">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        loading="lazy" 
                        allowFullScreen 
                        src={`https://maps.google.com/maps?q=${data.latitude},${data.longitude}&z=16&output=embed`}
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center mb-3">
                    <svg className="w-4 h-4 mr-1.5 text-[#0041C7]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    Internal Metadata
                  </h4>
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
                    <div className="space-y-3 divide-y divide-[#E2E8F0]">
                      <div className="flex justify-between items-center pb-2">
                        <span className="text-[11px] text-[#64748B] font-semibold">Submitted Date</span>
                        <span className="text-[12px] font-bold text-[#1E293B] text-right">{formatDateTime(data.created_at)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 pb-2">
                        <span className="text-[11px] text-[#64748B] font-semibold">Assigned Authority</span>
                        <span className="text-[12px] font-bold text-[#1E293B] text-right max-w-[120px]">{data.authority_name || 'Pending Assignment'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 pb-2">
                        <span className="text-[11px] text-[#64748B] font-semibold">Category</span>
                        <span className="text-[12px] font-bold text-[#1E293B] text-right max-w-[120px]">{data.category}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-[11px] text-[#64748B] font-semibold">Reported Area</span>
                        <span className="text-[12px] font-bold text-[#1E293B] text-right truncate max-w-[120px]" title={data.location_text}>
                          {data.location_text || 'GPS Only'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center mb-3">
                    <svg className="w-4 h-4 mr-1.5 text-[#0041C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    Attached Evidence
                  </h4>
                  <div className="flex flex-col gap-3">
                    {evidenceImages.length > 0 ? (
                      evidenceImages.map((img, idx) => (
                        <a key={idx} href={`http://localhost:5000${img}`} target="_blank" rel="noopener noreferrer" className="w-full h-32 bg-slate-100 rounded-lg overflow-hidden border border-[#E2E8F0] flex items-center justify-center hover:opacity-80 transition-opacity">
                          <img src={`http://localhost:5000${img}`} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 italic bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm text-center">No photo evidence attached.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}