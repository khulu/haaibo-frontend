import useUsersApi from '@hooks/api/useUserApi';
import type { CreateUserInput, User } from '@hooks/api/useUserApi'; 
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
    getRoles,
    bulkUploadUsers: bulkUploadUsersApi
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
  const bulkUploadUsers = useMutation({
    mutationFn: (users: CreateUserInput[]) => bulkUploadUsersApi(users),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QueryKeyUserList,
      });
    },
  });


  return {
    useUserList,
    useRoles,
    deleteSingleUser,
    bulkUploadUsers,
  };
};


export default useUser;



