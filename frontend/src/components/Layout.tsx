import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Package, Users, FileText, MessageSquare, BarChart3, Briefcase, Plus, Upload, ChevronDown, Plug, Calculator, Zap, FileCheck, User, LogOut } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [leadsDropdownOpen, setLeadsDropdownOpen] = useState(false);
  const [quotationDropdownOpen, setQuotationDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const leadsDropdownRef = useRef<HTMLDivElement>(null);
  const quotationDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leadsDropdownRef.current && !leadsDropdownRef.current.contains(event.target as Node)) {
        setLeadsDropdownOpen(false);
      }
      if (quotationDropdownRef.current && !quotationDropdownRef.current.contains(event.target as Node)) {
        setQuotationDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLeadOption = (path: string) => {
    navigate(path);
    setLeadsDropdownOpen(false);
  };

  const handleQuotationOption = (path: string) => {
    navigate(path);
    setQuotationDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-cloud-white pb-24">
      <nav className="bg-deep-ocean shadow-lg border-b-4 border-velocity-green">
        <div className="flex justify-center">
          {/* Logo y Nombre - Centrado - Clickeable */}
          <button
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center justify-center py-8 px-4 hover:opacity-80 transition-opacity duration-200 cursor-pointer group"
            title="Hacer clic para volver al inicio"
          >
            <div className="flex items-center group-hover:scale-105 transition-transform duration-200">
              <Package className="h-10 w-10 text-aqua-flow group-hover:text-velocity-green transition-colors" />
              <span className="ml-3 text-2xl font-extrabold tracking-tighter-heading text-white">IntegralCargoSolutions</span>
              <span className="ml-2 text-sm font-bold tracking-ui text-velocity-green">ICS</span>
            </div>
            <span className="mt-1 text-xs font-mono tracking-ui text-aqua-flow-300 group-hover:text-aqua-flow transition-colors">Logística integral que impulsa tu negocio!</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Menú de Navegación - Centrado debajo del logo (ADAPTABLE) */}
          <div className="flex justify-center items-center pb-4">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-3 py-2 text-sm font-medium tracking-ui text-white hover:text-aqua-flow hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Users className="h-4 w-4 mr-2" />
                Panel CRM
              </Link>

              <ThemeSelector />

              <Link
                to="/dashboard/integraciones"
                className="inline-flex items-center px-3 py-2 text-sm font-medium tracking-ui text-velocity-green hover:text-aqua-flow hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Plug className="h-4 w-4 mr-2" />
                Integraciones
              </Link>

              {/* Solicitudes Dropdown */}
              <div ref={quotationDropdownRef} className="relative">
                <button
                  onClick={() => setQuotationDropdownOpen(!quotationDropdownOpen)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium tracking-ui text-aqua-flow-100 hover:text-velocity-green hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Solicitudes
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${quotationDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {quotationDropdownOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handleQuotationOption('/dashboard/solicitar-cotizacion')}
                      className="w-full px-4 py-3 text-left hover:bg-aqua-flow/10 transition-colors flex items-start gap-3 border-b border-gray-100"
                    >
                      <FileText className="h-5 w-5 text-aqua-flow flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Vista Previa de Solicitud</p>
                        <p className="text-xs text-gray-600">Ver formulario de cotización</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleQuotationOption('/dashboard/enviar-al-lead')}
                      className="w-full px-4 py-3 text-left hover:bg-velocity-green/10 transition-colors flex items-start gap-3"
                    >
                      <FileText className="h-5 w-5 text-velocity-green flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Enviar al Lead</p>
                        <p className="text-xs text-gray-600">Compartir link de solicitud de cotización</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Leads Dropdown */}
              <div ref={leadsDropdownRef} className="relative">
                <button
                  onClick={() => setLeadsDropdownOpen(!leadsDropdownOpen)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium tracking-ui text-velocity-green hover:text-aqua-flow hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Leads
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${leadsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {leadsDropdownOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handleLeadOption('/dashboard/crear-lead')}
                      className="w-full px-4 py-3 text-left hover:bg-aqua-flow/10 transition-colors flex items-start gap-3 border-b border-gray-100"
                    >
                      <Plus className="h-5 w-5 text-aqua-flow flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Crear Lead Manualmente</p>
                        <p className="text-xs text-gray-600">Ingresa datos uno a uno</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleLeadOption('/dashboard/bulk-import-leads')}
                      className="w-full px-4 py-3 text-left hover:bg-velocity-green/10 transition-colors flex items-start gap-3 border-b border-gray-100"
                    >
                      <Upload className="h-5 w-5 text-velocity-green flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Importar Leads Masivamente</p>
                        <p className="text-xs text-gray-600">Sube archivos CSV, Excel o TXT</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleLeadOption('/dashboard/editar-leads')}
                      className="w-full px-4 py-3 text-left hover:bg-aqua-flow/10 transition-colors flex items-start gap-3"
                    >
                      <Users className="h-5 w-5 text-aqua-flow flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Editar Información Leads</p>
                        <p className="text-xs text-gray-600">Gestiona tus leads existentes</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <Link
                to="/dashboard/mensajes"
                className="inline-flex items-center px-3 py-2 text-sm font-medium tracking-ui text-aqua-flow-100 hover:text-velocity-green hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Mensajes
              </Link>

              <Link
                to="/dashboard/reportes"
                className="inline-flex items-center px-3 py-2 text-sm font-medium tracking-ui text-aqua-flow-100 hover:text-velocity-green hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Reportes
              </Link>

              {/* User Dropdown */}
              <div ref={userDropdownRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium tracking-ui text-white hover:text-aqua-flow hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <User className="h-4 w-4 mr-2" />
                  {user?.first_name || 'Usuario'}
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      {user?.company_name && (
                        <p className="text-xs text-aqua-flow mt-1">{user.company_name}</p>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      {/* BOTONES FIJOS EN LA PARTE INFERIOR - NUNCA SE MUEVEN */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-deep-ocean via-deep-ocean to-deep-ocean border-t-4 border-velocity-green shadow-2xl z-40 p-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center gap-2 sm:gap-4 flex-wrap">
          <Link
            to="/dashboard/cotizador-manual"
            className="inline-flex items-center px-4 py-3 text-sm font-bold tracking-ui bg-gradient-to-r from-velocity-green to-emerald-600 text-white hover:from-velocity-green/90 hover:to-emerald-600/90 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Cotizador Manual
          </Link>

          <Link
            to="/dashboard/follow-up"
            className="inline-flex items-center px-4 py-3 text-sm font-bold tracking-ui bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-500/90 hover:to-cyan-600/90 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Follow Up
          </Link>

          <Link
            to="/dashboard/administrador-cotizaciones"
            className="inline-flex items-center px-4 py-3 text-sm font-bold tracking-ui bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-500/90 hover:to-pink-600/90 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Admin Cotizaciones
          </Link>
        </div>
      </div>
    </div>
  );
}
