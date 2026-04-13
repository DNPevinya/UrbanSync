import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar({ role = 'admin' }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // NEW: State to hold the user's real info
  const [userInfo, setUserInfo] = useState({ fullName: '', authorityName: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('urbanSyncUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUserInfo({
        fullName: parsed.fullName || (role === 'admin' ? 'Admin User' : 'Field Officer'),
        authorityName: parsed.authorityName || 'UrbanSync Portal'
      });
    }
  }, [role]);

  const menuItems = [
  {
    title: 'Dashboard',
    path: role === 'officer' ? '/officer/dashboard' : '/admin/dashboard', 
    allowedRoles: ['admin', 'officer'],
    icon: <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
  },
    {
      title: 'Complaints',
      path: role === 'officer' ? '/officer/complaints' : '/admin/complaints', 
      allowedRoles: ['admin', 'officer'],
      icon: <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    {
      title: 'Authority Management',
      path: '/authorities',
      allowedRoles: ['admin'],
      icon: <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    },
    {
      title: 'User Management',
      path: '/users',
      allowedRoles: ['admin'],
      icon: <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    },
    {
      title: 'Analytical Reports',
      path: '/analytics',
      allowedRoles: ['admin'],
      icon: <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    {
      title: 'Settings',
      path: role === 'officer' ? '/officer/settings' : '/settings', 
      allowedRoles: ['admin', 'officer'],
      icon: <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    }
  ];

  const visibleMenu = menuItems.filter(item => item.allowedRoles.includes(role));

  return (
    <aside className="w-64 bg-[#0F172A] text-white h-screen flex flex-col flex-shrink-0">
      
      <div className="h-[72px] flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-[#0041C7] rounded text-white flex items-center justify-center mr-3">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.35 1.155 1 1 0 01-.15.3l-2 3.5a1 1 0 001.272 1.48L5.75 14.24a.999.999 0 011.155.3 1 1 0 01.3.15l3.5 2a1 1 0 001.48-1.272l-.723-1.277a.999.999 0 01.3-1.155 1 1 0 01.15-.3l3.5-2a1 1 0 00-.272-1.742l-3.5-2a.999.999 0 01-1.155-.3 1 1 0 01-.3-.15l-3.5-2zM4 9a1 1 0 00-1 1v3a1 1 0 102 0V10a1 1 0 00-1-1zm3 1a1 1 0 112 0v3a1 1 0 11-2 0v-3zm5-1a1 1 0 00-1 1v3a1 1 0 102 0V10a1 1 0 00-1-1z" /></svg>
        </div>
        <h1 className="text-xl font-bold tracking-wide">UrbanSync</h1>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {visibleMenu.map((item, index) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-[13px] font-bold transition-colors ${
                isActive 
                  ? 'bg-[#0041C7] text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.title}
            </button>
          );
        })}
      </nav>

      {/* DYNAMIC USER PROFILE FOOTER */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#F59E0B] flex items-center justify-center text-white font-bold text-[14px] uppercase flex-shrink-0">
            {userInfo.fullName 
  ? userInfo.fullName.split(' ').map(name => name[0]).join('').substring(0, 2) 
  : (role === 'admin' ? 'AU' : 'OF')
}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-[13px] font-bold text-white truncate">
              {userInfo.fullName}
            </p>
            <p className="text-[10px] text-slate-400 truncate" title={userInfo.authorityName}>
              {role === 'officer' ? userInfo.authorityName : 'System Admin'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}