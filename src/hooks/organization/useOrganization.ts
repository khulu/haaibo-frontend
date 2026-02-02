import useOrganizationsApi from '@hooks/api/useOrganizationApi';
import type { Organization } from '@hooks/api/useOrganizationApi';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

const QueryKeyBaseOrganizations = ['organizations'];
const QueryKeyOrganizationList = [...QueryKeyBaseOrganizations, 'list'];

const useOrganization = () => {
  const {
    getOrganizations,
    createOrganization,
    getOrganizationById,
    getMyCompany,
    updateOrganization,
    deleteOrganization,
    uploadLogo,
    updateBranding,
  } = useOrganizationsApi();

  const queryClient = useQueryClient();

  const useOrganizationList = () =>
    useQuery({
      queryKey: QueryKeyOrganizationList,
      queryFn: () => getOrganizations().then((data: Organization[]) => data),
    });

  // Current user's linked company. Returns Organization or null when not linked (404)
  const useMyCompany = () =>
    useQuery({
      queryKey: [...QueryKeyBaseOrganizations, 'me'],
      queryFn: () => getMyCompany(),
    });

  const createNewOrganization = useMutation({
    mutationFn: (payload: { name: string; adminUserId?: string | null }) =>
      createOrganization(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyOrganizationList });
    },
  });

  const useFetchOrganizationById = (id: string) => {
    return useQuery({
      queryKey: [...QueryKeyBaseOrganizations, id],
      queryFn: () => getOrganizationById(id),
    });
  };

  const updateExistingOrganization = useMutation({
    mutationFn: (payload: { id: string; data: Partial<{ name: string; adminUserId?: string | null }> }) =>
      updateOrganization(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyOrganizationList });
    },
  });

  const deleteSingleOrganization = useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyOrganizationList });
    },
  });

  const uploadOrganizationLogo = useMutation({
    mutationFn: (payload: { id: string; file: File }) => uploadLogo(payload.id, payload.file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyOrganizationList });
    },
  });

  const updateOrganizationBranding = useMutation({
    mutationFn: (payload: { id: string; branding: { primaryColor?: string; secondaryColor?: string } }) =>
      updateBranding(payload.id, payload.branding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyOrganizationList });
    },
  });

  return {
    useOrganizationList,
    useMyCompany,
    createNewOrganization,
    useFetchOrganizationById,
    updateExistingOrganization,
    deleteSingleOrganization,
    uploadOrganizationLogo,
    updateOrganizationBranding,
  };
};

export default useOrganization;
