import useAxios from './useAxios';
import getAuth from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export type FloorplanMarker = {
  id: string;
  name: string;
  type: 0 | 1; // 0 = desk, 1 = meeting room
  xPosition: number;
  yPosition: number;
  active: boolean;
  companyId: string;
  locationId: string;
  deskCode?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateFloorplanMarkerDto = {
  name: string;
  type: 0 | 1;
  xPosition: number;
  yPosition: number;
  active?: boolean;
  locationId: string;
  deskCode?: string | null;
  description?: string | null;
};

export type UpdateFloorplanMarkerDto = {
  name?: string;
  type?: 0 | 1;
  xPosition?: number;
  yPosition?: number;
  active?: boolean;
  deskCode?: string | null;
  description?: string | null;
};

export type LocationDto = {
  id: string;
  name: string;
  color?: string | null;
  parentId?: string | null;
  companyId: string;
  floorplanPath?: string | null;
  active?: boolean;
  allowColleagueSearch?: boolean;
  createdAt: string;
  updatedAt: string;
  children: LocationDto[];
  markers?: FloorplanMarker[];
};

export type CreateLocationDto = {
  name: string;
  color?: string | null;
  parentId?: string | null;
  companyId: string;
  floorplanPath?: string | null;
  active?: boolean;
  allowColleagueSearch?: boolean;
};

export type UpdateLocationDto = {
  name?: string;
  color?: string | null;
  parentId?: string | null;
  floorplanPath?: string | null;
  active?: boolean;
  allowColleagueSearch?: boolean;
};

const useLocationsApi = () => {
  const axios = useAxios();
  const auth = getAuth();
  const token = auth.getToken();

  const listTree = async (companyId?: string): Promise<LocationDto[]> => {
    const response = await axios.request({
      baseURL,
      url: '/locations',
      method: 'GET',
      params: companyId ? { companyId } : undefined,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as LocationDto[];
  };

  const getSingle = async (id: string): Promise<LocationDto> => {
    const response = await axios.request({
      baseURL,
      url: `/locations/${id}`,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as LocationDto;
  };

  const create = async (payload: CreateLocationDto): Promise<LocationDto> => {
    const response = await axios.request({
      baseURL,
      url: '/locations',
      method: 'POST',
      data: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as LocationDto;
  };

  const update = async (id: string, data: UpdateLocationDto): Promise<LocationDto> => {
    const response = await axios.request({
      baseURL,
      url: `/locations/${id}`,
      method: 'PUT',
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as LocationDto;
  };

  const remove = async (id: string): Promise<void> => {
    await axios.request({
      baseURL,
      url: `/locations/${id}`,
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const uploadFloorplan = async (id: string, file: File): Promise<{ path: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.request({
      baseURL,
      url: `/locations/${id}/floorplan`,
      method: 'POST',
      data: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as { path: string };
  };

  const getMarkers = async (locationId: string): Promise<FloorplanMarker[]> => {
    const response = await axios.request({
      baseURL,
      url: `/locations/${locationId}/markers`,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as FloorplanMarker[];
  };

  const createMarker = async (payload: CreateFloorplanMarkerDto): Promise<FloorplanMarker> => {
    const response = await axios.request({
      baseURL,
      url: `/locations/${payload.locationId}/markers`,
      method: 'POST',
      data: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as FloorplanMarker;
  };

  const updateMarker = async (id: string, data: UpdateFloorplanMarkerDto): Promise<FloorplanMarker> => {
    const response = await axios.request({
      baseURL,
      url: `/locations/markers/${id}`,
      method: 'PUT',
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as FloorplanMarker;
  };

  const deleteMarker = async (id: string): Promise<void> => {
    await axios.request({
      baseURL,
      url: `/locations/markers/${id}`,
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  return { listTree, getSingle, create, update, remove, uploadFloorplan, getMarkers, createMarker, updateMarker, deleteMarker };
};

export default useLocationsApi;
