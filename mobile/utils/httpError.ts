import axios, { AxiosError } from 'axios';

interface ValidationDetail {
  msg?: string;
  loc?: unknown[];
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error as AxiosError<{ detail?: unknown }>).response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (item as ValidationDetail).msg ?? '')
        .filter(Boolean)
        .join('. ');
    }
    if (typeof detail === 'string' && detail.length > 0) {
      return detail;
    }
    if (typeof error.response?.data?.message === 'string') {
      return error.response.data.message;
    }
    if (!error.response) {
      return 'No se pudo conectar con el servidor';
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Ha ocurrido un error inesperado';
}