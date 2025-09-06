import useAssetsApi from '@hooks/api/useAssetApi';
import type { Asset, CreateLaptopInput } from '@hooks/api/useAssetApi';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

const QueryKeyBaseAssets = ['assets'];
const QueryKeyAssetList = [...QueryKeyBaseAssets, 'list'];

const useAsset = () => {
  const {
    getAssetsByCompany,
    createAsset,
    getAssetById,
    updateAsset,
    deleteAsset,
    uploadAssetFile,
  } = useAssetsApi();

  const queryClient = useQueryClient();

  const useAssetList = () =>
    useQuery({
      queryKey: QueryKeyAssetList,
      queryFn: () => getAssetsByCompany().then((data: Asset[]) => data),
    });

  const createNewAsset = useMutation({
    mutationFn: (payload: {
      name: string;
      description?: string;
      make: string;
      model: string;
      serialNumber: string;
      assetId: string;
      purchaseDate: string;
      location: string;
      status: string;
      laptopTagNumber: string;
      assignedUserId: string;
      condition: string;
      warrantyExpiryDate: string;
      companyId: string;
    }) => {
      // Convert status to number if it's a string
      const payloadWithNumberStatus = {
        ...payload,
        status: typeof payload.status === 'string' ? Number(payload.status) : payload.status,
      };
      return createAsset(payloadWithNumberStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyAssetList });
    },
  });

  const useFetchAssetById = (id: string) =>
    useQuery({
      queryKey: [...QueryKeyBaseAssets, id],
      queryFn: () => getAssetById(id),
    });

  const updateExistingAsset = useMutation({
    mutationFn: (payload: { id: string; data: Partial<CreateLaptopInput> }) =>
      updateAsset(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyAssetList });
    },
  });

  const deleteSingleAsset = useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyAssetList });
    },
  });

  const uploadAsset = useMutation({
    mutationFn: (payload: { id: string; file: File }) => uploadAssetFile(payload.id, payload.file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyAssetList });
    },
  });

  return {
    useAssetList,
    createNewAsset,
    useFetchAssetById,
    updateExistingAsset,
    deleteSingleAsset,
    uploadAsset,
  };
};

export default useAsset;
