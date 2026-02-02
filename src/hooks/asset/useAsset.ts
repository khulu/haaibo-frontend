import useAssetsApi from '@hooks/api/useAssetApi';
import type { Asset, CreateLaptopInput, BulkAsset } from '@hooks/api/useAssetApi';
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
    uploadAssetPicture,
    getTotalAssets,
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
      // Convert status to number for CreateLaptopInput
      const mappedPayload = {
        ...payload,
        status: Number(payload.status),
      };
      return createAsset(mappedPayload);
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
    // Use BulkAsset typing for bulk upload
    mutationFn: (payload: Omit<BulkAsset, 'id' | 'createdAt' | 'updatedAt' | 'statusName' | 'companyName' | 'assignedUserName'>[]) => {
      const mappedPayload = payload.map((item) => ({
        make: item.make ?? null,
        model: item.model ?? null,
        serialNumber: item.serialNumber && String(item.serialNumber).trim() !== '' ? String(item.serialNumber).trim() : null,
        assetId: item.assetId && String(item.assetId).trim() !== '' ? String(item.assetId).trim() : null,
        purchaseDate: item.purchaseDate ?? null,
        status: item.status !== null && item.status !== undefined && String(item.status).trim() !== '' ? String(item.status).trim() : null,
        laptopTagNumber: item.laptopTagNumber && String(item.laptopTagNumber).trim() !== '' ? String(item.laptopTagNumber).trim() : null,
        assignedUserId: item.assignedUserId && String(item.assignedUserId).trim() !== '' ? String(item.assignedUserId).trim() : null,
        condition: item.condition && String(item.condition).trim() !== '' ? String(item.condition).trim() : null,
        warrantyExpiryDate: item.warrantyExpiryDate ?? null,
        companyId: item.companyId && String(item.companyId).trim() !== '' ? String(item.companyId).trim() : undefined,
      }));
      return bulkUploadAssets(mappedPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyAssetList });
    },
  });

  const uploadAssetPictureMutation = useMutation({
    mutationFn: (payload: { id: string; file: File }) =>
      uploadAssetPicture(payload.id, payload.file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeyAssetList });
    },
  });

  const useTotalAssets = (companyId?: string) =>
    useQuery({
      queryKey: ['assets', 'total', companyId],
      queryFn: () => getTotalAssets(companyId),
    });

  return {
    useAssetList,
    createNewAsset,
    useFetchAssetById,
    updateExistingAsset,
    deleteSingleAsset,
    uploadAsset,
    uploadAssetPictureMutation,
    useTotalAssets,
  };
};

export default useAsset;
