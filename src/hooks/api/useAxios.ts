import axios, { type AxiosRequestConfig } from 'axios';

// Create a single axios instance with sane defaults.
// Do NOT set 'Content-Type' globally so FormData can set boundaries automatically.
const axInstance = axios.create({
  headers: {
    accept: 'application/json',
  },
});

// Stable request function reused everywhere.
const request = (requestParams: AxiosRequestConfig<any>) => {
  return axInstance.request(requestParams);
};

const useAxios = () => {
  return { request };
};

export default useAxios;
