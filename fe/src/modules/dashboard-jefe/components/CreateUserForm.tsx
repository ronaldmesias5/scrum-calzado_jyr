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
    <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-slate-900 transition-colors">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
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
          <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 transition-colors">Nombre *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Ej: Carlos"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>

        {/* Apellido */}
        <div>
          <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 transition-colors">Apellido *</label>
          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            required
            placeholder="Ej: Gómez"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>

        {/* Email */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 transition-colors">Correo electrónico *</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="correo@ejemplo.com"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 transition-colors">Teléfono</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+57 300 000 0000"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>

        {/* Tipo documento */}
        <div>
          <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 transition-colors">Tipo de documento</label>
          <select
            name="identity_document_type_id"
            value={form.identity_document_type_id}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          >
            <option value="" className="dark:bg-slate-900">Seleccionar...</option>
            {typeDocuments.map((td) => (
              <option key={td.id.toString()} value={td.id.toString()}>
                {td.name}
              </option>
            ))}
          </select>
        </div>

        {/* Número documento */}
        <div>
          <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 transition-colors">Número de documento</label>
          <input
            type="text"
            name="identity_document"
            value={form.identity_document}
            onChange={handleChange}
            placeholder="1234567890"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>

        {/* Campo específico por tipo */}
        {isEmployee ? (
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 transition-colors">Ocupación *</label>
            <select
              name="occupation"
              value={form.occupation}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            >
              <option value="" className="dark:bg-slate-900">Seleccionar...</option>
              <option value="cortador">Cortador</option>
              <option value="guarnecedor">Guarnecedor</option>
              <option value="solador">Solador</option>
              <option value="emplantillador">Emplantillador</option>
              <option value="jefe">Jefe</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 transition-colors">Nombre comercial</label>
            <input
              type="text"
              name="business_name"
              value={form.business_name}
              onChange={handleChange}
              placeholder="Ej: Calzados López"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>
        )}

        {/* Contraseña */}
        <div>
          <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 transition-colors">Contraseña *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Mín. 8 caracteres"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
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
          <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 transition-colors">Confirmar contraseña *</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirm_password"
            value={form.confirm_password}
            onChange={handleChange}
            required
            placeholder="Repite la contraseña"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>
      </div>

      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 px-4 py-3 rounded-xl transition-all">
        ⚠️ El {isEmployee ? 'empleado' : 'cliente'} deberá cambiar su contraseña al iniciar sesión por primera vez.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="mt-8 flex items-center justify-center gap-3 px-8 py-3.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] disabled:opacity-60 grow-0 w-full sm:w-auto btn-pulse"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={20} />}
        {isEmployee ? 'CREAR EMPLEADO' : 'CREAR CLIENTE'}
      </button>
    </form>
  );
}
