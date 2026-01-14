import useAxios from './useAxios';
import getAuth from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export type IssueDto = {
  id: string;
  assetId: string;
  companyId: string;
  description: string;
  priority: number;
  priorityName: string;
  status: number;
  statusName: string;
  reportedByUserId: string;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  attachmentUrls: string[];
};

export type CreateIssueDto = {
  assetId: string;
  companyId: string;
  description: string;
  priority: number; // 1..4
  attachmentKeys?: string[]; // optional
};

export type UpdateIssueStatusDto = {
  status: number;
  resolutionNote?: string;
};

const useIssuesApi = () => {
  const axios = useAxios();
  const auth = getAuth();
  const token = auth.getToken();

  const listIssues = async (params?: { companyId?: string; assetId?: string; openOnly?: boolean }): Promise<IssueDto[]> => {
    const response = await axios.request({
      baseURL,
      url: '/issues',
      method: 'GET',
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as IssueDto[];
  };

  const getIssueById = async (id: string): Promise<IssueDto> => {
    const response = await axios.request({
      baseURL,
      url: `/issues/${id}`,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as IssueDto;
  };

  const createIssue = async (payload: CreateIssueDto): Promise<IssueDto> => {
    const response = await axios.request({
      baseURL,
      url: '/issues',
      method: 'POST',
      data: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      validateStatus: (s) => s >= 200 && s < 500,
    });
    if (response.status === 401) throw new Error('Unauthorized');
    if (response.status >= 400) {
      const raw = response.data as unknown;
      const msg = (raw as { message?: string } | null)?.message || 'Failed to create issue';
      throw new Error(msg);
    }
    return response.data as IssueDto;
  };

  const updateIssueStatus = async (id: string, data: UpdateIssueStatusDto): Promise<IssueDto> => {
    const response = await axios.request({
      baseURL,
      url: `/issues/${id}/status`,
      method: 'PUT',
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      validateStatus: (s) => s >= 200 && s < 500,
    });
    if (response.status === 401) throw new Error('Unauthorized');
    if (response.status >= 400) {
      const raw = response.data as unknown;
      const msg = (raw as { message?: string } | null)?.message || 'Failed to update status';
      throw new Error(msg);
    }
    return response.data as IssueDto;
  };

  const uploadAttachments = async (id: string, files: File[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));

    const response = await axios.request({
      baseURL,
      url: `/issues/${id}/attachments`,
      method: 'POST',
      data: form,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      // Don't set Content-Type manually; browser will set boundary
    });
    return response.data as string[];
  };

  return { listIssues, getIssueById, createIssue, updateIssueStatus, uploadAttachments };
};

export default useIssuesApi;
