import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Loader2, ToggleLeft, ToggleRight, AlertTriangle, Save, PlusCircle, Trash2, X, Edit } from 'lucide-react';
import { Toaster, toast } from 'sonner';

// Tipe data sesuai skema tabel
interface TieredDiscount {
  id: number;
  min_spend: number;
  max_spend: number | null;
  discount_percent: number;
  free_shipping: boolean;
  description: string | null;
  is_active: boolean;
}

// Tipe untuk state form, memungkinkan nilai kosong untuk input
type TierFormState = Omit<TieredDiscount, 'id' | 'max_spend'> & {
    id?: number;
    max_spend: string; // Gunakan string untuk input agar bisa kosong
};

const KelolaDiskonBertingkatPage: React.FC = () => {
  const [discounts, setDiscounts] = useState<TieredDiscount[]>([]);
  const [isFeatureActive, setIsFeatureActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const emptyForm: TierFormState = {
    min_spend: 0,
    max_spend: '',
    discount_percent: 0,
    free_shipping: false,
    description: '',
    is_active: true,
  };
  const [editingTier, setEditingTier] = useState<TierFormState>(emptyForm);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Ambil status saklar utama
      const { data: settingData, error: settingError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'tiered_discount_active')
        .single();
      
      if (settingError && settingError.code !== 'PGRST116') throw settingError;
      if (settingData) {
        setIsFeatureActive((settingData.value as any)?.enabled ?? true);
      }

      // Ambil semua tingkatan diskon
      const { data: discountData, error: discountError } = await supabase
        .from('tiered_discounts')
        .select('*')
        .order('min_spend', { ascending: true });
        
      if (discountError) throw discountError;
      if (discountData) {
        setDiscounts(discountData);
      }

    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Gagal memuat pengaturan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = async () => {
    const newStatus = !isFeatureActive;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'tiered_discount_active', value: { enabled: newStatus } });
      
      if (error) throw error;
      
      setIsFeatureActive(newStatus);
      if (newStatus) {
        toast.success('Sistem diskon berjenjang telah diaktifkan.');
      } else {
        toast('Sistem diskon berjenjang telah dinonaktifkan.');
      }
    } catch (error: any) {
      toast.error('Gagal mengubah status: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTierToggle = async (tier: TieredDiscount) => {
    const newStatus = !tier.is_active;
    try {
      const { error } = await supabase
        .from('tiered_discounts')
        .update({ is_active: newStatus })
        .eq('id', tier.id);

      if (error) throw error;
      
      // Perbarui state secara lokal untuk responsivitas UI
      setDiscounts(discounts.map(d => d.id === tier.id ? { ...d, is_active: newStatus } : d));
      toast.success('Status tingkatan diskon berhasil diperbarui.');
    } catch (error: any) {
      toast.error('Gagal mengubah status tingkatan: ' + error.message);
    }
  };
  
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '∞';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };
  
  const handleOpenModal = (tier: TieredDiscount | null) => {
    if (tier) {
        setEditingTier({
            ...tier,
            max_spend: tier.max_spend === null ? '' : String(tier.max_spend)
        });
    } else {
        setEditingTier(emptyForm);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTier(emptyForm);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setEditingTier(prev => ({
        ...prev,
        [name]: isCheckbox ? checked : value
    }));
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { id, ...formData } = editingTier;

    const dataToSave = {
        ...formData,
        max_spend: formData.max_spend === '' ? null : Number(formData.max_spend),
        min_spend: Number(formData.min_spend),
        discount_percent: Number(formData.discount_percent),
    };

    try {
        let error;
        if (id) {
            // Update
            const { error: updateError } = await supabase.from('tiered_discounts').update(dataToSave).eq('id', id);
            error = updateError;
        } else {
            // Insert
            const { error: insertError } = await supabase.from('tiered_discounts').insert([dataToSave]);
            error = insertError;
        }
        if (error) throw error;
        
        toast.success(`Tingkatan diskon berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`);
        fetchSettings(); // Refresh data
        handleCloseModal();
    } catch (error: any) {
        toast.error('Gagal menyimpan: ' + error.message);
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteTier = async (tierId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tingkatan diskon ini?')) {
        try {
            const { error } = await supabase.from('tiered_discounts').delete().eq('id', tierId);
            if (error) throw error;
            toast.success('Tingkatan diskon berhasil dihapus.');
            fetchSettings(); // Refresh data
        } catch (error: any) {
            toast.error('Gagal menghapus: ' + error.message);
        }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="p-6 bg-slate-50 min-h-full">
        <Toaster position="top-right" richColors />
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Kelola Diskon Checkout</h1>

        {/* Saklar Utama */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Status Sistem Diskon</h2>
            <p className="text-slate-600 mb-4">Aktifkan atau nonaktifkan seluruh sistem diskon berjenjang di halaman checkout.</p>
            <div className="flex items-center space-x-4">
                <button
                    onClick={handleFeatureToggle}
                    disabled={isSaving}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${isFeatureActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
                >
                    {isFeatureActive ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                    <span>{isFeatureActive ? 'Aktif' : 'Nonaktif'}</span>
                </button>
                {isSaving && <Loader2 className="h-5 w-5 animate-spin"/>}
            </div>
            {!isFeatureActive && (
                <div className="mt-4 flex items-center space-x-2 bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-200">
                    <AlertTriangle className="h-5 w-5"/>
                    <p>Saat nonaktif, tidak ada diskon atau gratis ongkir yang akan diterapkan pada checkout, terlepas dari pengaturan di bawah.</p>
                </div>
            )}
        </div>
        
        {/* Tabel Tingkatan Diskon */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold text-slate-800">Tingkatan Diskon</h2>
             <button onClick={() => handleOpenModal(null)} className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors">
                <PlusCircle className="w-5 h-5" />
                <span>Tambah Tingkatan</span>
             </button>
          </div>
           <p className="text-slate-600 mb-6">Atur setiap tingkatan diskon. Anda dapat menonaktifkan tingkatan tertentu tanpa menghapusnya.</p>

           <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b-2 border-slate-200 bg-slate-50">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-slate-600">Total Belanja (Min)</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Total Belanja (Maks)</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Benefit</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Deskripsi</th>
                            <th className="p-4 text-sm font-semibold text-slate-600 text-center">Status</th>
                            <th className="p-4 text-sm font-semibold text-slate-600 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {discounts.map(tier => (
                            <tr key={tier.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="p-4 font-medium text-slate-800">{formatCurrency(tier.min_spend)}</td>
                                <td className="p-4 font-medium text-slate-800">{formatCurrency(tier.max_spend)}</td>
                                <td className="p-4 text-slate-600">
                                    {tier.free_shipping ? (
                                        <span className="font-semibold text-green-600">Gratis Ongkir</span>
                                    ) : (
                                        <span className="font-semibold text-blue-600">{tier.discount_percent}% Diskon</span>
                                    )}
                                </td>
                                <td className="p-4 text-slate-600">{tier.description}</td>
                                <td className="p-4 text-center">
                                    <button onClick={() => handleTierToggle(tier)} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${tier.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                        {tier.is_active ? 'Aktif' : 'Nonaktif'}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center space-x-2">
                                      <button onClick={() => handleOpenModal(tier)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit className="w-4 h-4" /></button>
                                      <button onClick={() => handleDeleteTier(tier.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
           </div>
        </div>

        {/* Modal untuk Tambah/Edit Tier */}
        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full">
                    <form onSubmit={handleSaveTier}>
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold">{editingTier.id ? 'Edit Tingkatan Diskon' : 'Tambah Tingkatan Diskon'}</h3>
                            <button type="button" onClick={handleCloseModal} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="min_spend" className="block text-sm font-medium text-slate-700 mb-1">Total Belanja Min.</label>
                                    <input id="min_spend" name="min_spend" type="number" required value={editingTier.min_spend} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                                </div>
                                <div>
                                    <label htmlFor="max_spend" className="block text-sm font-medium text-slate-700 mb-1">Total Belanja Maks.</label>
                                    <input id="max_spend" name="max_spend" type="number" placeholder="Kosongkan untuk ∞" value={editingTier.max_spend} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                                <input id="description" name="description" type="text" placeholder="Cth: Gratis Ongkir" value={editingTier.description || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                            </div>
                             <div className="grid grid-cols-2 gap-4 items-center">
                                <div>
                                    <label htmlFor="discount_percent" className="block text-sm font-medium text-slate-700 mb-1">Diskon (%)</label>
                                    <input id="discount_percent" name="discount_percent" type="number" value={editingTier.discount_percent} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                                </div>
                                <div className="pt-6">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input id="free_shipping" name="free_shipping" type="checkbox" checked={editingTier.free_shipping} onChange={handleInputChange} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm font-medium text-slate-700">Berikan Gratis Ongkir</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3">
                            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold hover:bg-slate-50">
                                Batal
                            </button>
                            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default KelolaDiskonBertingkatPage; 