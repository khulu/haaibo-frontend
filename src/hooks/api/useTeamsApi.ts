import useAxios from './useAxios';
import getAuth from './useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export interface TeamMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  department?: string;
  profilePicture?: string;
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  members: TeamMember[];
}

export interface CreateTeamDto {
  name: string;
  description?: string;
  companyId: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
}

const useTeamsApi = () => {
  const { request } = useAxios();
  const auth = getAuth();
  const token = auth.getToken();

  const getAll = async (companyId?: string): Promise<Team[]> => {
    const params = companyId ? { companyId } : undefined;
    const response = await request({
      baseURL,
      url: '/teams',
      method: 'GET',
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as Team[];
  };

  const getById = async (id: string): Promise<Team> => {
    const response = await request({
      baseURL,
      url: `/teams/${id}`,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as Team;
  };

  const create = async (dto: CreateTeamDto): Promise<Team> => {
    const response = await request({
      baseURL,
      url: '/teams',
      method: 'POST',
      data: dto,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as Team;
  };

  const update = async (id: string, dto: UpdateTeamDto): Promise<Team> => {
    const response = await request({
      baseURL,
      url: `/teams/${id}`,
      method: 'PUT',
      data: dto,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as Team;
  };

  const deleteTeam = async (id: string): Promise<void> => {
    await request({
      baseURL,
      url: `/teams/${id}`,
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const addMembers = async (teamId: string, userIds: string[]): Promise<Team> => {
    const response = await request({
      baseURL,
      url: `/teams/${teamId}/members`,
      method: 'POST',
      data: { userIds },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as Team;
  };

  const removeMember = async (teamId: string, userId: string): Promise<void> => {
    await request({
      baseURL,
      url: `/teams/${teamId}/members/${userId}`,
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  return {
    getAll,
    getById,
    create,
    update,
    deleteTeam,
    addMembers,
    removeMember,
  };
};

export default useTeamsApi;
