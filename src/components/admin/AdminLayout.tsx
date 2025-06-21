import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Settings, Package, Tag, BarChart3, Gift } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const navLinks = [
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/kelola-produk', label: 'Kelola Produk', icon: Package },
    { to: '/admin/kelola-promosi', label: 'Kelola Promosi', icon: Tag },
    { to: '/admin/kelola-diskon-bertingkat', label: 'Diskon Checkout', icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-700 p-2 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Admin Panel</h1>
                <p className="text-xs text-slate-500">AB Material Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Online
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="flex border-b border-slate-200">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Page Content */}
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout; 