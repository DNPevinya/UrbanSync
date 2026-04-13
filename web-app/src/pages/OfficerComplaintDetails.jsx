import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RejectComplaintModal from '../components/RejectComplaintModal'; // ADDED IMPORT

export default function OfficerComplaintDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const complaintId = searchParams.get('id');

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  
  // MODAL STATE
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Get logged in officer info for the header and escalation
  const savedUser = JSON.parse(localStorage.getItem('urbanSyncUser') || '{}');

  const fetchDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/complaints/${complaintId}`);
      const result = await response.json();
      if (result.success) {
        setComplaint(result.data);
        setNewStatus(result.data.status); 
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaintId) fetchDetails();
  }, [complaintId]);

  const handleStatusChange = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`http://localhost:5000/api/complaints/update-status/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.success) {
        setComplaint({ ...complaint, status: newStatus });
        alert("Status updated successfully!");
      }
    } catch (error) {
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-bold text-[#64748B]">Loading Complaint Details...</div>;
  if (!complaint) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-bold text-red-500">Complaint not found.</div>;

  const submitDate = new Date(complaint.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
  });

  const getStatusColor = (status) => {
    const s = status.toUpperCase();
    if (s === 'PENDING') return 'bg-amber-100 text-amber-700';
    if (s === 'IN PROGRESS') return 'bg-blue-100 text-blue-700';
    if (s === 'RESOLVED') return 'bg-green-100 text-green-700';
    if (s === 'REJECTED') return 'bg-red-100 text-red-700 animate-pulse'; // Added for rejected state
    return 'bg-[#F0F5FF] text-[#0041C7]';
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="officer" />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        <div className="bg-white border-b border-[#E2E8F0] px-8 py-4 z-10 flex justify-between items-center shadow-sm flex-shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F8FAFC] mr-4 text-[#64748B] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <div className="flex items-center">
                <h1 className="text-xl font-extrabold text-[#1E293B] mr-3">Complaint #CMP-{complaint.complaint_id}</h1>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${getStatusColor(complaint.status)}`}>
                  {complaint.status}
                </span>
              </div>
              <p className="text-[12px] text-[#64748B] mt-0.5">Submitted on {submitDate.split(',')[0]} • {savedUser.authorityName || 'Department'}</p>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-6">
              
              {/* Admin Notes Section (Crucial if the admin sends it back or if it's rejected) */}
              {complaint.admin_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center mb-2">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    System / Admin Notes
                  </h4>
                  <p className="text-[13px] text-amber-900 whitespace-pre-wrap font-medium">{complaint.admin_notes}</p>
                </div>
              )}

              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <h3 className="text-[13px] font-bold text-[#1E293B]">Description & Details</h3>
                </div>
                <div className="p-6">
                  <h2 className="text-lg font-extrabold text-[#1E293B] mb-3 uppercase">{complaint.title}</h2>
                  <p className="text-[14px] text-[#475569] leading-relaxed mb-6">
                    {complaint.description || "No detailed description provided by the citizen."}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                    <div>
                      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Category</p>
                      <p className="text-[13px] font-bold text-[#1E293B]">{complaint.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Citizen Ref</p>
                      <p className="text-[13px] font-bold text-[#1E293B]">User #{complaint.user_id}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                  <h3 className="text-[13px] font-bold text-[#1E293B]">Location Information</h3>
                  {complaint.latitude && (
                    <span className="text-[12px] font-mono text-[#0041C7]">
                      {parseFloat(complaint.latitude).toFixed(4)}° N, {parseFloat(complaint.longitude).toFixed(4)}° E
                    </span>
                  )}
                </div>
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 md:w-1/2">
                    <div className="flex items-start mb-6">
                      <div className="w-10 h-10 rounded-full bg-[#F0F5FF] text-[#0041C7] flex items-center justify-center mr-4 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#1E293B]">Citizen Provided Location</h4>
                        <p className="text-[12px] text-[#64748B] mt-0.5 leading-relaxed">{complaint.location_text}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-1/2 bg-slate-200 relative min-h-[200px] border-l border-[#E2E8F0]">
                    {complaint.latitude && complaint.longitude ? (
                      <iframe
                        title="Live Map"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(complaint.longitude)-0.005},${parseFloat(complaint.latitude)-0.005},${parseFloat(complaint.longitude)+0.005},${parseFloat(complaint.latitude)+0.005}&layer=mapnik&marker=${complaint.latitude},${complaint.longitude}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      ></iframe>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC] text-[#94A3B8] text-xs font-medium italic">
                        No GPS coordinates provided
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <h3 className="text-[13px] font-bold text-[#1E293B]">Evidence & Attachments</h3>
                </div>
                <div className="p-6 flex space-x-4 overflow-x-auto">
                   {complaint.image_url ? (
                     complaint.image_url.split(',').map((imgUrl, index) => (
                        <div key={index} className="w-32 h-32 rounded-lg bg-slate-200 overflow-hidden border border-[#E2E8F0] flex-shrink-0">
                          <img src={`http://localhost:5000${imgUrl}`} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </div>
                     ))
                   ) : (
                     <div className="w-full py-8 flex items-center justify-center text-[#94A3B8] text-xs font-medium italic bg-[#F8FAFC] rounded-lg border border-dashed border-[#CBD5E1]">
                        No images attached to this complaint.
                     </div>
                   )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
                <h3 className="text-[12px] font-bold text-[#1E293B] uppercase tracking-wider mb-4">Update Case Status</h3>
                <label className="block text-[11px] font-bold text-[#64748B] mb-2">Workflow Stage</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-[13px] font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0041C7] mb-4"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
                <button 
                  onClick={handleStatusChange}
                  disabled={updating || newStatus === complaint.status}
                  className="w-full py-2.5 bg-[#0041C7] hover:bg-[#0033A0] text-white text-[13px] font-bold rounded-lg transition-colors disabled:opacity-50 disabled:bg-slate-400 mb-4"
                >
                  {updating ? 'Applying...' : 'Apply Transition'}
                </button>

                {/* ESCALATION BUTTON: Only show if the complaint isn't already resolved/rejected */}
                {complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
                  <div className="pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setIsRejectModalOpen(true)}
                      className="w-full py-2 border-2 border-red-200 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white font-bold rounded-lg text-[12px] transition-all flex items-center justify-center shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Reject & Escalate
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
                <h3 className="text-[12px] font-bold text-[#1E293B] uppercase tracking-wider mb-6">Case Timeline</h3>
                
                <div className="relative border-l-2 border-[#E2E8F0] ml-3 space-y-6">
                  
                  <div className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${
                        complaint.status === 'RESOLVED' ? 'bg-green-500' : 
                        complaint.status === 'REJECTED' ? 'bg-red-500' : 
                        complaint.status === 'IN PROGRESS' ? 'bg-[#0041C7]' : 'bg-amber-500'
                    }`}></div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-[12px] font-bold text-[#1E293B]">Current Status</h4>
                      <span className="text-[10px] font-bold text-[#0041C7]">Live</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Case is currently marked as <span className="font-bold text-[#1E293B]">{complaint.status}</span>.
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#E2E8F0] border-4 border-white shadow-sm"></div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-[12px] font-bold text-[#64748B]">System Receipt</h4>
                      <span className="text-[10px] font-bold text-[#94A3B8]">{submitDate.split(',')[0]}</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Complaint registered and routed to {savedUser.authorityName || 'your department'}.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>
          <Footer />
        </main>
      </div>

      {/* RENDER THE REJECT MODAL */}
      <RejectComplaintModal 
        isOpen={isRejectModalOpen} 
        onClose={() => setIsRejectModalOpen(false)} 
        complaint={complaint} 
        refreshData={fetchDetails} 
        officerName={savedUser.fullName}
      />

    </div>
  );
}