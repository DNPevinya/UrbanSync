import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BASE_URL } from '../config'; 

export default function UnassignedComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAssignments, setSelectedAssignments] = useState({});
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    fetchUnassignedData();
  }, []);

  const fetchUnassignedData = async () => {
    try {
      const token = localStorage.getItem('urbanSyncToken');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const compRes = await fetch(`${BASE_URL}/api/complaints/admin/unassigned`, { headers });
      const compData = await compRes.json();
      if (compData.success) {
        setComplaints(compData.data);
      }

      const authRes = await fetch(`${BASE_URL}/api/complaints/admin/authorities`, { headers });
      const authData = await authRes.json();
      if (authData.success) {
        setAuthorities(authData.data);
      }
    } catch (error) {
      console.error("Error loading unassigned dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownChange = (complaintId, authorityId) => {
    setSelectedAssignments(prev => ({
      ...prev,
      [complaintId]: authorityId
    }));
  };

  const handleAssign = async (complaintId) => {
    const chosenAuthorityId = selectedAssignments[complaintId];
    
    if (!chosenAuthorityId) {
      alert("Please select an authority from the dropdown first.");
      return;
    }

    setAssigningId(complaintId);

    try {
      const token = localStorage.getItem('urbanSyncToken');
      
      const response = await fetch(`${BASE_URL}/api/complaints/reassign/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ new_authority_id: chosenAuthorityId })
      });

      const data = await response.json();

      if (data.success) {
        setComplaints(prevComplaints => 
          prevComplaints.filter(c => c.complaint_id !== complaintId)
        );
        alert("Success! The complaint has been routed to the assigned authority.");
      } else {
        alert(data.message || "Failed to assign.");
      }
    } catch (error) {
      console.error("Assignment error:", error);
      alert("Network error. Please make sure your backend is running.");
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header breadcrumbs={['Admin', 'Pending Assignments']} />

        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          
          <div className="mb-6">
            <p className="text-[#64748B] text-sm">
              These reports could not be automatically routed by the geographic analysing. Please review the raw location data and assign them manually.
            </p>
          </div>

          {loading ? (
            <div className="text-[#64748B] py-10">Syncing pending assignments...</div>
          ) : complaints.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-sm">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-[#10B981] text-lg font-bold mb-2">All caught up!</h3>
              <p className="text-[#64748B] text-sm">There are no unassigned complaints waiting for manual routing.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden mb-8 flex-shrink-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC] text-[10px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-6 py-4">Issue Details</th>
                      <th className="px-6 py-4">Location Data</th>
                      <th className="px-6 py-4">Assign To Authority</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {complaints.map((complaint) => (
                      <tr key={complaint.complaint_id} className="hover:bg-[#F8FAFC] transition-colors group">
                        
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-[13px] font-bold text-[#0041C7] mb-1">{complaint.title}</p>
                          <p className="text-[12px] text-[#64748B] line-clamp-2">{complaint.description}</p>
                        </td>
            
                        <td className="px-6 py-4 max-w-xs">
                          <div className="bg-[#F1F5F9] text-[#475569] text-[12px] px-3 py-2 rounded-md border border-[#E2E8F0] mb-2">
                            "{complaint.location_text}"
                          </div>
                          
                          {complaint.latitude && complaint.longitude && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${complaint.latitude},${complaint.longitude}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-[11px] font-bold text-[#0041C7] hover:text-[#0033A0] hover:underline"
                            >
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View on Google Maps
                            </a>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 w-64">
                          <select 
                            value={selectedAssignments[complaint.complaint_id] || ""} 
                            onChange={(e) => handleDropdownChange(complaint.complaint_id, e.target.value)}
                            className="w-full px-3 py-2 text-[13px] text-[#1E293B] bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0041C7]"
                          >
                            <option value="" disabled>Select Authority...</option>
                            {authorities.map(auth => (
                              <option key={auth.authority_id} value={auth.authority_id}>
                                {auth.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleAssign(complaint.complaint_id)}
                            disabled={assigningId === complaint.complaint_id}
                            className={`px-4 py-2 text-[12px] font-bold rounded-lg transition-colors ${
                              assigningId === complaint.complaint_id 
                                ? 'bg-[#94A3B8] text-white cursor-not-allowed' 
                                : 'bg-[#0041C7] hover:bg-[#0033A0] text-white shadow-sm'
                            }`}
                          >
                            {assigningId === complaint.complaint_id ? 'Saving...' : 'Assign'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-auto">
            <Footer />
          </div>

        </main>
      </div>
    </div>
  );
}