import useAxios from './useAxios';
import getToken from './useAuthApi';
const baseURL = import.meta.env.VITE_API_BASE_URL;

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  role: number | string;
  profilePicture?: string | null;
  companyId?: string | null;
  companyName?: string | null;
}

// Create a new user using User type minus id, profilePicture, companyName, plus password
export type CreateUserInput = Omit<User, 'id' | 'profilePicture' | 'companyName'> & { password: string };

const useUserApi = () => {
  const axios = useAxios();

  // Fetch all users, optionally filtered by companyId
  const getUsers = async (companyId?: string): Promise<User[]> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: '/Users',
        method: 'GET',
        params: companyId ? { companyId } : undefined,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getUsers error:', error);
      throw error;
    }
  };

  const createUser = async (user: CreateUserInput): Promise<User> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: '/Users',
        method: 'POST',
        data: user,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('createUser error:', error);
      throw error;
    }
  };

    // Get a single user by id
  const getUserById = async (id: string): Promise<User> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: `/Users/single/${id}`,
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getUserById error:', error);
      throw error;
    }
  };

  // Get users by companyId (path param)
  const getUsersByCompany = async (companyId: string): Promise<User[]> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: `/Users/${companyId}`,
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getUsersByCompany error:', error);
      throw error;
    }
  };

  // Delete a user by id
  const deleteUser = async (id: string): Promise<void> => {
    try {
      const token = getToken();
      await axios.request({
        baseURL,
        url: `/Users/${id}`,
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error('deleteUser error:', error);
      throw error;
    }
  };

  // Upload profile picture (multipart/form-data)
  const uploadProfilePicture = async (id: string, file: File): Promise<User> => {
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.request({
        baseURL,
        url: `/Users/${id}/profile-picture`,
        method: 'POST',
        data: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('uploadProfilePicture error:', error);
      throw error;
    }
  };
  // Update an existing user
  const updateUser = async (id: string, user: CreateUserInput): Promise<User> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: `/Users/${id}`,
        method: 'PUT',
        data: user,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('updateUser error:', error);
      throw error;
    }
  };

  // Fetch user roles
  const getRoles = async (): Promise<{ value: string; label: string }[]> => {
    try {
      const token = getToken();
      const response = await axios.request({
        baseURL,
        url: '/Users/roles',
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error('getRoles error:', error);
      throw error;
    }
  };

  return {
    getUsers,
    getUserById,
    getUsersByCompany,
    createUser,
    updateUser,
    deleteUser,
    uploadProfilePicture,
    getRoles,
  };
};

export default useUserApi;
