/**
 * EmployeeBadgeCountsContext — conteos para badges del sidebar de empleado.
 * Polling cada 30s desde endpoints del empleado.
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getEmployeeTasks,
  getAvailableTasks,
  getEmployeeIncidences,
  getProductIncidences,
} from '../services/employeeApi';

export interface EmployeeBadgeCounts {
  tareasPendientes: number;
  tareasDisponibles: number;
  incidencias: number;
}

interface ContextValue {
  counts: EmployeeBadgeCounts;
  refresh: () => void;
}

const EmployeeBadgeCountsContext = createContext<ContextValue>({
  counts: { tareasPendientes: 0, tareasDisponibles: 0, incidencias: 0 },
  refresh: () => {},
});

export function EmployeeBadgeCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<EmployeeBadgeCounts>({
    tareasPendientes: 0,
    tareasDisponibles: 0,
    incidencias: 0,
  });

  const refresh = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        getEmployeeTasks(),
        getAvailableTasks(),
        getEmployeeIncidences({ state: 'abierta' }),
        getProductIncidences(),
      ]);

      let tareasPendientes = 0;
      if (results[0].status === 'fulfilled') {
        tareasPendientes = results[0].value.total ?? 0;
      }

      let tareasDisponibles = 0;
      if (results[1].status === 'fulfilled') {
        tareasDisponibles = results[1].value.total ?? 0;
      }

      let incidencias = 0;
      if (results[2].status === 'fulfilled') {
        incidencias += results[2].value.total ?? 0;
      }
      if (results[3].status === 'fulfilled') {
        // Count only pending product incidences
        const productInc = results[3].value;
        if (Array.isArray(productInc.incidences)) {
          incidencias += productInc.incidences.filter(
            (i: { status?: string }) => i.status === 'pending',
          ).length;
        } else {
          incidencias += productInc.total ?? 0;
        }
      }

      setCounts({ tareasPendientes, tareasDisponibles, incidencias });
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <EmployeeBadgeCountsContext.Provider value={{ counts, refresh }}>
      {children}
    </EmployeeBadgeCountsContext.Provider>
  );
}

export function useEmployeeBadgeCounts() {
  return useContext(EmployeeBadgeCountsContext);
}
