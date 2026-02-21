import { useEffect, useState } from 'react';
import useReservationsApi, { ReservationDto } from '../../hooks/api/useReservationsApi';
import useLocationsApi, { LocationDto } from '../../hooks/api/useLocationsApi';
import Label from '../../components/form/Label';
import ComponentCard from '../../components/common/ComponentCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

export default function ReservationReports() {
  const { getReservations, exportReservations } = useReservationsApi();
  const { listTree } = useLocationsApi();
  const [bookings, setBookings] = useState<ReservationDto[]>([]);
  const [filtered, setFiltered] = useState<ReservationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);

  // read companyId once for requests/exports
  const companyId = (() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return undefined;
      const user = JSON.parse(raw);
      return user.companyId;
    } catch {
      return undefined;
    }
  })();

  const todayStr = new Date().toISOString().split('T')[0]; // yyyy-MM-dd
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        // companyId is read from outer scope
        // request only today's reservations by default

        // load locations for filter
        if (companyId) {
          const tree = await listTree(companyId);
          const flatten = (nodes: LocationDto[]): LocationDto[] => nodes.flatMap(n => [n, ...flatten(n.children || [])]);
          if (mounted) setLocations(flatten(tree));
        }

        if (!companyId) return;

        setLoading(true);

        // Request server-side filtered reservations when locationId is set
        const params: Record<string, string> = { companyId } as Record<string, string>;
        params.date = selectedDate;
        if (locationId) params.locationId = locationId;

        const res = await getReservations(params);
        if (mounted) {
          setBookings(res);
          setFiltered(res);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError('Failed to load reservations');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, selectedDate]);

  useEffect(() => {
    if (!locationId) {
      setFiltered(bookings);
      return;
    }
    setFiltered(bookings.filter(b => b.locationId === locationId));
  }, [locationId, bookings]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (companyId) params.companyId = companyId;
      if (locationId) params.locationId = locationId;
      if (selectedDate) params.date = selectedDate;
      const blob = await exportReservations(format, params);
      const locName = locationId
        ? (bookings.find(b => b.locationId === locationId)?.locationName
            ?? locations.find(l => l.id === locationId)?.name
            ?? locationId)
        : 'all';
      const nameParts = ['reservations', companyId || 'company', String(locName).replace(/\s+/g, '_')];
      const filename = `${nameParts.join('_')}.${format}`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error(err);
      setError('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (v?: string) => {
    if (!v) return '';
    // If ISO datetime, extract time portion
    const tIndex = v.indexOf('T');
    let time = tIndex >= 0 ? v.substring(tIndex + 1) : v;
    // strip timezone/offset and milliseconds
    time = time.split(/[.+Z]/)[0];
    // normalize to HH:mm
    const parts = time.split(':');
    if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    return time;
  };


  return (
    <div className="space-y-6">
      <ComponentCard title="Reservation Reports">
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <Label>Filter by Location</Label>
            <select
              className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              value={locationId ?? ''}
              onChange={(e) => setLocationId(e.target.value || null)}
            >
              <option value="">All locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Filter by Date</Label>
            <input
              type="date"
              className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2 sm:col-span-2 justify-end">
            <button
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded hover:bg-gray-50"
              onClick={() => handleExport('csv')}
              disabled={loading}
            >
              Export CSV
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => handleExport('pdf')}
              disabled={loading}
            >
              Export PDF
            </button>
          </div>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {!loading && !error && (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Location</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Desk / Meeting Room</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">User</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Date & Time</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Check In</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Check Out</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{b.locationName}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{b.markerName}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{b.userName}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{b.userEmail ?? '-'}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{b.status ?? '-'}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                      {new Date(b.date).toLocaleDateString()} {formatTime(b.start ?? b.Start ?? b.startTime)} - {formatTime(b.end ?? b.End ?? b.endTime)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{b.checkedInAt ? formatTime(b.checkedInAt) : '-'}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{b.checkedOutAt ? formatTime(b.checkedOutAt) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && <div className="p-4 text-sm text-gray-500">No reservations found.</div>}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
