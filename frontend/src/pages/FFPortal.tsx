import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Milestone {
  id: number;
  milestone_key: string;
  milestone_name: string;
  milestone_order: number;
  status: string;
  planned_date: string | null;
  actual_date: string | null;
  notes: string;
  meta_data: Record<string, string>;
}

interface Shipment {
  id: number;
  ro_number: string;
  consignee_name: string;
  cargo_description: string;
  status: string;
  total_milestones: number;
  completed_milestones: number;
  progress_percent: number;
  created_at: string;
  milestones: Milestone[];
}

interface FFUser {
  id: number;
  email: string;
  company_name: string;
  is_verified: boolean;
}

interface MilestoneUpdate {
  milestone_id: number;
  actual_date?: string;
  notes?: string;
  meta_data?: Record<string, string>;
}

const FFLoginPage = ({ onLogin }: { onLogin: (token: string, user: FFUser) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/accounts/ff/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('ff_access_token', data.tokens.access);
        localStorage.setItem('ff_refresh_token', data.tokens.refresh);
        onLogin(data.tokens.access, data.user);
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#0D3A5C] flex items-center justify-center p-4">
      <div className="bg-[#0D2E4D] rounded-2xl p-8 w-full max-w-md border border-[#1E4A6D]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-[#0A2540] text-2xl font-bold">FF</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Portal Freight Forwarder</h1>
          <p className="text-gray-400 mt-2">Acceso para actualización de tracking</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-3 text-white"
              placeholder="correo@empresa.com"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-3 text-white"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

const FFRegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [invitationData, setInvitationData] = useState<{ email: string; company_name: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no proporcionado');
      setLoading(false);
      return;
    }

    fetch(`/api/accounts/ff/invitation/validate/${token}/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setInvitationData({ email: data.email, company_name: data.company_name });
        } else {
          setError(data.error || 'Invitación inválida');
        }
      })
      .catch(() => setError('Error validando invitación'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setRegistering(true);
    setError('');

    try {
      const response = await fetch('/api/accounts/ff/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          contact_name: contactName,
          phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('ff_access_token', data.tokens.access);
        localStorage.setItem('ff_refresh_token', data.tokens.refresh);
        navigate('/ff-portal');
      } else {
        setError(data.error || 'Error al registrar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#0D3A5C] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#00C9B7] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#0D3A5C] flex items-center justify-center p-4">
        <div className="bg-[#0D2E4D] rounded-2xl p-8 w-full max-w-md border border-red-500">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-3xl">!</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Invitación Inválida</h1>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#0D3A5C] flex items-center justify-center p-4">
      <div className="bg-[#0D2E4D] rounded-2xl p-8 w-full max-w-md border border-[#1E4A6D]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-[#0A2540] text-2xl font-bold">FF</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Registro Freight Forwarder</h1>
          <p className="text-gray-400 mt-2">{invitationData?.company_name}</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={invitationData?.email || ''}
              disabled
              className="w-full bg-[#1E4A6D]/50 border border-[#2D5A7D] rounded-lg px-4 py-3 text-gray-400"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Nombre de Contacto</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-3 text-white"
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-3 text-white"
              placeholder="+593 99 123 4567"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-3 text-white"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded-lg px-4 py-3 text-white"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={registering}
            className="w-full bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {registering ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
};

const FFDashboard = ({ user, onLogout }: { user: FFUser; onLogout: () => void }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<MilestoneUpdate[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getToken = () => localStorage.getItem('ff_access_token');

  const fetchShipments = useCallback(async () => {
    try {
      const response = await fetch('/api/sales/ff/dashboard/', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setShipments(data.shipments);
      }
    } catch (error) {
      console.error('Error loading shipments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleMilestoneChange = (milestoneId: number, field: 'actual_date' | 'notes', value: string) => {
    setPendingUpdates((prev) => {
      const existing = prev.find((u) => u.milestone_id === milestoneId);
      if (existing) {
        return prev.map((u) =>
          u.milestone_id === milestoneId ? { ...u, [field]: value } : u
        );
      }
      return [...prev, { milestone_id: milestoneId, [field]: value }];
    });
  };

  const saveUpdates = async () => {
    if (pendingUpdates.length === 0) {
      setMessage({ type: 'error', text: 'No hay cambios para guardar' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/sales/ff/milestones/update/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates: pendingUpdates }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setPendingUpdates([]);
        fetchShipments();
        setSelectedShipment(null);
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al guardar' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#0D3A5C] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#00C9B7] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#0D3A5C]">
      <header className="bg-[#0D2E4D] border-b border-[#1E4A6D] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00C9B7] to-[#A4FF00] rounded-lg flex items-center justify-center">
              <span className="text-[#0A2540] font-bold">FF</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Portal Freight Forwarder</h1>
              <p className="text-sm text-gray-400">{user.company_name}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500 text-green-400'
                : 'bg-red-500/20 border border-red-500 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
            <p className="text-gray-400 text-sm">Embarques Asignados</p>
            <p className="text-3xl font-bold text-white mt-2">{shipments.length}</p>
          </div>
          <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
            <p className="text-gray-400 text-sm">Pendientes de Actualizar</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">
              {shipments.filter((s) => s.progress_percent < 100).length}
            </p>
          </div>
          <div className="bg-[#0D2E4D] rounded-xl p-6 border border-[#1E4A6D]">
            <p className="text-gray-400 text-sm">Completados</p>
            <p className="text-3xl font-bold text-[#00C9B7] mt-2">
              {shipments.filter((s) => s.progress_percent === 100).length}
            </p>
          </div>
        </div>

        {selectedShipment ? (
          <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
            <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedShipment.ro_number}</h2>
                <p className="text-gray-400">{selectedShipment.consignee_name}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedShipment(null);
                  setPendingUpdates([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                Volver
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {selectedShipment.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-lg border ${
                      milestone.status === 'COMPLETED'
                        ? 'bg-[#00C9B7]/10 border-[#00C9B7]/30'
                        : 'bg-[#1E4A6D]/30 border-[#1E4A6D]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          milestone.status === 'COMPLETED'
                            ? 'bg-[#00C9B7] text-[#0A2540]'
                            : 'bg-[#1E4A6D] text-gray-400'
                        }`}
                      >
                        {milestone.milestone_order}
                      </div>
                      <span className="text-white font-medium">{milestone.milestone_name}</span>
                      {milestone.status === 'COMPLETED' && (
                        <span className="text-[#00C9B7] text-sm">Completado</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Fecha Real</label>
                        <input
                          type="datetime-local"
                          defaultValue={milestone.actual_date?.slice(0, 16) || ''}
                          onChange={(e) =>
                            handleMilestoneChange(milestone.id, 'actual_date', e.target.value)
                          }
                          className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded px-3 py-2 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Notas</label>
                        <input
                          type="text"
                          defaultValue={milestone.notes}
                          onChange={(e) =>
                            handleMilestoneChange(milestone.id, 'notes', e.target.value)
                          }
                          placeholder="Agregar notas..."
                          className="w-full bg-[#1E4A6D] border border-[#2D5A7D] rounded px-3 py-2 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setSelectedShipment(null);
                    setPendingUpdates([]);
                  }}
                  className="px-6 py-3 text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveUpdates}
                  disabled={saving || pendingUpdates.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-[#00C9B7] to-[#A4FF00] text-[#0A2540] font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : `Guardar Cambios (${pendingUpdates.length})`}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0D2E4D] rounded-xl border border-[#1E4A6D] overflow-hidden">
            <div className="p-4 bg-[#1E4A6D]/30 border-b border-[#1E4A6D]">
              <h2 className="text-xl font-bold text-white">Embarques Asignados</h2>
            </div>
            {shipments.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400">No tienes embarques asignados actualmente.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1E4A6D]">
                {shipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="p-4 hover:bg-[#1E4A6D]/20 cursor-pointer transition-colors"
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{shipment.ro_number}</p>
                        <p className="text-gray-400 text-sm">{shipment.consignee_name}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-[#1E4A6D] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#00C9B7] to-[#A4FF00]"
                                style={{ width: `${shipment.progress_percent}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-400 text-sm">{shipment.progress_percent}%</span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">
                            {shipment.completed_milestones}/{shipment.total_milestones} hitos
                          </p>
                        </div>
                        <span className="text-[#00C9B7]">→</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const FFPortal = () => {
  const [searchParams] = useSearchParams();
  const isRegister = searchParams.get('token') !== null;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<FFUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('ff_access_token');
    if (token && !isRegister) {
      fetch('/api/accounts/check/', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user?.role === 'freight_forwarder') {
            setIsAuthenticated(true);
            setUser(data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('ff_access_token');
          localStorage.removeItem('ff_refresh_token');
        });
    }
  }, [isRegister]);

  const handleLogin = (token: string, userData: FFUser) => {
    localStorage.setItem('ff_access_token', token);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('ff_access_token');
    localStorage.removeItem('ff_refresh_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (isRegister) {
    return <FFRegisterPage />;
  }

  if (isAuthenticated && user) {
    return <FFDashboard user={user} onLogout={handleLogout} />;
  }

  return <FFLoginPage onLogin={handleLogin} />;
};

export default FFPortal;
