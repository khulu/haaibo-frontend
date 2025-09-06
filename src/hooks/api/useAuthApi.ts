import useAxios from './useAxios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

const useAuthApi = () => {
  const axios = useAxios();

const loginUser = async (email: string, password: string) => {
  try {
    const response = await axios.request({
      baseURL,
      url: '/Auth/login',
      method: 'POST',
      data: { email, password },
    });

    const { data } = response;
    return data;
  } catch (error) {
    console.error("loginUser............: error", error);
    throw error;
  }
};

  // Helper to get token from localStorage
  const getToken = () => {
    let token = null;
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        token = userObj.token || localStorage.getItem('token');
      } catch {
        token = localStorage.getItem('token');
      }
    } else {
      token = localStorage.getItem('token');
    }
    return token;
  };

  return {
    loginUser,
    getToken
  };
};

export default useAuthApi;
