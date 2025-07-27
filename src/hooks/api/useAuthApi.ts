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

  return {
    loginUser
  };
};

export default useAuthApi;
