import useAxios from "./useAxios";
import getAuth from "./useAuthApi";

export interface TestGraphConnectionParams {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export interface TestGraphConnectionResult {
  ok: boolean;
  message?: string;
  details?: any;
}

export interface SyncResourcesParams {
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface SyncLog {
  ResourcesImported: number;
  ResourcesUpdated: number;
  ResourcesFailed: number;
  Status: string;
  StartedAt: string;
  CompletedAt: string;
  ErrorMessage?: string;
}

export function useResourceImportApi() {
  const { request } = useAxios();

  // Get un-plotted resources (markers)
  const getUnplottedResources = async (
    companyId: string,
    page = 1,
    pageSize = 50
  ): Promise<import("../../types/floorplan").UnplottedResponse> => {
    try {
      const token = getAuth().getToken();
      const res = await request({
        url: `/api/resources/unplotted?companyId=${encodeURIComponent(companyId)}&page=${page}&pageSize=${pageSize}`,
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return res.data;
    } catch (e: any) {
      return { total: 0, items: [] };
    }
  };

  const testGraphConnection = async (params: TestGraphConnectionParams): Promise<TestGraphConnectionResult> => {
    try {
      const token = getAuth().getToken();
      const res = await request({
        url: "/api/resources/test-graph-connection",
        method: "POST",
        data: params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return res.data;
    } catch (e: any) {
      return {
        ok: false,
        message: e?.response?.data?.message || e.message || "Unknown error",
        details: e?.response?.data,
      };
    }
  };

  const syncResources = async (
    companyId: string,
    credentials?: SyncResourcesParams
  ): Promise<SyncLog> => {
    try {
      const token = getAuth().getToken();
      const res = await request({
        url: `/api/resources/sync?companyId=${companyId}`,
        method: "POST",
        data: credentials && (credentials.tenantId || credentials.clientId || credentials.clientSecret)
          ? credentials
          : undefined,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return res.data;
    } catch (e: any) {
      return {
        ResourcesImported: 0,
        ResourcesUpdated: 0,
        ResourcesFailed: 0,
        Status: "Failed",
        StartedAt: new Date().toISOString(),
        CompletedAt: new Date().toISOString(),
        ErrorMessage: e?.response?.data?.message || e.message || "Unknown error",
      };
    }
  };

  return { testGraphConnection, syncResources, getUnplottedResources };
}
