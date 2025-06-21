import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Package, Tag, ShoppingCart, Users } from 'lucide-react';

interface Promotion {
  id: number;
  is_active: boolean;
}

const AnalyticsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    // We only need basic info for the count
    const fetchPromotions = async () => {
      const { data, error } = await supabase.from('promotions').select('id, is_active');
      if (!error && data) {
        setPromotions(data);
      }
    };
    fetchPromotions();
  }, []);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Total Produk</p>
            <p className="text-3xl font-bold text-slate-900">156</p> {/* This is static for now */}
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Promosi Aktif</p>
            <p className="text-3xl font-bold text-slate-900">{promotions.filter(p => p.is_active).length}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-lg">
            <Tag className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Penjualan Hari Ini</p>
            <p className="text-3xl font-bold text-slate-900">24</p> {/* This is static for now */}
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Pelanggan Aktif</p>
            <p className="text-3xl font-bold text-slate-900">89</p> {/* This is static for now */}
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 