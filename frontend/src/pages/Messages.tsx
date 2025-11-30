import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { MessageSquare, Phone, Mail, Facebook, Send, Inbox, Search, CheckCircle } from 'lucide-react';

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
  id: string;
  name: string;
  icon: any;
  color: string;
  connected: boolean;
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

  const channels: Channel[] = [
    { id: 'whatsapp', name: 'WhatsApp', icon: Phone, color: 'bg-green-100 text-green-700', connected: true },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-100 text-blue-700', connected: true },
    { id: 'instagram', name: 'Instagram', icon: Send, color: 'bg-pink-100 text-pink-700', connected: true },
    { id: 'tiktok', name: 'TikTok', icon: Send, color: 'bg-black-100 text-gray-800', connected: false },
    { id: 'email', name: 'Email', icon: Mail, color: 'bg-red-100 text-red-700', connected: true },
    { id: 'web', name: 'Formulario Web', icon: Inbox, color: 'bg-purple-100 text-purple-700', connected: true },
  ];

  useEffect(() => {
    fetchMessages();
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

  const connectedChannelsCount = channels.filter(c => c.connected).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-deep-ocean mb-2">Bandeja de Mensajes Centralizada</h1>
        <p className="text-gray-600">Gestiona todos tus mensajes desde múltiples canales en un solo lugar</p>
      </div>

      {/* Connected Channels Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-deep-ocean mb-4">Canales Conectados</h2>
        <p className="text-sm text-gray-600 mb-4">
          {connectedChannelsCount} de {channels.length} canales activos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.id}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  channel.connected
                    ? `${channel.color} border-green-300 bg-white`
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-semibold">{channel.name}</span>
                  {channel.connected && (
                    <div className="flex items-center gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      <span>Conectado</span>
                    </div>
                  )}
                  {!channel.connected && (
                    <span className="text-xs text-gray-500">Desconectado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-deep-ocean mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
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

          {/* Source Filter */}
          <div>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
            >
              <option value="">Todos los canales</option>
              {channels.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
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

          {/* Direction Filter */}
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

          {/* Date From Filter */}
          <div>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
            />
          </div>
        </div>

        {/* Date To Filter (if needed on second row) */}
        {filterDateTo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <div className="lg:col-start-5">
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
                placeholder="Hasta..."
              />
            </div>
          </div>
        )}
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
                    {/* Icon */}
                    <div className={`p-3 rounded-full flex-shrink-0 ${
                      isIncoming ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <SourceIcon className={`h-5 w-5 ${
                        isIncoming ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>

                    {/* Content */}
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

      {/* Stats Footer */}
      {filteredMessages.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Mostrando <span className="font-semibold text-deep-ocean">{filteredMessages.length}</span> de{' '}
          <span className="font-semibold text-deep-ocean">{messages.length}</span> mensajes
        </div>
      )}
    </div>
  );
}
