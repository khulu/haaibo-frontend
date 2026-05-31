import useEvent from "@hooks/event/useEvent";
import getCompanyId from "@hooks/api/useAuthApi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
const getImgSrc = (path: string | null | undefined) => {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  const isProd = import.meta.env.ASPNETCORE_ENVIRONMENT === "Production" || import.meta.env.PROD;
  if (isProd) {
    const baseUrl = 'https://haiibo-backend-api.azurewebsites.net';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
};

const eventTypeLabel = (type: number) => {
  switch (type) {
    case 1: return 'Entry';
    case 2: return 'Exit';
    default: return `Type ${type}`;
  }
};

const eventTypeBadgeClass = (type: number) => {
  switch (type) {
    case 1: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 2: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
};

export default function EventsPage() {
  const { useEventList } = useEvent();
  const authApi = getCompanyId();
  const companyId = authApi.getCompanyId();
  const { data: events, isLoading } = useEventList({companyId: companyId});
  const navigate = useNavigate();

  const [isSuperAdmin] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const user = JSON.parse(raw);
      const role = user?.role;
      return role === 0 || role === 'SuperAdmin';
    } catch {
      return false;
    }
  });

  if (isLoading) return <div className="p-6">Loading events...</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Events
        </h1>
      </div>
      {!events?.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No events recorded yet.</p>
      ) : (
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">User</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Asset</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Type</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Entry Time</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Exit Time</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Notes</TableCell>
              {isSuperAdmin && (
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Company</TableCell>
              )}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="px-4 py-3 text-start">
                  <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => navigate(`/users/${event.userId}`)}>
                    <div className="w-9 h-9 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {event.userPhoto ? (
                        <img src={getImgSrc(event.userPhoto)} alt={event.userName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-sm font-bold">{event.userName?.[0] || '?'}</span>
                      )}
                    </div>
                    <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{event.userName}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
                  <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => navigate(`/assets/${event.assetId}`)}>
                    <div className="w-9 h-9 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {event.assetPhoto ? (
                        <img src={getImgSrc(event.assetPhoto)} alt={event.assetTag} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-sm font-bold">{event.assetTag?.[0] || '?'}</span>
                      )}
                    </div>
                    <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{event.assetTag}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${eventTypeBadgeClass(event.eventType)}`}>
                    {eventTypeLabel(event.eventType)}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-start">
                  {formatDateTime(event.entryTime)}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-start">
                  {formatDateTime(event.exitTime)}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-start max-w-[200px] truncate" title={event.notes}>
                  {event.notes || '-'}
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-start">
                    {event.companyName}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
