import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useLocationsApi, { type LocationDto, type CreateLocationDto, type UpdateLocationDto } from '@hooks/api/useLocationsApi';

export const QueryKeyLocations = ['locations'] as const;

const useLocations = () => {
  const api = useLocationsApi();
  const qc = useQueryClient();

  const useLocationsTree = (companyId?: string) =>
    useQuery<LocationDto[]>({
      queryKey: [...QueryKeyLocations, 'tree', companyId],
      queryFn: () => api.listTree(companyId),
    });

  const useFetchLocationById = (id: string) =>
    useQuery<LocationDto>({
      queryKey: [...QueryKeyLocations, 'single', id],
      queryFn: () => api.getSingle(id),
      enabled: !!id,
    });

  const createLocation = useMutation({
    mutationFn: (payload: CreateLocationDto) => api.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeyLocations });
    },
  });

  const updateLocation = useMutation({
    mutationFn: (payload: { id: string; data: UpdateLocationDto }) => api.update(payload.id, payload.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeyLocations });
    },
  });

  const deleteLocation = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeyLocations });
    },
  });

  return { useLocationsTree, useFetchLocationById, createLocation, updateLocation, deleteLocation };
};

export default useLocations;
