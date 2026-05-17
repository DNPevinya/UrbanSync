import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import UnassignedComplaints from './pages/UnassignedComplaints'; 
import AdminAuthorities from './pages/AdminAuthorities';
import AdminOfficerManagement from './pages/AdminOfficerManagement';
import CategoryManager from './pages/CategoryManager'; 
import LocationManager from './pages/LocationManager';
import AdminAnalytics from './pages/AdminAnalytics';
import UserManagement from './pages/UserManagement';

// Officer Pages
import OfficerDashboard from './pages/OfficerDashboard';
import OfficerComplaints from './pages/OfficerComplaints'; 
import OfficerComplaintDetails from './pages/OfficerComplaintDetails';

// Shared Pages
import Settings from './pages/Settings';

export default function App() {
  // 1. UI RENDER
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
        <Route path="/admin/unassigned" element={<UnassignedComplaints />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/authorities" element={<AdminAuthorities />} />
        <Route path="admin/officers" element={<AdminOfficerManagement />} />
        <Route path="/admin/categories" element={<CategoryManager />} />
        <Route path="/admin/locations" element={<LocationManager />} />
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