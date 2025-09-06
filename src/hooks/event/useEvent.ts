import useEventApi from '@hooks/api/useEventApi';
import type { Event } from '@hooks/api/useEventApi';
import {
  useQuery,
} from '@tanstack/react-query';

const QueryKeyBaseEvents = ['events'];
const QueryKeyEventList = [...QueryKeyBaseEvents, 'list'];



const useEvents = () => {
  const {
    getEvents,
  } = useEventApi();

  const useEventList = (payload: {
    companyId?: string;
  }) =>
    useQuery<Event[], Error>({
      queryKey: [
        ...QueryKeyEventList,
        payload.companyId,
      ],
      queryFn: () =>
        getEvents(
          payload.companyId,
        ),
    });

  return {
    useEventList
  };
};


export default useEvents;



