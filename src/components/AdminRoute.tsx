import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Monitor, Smartphone, ArrowLeft } from 'lucide-react';
import { useDesktop } from '../utils/useDesktop';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isDesktop = useDesktop(1024);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        setLoading(false);
        return;
      }
      // Query ke table users
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
      } else {
        navigate('/');
      }
      setLoading(false);
    };
    checkRole();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  // Jika bukan desktop, tampilkan pesan error
  if (!isDesktop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="flex justify-center space-x-4 mb-6">
              <Smartphone className="w-16 h-16 text-red-500" />
              <Monitor className="w-16 h-16 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Akses Terbatas</h2>
            <p className="text-slate-600 mb-6">
              Panel Admin hanya dapat diakses melalui desktop atau layar dengan lebar minimal 1024px.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Alasan:</strong> Panel admin memerlukan ruang yang cukup untuk menampilkan tabel dan form yang kompleks dengan optimal.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    );
  }

  return isAdmin ? <>{children}</> : null;
}
