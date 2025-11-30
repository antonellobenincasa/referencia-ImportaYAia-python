import { useNavigate } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';

export default function LeadsHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cloud-white to-aqua-flow/5 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-deep-ocean mb-2">Gestionar Leads</h1>
          <p className="text-lg text-gray-600">Elige cómo deseas agregar nuevos leads a tu CRM</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Crear Lead Manualmente */}
          <button
            onClick={() => navigate('/crear-lead')}
            className="group bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left hover:translate-y-[-4px]"
          >
            <div className="bg-aqua-flow/10 w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:bg-aqua-flow/20 transition-colors">
              <Plus className="h-8 w-8 text-aqua-flow" />
            </div>
            <h2 className="text-2xl font-bold text-deep-ocean mb-3">Crear Lead Manualmente</h2>
            <p className="text-gray-600 mb-6">
              Completa un formulario con la información del lead. Ideal para clientes individuales o información que recibes por teléfono.
            </p>
            <ul className="text-sm text-gray-500 space-y-2 mb-6">
              <li>✓ Ingresa datos uno a uno</li>
              <li>✓ Agrega notas personalizadas</li>
              <li>✓ Perfecto para leads puntuales</li>
            </ul>
            <div className="text-aqua-flow font-semibold flex items-center gap-2 group-hover:gap-4 transition-all">
              Empezar ahora
              <span>→</span>
            </div>
          </button>

          {/* Importar Leads */}
          <button
            onClick={() => navigate('/bulk-import-leads')}
            className="group bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left hover:translate-y-[-4px]"
          >
            <div className="bg-velocity-green/10 w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:bg-velocity-green/20 transition-colors">
              <Upload className="h-8 w-8 text-velocity-green" />
            </div>
            <h2 className="text-2xl font-bold text-deep-ocean mb-3">Importar Leads Masivamente</h2>
            <p className="text-gray-600 mb-6">
              Carga múltiples leads desde archivos CSV, Excel o TXT. También gestiona tus API Keys para automatizaciones.
            </p>
            <ul className="text-sm text-gray-500 space-y-2 mb-6">
              <li>✓ Importa cientos de leads</li>
              <li>✓ Gestiona API Keys y webhooks</li>
              <li>✓ Automatiza integraciones</li>
            </ul>
            <div className="text-velocity-green font-semibold flex items-center gap-2 group-hover:gap-4 transition-all">
              Empezar ahora
              <span>→</span>
            </div>
          </button>
        </div>

        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Tip:</span> También puedes crear leads automáticamente a través de la landing page de cotización. Los leads se crearán automáticamente cuando se envíen solicitudes desde allí.
          </p>
        </div>
      </div>
    </div>
  );
}
