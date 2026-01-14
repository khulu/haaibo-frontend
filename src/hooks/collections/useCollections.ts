import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useCollectionsApi from '@hooks/api/useCollectionsApi';

export const QueryKeyCollections = ['collections'] as const;
const QueryKeyCollectionsList = [...QueryKeyCollections, 'list'] as const;

const useCollections = () => {
  const api = useCollectionsApi();
  const queryClient = useQueryClient();

  const useCollectionsList = (companyId?: string) =>
    useQuery({
      queryKey: [...QueryKeyCollectionsList, companyId],
      queryFn: () => api.getCollections(companyId),
    });

  const useFetchCollectionById = (id: string) =>
    useQuery({
      queryKey: [...QueryKeyCollections, id],
      queryFn: () => api.getCollectionById(id),
      enabled: !!id,
    });

  const createNewCollection = useMutation({
    mutationFn: (payload: { name: string; description?: string | null; companyId?: string | null }) =>
      api.createCollection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyCollections });
    },
  });

  const updateExistingCollection = useMutation({
    mutationFn: (payload: { id: string; data: { name?: string; description?: string | null; companyId?: string | null } }) =>
      api.updateCollection(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyCollections });
    },
  });

  const deleteSingleCollection = useMutation({
    mutationFn: (id: string) => api.deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyCollections });
    },
  });

  return {
    useCollectionsList,
    useFetchCollectionById,
    createNewCollection,
    updateExistingCollection,
    deleteSingleCollection,
  };
};

export default useCollections;
