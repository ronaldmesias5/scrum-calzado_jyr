import { apiClient } from '@/services/apiClient';
import type {
  LossRecord,
  IncidentListResponse,
  ScrapStock,
  PendingIncidence,
  ProductIncidenceListResponse,
  CreateIncidentRequest,
  RepairRequest,
  ApprovePendingRequest,
  DefectCode,
} from '@/types/incidences';

export async function getDefectCodes(): Promise<DefectCode[]> {
  const { data } = await apiClient.get<DefectCode[]>('/scrap/defect-codes');
  return data ?? [];
}

export async function createDefectCode(body: {
  code: string;
  name: string;
  description?: string;
}): Promise<DefectCode> {
  const { data } = await apiClient.post<DefectCode>('/scrap/defect-codes', body);
  return data;
}

export async function getIncidents(params?: {
  incident_type?: string;
  product_id?: string;
  date_from?: string;
  date_to?: string;
  incidence_category?: string;
  limit?: number;
  offset?: number;
}): Promise<IncidentListResponse> {
  const { data } = await apiClient.get<IncidentListResponse>('/scrap/losses', {
    params,
  });
  return data ?? { items: [], total: 0 };
}

export async function getIncidentDetail(lossId: string): Promise<LossRecord> {
  const { data } = await apiClient.get<LossRecord>(`/scrap/losses/${lossId}`);
  return data;
}

export async function createIncident(body: CreateIncidentRequest): Promise<LossRecord> {
  const { data } = await apiClient.post<LossRecord>('/scrap/losses', body);
  return data;
}

export async function repairIncident(
  lossId: string,
  body: RepairRequest,
): Promise<LossRecord> {
  const { data } = await apiClient.patch<LossRecord>(
    `/scrap/losses/${lossId}/repair`,
    body,
  );
  return data;
}

export async function solveIncident(lossId: string): Promise<LossRecord> {
  const { data } = await apiClient.patch<LossRecord>(`/scrap/losses/${lossId}/solve`);
  return data;
}

export async function approveIncident(lossId: string): Promise<LossRecord> {
  const { data } = await apiClient.patch<LossRecord>(
    `/scrap/losses/${lossId}/approve`,
  );
  return data;
}

export async function rejectIncident(lossId: string): Promise<LossRecord> {
  const { data } = await apiClient.patch<LossRecord>(
    `/scrap/losses/${lossId}/reject`,
  );
  return data;
}

export async function getScrapStock(): Promise<ScrapStock[]> {
  const { data } = await apiClient.get<ScrapStock[]>('/scrap/stock');
  return data ?? [];
}

export async function getPendingIncidences(
  statusFilter?: string,
): Promise<ProductIncidenceListResponse> {
  const params: Record<string, string> = {};
  if (statusFilter) params.status_filter = statusFilter;
  const { data } = await apiClient.get<ProductIncidenceListResponse>(
    '/scrap/pending-incidences',
    { params },
  );
  return data ?? { incidences: [], total: 0 };
}

export async function approvePendingIncidence(
  pendingId: string,
  body: ApprovePendingRequest,
): Promise<PendingIncidence> {
  const { data } = await apiClient.post<PendingIncidence>(
    `/scrap/pending-incidences/${pendingId}/approve`,
    body,
  );
  return data;
}

export async function rejectPendingIncidence(
  pendingId: string,
): Promise<PendingIncidence> {
  const { data } = await apiClient.post<PendingIncidence>(
    `/scrap/pending-incidences/${pendingId}/reject`,
  );
  return data;
}
