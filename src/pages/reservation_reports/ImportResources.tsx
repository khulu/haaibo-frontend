import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { useToast } from "../../context/useToast";

import getAuth from "../../hooks/api/useAuthApi";
import useOrganizationsApi from "../../hooks/api/useOrganizationApi";
import useLocationsApi, { LocationDto, FloorplanMarker } from "../../hooks/api/useLocationsApi";
import { useResourceImportApi } from "../../hooks/api/useResourceImportApi";

type ImportMethod = "api" | "csv" | "manual";

type ResourceRow = {
  id: string;
  // 0 = Desk, 1 = Meeting Room
  type: 0 | 1;
  name: string;
  email?: string;
  capacity?: number;
  features?: string;
  status?: string;
};

export default function ImportResources() {
  const [step, setStep] = useState<number>(1);
  const [method, setMethod] = useState<ImportMethod>("api");
  const [isImporting, setIsImporting] = useState(false);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<'All' | 0 | 1>('All');
  const toast = useToast();

  // API config state (mock/demo)
  const [tenantId, setTenantId] = useState("12345678-1234-1234-1234-123456789abc");
  const [clientId, setClientId] = useState("abcdef12-3456-7890-abcd-ef1234567890");
  const [clientSecret, setClientSecret] = useState("");
  const [importDesks, setImportDesks] = useState(true);
  const [importRooms, setImportRooms] = useState(true);
  const [importBooths, setImportBooths] = useState(true);

  // API: Test Graph Connection
  const { testGraphConnection, syncResources, getUnplottedResources } = useResourceImportApi();
  const [testLoading, setTestLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncLog, setSyncLog] = useState<import("../../hooks/api/useResourceImportApi").SyncLog | null>(null);
  type TestGraphConnectionResult = {
    ok?: boolean;
    message?: string;
  };
  
  const [testResult, setTestResult] = useState<TestGraphConnectionResult | null>(null);

  const [unplottedLoading, setUnplottedLoading] = useState(false);

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await testGraphConnection({ tenantId, clientId, clientSecret });
      const ok = (res as any)?.ok ?? (res as any)?.success ?? false;
      const message = (res as any)?.message ?? (ok ? "Connection successful" : "Connection failed");
      setTestResult({ ok, message });
      if (ok) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (e: unknown) {
      let message = "Unknown error";
      if (typeof e === "object" && e !== null && "message" in e) {
        message = (e as { message?: string }).message || message;
      }
      setTestResult({ ok: false, message });
      toast.error(message || "Connection failed");
    } finally {
      setTestLoading(false);
    }
  };

  const handleSyncResources = async () => {
    console.log("handleSyncResources: companyId", companyId);
    if (!companyId) {
      toast.error("Missing companyId");
      return;
    }
    setSyncLoading(true);
    setSyncLog(null);
    const creds = tenantId || clientId || clientSecret ? { tenantId, clientId, clientSecret } : undefined;
    syncResources(companyId as string, creds)
      .then((log) => {
        setSyncLog(log);
        if (log.Status === "Failed" || log.ErrorMessage) {
          toast.error(log.ErrorMessage || "Sync failed");
        } else {
          toast.success("Synced to Microsoft 365");
          // advance to review step after successful import/sync
          setStep(2);
        }
      })
      .catch((e) => {
        toast.error(e?.message || "Sync failed");
      })
      .finally(() => {
        setSyncLoading(false);
      });
  };

  // Feature flag: enableOfficeReservations
  const auth = getAuth();
  const companyId = auth.getCompanyId();
  const { getOrganizationById } = useOrganizationsApi();
  const { listTree, getMarkers, createMarker } = useLocationsApi();
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [officeEnabled, setOfficeEnabled] = useState<boolean | null>(null);
  const [markers, setMarkers] = useState<FloorplanMarker[]>([]);
  const [placementMode, setPlacementMode] = useState<'desk' | 'room' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (companyId) {
          const org = await getOrganizationById(companyId as string);
          setOfficeEnabled(org?.enableOfficeReservations ?? null);
        }
      } catch {
        setOfficeEnabled(null);
      }
    })();
  }, [companyId, getOrganizationById]);

  useEffect(() => {
    let mounted = true;
    const loadLocations = async () => {
      if (!companyId) return;
      try {
        const tree = await listTree(companyId as string);
        if (!mounted) return;
        // flatten and keep only locations with floorplanPath
        const flatten = (nodes: LocationDto[]): LocationDto[] => nodes.flatMap(n => [n, ...(n.children ? flatten(n.children) : [])]);
        const all = flatten(tree).filter(n => n.floorplanPath);
        // shallow compare to avoid updating state with identical data
        const same = all.length === locations.length && all.every((v, i) => v.id === locations[i]?.id);
        if (!same) {
          setLocations(all);
          if (all.length > 0 && !selectedFloorId) setSelectedFloorId(all[0].id);
        }
      } catch (e) {
        // ignore
      }
    };
    loadLocations();
    return () => { mounted = false; };
    // omit listTree from deps (function ref) to avoid re-running every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Load un-plotted resources into table when entering Step 2
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (step !== 2 || !companyId) return;
      setUnplottedLoading(true);
      try {
        const res = await getUnplottedResources(companyId as string, 1, 50);
        if (!mounted) return;
        setResources(res.items || []);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load resources");
      } finally {
        mounted && setUnplottedLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
    // omit getUnplottedResources and toast from deps to avoid re-running when their refs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, companyId]);

  // Load markers for selected floor (Step 3)
  useEffect(() => {
    let mounted = true;
    const loadMarkers = async () => {
      if (!selectedFloorId) {
        setMarkers([]);
        return;
      }
      try {
        const m = await getMarkers(selectedFloorId);
        if (!mounted) return;
        setMarkers(m || []);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load markers");
      }
    };
    loadMarkers();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloorId]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesType = typeFilter === "All" || r.type === typeFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || [r.id, r.name, r.email, r.features].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [resources, search, typeFilter]);

  const goToStep = (n: number) => setStep(n);

  const selectImportMethod = (m: ImportMethod) => setMethod(m);

  // CSV/manual upload removed in Step 1 per requirements

  const importViaApi = async () => {
    // Simulate an API import; in real impl, call Graph import endpoint
    setIsImporting(true);
    setTimeout(() => {
      const demo: ResourceRow[] = [];
      for (let i = 1; i <= 50; i++) {
        demo.push({
          id: `DESK-${String(i).padStart(3, "0")}`,
          type: 0,
          name: `Individual Desk ${i}`,
          email: `desk-${String(i).padStart(3, "0")}@company.com`,
          capacity: 1,
          features: "Monitor, Sit-Stand",
          status: "Unassigned",
        });
      }
      for (let i = 1; i <= 10; i++) {
        demo.push({
          id: `MTG-${String(i).padStart(3, "0")}`,
          type: 1,
          name: `Meeting Room ${String.fromCharCode(64 + i)}`,
          email: `mtg-${String(i).padStart(3, "0")}@company.com`,
          capacity: 6 + (i % 3) * 2,
          features: "Video Conf, Whiteboard",
          status: "Unassigned",
        });
      }
      setResources(demo);
      toast.success("Imported resources via Microsoft Graph API");
      setStep(2);
      setIsImporting(false);
    }, 1000);
  };

  const handleCellClick = async (index: number) => {
    if (!placementMode) return;
    if (!selectedFloorId) {
      toast.error('Select a floor first');
      return;
    }

    const desiredType = placementMode === 'desk' ? 0 : 1;
    const resource = resources.find(r => (r.status || 'Unassigned') !== 'Assigned' && r.type === desiredType);
    if (!resource) {
      toast.info(`No unassigned ${placementMode}s available`);
      return;
    }

    // prevent placing on an occupied cell
    const exists = markers.find(m => m.xPosition === x && m.yPosition === y);
    if (exists) {
      toast.info('Cell already occupied');
      console.log('handleCellClick: occupied', { index, x, y, exists });
      return;
    }

    const x = index % 12;
    const y = Math.floor(index / 12);
    console.log('handleCellClick: placing', { index, x, y, resource, selectedFloorId });
    setResources(prev => prev.map(p => p.id === resource.id ? { ...p, status: 'Assigned' } : p));
    try {
      const created = await createMarker({
        name: resource.name,
        type: resource.type,
        xPosition: x,
        yPosition: y,
        locationId: selectedFloorId,
        deskCode: resource.id,
      });
      console.log('handleCellClick: created marker', created);
      setMarkers(prev => [...prev, created]);
      toast.success(`Placed ${resource.name}`);
    } catch (e: any) {
      setResources(prev => prev.map(p => p.id === resource.id ? { ...p, status: 'Unassigned' } : p));
      const errMsg = e?.response?.data?.message || e?.message || 'Failed to place resource';
      console.error('handleCellClick: createMarker error', e);
      toast.error(errMsg);
    }
  };

  const allocationProgress = useMemo(() => {
    const total = resources.length || 1;
    const allocated = resources.filter(r => r.status === 'Assigned').length;
    const pct = Math.round((allocated / total) * 100);
    return { allocated, total, pct };
  }, [resources]);

  return (
    <div className="px-4 py-6 sm:px-6">
      <PageMeta title="Import Resources" description="Import, review, and allocate workspace resources" />

      {/* Gate visibility by Office Reservations flag */}
      {officeEnabled === false && (
        <ComponentCard title="Office Reservations Disabled" desc="Enable Office Reservations to use Resource Import">
          <div className="text-sm text-gray-600">This feature is available when Office Reservations are enabled for your organization.</div>
        </ComponentCard>
      )}

      <ComponentCard title="🏢 Resource Allocation Manager" desc="Import, review, and allocate desks and rooms across your floor plans">
        {/* Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-between relative">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex-1 text-center relative cursor-pointer" onClick={() => goToStep(n)}>
                {n !== 1 && <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200" />}
                <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${step === n ? "bg-brand-500 text-white" : step > n ? "bg-success-500 text-white" : "bg-gray-200 text-gray-600"}`}>{n}</div>
                <div className={`text-xs font-medium ${step === n ? "text-brand-600" : "text-gray-600"}`}>
                  {n === 1 && "Import Resources"}
                  {n === 2 && "Review Data"}
                  {n === 3 && "Allocate to Floors"}
                  {n === 4 && "Summary & Export"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Import */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Step 1: Import Resources from Microsoft 365</h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[{ key: "api", title: "📡 Microsoft Graph API", desc: "Connect to Microsoft 365 for real-time sync." }].map((c) => (
                <div
                  key={c.key}
                  className={`rounded-lg border-2 p-5 transition ${method === c.key ? "border-brand-500 bg-blue-50" : "border-gray-200 hover:border-brand-500"}`}
                  onClick={() => selectImportMethod(c.key as ImportMethod)}
                >
                  <div className="text-brand-600 font-semibold mb-1">{c.title}</div>
                  <div className="text-sm text-gray-600">{c.desc}</div>
                </div>
              ))}
            </div>

            {method === "api" && (
              <div className="rounded-lg border bg-gray-50 p-4">
                <h3 className="mb-4 text-sm font-semibold">Configure Microsoft Graph API Connection</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Tenant ID</Label>
                    <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                  </div>
                  <div>
                    <Label>Client ID</Label>
                    <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                  </div>
                  <div>
                    <Label>Client Secret</Label>
                    <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="Enter your client secret" />
                  </div>
                </div>
                <div className="mt-3 flex gap-4">
                  <Checkbox label="Workspaces (Desks)" checked={importDesks} onChange={setImportDesks} />
                  <Checkbox label="Meeting Rooms" checked={importRooms} onChange={setImportRooms} />
                  <Checkbox label="Phone Booths" checked={importBooths} onChange={setImportBooths} />
                </div>

                <div className="mt-4 flex gap-3 items-center">
                  <Button
                    onClick={handleSyncResources}
                    disabled={isImporting || !testResult || !testResult.ok}
                  >
                    🔄 Import Resources
                  </Button>
                  <Button variant="outline" onClick={handleTestConnection} disabled={testLoading}>
                    {testLoading ? "Testing..." : "Test Connection"}
                  </Button>
                  {testResult && (
                    <span className={`text-sm font-medium ml-2 ${testResult.ok ? "text-success-600" : "text-error-600"}`}>{testResult.message}</span>
                  )}
                </div>
              </div>
            )}

            {/* CSV Upload and Manual Entry removed */}
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Step 2: Review Imported Resources</h2>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-md border bg-blue-50 p-4 text-center">
                <div className="text-2xl font-bold text-brand-600">{resources.length || 0}</div>
                <div className="text-xs text-gray-600">Total Resources</div>
              </div>
              <div className="rounded-md border bg-blue-50 p-4 text-center">
                <div className="text-2xl font-bold text-brand-600">{resources.filter(r => r.type === 0).length}</div>
                <div className="text-xs text-gray-600">Desks</div>
              </div>
              <div className="rounded-md border bg-blue-50 p-4 text-center">
                <div className="text-2xl font-bold text-brand-600">{resources.filter(r => r.type === 1).length}</div>
                <div className="text-xs text-gray-600">Meeting Rooms</div>
              </div>
              <div className="rounded-md border bg-blue-50 p-4 text-center">
                <div className="text-2xl font-bold text-brand-600">{resources.filter(r => r.type !== 0 && r.type !== 1).length}</div>
                <div className="text-xs text-gray-600">Phone Booths</div>
              </div>
            </div>

            

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
                <select className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700" value={typeFilter === 'All' ? 'All' : String(typeFilter)} onChange={(e) => {
                  const v = e.target.value;
                  setTypeFilter(v === 'All' ? 'All' : (Number(v) as 0 | 1));
                }}>
                  <option value="All">All</option>
                  <option value="0">Desk</option>
                  <option value="1">Room</option>
                </select>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto border rounded-lg">
              <Table className="">
                <TableHeader>
                  <TableRow>
                    {step !== 2 && (
                      <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">ID</TableCell>
                    )}
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Type</TableCell>
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Name</TableCell>
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Email</TableCell>
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Capacity</TableCell>
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Features</TableCell>
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Status</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.slice(0, 50).map((r) => (
                    <TableRow key={r.id} className="border-t">
                      {step !== 2 && <TableCell className="px-4 py-2 text-sm">{r.id}</TableCell>}
                      <TableCell className="px-4 py-2 text-sm">
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${r.type === 0 ? "bg-green-50 text-green-700" : r.type === 1 ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"}`}>{r.type === 0 ? "Desk" : r.type === 1 ? "Room" : "Other"}</span>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-sm">{r.name}</TableCell>
                      <TableCell className="px-4 py-2 text-xs">{r.email}</TableCell>
                      <TableCell className="px-4 py-2 text-sm">{r.capacity}</TableCell>
                      <TableCell className="px-4 py-2 text-xs">{r.features}</TableCell>
                      <TableCell className="px-4 py-2 text-sm">{r.status || "Unassigned"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => goToStep(1)}>← Back</Button>
              <Button onClick={() => goToStep(3)}>Continue to Allocation →</Button>
            </div>
          </div>
        )}

        {/* Step 3: Allocate */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Step 3: Allocate Resources to Floor Plans</h2>

            {/* UnplottedMarkersPanel removed per request */}

            <div className="grid gap-4 lg:grid-cols-[250px_1fr_300px]">
              {/* Floors */}
              <div className="rounded-lg border bg-gray-50 p-3 overflow-y-auto max-h-[600px]">
                <h4 className="mb-2 text-sm font-semibold">Buildings & Floors</h4>
                  {locations.length === 0 && (
                    <div className="text-sm text-gray-600">No floors available</div>
                  )}
                  {locations.map((loc, idx) => (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedFloorId(loc.id)}
                      className={`mb-2 cursor-pointer rounded border px-3 py-2 text-sm ${selectedFloorId === loc.id ? "bg-brand-500 text-white border-brand-500" : "bg-white hover:border-brand-300"}`}
                    >
                      {loc.name}
                    </div>
                  ))}
              </div>

              {/* Canvas */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-sm font-semibold">Ground Floor Layout</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant={placementMode === 'desk' ? undefined : 'outline'} onClick={() => setPlacementMode(prev => prev === 'desk' ? null : 'desk')}>Place Desks</Button>
                    <Button size="sm" variant={placementMode === 'room' ? undefined : 'outline'} onClick={() => setPlacementMode(prev => prev === 'room' ? null : 'room')}>Place Rooms</Button>
                    <Button size="sm" variant="outline" onClick={() => toast.info('Auto-Fill not implemented')}>Auto-Fill</Button>
                    <Button size="sm" variant="outline" onClick={() => { setMarkers([]); toast.info('Cleared local markers (not deleted from server)'); }}>Clear</Button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-12 gap-2">
                  {Array.from({ length: 144 }).map((_, i) => {
                    const x = i % 12;
                    const y = Math.floor(i / 12);
                    const marker = markers.find(m => m.xPosition === x && m.yPosition === y);
                    return (
                      <div key={i} onClick={() => handleCellClick(i)} className="aspect-square cursor-pointer rounded border bg-white hover:border-brand-400 text-[10px] flex items-center justify-center relative">
                        {marker ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="rounded bg-brand-600 text-white px-1 text-[10px]">{marker.deskCode || marker.name}</div>
                          </div>
                        ) : (
                          <div className="text-[10px]">{i + 1}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unassigned */}
              <div className="rounded-lg border bg-gray-50 p-3 overflow-y-auto max-h-[600px]">
                <h4 className="mb-3 text-sm font-semibold">Unassigned Resources ({Math.max(0, (resources.length || 0) - 125)})</h4>
                {resources.slice(0, 30).map((r) => (
                  <div key={r.id} className="mb-2 rounded border bg-white p-2 text-xs">
                    <div className="font-semibold">{r.id}</div>
                    <div className="text-gray-600">{r.type === 0 ? 'Desk' : r.type === 1 ? 'Room' : 'Resource'} — {r.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => goToStep(2)}>← Back</Button>
                <Button variant="outline">Save Progress</Button>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <span>Allocation Progress: {allocationProgress.allocated}/{allocationProgress.total} ({allocationProgress.pct}%)</span>
                <div className="h-2 w-52 rounded bg-gray-200 overflow-hidden">
                  <div className="h-2 bg-success-500" style={{ width: `${allocationProgress.pct}%` }} />
                </div>
                <Button onClick={() => goToStep(4)}>Complete Allocation →</Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="rounded-lg border-2 border-success-500 bg-green-50 p-6 text-center">
              <h2 className="text-xl font-semibold text-success-700">✓ Allocation Complete!</h2>
              <p className="text-sm text-success-800">All resources have been successfully allocated across floors</p>
            </div>

            <h2 className="text-lg font-semibold text-gray-800">Allocation Summary</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-brand-600 mb-2">By Resource Type</h3>
                <div className="flex justify-between py-1 text-sm"><span>Desks</span><strong>{resources.filter(r => r.type === 0).length}</strong></div>
                <div className="flex justify-between py-1 text-sm"><span>Meeting Rooms</span><strong>{resources.filter(r => r.type === 1).length}</strong></div>
                <div className="flex justify-between py-1 text-sm"><span>Phone Booths</span><strong>{resources.filter(r => r.type !== 0 && r.type !== 1).length}</strong></div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-brand-600 mb-2">By Floor Distribution</h3>
                <div className="flex justify-between py-1 text-sm"><span>Average per Floor</span><strong>60</strong></div>
                <div className="flex justify-between py-1 text-sm"><span>Total Floors</span><strong>10</strong></div>
                <div className="flex justify-between py-1 text-sm"><span>Buildings</span><strong>2</strong></div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-brand-600 mb-2">Capacity Overview</h3>
                <div className="flex justify-between py-1 text-sm"><span>Individual Seats</span><strong>{resources.filter(r => r.type === 0).length}</strong></div>
                <div className="flex justify-between py-1 text-sm"><span>Meeting Capacity</span><strong>560</strong></div>
                <div className="flex justify-between py-1 text-sm"><span>Total Capacity</span><strong>1060</strong></div>
              </div>
            </div>

            <h3 className="mt-4 text-sm font-semibold">Floor-by-Floor Breakdown</h3>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Floor</TableCell>
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Desks</TableCell>
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Meeting Rooms</TableCell>
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Phone Booths</TableCell>
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Total</TableCell>
                    <TableCell isHeader className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold">Capacity</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {["Ground Floor", "Floor 2", "Floor 3", "Floor 4", "Floor 5", "Floor 6", "Floor 7", "Floor 8", "Floor 9", "Floor 10"].map((floor, idx) => (
                    <TableRow key={idx} className="border-t">
                      <TableCell className="px-4 py-2 text-sm">{floor}</TableCell>
                      <TableCell className="px-4 py-2 text-sm">50</TableCell>
                      <TableCell className="px-4 py-2 text-sm">8</TableCell>
                      <TableCell className="px-4 py-2 text-sm">2</TableCell>
                      <TableCell className="px-4 py-2 text-sm">60</TableCell>
                      <TableCell className="px-4 py-2 text-sm">106</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => goToStep(3)}>← Back to Allocation</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast.success("Exported floor plans")}>Export Floor Plans (PDF)</Button>
                <Button variant="outline" onClick={() => toast.success("Exported CSV")}>Export Data (CSV)</Button>
                <Button onClick={() => { console.log("Sync button clicked"); handleSyncResources(); }} disabled={syncLoading}>
                  {syncLoading ? "Syncing..." : "Sync to Microsoft 365"}
                </Button>
              </div>
            </div>
            {syncLog && (
              <div className="mt-4 rounded border bg-gray-50 p-4 text-sm">
                <div className="font-semibold mb-2">Sync Log</div>
                <div>Status: <span className={syncLog.Status === "Failed" ? "text-error-600" : "text-success-600"}>{syncLog.Status}</span></div>
                <div>Started: {syncLog.StartedAt}</div>
                <div>Completed: {syncLog.CompletedAt}</div>
                <div>Imported: {syncLog.ResourcesImported}</div>
                <div>Updated: {syncLog.ResourcesUpdated}</div>
                <div>Failed: {syncLog.ResourcesFailed}</div>
                {syncLog.ErrorMessage && <div className="text-error-600">Error: {syncLog.ErrorMessage}</div>}
              </div>
            )}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
