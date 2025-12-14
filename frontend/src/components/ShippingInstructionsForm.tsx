import { useState, useEffect } from 'react';
import { 
  FileText, User, Building, MapPin, Package, Ship, 
  CheckCircle, AlertCircle, Loader2, Sparkles, Save
} from 'lucide-react';

interface ShippingInstructionData {
  id?: number;
  shipper_name: string;
  shipper_address: string;
  shipper_contact: string;
  shipper_email: string;
  shipper_phone: string;
  consignee_name: string;
  consignee_address: string;
  consignee_tax_id: string;
  notify_party_name: string;
  notify_party_address: string;
  origin_port: string;
  destination_port: string;
  cargo_description: string;
  hs_code: string;
  gross_weight_kg: number | null;
  net_weight_kg: number | null;
  volume_cbm: number | null;
  package_count: number | null;
  package_type: string;
  incoterm: string;
  special_instructions: string;
  status?: string;
}

interface AIExtractedData {
  [key: string]: any;
  extraction_confidence?: number;
}

interface ShippingInstructionsFormProps {
  shippingInstructionId: number;
  aiExtractedData?: AIExtractedData;
  onSave?: (data: ShippingInstructionData) => void;
  onFinalize?: () => void;
}

const INCOTERMS = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
const PACKAGE_TYPES = ['PALLETS', 'BOXES', 'CARTONS', 'BAGS', 'DRUMS', 'CRATES', 'ROLLS', 'BUNDLES', 'OTHER'];

const initialFormData: ShippingInstructionData = {
  shipper_name: '',
  shipper_address: '',
  shipper_contact: '',
  shipper_email: '',
  shipper_phone: '',
  consignee_name: '',
  consignee_address: '',
  consignee_tax_id: '',
  notify_party_name: '',
  notify_party_address: '',
  origin_port: '',
  destination_port: '',
  cargo_description: '',
  hs_code: '',
  gross_weight_kg: null,
  net_weight_kg: null,
  volume_cbm: null,
  package_count: null,
  package_type: '',
  incoterm: 'FOB',
  special_instructions: '',
};

