import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { User, Building2, Phone, Mail, MapPin, Save, ArrowLeft, FileText, CheckCircle, AlertCircle, Plus, Bell, Smartphone } from 'lucide-react';

interface NotificationPreferences {
  id: number;
  email_alerts_enabled: boolean;
  push_alerts_enabled: boolean;
  milestone_updates: boolean;
  eta_changes: boolean;
  document_updates: boolean;
}

interface CustomerRUC {
  id: number;
  ruc: string;
  company_name: string;
  is_primary: boolean;
  status: string;
  status_display: string;
  created_at: string;
}

export default function LeadMiCuenta() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    city: '',
    country: 'Ecuador',
  });
  
  const [userRUCs, setUserRUCs] = useState<CustomerRUC[]>([]);
  const [fallbackRuc, setFallbackRuc] = useState<string | null>(null);
  const [showAddRUC, setShowAddRUC] = useState(false);
  const [newRUC, setNewRUC] = useState({ ruc: '', company_name: '' });
  const [rucError, setRucError] = useState('');
  const [rucSaving, setRucSaving] = useState(false);
  
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    id: 0,
    email_alerts_enabled: true,
    push_alerts_enabled: true,
    milestone_updates: true,
    eta_changes: true,
    document_updates: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const [profileRes, rucsRes, notifRes] = await Promise.all([
          api.getProfile(),
          api.getMyRUCs(),
          api.getNotificationPreferences()
        ]);
        
        const profile = profileRes.data.user || profileRes.data;
        setFormData({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          company_name: profile.company_name || '',
          city: profile.city || '',
          country: profile.country || 'Ecuador',
        });
        
        const rucs = rucsRes.data.rucs || [];
        setUserRUCs(rucs);
        if (rucsRes.data.fallback_ruc) {
          setFallbackRuc(rucsRes.data.fallback_ruc);
        }
        
        if (notifRes.data.preferences) {
          setNotificationPrefs(notifRes.data.preferences);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        if (user) {
          setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            company_name: user.company_name || '',
            city: '',
            country: 'Ecuador',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadProfileData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    
    try {
      await api.updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        company_name: formData.company_name,
        city: formData.city,
        country: formData.country,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRUC = async () => {
    if (!newRUC.ruc || !/^\d{13}$/.test(newRUC.ruc)) {
      setRucError('El RUC debe tener exactamente 13 digitos numericos.');
      return;
    }
    if (!newRUC.company_name.trim()) {
      setRucError('La razon social es obligatoria.');
      return;
    }
    
    setRucSaving(true);
    setRucError('');
    
    try {
      const res = await api.registerRUC({
        ruc: newRUC.ruc,
        company_name: newRUC.company_name,
        is_oce_registered: true,
      });
      
      const addedRUC = res.data.ruc;
      if (addedRUC.status === 'primary' || addedRUC.status === 'approved') {
        setUserRUCs(prev => [...prev, addedRUC]);
      }
      
      setShowAddRUC(false);
      setNewRUC({ ruc: '', company_name: '' });
      
      if (res.data.requires_approval) {
        alert('Su solicitud de RUC adicional ha sido enviada. Estara disponible una vez aprobada por el administrador.');
      }
    } catch (err: any) {
      setRucError(err.response?.data?.ruc?.[0] || err.response?.data?.error || 'Error al registrar RUC');
    } finally {
      setRucSaving(false);
    }
  };

  const handleNotificationToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    setNotifSaving(true);
    try {
      const updatedPrefs = { ...notificationPrefs, [key]: value };
      setNotificationPrefs(updatedPrefs);
      
      await api.updateNotificationPreferences({ [key]: value });
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setNotificationPrefs(prev => ({ ...prev, [key]: !value }));
    } finally {
      setNotifSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C9B7]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0A2540] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center">
              <span className="text-[#0A2540] font-black text-sm">IA</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">ImportaYa<span className="text-[#00C9B7]">.ia</span></span>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/portal/mi-cuenta" className="text-sm text-[#00C9B7] font-medium">
              Mi Cuenta
            </Link>
            <span className="text-sm text-gray-300">
              Hola, <span className="text-white font-medium">{user?.first_name || 'Usuario'}</span>
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cerrar Sesion
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link 
          to="/portal" 
          className="inline-flex items-center gap-2 text-[#00C9B7] hover:text-[#00a89a] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-[#0A2540]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Mi Cuenta</h1>
                <p className="text-gray-300">Gestiona tu informacion personal y empresarial</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {success && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700">Perfil actualizado exitosamente</span>
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-[#0A2540] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#00C9B7]" />
                Datos Personales
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombres</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-[#00C9B7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-[#00C9B7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">El email no puede ser modificado</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-[#00C9B7]"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
              <h2 className="text-lg font-semibold text-[#0A2540] mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#00C9B7]" />
                Datos de la Empresa
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Razon Social</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-[#00C9B7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-[#00C9B7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pais</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00C9B7] focus:border-[#00C9B7]"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0A2540] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#00C9B7]" />
                  RUCs Registrados
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddRUC(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00C9B7] text-white rounded-xl hover:bg-[#00a89a] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar RUC
                </button>
              </div>
              
              {userRUCs.length === 0 && !fallbackRuc ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No tienes RUCs registrados</p>
                  <p className="text-sm text-gray-400 mt-1">Agrega tu RUC para agilizar futuras cotizaciones</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userRUCs.map((ruc) => (
                    <div key={ruc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-[#0A2540]">{ruc.ruc}</span>
                          {ruc.is_primary && (
                            <span className="px-2 py-0.5 bg-[#00C9B7] text-white text-xs rounded-full">Principal</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{ruc.company_name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ruc.status === 'approved' || ruc.status === 'primary' 
                          ? 'bg-green-100 text-green-700' 
                          : ruc.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {ruc.status_display || ruc.status}
                      </span>
                    </div>
                  ))}
                  
                  {userRUCs.length === 0 && fallbackRuc && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-medium text-[#0A2540]">{fallbackRuc}</span>
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">De cotizaciones</span>
                      </div>
                      <p className="text-sm text-blue-600">Este RUC se obtuvo de tus cotizaciones anteriores</p>
                    </div>
                  )}
                </div>
              )}

              {showAddRUC && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-medium text-[#0A2540] mb-3">Agregar Nuevo RUC</h3>
                  {rucError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {rucError}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RUC (13 digitos)</label>
                      <input
                        type="text"
                        maxLength={13}
                        value={newRUC.ruc}
                        onChange={(e) => setNewRUC({ ...newRUC, ruc: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00C9B7]"
                        placeholder="0992123456001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Razon Social</label>
                      <input
                        type="text"
                        value={newRUC.company_name}
                        onChange={(e) => setNewRUC({ ...newRUC, company_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00C9B7]"
                        placeholder="Empresa S.A."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleAddRUC}
                      disabled={rucSaving}
                      className="px-4 py-2 bg-[#00C9B7] text-white rounded-lg hover:bg-[#00a89a] disabled:opacity-50"
                    >
                      {rucSaving ? 'Guardando...' : 'Guardar RUC'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddRUC(false); setRucError(''); setNewRUC({ ruc: '', company_name: '' }); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Preferences Section */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-[#0A2540] mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#00C9B7]" />
                Preferencias de Notificaciones
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Configura como deseas recibir alertas sobre el estado de tus embarques
              </p>
              
              <div className="space-y-4">
                {/* Email Alerts Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Alertas por Email</p>
                      <p className="text-sm text-gray-500">Recibir notificaciones por correo electronico</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.email_alerts_enabled}
                      onChange={(e) => handleNotificationToggle('email_alerts_enabled', e.target.checked)}
                      disabled={notifSaving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00C9B7]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C9B7]"></div>
                  </label>
                </div>
                
                {/* Push Alerts Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Notificaciones Push</p>
                      <p className="text-sm text-gray-500">Recibir alertas en tu telefono</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.push_alerts_enabled}
                      onChange={(e) => handleNotificationToggle('push_alerts_enabled', e.target.checked)}
                      disabled={notifSaving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00C9B7]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C9B7]"></div>
                  </label>
                </div>
                
                {/* Milestone Updates Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Actualizaciones de Hitos</p>
                      <p className="text-sm text-gray-500">Alertas cuando tu carga alcance un nuevo hito</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.milestone_updates}
                      onChange={(e) => handleNotificationToggle('milestone_updates', e.target.checked)}
                      disabled={notifSaving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00C9B7]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C9B7]"></div>
                  </label>
                </div>
                
                {/* ETA Changes Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Cambios de ETA</p>
                      <p className="text-sm text-gray-500">Alertas sobre cambios en fechas estimadas de llegada</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.eta_changes}
                      onChange={(e) => handleNotificationToggle('eta_changes', e.target.checked)}
                      disabled={notifSaving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00C9B7]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C9B7]"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00C9B7]/30 transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
