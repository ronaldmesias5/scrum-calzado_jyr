/**
 * Componente: CreateUserForm.tsx
 * Descripción: Formulario compartido para crear empleados o clientes.
 * La contraseña la genera automáticamente el sistema y se envía al email del usuario.
 */

import { useState } from 'react';
import { UserPlus, CheckCircle, Loader2, Copy, KeyRound, Mail, Eye } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  createEmployee,
  createClient,
  type CreateEmployeeRequest,
  type CreateClientRequest,
} from '../services/adminApi';
import type { TypeDocument, UserResponse } from '@/types/auth';
import { getDocAbbreviation } from '@/utils/type-documents';

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
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    user: UserResponse;
    email: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCopyPassword = async () => {
    if (!success?.tempPassword) return;
    try {
      await navigator.clipboard.writeText(success.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores sin clipboard API
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);

    setLoading(true);
    try {
      let result: UserResponse;
      if (isEmployee) {
        const payload: CreateEmployeeRequest = {
          email: form.email,
          name: form.name,
          last_name: form.last_name,
          occupation: form.occupation as CreateEmployeeRequest['occupation'],
          ...(form.phone && { phone: form.phone }),
          ...(form.identity_document && { identity_document: form.identity_document }),
          ...(form.identity_document_type_id && {
            identity_document_type_id: form.identity_document_type_id,
          }),
        };
        result = await createEmployee(payload);
      } else {
        const payload: CreateClientRequest = {
          email: form.email,
          name: form.name,
          last_name: form.last_name,
          ...(form.phone && { phone: form.phone }),
          ...(form.identity_document && { identity_document: form.identity_document }),
          ...(form.identity_document_type_id && {
            identity_document_type_id: form.identity_document_type_id,
          }),
          ...(form.business_name && { business_name: form.business_name }),
        };
        result = await createClient(payload);
      }

      setSuccess({
        user: result,
        email: form.email,
        tempPassword: result.temporary_password || 'No disponible',
      });

      setForm({
        email: '', name: '', last_name: '', phone: '',
        identity_document: '', identity_document_type_id: '',
        occupation: '', business_name: '',
      });

      if (onSuccess) onSuccess();

    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Error al crear la cuenta. Verifica los datos e inténtalo de nuevo.';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const label = isEmployee ? 'empleado' : 'cliente';
    const occupationLabels: Record<string, string> = {
      cortador: 'Cortador', guarnecedor: 'Guarnecedor',
      solador: 'Solador', emplantillador: 'Emplantillador', jefe: 'Jefe',
    };

    return (
      <div className="w-full bg-white dark:bg-slate-900 transition-colors">
        <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-4 tracking-tight flex items-center gap-2">
          <CheckCircle size={22} />
          {isEmployee ? 'Empleado' : 'Cliente'} creado correctamente
        </h3>

        <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <p className="text-sm font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
            <Mail size={16} /> Credenciales enviadas a <strong>{success.email}</strong>
          </p>
          {isEmployee && success.user.occupation && (
            <p className="text-xs text-green-700 dark:text-green-400 mb-2">
              Ocupación: {occupationLabels[success.user.occupation] || success.user.occupation}
            </p>
          )}

          <div className="mt-3 p-3 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Contraseña temporal
              </span>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
              <KeyRound size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-base font-mono font-bold text-amber-800 dark:text-amber-300 tracking-wider select-all">
                {success.tempPassword}
              </span>
              <Eye size={16} className="text-amber-500 shrink-0 ml-auto" />
            </div>
          </div>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
            ⚠️ Esta contraseña se muestra solo una vez. El {label} deberá cambiarla al iniciar sesión por primera vez.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSuccess(null)}
          className="mt-6 flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] w-full sm:w-auto"
        >
          <UserPlus size={20} />
          CREAR OTRO {isEmployee ? 'EMPLEADO' : 'CLIENTE'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-slate-900 transition-colors">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
        {isEmployee ? 'Datos del nuevo empleado' : 'Datos del nuevo cliente'}
      </h3>

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
                {getDocAbbreviation(td.name)}
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
      </div>

      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 px-4 py-3 rounded-xl transition-all">
        📧 El sistema generará una contraseña automáticamente y la enviará al correo del {isEmployee ? 'empleado' : 'cliente'}.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="mt-8 flex items-center justify-center gap-3 px-8 py-3.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] disabled:opacity-60 grow-0 w-full sm:w-auto"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={20} />}
        {isEmployee ? 'CREAR EMPLEADO' : 'CREAR CLIENTE'}
      </button>
    </form>
  );
}
