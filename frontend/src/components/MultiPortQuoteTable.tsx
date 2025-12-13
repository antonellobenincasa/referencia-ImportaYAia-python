import { Ship, MapPin, Clock, Calendar, DollarSign, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface FreightRate {
  pol: string;
  pod: string;
  carrier: string | null;
  transit_time: string | null;
  validity: string | null;
  container_type: string | null;
  costo_base: number | null;
  precio_flete: number | null;
  moneda: string;
  rate_id: number | null;
  sin_tarifa?: boolean;
  mensaje?: string;
}

interface LocalCost {
  codigo: string;
  descripcion: string;
  monto_usd: number;
  is_iva_exempt?: boolean;
}

interface LocalCostsData {
  items: LocalCost[];
  total_usd: number;
  iva_calculado?: number;
}

interface MultiPortQuoteData {
  is_multi_port: boolean;
  transport_type: string;
  container_type: string | null;
  quantity: number;
  origin_ports: string[];
  destination_ports: string[];
  total_combinaciones: number;
  tarifas_encontradas: number;
  tarifas: FreightRate[];
  gastos_locales: Record<string, LocalCostsData>;
  nota: string;
}

interface MultiPortQuoteTableProps {
  data: MultiPortQuoteData | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function MultiPortQuoteTable({ data, loading, onRefresh }: MultiPortQuoteTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Loader2 className="w-12 h-12 text-[#00C9B7] mx-auto animate-spin mb-4" />
        <p className="text-gray-600">Generando tabla de tarifas...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A2540] to-[#00C9B7] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Tarifario Multi-Puerto</h2>
            <p className="text-white/80 text-sm">
              {data.total_combinaciones} combinaciones • {data.tarifas_encontradas} tarifas encontradas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-white/60">Tipo Transporte</p>
              <p className="font-semibold">{data.transport_type}</p>
            </div>
            {data.container_type && (
              <div className="text-right">
                <p className="text-xs text-white/60">Contenedor</p>
                <p className="font-semibold">{data.container_type}</p>
              </div>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Actualizar tarifas"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-800 font-medium">Cotización Comparativa</p>
          <p className="text-amber-700 text-sm">{data.nota}</p>
        </div>
      </div>

      {/* Tabla de Tarifas de Flete */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-[#0A2540]/5 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-[#0A2540] flex items-center gap-2">
            <Ship className="w-5 h-5 text-[#00C9B7]" />
            Tarifas de Flete Internacional
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Origen (POL)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Destino (POD)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Naviera
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tránsito
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Validez
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tarifa USD
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.tarifas.map((tarifa, index) => (
                <tr 
                  key={`${tarifa.pol}-${tarifa.pod}-${index}`}
                  className={`hover:bg-gray-50 transition-colors ${tarifa.sin_tarifa ? 'bg-gray-50/50' : ''}`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#00C9B7]" />
                      <span className="font-medium text-gray-900">{tarifa.pol}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#A4FF00]" />
                      <span className="font-medium text-gray-900">{tarifa.pod}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {tarifa.carrier ? (
                      <span className="text-gray-700">{tarifa.carrier}</span>
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {tarifa.transit_time ? (
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{tarifa.transit_time}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {tarifa.validity ? (
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 text-sm">{tarifa.validity}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {tarifa.precio_flete !== null ? (
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-4 h-4 text-[#00C9B7]" />
                        <span className="font-bold text-[#0A2540] text-lg">
                          {tarifa.precio_flete.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-amber-500 text-sm italic">{tarifa.mensaje || 'Sin tarifa'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gastos Locales por Puerto */}
      {Object.keys(data.gastos_locales).length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-[#0A2540]/5 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-[#0A2540] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#A4FF00]" />
              Gastos Locales en Destino (Por Puerto)
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Los gastos locales varían según el puerto de destino seleccionado
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(data.gastos_locales).map(([puerto, gastos]) => (
                <div key={puerto} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-[#00C9B7]/10 to-[#A4FF00]/10 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-[#0A2540] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#00C9B7]" />
                      Puerto: {puerto}
                    </h4>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2">
                      {gastos.items?.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {item.descripcion || item.codigo}
                            {item.is_iva_exempt && (
                              <span className="ml-2 text-xs text-amber-600">(Exento IVA)</span>
                            )}
                          </span>
                          <span className="font-medium text-gray-900">
                            ${item.monto_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {gastos.iva_calculado !== undefined && gastos.iva_calculado > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-sm">
                        <span className="text-gray-600">IVA (15%)</span>
                        <span className="font-medium text-gray-900">
                          ${gastos.iva_calculado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-semibold text-[#0A2540]">Subtotal Gastos Locales</span>
                      <span className="font-bold text-[#00C9B7] text-lg">
                        ${gastos.total_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-2">Notas:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Las tarifas de flete mostradas NO incluyen los gastos locales de destino</li>
          <li>Los gastos locales se suman según el puerto de destino elegido</li>
          <li>El IVA 15% aplica sobre los gastos locales (excepto DTHC en FCL marítimo)</li>
          <li>Tarifas sujetas a disponibilidad de espacio y equipos</li>
        </ul>
      </div>
    </div>
  );
}
