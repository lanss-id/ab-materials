import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { Package, Tag, BarChart3, Gift, LogOut } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  const navLinks = [
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/kelola-produk', label: 'Kelola Produk', icon: Package },
    { to: '/admin/kelola-promosi', label: 'Kelola Promosi', icon: Tag },
    { to: '/admin/kelola-diskon-bertingkat', label: 'Diskon Checkout', icon: Gift },
    { to: '/admin/kelola-kode-promo', label: 'Kelola Kode Promo', icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/admin" className="flex items-center space-x-3">
              <img src="/logo.jpeg" alt="AB Material Logo" className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Admin Panel</h1>
                <p className="text-xs text-slate-500">AB Material Management System</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Online
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-slate-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
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
        {children}
      </div>
    </div>
  );
};

export default AdminLayout; 