/**
 * Página: ClientsPage.tsx
 * Descripción: Gestión de clientes (tiendas, distribuidores, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Phone, Edit2, Shield, ShieldOff, CheckCircle2, XCircle, AlertCircle, UserPlus, Loader2 } from 'lucide-react';
import { getAllUsers, updateUser, type UpdateUserRequest } from '../services/adminApi';
import { getTypeDocuments } from '@/api/type-documents';
import type { UserResponse, TypeDocument } from '@/types/auth';
import CreateUserForm from '../components/CreateUserForm';

export default function ClientsPage() {
  const [clients, setClients] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
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
      console.error('Error loading clients');
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
    try {
      const updated = await updateUser(cli.id.toString(), { is_active: newStatus });
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch {
      // Error handling integrated in UI would be better, but for now avoiding alert
      console.error('Error al cambiar el estado.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Gestión de Clientes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors">
            Administra la cartera de clientes y controla su acceso.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-blue-500/20 active:scale-95 btn-pulse"
        >
          <UserPlus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-300">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
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
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Información Personal</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identificación</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredClients.map((cli) => (
                  <tr key={cli.id.toString()} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">
                          {cli.name} {cli.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {cli.email}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 font-bold">
                          <Phone className="w-2.5 h-2.5" />
                          {cli.phone || 'Sin teléfono'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <p className="text-xs text-gray-700 dark:text-gray-200 font-bold">
                        {cli.identity_document || 'Sin documento'}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                        {cli.identity_document_type_name || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-2">
                      {cli.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-200 dark:border-green-900/50">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-200 dark:border-red-900/50">
                          <XCircle className="w-3 h-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(cli)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors shadow-sm"
                          title="Editar información"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(cli)}
                          className={`p-1.5 rounded-lg transition-colors shadow-sm ${cli.is_active ? 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30' : 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'}`}
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
      {isEditModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Editar Información</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-8 space-y-5 bg-white dark:bg-slate-900 transition-colors">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Nombre</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Apellido</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Nombre Comercial / Empresa</label>
                <input
                  type="text"
                  value={editForm.business_name}
                  onChange={(e) => setEditForm({...editForm, business_name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Ej: Calzados J&R"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Teléfono</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Tipo Doc.</label>
                  <select
                    value={editForm.identity_document_type_id}
                    onChange={(e) => setEditForm({...editForm, identity_document_type_id: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="" className="dark:bg-slate-800">Seleccionar...</option>
                    {typeDocuments.map(td => <option key={td.id} value={td.id} className="dark:bg-slate-800">{td.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Nro. Documento</label>
                  <input
                    type="text"
                    value={editForm.identity_document}
                    onChange={(e) => setEditForm({...editForm, identity_document: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] btn-pulse"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Registrar Nuevo Cliente</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[80vh] custom-scrollbar bg-white dark:bg-slate-900 transition-colors">
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
