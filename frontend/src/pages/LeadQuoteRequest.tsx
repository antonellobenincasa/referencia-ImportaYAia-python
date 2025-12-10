import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuoteRequest from './QuoteRequest';

export default function LeadQuoteRequest() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0A2540] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/portal" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
              <span className="text-[#0A2540] font-black text-sm">IA</span>
            </div>
            <span className="text-lg font-bold">ImportaYa<span className="text-[#00C9B7]">.ia</span></span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/portal" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al Dashboard
            </Link>
            <span className="text-sm text-gray-300">
              {user?.first_name || 'Usuario'}
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <QuoteRequest />
      </main>
    </div>
  );
}
