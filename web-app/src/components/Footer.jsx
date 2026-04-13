import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="px-8 py-6 text-[11px] font-bold text-[#94A3B8] flex flex-col md:flex-row justify-between items-center border-t border-[#E2E8F0] mt-auto">
      <p>© 2026 National Governance Digital Division. All rights reserved.</p>
      <div className="flex space-x-4 mt-4 md:mt-0">
        <Link to="/privacy-policy" className="hover:text-[#0041C7] transition-colors">Privacy Policy</Link>   
        <Link to="/terms" className="hover:text-[#0041C7] transition-colors">Terms of Conditions</Link>
      </div>
    </footer>
  );
}