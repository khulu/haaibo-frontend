import useIssuesApi, { type CreateIssueDto, type UpdateIssueStatusDto } from '@hooks/api/useIssuesApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const QueryKeyIssues = ['issues'] as const;

const useIssues = () => {
  const api = useIssuesApi();
  const qc = useQueryClient();

  const useIssuesList = (params?: { companyId?: string; assetId?: string; openOnly?: boolean }) =>
    useQuery({
      queryKey: [...QueryKeyIssues, params],
      queryFn: () => api.listIssues(params),
    });

  const useFetchIssueById = (id: string) =>
    useQuery({
      queryKey: [...QueryKeyIssues, 'single', id],
      queryFn: () => api.getIssueById(id),
    });

  const createIssue = useMutation({
    mutationFn: (payload: CreateIssueDto) => api.createIssue(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeyIssues }),
  });

  const updateIssueStatus = useMutation({
    mutationFn: (payload: { id: string; data: UpdateIssueStatusDto }) => api.updateIssueStatus(payload.id, payload.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeyIssues }),
  });

  const uploadIssueAttachments = useMutation({
    mutationFn: (payload: { id: string; files: File[] }) => api.uploadAttachments(payload.id, payload.files),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeyIssues }),
  });

  return { useIssuesList, useFetchIssueById, createIssue, updateIssueStatus, uploadIssueAttachments };
};

export default useIssues;
