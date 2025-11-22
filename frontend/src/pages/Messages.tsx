import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { MessageSquare, Phone, Mail } from 'lucide-react';

interface Message {
  id: number;
  lead: number;
  source: string;
  direction: string;
  content: string;
  status: string;
  created_at: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.getMessages();
        setMessages(res.data.results || res.data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando mensajes...</div>
      </div>
    );
  }

  const getSourceIcon = (source: string) => {
    if (source.includes('whatsapp')) return Phone;
    if (source.includes('email')) return Mail;
    return MessageSquare;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Bandeja de Mensajes</h1>

      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          {messages.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay mensajes disponibles</p>
            </div>
          ) : (
            messages.map((message) => {
              const SourceIcon = getSourceIcon(message.source);
              return (
                <div key={message.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full ${
                      message.direction === 'entrante' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <SourceIcon className={`h-5 w-5 ${
                        message.direction === 'entrante' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {message.source} - Lead #{message.lead}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          message.status === 'nuevo' ? 'bg-blue-100 text-blue-800' :
                          message.status === 'leído' ? 'bg-gray-100 text-gray-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {message.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{message.content}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(message.created_at).toLocaleString('es-EC')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
