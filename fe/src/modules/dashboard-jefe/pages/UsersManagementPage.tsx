/**
 * Página: UsersManagementPage.tsx
 * Descripción: Página de gestión de usuarios (validación, creación, roles).
 * ¿Para qué? Validar clientes, crear empleados/admin.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck, UserPlus, Clock, CheckCircle, XCircle,
  ChevronRight, Eye, EyeOff, Loader2, Users,
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
// Sub-componente: Formulario crear usuario
// ────────────────────────────────────────────────

type UserType = 'employee' | 'client';

interface CreateUserFormProps {
  userType: UserType;
  typeDocuments: TypeDocument[];
}

function CreateUserForm({ userType, typeDocuments }: CreateUserFormProps) {
  const isEmployee = userType === 'employee';

  const [form, setForm] = useState({
    email: '',
    name: '',
    last_name: '',
    phone: '',
    identity_document: '',
    identity_document_type_id: '',
    occupation: '',
    business_name: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirm_password) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      if (isEmployee) {
        const payload: CreateEmployeeRequest = {
          email: form.email,
          name: form.name,
          last_name: form.last_name,
          occupation: form.occupation as CreateEmployeeRequest['occupation'],
          password: form.password,
          ...(form.phone && { phone: form.phone }),
          ...(form.identity_document && { identity_document: form.identity_document }),
          ...(form.identity_document_type_id && {
            identity_document_type_id: form.identity_document_type_id,
          }),
        };
        await createEmployee(payload);
        setSuccess(`Empleado ${form.name} ${form.last_name} creado correctamente. Deberá cambiar su contraseña al iniciar sesión.`);
      } else {
        const payload: CreateClientRequest = {
          email: form.email,
          name: form.name,
          last_name: form.last_name,
          password: form.password,
          ...(form.phone && { phone: form.phone }),
          ...(form.identity_document && { identity_document: form.identity_document }),
          ...(form.identity_document_type_id && {
            identity_document_type_id: form.identity_document_type_id,
          }),
          ...(form.business_name && { business_name: form.business_name }),
        };
        await createClient(payload);
        setSuccess(`Cliente ${form.name} ${form.last_name} creado correctamente. Deberá cambiar su contraseña al iniciar sesión.`);
      }

      // Limpiar formulario tras éxito
      setForm({
        email: '', name: '', last_name: '', phone: '',
        identity_document: '', identity_document_type_id: '',
        occupation: '', business_name: '', password: '', confirm_password: '',
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Error al crear la cuenta. Verifica los datos e inténtalo de nuevo.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        {isEmployee ? 'Crear cuenta de empleado' : 'Crear cuenta de cliente'}
      </h3>

      {success && (
        <div className="mb-5 flex items-start gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          <CheckCircle size={16} className="mt-0.5 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-5 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <XCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Ej: Carlos"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Apellido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            required
            placeholder="Ej: Gómez"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="correo@ejemplo.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+57 300 000 0000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tipo documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
          <select
            name="identity_document_type_id"
            value={form.identity_document_type_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Seleccionar...</option>
            {typeDocuments.map((td) => (
              <option key={td.id.toString()} value={td.id.toString()}>
                {td.name}
              </option>
            ))}
          </select>
        </div>

        {/* Número documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de documento</label>
          <input
            type="text"
            name="identity_document"
            value={form.identity_document}
            onChange={handleChange}
            placeholder="1234567890"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Campo específico por tipo */}
        {isEmployee ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ocupación *</label>
            <select
              name="occupation"
              value={form.occupation}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Seleccionar...</option>
              <option value="cortador">Cortador</option>
              <option value="guarnecedor">Guarnecedor</option>
              <option value="solador">Solador</option>
              <option value="emplantillador">Emplantillador</option>
              <option value="jefe">Jefe</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre comercial</label>
            <input
              type="text"
              name="business_name"
              value={form.business_name}
              onChange={handleChange}
              placeholder="Ej: Calzados López"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Mín. 8 caracteres"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña *</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirm_password"
            value={form.confirm_password}
            onChange={handleChange}
            required
            placeholder="Repite la contraseña"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
        ⚠️ El {isEmployee ? 'empleado' : 'cliente'} deberá cambiar su contraseña al iniciar sesión por primera vez.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <UserPlus size={16} />
        )}
        {loading ? 'Creando cuenta...' : `Crear ${isEmployee ? 'empleado' : 'cliente'}`}
      </button>
    </form>
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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
        <p className="text-gray-500 text-sm mt-1">
          Aprueba solicitudes pendientes y crea cuentas de empleados o clientes.
        </p>
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
