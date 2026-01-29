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

export const useMyUpcomingReservations = (userId?: string, take = 20) => {
  const api = useReservationsApi();
  const [items, setItems] = useState<Array<{ id: string; markerName?: string | null; startDate: Date; endDate: Date; raw?: ReservationDto }>>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      // Prefer server-provided dedicated endpoint when userId is supplied
      const res: ReservationDto[] = userId ? await api.getUserUpcomingReservations(userId, take) : await api.getMyReservations();
      const todayCutoff = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z').getTime();
      // If endpoint returns upcoming only, this filter is harmless; otherwise it ensures future-only results
      const future = (res || []).filter(r => {
        try {
          const d = new Date(r.date + 'T00:00:00.000Z');
          return d.getTime() >= todayCutoff;
        } catch {
          return false;
        }
      }).sort((a,b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0)).slice(0, take);

      const mapped = future.map(r => {
        const startRaw = r.startTime ?? r.start ?? r.Start ?? '';
        const endRaw = r.endTime ?? r.end ?? r.End ?? '';
        const startIso = startRaw ? (startRaw.includes('T') ? startRaw : `${r.date}T${startRaw}`) : `${r.date}T00:00:00.000Z`;
        const endIso = endRaw ? (endRaw.includes('T') ? endRaw : `${r.date}T${endRaw}`) : startIso;
        return { id: r.id, markerName: r.markerName ?? null, startDate: new Date(startIso), endDate: new Date(endIso), raw: r };
      });

      setItems(mapped);
      return mapped;
    } finally {
      setLoading(false);
    }
  }, [api, userId, take]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { items, loading, refresh: fetch };
};

export default useReservations;
