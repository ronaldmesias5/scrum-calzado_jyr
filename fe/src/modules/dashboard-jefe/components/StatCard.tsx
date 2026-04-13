import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow';
}

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', number: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600', number: 'text-green-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600', number: 'text-red-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', number: 'text-orange-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', number: 'text-purple-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', number: 'text-yellow-600' },
  };

  const c = colorClasses[color];

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className={`text-4xl font-bold ${c.number} dark:text-inherit transition-colors duration-500`}>{value}</p>
        </div>
        <div className={`${c.bg} dark:bg-slate-800/80 p-3 rounded-xl border border-transparent dark:border-white/5 transition-all shadow-sm`}>
          <div className={`${c.text} dark:text-white`}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
