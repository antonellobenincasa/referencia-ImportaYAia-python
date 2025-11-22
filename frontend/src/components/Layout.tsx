import { Link, Outlet } from 'react-router-dom';
import { Package, Users, FileText, MessageSquare, BarChart3 } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">H-SAMP</span>
                <span className="ml-2 text-sm text-gray-500">Ecuador Logistics</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Panel CRM
                </Link>
                <Link
                  to="/solicitar-cotizacion"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Solicitar Cotización
                </Link>
                <Link
                  to="/mensajes"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mensajes
                </Link>
                <Link
                  to="/reportes"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600"
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
