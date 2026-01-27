import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useContactsApi, { type ContactDto, type CreateContactDto, type UpdateContactDto, type BulkUploadResultDto } from '@hooks/api/useContactsApi';

export const QueryKeyContacts = ['contacts'] as const;

const useContacts = () => {
  const api = useContactsApi();
  const qc = useQueryClient();

  const useContactsList = (companyId?: string) =>
    useQuery({
      queryKey: [...QueryKeyContacts, 'list', companyId],
      queryFn: () => api.listContacts(companyId),
    });

  const useFetchContactById = (id: string) =>
    useQuery({
      queryKey: [...QueryKeyContacts, 'single', id],
      queryFn: () => api.getContactById(id),
      enabled: !!id,
    });

  const createContact = useMutation<ContactDto, unknown, CreateContactDto>({
    mutationFn: (payload) => api.createContact(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeyContacts }),
  });

  const updateContact = useMutation<ContactDto, unknown, { id: string; data: UpdateContactDto }>({
    mutationFn: (payload) => api.updateContact(payload.id, payload.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeyContacts }),
  });

  const deleteContact = useMutation<{ success: boolean }, unknown, { id: string }>({
    mutationFn: (payload) => api.deleteContact(payload.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeyContacts }),
  });

  const bulkUpload = useMutation<BulkUploadResultDto<CreateContactDto>, unknown, { companyId: string; data: CreateContactDto[] }>({
    mutationFn: (payload) => api.bulkUploadContacts(payload.companyId, payload.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeyContacts }),
  });

  const useContactsTotal = (companyId?: string) =>
    useQuery({
      queryKey: [...QueryKeyContacts, 'total', companyId],
      queryFn: () => api.getContactsTotal(companyId),
    });

  return { useContactsList, useFetchContactById, createContact, updateContact, deleteContact, bulkUpload, useContactsTotal };
};

export default useContacts;