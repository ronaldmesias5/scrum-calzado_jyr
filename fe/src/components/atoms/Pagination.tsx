import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl disabled:opacity-40 transition-all hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl disabled:opacity-40 transition-all hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
