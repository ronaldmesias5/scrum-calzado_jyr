import { useTranslation } from 'react-i18next';
import { Settings, Bell, Globe, Shield, CreditCard, Save, Smartphone, Mail, Eye, Package, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
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
        <Button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl shadow-lg hover:shadow-blue-500/20 px-8 py-2.5 font-bold transition-all active:scale-95">
          <Save className="w-5 h-5" />
          Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation / Tabs Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <SettingsTab icon={Bell} label="Notificaciones" active={true} />
          <SettingsTab icon={Globe} label="Idioma y Región" active={false} />
          <SettingsTab icon={Shield} label="Seguridad y Privacidad" active={false} />
          <SettingsTab icon={Smartphone} label="Apariencia" active={false} />
          <SettingsTab icon={CreditCard} label="Pagos y Facturación" active={false} />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 border-b border-gray-50 dark:border-slate-800 pb-4">
              Preferencias de Notificación
            </h3>
            
            <div className="space-y-6">
              <ToggleSetting 
                title="Alertas de Stock" 
                desc="Recibir notificaciones cuando un producto llegue al stock mínimo." 
                icon={Package}
                enabled={true} 
              />
              <ToggleSetting 
                title="Nuevos Pedidos" 
                desc="Notificar por correo cuando un cliente realice un nuevo pedido." 
                icon={ShoppingBag}
                enabled={true} 
              />
              <ToggleSetting 
                title="Actualizaciones de App" 
                desc="Recibir alertas sobre nuevas funciones y mejoras del sistema." 
                icon={Bell}
                enabled={false} 
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
             <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 border-b border-gray-50 dark:border-slate-800 pb-4">
               Ajustes de Stock Global
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Stock Mínimo Sugerido</label>
                 <input 
                  type="number" 
                  defaultValue={5} 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-xl outline-none font-bold transition-all" 
                 />
                 <p className="text-xs text-gray-400 font-medium tracking-tight">Valor por defecto para nuevos productos.</p>
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Unidad de Medida</label>
                 <select className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-xl outline-none font-bold transition-all uppercase appearance-none">
                    <option>Pares</option>
                    <option>Unidades</option>
                    <option>Docenas</option>
                 </select>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ icon: Icon, label, active }: any) {
  return (
    <button className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
        : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
    }`}>
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function ToggleSetting({ title, desc, icon: Icon, enabled }: any) {
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
      <button className={`w-12 h-6 rounded-full p-1 transition-colors relative ${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-800'}`}>
        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
