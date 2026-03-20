/**
 * Página: ClientsPage.tsx
 * Descripción: Gestión de clientes (tiendas, distribuidores, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  UserPlus, Search, Edit2, Shield, ShieldOff, 
  Mail, Phone, Building2, Loader2, AlertCircle,
  CheckCircle2, XCircle
} from 'lucide-react';
import { getAllUsers, updateUser, type UpdateUserRequest } from '../services/adminApi';
import { getTypeDocuments } from '@/api/type-documents';
import type { UserResponse, TypeDocument } from '@/types/auth';
import CreateUserForm from '../components/CreateUserForm';

export default function ClientsPage() {
  const [clients, setClients] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el modal de edición
  const [selectedClient, setSelectedClient] = useState<UserResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [typeDocuments, setTypeDocuments] = useState<TypeDocument[]>([]);
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllUsers('client');
      setClients(data);
    } catch {
      setError('Error al cargar la lista de clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    getTypeDocuments().then(setTypeDocuments).catch(() => {});
  }, [fetchClients]);

  const filteredClients = clients.filter(cli => {
    const matchesSearch = (cli.name + ' ' + cli.last_name + ' ' + cli.email + ' ' + (cli.business_name || '')).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? cli.is_active : !cli.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleEditClick = (cli: UserResponse) => {
    setSelectedClient(cli);
    setEditForm({
      name: cli.name,
      last_name: cli.last_name,
      phone: cli.phone || '',
      identity_document: cli.identity_document || '',
      identity_document_type_id: cli.identity_document_type_id || undefined,
      business_name: cli.business_name || '',
      is_active: cli.is_active
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    
    setIsUpdating(true);
    try {
      const updated = await updateUser(selectedClient.id.toString(), editForm);
      setClients(prev => prev.map(cli => cli.id === updated.id ? updated : cli));
      setIsEditModalOpen(false);
    } catch {
      alert('Error al actualizar el cliente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleStatus = async (cli: UserResponse) => {
    const newStatus = !cli.is_active;
    if (!confirm(`¿Estás seguro de que deseas ${newStatus ? 'activar' : 'desactivar'} a este cliente?`)) return;
    
    try {
      const updated = await updateUser(cli.id.toString(), { is_active: newStatus });
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch {
      alert('Error al cambiar el estado.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-8 h-8 text-indigo-600" />
            Gestión de Clientes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Administra la cartera de clientes, visualiza sus datos comerciales y controla su acceso.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-95"
        >
          <UserPlus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
            <p>Obteniendo listado de clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No se encontraron clientes</p>
            <p className="text-sm">Prueba con otros términos de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Cliente / Empresa</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((cli) => (
                  <tr key={cli.id.toString()} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${cli.is_active ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{cli.business_name || 'Sin nombre comercial'}</p>
                          <p className="text-xs text-gray-500">
                            {cli.name} {cli.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {cli.email}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {cli.phone || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-700 font-medium">
                        {cli.identity_document || 'Sin documento'}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase">
                        {cli.identity_document_type_name || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {cli.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-semibold border border-green-200">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-semibold border border-red-200">
                          <XCircle className="w-3 h-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(cli)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar información"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(cli)}
                          className={`p-2 rounded-lg transition-colors ${cli.is_active ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                          title={cli.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
                        >
                          {cli.is_active ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Actualizar Cliente</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Apellido</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre Comercial / Empresa</label>
                <input
                  type="text"
                  value={editForm.business_name}
                  onChange={(e) => setEditForm({...editForm, business_name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  placeholder="Ej: Calzados J&R"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo Doc.</label>
                  <select
                    value={editForm.identity_document_type_id}
                    onChange={(e) => setEditForm({...editForm, identity_document_type_id: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {typeDocuments.map(td => <option key={td.id} value={td.id}>{td.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nro. Documento</label>
                  <input
                    type="text"
                    value={editForm.identity_document}
                    onChange={(e) => setEditForm({...editForm, identity_document: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-indigo-700 text-white rounded-lg text-sm font-semibold hover:bg-indigo-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Creación */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Registrar Nuevo Cliente</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <CreateUserForm 
                userType="client" 
                typeDocuments={typeDocuments} 
                onSuccess={() => {
                  fetchClients();
                  // No cerramos el modal automáticamente por si quiere ver el mensaje de éxito
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
