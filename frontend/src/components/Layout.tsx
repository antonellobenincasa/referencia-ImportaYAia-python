import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Package, Users, FileText, MessageSquare, BarChart3, Briefcase, Plus, Upload, ChevronDown } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const [leadsDropdownOpen, setLeadsDropdownOpen] = useState(false);
  const [quotationDropdownOpen, setQuotationDropdownOpen] = useState(false);
  const leadsDropdownRef = useRef<HTMLDivElement>(null);
  const quotationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leadsDropdownRef.current && !leadsDropdownRef.current.contains(event.target as Node)) {
        setLeadsDropdownOpen(false);
      }
      if (quotationDropdownRef.current && !quotationDropdownRef.current.contains(event.target as Node)) {
        setQuotationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLeadOption = (path: string) => {
    navigate(path);
    setLeadsDropdownOpen(false);
  };

  const handleQuotationOption = (path: string) => {
    navigate(path);
    setQuotationDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-cloud-white">
      <nav className="bg-deep-ocean shadow-lg border-b-4 border-velocity-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex flex-col items-start justify-center">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-aqua-flow" />
                  <span className="ml-2 text-xl font-extrabold tracking-tighter-heading text-white">IntegralCargoSolutions</span>
                  <span className="ml-1 text-xs font-bold tracking-ui text-velocity-green">ICS</span>
                </div>
                <span className="mt-1 text-xs font-mono tracking-ui text-aqua-flow-300">Logística integral que impulsa tu negocio!</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium tracking-ui text-white hover:text-aqua-flow transition-colors duration-200"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Panel CRM
                </Link>
                
                {/* Quotation and Leads Dropdowns - Side by Side */}
                <div className="flex space-x-0">
                  {/* Quotation Dropdown */}
                  <div ref={quotationDropdownRef} className="relative">
                    <button
                      onClick={() => setQuotationDropdownOpen(!quotationDropdownOpen)}
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium tracking-ui text-aqua-flow-100 hover:text-velocity-green transition-colors duration-200"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Solicitudes
                      <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${quotationDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {quotationDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50">
                        <button
                          onClick={() => handleQuotationOption('/solicitar-cotizacion')}
                          className="w-full px-4 py-3 text-left hover:bg-aqua-flow/10 transition-colors flex items-start gap-3 border-b border-gray-100"
                        >
                          <FileText className="h-5 w-5 text-aqua-flow flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900">Vista Previa de Solicitud</p>
                            <p className="text-xs text-gray-600">Ver formulario de cotización</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleQuotationOption('/enviar-al-lead')}
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
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium tracking-ui text-velocity-green hover:text-aqua-flow transition-colors duration-200"
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Leads
                      <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${leadsDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {leadsDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50">
                        <button
                          onClick={() => handleLeadOption('/crear-lead')}
                          className="w-full px-4 py-3 text-left hover:bg-aqua-flow/10 transition-colors flex items-start gap-3 border-b border-gray-100"
                        >
                          <Plus className="h-5 w-5 text-aqua-flow flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900">Crear Lead Manualmente</p>
                            <p className="text-xs text-gray-600">Ingresa datos uno a uno</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleLeadOption('/bulk-import-leads')}
                          className="w-full px-4 py-3 text-left hover:bg-velocity-green/10 transition-colors flex items-start gap-3"
                        >
                          <Upload className="h-5 w-5 text-velocity-green flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900">Importar Leads Masivamente</p>
                            <p className="text-xs text-gray-600">Sube archivos CSV, Excel o TXT</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <Link
                  to="/mensajes"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium tracking-ui text-aqua-flow-100 hover:text-velocity-green transition-colors duration-200"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mensajes
                </Link>
                <Link
                  to="/reportes"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium tracking-ui text-aqua-flow-100 hover:text-velocity-green transition-colors duration-200"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reportes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
