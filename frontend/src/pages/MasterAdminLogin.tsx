import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api/xm7k9p2v4q8n';

export default function MasterAdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('masterAdminToken', data.token);
        navigate('/xm7k9p2v4q8n/dashboard');
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A2540] flex items-center justify-center p-4">
      <div className="bg-[#0D2E4D] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-[#1E4A6D]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">MASTER ADMIN</h1>
          <p className="text-gray-400 text-sm mt-1">Acceso Restringido</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              placeholder="Ingrese usuario"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0A2540] border border-[#1E4A6D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              placeholder="Ingrese contraseña"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Este acceso es exclusivo para administradores del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
