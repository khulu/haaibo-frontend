import useAuthApi from "../../hooks/api/useAuthApi";
import { useMutation } from '@tanstack/react-query';
import { normalizeUserRole } from "../../utils/roles";



const useAuth = () => {
  const {
    loginUser,
  } = useAuthApi();



  const usePostLogin = (email: string, password: string) =>
    useMutation({
      mutationFn: () => {
        console.log("Login mutation started", { email });
        return loginUser(email, password);
      },
      onSuccess: (data) => {
        console.log("Login mutation success", data);
        if (data?.token) {
          localStorage.setItem("token", data.token);
          if (data && data.user) {
            localStorage.setItem("user", JSON.stringify(normalizeUserRole(data.user)));
          }
        }
      },
      onError: (error) => {
        console.error("Login mutation error", error);
      },
    });

 
  return {
usePostLogin
  };
};

export default useAuth;