import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Plug, Plus, Trash2, Power, X, Phone, Mail, Facebook, Send, Settings } from 'lucide-react';

interface ChannelConnection {
  id: number;
  channel_type: string;
  is_active: boolean;
  connection_method: string;
  connected_at: string;
}

const CHANNEL_NAMES: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  email: 'Email',
  webhook: 'Custom Webhook',
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬',
  facebook: '👍',
  instagram: '📸',
  tiktok: '🎵',
  email: '✉️',
  webhook: '🔗',
};

const SPECIAL_SERVICES = [
  { id: 'clientify', name: 'Clientify', icon: '🤝', description: 'CRM Integrado' },
  { id: 'zapier', name: 'Zapier', icon: '⚡', description: 'Automatización' },
];

const AVAILABLE_CHANNELS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: Phone, color: 'bg-green-100 text-green-700' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-100 text-blue-700' },
  { id: 'instagram', name: 'Instagram', icon: Send, color: 'bg-pink-100 text-pink-700' },
  { id: 'tiktok', name: 'TikTok', icon: Send, color: 'bg-gray-800 text-white' },
  { id: 'email', name: 'Email', icon: Mail, color: 'bg-red-100 text-red-700' },
  { id: 'webhook', name: 'Custom Webhook', icon: Settings, color: 'bg-purple-100 text-purple-700' },
];

export default function Integrations() {
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [channelError, setChannelError] = useState('');
  const [newChannel, setNewChannel] = useState({
    channel_type: 'whatsapp',
    connection_method: 'api_key',
    api_key: '',
    webhook_url: ''
  });

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await apiClient.get('/api/comms/channel-connections/');
        const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
        setConnections(data);
      } catch (error) {
        console.error('Error fetching integrations:', error);
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, []);

  const toggleConnection = async (id: number, isActive: boolean) => {
    try {
      await apiClient.patch(`/api/comms/channel-connections/${id}/`, { is_active: !isActive });
      setConnections(connections.map(c => c.id === id ? { ...c, is_active: !isActive } : c));
    } catch (error) {
      console.error('Error toggling connection:', error);
    }
  };

  const deleteConnection = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta conexión?')) {
      try {
        await apiClient.delete(`/api/comms/channel-connections/${id}/`);
        setConnections(connections.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting connection:', error);
      }
    }
  };

  const handleAddChannel = async () => {
    try {
      setChannelError('');
      if (!newChannel.api_key && newChannel.connection_method === 'api_key') {
        setChannelError('Por favor ingresa una API Key');
        return;
      }
      if (!newChannel.webhook_url && newChannel.connection_method === 'webhook') {
        setChannelError('Por favor ingresa una URL Webhook');
        return;
      }
      await apiClient.post('/api/comms/channel-connections/', {
        channel_type: newChannel.channel_type,
        connection_method: newChannel.connection_method,
        api_key: newChannel.api_key || undefined,
        webhook_url: newChannel.webhook_url || undefined,
      });
      setNewChannel({ channel_type: 'whatsapp', connection_method: 'api_key', api_key: '', webhook_url: '' });
      setShowAddChannel(false);
      // Refetch connections
      const response = await apiClient.get('/api/comms/channel-connections/');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setConnections(data);
    } catch (error: any) {
      setChannelError(error.response?.data?.detail || 'Error al agregar canal');
      console.error('Error adding channel:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando integraciones...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tighter-heading text-deep-ocean">Integraciones</h1>
        <p className="text-sm text-gray-600 font-mono">Gestiona los canales y servicios integrados al CRM</p>
      </div>

      {/* Servicios Especiales */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-deep-ocean mb-4">Apps & Servicios Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SPECIAL_SERVICES.map((service) => (
            <div key={service.id} className="bg-gradient-to-br from-aqua-flow/20 to-velocity-green/20 rounded-lg p-6 border-2 border-aqua-flow">
              <div className="text-4xl mb-3">{service.icon}</div>
              <h3 className="font-bold text-lg text-deep-ocean">{service.name}</h3>
              <p className="text-sm text-gray-600 mt-2">{service.description}</p>
              <button className="mt-4 w-full bg-aqua-flow text-white py-2 rounded-lg hover:bg-aqua-flow-700 font-medium transition-colors">
                Conectar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Canales de Comunicación */}
      <div>
        <h2 className="text-xl font-bold text-deep-ocean mb-4">Canales de Comunicación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
              <Plug className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No hay canales conectados</p>
              <button className="mt-4 inline-flex items-center gap-2 bg-velocity-green text-white px-4 py-2 rounded-lg hover:bg-velocity-green-700">
                <Plus className="h-4 w-4" />
                Conectar Canal
              </button>
            </div>
          ) : (
            connections.map((connection) => (
              <div key={connection.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-aqua-flow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{CHANNEL_ICONS[connection.channel_type]}</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{CHANNEL_NAMES[connection.channel_type]}</h3>
                      <p className="text-xs text-gray-500 capitalize">{connection.connection_method}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    connection.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {connection.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Conectado: {new Date(connection.connected_at).toLocaleDateString('es-EC')}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleConnection(connection.id, connection.is_active)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Power className="h-4 w-4" />
                    {connection.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => deleteConnection(connection.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-800 py-2 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
