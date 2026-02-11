import useAxios from './useAxios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export type NotificationItem = {
  id: string;
  title?: string;
  message: string;
  createdAt: string;
  seenAt?: string | null;
  severity?: 'info' | 'warning' | 'error' | 'success' | string | null;
  relatedEntityType?: 'Issue' | 'Asset' | 'Organization' | 'User' | 'Reservation' | 'Event' | string | null;
  relatedEntityId?: string | null;
};

export type NotificationsResponse = {
  items: NotificationItem[];
  total: number;
  unseenCount: number;
};

export type Scope = 'global' | 'company' | 'user';

const useNotificationsApi = () => {
  const axios = useAxios();

  const getAuthToken = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.token) return user.token as string;
      }
    } catch {
      // ignore malformed localStorage user content
      void 0;
    }
    const token = localStorage.getItem('token');
    return token ?? undefined;
  };

  const list = async (params: { scope: Scope; take?: number; skip?: number }) => {
    const token = getAuthToken();
    const { scope, take = 20, skip = 0 } = params;
    try {
      const response = await axios.request({
        baseURL,
        url: `/notifications`,
        method: 'GET',
        params: { scope, take, skip },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return response.data as NotificationsResponse;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        // Redirect to login on unauthorized
        window.location.href = '/signin';
      }
      throw error;
    }
  };

  const markSeen = async (id: string) => {
    const token = getAuthToken();
    try {
      const response = await axios.request({
        baseURL,
        url: `/notifications/mark-seen`,
        method: 'POST',
        data: { ids: [id] },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return response.data as { success: boolean };
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        window.location.href = '/signin';
      }
      throw error;
    }
  };

  const markAllSeen = async () => {
    const token = getAuthToken();
    try {
      const response = await axios.request({
        baseURL,
        url: `/notifications/mark-all-seen`,
        method: 'POST',
        data: {},
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return response.data as { success: boolean };
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        window.location.href = '/signin';
      }
      throw error;
    }
  };

  return { list, markSeen, markAllSeen };
};

export default useNotificationsApi;
