import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Loader2, PlusCircle, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface PromoCode {
  id: number;
  code: string;
  discount_percent: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const emptyForm: Partial<PromoCode> = {
  code: '',
  discount_percent: 0,
  start_date: '',
  end_date: '',
  is_active: true,
};

const KelolaKodePromoPage: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<PromoCode>>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setPromoCodes(data || []);
    setLoading(false);
  };

  const handleOpenModal = (promo?: PromoCode) => {
    if (promo) {
      setForm({ ...promo });
      setEditingId(promo.id);
    } else {
      setForm(emptyForm);
      setEditingId(null);
    }
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? target.checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    if (!form.code || !form.discount_percent || !form.start_date || !form.end_date) {
      setError('Semua field wajib diisi.');
      setIsSaving(false);
      return;
    }
    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('promo_codes')
          .update({
            code: form.code,
            discount_percent: form.discount_percent,
            start_date: form.start_date,
            end_date: form.end_date,
            is_active: form.is_active,
          })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Kode promo berhasil diperbarui.');
      } else {
        // Insert
        const { error } = await supabase
          .from('promo_codes')
          .insert([
            {
              code: form.code,
              discount_percent: form.discount_percent,
              start_date: form.start_date,
              end_date: form.end_date,
              is_active: form.is_active,
            },
          ]);
        if (error) throw error;
        toast.success('Kode promo berhasil ditambahkan.');
      }
      fetchPromoCodes();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (promo: PromoCode) => {
    handleOpenModal(promo);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    toast.promise(
      (async () => {
        const { error } = await supabase.from('promo_codes').delete().eq('id', id);
        if (error) throw error;
        await fetchPromoCodes();
        return 'Kode promo berhasil dihapus.';
      })(),
      {
        loading: 'Menghapus kode promo...',
        success: (msg) => msg,
        error: (err) => 'Gagal menghapus: ' + err.message,
      }
    );
    setDeletingId(null);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Kelola Kode Promo</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Daftar Kode Promo</h2>
          <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors">
            <PlusCircle className="w-5 h-5" />
            <span>Tambah Kode Promo</span>
          </button>
        </div>
        <p className="text-slate-600 mb-6">Atur kode promo yang dapat digunakan pelanggan saat checkout. Anda dapat menonaktifkan kode tanpa menghapusnya.</p>
        {loading ? (
          <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b-2 border-slate-200 bg-slate-50">
                <tr>
                  <th className="p-4 text-sm font-semibold text-slate-600">Kode</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Diskon (%)</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Periode</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="p-4 text-sm font-semibold text-slate-600 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.map(promo => (
                  <tr key={promo.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{promo.code}</td>
                    <td className="p-4 text-blue-700 font-bold">{promo.discount_percent}%</td>
                    <td className="p-4 text-slate-600">{promo.start_date} s/d {promo.end_date}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${promo.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{promo.is_active ? 'Aktif' : 'Nonaktif'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleEdit(promo)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full" disabled={deletingId === promo.id}><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {promoCodes.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">Belum ada kode promo</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold">{editingId ? 'Edit Kode Promo' : 'Tambah Kode Promo'}</h3>
                <button type="button" onClick={handleCloseModal} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kode Promo</label>
                  <input name="code" value={form.code || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Diskon (%)</label>
                  <input name="discount_percent" type="number" value={form.discount_percent || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" required min={1} max={100} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                    <input name="start_date" type="date" value={form.start_date || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Akhir</label>
                    <input name="end_date" type="date" value={form.end_date || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" required />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <input name="is_active" type="checkbox" checked={form.is_active ?? true} onChange={handleChange} />
                  <label className="text-sm font-medium text-slate-700">Aktif</label>
                </div>
                {error && <div className="text-red-500 text-sm pt-2">{error}</div>}
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

export default KelolaKodePromoPage; 