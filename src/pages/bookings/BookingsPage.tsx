import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import getAuth from '@hooks/api/useAuthApi';
import useBookings from '@hooks/bookings/useBookings';
import useAsset from '@hooks/asset/useAsset';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';

export default function BookingsPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const companyId = auth.getCompanyId?.();
  const { useMyBookings } = useBookings();
  const { data: bookings, isLoading, isError } = useMyBookings({ companyId, includeCreated: true, includeAssigned: false });
  const { useAssetList } = useAsset();
  const { data: assets } = useAssetList({ companyId });

  const assetMap = useMemo(() => {
    const map = new Map<string, string>();
    (assets ?? []).forEach((a) => {
      const label = `${a.make ?? ''} ${a.model ?? ''} ${a.serialNumber ?? a.assetId ?? a.laptopTagNumber ?? ''}`.trim();
      map.set(a.id, label || a.id);
    });
    return map;
  }, [assets]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">My Bookings</h1>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => navigate('/assets/bookings')}>
            Book Assets
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Asset</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Assignee</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Dates</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Notes</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {isLoading ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">Loading...</TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-red-500">Failed to load bookings</TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
              </TableRow>
            ) : (bookings ?? []).length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">No bookings found</TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
              </TableRow>
            ) : (
              (bookings ?? []).map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start font-medium text-gray-800 text-theme-sm dark:text-white/90">{assetMap.get(b.assetId) ?? b.assetId}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">{b.assigneeUserName || b.externalContactName || '-'}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">{new Date(b.startDate).toLocaleString()} → {new Date(b.endDate).toLocaleString()}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">{b.notes || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
