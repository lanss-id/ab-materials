import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Package, 
  DollarSign, 
  Tag, 
  Plus, 
  Save, 
  X,
  Edit,
  Trash2,
  Search,
  Filter,
  BarChart3,
  Users,
  ShoppingCart
} from 'lucide-react';
import NestedProductTable from './NestedProductTable';
import { supabase } from '../supabaseClient';

interface Product {
  ukuran?: string;
  jenis?: string;
  diameter_mm?: number;
  harga: number;
  aplikasi?: string;
  dimensi?: string;
  warna?: string;
  grade?: string;
}

interface Promotion {
  id: number;
  title: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetRegion: string;
  gimmickType: 'pulse' | 'glow' | 'shake' | 'countdown';
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'promotions' | 'analytics'>('products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Fetch promotions from Supabase
  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    const { data, error } = await supabase.from('promotions').select('*');
    if (!error && data) setPromotions(data);
  };

  const addPromotion = async (promo: Promotion) => {
    await supabase.from('promotions').insert([promo]);
    fetchPromotions();
  };

  const updatePromotion = async (id: number, promo: Promotion) => {
    await supabase.from('promotions').update(promo).eq('id', id);
    fetchPromotions();
  };

  const deletePromotion = async (id: number) => {
    await supabase.from('promotions').delete().eq('id', id);
    fetchPromotions();
  };

  const [productForm, setProductForm] = useState<Product>({
    ukuran: '',
    diameter_mm: 0,
    harga: 0,
    aplikasi: ''
  });

  const [promotionForm, setPromotionForm] = useState<Promotion>({
    id: 0,
    title: '',
    description: '',
    discountPercent: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    targetRegion: 'Bandung',
    gimmickType: 'pulse'
  });

  const handleEditProduct = (categoryId: number, product: Product, index: number) => {
    setEditingProduct(product);
    setProductForm(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = (categoryId: number, index: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      // Delete logic here
      console.log('Delete product:', categoryId, index);
    }
  };

  const handleAddProduct = (categoryId: number) => {
    setEditingProduct(null);
    setProductForm({
      ukuran: '',
      diameter_mm: 0,
      harga: 0,
      aplikasi: ''
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = () => {
    // Save product logic
    console.log('Save product:', productForm);
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setPromotionForm(promotion);
    setShowPromotionModal(true);
  };

  const handleDeletePromotion = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus promosi ini?')) {
      deletePromotion(id);
    }
  };

  const handleSavePromotion = () => {
    if (editingPromotion) {
      updatePromotion(editingPromotion.id, promotionForm);
    } else {
      addPromotion({ ...promotionForm, id: Date.now() });
    }
    setShowPromotionModal(false);
    setEditingPromotion(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const tabs = [
    { id: 'products', label: 'Kelola Produk', icon: Package },
    { id: 'promotions', label: 'Kelola Promosi', icon: Tag },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  // State dummy untuk admin mode
  const dummyQuantities = {};
  const dummyOnQuantityChange = () => {};

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
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Manajemen Produk</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari produk..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <NestedProductTable
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddProduct={handleAddProduct}
              isAdminMode={true}
              quantities={dummyQuantities}
              onQuantityChange={dummyOnQuantityChange}
            />
          </div>
        )}

        {/* Promotions Tab */}
        {activeTab === 'promotions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Manajemen Promosi</h2>
                <button
                  onClick={() => {
                    setEditingPromotion(null);
                    setPromotionForm({
                      id: 0,
                      title: '',
                      description: '',
                      discountPercent: 0,
                      startDate: '',
                      endDate: '',
                      isActive: true,
                      targetRegion: 'Bandung',
                      gimmickType: 'pulse'
                    });
                    setShowPromotionModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Promosi</span>
                </button>
              </div>

              <div className="grid gap-6">
                {promotions.map((promotion) => (
                  <div key={promotion.id} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-800">{promotion.title}</h3>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            promotion.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {promotion.isActive ? 'Aktif' : 'Nonaktif'}
                          </div>
                          <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                            -{promotion.discountPercent}%
                          </div>
                        </div>
                        <p className="text-slate-600 mb-4">{promotion.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-slate-700">Mulai:</span>
                            <div className="text-slate-600">{promotion.startDate}</div>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Berakhir:</span>
                            <div className="text-slate-600">{promotion.endDate}</div>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Wilayah:</span>
                            <div className="text-slate-600">{promotion.targetRegion}</div>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Efek:</span>
                            <div className="text-slate-600 capitalize">{promotion.gimmickType}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditPromotion(promotion)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePromotion(promotion.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Produk</p>
                  <p className="text-3xl font-bold text-slate-900">156</p>
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
                  <p className="text-3xl font-bold text-slate-900">{promotions.filter(p => p.isActive).length}</p>
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
                  <p className="text-3xl font-bold text-slate-900">24</p>
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
                  <p className="text-3xl font-bold text-slate-900">89</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ukuran/Jenis
                  </label>
                  <input
                    type="text"
                    value={productForm.ukuran || ''}
                    onChange={(e) => setProductForm({...productForm, ukuran: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: 8mm, D10MM Ulir"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Diameter (mm)
                  </label>
                  <input
                    type="number"
                    value={productForm.diameter_mm || ''}
                    onChange={(e) => setProductForm({...productForm, diameter_mm: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Harga (IDR)
                  </label>
                  <input
                    type="number"
                    value={productForm.harga || ''}
                    onChange={(e) => setProductForm({...productForm, harga: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Dimensi
                  </label>
                  <input
                    type="text"
                    value={productForm.dimensi || ''}
                    onChange={(e) => setProductForm({...productForm, dimensi: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="75mm x 0.70mm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Aplikasi/Kegunaan
                </label>
                <textarea
                  value={productForm.aplikasi || ''}
                  onChange={(e) => setProductForm({...productForm, aplikasi: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Deskripsi kegunaan produk..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors duration-200"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      {showPromotionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingPromotion ? 'Edit Promosi' : 'Tambah Promosi Baru'}
                </h3>
                <button
                  onClick={() => setShowPromotionModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Judul Promosi
                </label>
                <input
                  type="text"
                  value={promotionForm.title}
                  onChange={(e) => setPromotionForm({...promotionForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mega Sale Material Konstruksi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={promotionForm.description}
                  onChange={(e) => setPromotionForm({...promotionForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Deskripsi promosi..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Diskon (%)
                  </label>
                  <input
                    type="number"
                    value={promotionForm.discountPercent}
                    onChange={(e) => setPromotionForm({...promotionForm, discountPercent: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Wilayah Target
                  </label>
                  <select
                    value={promotionForm.targetRegion}
                    onChange={(e) => setPromotionForm({...promotionForm, targetRegion: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Bandung">Bandung</option>
                    <option value="Jabodetabek">Jabodetabek</option>
                    <option value="Semua">Semua Wilayah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={promotionForm.startDate}
                    onChange={(e) => setPromotionForm({...promotionForm, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    value={promotionForm.endDate}
                    onChange={(e) => setPromotionForm({...promotionForm, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Efek Visual
                  </label>
                  <select
                    value={promotionForm.gimmickType}
                    onChange={(e) => setPromotionForm({...promotionForm, gimmickType: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pulse">Pulse</option>
                    <option value="glow">Glow</option>
                    <option value="shake">Shake</option>
                    <option value="countdown">Countdown</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={promotionForm.isActive}
                    onChange={(e) => setPromotionForm({...promotionForm, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-slate-700">
                    Promosi Aktif
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPromotionModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors duration-200"
              >
                Batal
              </button>
              <button
                onClick={handleSavePromotion}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;