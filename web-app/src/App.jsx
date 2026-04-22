import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import AdminAuthorities from './pages/AdminAuthorities';
import AdminOfficerManagement from './pages/AdminOfficerManagement';
import AdminAnalytics from './pages/AdminAnalytics';

// Officer Pages
import OfficerDashboard from './pages/OfficerDashboard';
import OfficerComplaints from './pages/OfficerComplaints'; 
import OfficerComplaintDetails from './pages/OfficerComplaintDetails';

// Shared Pages
import Settings from './pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* --- ADMIN ROUTES --- */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/complaints" element={<AdminComplaints />} />
        <Route path="/authorities" element={<AdminAuthorities />} />
        <Route path="admin/officers" element={<AdminOfficerManagement />} />
        <Route path="/analytics" element={<AdminAnalytics />} />
        <Route path="/settings" element={<Settings role="admin" />} />

        {/* --- OFFICER ROUTES --- */}
        <Route path="/officer/dashboard" element={<OfficerDashboard />} />
        <Route path="/officer/complaints" element={<OfficerComplaints />} /> 
        <Route path="/officer/complaint-details" element={<OfficerComplaintDetails />} />
        <Route path="/officer/settings" element={<Settings role="officer" />} />
        
      </Routes>
    </Router>
  );
}