import useUsersApi from '@hooks/api/useUserApi';
import type { User } from '@hooks/api/useUserApi'; 
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';


const QueryKeyBaseUsers = ['users'];
const QueryKeyUserList = [...QueryKeyBaseUsers, 'list'];
const QueryKeyRoles = [...QueryKeyBaseUsers, 'roles'];



const useUser = () => {
  const {
    getUsers,
    deleteUser,
    getRoles
  } = useUsersApi();
  const queryClient = useQueryClient();
  
  const useUserList = (payload: {
    companyId?: string; 
  }) =>
    useQuery({
      queryKey: [
        ...QueryKeyUserList,
        payload.companyId,
      ],
      queryFn: () =>
        getUsers(
            payload.companyId,
          )
          .then((data: User[]) => data),
    });
  const useRoles = () =>
    useQuery({
      queryKey: QueryKeyRoles,
      queryFn: () => getRoles(),
    });
  const deleteSingleUser = useMutation({
    mutationFn: (Payload: {
      userId: string;
    
    }) =>
   deleteUser(
        Payload.userId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
        QueryKeyUserList
        ],
      });
    },
  });


  return {
    useUserList,
    useRoles,
    deleteSingleUser,
  };
};


export default useUser;



