import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ title, breadcrumbs }) {
  const navigate = useNavigate();

  return (
    <header className="h-[72px] bg-[#FFFFFF] border-b border-[#E2E8F0] flex items-center justify-between px-8 flex-shrink-0">
      
      <div className="flex items-center text-[13px]">
        {breadcrumbs ? (
          breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span className={index === breadcrumbs.length - 1 ? "font-bold text-[#1E293B]" : "text-[#64748B]"}>
                {crumb}
              </span>
              {index < breadcrumbs.length - 1 && <span className="mx-2 text-[#64748B]">&gt;</span>}
            </React.Fragment>
          ))
        ) : (
          <h2 className="text-lg font-bold text-[#1E293B]">{title}</h2>
        )}
      </div>
      
      <div className="flex items-center space-x-6">
        

        <button onClick={() => navigate('/login')} className="flex items-center text-[13px] font-semibold text-[#1E293B] hover:text-[#0041C7] transition-colors border-l border-[#E2E8F0] pl-6">
          Sign Out
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}