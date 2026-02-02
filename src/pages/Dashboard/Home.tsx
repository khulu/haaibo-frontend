import PageMeta from "../../components/common/PageMeta";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import useContacts from "@hooks/contacts/useContacts";
import useUser from "@hooks/user/useUser";
import useIssues from "@hooks/issues/useIssues";
import useBookings from "@hooks/bookings/useBookings";
import useEvents from "@hooks/event/useEvent";
import useOrganization from "@hooks/organization/useOrganization";
import useAdminMetrics from '@hooks/admin/useAdminMetrics';
import getAuth from "@hooks/api/useAuthApi";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Label from "../../components/form/Label";
import useOrganizationsApi from "@hooks/api/useOrganizationApi";
import { UserIcon, MailIcon, CalenderIcon, TimeIcon, GroupIcon, AlertIcon } from "../../icons";

   interface TopMarker {
                      markerId: string | number;
                      markerName: string;
                      count: number;
                    }
   interface Issue {
    id: string | number;
    description: string;
    priorityName?: string;
    createdAt: string | Date;
  }

                      interface OrgStats {
    totalBookings: number;
    totalHoursBooked: number;
    totalHoursUsed: number;
    checkedInCount: number;
    cancelledCount: number;
    noShowCount: number;
    averageBookingDurationMinutes: number;
    checkinRatePercent: number;
    activeUsers: number;
    mostUsedMarkers: TopMarker[];
    buckets: { day: number; hour: number; count: number }[];
    from?: string;
    to?: string;
    openIssues: Issue[];
    slaBreaches: number;
  }

