import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Eye, Trash2, Copy, ExternalLink } from 'lucide-react';

interface Cotizacion {
  id: number;
  numero_cotizacion: string;
  empresa: string;
  email: string;
  estado: string;
  monto: number;
  fecha_creacion: string;
  tipo: 'manual' | 'automatica';
}

export default function AdministradorCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [filtro, setFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    try {
      setLoading(true);
      // Simulando datos para demostración
      const datosDemo: Cotizacion[] = [
        {
          id: 1,
          numero_cotizacion: 'COTIZ-001',
          empresa: 'MARIA JOSE S.A.S',
          email: 'mariajosediazarmas@hotmail.com',
          estado: 'enviada',
          monto: 2500.00,
          fecha_creacion: '01/12/2025',
          tipo: 'automatica'
        },
        {
          id: 2,
          numero_cotizacion: 'COTIZ-002',
          empresa: 'Importadora ABC',
          email: 'carlos@abc.ec',
          estado: 'pendiente',
          monto: 3200.00,
          fecha_creacion: '01/12/2025',
          tipo: 'manual'
        }
      ];
      setCotizaciones(datosDemo);
    } catch (error) {
      console.error('Error cargando cotizaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const cotizacionesFiltradas = cotizaciones
    .filter(cot => {
      if (filtro === 'manual') return cot.tipo === 'manual';
      if (filtro === 'automatica') return cot.tipo === 'automatica';
      return true;
    })
    .filter(cot =>
      cot.numero_cotizacion.toLowerCase().includes(busqueda.toLowerCase()) ||
      cot.empresa.toLowerCase().includes(busqueda.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-cloud-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Administrador de Cotizaciones
          </h1>
          <p className="text-gray-600">
            Consulta, administra y asigna tus cotizaciones a Routing Orders (RO)
          </p>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número o empresa..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-velocity-green"
              />
            </div>

            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-velocity-green"
            >
              <option value="todas">Todas las cotizaciones</option>
              <option value="manual">Solo manuales</option>
              <option value="automatica">Solo automáticas</option>
            </select>

            <button
              onClick={cargarCotizaciones}
              className="px-4 py-2 bg-velocity-green text-white rounded-lg hover:bg-velocity-green/90 transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="h-5 w-5" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Tabla de Cotizaciones */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Cargando cotizaciones...</p>
            </div>
          ) : cotizacionesFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay cotizaciones para mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Nº Cotización
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacionesFiltradas.map((cot) => (
                    <tr key={cot.id} className="border-b border-gray-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono font-semibold text-velocity-green">
                        {cot.numero_cotizacion}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {cot.empresa}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ${cot.monto.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          cot.estado === 'enviada' ? 'bg-blue-100 text-blue-800' :
                          cot.estado === 'aceptada' ? 'bg-green-100 text-green-800' :
                          cot.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cot.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          cot.tipo === 'manual' ? 'bg-aqua-flow/10 text-aqua-flow' :
                          'bg-velocity-green/10 text-velocity-green'
                        }`}>
                          {cot.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalles">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </button>
                          <button className="p-2 hover:bg-velocity-green/10 rounded-lg transition-colors" title="Copiar número">
                            <Copy className="h-4 w-4 text-velocity-green" />
                          </button>
                          <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors" title="Asignar a RO">
                            <ExternalLink className="h-4 w-4 text-purple-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Información */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-900">Total de Cotizaciones</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{cotizaciones.length}</p>
          </div>
          <div className="bg-gradient-to-br from-velocity-green/10 to-velocity-green/20 rounded-lg p-4 border border-velocity-green/30">
            <p className="text-sm font-semibold text-velocity-green/900">Automáticas</p>
            <p className="text-2xl font-bold text-velocity-green mt-1">
              {cotizaciones.filter(c => c.tipo === 'automatica').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-aqua-flow/10 to-aqua-flow/20 rounded-lg p-4 border border-aqua-flow/30">
            <p className="text-sm font-semibold text-aqua-flow/900">Manuales</p>
            <p className="text-2xl font-bold text-aqua-flow mt-1">
              {cotizaciones.filter(c => c.tipo === 'manual').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
