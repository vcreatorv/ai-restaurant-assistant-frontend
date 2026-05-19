import { apiFetch } from "./client";
import type { AnalyticsPeriod, ApiAdminDashboard, ApiAdminAnalytics } from "./types";

export function adminGetDashboard(period: AnalyticsPeriod): Promise<ApiAdminDashboard> {
  return apiFetch<ApiAdminDashboard>(`/admin/dashboard?period=${encodeURIComponent(period)}`);
}

export function adminGetAnalytics(period: AnalyticsPeriod): Promise<ApiAdminAnalytics> {
  return apiFetch<ApiAdminAnalytics>(`/admin/analytics?period=${encodeURIComponent(period)}`);
}
