import useUsersApi from '@hooks/api/useUserApi';
import type { CreateUserInput, User } from '@hooks/api/useUserApi'; 
import type { ReservationDto } from '@hooks/api/useReservationsApi';
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
  const api = useUsersApi();
  
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
      // Invalidate all user list queries (including those scoped by companyId)
      queryClient.invalidateQueries({
        queryKey: QueryKeyUserList,
      });
    },
  });
  const bulkUploadUsers = useMutation<unknown, unknown, CreateUserInput[]>({
    mutationFn: (users) => bulkUploadUsersApi(users),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QueryKeyUserList,
      });
    },
  });
  const useTotalUsers = (companyId?: string) =>
    useQuery({
      queryKey: ['users', 'total', companyId],
      queryFn: () => api.getTotalUsers(companyId),
    });

  const useUserUpcomingReservations = (userId?: string, take?: number) =>
    useQuery({
      queryKey: ['users', 'upcomingReservations', userId, take],
      queryFn: () => {
        if (!userId) return Promise.resolve([] as ReservationDto[]);
        return api.getUserUpcomingReservations(userId, take);
      },
      enabled: Boolean(userId),
    });


  return {
    useUserList,
    useRoles,
    deleteSingleUser,
    bulkUploadUsers,
    useTotalUsers,
    useUserUpcomingReservations,
  };
};


export default useUser;



