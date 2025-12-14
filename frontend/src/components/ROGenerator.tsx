import { useState } from 'react';
import { FileCheck, Send, Loader2, CheckCircle, Copy } from 'lucide-react';

interface ROGeneratorProps {
  shippingInstructionId: number;
  roNumber?: string;
  status: string;
  onROGenerated?: (roNumber: string) => void;
  onForwarderNotified?: () => void;
}

export default function ROGenerator({ 
  shippingInstructionId, 
  roNumber,
  status,
  onROGenerated,
  onForwarderNotified 
}: ROGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [currentRO, setCurrentRO] = useState(roNumber);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [forwarderRef, setForwarderRef] = useState('');
  const [savingRef, setSavingRef] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  const generateRO = async () => {
    setGenerating(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('ics_access_token');
      const response = await fetch(
        `/api/sales/shipping-instructions/${shippingInstructionId}/generate-ro/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCurrentRO(data.ro_number);
        setCurrentStatus('ro_generated');
        setMessage('Routing Order generado exitosamente');
        if (onROGenerated) onROGenerated(data.ro_number);
      } else {
        setMessage(data.error || 'Error al generar RO');
      }
    } catch (error) {
      setMessage('Error de conexión');
    } finally {
      setGenerating(false);
    }
  };

  const notifyForwarder = async () => {
    setNotifying(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('ics_access_token');
      const response = await fetch(
        `/api/sales/shipping-instructions/${shippingInstructionId}/notify-forwarder/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCurrentStatus('sent_to_forwarder');
        setMessage('Notificación enviada al Freight Forwarder');
        if (onForwarderNotified) onForwarderNotified();
      } else {
        setMessage(data.error || 'Error al notificar');
      }
    } catch (error) {
      setMessage('Error de conexión');
    } finally {
      setNotifying(false);
    }
  };

  const saveForwarderRef = async () => {
    if (!forwarderRef.trim()) return;
    
    setSavingRef(true);
    
    try {
      const token = localStorage.getItem('ics_access_token');
      const response = await fetch(
        `/api/sales/shipping-instructions/${shippingInstructionId}/forwarder-reference/`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ forwarder_reference: forwarderRef }),
        }
      );

      if (response.ok) {
        setCurrentStatus('forwarder_confirmed');
        setMessage('Referencia del forwarder guardada');
      }
    } catch (error) {
      setMessage('Error de conexión');
    } finally {
      setSavingRef(false);
    }
  };

  const copyRO = () => {
    if (currentRO) {
      navigator.clipboard.writeText(currentRO);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canGenerateRO = currentStatus === 'finalized' && !currentRO;
  const canNotify = currentRO && currentStatus === 'ro_generated';
  const canAddRef = currentStatus === 'sent_to_forwarder';
  const isConfirmed = currentStatus === 'confirmed' || currentStatus === 'forwarder_confirmed';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-[#0A2540] mb-4 flex items-center gap-2">
        <FileCheck className="w-5 h-5 text-[#00C9B7]" />
        Routing Order (RO)
      </h3>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          message.includes('Error') 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          <CheckCircle className="w-4 h-4" />
          {message}
        </div>
      )}

      <div className="space-y-4">
        {currentRO ? (
          <div className="p-4 bg-gradient-to-r from-[#00C9B7]/10 to-[#A4FF00]/10 rounded-xl border border-[#00C9B7]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Número de Routing Order</p>
                <p className="text-2xl font-bold text-[#0A2540] font-mono mt-1">
                  {currentRO}
                </p>
              </div>
              <button
                onClick={copyRO}
                className="p-2 text-[#00C9B7] hover:bg-[#00C9B7]/10 rounded-lg transition-colors"
                title="Copiar RO"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-600 text-center">
              {currentStatus === 'finalized' 
                ? 'Las instrucciones están listas. Genera el Routing Order para continuar.'
                : 'Primero debes finalizar las instrucciones de embarque.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={generateRO}
            disabled={!canGenerateRO || generating}
            className={`
              p-4 rounded-xl font-medium transition-all flex flex-col items-center gap-2
              ${canGenerateRO 
                ? 'bg-[#00C9B7] text-white hover:bg-[#00B5A5] cursor-pointer' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {generating ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <FileCheck className="w-6 h-6" />
            )}
            <span>1. Generar RO</span>
          </button>

          <button
            onClick={notifyForwarder}
            disabled={!canNotify || notifying}
            className={`
              p-4 rounded-xl font-medium transition-all flex flex-col items-center gap-2
              ${canNotify 
                ? 'bg-[#0A2540] text-white hover:bg-[#0A2540]/90 cursor-pointer' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {notifying ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
            <span>2. Notificar Forwarder</span>
          </button>

          <div className={`
            p-4 rounded-xl transition-all flex flex-col items-center gap-2
            ${isConfirmed 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-100 text-gray-400'
            }
          `}>
            <CheckCircle className="w-6 h-6" />
            <span>3. Confirmado</span>
          </div>
        </div>

        {canAddRef && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-700 mb-3">
              Ingresa la referencia de booking del Freight Forwarder:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={forwarderRef}
                onChange={(e) => setForwarderRef(e.target.value)}
                placeholder="Ej: BK-2024-12345"
                className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7] outline-none"
              />
              <button
                onClick={saveForwarderRef}
                disabled={savingRef || !forwarderRef.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {savingRef ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="font-semibold text-green-800">
                  Embarque Confirmado
                </p>
                <p className="text-sm text-green-600">
                  Las instrucciones han sido procesadas y confirmadas por el Freight Forwarder.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
