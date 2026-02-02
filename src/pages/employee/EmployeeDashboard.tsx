import PageMeta from "../../components/common/PageMeta";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import useReservations from "@hooks/reservations/useReservations";
import useUser from "@hooks/user/useUser";
import useOrganization from "@hooks/organization/useOrganization";
import useAsset from "@hooks/asset/useAsset";
import useBookings from "@hooks/bookings/useBookings";
import useEvents from "@hooks/event/useEvent";
import useIssues from "@hooks/issues/useIssues";
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

  const { useOrganizationList, useMyCompany } = useOrganization();
  const { data: organizations } = useOrganizationList();
  const { data: myCompany } = useMyCompany();
  const organizationOptions = useMemo(() => (organizations ?? []).map(o => ({ value: o.id, label: o.name })), [organizations]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  const effectiveCompanyId = isSuperAdmin ? selectedCompanyId : (myCompany?.id ?? undefined);
  const orgDetails = useMemo(() => (organizations ?? []).find(o => o.id === effectiveCompanyId), [organizations, effectiveCompanyId]);
  // Feature flags: prefer myCompany flags for employees, orgDetails for SuperAdmin selection, else any org when "All companies"
  const reservationsEnabled = useMemo(() => {
    if (effectiveCompanyId) {
      return !!(isSuperAdmin ? orgDetails?.enableOfficeReservations : myCompany?.enableOfficeReservations);
    }
    return ((organizations ?? []) as Array<{ enableOfficeReservations?: boolean }>).some(o => !!o.enableOfficeReservations);
  }, [organizations, orgDetails, effectiveCompanyId, isSuperAdmin, myCompany]);
  const assetTrackingEnabled = useMemo(() => {
    if (effectiveCompanyId) {
      return !!(isSuperAdmin ? orgDetails?.allowAssetTracking : myCompany?.allowAssetTracking);
    }
    return ((organizations ?? []) as Array<{ allowAssetTracking?: boolean }>).some(o => !!o.allowAssetTracking);
  }, [organizations, orgDetails, effectiveCompanyId, isSuperAdmin, myCompany]);

  // (omitted: contacts, users and issues for this MVP view)

  // My bookings (upcoming)
  // removed useMyBookings usage — upcoming reservations used instead
  const { useReservationSummary } = useReservations();
  const { useUserUpcomingReservations } = useUser();
  const { useAssetList } = useAsset();
  const { useMyBookings } = useBookings();
  const { useEventList } = useEvents();
  const { useIssuesList } = useIssues();

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
  const { data: assets } = useAssetList({ companyId: effectiveCompanyId });
  const { data: myBookings } = useMyBookings({ companyId: effectiveCompanyId, includeAssigned: true, includeCreated: false });
  const { data: myEvents } = useEventList({ companyId: effectiveCompanyId, userId });
  const { data: myReportedIssues } = useIssuesList({ reportedByUserId: userId });

  // KPIs - prefer server summary when available (reservations only when enabled)
  const upcoming7 = reservationsEnabled ? (upcomingReservations ?? []).filter(b => new Date(b.startDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length : 0;
  const nowCheckedIn = reservationsEnabled ? (reservationSummary ? (reservationSummary.checkedInCount > 0 ? 1 : 0) : ((sourceMyBookings ?? []).some(b => new Date(b.startDate).getTime() <= Date.now() && new Date(b.endDate).getTime() >= Date.now() && !!(b as LocalBooking).checkedInAt) ? 1 : 0)) : 0;
  const total30d = reservationsEnabled ? (reservationSummary ? reservationSummary.totalBookings : (sourceMyBookings ?? []).filter(b => new Date(b.startDate).getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000).length) : 0;
  const hours30d = reservationsEnabled ? (reservationSummary ? Math.round(reservationSummary.totalHoursUsed) : Math.round(((sourceMyBookings ?? []).reduce((sum, b) => {
    const start = new Date(b.startDate).getTime();
    const end = new Date(b.endDate).getTime();
    const used = (b as LocalBooking).checkedOutAt ? (new Date((b as LocalBooking).checkedOutAt!).getTime() - ((b as LocalBooking).checkedInAt ? new Date((b as LocalBooking).checkedInAt!).getTime() : start)) : (end - start);
    return sum + (used || 0);
  }, 0)) / (1000 * 60 * 60))) : 0;
  

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


      {!isSuperAdmin && myCompany === null && (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12">
            <Section title="No Company Linked">
              <div className="text-gray-700 dark:text-gray-300">
                Your account is not linked to a company. Please contact your administrator to be added to a company.
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* MVP Employee stats: show reservation KPIs only when reservations feature is enabled */}
      {reservationsEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
          <KpiCard label="Upcoming (7d)" value={upcoming7} onClick={() => navigate('/bookings')} />
          <KpiCard label="Currently Checked-In" value={nowCheckedIn} onClick={() => navigate('/bookings')} />
          <KpiCard label="Total (30d)" value={total30d} onClick={() => navigate('/bookings')} />
          <KpiCard label="Hours Used (30d)" value={hours30d} onClick={() => navigate('/bookings')} />
        </div>
      )}

      {/* Reservations content gated by feature flag */}
      {reservationsEnabled && (
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
      )}

      {/* Asset tracking dashboard (mock data) */}
      {assetTrackingEnabled && (!(!isSuperAdmin && myCompany === null)) && (
        <div className="grid grid-cols-12 gap-4 md:gap-6 mt-6">
          {/* Quick links */}
          <div className="col-span-12">
            <Section title="Assets & Issues">
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={() => navigate('/assets/bookings')}>Book Assets</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => navigate('/assets')}>View Devices</button>
                <button className="px-4 py-2 bg-gray-800 text-white rounded" onClick={() => navigate('/assets/issues')}>Raise Issue</button>
              </div>
            </Section>
          </div>

          {/* Data generation from APIs */}
          {(() => {
            const now = new Date();
            const myAssets = (assets ?? []).filter(a => a.assignedUserId === userId);
            const healthDistribution = myAssets.reduce<Record<string, number>>((acc, a) => {
              const key = (a.condition ?? 'Unknown');
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {});
            const upcomingWarranty = myAssets.filter(a => {
              const exp = a.warrantyExpiryDate ? new Date(a.warrantyExpiryDate).getTime() : NaN;
              return !isNaN(exp) && (exp - now.getTime() <= 60 * 24 * 60 * 60 * 1000);
            });
            const recentEvents = (myEvents ?? []).slice(0, 8).map(e => ({ assetId: e.assetId, event: String(e.eventType), at: e.entryTime }));
            const upcomingBookings = (myBookings ?? [])
              .filter(b => new Date(b.startDate).getTime() >= now.getTime() || (new Date(b.startDate).getTime() <= now.getTime() && new Date(b.endDate).getTime() >= now.getTime()))
              .slice(0, 8)
              .map(b => ({ id: b.id, assetId: b.assetId, start: b.startDate, end: b.endDate }));
            const openIssues = (myReportedIssues ?? []).filter(i => i.statusName?.toLowerCase() !== 'closed')
              .slice(0, 8)
              .map(i => ({ id: i.id, assetId: i.assetId, description: i.description, priority: i.priorityName, status: i.statusName, sla: i.resolvedAt ? 'Closed' : 'Open' }));

            return (
              <>
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
                          {myAssets.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{a.laptopTagNumber || a.assetId || '-'} / {a.serialNumber || '-'}</TableCell>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{a.make} {a.model}</TableCell>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{a.statusName || a.status}</TableCell>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{a.condition || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Section>
                </div>

                {/* Asset health */}
                <div className="col-span-12 xl:col-span-6">
                  <Section title="Asset Health">
                    <ul className="space-y-2 text-gray-800 dark:text-white/90">
                      {Object.entries(healthDistribution).map(([cond, count]) => (
                        <li key={cond} className="flex justify-between"><span>{cond}</span><span>{count}</span></li>
                      ))}
                    </ul>
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
                                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{a.warrantyExpiryDate ? new Date(a.warrantyExpiryDate).toLocaleDateString() : '-'}</TableCell>
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
                          {recentEvents.map((e, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{e.assetId}</TableCell>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{e.event}</TableCell>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(e.at).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Section>
                </div>

                {/* Bookings for my assets */}
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
                          {upcomingBookings.length === 0 ? (
                            <TableRow>
                              <TableCell className="px-5 py-4 text-gray-500" colSpan={3}>No upcoming bookings</TableCell>
                            </TableRow>
                          ) : (
                            upcomingBookings.map((b) => (
                              <TableRow key={b.id}>
                                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{b.assetId}</TableCell>
                                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(b.start).toLocaleDateString()}</TableCell>
                                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(b.end).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Section>
                </div>

                {/* Issues on my assets */}
                <div className="col-span-12 xl:col-span-6">
                  <Section title="Issues (Open)">
                    <div className="max-w-full overflow-x-auto">
                      <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                          <TableRow>
                            <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Asset</TableCell>
                            <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Description</TableCell>
                            <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">Priority</TableCell>
                            <TableCell isHeader className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400">SLA</TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                          {openIssues.map((it) => (
                            <TableRow key={it.id}>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{it.assetId}</TableCell>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{it.description}</TableCell>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{it.priority}</TableCell>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{it.sla}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Section>
                </div>

                
              </>
            );
          })()}
        </div>
      )}
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
