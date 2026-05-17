import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BASE_URL } from '../config';

export default function LocationManager() {
  const [district, setDistrict] = useState('');
  const [division, setDivision] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!district.trim() || !division.trim()) {
      setMessage({ type: 'error', text: 'Please provide both District and Division.' });
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('urbanSyncToken');
      const res = await fetch(`${BASE_URL}/api/admin/locations`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ district, division }),
      });
      const result = await res.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: `Successfully mapped ${division} within ${district} district!` });
        setDistrict('');
        setDivision('');
      } else {
        setMessage({ type: 'error', text: "Failed to add location mapping." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Server error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header breadcrumbs={['Admin', 'Districts & Divisions']} />

        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-extrabold text-[#1E293B]">Districts & Divisions</h2>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl flex-1 flex flex-col shadow-sm p-8">
            
            <div className="max-w-xl">
              <h3 className="text-lg font-bold text-[#1E293B] mb-6 border-b border-[#E2E8F0] pb-3">Add Geographic Region</h3>
              
              {message.text && (
                <div className={`p-4 mb-6 rounded-lg text-[13px] font-bold flex items-center ${message.type === 'success' ? 'bg-[#E8F8EE] text-[#28C76F] border border-[#28C76F]/20' : 'bg-red-50 text-[#EF4444] border border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleAddLocation} className="space-y-6">
                <div>
                  <label className="block text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2">District Name</label>
                  <input 
                    type="text" 
                    value={district} 
                    onChange={(e) => setDistrict(e.target.value)} 
                    placeholder="e.g., Colombo"
                    className="block w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-[13px] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0041C7] text-[#1E293B]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Division / City Name</label>
                  <input 
                    type="text" 
                    value={division} 
                    onChange={(e) => setDivision(e.target.value)} 
                    placeholder="e.g., Homagama"
                    className="block w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-[13px] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0041C7] text-[#1E293B]"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-3 bg-[#0041C7] hover:bg-[#0033A0] text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center w-full sm:w-auto"
                  >
                    {loading ? 'Processing...' : 'Add Region'}
                  </button>
                </div>
              </form>
            </div>

          </div>
          
          <Footer />

        </main>
      </div>
    </div>
  );
}