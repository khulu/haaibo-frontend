import { useEffect, useState } from 'react';
import useReservationsApi, { ReservationDto } from '../../hooks/api/useReservationsApi';
import useLocationsApi, { LocationDto } from '../../hooks/api/useLocationsApi';
import Label from '../../components/form/Label';
import ComponentCard from '../../components/common/ComponentCard';

export default function ReservationReports() {
  const { getReservations } = useReservationsApi();
  const { listTree } = useLocationsApi();
  const [bookings, setBookings] = useState<ReservationDto[]>([]);
  const [filtered, setFiltered] = useState<ReservationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
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
        // load locations for filter
        if (companyId) {
          const tree = await listTree(companyId);
          const flatten = (nodes: LocationDto[]): LocationDto[] => nodes.flatMap(n => [n, ...flatten(n.children || [])]);
          setLocations(flatten(tree));
        }
        setLoading(true);
        const res = await getReservations({ companyId: companyId });
        setBookings(res);
        setFiltered(res);
      } catch (err) {
        console.error(err);
        setError('Failed to load reservations');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!locationId) {
      setFiltered(bookings);
      return;
    }
    setFiltered(bookings.filter(b => b.locationId === locationId));
  }, [locationId, bookings]);

  return (
    <div className="space-y-6">
      <ComponentCard title="Reservation Reports">
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <Label>Filter by Location</Label>
            <select
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4"
              value={locationId ?? ''}
              onChange={(e) => setLocationId(e.target.value || null)}
            >
              <option value="">All locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Marker</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Start</th>
                  <th className="px-3 py-2">End</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-t">
                    <td className="px-3 py-2 text-sm">{b.id}</td>
                    <td className="px-3 py-2 text-sm">{b.companyId}</td>
                    <td className="px-3 py-2 text-sm">{b.locationId}</td>
                    <td className="px-3 py-2 text-sm">{b.markerId}</td>
                    <td className="px-3 py-2 text-sm">{b.userId}</td>
                    <td className="px-3 py-2 text-sm">{new Date(b.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-sm">{b.start}</td>
                    <td className="px-3 py-2 text-sm">{b.end}</td>
                    <td className="px-3 py-2 text-sm">{new Date(b.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="p-4 text-sm text-gray-500">No reservations found.</div>}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
