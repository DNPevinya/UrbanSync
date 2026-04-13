import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

// CHART.JS IMPORTS
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/complaints/admin/analytics');
        const result = await response.json();
        if (result.success) {
          setAnalytics(result.data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // --- NATIVE CSV EXPORT FUNCTION ---
  const exportToCSV = () => {
    if (!analytics || analytics.authorities.length === 0) return;
    
    const headers = "Authority Name,Total Tickets Handled,Resolved Tickets,Resolution Rate (%)\n";
    const rows = analytics.authorities.map(a => 
      `"${a.authority_name}",${a.total_handled},${a.resolved_count},${a.rate}%`
    ).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "UrbanSync_Authority_Performance.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const maxDistrictCount = analytics?.districts?.length > 0 
    ? Math.max(...analytics.districts.map(d => d.count)) 
    : 1;

  // --- CHART.JS CONFIGURATION ---
  const chartData = {
    labels: analytics?.trends?.map(t => t.month_name) || [],
    datasets: [
      {
        label: 'Received',
        data: analytics?.trends?.map(t => t.received) || [],
        backgroundColor: '#0041C7', // Dark Blue
        borderRadius: 4,
      },
      {
        label: 'Resolved',
        data: analytics?.trends?.map(t => t.resolved) || [],
        backgroundColor: '#93C5FD', // Light Blue
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
      x: { grid: { display: false } }
    },
    plugins: {
      legend: { display: false } // We use our own custom HTML legend above the chart
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header breadcrumbs={['Admin', 'Reports & Analytics']} />

        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#1E293B]">Statistical Insights</h2>
              <p className="text-[13px] text-[#64748B] mt-1">Real-time national performance data.</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={exportToCSV}
                className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#1E293B] text-[13px] font-bold rounded-lg shadow-sm hover:bg-[#F8FAFC] transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export CSV
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[#64748B] font-bold">Calculating national statistics...</div>
          ) : !analytics ? (
            <div className="flex-1 flex items-center justify-center text-red-500 font-bold">Failed to load data.</div>
          ) : (
            <>
              {/* TINTED KPI CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {/* BLUE CARD */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm relative">
                   <div className="w-8 h-8 rounded bg-blue-100 text-[#0041C7] flex items-center justify-center mb-3">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <p className="text-[11px] font-bold text-[#0041C7] mb-1">Avg. Resolution Time</p>
                   <h3 className="text-2xl font-extrabold text-blue-900">{analytics.kpis.avgResolution} {analytics.kpis.avgResolution !== "N/A" && "Days"}</h3>
                </div>

                {/* GREEN CARD */}
                <div className="bg-green-50 p-5 rounded-xl border border-green-100 shadow-sm relative">
                   <div className="w-8 h-8 rounded bg-green-100 text-green-700 flex items-center justify-center mb-3">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <p className="text-[11px] font-bold text-green-700 mb-1">National Completion Rate</p>
                   <h3 className="text-2xl font-extrabold text-green-900">{analytics.kpis.completionRate}%</h3>
                </div>

                {/* ORANGE CARD */}
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 shadow-sm relative">
                   <div className="w-8 h-8 rounded bg-orange-100 text-[#F59E0B] flex items-center justify-center mb-3">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                   </div>
                   <p className="text-[11px] font-bold text-[#F59E0B] mb-1">Active / Pending</p>
                   <h3 className="text-2xl font-extrabold text-orange-900">{analytics.kpis.active}</h3>
                </div>

                {/* PURPLE CARD */}
                <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 shadow-sm relative">
                   <div className="w-8 h-8 rounded bg-purple-100 text-[#8B5CF6] flex items-center justify-center mb-3">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <p className="text-[11px] font-bold text-[#8B5CF6] mb-1">Citizen Satisfaction</p>
                   <h3 className="text-2xl font-extrabold text-purple-900">{analytics.kpis.satisfaction}</h3>
                </div>
              </div>

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* CHART.JS: Volume Trends */}
                <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-[14px] font-bold text-[#1E293B]">Complaint Volume Trends</h3>
                      <p className="text-[11px] text-[#64748B] mt-0.5">Last 6 months received vs resolved</p>
                    </div>
                    <div className="flex items-center space-x-3 text-[10px] font-bold text-[#64748B]">
                      <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-[#0041C7] mr-1.5"></span> Received</span>
                      <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-[#93C5FD] mr-1.5"></span> Resolved</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full min-h-[250px]">
                    {analytics.trends?.length > 0 ? (
                      <Bar data={chartData} options={chartOptions} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#64748B] text-[12px] italic">Not enough historical data yet.</div>
                    )}
                  </div>
                </div>

                {/* LIVE Complaints by District */}
                <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[14px] font-bold text-[#1E293B]">Complaints by Region</h3>
                  </div>

                  <div className="space-y-5">
                    {analytics.districts.length > 0 ? analytics.districts.map((dist, idx) => {
                      const percent = Math.max(5, (dist.count / maxDistrictCount) * 100);
                      return (
                        <div key={idx} className="w-full">
                          <div className="flex justify-between text-[11px] font-bold text-[#1E293B] mb-1.5">
                            <span>{dist.district}</span>
                            <span>{dist.count}</span>
                          </div>
                          <div className="w-full bg-[#F8FAFC] rounded-full h-2">
                            <div 
                              className="bg-[#0041C7] h-2 rounded-full transition-all duration-1000" 
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    }) : (
                      <p className="text-[12px] text-[#64748B] italic">No regional data available yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* LIVE TABLE SECTION (Status Column Removed) */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col shadow-sm mb-8">
                <div className="px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center">
                  <h3 className="text-[14px] font-bold text-[#1E293B]">Authority Performance Milestones</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                        <th className="px-6 py-3 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Authority</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-center">Tickets Handled</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Performance Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {analytics.authorities.length > 0 ? analytics.authorities.map((auth, idx) => {
                        let barColor = 'bg-[#16A34A]'; 
                        let textColor = 'text-[#16A34A]';
                        
                        if (auth.rate < 80 && auth.rate >= 50) {
                          barColor = 'bg-[#0041C7]'; textColor = 'text-[#0041C7]'; 
                        } else if (auth.rate < 50) {
                          barColor = 'bg-[#F59E0B]'; textColor = 'text-[#F59E0B]'; 
                        }

                        return (
                          <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="px-6 py-4 text-[13px] font-bold text-[#1E293B]">{auth.authority_name}</td>
                            <td className="px-6 py-4 text-[13px] text-[#64748B] text-center font-semibold">{auth.total_handled}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-48 bg-[#F8FAFC] rounded-full h-2 mr-3 border border-[#E2E8F0]">
                                  <div className={`${barColor} h-2 rounded-full transition-all duration-1000`} style={{ width: `${Math.max(2, auth.rate)}%` }}></div>
                                </div>
                                <span className={`text-[12px] font-bold ${textColor}`}>{auth.rate}% Resolved</span>
                              </div>
                            </td>
                          </tr>
                        )
                      }) : (
                        <tr><td colSpan="3" className="px-6 py-8 text-center text-[13px] text-[#64748B]">No performance data recorded yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          
          <Footer />

        </main>
      </div>
    </div>
  );
}