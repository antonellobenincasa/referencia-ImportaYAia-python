import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { MessageSquare, Phone, Mail, Facebook, Send, Inbox, Search, CheckCircle, Plus, X, Toggle2, Power, Settings } from 'lucide-react';

interface Message {
  id: number;
  lead: number;
  source: string;
  direction: string;
  sender_name?: string;
  message_body: string;
  status: string;
  created_at: string;
  subject?: string;
}

interface Channel {
  id?: number;
  channel_type: string;
  name: string;
  icon: any;
  color: string;
  is_active: boolean;
}

interface ChannelConnection {
  id: number;
  channel_type: string;
  is_active: boolean;
  connection_method: string;
  webhook_url?: string;
  connected_at: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({
    channel_type: 'whatsapp',
    connection_method: 'api_key',
    api_key: '',
    webhook_url: ''
  });

  const availableChannels = [
    { id: 'whatsapp', name: 'WhatsApp', icon: Phone, color: 'bg-green-100 text-green-700' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-100 text-blue-700' },
    { id: 'instagram', name: 'Instagram', icon: Send, color: 'bg-pink-100 text-pink-700' },
    { id: 'tiktok', name: 'TikTok', icon: Send, color: 'bg-gray-800 text-white' },
    { id: 'email', name: 'Email', icon: Mail, color: 'bg-red-100 text-red-700' },
    { id: 'webhook', name: 'Custom Webhook', icon: Settings, color: 'bg-purple-100 text-purple-700' },
  ];

  useEffect(() => {
    fetchMessages();
    fetchChannels();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [messages, searchTerm, filterSource, filterStatus, filterDirection, filterDateFrom, filterDateTo]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/comms/messages/');
      setMessages(res.data.results || res.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      setChannelsLoading(true);
      const res = await apiClient.get('/api/comms/channels/');
      setChannels(res.data.results || res.data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setChannelsLoading(false);
    }
  };

  const handleToggleChannel = async (channelId: number) => {
    try {
      await apiClient.post(`/api/comms/channels/${channelId}/toggle/`);
      fetchChannels();
    } catch (error) {
      console.error('Error toggling channel:', error);
    }
  };

  const handleDeleteChannel = async (channelId: number) => {
    try {
      await apiClient.delete(`/api/comms/channels/${channelId}/`);
      fetchChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  const handleAddChannel = async () => {
    try {
      await apiClient.post('/api/comms/channels/', {
        channel_type: newChannel.channel_type,
        connection_method: newChannel.connection_method,
        api_key: newChannel.api_key || undefined,
        webhook_url: newChannel.webhook_url || undefined,
      });
      setNewChannel({ channel_type: 'whatsapp', connection_method: 'api_key', api_key: '', webhook_url: '' });
      setShowAddChannel(false);
      fetchChannels();
    } catch (error) {
      console.error('Error adding channel:', error);
    }
  };

  const applyFilters = () => {
    let filtered = messages;

    if (searchTerm) {
      filtered = filtered.filter(msg =>
        msg.message_body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSource) {
      filtered = filtered.filter(msg => msg.source === filterSource);
    }

    if (filterStatus) {
      filtered = filtered.filter(msg => msg.status === filterStatus);
    }

    if (filterDirection) {
      filtered = filtered.filter(msg => msg.direction === filterDirection);
    }

    if (filterDateFrom) {
      filtered = filtered.filter(msg => new Date(msg.created_at) >= new Date(filterDateFrom));
    }

    if (filterDateTo) {
      filtered = filtered.filter(msg => new Date(msg.created_at) <= new Date(filterDateTo));
    }

    setFilteredMessages(filtered);
  };

  const getChannelIcon = (channelType: string) => {
    const ch = availableChannels.find(c => c.id === channelType);
    return ch?.icon || MessageSquare;
  };

  const getChannelName = (channelType: string) => {
    const ch = availableChannels.find(c => c.id === channelType);
    return ch?.name || channelType;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp':
        return Phone;
      case 'facebook':
        return Facebook;
      case 'email':
        return Mail;
      case 'web':
        return Inbox;
      default:
        return MessageSquare;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'whatsapp':
        return 'WhatsApp';
      case 'facebook':
        return 'Facebook';
      case 'instagram':
        return 'Instagram';
      case 'tiktok':
        return 'TikTok';
      case 'email':
        return 'Email';
      case 'web':
        return 'Web';
      default:
        return source;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'whatsapp':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'facebook':
        return 'bg-blue-50 border-l-4 border-blue-500';
      case 'instagram':
        return 'bg-pink-50 border-l-4 border-pink-500';
      case 'email':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'web':
        return 'bg-purple-50 border-l-4 border-purple-500';
      default:
        return 'bg-gray-50 border-l-4 border-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nuevo':
        return 'bg-blue-100 text-blue-800';
      case 'leido':
        return 'bg-gray-100 text-gray-800';
      case 'respondido':
        return 'bg-green-100 text-green-800';
      case 'archivado':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'nuevo':
        return 'Nuevo';
      case 'leido':
        return 'Leído';
      case 'respondido':
        return 'Respondido';
      case 'archivado':
        return 'Archivado';
      default:
        return status;
    }
  };

  const activeChannelsCount = channels.filter(c => c.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-deep-ocean mb-2">Bandeja de Mensajes Centralizada</h1>
        <p className="text-gray-600">Gestiona todos tus mensajes desde múltiples canales en un solo lugar</p>
      </div>

      {/* Canales Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-deep-ocean">Canales Conectados</h2>
            <p className="text-sm text-gray-600">
              {activeChannelsCount} de {channels.length} canales activos
            </p>
          </div>
          <button
            onClick={() => setShowAddChannel(true)}
            className="flex items-center gap-2 bg-aqua-flow text-white px-4 py-2 rounded-lg hover:bg-aqua-flow/90"
          >
            <Plus className="h-5 w-5" />
            Agregar Canal
          </button>
        </div>

        {channelsLoading ? (
          <div className="text-center py-8 text-gray-600">Cargando canales...</div>
        ) : channels.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <p>No hay canales configurados</p>
            <p className="text-sm mt-2">Haz clic en "Agregar Canal" para conectar tus primeros canales</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => {
              const Icon = getChannelIcon(channel.channel_type);
              return (
                <div
                  key={channel.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    channel.is_active
                      ? 'border-green-300 bg-white'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        channel.is_active ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          channel.is_active ? 'text-green-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{getChannelName(channel.channel_type)}</p>
                        <p className="text-xs text-gray-500">{channel.connection_method}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleToggleChannel(channel.id)}
                      className={`flex-1 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        channel.is_active
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {channel.is_active ? '◉ Desconectar' : '◯ Conectar'}
                    </button>
                    <button
                      onClick={() => handleDeleteChannel(channel.id)}
                      className="px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-deep-ocean mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar mensajes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
            />
          </div>

          <div>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
            >
              <option value="">Todos los canales</option>
              {availableChannels.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
            >
              <option value="">Todos los estados</option>
              <option value="nuevo">Nuevo</option>
              <option value="leido">Leído</option>
              <option value="respondido">Respondido</option>
              <option value="archivado">Archivado</option>
            </select>
          </div>

          <div>
            <select
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
            >
              <option value="">Todas las direcciones</option>
              <option value="entrante">Entrante</option>
              <option value="saliente">Saliente</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
            />
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-600">Cargando mensajes...</div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No hay mensajes disponibles</p>
            <p className="text-sm text-gray-400 mt-2">Intenta cambiar tus filtros de búsqueda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => {
              const SourceIcon = getSourceIcon(message.source);
              const isIncoming = message.direction === 'entrante';
              return (
                <div
                  key={message.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors ${getSourceColor(message.source)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full flex-shrink-0 ${
                      isIncoming ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <SourceIcon className={`h-5 w-5 ${
                        isIncoming ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {message.sender_name || 'Sin nombre'} • {getSourceLabel(message.source)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Lead #{message.lead} • {isIncoming ? 'Entrante' : 'Saliente'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(message.status)}`}>
                            {getStatusLabel(message.status)}
                          </span>
                        </div>
                      </div>

                      {message.subject && (
                        <p className="text-sm font-medium text-gray-700 mt-2">
                          Asunto: {message.subject}
                        </p>
                      )}

                      <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                        {message.message_body}
                      </p>

                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(message.created_at).toLocaleString('es-EC')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Channel Modal */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-deep-ocean">Agregar Canal</h2>
              <button onClick={() => setShowAddChannel(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Canal</label>
                <select
                  value={newChannel.channel_type}
                  onChange={(e) => setNewChannel({ ...newChannel, channel_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow"
                >
                  {availableChannels.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Conexión</label>
                <select
                  value={newChannel.connection_method}
                  onChange={(e) => setNewChannel({ ...newChannel, connection_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow"
                >
                  <option value="api_key">API Key</option>
                  <option value="webhook">Webhook</option>
                  <option value="builtin">Built-in</option>
                </select>
              </div>

              {newChannel.connection_method === 'api_key' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <input
                    type="password"
                    value={newChannel.api_key}
                    onChange={(e) => setNewChannel({ ...newChannel, api_key: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow"
                    placeholder="Ingresa tu API Key"
                  />
                </div>
              )}

              {newChannel.connection_method === 'webhook' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL Webhook</label>
                  <input
                    type="url"
                    value={newChannel.webhook_url}
                    onChange={(e) => setNewChannel({ ...newChannel, webhook_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow"
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t">
                <button
                  onClick={handleAddChannel}
                  className="flex-1 bg-aqua-flow text-white py-2 rounded-lg font-medium hover:bg-aqua-flow/90"
                >
                  Conectar
                </button>
                <button
                  onClick={() => setShowAddChannel(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredMessages.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Mostrando <span className="font-semibold text-deep-ocean">{filteredMessages.length}</span> de{' '}
          <span className="font-semibold text-deep-ocean">{messages.length}</span> mensajes
        </div>
      )}
    </div>
  );
}
