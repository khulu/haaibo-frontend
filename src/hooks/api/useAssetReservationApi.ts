import useAxios from './useAxios';
import getAuth from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export type AssetReservationLink = {
  assetId: string;
  reservationId: string;
  checkedOutAt: string;
  returnedAt: string | null;
  checkedOutByUserId: string;
  assetName?: string;
  assetSerialNumber?: string;
};

const useAssetReservationApi = () => {
  const { request } = useAxios();
  const auth = getAuth();
  const token = auth.getToken();

  const getAssetsForReservation = async (reservationId: string): Promise<AssetReservationLink[]> => {
    const response = await request({
      baseURL,
      url: `/reservations/${reservationId}/assets`,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  };

  const linkAssetToReservation = async (reservationId: string, assetId: string): Promise<AssetReservationLink> => {
    const response = await request({
      baseURL,
      url: `/reservations/${reservationId}/assets`,
      method: 'POST',
      data: { assetId },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  };

  const unlinkAsset = async (reservationId: string, assetId: string): Promise<void> => {
    await request({
      baseURL,
      url: `/reservations/${reservationId}/assets/${assetId}`,
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const getReservationsForAsset = async (assetId: string): Promise<AssetReservationLink[]> => {
    const response = await request({
      baseURL,
      url: `/assets/${assetId}/reservations`,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  };

  const getAssetCountForReservations = async (reservationIds: string[]): Promise<Record<string, number>> => {
    const response = await request({
      baseURL,
      url: `/reservations/assets/counts`,
      method: 'POST',
      data: { reservationIds },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  };

  const getAssetsForLocation = async (locationId: string): Promise<AssetReservationLink[]> => {
    const response = await request({
      baseURL,
      url: `/locations/${locationId}/assets`,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  };

  return {
    getAssetsForReservation,
    getAssetsForLocation,
    linkAssetToReservation,
    unlinkAsset,
    getReservationsForAsset,
    getAssetCountForReservations,
  };
};

export default useAssetReservationApi;
