import useAxios from './useAxios';
import useAuthApi from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export type ContactDto = {
  id: string;
  fullName: string;
  phone?: string | null;
  companyId: string;
  companyName?: string;
  notes?: string | null;
};

export type CreateContactDto = {
  fullName: string;
  phone?: string | null;
  companyId: string;
  notes?: string | null;
};

export type UpdateContactDto = {
  fullName: string;
  phone?: string | null;
  notes?: string | null;
};

export type BulkUploadResultDto<T> = {
  success: T[];
  errors: Array<{ data: T; error: string }>;
};

const useContactsApi = () => {
  const axios = useAxios();
  const auth = useAuthApi();

  const authHeader = () => {
    const token = auth.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const listContacts = async (companyId?: string) => {
    const cid = companyId || (auth.getCompanyId() as string);
    const response = await axios.request({
      baseURL,
      url: `/contacts`,
      method: 'GET',
      params: { companyId: cid },
      headers: { ...authHeader() },
    });
    return response.data as ContactDto[];
  };

  const getContactById = async (id: string) => {
    const response = await axios.request({
      baseURL,
      url: `/contacts/${id}`,
      method: 'GET',
      headers: { ...authHeader() },
    });
    return response.data as ContactDto;
  };

  const createContact = async (payload: CreateContactDto) => {
    const response = await axios.request({
      baseURL,
      url: `/contacts`,
      method: 'POST',
      data: payload,
      headers: { ...authHeader() },
    });
    return response.data as ContactDto;
  };

  const updateContact = async (id: string, payload: UpdateContactDto) => {
    const response = await axios.request({
      baseURL,
      url: `/contacts/${id}`,
      method: 'PUT',
      data: payload,
      headers: { ...authHeader() },
    });
    return response.data as ContactDto;
  };

  const deleteContact = async (id: string) => {
    const response = await axios.request({
      baseURL,
      url: `/contacts/${id}`,
      method: 'DELETE',
      headers: { ...authHeader() },
    });
    return response.data as { success: boolean };
  };

  const bulkUploadContacts = async (companyId: string, payload: CreateContactDto[]) => {
    const response = await axios.request({
      baseURL,
      url: `/contacts/bulk-upload`,
      method: 'POST',
      params: { companyId },
      data: payload,
      headers: { ...authHeader() },
    });
    return response.data as BulkUploadResultDto<CreateContactDto>;
  };

  const getContactsTotal = async (companyId?: string) => {
    const cid = companyId || (auth.getCompanyId() as string);
    const response = await axios.request({
      baseURL,
      url: `/contacts/total`,
      method: 'GET',
      params: { companyId: cid },
      headers: { ...authHeader() },
    });
    return response.data as { total: number };
  };

  return {
    listContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact,
    bulkUploadContacts,
    getContactsTotal,
  };
};

export default useContactsApi;