export default function Home() {
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
  // company selector for SuperAdmin
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(currentCompanyId);
  const effectiveCompanyId = isSuperAdmin ? selectedCompanyId : currentCompanyId;


  const { useOrganizationList } = useOrganization();
  const { data: organizations } = useOrganizationList();
  type OrgBasic = { id: string; name: string; allowAssetTracking?: boolean; enableOfficeReservations?: boolean };
  const organizationOptions = useMemo(() => ((organizations ?? []) as OrgBasic[]).map(o => ({ value: o.id, label: o.name })), [organizations]);
  const { getOrganizationById: fetchOrganizationById } = useOrganizationsApi();
  const [orgSettings, setOrgSettings] = useState<Partial<OrgBasic> | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!effectiveCompanyId) {
        setOrgSettings(undefined);
        return;
      }
      try {
        const detail = await fetchOrganizationById(effectiveCompanyId);
        if (!cancelled) setOrgSettings(detail as Partial<OrgBasic>);
      } catch {
        if (!cancelled) setOrgSettings(undefined);
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const allowAssetTracking = useMemo(() => {
    if (effectiveCompanyId) return !!orgSettings?.allowAssetTracking;
    if (isSuperAdmin && !selectedCompanyId) {
      return ((organizations ?? []) as OrgBasic[]).some((o) => !!o.allowAssetTracking);
    }
    return false;
  }, [effectiveCompanyId, orgSettings, isSuperAdmin, selectedCompanyId, organizations]);

  const enableOfficeReservations = useMemo(() => {
    if (effectiveCompanyId) return !!orgSettings?.enableOfficeReservations;
    if (isSuperAdmin && !selectedCompanyId) {
      return ((organizations ?? []) as OrgBasic[]).some((o) => !!o.enableOfficeReservations);
    }
    return false;
  }, [effectiveCompanyId, orgSettings, isSuperAdmin, selectedCompanyId, organizations]);

  const activeOrgName = useMemo(() => {
    if (!effectiveCompanyId) return undefined;
    const org = ((organizations ?? []) as OrgBasic[]).find((o) => o.id === effectiveCompanyId);
    return org?.name as string | undefined;
  }, [effectiveCompanyId, organizations]);

  const { useMetricsOverview } = useAdminMetrics();
  const { data: metricsData } = useMetricsOverview({ companyId: effectiveCompanyId });

  // prefer live metrics; while loading show zeros/empty arrays


  const orgStats = useMemo<OrgStats>(() => {
    return (metricsData as OrgStats) ?? {
      totalBookings: 0,
      totalHoursBooked: 0,
      totalHoursUsed: 0,
      checkedInCount: 0,
      cancelledCount: 0,
      noShowCount: 0,
      averageBookingDurationMinutes: 0,
      checkinRatePercent: 0,
      activeUsers: 0,
      mostUsedMarkers: [],
      buckets: [],
      from: undefined,
      to: undefined,
      openIssues: [],
      slaBreaches: 0,
    };
  }, [metricsData]);

  const topMarkers = orgStats.mostUsedMarkers;
  const heatmapMatrix = useMemo(() => {
    const days = 7; const hours = 24;
    const m: number[][] = Array.from({ length: days }, () => Array(hours).fill(0));
    (orgStats.buckets ?? []).forEach((b: { day: number; hour: number; count: number }) => {
      const d = ((b.day % 7) + 7) % 7; // normalize
      if (d >= 0 && d < days && b.hour >= 0 && b.hour < hours) m[d][b.hour] += b.count;
    });
    return m;
  }, [orgStats]);

  // Totals
  const { useContactsTotal } = useContacts();
  const { data: contactsTotalData } = useContactsTotal(effectiveCompanyId);
  const contactsTotal = typeof contactsTotalData === 'object' && contactsTotalData !== null ? contactsTotalData.total : (contactsTotalData ?? 0);

  const { useTotalUsers } = useUser();
  const { data: usersTotal } = useTotalUsers(effectiveCompanyId);

  // Issues (open)
  const { useIssuesList } = useIssues();
  const { data: openIssues } = useIssuesList({ companyId: effectiveCompanyId, openOnly: true });
  const openIssuesCount = openIssues?.length ?? 0;
  const recentOpenIssues = useMemo(() => {
    return (openIssues ?? [])
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [openIssues]);

  // My bookings (upcoming)
  const { useMyBookings } = useBookings();
  const { data: myBookings } = useMyBookings({ companyId: effectiveCompanyId, includeAssigned: true, includeCreated: true });
  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return (myBookings ?? [])
      .filter((b) => new Date(b.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [myBookings]);
  const upcomingBookingsCount = upcomingBookings.length;
  const nextBookings = upcomingBookings.slice(0, 5);

  // Events (upcoming)
  const { useEventList } = useEvents();
  const { data: events } = useEventList({ companyId: effectiveCompanyId });
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return (events ?? [])
      .filter((e) => new Date(e.entryTime) >= now)
      .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime())
      .slice(0, 5);
  }, [events]);

  const eventTypeToLabel = (t: number) => {
    const map: Record<number, string> = {
      1: 'Entry',
      2: 'Exit',
      3: 'Maintenance',
      4: 'Audit',
      5: 'Other',
    };
    return map[t] ?? `Type ${t}`;
  };

  return (
    <>
      <PageMeta
        title={activeOrgName ? `Haaibo Dashboard — ${activeOrgName}` : "Haaibo Dashboard"}
        description={activeOrgName ? `Overview for ${activeOrgName}: users, contacts, issues, bookings, and events.` : "Overview of users, contacts, issues, bookings, and events."}
      />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">

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
        <div className="flex items-center gap-2">
          {/* Quick actions */}
            <>
              <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={() => navigate('/users/create')}>
                Invite User
              </button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => navigate('/admin/contacts/new')}>
                Add Contact
              </button>
            </>
        
          {allowAssetTracking && (
            <button className="px-3 py-2 bg-gray-200 text-gray-800 rounded dark:bg-white/[0.06] dark:text-white/90" onClick={() => navigate('/assets/issues')}>
              Raise Issue
            </button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
          <KpiCard
            label="Users"
            value={usersTotal ?? 0}
            icon={<UserIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />}
            onClick={() => navigate('/users')}
          />
          <KpiCard
            label="Contacts"
            value={contactsTotal ?? 0}
            icon={<MailIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />}
            onClick={() => navigate('/admin/contacts')}
          />
          {enableOfficeReservations && (
            <>
              <KpiCard label="Total Bookings" value={orgStats.totalBookings} icon={<CalenderIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />} />
              <KpiCard label="Hours Booked" value={orgStats.totalHoursBooked} icon={<TimeIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />} />
              <KpiCard label="Hours Used" value={orgStats.totalHoursUsed} icon={<TimeIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />} />
              <KpiCard label="Active Users" value={orgStats.activeUsers} icon={<GroupIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />} />
            </>
          )}
          {allowAssetTracking && (
            <KpiCard label="Open Issues" value={openIssuesCount} icon={<AlertIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />} onClick={() => navigate('/assets/issues')} />
          )}
          {enableOfficeReservations && (
            <KpiCard label="My Upcoming Bookings" value={upcomingBookingsCount} icon={<CalenderIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />} onClick={() => navigate('/bookings')} />
          )}
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enableOfficeReservations && (
            <Section title="Most-used Desks">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                 <div className="space-y-2">
                 

                    {topMarkers.map((m: TopMarker) => {
                      const max = (topMarkers[0] as TopMarker).count || 1;
                      const pct = Math.round((m.count / max) * 100);
                      return (
                        <div key={m.markerId} className="flex items-center gap-3">
                          <div className="w-40 text-sm text-gray-600 dark:text-gray-400">{m.markerName}</div>
                          <div className="flex-1 bg-gray-100 dark:bg-white/[0.06] h-3 rounded overflow-hidden">
                            <div className="h-3 bg-indigo-600" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="w-10 text-right text-sm text-gray-700 dark:text-gray-300">{m.count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-white/90 mb-2">Rates</h3>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <div>Check-in rate: {orgStats.checkinRatePercent}%</div>
                    <div>No-shows: {orgStats.noShowCount}</div>
                    <div>Cancelled: {orgStats.cancelledCount}</div>
                    <div>Avg duration: {orgStats.averageBookingDurationMinutes} mins</div>
                  </div>
                </div>
              </div>
            </Section>
            )}

            {enableOfficeReservations && (
            <Section title="Peak Usage Heatmap">
              <div className="mt-6">
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-24 gap-1 text-xs">
                    {/* Simple heatmap: days rows, hours columns */}
                    {heatmapMatrix.map((row, dayIdx) => (
                      <div key={dayIdx} className="flex items-center gap-1 mb-1">
                        <div className="w-16 text-xs text-gray-600 dark:text-gray-400">Day {dayIdx}</div>
                        <div className="flex-1 flex gap-1">
                          {row.map((val, h) => {
                            const max = Math.max(...row, 1);
                            const intensity = Math.min(1, val / max);
                            const bg = `rgba(79,70,229,${0.15 + intensity * 0.7})`;
                            return <div key={h} style={{ width: 10, height: 12, background: bg }} title={`H${h}: ${val}`} />;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
            )}
          </div>
        </div>
        {/* Recent Open Issues */}
        {allowAssetTracking && (
          <div className="col-span-12 xl:col-span-6">
            <Section title="Recent Open Issues">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Description</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Priority</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {(recentOpenIssues ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400" colSpan={3}>No open issues</TableCell>
                    </TableRow>
                  ) : (
                    recentOpenIssues.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{i.description}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{i.priorityName}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(i.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Section>
          </div>
        )}

        {/* Asset Scans and My Bookings */}
        {allowAssetTracking && (
          <div className="col-span-12 xl:col-span-6 space-y-6">
            <Section title="Asset Check-ins & Check-outs">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Asset</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Type</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">When</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {(upcomingEvents ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">No events</TableCell>
                      <TableCell><span /></TableCell>
                      <TableCell><span /></TableCell>
                    </TableRow>
                  ) : (
                    upcomingEvents.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="px-5 py-4">{e.assetTag}</TableCell>
                        <TableCell className="px-5 py-4">{eventTypeToLabel(e.eventType as unknown as number)}</TableCell>
                        <TableCell className="px-5 py-4">{new Date(e.entryTime).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            </Section>

            {enableOfficeReservations && (
            <Section title="My Next Bookings">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Asset</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Start</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">End</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {(nextBookings ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">No upcoming bookings</TableCell>
                      <TableCell><span /></TableCell>
                      <TableCell><span /></TableCell>
                    </TableRow>
                  ) : (
                    nextBookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="px-5 py-4">{b.assigneeUserName || b.externalContactName || '-'}</TableCell>
                        <TableCell className="px-5 py-4">{new Date(b.startDate).toLocaleString()}</TableCell>
                        <TableCell className="px-5 py-4">{new Date(b.endDate).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            </Section>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

function KpiCard({ label, value, icon, onClick }: { label: string; value: number; icon?: React.ReactNode; onClick?: () => void }) {
  const clickable = typeof onClick === 'function';
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-5 md:p-6 ${clickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors' : ''}`}
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
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          {icon}
        </div>
      )}
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
          <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">{value}</h4>
        </div>
      </div>
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
