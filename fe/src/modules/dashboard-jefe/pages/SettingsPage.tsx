// SettingsPage
import { useState, useEffect } from 'react';
import {
  Settings, Bell, Globe, Shield, Save, Smartphone, Package,
  ShoppingBag, Eye, EyeOff, Lock, LogOut, Sun, Moon, Type, LayoutGrid,
  Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Palette, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { changePassword } from '@/modules/auth/services/api';
import i18n from '@/i18n';

// ─── Types ───────────────────────────────────────────────────────────────────
type TabId = 'notifications' | 'language' | 'security' | 'appearance';

interface NotifSettings { stockAlerts: boolean; newOrders: boolean; appUpdates: boolean; }
interface StockSettings { minStock: number; unitMeasure: string; }
interface LangSettings { language: string; timezone: string; dateFormat: string; currency: string; }
interface AppearanceSettings { compactView: boolean; fontSize: string; }

function loadPref<T>(key: string, def: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}

export default function SettingsPage() {
  // const { t } = useTranslation();

  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('notifications');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Notifications ──
  const [notif, setNotif] = useState<NotifSettings>(() =>
    loadPref('cfg_notif', { stockAlerts: true, newOrders: true, appUpdates: false })
  );
  const [stock, setStock] = useState<StockSettings>(() =>
    loadPref('cfg_stock', { minStock: 5, unitMeasure: 'Pares' })
  );

  // ── Language ──
  const [lang, setLang] = useState<LangSettings>(() =>
    loadPref('cfg_lang', {
      language: i18n.language?.startsWith('en') ? 'en' : 'es',
      timezone: 'America/Bogota',
      dateFormat: 'DD/MM/YYYY',
      currency: 'COP',
    })
  );

  // ── Appearance ──
  const [appearance, setAppearance] = useState<AppearanceSettings>(() =>
    loadPref('cfg_appearance', { compactView: false, fontSize: 'base' })
  );

  // ── Security ──
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState(() =>
    loadPref('cfg_sessionTimeout', '60')
  );

  // Apply font size to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (appearance.fontSize !== 'base') root.classList.add(`text-${appearance.fontSize}`);
  }, [appearance.fontSize]);

  function handleSave() {
    try {
      localStorage.setItem('cfg_notif', JSON.stringify(notif));
      localStorage.setItem('cfg_stock', JSON.stringify(stock));
      localStorage.setItem('cfg_lang', JSON.stringify(lang));
      localStorage.setItem('cfg_appearance', JSON.stringify(appearance));
      localStorage.setItem('cfg_sessionTimeout', JSON.stringify(sessionTimeout));
      // Apply language
      i18n.changeLanguage(lang.language);
      setSaved(true);
      setSaveError('');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError('No se pudieron guardar los cambios.');
    }
  }

  async function handleChangePassword() {
    if (!pwForm.next || !pwForm.current) {
      setPwMsg({ type: 'err', text: 'Completa todos los campos.' });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: 'err', text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    if (pwForm.next.length < 8) {
      setPwMsg({ type: 'err', text: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      await changePassword({ current_password: pwForm.current, new_password: pwForm.next });
      setPwMsg({ type: 'ok', text: 'Contraseña actualizada correctamente.' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Error al cambiar la contraseña.';
      setPwMsg({ type: 'err', text: msg });
    } finally {
      setPwLoading(false);
    }
  }

  const TABS: { id: TabId; icon: any; label: string }[] = [
    { id: 'notifications', icon: Bell,       label: 'Notificaciones'      },
    { id: 'language',      icon: Globe,       label: 'Idioma y Región'     },
    { id: 'security',      icon: Shield,      label: 'Seguridad y Privacidad' },
    { id: 'appearance',    icon: Smartphone,  label: 'Apariencia'          },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <Settings className="w-8 h-8 text-orange-600" />
            Configuración del Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Gestiona las preferencias globales de tu plataforma
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl shadow-lg hover:shadow-blue-500/20 px-8 py-2.5 font-bold transition-all active:scale-95"
          >
            <Save className="w-5 h-5" />
            Guardar Cambios
          </Button>
          {saved && (
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Cambios guardados
            </span>
          )}
          {saveError && (
            <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {saveError}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {TABS.map(t => (
            <SettingsTab
              key={t.id}
              icon={t.icon}
              label={t.label}
              active={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
            />
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── NOTIFICACIONES ── */}
          {activeTab === 'notifications' && (
            <>
              <Card title="Preferencias de Notificación">
                <div className="space-y-6">
                  <ToggleSetting
                    icon={Package}
                    title="Alertas de Stock"
                    desc="Recibir notificaciones cuando un producto llegue al stock mínimo."
                    enabled={notif.stockAlerts}
                    onToggle={() => setNotif(p => ({ ...p, stockAlerts: !p.stockAlerts }))}
                  />
                  <ToggleSetting
                    icon={ShoppingBag}
                    title="Nuevos Pedidos"
                    desc="Notificar cuando un cliente realice un nuevo pedido."
                    enabled={notif.newOrders}
                    onToggle={() => setNotif(p => ({ ...p, newOrders: !p.newOrders }))}
                  />
                  <ToggleSetting
                    icon={Bell}
                    title="Actualizaciones de App"
                    desc="Recibir alertas sobre nuevas funciones y mejoras del sistema."
                    enabled={notif.appUpdates}
                    onToggle={() => setNotif(p => ({ ...p, appUpdates: !p.appUpdates }))}
                  />
                </div>
              </Card>

              <Card title="Ajustes de Stock Global">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Stock Mínimo Sugerido</label>
                    <input
                      type="number"
                      min={1}
                      value={stock.minStock}
                      onChange={e => setStock(p => ({ ...p, minStock: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-xl outline-none font-bold transition-all"
                    />
                    <p className="text-xs text-gray-400 font-medium tracking-tight">Valor por defecto para nuevos productos.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Unidad de Medida</label>
                    <SelectField
                      value={stock.unitMeasure}
                      onChange={v => setStock(p => ({ ...p, unitMeasure: v }))}
                      options={['Pares', 'Unidades', 'Docenas']}
                    />
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* ── IDIOMA Y REGIÓN ── */}
          {activeTab === 'language' && (
            <Card title="Idioma y Región">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" /> Idioma de la Interfaz
                  </label>
                  <SelectField
                    value={lang.language === 'en' ? 'Inglés' : 'Español'}
                    onChange={v => setLang(p => ({ ...p, language: v === 'Inglés' ? 'en' : 'es' }))}
                    options={['Español', 'Inglés']}
                  />
                  <p className="text-xs text-gray-400">Cambia el idioma del sistema.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Zona Horaria
                  </label>
                  <SelectField
                    value={lang.timezone}
                    onChange={v => setLang(p => ({ ...p, timezone: v }))}
                    options={['America/Bogota', 'America/Lima', 'America/Mexico_City', 'America/New_York', 'Europe/Madrid']}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Formato de Fecha</label>
                  <SelectField
                    value={lang.dateFormat}
                    onChange={v => setLang(p => ({ ...p, dateFormat: v }))}
                    options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']}
                  />
                  <p className="text-xs text-gray-400">Ejemplo: {new Date().toLocaleDateString('es-CO')}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Moneda</label>
                  <SelectField
                    value={lang.currency}
                    onChange={v => setLang(p => ({ ...p, currency: v }))}
                    options={['COP', 'USD', 'EUR', 'MXN', 'PEN']}
                  />
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                  Los cambios de idioma se aplican al hacer clic en <strong>Guardar Cambios</strong>.
                </p>
              </div>
            </Card>
          )}

          {/* ── SEGURIDAD Y PRIVACIDAD ── */}
          {activeTab === 'security' && (
            <>
              <Card title="Cambiar Contraseña">
                <div className="space-y-4">
                  <PwField
                    label="Contraseña Actual"
                    value={pwForm.current}
                    show={showPw.current}
                    onChange={v => setPwForm(p => ({ ...p, current: v }))}
                    onToggleShow={() => setShowPw(p => ({ ...p, current: !p.current }))}
                  />
                  <PwField
                    label="Nueva Contraseña"
                    value={pwForm.next}
                    show={showPw.next}
                    onChange={v => setPwForm(p => ({ ...p, next: v }))}
                    onToggleShow={() => setShowPw(p => ({ ...p, next: !p.next }))}
                  />
                  <PwField
                    label="Confirmar Nueva Contraseña"
                    value={pwForm.confirm}
                    show={showPw.confirm}
                    onChange={v => setPwForm(p => ({ ...p, confirm: v }))}
                    onToggleShow={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                  />

                  {pwForm.next && (
                    <PasswordStrength password={pwForm.next} />
                  )}

                  {pwMsg && (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                      pwMsg.type === 'ok'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                      {pwMsg.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {pwMsg.text}
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={pwLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all active:scale-95"
                  >
                    {pwLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {pwLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </div>
              </Card>

              <Card title="Sesión y Acceso">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" /> Tiempo de Inactividad para Cerrar Sesión
                    </label>
                    <SelectField
                      value={sessionTimeout}
                      onChange={setSessionTimeout}
                      options={['15', '30', '60', '120', '240']}
                      display={v => `${v} minutos`}
                    />
                    <p className="text-xs text-gray-400">La sesión se cerrará automáticamente tras este tiempo sin actividad.</p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">Información de Sesión</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                          Sesión activa como <strong>{user ? `${user.name} ${user.last_name}` : '—'}</strong> · Rol: {user?.role_name?.toUpperCase() || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Tokens almacenados en sessionStorage (se eliminan al cerrar el navegador).</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* ── APARIENCIA ── */}
          {activeTab === 'appearance' && (
            <Card title="Apariencia del Sistema">
              <div className="space-y-6">
                {/* Tema */}
                <div className="flex items-center justify-between gap-4 group">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                      {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">Modo Oscuro</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Actualmente en modo <strong>{theme === 'dark' ? 'oscuro' : 'claro'}</strong>.
                      </p>
                    </div>
                  </div>
                  <Toggle enabled={theme === 'dark'} onToggle={toggleTheme} />
                </div>

                <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
                  <ToggleSetting
                    icon={LayoutGrid}
                    title="Vista Compacta"
                    desc="Reduce el espaciado para mostrar más información en pantalla."
                    enabled={appearance.compactView}
                    onToggle={() => setAppearance(p => ({ ...p, compactView: !p.compactView }))}
                  />
                </div>

                <div className="border-t border-gray-100 dark:border-slate-800 pt-6 space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Type className="w-4 h-4 text-blue-500" /> Tamaño de Fuente
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { val: 'sm', label: 'Pequeña' },
                      { val: 'base', label: 'Normal' },
                      { val: 'lg', label: 'Grande' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setAppearance(p => ({ ...p, fontSize: opt.val }))}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                          appearance.fontSize === opt.val
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">Se aplica inmediatamente al seleccionar.</p>
                </div>

                {/* Preview */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> Vista Previa
                  </p>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl space-y-1">
                    <p className="font-extrabold text-gray-900 dark:text-white">Calzado JyR — Sistema de Gestión</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Esta es una línea de ejemplo en tamaño normal.</p>
                    <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-bold">
                      Etiqueta de ejemplo
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SettingsTab({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
          : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 border-b border-gray-50 dark:border-slate-800 pb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full p-1 transition-colors relative flex-shrink-0 ${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}

function ToggleSetting({
  title, desc, icon: Icon, enabled, onToggle,
}: { title: string; desc: string; icon: any; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 group">
      <div className="flex gap-4 items-start">
        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">{title}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{desc}</p>
        </div>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

function SelectField({
  value, onChange, options, display,
}: { value: string; onChange: (v: string) => void; options: string[]; display?: (v: string) => string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-xl outline-none font-bold transition-all appearance-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o} value={o}>{display ? display(o) : o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function PwField({
  label, value, show, onChange, onToggleShow,
}: { label: string; value: string; show: boolean; onChange: (v: string) => void; onToggleShow: () => void }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-xl outline-none font-bold transition-all"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= 8,         label: '8+ caracteres' },
    { ok: /[A-Z]/.test(password),       label: 'Mayúscula' },
    { ok: /[0-9]/.test(password),       label: 'Número' },
    { ok: /[^A-Za-z0-9]/.test(password),label: 'Símbolo' },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const labels = ['Muy débil', 'Débil', 'Moderada', 'Fuerte'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-colors ${i < score ? colors[score - 1] : 'bg-gray-200 dark:bg-slate-700'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {checks.map(c => (
            <span key={c.label} className={`text-xs font-semibold ${c.ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        <span className={`text-xs font-bold ${score >= 3 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
          {labels[score - 1] ?? ''}
        </span>
      </div>
    </div>
  );
}
