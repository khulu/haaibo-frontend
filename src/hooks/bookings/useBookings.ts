import { useQuery, useMutation } from '@tanstack/react-query';
import useBookingsApi, { CreateBookingsPayload, BulkBookingResult, BookingDto } from '@hooks/api/useBookingsApi';

const useBookings = () => {
  const api = useBookingsApi();

  const createBookings = useMutation<BulkBookingResult, Error, CreateBookingsPayload>({
    mutationFn: (payload) => api.createBookings(payload),
  });

  const useMyBookings = (params?: { companyId?: string; includeAssigned?: boolean; includeCreated?: boolean }) =>
    useQuery<BookingDto[]>({
      queryKey: ['bookings', 'mine', params?.companyId, params?.includeAssigned, params?.includeCreated],
      queryFn: () => api.getMyBookings(params),
    });

  return { createBookings, useMyBookings };
};

export default useBookings;
