/**
 * Página: UsersManagementPage.tsx
 * Descripción: Página de gestión de usuarios (validación, creación, roles).
 * ¿Para qué? Validar clientes, crear empleados/admin.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck, UserPlus, Clock, CheckCircle, XCircle,
  Loader2, Users, ShieldCheck, Trash2, RefreshCw
} from 'lucide-react';
import {
  getPendingUsers,
  getAllUsers,
  validateUser,
  deleteUser,
} from '../services/adminApi';
import { getTypeDocuments } from '@/api/type-documents';
import type { UserResponse, TypeDocument } from '@/types/auth';
import CreateUserForm from '../components/CreateUserForm';

// ────────────────────────────────────────────────
// Tipos locales
// ────────────────────────────────────────────────

type Tab = 'pending' | 'manage' | 'create-employee' | 'create-client';

// ────────────────────────────────────────────────
// Sub-componente: Tab de cuentas pendientes
// ────────────────────────────────────────────────

function PendingUsersTab() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingUsers();
      setUsers(data);
    } catch {
      setError('No se pudieron cargar los usuarios pendientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    try {
      await validateUser(userId);
      setSuccessIds((prev) => new Set(prev).add(userId));
      setUsers((prev) => prev.filter((u) => u.id.toString() !== userId));
    } catch {
      setError('Error al aprobar la cuenta. Inténtalo de nuevo.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setDeletingId(userId);
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id.toString() !== userId));
      setShowConfirmDelete(false);
      setUserToDelete(null);
    } catch {
      setError('Error al rechazar la cuenta. Inténtalo de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteConfirm = (user: UserResponse) => {
    setUserToDelete(user);
    setShowConfirmDelete(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" />
        Cargando solicitudes...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 transition-colors">
          Cuentas pendientes de aprobación
        </h3>
        <button
          onClick={fetchPending}
          className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UserCheck size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay cuentas pendientes de aprobación</p>
          <p className="text-sm mt-1">Todas las solicitudes están al día.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 text-left font-bold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-4">Nombre</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Empresa</th>
                <th className="px-4 py-4">Teléfono</th>
                <th className="px-4 py-4">Registro</th>
                <th className="px-4 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const id = user.id.toString();
                const approved = successIds.has(id);
                return (
                  <tr key={id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-100">
                      {user.name} {user.last_name}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400 font-medium">{user.email}</td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400 font-medium">{user.business_name || '—'}</td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400 font-medium">{user.phone || '—'}</td>
                    <td className="px-4 py-4 text-gray-400 dark:text-gray-500 text-xs font-bold">
                      {new Date(user.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        {approved ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
                            <CheckCircle size={14} /> Aprobado
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(user.id.toString())}
                              disabled={approvingId === id || deletingId === id}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-60"
                            >
                              {approvingId === id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              Aprobar
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(user)}
                              disabled={approvingId === id || deletingId === id}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-60"
                            >
                              <XCircle size={14} />
                              Rechazar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Confirmación de Rechazo */}
      {showConfirmDelete && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-6 mx-auto">
                <XCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2 tracking-tight">
                ¿Rechazar solicitud?
              </h3>
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                Estás a punto de rechazar y eliminar la cuenta de <br />
                <strong className="text-gray-900 dark:text-gray-200">{userToDelete.email}</strong>.<br />
                Esta acción no se puede deshacer.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleReject(userToDelete.id.toString())}
                  disabled={deletingId !== null}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] btn-pulse"
                >
                  {deletingId ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Sí, Rechazar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Sub-componente: Tab de gestión de todos los usuarios
// ────────────────────────────────────────────────

function ManageUsersTab() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (userId: string) => {
    setDeletingId(userId);
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id.toString() !== userId));
      setShowConfirmDelete(false);
      setUserToDelete(null);
    } catch {
      setError('Error al eliminar el usuario. Inténtalo de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteConfirm = (user: UserResponse) => {
    setUserToDelete(user);
    setShowConfirmDelete(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" />
        Cargando usuarios...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 transition-colors">
          Listado general de cuentas
        </h3>
        <button
          onClick={fetchUsers}
          className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay usuarios registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 text-left font-bold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-4">Nombre</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Rol / Cargo</th>
                <th className="px-4 py-4">Estado</th>
                <th className="px-4 py-4">Consentimiento</th>
                <th className="px-4 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const id = user.id.toString();
                return (
                  <tr key={id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-100">
                      {user.name} {user.last_name}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400 font-medium">{user.email}</td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400 font-bold">
                      <span className="capitalize">{user.role_name}</span>
                      {user.occupation && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({user.occupation})</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                        user.is_active 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50' 
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'
                      }`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.accepted_terms ? (
                        <div className="flex flex-col">
                          <div className="flex items-center text-green-600 dark:text-green-400 gap-1.5">
                            <CheckCircle size={14} />
                            <span className="text-[11px] font-bold leading-none">Aceptado</span>
                          </div>
                          {user.terms_accepted_at && (
                            <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 leading-none font-bold">
                              {new Date(user.terms_accepted_at as string).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-400 dark:text-gray-600 gap-1.5 font-bold">
                          <XCircle size={14} />
                          <span className="text-[11px]">No registrado</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openDeleteConfirm(user)}
                        disabled={deletingId === id || user.role_name === 'admin'}
                        title={user.role_name === 'admin' ? "No se puede eliminar un administrador" : "Eliminar usuario"}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showConfirmDelete && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-6 mx-auto">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2 tracking-tight">
                ¿Eliminar cuenta?
              </h3>
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                Estás a punto de eliminar a <br />
                <strong className="text-gray-900 dark:text-gray-200">{userToDelete.email}</strong>.<br />
                Esta acción es irreversible y se perderá todo acceso.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(userToDelete.id.toString())}
                  disabled={deletingId !== null}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] btn-pulse"
                >
                  {deletingId ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Eliminar ahora'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Página principal
// ────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'pending', label: 'Soli. Pendientes', icon: Clock },
  { id: 'manage', label: 'Gestionar Usuarios', icon: Users },
  { id: 'create-employee', label: 'Crear empleado', icon: UserPlus },
  { id: 'create-client', label: 'Crear cliente', icon: UserPlus },
];

export default function UsersManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [typeDocuments, setTypeDocuments] = useState<TypeDocument[]>([]);

  useEffect(() => {
    getTypeDocuments()
      .then(setTypeDocuments)
      .catch(() => {/* No bloquear si falla */ });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
          <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Gestión de Usuarios
        </h1>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar">
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-2 w-max min-w-full shadow-inner transition-colors">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === id
                  ? 'bg-white dark:bg-blue-600 text-blue-800 dark:text-white shadow-lg scale-[1.02]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido del tab */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-sm transition-all duration-300">
        {activeTab === 'pending' && <PendingUsersTab />}
        {activeTab === 'manage' && <ManageUsersTab />}
        {activeTab === 'create-employee' && (
          <div className="max-w-3xl mx-auto">
            <CreateUserForm userType="employee" typeDocuments={typeDocuments} />
          </div>
        )}
        {activeTab === 'create-client' && (
          <div className="max-w-3xl mx-auto">
            <CreateUserForm userType="client" typeDocuments={typeDocuments} />
          </div>
        )}
      </div>
    </div>
  );
}
