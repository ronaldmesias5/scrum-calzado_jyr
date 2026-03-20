/**
 * Componente: CreateUserForm.tsx
 * Descripción: Formulario compartido para crear empleados o clientes.
 */

import { useState } from 'react';
import { 
  UserPlus, CheckCircle, XCircle, Loader2, Eye, EyeOff 
} from 'lucide-react';
import { 
  createEmployee, 
  createClient, 
  type CreateEmployeeRequest, 
  type CreateClientRequest 
} from '../services/adminApi';
import type { TypeDocument } from '@/types/auth';

type UserType = 'employee' | 'client';

interface CreateUserFormProps {
  userType: UserType;
  typeDocuments: TypeDocument[];
  onSuccess?: () => void;
}

export default function CreateUserForm({ userType, typeDocuments, onSuccess }: CreateUserFormProps) {
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
        setSuccess(`Empleado ${form.name} ${form.last_name} creado correctamente.`);
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
        setSuccess(`Cliente ${form.name} ${form.last_name} creado correctamente.`);
      }

      // Limpiar formulario tras éxito
      setForm({
        email: '', name: '', last_name: '', phone: '',
        identity_document: '', identity_document_type_id: '',
        occupation: '', business_name: '', password: '', confirm_password: '',
      });
      
      if (onSuccess) onSuccess();
      
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
    <form onSubmit={handleSubmit} className="w-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        {isEmployee ? 'Datos del nuevo empleado' : 'Datos del nuevo cliente'}
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
