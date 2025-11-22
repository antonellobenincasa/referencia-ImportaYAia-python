import { useState } from 'react';
import { api } from '../api/client';
import { FileText, Download, BarChart3 } from 'lucide-react';

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('sales_metrics');

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await api.getSalesReports({ type: reportType, format: 'json' });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Reportes y Analíticas</h1>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Reporte
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="sales_metrics">Métricas de Ventas</option>
            <option value="lead_conversion">Conversión de Leads</option>
            <option value="quote_analytics">Análisis de Cotizaciones</option>
            <option value="communication_stats">Estadísticas de Comunicación</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { type: 'sales_metrics', icon: BarChart3, title: 'Métricas de Ventas', desc: 'Tasas de conversión y valores totales' },
            { type: 'lead_conversion', icon: FileText, title: 'Conversión de Leads', desc: 'Leads por estado y fuente' },
            { type: 'quote_analytics', icon: Download, title: 'Análisis de Cotizaciones', desc: 'Cotizaciones por estado e incoterm' },
          ].map((report) => (
            <button
              key={report.type}
              onClick={() => setReportType(report.type)}
              className={`p-4 border-2 rounded-lg text-left ${
                reportType === report.type
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <report.icon className={`h-8 w-8 mb-2 ${
                reportType === report.type ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <h3 className="font-semibold text-gray-900">{report.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{report.desc}</p>
            </button>
          ))}
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Download className="h-5 w-5 mr-2" />
          {loading ? 'Generando...' : 'Generar y Descargar Reporte'}
        </button>
      </div>
    </div>
  );
}
