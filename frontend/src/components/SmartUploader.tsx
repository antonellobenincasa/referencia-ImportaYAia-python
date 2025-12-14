import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadedFile {
  id: number;
  file: File;
  document_type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  serverId?: number;
}

interface SmartUploaderProps {
  shippingInstructionId: number;
  onUploadComplete?: (documents: any[]) => void;
  onProcessAI?: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'commercial_invoice', label: 'Factura Comercial' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'booking_confirmation', label: 'Confirmación de Booking' },
  { value: 'bill_of_lading', label: 'Bill of Lading' },
  { value: 'certificate_of_origin', label: 'Certificado de Origen' },
  { value: 'insurance_certificate', label: 'Certificado de Seguro' },
  { value: 'purchase_order', label: 'Orden de Compra' },
  { value: 'other', label: 'Otro Documento' },
];

export default function SmartUploader({ shippingInstructionId, onUploadComplete, onProcessAI }: SmartUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadedFile[] = newFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      document_type: detectDocumentType(file.name),
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const detectDocumentType = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes('invoice') || lower.includes('factura')) return 'commercial_invoice';
    if (lower.includes('packing') || lower.includes('lista')) return 'packing_list';
    if (lower.includes('booking')) return 'booking_confirmation';
    if (lower.includes('bl') || lower.includes('lading')) return 'bill_of_lading';
    if (lower.includes('origin') || lower.includes('origen')) return 'certificate_of_origin';
    if (lower.includes('seguro') || lower.includes('insurance')) return 'insurance_certificate';
    if (lower.includes('po') || lower.includes('order') || lower.includes('orden')) return 'purchase_order';
    return 'other';
  };

  const updateFileType = (fileId: number, docType: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, document_type: docType } : f
    ));
  };

  const removeFile = (fileId: number) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = async (file: UploadedFile): Promise<boolean> => {
    setFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, status: 'uploading' } : f
    ));

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('document_type', file.document_type);

      const response = await fetch(
        `/api/sales/shipping-instructions/${shippingInstructionId}/documents/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'success', serverId: data.id } : f
        ));
        return true;
      } else {
        const error = await response.json();
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error', error: error.error || 'Error al subir' } : f
        ));
        return false;
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'error', error: 'Error de conexión' } : f
      ));
      return false;
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    const successfulFiles = files.filter(f => f.status === 'success');
    if (onUploadComplete && successfulFiles.length > 0) {
      onUploadComplete(successfulFiles);
    }
  };

  const handleProcessAI = async () => {
    setIsProcessingAI(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `/api/sales/shipping-instructions/${shippingInstructionId}/process-ai/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok && onProcessAI) {
        onProcessAI();
      }
    } catch (error) {
      console.error('Error processing AI:', error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-[#0A2540] mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-[#00C9B7]" />
        Carga de Documentos
      </h3>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-[#00C9B7] bg-[#00C9B7]/5' 
            : 'border-gray-200 hover:border-[#00C9B7]/50 hover:bg-gray-50'
          }
        `}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.csv"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${isDragging ? 'bg-[#00C9B7]/20' : 'bg-gray-100'}
          `}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-[#00C9B7]' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-[#0A2540] font-medium">
              Arrastra tus documentos aquí
            </p>
            <p className="text-sm text-gray-500 mt-1">
              o haz clic para seleccionar archivos
            </p>
          </div>
          <p className="text-xs text-gray-400">
            PDF, Excel, Word, imágenes (máx. 10MB por archivo)
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-600">
            Documentos ({files.length})
          </h4>
          
          {files.map(file => (
            <div 
              key={file.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0A2540] truncate">
                  {file.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.file.size / 1024).toFixed(1)} KB
                </p>
              </div>

              <select
                value={file.document_type}
                onChange={(e) => updateFileType(file.id, e.target.value)}
                disabled={file.status !== 'pending'}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7] outline-none"
              >
                {DOCUMENT_TYPES.map(dt => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>

              <div className="flex-shrink-0">
                {file.status === 'pending' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {file.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-[#00C9B7] animate-spin" />
                )}
                {file.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-500" title={file.error} />
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-3 mt-4">
            {pendingCount > 0 && (
              <button
                onClick={uploadAllFiles}
                disabled={uploadingCount > 0}
                className="flex-1 py-2 px-4 bg-[#00C9B7] text-white rounded-lg font-medium hover:bg-[#00B5A5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadingCount > 0 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir {pendingCount} documento{pendingCount > 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}

            {successCount > 0 && (
              <button
                onClick={handleProcessAI}
                disabled={isProcessingAI || pendingCount > 0}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando con IA...
                  </>
                ) : (
                  <>
                    <span className="text-lg">✨</span>
                    Extraer datos con IA
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
