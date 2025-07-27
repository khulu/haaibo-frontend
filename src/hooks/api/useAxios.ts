import axios, { type AxiosRequestConfig } from 'axios';


const useAxios = () => {
  
  const getAxios = () => {
    const headers = {
      accept: 'text/plain',
      'Content-Type': 'application/json',
    };
    return axios.create({ headers });
  };

  const request = (requestParams: AxiosRequestConfig<any>) => {
    console.log("useAxios: request params", requestParams);
    const ax = getAxios();
    return ax(requestParams);
  };

  return { request };
};

export default useAxios;
