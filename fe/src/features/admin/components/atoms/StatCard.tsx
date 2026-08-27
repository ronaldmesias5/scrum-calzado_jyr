import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow';
}

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue:   { bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400',   number: 'text-blue-600 dark:text-blue-400' },
    green:  { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', number: 'text-green-600 dark:text-green-400' },
    red:    { bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400',     number: 'text-red-600 dark:text-red-400' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', number: 'text-orange-600 dark:text-orange-400' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', number: 'text-purple-600 dark:text-purple-400' },
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', number: 'text-yellow-600 dark:text-yellow-400' },
  };

  const c = colorClasses[color];

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className={`text-4xl font-bold ${c.number} transition-colors duration-500`}>{value}</p>
        </div>
        <div className={`${c.bg} p-3 rounded-xl border border-transparent dark:border-white/5 transition-all shadow-sm`}>
          <div className={c.text}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
