import useAxios from './useAxios';
import getAuth from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export type ReservationDto = {
  id: string;
  markerId: string;
  userId: string;
  userName?: string;
  locationId: string;
  locationName?: string;
  markerName?: string;
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string; // ISO datetime or time string
  endTime: string; // ISO datetime or time string
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

const useReservationsApi = () => {
  const axios = useAxios();
  const auth = getAuth();
  const token = auth.getToken();

  const getReservations = async (params?: {
    locationId?: string;
    date?: string;
    userId?: string;
  }): Promise<ReservationDto[]> => {
    const response = await axios.request({
      baseURL,
      url: '/reservations',
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
  ): Promise<MarkerAvailability[]> => {
    const params: Record<string, string> = { date };
    if (startTime) params.start = startTime;
    if (endTime) params.end = endTime;
    
    const response = await axios.request({
      baseURL,
      url: `/locations/${locationId}/availability`,
      method: 'GET',
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as MarkerAvailability[];
  };

  const createReservation = async (
    locationId: string,
    payload: CreateReservationDto
  ): Promise<ReservationDto> => {
    const response = await axios.request({
      baseURL,
      url: `/locations/${locationId}/reservations`,
      method: 'POST',
      data: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as ReservationDto;
  };

  const deleteReservation = async (id: string): Promise<void> => {
    await axios.request({
      baseURL,
      url: `/reservations/${id}`,
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const getMyReservations = async (): Promise<ReservationDto[]> => {
    const response = await axios.request({
      baseURL,
      url: '/reservations/me',
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as ReservationDto[];
  };

  return {
    getReservations,
    getMarkerAvailability,
    createReservation,
    deleteReservation,
    getMyReservations,
  };
};

export default useReservationsApi;
