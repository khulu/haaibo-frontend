import useAxios from './useAxios';
import getAuth from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export type ReservationDto = {
  id: string;
  markerId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  locationId: string;
  locationName?: string;
  markerName?: string;
  status?: string;
  date: string; // ISO date (YYYY-MM-DD)
  // API may return start/end in different casings; keep both optional for compatibility
  startTime?: string; // ISO datetime or time string
  endTime?: string; // ISO datetime or time string
  Start?: string;
  End?: string;
  start?: string;
  end?: string;
  checkIn?: string; // ISO datetime when user checked in
  checkOut?: string; // ISO datetime when user checked out
  companyId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateReservationDto = {
  markerId: string;
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string;
  endTime: string;
};

export type AvailabilityResponse = {
  markerId: string;
  booked: boolean;
};

export type MarkerAvailability = {
  markerId: string;
  markerName: string;
  type: 0 | 1; // 0 = desk, 1 = meeting room
  xPosition: number;
  yPosition: number;
  active: boolean;
  isAvailable: boolean;
  isMyBooking: boolean;
  isOccupied: boolean;
  reservations: ReservationDto[];
};

export type MostUsedMarker = { markerId: string; markerName: string; count: number };
export type HourBucket = { day: number; hour: number; count: number };
export type ReservationSummaryDto = {
  totalBookings: number;
  totalHoursBooked: number;
  totalHoursUsed: number;
  checkedInCount: number;
  cancelledCount: number;
  noShowCount: number;
  averageBookingDurationMinutes: number;
  checkinRatePercent: number;
  mostUsedMarkers: MostUsedMarker[];
  buckets: HourBucket[];
  from: string;
  to: string;
};

const useReservationsApi = () => {
  const { request } = useAxios();
  const auth = getAuth();
  const token = auth.getToken();

  const getReservations = async (params?: {
    companyId?: string;
    locationId?: string;
    date?: string;
    userId?: string;
  }): Promise<ReservationDto[]> => {
    const response = await request({
      baseURL,
      // endpoint provided by the API controller
      url: '/locations/reservations',
      method: 'GET',
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as ReservationDto[];
  };

  const getMarkerAvailability = async (
    locationId: string,
    date: string,
    startTime?: string,
    endTime?: string
  ): Promise<AvailabilityResponse[]> => {
    const params: Record<string, string> = { date };
    if (startTime) params.start = startTime;
    if (endTime) params.end = endTime;
    
    const response = await request({
      baseURL,
      url: `/locations/${locationId}/availability`,
      method: 'GET',
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as AvailabilityResponse[];
  };

  const createReservation = async (
    locationId: string,
    payload: CreateReservationDto
  ): Promise<ReservationDto> => {
    const response = await request({
      baseURL,
      url: `/locations/${locationId}/reservations`,
      method: 'POST',
      data: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as ReservationDto;
  };

  const deleteReservation = async (id: string): Promise<void> => {
    await request({
      baseURL,
      url: `/reservations/${id}`,
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const getMyReservations = async (): Promise<ReservationDto[]> => {
    const response = await request({
      baseURL,
      url: '/reservations/me',
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as ReservationDto[];
  };

  const exportReservations = async (
    format: 'csv' | 'pdf',
    params?: { companyId?: string; locationId?: string; userId?: string; date?: string }
  ): Promise<Blob> => {
    const response = await request({
      baseURL,
      url: '/reports/reservations/export',
      method: 'POST',
      params: { format },
      data: params || {},
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as Blob;
  };

  const getReservationSummary = async (params: { userId?: string; companyId?: string; locationId?: string; dateFrom?: string; dateTo?: string }): Promise<ReservationSummaryDto> => {
    const response = await request({
      baseURL,
      url: '/reports/reservations/summary',
      method: 'GET',
      params: {
        ...(params.userId ? { userId: params.userId } : {}),
        ...(params.companyId ? { companyId: params.companyId } : {}),
        ...(params.locationId ? { locationId: params.locationId } : {}),
        ...(params.dateFrom ? { dateFrom: params.dateFrom } : {}),
        ...(params.dateTo ? { dateTo: params.dateTo } : {}),
      },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.status === 401) throw new Error('Unauthorized');
    return response.data as ReservationSummaryDto;
  };

  const getUserUpcomingReservations = async (userId: string, take?: number): Promise<ReservationDto[]> => {
    const response = await request({
      baseURL,
      url: `/Users/${userId}/reservations/upcoming`,
      method: 'GET',
      params: typeof take === 'number' ? { take } : {},
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.status === 401) throw new Error('Unauthorized');
    return response.data as ReservationDto[];
  };

  return {
    getReservations,
    getMarkerAvailability,
    createReservation,
    deleteReservation,
    getMyReservations,
    exportReservations,
    getReservationSummary,
    getUserUpcomingReservations,
  };
};

export default useReservationsApi;
