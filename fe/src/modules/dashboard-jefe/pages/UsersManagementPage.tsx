/**
 * Página: UsersManagementPage.tsx
 * Descripción: Página de gestión de usuarios (validación, creación, roles).
 * ¿Para qué? Validar clientes, crear empleados/admin.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck, UserPlus, Clock, CheckCircle, XCircle,
  ChevronRight, Eye, EyeOff, Loader2, Users, ShieldCheck
} from 'lucide-react';
import {
  getPendingUsers,
  validateUser,
  createEmployee,
  createClient,
  type CreateEmployeeRequest,
  type CreateClientRequest,
} from '../services/adminApi';
import { getTypeDocuments } from '@/api/type-documents';
import type { UserResponse, TypeDocument } from '@/types/auth';
import CreateUserForm from '../components/CreateUserForm';

// ────────────────────────────────────────────────
// Tipos locales
// ────────────────────────────────────────────────

type Tab = 'pending' | 'create-employee' | 'create-client';

// ────────────────────────────────────────────────
// Sub-componente: Tab de cuentas pendientes
// ────────────────────────────────────────────────

function PendingUsersTab() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Cuentas pendientes de aprobación
        </h3>
        <button
          onClick={fetchPending}
          className="text-sm text-blue-700 hover:underline"
        >
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
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-left">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const id = user.id.toString();
                const approved = successIds.has(id);
                return (
                  <tr key={id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {user.name} {user.last_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500">{user.business_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{user.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(user.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {approved ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle size={14} /> Aprobado
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApprove(id)}
                          disabled={approvingId === id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                        >
                          {approvingId === id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle size={12} />
                          )}
                          Aprobar
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
    </div>
  );
}

// ────────────────────────────────────────────────
// Página principal
// ────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'pending', label: 'Aprobar cuentas', icon: Clock },
  { id: 'create-employee', label: 'Crear empleado', icon: Users },
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
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          Gestión de Usuarios
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
            <ChevronRight size={13} className={activeTab === id ? 'text-blue-400' : 'opacity-0'} />
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {activeTab === 'pending' && <PendingUsersTab />}
        {activeTab === 'create-employee' && (
          <CreateUserForm userType="employee" typeDocuments={typeDocuments} />
        )}
        {activeTab === 'create-client' && (
          <CreateUserForm userType="client" typeDocuments={typeDocuments} />
        )}
      </div>
    </div>
  );
}
