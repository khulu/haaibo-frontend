import useAxios from './useAxios';
import getToken from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export type BookingDto = {
  id: string;
  assetId: string;
  companyId: string;
  startDate: string;
  endDate: string;
  assigneeUserId?: string;
  assigneeUserName?: string;
  externalContactName?: string;
  externalContactEmail?: string;
  externalContactPhone?: string;
  createdByUserId: string;
  notes?: string;
  createdAt: string;
};

export type BookingErrorItem = { data: unknown; error: string };
export type BulkBookingResult = {
  success: BookingDto[];
  errors: BookingErrorItem[];
};

export type CreateBookingsPayload = {
  assetIds: string[];
  startDate: string; // ISO
  endDate: string;   // ISO
  assigneeUserId?: string;
  externalContactName?: string;
  externalContactEmail?: string;
  externalContactPhone?: string;
  notes?: string;
  companyId?: string | null;
  reservationId?: string;
};


const useBookingsApi = () => {
  const axios = useAxios();
  const tokenApi = getToken();
  const token = tokenApi.getToken();

  const createBookings = async (payload: CreateBookingsPayload): Promise<BulkBookingResult> => {
    const response = await axios.request({
      baseURL,
      // Use lowercase route as per backend contract
      url: '/assets/bookings',
      method: 'POST',
      data: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      validateStatus: (status) => status >= 200 && status < 500, // allow 400 to parse errors
    });
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    if (response.status >= 400) {
      // standardize shape even for HTTP 400
      const raw = response.data as unknown;
      const maybeResult = raw as Partial<BulkBookingResult> & { message?: string };
      const baseError: BookingErrorItem = { data: raw, error: maybeResult?.message || 'Bad Request' };
      const errors: BookingErrorItem[] = Array.isArray((maybeResult as Partial<BulkBookingResult> & { errors?: unknown }).errors)
        ? ((maybeResult as Partial<BulkBookingResult> & { errors: BookingErrorItem[] }).errors)
        : [baseError];
      return { success: [], errors };
    }
    return response.data as BulkBookingResult;
  };

  const getMyBookings = async (params?: { includeAssigned?: boolean; includeCreated?: boolean; companyId?: string }): Promise<BookingDto[]> => {
    const response = await axios.request({
      baseURL,
      // Use /assets/bookings/me with optional flags
      url: '/assets/bookings/me',
      method: 'GET',
      params: {
        ...(params?.companyId ? { companyId: params.companyId } : {}),
        ...(typeof params?.includeAssigned === 'boolean' ? { includeAssigned: params.includeAssigned } : {}),
        ...(typeof params?.includeCreated === 'boolean' ? { includeCreated: params.includeCreated } : {}),
      },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    return response.data as BookingDto[];
  };

  return { createBookings, getMyBookings };
};

export default useBookingsApi;
