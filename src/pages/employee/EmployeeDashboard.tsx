import PageMeta from "../../components/common/PageMeta";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import useReservations from "@hooks/reservations/useReservations";
import useUser from "@hooks/user/useUser";
import useAsset from "@hooks/asset/useAsset";
import useBookings from "@hooks/bookings/useBookings";
import useEvents from "@hooks/event/useEvent";
import useIssues from "@hooks/issues/useIssues";
import useFeatureFlags from "../../hooks/useFeatureFlags";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalenderIcon, CheckCircleIcon, ListIcon, TimeIcon } from "../../icons";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { assetTracking, deskBooking } = useFeatureFlags();

  const [userId] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return undefined;
      const user = JSON.parse(raw);
      return user.id as string | undefined;
    } catch {
      return undefined;
    }
  });

  const [companyId] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return undefined;
      const user = JSON.parse(raw);
      return user.companyId as string | undefined;
    } catch {
      return undefined;
    }
  });

  // --- Reservation hooks (desk booking) ---
  const { useReservationSummary, useUpcomingReservations } = useReservations();

  const { data: upcomingReservations } = useUpcomingReservations({ userId, companyId, take: 10 });

  const { dateFrom, dateTo } = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }, []);
  const { data: reservationSummary } = useReservationSummary({ companyId, dateFrom, dateTo });

  // --- Asset tracking hooks ---
  const { useAssetList } = useAsset();
  const { useMyBookings } = useBookings();
  const { useEventList } = useEvents();
  const { useIssuesList } = useIssues();

  const { data: assets } = useAssetList({ companyId });
  const { data: myBookings } = useMyBookings({ companyId, includeAssigned: true, includeCreated: false });
  const { data: myEvents } = useEventList({ companyId, userId });
  const { data: myReportedIssues } = useIssuesList({ reportedByUserId: userId });

  // --- Computed data ---
  const upcoming7dReservations = useMemo(() => {
    const cutoff = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return (upcomingReservations ?? []).filter(r => {
      const d = new Date(r.date + 'T00:00:00');
      return d.getTime() <= cutoff;
    });
  }, [upcomingReservations]);

  const nowCheckedIn = useMemo(() => {
    if (reservationSummary) return reservationSummary.checkedInCount > 0 ? 1 : 0;
    return 0;
  }, [reservationSummary]);

  const total30d = reservationSummary?.totalBookings ?? 0;
  const hours30d = reservationSummary ? Math.round(reservationSummary.totalHoursUsed) : 0;

  const myAssets = useMemo(() => (assets ?? []).filter(a => a.assignedUserId === userId), [assets, userId]);

  const healthDistribution = useMemo(() => {
    return myAssets.reduce<Record<string, number>>((acc, a) => {
      const key = a.condition ?? 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [myAssets]);

  const upcomingWarranty = useMemo(() => {
    const now = Date.now();
    const sixtyDays = 60 * 24 * 60 * 60 * 1000;
    return myAssets.filter(a => {
      const exp = a.warrantyExpiryDate ? new Date(a.warrantyExpiryDate).getTime() : NaN;
      return !isNaN(exp) && (exp - now <= sixtyDays) && (exp >= now);
    });
  }, [myAssets]);

  const upcomingAssetBookings = useMemo(() => {
    const now = Date.now();
    return (myBookings ?? [])
      .filter(b => new Date(b.endDate).getTime() >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 8);
  }, [myBookings]);

  const recentEvents = useMemo(() => (myEvents ?? []).slice(0, 8), [myEvents]);

  const openIssues = useMemo(() => {
    return (myReportedIssues ?? [])
      .filter(i => i.statusName?.toLowerCase() !== 'closed')
      .slice(0, 8);
  }, [myReportedIssues]);

  return (
    <>
      <PageMeta
        title="Employee Dashboard"
        description="Overview for employees: reservations, bookings and events."
      />

      {/* Desk Booking KPIs */}
      {deskBooking && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
          <KpiCard label="Upcoming (7d)" value={upcoming7dReservations.length} icon={<CalenderIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />} onClick={() => navigate('/reservations')} />
          <KpiCard label="Currently Checked-In" value={nowCheckedIn} icon={<CheckCircleIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />} onClick={() => navigate('/reservations')} />
          <KpiCard label="Total (30d)" value={total30d} icon={<ListIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />} onClick={() => navigate('/reservations')} />
          <KpiCard label="Hours Used (30d)" value={hours30d} icon={<TimeIcon className="w-6 h-6 fill-gray-800 dark:fill-white/90" />} onClick={() => navigate('/reservations')} />
        </div>
      )}

      {/* Desk Booking sections */}
      {deskBooking && (
        <div className="grid grid-cols-12 gap-4 md:gap-6 mb-6">
          <div className="col-span-12 xl:col-span-6">
            <Section title="Upcoming Reservations (7 days)">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Desk / Room</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Date</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Time</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {upcoming7dReservations.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-gray-500">No upcoming reservations</TableCell>
                        <TableCell><span /></TableCell>
                        <TableCell><span /></TableCell>
                      </TableRow>
                    ) : (
                      upcoming7dReservations.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{r.markerName || r.locationName || '-'}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(r.date).toLocaleDateString()}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{r.startTime ?? '-'} – {r.endTime ?? '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Section>
          </div>

          <div className="col-span-12 xl:col-span-6">
            <Section title="Most-used Desks (30d)">
              <div className="p-4">
                {reservationSummary?.mostUsedMarkers?.length ? (
                  <ul className="space-y-2">
                    {reservationSummary.mostUsedMarkers.slice(0, 5).map((m) => (
                      <li key={m.markerId} className="flex items-center justify-between text-sm">
                        <span className="text-gray-800 dark:text-white/90">{m.markerName}</span>
                        <span className="text-gray-500 dark:text-gray-400">{m.count} reservations</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No data available</p>
                )}
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* Asset Tracking sections */}
      {assetTracking && (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Quick links */}
          <div className="col-span-12">
            <Section title="Assets & Issues">
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" onClick={() => navigate('/assets/bookings')}>Book Assets</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => navigate('/assets')}>View Devices</button>
                <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700" onClick={() => navigate('/assets/issues')}>Raise Issue</button>
              </div>
            </Section>
          </div>

          {/* My assigned assets */}
          <div className="col-span-12 xl:col-span-6">
            <Section title={`My Assigned Assets (${myAssets.length})`}>
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Tag / Serial</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Make / Model</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Condition</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {myAssets.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-gray-500" colSpan={4}>No assets assigned to you</TableCell>
                      </TableRow>
                    ) : (
                      myAssets.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{a.laptopTagNumber || a.assetId || '-'} / {a.serialNumber || '-'}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{a.make} {a.model}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{a.statusName || a.status}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{a.condition || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Section>
          </div>

          {/* Asset health distribution */}
          <div className="col-span-12 xl:col-span-6">
            <Section title="Asset Health">
              {Object.keys(healthDistribution).length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No asset data</p>
              ) : (
                <ul className="space-y-2 text-gray-800 dark:text-white/90">
                  {Object.entries(healthDistribution).map(([cond, count]) => (
                    <li key={cond} className="flex justify-between text-sm">
                      <span>{cond}</span>
                      <span className="font-medium">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          {/* Warranty expiries */}
          <div className="col-span-12 xl:col-span-6">
            <Section title="Upcoming Warranty Expiries">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Asset</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Expiry Date</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {upcomingWarranty.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-gray-500" colSpan={2}>No upcoming expiries</TableCell>
                      </TableRow>
                    ) : (
                      upcomingWarranty.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{a.make} {a.model}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(a.warrantyExpiryDate!).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Section>
          </div>

          {/* Recent events */}
          <div className="col-span-12 xl:col-span-6">
            <Section title="Recent Events">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Asset</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Event</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Timestamp</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {recentEvents.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-gray-500" colSpan={3}>No recent events</TableCell>
                      </TableRow>
                    ) : (
                      recentEvents.map((e, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{e.assetId}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{String(e.eventType)}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(e.entryTime).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Section>
          </div>

          {/* Asset bookings */}
          <div className="col-span-12 xl:col-span-6">
            <Section title="Bookings (Upcoming/Active)">
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
                    {upcomingAssetBookings.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-gray-500" colSpan={3}>No upcoming bookings</TableCell>
                      </TableRow>
                    ) : (
                      upcomingAssetBookings.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{b.assetId}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(b.startDate).toLocaleDateString()}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(b.endDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Section>
          </div>

          {/* Open issues */}
          <div className="col-span-12 xl:col-span-6">
            <Section title="Issues (Open)">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Asset</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Description</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Priority</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {openIssues.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-gray-500" colSpan={4}>No open issues</TableCell>
                      </TableRow>
                    ) : (
                      openIssues.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{it.assetId}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{it.description}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{it.priorityName}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{it.statusName}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* Nothing enabled state */}
      {!deskBooking && !assetTracking && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
          <p className="text-gray-500 dark:text-gray-400">No features are currently enabled for your account. Please contact your administrator.</p>
        </div>
      )}
    </>
  );
}

function KpiCard({ label, value, icon, onClick }: { label: string; value: number; icon?: React.ReactNode; onClick?: () => void }) {
  const clickable = typeof onClick === 'function';
  const renderedIcon = React.isValidElement(icon)
    ? (() => {
        const iconEl = icon as React.ReactElement<{ className?: string }>;
        const mergedClassName = [
          'w-6 h-6',
          'fill-current stroke-current',
          'text-gray-800 dark:text-white/90',
          iconEl.props?.className || ''
        ].join(' ').trim();
        return React.cloneElement(iconEl, { className: mergedClassName });
      })()
    : icon;
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
          {renderedIcon}
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
