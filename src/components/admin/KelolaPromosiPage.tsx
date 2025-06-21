import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Tag, Plus, Save, X, Edit, Trash2, Loader2, ShoppingBag, Store } from 'lucide-react';
import Select from 'react-select';

// Tipe ini harus cocok dengan skema tabel 'promotions' di Supabase
interface Promotion {
  id: number;
  created_at: string;
  title: string;
  subtitle: string | null;
  discount_percent: number;
  end_date: string;
  cta_text: string;
  is_active: boolean;
  gimmick_type: 'pulse' | 'glow' | 'shake' | 'countdown' | null;
  type: 'sitewide' | 'product_specific'; // Kolom baru
}

// Tipe untuk data produk dari Supabase
interface Product {
    id: number;
    name: string;
    price: number;
    brand_id: number;
    brand_name: string;
}

// Tipe untuk react-select
interface ProductOption {
    value: number;
    label: string;
}

interface Brand {
    id: number;
    name: string;
}

interface KelolaPromosiPageProps {
  refreshData: () => void;
}

const KelolaPromosiPage: React.FC<KelolaPromosiPageProps> = ({ refreshData }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Partial<Promotion> & { selected_products?: ProductOption[] } | null>(null);

  const emptyForm: Partial<Promotion> & { selected_products?: ProductOption[] } = {
    title: '',
    subtitle: '',
    discount_percent: 10,
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cta_text: 'Lihat Penawaran',
    is_active: true,
    gimmick_type: 'glow',
    type: 'sitewide',
    selected_products: []
  };

  const [formState, setFormState] = useState(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchPromotions(), fetchProductsAndBrands()]);
      setLoading(false);
  }

  const fetchProductsAndBrands = async () => {
    const { data: productsData, error: productsError } = await supabase.from('products').select('id, name, price, brand_id');
    const { data: brandsData, error: brandsError } = await supabase.from('brands').select('id, name');

    if (productsError || brandsError) {
        console.error('Error fetching data:', productsError || brandsError);
        alert('Gagal mengambil data produk atau brand.');
        return;
    }
    
    if (brandsData) setBrands(brandsData);
    if (productsData && brandsData) {
        const brandMap = new Map(brandsData.map(b => [b.id, b.name]));
        const formattedProducts = productsData.map(p => ({
            ...p,
            brand_name: brandMap.get(p.brand_id) || 'Unknown Brand'
        }));
        setProducts(formattedProducts);
    }
  };

  const fetchPromotions = async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching promotions:', error);
      alert('Gagal mengambil data promosi.');
    } else if (data) {
      setPromotions(data);
    }
  };
  
  const handleOpenModal = async (promo: Promotion | null = null) => {
    if (promo) {
      let selected_products: ProductOption[] = [];
      if (promo.type === 'product_specific') {
        // Ambil produk yang terhubung dengan promosi ini
        const { data: promoProducts, error } = await supabase
          .from('promotion_products')
          .select('product_id')
          .eq('promotion_id', promo.id);

        if (error) {
            console.error('Error fetching promotion products', error);
        } else {
            const productIds = promoProducts.map(p => p.product_id);
            selected_products = products
                .filter(p => productIds.includes(p.id))
                .map(p => ({ value: p.id, label: `${p.name} - ${p.brand_name}` }));
        }
      }
      setEditingPromotion(promo);
      setFormState({
        ...promo,
        end_date: new Date(promo.end_date).toISOString().split('T')[0],
        selected_products
      });
    } else {
      setEditingPromotion(null);
      setFormState(emptyForm);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPromotion(null);
    setFormState(emptyForm);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    if (type === 'checkbox') {
        processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
        processedValue = parseInt(value, 10);
    }

    setFormState(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleProductSelectionChange = (selectedOptions: any) => {
    setFormState(prev => ({ ...prev, selected_products: selectedOptions || [] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formState.type === 'product_specific' && (!formState.selected_products || formState.selected_products.length === 0)) {
        alert('Untuk promosi produk spesifik, silakan pilih setidaknya satu produk.');
        return;
    }

    setIsSaving(true);

    const { id, created_at, selected_products, ...formData } = formState;

    const submissionData = {
        ...formData,
        end_date: new Date(formState.end_date!).toISOString(),
    };

    let promotion_id = editingPromotion?.id;
    let error;

    if (editingPromotion && editingPromotion.id) {
      // Update
      const { data: updatedPromo, error: updateError } = await supabase
        .from('promotions')
        .update(submissionData)
        .eq('id', editingPromotion.id)
        .select()
        .single();
      error = updateError;
      if (updatedPromo) promotion_id = updatedPromo.id;
    } else {
      // Insert
      const { data: insertedPromo, error: insertError } = await supabase
        .from('promotions')
        .insert([submissionData])
        .select()
        .single();
      error = insertError;
      if (insertedPromo) promotion_id = insertedPromo.id;
    }
    
    if (error) {
        console.error('Error saving promotion:', error);
        alert('Gagal menyimpan promosi: ' + error.message);
        setIsSaving(false);
        return;
    }

    if (promotion_id && formState.type === 'product_specific') {
        // Hapus relasi lama
        const { error: deleteError } = await supabase
            .from('promotion_products')
            .delete()
            .eq('promotion_id', promotion_id);
        if (deleteError) {
             console.error('Error deleting old promotion products:', deleteError);
             alert('Gagal memperbarui produk promosi.');
             setIsSaving(false);
             return;
        }

        // Buat relasi baru
        const newPromoProducts = selected_products!.map(p => ({
            promotion_id,
            product_id: p.value
        }));
        const { error: insertPromoProductsError } = await supabase
            .from('promotion_products')
            .insert(newPromoProducts);
        
        if(insertPromoProductsError) {
            console.error('Error inserting new promotion products:', insertPromoProductsError);
            alert('Gagal menyimpan produk untuk promosi.');
            setIsSaving(false);
            return;
        }
    } else if (promotion_id && formState.type === 'sitewide') {
        // Hapus relasi produk jika tipe diubah dari spesifik ke sitewide
        await supabase.from('promotion_products').delete().eq('promotion_id', promotion_id);
    }

    await fetchData(); // Ambil semua data terbaru
    await refreshData();
    handleCloseModal();
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus promosi ini? Semua relasi produk terkait juga akan dihapus.')) {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus promosi: ' + error.message);
      } else {
        await fetchData();
        await refreshData();
      }
    }
  };

  const toggleActiveStatus = async (promo: Promotion) => {
    const { error } = await supabase
      .from('promotions')
      .update({ is_active: !promo.is_active })
      .eq('id', promo.id);

    if (error) {
      alert('Gagal mengubah status: ' + error.message);
    } else {
      await fetchPromotions();
      await refreshData();
    }
  }
  
  const productOptions = useMemo(() => products.map(p => ({
    value: p.id,
    label: `${p.name} - ${p.brand_name}`
  })), [products]);

  return (
    <>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Promosi</h2>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Promosi</span>
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Judul</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Diskon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal Berakhir</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {promotions.map((promo) => (
                  <tr key={promo.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{promo.title}</div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">{promo.subtitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        promo.type === 'sitewide' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {promo.type === 'sitewide' ? 'Seluruh Toko' : 'Produk Spesifik'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{promo.discount_percent}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{new Date(promo.end_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={promo.is_active} onChange={() => toggleActiveStatus(promo)} />
                          <div className={`block w-10 h-6 rounded-full ${promo.is_active ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${promo.is_active ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-slate-700">{promo.is_active ? 'Aktif' : 'Nonaktif'}</span>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(promo)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                      <button onClick={() => handleDelete(promo.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingPromotion ? 'Edit Promosi' : 'Tambah Promosi'}</h3>
              <button onClick={handleCloseModal} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Promosi</label>
                <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="type" value="sitewide" checked={formState.type === 'sitewide'} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                        <span className="text-sm font-medium text-slate-700">Seluruh Toko</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="type" value="product_specific" checked={formState.type === 'product_specific'} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                        <span className="text-sm font-medium text-slate-700">Produk Spesifik</span>
                    </label>
                </div>
              </div>

              {formState.type === 'product_specific' && (
                <div>
                  <label htmlFor="products" className="block text-sm font-medium text-slate-700 mb-1">Pilih Produk</label>
                   <Select
                        id="products"
                        isMulti
                        options={productOptions}
                        value={formState.selected_products}
                        onChange={handleProductSelectionChange}
                        placeholder="Cari dan pilih produk..."
                        classNamePrefix="react-select"
                        isLoading={loading}
                    />
                </div>
              )}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Judul Promosi</label>
                <input id="title" name="title" type="text" required value={formState.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-slate-700 mb-1">Subtitle (Deskripsi Singkat)</label>
                <textarea id="subtitle" name="subtitle" rows={3} value={formState.subtitle || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discount_percent" className="block text-sm font-medium text-slate-700 mb-1">Diskon (%)</label>
                  <input id="discount_percent" name="discount_percent" type="number" required value={formState.discount_percent} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-slate-700 mb-1">Tanggal Berakhir</label>
                  <input id="end_date" name="end_date" type="date" required value={formState.end_date} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cta_text" className="block text-sm font-medium text-slate-700 mb-1">Teks Tombol (CTA)</label>
                    <input id="cta_text" name="cta_text" type="text" required value={formState.cta_text} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="gimmick_type" className="block text-sm font-medium text-slate-700 mb-1">Efek Visual</label>
                    <select id="gimmick_type" name="gimmick_type" value={formState.gimmick_type || 'glow'} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                      <option value="glow">Glow</option>
                      <option value="pulse">Pulse</option>
                      <option value="shake">Shake</option>
                      <option value="countdown">Countdown</option>
                    </select>
                  </div>
              </div>
               <div className="flex items-center">
                    <input id="is_active" name="is_active" type="checkbox" checked={formState.is_active || false} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-slate-900">Aktifkan promosi ini</label>
                </div>
              <div className="pt-4 border-t mt-6 flex justify-end space-x-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Batal</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default KelolaPromosiPage; 