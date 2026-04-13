/**
 * Página: EmployeesPage.tsx
 * Descripción: Gestión de empleados de la fábrica (cortadores, soladores, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, Search, Edit2, Shield, ShieldOff, 
  Mail, Phone, CreditCard, Loader2, AlertCircle,
  CheckCircle2, XCircle, UserPlus, Scissors,
  Hammer, Layers, Footprints, ShieldCheck
} from 'lucide-react';
import { getAllUsers, updateUser, type UpdateUserRequest } from '../services/adminApi';
import { getTypeDocuments } from '@/api/type-documents';
import type { UserResponse, TypeDocument } from '@/types/auth';
import CreateUserForm from '../components/CreateUserForm';
import StatusConfirmModal from '../components/StatusConfirmModal';
import { useAuth } from '@/hooks/useAuth';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOccupation, setFilterOccupation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Estado para el modal de edición
  const [selectedEmployee, setSelectedEmployee] = useState<UserResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [typeDocuments, setTypeDocuments] = useState<TypeDocument[]>([]);
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});

  // Estado para el modal de estado (activar/desactivar)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [employeeToToggle, setEmployeeToToggle] = useState<UserResponse | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  const { user: currentUser } = useAuth();

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllUsers('employee');
      setEmployees(data);
    } catch {
      console.error('Error loading employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    getTypeDocuments().then(setTypeDocuments).catch(() => {});
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.name + ' ' + emp.last_name + ' ' + emp.email).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOccupation = filterOccupation === 'all' || emp.occupation === filterOccupation;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? emp.is_active : !emp.is_active);
    return matchesSearch && matchesOccupation && matchesStatus;
  });

  const handleEditClick = (emp: UserResponse) => {
    setSelectedEmployee(emp);
    setEditForm({
      name: emp.name,
      last_name: emp.last_name,
      phone: emp.phone || '',
      identity_document: emp.identity_document || '',
      identity_document_type_id: emp.identity_document_type_id || undefined,
      occupation: emp.occupation || '',
      is_active: emp.is_active
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    setIsUpdating(true);
    try {
      const updated = await updateUser(selectedEmployee.id.toString(), editForm);
      setEmployees(prev => prev.map(emp => emp.id === updated.id ? updated : emp));
      setIsEditModalOpen(false);
    } catch {
      alert('Error al actualizar el empleado.');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleStatus = (emp: UserResponse) => {
    // Prevenir auto-desactivación
    if (currentUser && emp.id === currentUser.id) {
      alert('Por seguridad, no puedes desactivar tu propia cuenta de administrador.');
      return;
    }
    setEmployeeToToggle(emp);
    setIsStatusModalOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!employeeToToggle) return;
    
    setIsStatusLoading(true);
    const newStatus = !employeeToToggle.is_active;
    
    try {
      const updated = await updateUser(employeeToToggle.id.toString(), { is_active: newStatus });
      setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
      setIsStatusModalOpen(false);
    } catch {
      alert('Error al cambiar el estado del empleado.');
    } finally {
      setIsStatusLoading(false);
      setEmployeeToToggle(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Gestión de Empleados
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors">
            Administra el personal de la fábrica, asigna cargos y controla el acceso.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-blue-500/20 active:scale-95 btn-pulse"
        >
          <UserPlus size={18} />
          Nuevo Empleado
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 transition-all duration-300">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
        
        <div>
          <select
            value={filterOccupation}
            onChange={(e) => setFilterOccupation(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="all">Todas las ocupaciones</option>
            <option value="jefe">Jefe</option>
            <option value="cortador">Cortador</option>
            <option value="guarnecedor">Guarnecedor</option>
            <option value="solador">Solador</option>
            <option value="emplantillador">Emplantillador</option>
          </select>
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
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
            <p>Cargando nómina de empleados...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No se encontraron empleados</p>
            <p className="text-sm">Prueba con otros filtros o términos de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Empleado</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id.toString()} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all ${emp.is_active ? 'bg-blue-600 dark:bg-blue-500 animate-pulse' : 'bg-gray-400 dark:bg-gray-600'}`}>
                          {emp.name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 transition-colors">{emp.name} {emp.last_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <CreditCard className="w-3 h-3" />
                            {emp.identity_document || 'Sin documento'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2 font-medium">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {emp.email}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2 font-medium">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {emp.phone || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        let Icon = Shield;
                        let colorClass = 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700';
                        
                        switch (emp.occupation) {
                          case 'cortador': Icon = Scissors; colorClass = 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50'; break;
                          case 'guarnecedor': Icon = Layers; colorClass = 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50'; break;
                          case 'solador': Icon = Hammer; colorClass = 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'; break;
                          case 'emplantillador': Icon = Footprints; colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'; break;
                          case 'jefe': Icon = ShieldCheck; colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50'; break;
                        }

                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass} transition-colors`}>
                            <Icon className="w-3 h-3" />
                            {emp.occupation ? emp.occupation.charAt(0).toUpperCase() + emp.occupation.slice(1) : 'Sin cargo'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {emp.is_active ? (
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
                          onClick={() => handleEditClick(emp)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar información"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(emp)}
                          disabled={currentUser?.id === emp.id}
                          className={`p-2 rounded-lg transition-colors ${
                            currentUser?.id === emp.id 
                              ? 'opacity-20 cursor-not-allowed' 
                              : emp.is_active 
                                ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' 
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={currentUser?.id === emp.id ? 'No puedes desactivar tu propia cuenta' : (emp.is_active ? 'Desactivar cuenta' : 'Activar cuenta')}
                        >
                          {emp.is_active ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Actualizar Empleado</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-8 space-y-5 bg-white dark:bg-slate-900 transition-colors">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Nombre</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Apellido</label>
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
                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Teléfono</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Tipo Doc.</label>
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
                  <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Nro. Documento</label>
                  <input
                    type="text"
                    value={editForm.identity_document}
                    onChange={(e) => setEditForm({...editForm, identity_document: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                  <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Cargo / Ocupación</label>
                  <select
                    value={editForm.occupation}
                    onChange={(e) => setEditForm({...editForm, occupation: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  >
                  <option value="jefe">Jefe</option>
                  <option value="cortador">Cortador</option>
                  <option value="guarnecedor">Guarnecedor</option>
                  <option value="solador">Solador</option>
                  <option value="emplantillador">Emplantillador</option>
                </select>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] btn-pulse"
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Registrar Nuevo Empleado</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[80vh] custom-scrollbar bg-white dark:bg-slate-900 transition-colors">
              <CreateUserForm 
                userType="employee" 
                typeDocuments={typeDocuments} 
                onSuccess={() => {
                  fetchEmployees();
                  // No cerramos el modal automáticamente por si quiere ver el mensaje de éxito
                  // Opcional: setTimeout(() => setIsCreateModalOpen(false), 2000);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Estado */}
      <StatusConfirmModal
        isOpen={isStatusModalOpen}
        employee={employeeToToggle}
        loading={isStatusLoading}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => {
          setIsStatusModalOpen(false);
          setEmployeeToToggle(null);
        }}
      />
    </div>
  );
}