export default function ShippingInstructionsForm({ 
  shippingInstructionId, 
  aiExtractedData,
  onSave,
  onFinalize 
}: ShippingInstructionsFormProps) {
  const [formData, setFormData] = useState<ShippingInstructionData>(initialFormData);
  const [aiSuggestions, setAiSuggestions] = useState<AIExtractedData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadFormData();
  }, [shippingInstructionId]);

  useEffect(() => {
    if (aiExtractedData) {
      setAiSuggestions(aiExtractedData);
    }
  }, [aiExtractedData]);

  const loadFormData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `/api/sales/shipping-instructions/${shippingInstructionId}/form/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFormData(data.form_data);
        if (data.ai_suggestions) {
          setAiSuggestions(data.ai_suggestions);
        }
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ShippingInstructionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const applySuggestion = (field: keyof ShippingInstructionData) => {
    if (aiSuggestions[field]) {
      handleChange(field, aiSuggestions[field]);
    }
  };

  const saveForm = async () => {
    setSaving(true);
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `/api/sales/shipping-instructions/${shippingInstructionId}/form/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setSuccessMessage('Guardado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        if (onSave) onSave(formData);
      } else {
        const error = await response.json();
        setErrors(error);
      }
    } catch (error) {
      console.error('Error saving form:', error);
    } finally {
      setSaving(false);
    }
  };

  const finalizeForm = async () => {
    setFinalizing(true);
    setErrors({});
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `/api/sales/shipping-instructions/${shippingInstructionId}/finalize/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setSuccessMessage('Instrucciones de embarque finalizadas');
        if (onFinalize) onFinalize();
      } else {
        const error = await response.json();
        if (error.missing_fields) {
          const fieldErrors: Record<string, string> = {};
          error.missing_fields.forEach((field: string) => {
            fieldErrors[field] = 'Campo requerido';
          });
          setErrors(fieldErrors);
        }
      }
    } catch (error) {
      console.error('Error finalizing:', error);
    } finally {
      setFinalizing(false);
    }
  };

  const renderField = (
    field: keyof ShippingInstructionData,
    label: string,
    type: 'text' | 'textarea' | 'number' | 'select' = 'text',
    options?: string[],
    required?: boolean
  ) => {
    const hasSuggestion = aiSuggestions[field] && aiSuggestions[field] !== formData[field];
    const hasError = errors[field];

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          {type === 'textarea' ? (
            <textarea
              value={formData[field] as string || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              rows={3}
              className={`
                w-full px-3 py-2 border rounded-lg outline-none transition-all
                ${hasError 
                  ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                  : 'border-gray-200 focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]'
                }
                ${hasSuggestion ? 'pr-10' : ''}
              `}
            />
          ) : type === 'select' ? (
            <select
              value={formData[field] as string || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-lg outline-none transition-all bg-white
                ${hasError 
                  ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                  : 'border-gray-200 focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]'
                }
              `}
            >
              <option value="">Seleccionar...</option>
              {options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={formData[field] as string || ''}
              onChange={(e) => handleChange(field, type === 'number' ? parseFloat(e.target.value) || null : e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-lg outline-none transition-all
                ${hasError 
                  ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                  : 'border-gray-200 focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]'
                }
                ${hasSuggestion ? 'pr-10' : ''}
              `}
            />
          )}

          {hasSuggestion && (
            <button
              onClick={() => applySuggestion(field)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#00C9B7] hover:bg-[#00C9B7]/10 rounded-full transition-colors"
              title={`Sugerencia AI: ${aiSuggestions[field]}`}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>

        {hasError && (
          <p className="text-xs text-red-500 mt-1">{errors[field]}</p>
        )}

        {hasSuggestion && (
          <p className="text-xs text-[#00C9B7] mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Sugerencia: {String(aiSuggestions[field]).substring(0, 50)}...
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00C9B7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#0A2540] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#00C9B7]" />
          Instrucciones de Embarque
        </h3>
        
        {aiSuggestions.extraction_confidence && (
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-[#00C9B7]" />
            <span className="text-gray-600">
              Confianza IA: {aiSuggestions.extraction_confidence}%
            </span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <div className="space-y-8">
        <section>
          <h4 className="text-md font-medium text-[#0A2540] mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[#00C9B7]" />
            Shipper (Exportador)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('shipper_name', 'Nombre de la Empresa', 'text', undefined, true)}
            {renderField('shipper_contact', 'Nombre del Contacto')}
            {renderField('shipper_address', 'Dirección Completa', 'textarea')}
            <div className="grid grid-cols-2 gap-4">
              {renderField('shipper_email', 'Email')}
              {renderField('shipper_phone', 'Teléfono')}
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-md font-medium text-[#0A2540] mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#00C9B7]" />
            Consignee (Importador)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('consignee_name', 'Nombre de la Empresa', 'text', undefined, true)}
            {renderField('consignee_tax_id', 'RUC')}
            {renderField('consignee_address', 'Dirección en Ecuador', 'textarea')}
          </div>
        </section>

        <section>
          <h4 className="text-md font-medium text-[#0A2540] mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            Notify Party (Opcional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('notify_party_name', 'Nombre')}
            {renderField('notify_party_address', 'Dirección')}
          </div>
        </section>

        <section>
          <h4 className="text-md font-medium text-[#0A2540] mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#00C9B7]" />
            Ruta de Transporte
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderField('origin_port', 'Puerto/Aeropuerto de Origen', 'text', undefined, true)}
            {renderField('destination_port', 'Puerto/Aeropuerto de Destino', 'text', undefined, true)}
            {renderField('incoterm', 'Incoterm', 'select', INCOTERMS)}
          </div>
        </section>

        <section>
          <h4 className="text-md font-medium text-[#0A2540] mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#00C9B7]" />
            Detalles de la Carga
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {renderField('cargo_description', 'Descripción de la Mercancía', 'textarea', undefined, true)}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderField('hs_code', 'Partida Arancelaria')}
              {renderField('gross_weight_kg', 'Peso Bruto (kg)', 'number')}
              {renderField('net_weight_kg', 'Peso Neto (kg)', 'number')}
              {renderField('volume_cbm', 'Volumen (CBM)', 'number')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField('package_count', 'Número de Bultos', 'number')}
              {renderField('package_type', 'Tipo de Embalaje', 'select', PACKAGE_TYPES)}
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-md font-medium text-[#0A2540] mb-4 flex items-center gap-2">
            <Ship className="w-4 h-4 text-[#00C9B7]" />
            Instrucciones Especiales
          </h4>
          {renderField('special_instructions', 'Notas adicionales para el embarque', 'textarea')}
        </section>

        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <button
            onClick={saveForm}
            disabled={saving}
            className="flex-1 py-3 px-4 bg-gray-100 text-[#0A2540] rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Borrador
          </button>
          
          <button
            onClick={finalizeForm}
            disabled={finalizing}
            className="flex-1 py-3 px-4 bg-[#00C9B7] text-white rounded-lg font-medium hover:bg-[#00B5A5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {finalizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Finalizar Instrucciones
          </button>
        </div>
      </div>
    </div>
  );
}
