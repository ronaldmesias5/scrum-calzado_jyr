import { API_URL } from '@/constants/api';

const API_BASE = API_URL.replace(/\/api\/v1\/?$/, '');

export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/uploads/')) {
    const filename = url.replace('/uploads/', '');
    return `${API_BASE}/api/v1/uploads/${filename}`;
  }
  if (url.startsWith('http://localhost:8000/uploads/') || url.startsWith('http://10.0.2.2:8000/uploads/')) {
    const filename = url.replace(/https?:\/\/[^/]+/, '');
    return `${API_BASE}${filename}`;
  }
  return url;
}
