import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import useReservationsApi from '@hooks/api/useReservationsApi';
import type { ReservationDto } from '@hooks/api/useReservationsApi';

type UpcomingParams = { userId?: string; companyId?: string; location?: string; take?: number };


const useReservations = () => {
  const api = useReservationsApi();

  const useReservationSummary = (params?: { userId?: string; companyId?: string; locationId?: string; dateFrom?: string; dateTo?: string }) =>
    useQuery({
      queryKey: ['reservations', 'summary', params?.userId, params?.companyId, params?.locationId, params?.dateFrom, params?.dateTo],
      queryFn: () => api.getReservationSummary(params ?? {}),
      staleTime: 1000 * 60,
    });

  const useUpcomingReservations = (params?: UpcomingParams) =>
    useQuery<ReservationDto[]>({
      queryKey: ['reservations', 'upcoming', params?.userId, params?.companyId, params?.take],
      queryFn: async () => {
        // debug: indicate queryFn called
        console.debug('useUpcomingReservations: fetching reservations', params);
        // fetch reservations: if userId omitted, fetch current user's reservations; otherwise use generic reservations endpoint
        const all = params?.userId ? await api.getReservations({ userId: params.userId, companyId: params?.companyId }) : await api.getMyReservations();
        const today = new Date();
        // date field on ReservationDto is DateOnly (YYYY-MM-DD) — compare by midnight UTC UTC
        const cutoff = new Date(today.toISOString().split('T')[0] + 'T00:00:00.000Z').getTime();
        const future = (all || []).filter((r: ReservationDto) => {
          try {
            const d = new Date(r.date + 'T00:00:00.000Z');
            return d.getTime() >= cutoff;
          } catch {
            return false;
          }
        }).sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
        return params?.take ? future.slice(0, params.take) : future;
      },
      staleTime: 1000 * 15, // 15s
      enabled: true,
      initialData: [],
    });

  return { useReservationSummary, useUpcomingReservations };
};

export default useReservations;
