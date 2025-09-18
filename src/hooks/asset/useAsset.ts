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
    bulkUploadAssets,
  } = useAssetsApi();

  const queryClient = useQueryClient();

  const useAssetList = (payload: {
      companyId?: string; 
    }) =>
    useQuery({
      queryKey: [
        ...QueryKeyAssetList,
        payload.companyId,
      ],
      queryFn: () => getAssetsByCompany(payload.companyId).then((data: Asset[]) => data),
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
      // Ensure status is a string as required by CreateLaptopInput
      return createAsset(payload);
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
    mutationFn: (payload: Partial<CreateLaptopInput>[]) => {
      // Map payload to ensure all required fields are present and 'make' is string|null
      const mappedPayload = payload.map((item) => ({
        ...item,
        make: item.make ?? null,
        model: item.model ?? null,
        serialNumber: item.serialNumber ?? "",
        assetId: item.assetId ?? "",
        purchaseDate: item.purchaseDate ?? "",
        status: item.status ?? "",
        laptopTagNumber: item.laptopTagNumber ?? "",
        assignedUserId: item.assignedUserId ?? "",
        condition: item.condition ?? "",
        warrantyExpiryDate: item.warrantyExpiryDate ?? "",
        companyId: item.companyId ?? "",
      }));
      return bulkUploadAssets(mappedPayload);
    },
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
