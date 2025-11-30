import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Search, ChevronUp, ChevronDown, X, Save, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Lead {
  id: number;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  status?: string;
  is_active_importer?: boolean;
  ruc?: string;
}

export default function LeadsManagement() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'company' | 'date' | 'status'>('company');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const ecuadorCities = [
    'Guayaquil', 'Quito', 'Santo Domingo', 'Cuenca', 'Ambato', 'Portoviejo', 'Machala',
    'Riobamba', 'Manta', 'Durán', 'Loja', 'Esmeraldas', 'Quevedo', 'Milagro', 'Ibarra',
    'Latacunga', 'La Libertad', 'Babahoyo', 'Tulcán', 'Huaquillas', 'Nueva Loja', 'Santa Rosa', 'Guaranda'
  ];

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterAndSortLeads();
  }, [leads, searchTerm, sortBy, sortOrder]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/sales/leads/');
      const leadsData = response.data.results || response.data || [];
      setLeads(leadsData);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let compareA = '';
      let compareB = '';

      if (sortBy === 'company') {
        compareA = a.company_name.toLowerCase();
        compareB = b.company_name.toLowerCase();
      } else if (sortBy === 'date') {
        compareA = a.id.toString();
        compareB = b.id.toString();
      } else if (sortBy === 'status') {
        compareA = a.status || '';
        compareB = b.status || '';
      }

      if (sortOrder === 'asc') {
        return compareA.localeCompare(compareB);
      } else {
        return compareB.localeCompare(compareA);
      }
    });

    setFilteredLeads(filtered);
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLead({ ...lead });
    setShowEditModal(true);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;

    if (!editingLead.phone && !editingLead.whatsapp) {
      setEditError('Debes ingresar al menos un teléfono o número de WhatsApp');
      return;
    }

    try {
      setEditLoading(true);
      await apiClient.patch(`/api/sales/leads/${editingLead.id}/`, editingLead);
      setLeads(leads.map(l => l.id === editingLead.id ? editingLead : l));
      setShowEditModal(false);
      setEditingLead(null);
    } catch (error: any) {
      setEditError(error.response?.data?.detail || 'Error al actualizar lead');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (leadId: number) => {
    setConfirmDeleteId(leadId);
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteId === null) return;

    try {
      setDeleteLoading(true);
      await apiClient.delete(`/api/sales/leads/${confirmDeleteId}/`);
      setLeads(leads.filter(l => l.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleSort = (column: 'company' | 'date' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (column: 'company' | 'date' | 'status') => {
    if (sortBy !== column) return <ChevronUp className="h-4 w-4 opacity-30" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-deep-ocean">Gestionar Leads</h1>
          <button
            onClick={() => navigate('/crear-lead')}
            className="flex items-center gap-2 bg-aqua-flow text-white px-4 py-2 rounded-lg hover:bg-aqua-flow/90"
          >
            <Plus className="h-5 w-5" />
            Crear Nuevo Lead
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por empresa, contacto, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow focus:border-aqua-flow"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">Cargando leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            {leads.length === 0 ? 'No hay leads registrados' : 'No se encontraron resultados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => toggleSort('company')}
                      className="flex items-center gap-2 font-semibold text-gray-900 hover:text-aqua-flow"
                    >
                      Empresa {renderSortIcon('company')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Contacto</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Teléfono</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Ciudad</th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => toggleSort('status')}
                      className="flex items-center gap-2 font-semibold text-gray-900 hover:text-aqua-flow"
                    >
                      Estado {renderSortIcon('status')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{lead.company_name}</td>
                    <td className="px-6 py-4 text-gray-700">{lead.first_name} {lead.last_name}</td>
                    <td className="px-6 py-4 text-gray-700 truncate">{lead.email}</td>
                    <td className="px-6 py-4 text-gray-700">{lead.phone || lead.whatsapp || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{lead.city || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        lead.status === 'nuevo' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'contactado' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'calificado' ? 'bg-green-100 text-green-800' :
                        lead.status === 'perdido' ? 'bg-red-100 text-red-800' :
                        lead.status === 'convertido' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status === 'nuevo' ? 'Nuevo' :
                         lead.status === 'contactado' ? 'Contactado' :
                         lead.status === 'calificado' ? 'Calificado' :
                         lead.status === 'perdido' ? 'Perdido' :
                         lead.status === 'convertido' ? 'Convertido' :
                         lead.status || 'Nuevo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(lead)}
                          className="p-2 text-aqua-flow hover:bg-aqua-flow/10 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(lead.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-deep-ocean">Editar Lead</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {editError && (
                  <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-red-800 flex gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>{editError}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                    <input
                      type="text"
                      value={editingLead.company_name}
                      onChange={(e) => setEditingLead({ ...editingLead, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombres</label>
                    <input
                      type="text"
                      value={editingLead.first_name}
                      onChange={(e) => setEditingLead({ ...editingLead, first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
                    <input
                      type="text"
                      value={editingLead.last_name}
                      onChange={(e) => setEditingLead({ ...editingLead, last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editingLead.email}
                      onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={editingLead.phone || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-aqua-flow ${
                        !editingLead.phone && !editingLead.whatsapp ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                    <input
                      type="tel"
                      value={editingLead.whatsapp || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, whatsapp: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-aqua-flow ${
                        !editingLead.phone && !editingLead.whatsapp ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                    <select
                      value={editingLead.city || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow"
                    >
                      <option value="">Selecciona una ciudad</option>
                      {ecuadorCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <select
                      value={editingLead.status || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aqua-flow"
                    >
                      <option value="nuevo">Nuevo</option>
                      <option value="contactado">Contactado</option>
                      <option value="calificado">Calificado</option>
                      <option value="perdido">Perdido</option>
                      <option value="convertido">Convertido a Oportunidad</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSaveEdit}
                    disabled={editLoading}
                    className="flex-1 bg-aqua-flow text-white py-2 rounded-lg font-medium hover:bg-aqua-flow/90 disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    <Save className="h-5 w-5" />
                    {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-deep-ocean mb-4">Confirmar Eliminación</h2>
              <p className="text-gray-700 mb-6">¿Estás seguro de que deseas eliminar este lead? Esta acción no se puede deshacer.</p>
              <div className="flex gap-4">
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400"
                >
                  {deleteLoading ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
