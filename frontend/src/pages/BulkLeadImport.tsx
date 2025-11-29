import React, { useState } from 'react';
import { Upload, Key, Trash2 } from 'lucide-react';
import { api } from '../api/client';

export default function BulkLeadImport() {
  const [activeTab, setActiveTab] = useState<'api-keys' | 'bulk-import'>('bulk-import');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newApiKey, setNewApiKey] = useState({ name: '', service_type: 'custom', webhook_url: '' });

  const handleFileUpload = async () => {
    if (!file) {
      setMessage('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    try {
      const response = await api.apiClient.post('/api/sales/bulk-import/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`✅ Importación completada: ${response.data.imported_rows} leads importados`);
      setFile(null);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newApiKey.name) {
      setMessage('Por favor ingresa un nombre para la API Key');
      return;
    }

    setLoading(true);
    try {
      const response = await api.apiClient.post('/api/sales/api-keys/', newApiKey);
      setApiKeys([...apiKeys, response.data]);
      setNewApiKey({ name: '', service_type: 'custom', webhook_url: '' });
      setMessage(`✅ API Key creada: ${response.data.key}`);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await api.apiClient.delete(`/api/sales/api-keys/${id}/`);
      setApiKeys(apiKeys.filter(k => k.id !== id));
      setMessage('✅ API Key eliminada');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('bulk-import')}
            className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 ${
              activeTab === 'bulk-import'
                ? 'bg-aqua-flow text-white border-b-2 border-aqua-flow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="h-5 w-5" />
            Importar Leads Masivamente
          </button>
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 ${
              activeTab === 'api-keys'
                ? 'bg-aqua-flow text-white border-b-2 border-aqua-flow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Key className="h-5 w-5" />
            Gestionar API Keys
          </button>
        </div>

        <div className="p-8">
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}

          {activeTab === 'bulk-import' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Archivo
                </label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow"
                >
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="xls">Excel 97-2003 (.xls)</option>
                  <option value="txt">Texto (.txt)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona Archivo
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".csv,.xlsx,.xls,.txt"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-2">Formato esperado (Columnas):</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>company_name - Nombre de la Empresa</li>
                  <li>contact_name - Nombre del Contacto</li>
                  <li>email - Correo Electrónico</li>
                  <li>phone - Teléfono (opcional)</li>
                  <li>whatsapp - WhatsApp (opcional)</li>
                  <li>country - País (opcional, por defecto Ecuador)</li>
                  <li>city - Ciudad (opcional)</li>
                  <li>notes - Notas (opcional)</li>
                </ul>
              </div>

              <button
                onClick={handleFileUpload}
                disabled={!file || loading}
                className="w-full bg-aqua-flow text-white py-3 rounded-lg font-medium hover:bg-aqua-flow/90 disabled:bg-gray-400"
              >
                {loading ? 'Importando...' : 'Importar Leads'}
              </button>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-4">Crear Nueva API Key</h3>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nombre de la Integración"
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  
                  <select
                    value={newApiKey.service_type}
                    onChange={(e) => setNewApiKey({ ...newApiKey, service_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="custom">Custom Webhook</option>
                    <option value="zapier">Zapier</option>
                    <option value="stripe">Stripe</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>

                  <input
                    type="url"
                    placeholder="URL del Webhook (opcional)"
                    value={newApiKey.webhook_url}
                    onChange={(e) => setNewApiKey({ ...newApiKey, webhook_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />

                  <button
                    onClick={handleCreateApiKey}
                    disabled={loading}
                    className="w-full bg-velocity-green text-white py-2 rounded-lg font-medium hover:bg-velocity-green/90 disabled:bg-gray-400"
                  >
                    {loading ? 'Creando...' : 'Crear API Key'}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">API Keys Activas</h3>
                {apiKeys.length === 0 ? (
                  <p className="text-gray-500">No hay API Keys configuradas</p>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-sm text-gray-600">{key.service_type} - {key.key.substring(0, 10)}...</p>
                        </div>
                        <button
                          onClick={() => handleDeleteApiKey(key.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
