import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { AlertTriangle } from 'lucide-react';
import { useDesktop } from '../utils/useDesktop';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isDesktop = useDesktop(1024);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In Admin</h2>
        
        {/* Peringatan Desktop-Only */}
        {!isDesktop && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-800 mb-1">Peringatan</p>
                <p className="text-orange-700">
                  Panel admin hanya dapat diakses melalui desktop (minimal 1024px).
                </p>
              </div>
            </div>
          </div>
        )}

        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        
        <form onSubmit={handleSignIn} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className={`w-full py-2 rounded-lg font-semibold transition-colors ${
              isDesktop 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
            disabled={loading || !isDesktop}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="text-center text-sm mt-2">
          Belum punya akun? <a href="/signup" className="text-blue-600 hover:underline">Sign Up</a>
        </div>
      </div>
    </div>
  );
};

export default SignIn; 