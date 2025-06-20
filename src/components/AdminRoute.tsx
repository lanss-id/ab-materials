import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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

  if (loading) return <div>Loading...</div>;
  return isAdmin ? <>{children}</> : null;
}
