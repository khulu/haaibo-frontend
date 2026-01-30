import PageMeta from "../../components/common/PageMeta";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import useReservations from "@hooks/reservations/useReservations";
import useUser from "@hooks/user/useUser";
import useOrganization from "@hooks/organization/useOrganization";
import getAuth from "@hooks/api/useAuthApi";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Label from "../../components/form/Label";

type LocalBooking = {
  id: string;
  startDate: string;
  endDate: string;
  assigneeUserName?: string | null;
  markerName?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
};

export default function EmployeeDashboard() {
  const auth = getAuth();
  const navigate = useNavigate();
  const currentCompanyId = (auth.getCompanyId() as string | null) ?? undefined;

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
    const [userId] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const user = JSON.parse(raw);
      return user.id;
    } catch {
      return false;
    }
  });
  // (mock data removed) rely on server-provided bookings
  // company selector for SuperAdmin
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(currentCompanyId);
  const effectiveCompanyId = isSuperAdmin ? selectedCompanyId : currentCompanyId;

  const { useOrganizationList } = useOrganization();
  const { data: organizations } = useOrganizationList();
  const organizationOptions = useMemo(() => (organizations ?? []).map(o => ({ value: o.id, label: o.name })), [organizations]);

  // (omitted: contacts, users and issues for this MVP view)

  // My bookings (upcoming)
  // removed useMyBookings usage — upcoming reservations used instead
  const { useReservationSummary } = useReservations();
  const { useUserUpcomingReservations } = useUser();

  // Upcoming reservations (from reservations API) for current user — use simplified hook
  const { data: upcomingItems } = useUserUpcomingReservations(userId, 5);
  console.log('Upcoming reservations:', upcomingItems);
  const upcomingReservations = useMemo<LocalBooking[]>(() => {
    if (!upcomingItems || upcomingItems.length === 0) return [];
    const toIso = (r: Record<string, unknown>, candidates: string[]) => {
      const date = r?.date as string | undefined;
      if (!date) return undefined;
      let time: string | undefined;
      for (const c of candidates) {
        if (r[c]) {
          time = r[c] as string;
          break;
        }
      }
      const iso = time ? `${date}T${time}` : `${date}T00:00:00`;
      const d = new Date(iso);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    };

    return (upcomingItems as Record<string, unknown>[]).map((i) => {
      const startIso = toIso(i, ['start', 'startTime', 'Start']);
      const endIso = toIso(i, ['end', 'endTime', 'End']);
      return ({
        id: i.id,
        startDate: startIso ?? (typeof i.createdAt === 'string' || typeof i.createdAt === 'number' || i.createdAt instanceof Date ? new Date(i.createdAt).toISOString() : new Date().toISOString()),
        endDate: endIso ?? (
          typeof i.createdAt === 'string' || typeof i.createdAt === 'number' || i.createdAt instanceof Date
            ? new Date(i.createdAt).toISOString()
            : new Date().toISOString()
        ),
        assigneeUserName: undefined,
        markerName: i.markerName ?? null,
        checkedInAt: i.checkedInAt ?? null,
        checkedOutAt: i.checkedOutAt ?? null,
      } as LocalBooking);
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [upcomingItems]);

  const sourceMyBookings = useMemo<LocalBooking[]>(() => (upcomingReservations ?? []) as LocalBooking[], [upcomingReservations]);

  // Reservation summary (last 30 days) from server - stabilize the date range so query key is stable
  const { dateFrom, dateTo } = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }, []);

  const { data: reservationSummary } = useReservationSummary({ companyId: effectiveCompanyId, dateFrom, dateTo });

  // KPIs - prefer server summary when available
  const upcoming7 = reservationSummary ? reservationSummary.totalBookings : (upcomingReservations ?? []).filter(b => new Date(b.startDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length;
  const nowCheckedIn = reservationSummary ? (reservationSummary.checkedInCount > 0 ? 1 : 0) : ((sourceMyBookings ?? []).some(b => new Date(b.startDate).getTime() <= Date.now() && new Date(b.endDate).getTime() >= Date.now() && !!(b as LocalBooking).checkedInAt) ? 1 : 0);
  const total30d = reservationSummary ? reservationSummary.totalBookings : (sourceMyBookings ?? []).filter(b => new Date(b.startDate).getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000).length;
  const hours30d = reservationSummary ? Math.round(reservationSummary.totalHoursUsed) : Math.round(((sourceMyBookings ?? []).reduce((sum, b) => {
    const start = new Date(b.startDate).getTime();
    const end = new Date(b.endDate).getTime();
    const used = (b as LocalBooking).checkedOutAt ? (new Date((b as LocalBooking).checkedOutAt!).getTime() - ((b as LocalBooking).checkedInAt ? new Date((b as LocalBooking).checkedInAt!).getTime() : start)) : (end - start);
    return sum + (used || 0);
  }, 0)) / (1000 * 60 * 60));
  

  // Events omitted from MVP

  return (
    <>
      <PageMeta
        title="Employee Dashboard"
        description="Overview for employees: bookings and events."
      />

      {/* Toolbar: company selector (SuperAdmin) + quick actions */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <>
              <Label>Company</Label>
              <select
                value={selectedCompanyId ?? ''}
                onChange={(e) => setSelectedCompanyId(e.target.value || undefined)}
                className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">All companies</option>
                {organizationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </>
          )}
        </div>
          {/* toolbar actions removed per request */}
      </div>

      {/* MVP Employee stats (mock-data-driven) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
        <KpiCard label="Upcoming (7d)" value={upcoming7} onClick={() => navigate('/bookings')} />
        <KpiCard label="Currently Checked-In" value={nowCheckedIn} onClick={() => navigate('/bookings')} />
        <KpiCard label="Total (30d)" value={total30d} onClick={() => navigate('/bookings')} />
        <KpiCard label="Hours Used (30d)" value={hours30d} onClick={() => navigate('/bookings')} />
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-6">
          <Section title="Upcoming Reservations (7 days)">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Desk / Room</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Start</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">End</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {((upcomingReservations ?? []).filter(b => new Date(b.startDate) <= new Date(Date.now() + 7*24*60*60*1000)) ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-gray-500">No upcoming reservations</TableCell>
                      <TableCell><span /></TableCell>
                      <TableCell><span /></TableCell>
                    </TableRow>
                  ) : (
                    (upcomingReservations ?? []).filter(b => new Date(b.startDate) <= new Date(Date.now() + 7*24*60*60*1000)).map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{b.markerName || b.assigneeUserName || '-'}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(b.startDate).toLocaleString()}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(b.endDate).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Section>
        </div>

        <div className="col-span-12 xl:col-span-6 space-y-6">
          <Section title="Most-used Desks (30d)">
            <div className="p-4">
              {reservationSummary && reservationSummary.mostUsedMarkers && reservationSummary.mostUsedMarkers.length > 0 ? (
                <ul className="space-y-2">
                  {reservationSummary.mostUsedMarkers.slice(0,3).map((m) => (
                    <li key={m.markerId} className="flex items-center justify-between">
                      <div className="text-gray-800 dark:text-white/90">{m.markerName}</div>
                      <div className="text-gray-800 dark:text-white/90">{m.count} reservations</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">No data</div>
              )}
            </div>
          </Section>

          <Section title="Reservation Time Heatmap (placeholder)">
            <div className="p-4">
              {reservationSummary && reservationSummary.buckets && reservationSummary.buckets.length > 0 ? (
                <div className="text-sm text-gray-700">
                  <div className="mb-2 text-gray-500">Buckets (day/hour/count):</div>
                  <ul className="space-y-1 text-gray-600">
                    {reservationSummary.buckets.map((b, idx) => (
                      <li key={idx}>{b.day}/{b.hour} — {b.count}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-4 text-gray-500">Heatmap preview will be added here — requires chart/heatmap component.</div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function KpiCard({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  const clickable = typeof onClick === 'function';
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-5 ${clickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors' : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        <h2 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
