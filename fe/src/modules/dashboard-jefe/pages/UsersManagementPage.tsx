/**
 * Página: UsersManagementPage.tsx
 * Descripción: Página de gestión de usuarios (validación, creación, roles).
 * ¿Para qué? Validar clientes, crear empleados/admin.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck, UserPlus, Clock, CheckCircle, XCircle,
  Loader2, Users, ShieldCheck, Trash2, RefreshCw, RotateCcw
} from 'lucide-react';
import {
  getPendingUsers,
  getAllUsers,
  validateUser,
  rejectUser,
  deleteUser,
  getReactivationTickets,
  approveReactivation,
  rejectReactivation,
  renewInvitation,
  type ReactivationTicket,
} from '../services/adminApi';
import { getTypeDocuments } from '@/api/type-documents';
import type { UserResponse, TypeDocument } from '@/types/auth';
import CreateUserForm from '../components/CreateUserForm';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';

// ────────────────────────────────────────────────
// Tipos locales
// ────────────────────────────────────────────────

type Tab = 'pending' | 'manage' | 'create-employee' | 'create-client' | 'reactivation';

// ────────────────────────────────────────────────
// Sub-componente: Tab de cuentas pendientes
// ────────────────────────────────────────────────

function PendingUsersTab() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [userToReject, setUserToReject] = useState<UserResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
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
      showToast('Cuenta aprobada correctamente', 'success');
    } catch {
      setError('Error al aprobar la cuenta. Inténtalo de nuevo.');
      showToast('Error al aprobar la cuenta', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!userToReject || !rejectReason.trim()) return;
    const userId = userToReject.id.toString();
    setRejectingId(userId);
    setRejectError(null);
    try {
      await rejectUser(userId, rejectReason.trim());
      setUsers((prev) => prev.filter((u) => u.id.toString() !== userId));
      setShowRejectModal(false);
      setUserToReject(null);
      setRejectReason('');
      showToast('Cuenta rechazada correctamente', 'success');
    } catch {
      setRejectError('Error al rechazar la cuenta. Inténtalo de nuevo.');
      showToast('Error al rechazar la cuenta', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  const openRejectModal = (user: UserResponse) => {
    setUserToReject(user);
    setRejectReason('');
    setRejectError(null);
    setShowRejectModal(true);
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
                              disabled={approvingId === id || rejectingId === id}
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
                              onClick={() => openRejectModal(user)}
                              disabled={approvingId === id || rejectingId === id}
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

      {showRejectModal && userToReject && (
        <Modal
          isOpen={true}
          onClose={() => setShowRejectModal(false)}
          title="Rechazar solicitud de registro"
          size="md"
        >
          <div className="p-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4 mx-auto">
              <XCircle size={32} />
            </div>
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              Vas a rechazar la cuenta de <br />
              <strong className="text-gray-900 dark:text-gray-200">{userToReject.email}</strong>.
            </p>

            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Motivo del rechazo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explica el motivo por el cual se rechaza esta solicitud..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all resize-none"
            />
            <span className="text-[10px] text-gray-400 text-right block mt-0.5">{rejectReason.length}/500</span>

            {rejectError && (
              <p className="mt-2 text-sm text-red-600">{rejectError}</p>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={rejectingId !== null || !rejectReason.trim()}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98]"
              >
                {rejectingId ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  'Rechazar cuenta'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Sub-componente: Tab de gestión de todos los usuarios
// ────────────────────────────────────────────────

function ManageUsersTab() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewedCreds, setRenewedCreds] = useState<{ email: string; tempPassword: string } | null>(null);

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
      showToast('Usuario eliminado correctamente', 'success');
    } catch {
      setError('Error al eliminar el usuario. Inténtalo de nuevo.');
      showToast('Error al eliminar el usuario', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRenew = async (userId: string) => {
    setRenewingId(userId);
    try {
      const updatedUser = await renewInvitation(userId);
      setUsers((prev) => prev.map((u) => u.id.toString() === userId ? updatedUser : u));
      setRenewedCreds({ email: updatedUser.email, tempPassword: updatedUser.temporary_password || '' });
      setShowRenewModal(true);
      showToast('Invitación renovada correctamente', 'success');
    } catch {
      showToast('Error al renovar la invitación', 'error');
    } finally {
      setRenewingId(null);
    }
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
                <th className="px-4 py-4">Invitación</th>
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
                      {(() => {
                        if (!user.must_change_password) {
                          return <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase"><CheckCircle size={12} /> Completada</span>;
                        }
                        if (!user.invitation_expires_at) {
                          return <span className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase">—</span>;
                        }
                        const expired = new Date(user.invitation_expires_at).getTime() < Date.now();
                        if (expired) {
                          return <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase"><XCircle size={12} /> Expirada</span>;
                        }
                        return <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase"><Clock size={12} /> Válida</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.must_change_password && user.invitation_expires_at && new Date(user.invitation_expires_at).getTime() < Date.now() && (
                        <button
                          onClick={() => handleRenew(user.id.toString())}
                          disabled={renewingId === id}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-60"
                        >
                          {renewingId === id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <RotateCcw size={12} />
                          )}
                          Renovar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showConfirmDelete && userToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setShowConfirmDelete(false)}
          title="¿Eliminar cuenta?"
          size="sm"
        >
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-6 mx-auto">
              <Trash2 size={32} />
            </div>
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
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98]"
              >
                {deletingId ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  'Eliminar ahora'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showRenewModal && renewedCreds && (
        <Modal
          isOpen={true}
          onClose={() => { setShowRenewModal(false); setRenewedCreds(null); }}
          title="Invitación renovada"
          size="md"
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-4 mx-auto">
              <CheckCircle size={32} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Se ha generado una nueva contraseña temporal para:
            </p>
            <p className="font-bold text-gray-900 dark:text-gray-100 mb-4">{renewedCreds.email}</p>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Nueva contraseña temporal</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-gray-200 dark:border-slate-700">
                  {renewedCreds.tempPassword}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(renewedCreds.tempPassword)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Copiar
                </button>
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-6">
              Esta contraseña se mostrará solo una vez. El usuario deberá cambiarla al iniciar sesión. La invitación expira en 24 horas.
            </p>
            <button
              onClick={() => { setShowRenewModal(false); setRenewedCreds(null); }}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Sub-componente: Tab de tickets de reactivación (RF-005)
// ────────────────────────────────────────────────

function ReactivationTicketsTab() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<ReactivationTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ReactivationTicket | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReactivationTickets();
      setTickets(data);
    } catch {
      setError('No se pudieron cargar los tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openAction = (ticket: ReactivationTicket, type: 'approve' | 'reject') => {
    setSelectedTicket(ticket);
    setActionType(type);
    setComment('');
    setActionError(null);
    setShowActionModal(true);
  };

  const handleAction = async () => {
    if (!selectedTicket || !comment.trim()) return;
    const ticketId = selectedTicket.id;
    setProcessingId(ticketId);
    setActionError(null);
    try {
      if (actionType === 'approve') {
        await approveReactivation(ticketId, comment.trim());
      } else {
        await rejectReactivation(ticketId, comment.trim());
      }
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setShowActionModal(false);
      setSelectedTicket(null);
      setComment('');
      showToast(actionType === 'approve' ? 'Reactivación aprobada correctamente' : 'Reactivación rechazada correctamente', 'success');
    } catch {
      setActionError('Error al procesar el ticket. Inténtalo de nuevo.');
      showToast('Error al procesar el ticket', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" />
        Cargando tickets...
      </div>
    );
  }

  const pendingTickets = tickets.filter((t) => t.status === 'pending');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 transition-colors">
          Solicitudes de reactivación
        </h3>
        <button
          onClick={fetchTickets}
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

      {pendingTickets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <RotateCcw size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay solicitudes de reactivación pendientes</p>
          <p className="text-sm mt-1">Todas las solicitudes han sido revisadas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 text-left font-bold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Teléfono</th>
                <th className="px-4 py-4">Documento</th>
                <th className="px-4 py-4">Motivo</th>
                <th className="px-4 py-4">Solicitado</th>
                <th className="px-4 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {pendingTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-100">{ticket.email}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400 font-medium">{ticket.phone}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400 font-medium">{ticket.identity_document}</td>
                  <td className="px-4 py-4 text-gray-500 dark:text-gray-400 text-xs max-w-[250px] truncate" title={ticket.reason}>
                    {ticket.reason}
                  </td>
                  <td className="px-4 py-4 text-gray-400 dark:text-gray-500 text-xs font-bold">
                    {new Date(ticket.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button
                        onClick={() => openAction(ticket, 'approve')}
                        disabled={processingId === ticket.id}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-60"
                      >
                        {processingId === ticket.id && actionType === 'approve' ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Aprobar
                      </button>
                      <button
                        onClick={() => openAction(ticket, 'reject')}
                        disabled={processingId === ticket.id}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-60"
                      >
                        <XCircle size={14} />
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showActionModal && selectedTicket && (
        <Modal
          isOpen={true}
          onClose={() => setShowActionModal(false)}
          title={actionType === 'approve' ? 'Aprobar reactivación' : 'Rechazar reactivación'}
          size="md"
        >
          <div className="p-4">
            <div className={`w-16 h-16 ${actionType === 'approve' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'} rounded-full flex items-center justify-center mb-4 mx-auto`}>
              {actionType === 'approve' ? <CheckCircle size={32} /> : <XCircle size={32} />}
            </div>
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-2 leading-relaxed">
              {actionType === 'approve' ? 'Vas a aprobar la reactivación de' : 'Vas a rechazar la reactivación de'}
            </p>
            <p className="text-center font-bold text-gray-900 dark:text-gray-200 mb-1">{selectedTicket.email}</p>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 mb-4 text-xs text-gray-500 dark:text-gray-400">
              <p><strong>Motivo del usuario:</strong></p>
              <p className="mt-1">{selectedTicket.reason}</p>
            </div>

            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Comentario <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={actionType === 'approve' ? 'Ej: Cuenta reactivada tras verificar documentación...' : 'Ej: La solicitud no cumple con los requisitos porque...'}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none"
            />
            <span className="text-[10px] text-gray-400 text-right block mt-0.5">{comment.length}/500</span>

            {actionError && (
              <p className="mt-2 text-sm text-red-600">{actionError}</p>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAction}
                disabled={processingId !== null || !comment.trim()}
                className={`flex-1 px-4 py-3 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                }`}
              >
                {processingId ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : actionType === 'approve' ? (
                  'Aprobar reactivación'
                ) : (
                  'Rechazar reactivación'
                )}
              </button>
            </div>
          </div>
        </Modal>
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
  { id: 'reactivation', label: 'Reactivaciones', icon: RotateCcw },
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
      <div className="stagger-reveal">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
          <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Gestión de Usuarios
        </h1>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar stagger-reveal">
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
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-sm transition-all duration-300 stagger-reveal">
        {activeTab === 'pending' && <PendingUsersTab />}
        {activeTab === 'manage' && <ManageUsersTab />}
        {activeTab === 'reactivation' && <ReactivationTicketsTab />}
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
