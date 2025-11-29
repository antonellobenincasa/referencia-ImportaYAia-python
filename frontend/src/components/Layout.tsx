import { Link, Outlet } from 'react-router-dom';
import { Package, Users, FileText, MessageSquare, BarChart3 } from 'lucide-react';

export default function Layout() {
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
                <Link
                  to="/solicitar-cotizacion"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium tracking-ui text-aqua-flow-100 hover:text-velocity-green transition-colors duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Vista Previa de Solicitud
                </Link>
                <Link
                  to="/enviar-al-lead"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium tracking-ui text-velocity-green hover:text-aqua-flow transition-colors duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Enviar al Lead
                </Link>
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
