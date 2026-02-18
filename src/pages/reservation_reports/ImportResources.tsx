import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { useToast } from "../../context/useToast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { resolveImageSrc } from "../../utils/resolveImageSrc";

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
  const [isImporting] = useState(false);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<'All' | 0 | 1>('All');
  const toast = useToast();

  // API config state (mock/demo)
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [importDesks, setImportDesks] = useState(true);
  const [importRooms, setImportRooms] = useState(true);
  const [importBooths, setImportBooths] = useState(true);

  // API: Test Graph Connection
  const { testGraphConnection, syncResources, getUnplottedResources } = useResourceImportApi();
  const [testLoading, setTestLoading] = useState(false);
  const [, setSyncLoading] = useState(false);
  const [, setSyncLog] = useState<import("../../hooks/api/useResourceImportApi").SyncLog | null>(null);
  type TestGraphConnectionResult = {
    ok?: boolean;
    message?: string;
  };
  
  const [testResult, setTestResult] = useState<TestGraphConnectionResult | null>(null);

  const [unplottedLoading, setUnplottedLoading] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await testGraphConnection({ tenantId, clientId, clientSecret });
      console.log("Microsoft Graph API test connection response:", res);
      const ok = res.ok ?? (res as { success?: boolean }).success ?? false;
      const message = res.message ?? (ok ? "Connection successful" : "Connection failed");
      setTestResult({ ok, message });
      if (ok) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (e: unknown) {
      console.log("Microsoft Graph API test connection error:", e);
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
        console.log("Microsoft Graph API sync resources response:", log);
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
        console.log("Microsoft Graph API sync resources error:", e);
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
  const { listTree, getMarkers, createMarker, deleteMarker } = useLocationsApi();
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [officeEnabled, setOfficeEnabled] = useState<boolean | null>(null);
  const [markers, setMarkers] = useState<FloorplanMarker[]>([]);
  const [placementMode] = useState<'desk' | 'room' | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const imageOverlayRef = useRef<L.ImageOverlay | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

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
      } catch {
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
        console.log("Resources response from Microsoft:", res);
        console.log("Resources items:", res.items);
        if (!mounted) return;
        const mapped = (res.items || []).map((i) => ({
          id: i.resourceId || i.id,
          type: (i.type ?? 0) as 0 | 1,
          name: i.name || i.resourceId || 'Resource',
          email: i.email,
          capacity: i.capacity,
          features: i.features,
          status: i.status || 'Unassigned',
        }));
        console.log("Mapped resources:", mapped);
        setResources(mapped);
      } catch (e: unknown) {
        console.log("Error loading resources from Microsoft:", e);
        const msg = typeof e === 'object' && e && 'message' in e ? (e as { message?: string }).message : undefined;
        toast.error(msg || "Failed to load resources");
      } finally {
        if (mounted) setUnplottedLoading(false);
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
      } catch (e: unknown) {
        const msg = typeof e === 'object' && e && 'message' in e ? (e as { message?: string }).message : undefined;
        toast.error(msg || "Failed to load markers");
      }
    };
    loadMarkers();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloorId]);

  // Initialize Leaflet map
  useEffect(() => {
    if (step !== 3) return;
    if (mapRef.current) return; // Already initialized

    const mapContainer = document.getElementById('floorplan-map');
    if (!mapContainer) return;

    // Initialize map
    const map = L.map('floorplan-map', {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 2,
      zoomControl: true,
      attributionControl: false,
    });

    // Create marker layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        imageOverlayRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, [step]);

  // Update map when floor changes
  useEffect(() => {
    if (!mapRef.current || !selectedFloorId) return;

    const selectedLocation = locations.find(l => l.id === selectedFloorId);
    if (!selectedLocation?.floorplanPath) return;

    // Remove old image overlay if exists
    if (imageOverlayRef.current) {
      imageOverlayRef.current.remove();
    }

    // Create temporary image to get dimensions
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const bounds: L.LatLngBoundsExpression = [[0, 0], [height, width]];

      // Add image overlay
      const imageOverlay = L.imageOverlay(selectedLocation.floorplanPath!, bounds).addTo(mapRef.current!);
      imageOverlayRef.current = imageOverlay;

      // Fit map to bounds
      mapRef.current!.fitBounds(bounds);
    };
    img.src = selectedLocation.floorplanPath;
  }, [selectedFloorId, locations]);

  // Update markers on map
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add markers
    markers.forEach((marker) => {
      if (marker.locationId !== selectedFloorId) return;

      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: ${marker.type === 0 ? '#16a34a' : '#2563eb'};
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">${marker.deskCode || marker.name}</div>`,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      const leafletMarker = L.marker([marker.yPosition, marker.xPosition], {
        icon: markerIcon,
        draggable: false,
      }).addTo(markersLayerRef.current!);

      // Add click handler to remove marker
      leafletMarker.on('click', async () => {
        if (!window.confirm(`Remove ${marker.name}?`)) return;

        try {
          await deleteMarker(marker.id);
          setMarkers(prev => prev.filter(m => m.id !== marker.id));
          if (marker.deskCode) {
            setResources(prev => prev.map(p => p.id === marker.deskCode ? { ...p, status: 'Unassigned' } : p));
          }
          toast.success(`Removed ${marker.name}`);
        } catch (e: unknown) {
          const msg = typeof e === 'object' && e && 'message' in e ? (e as { message?: string }).message : undefined;
          toast.error(msg || 'Failed to remove marker');
        }
      });
    });
  }, [markers, selectedFloorId, deleteMarker, toast]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesType = typeFilter === "All" || r.type === typeFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || [r.id, r.name, r.email, r.features].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [resources, search, typeFilter]);

  // Calculate unassigned resources for Step 3
  const unassignedResources = useMemo(() => {
    return resources.filter(r => (r.status || 'Unassigned') !== 'Assigned');
  }, [resources]);

  // Step 4 removed: floor summary no longer needed

  const goToStep = (n: number) => setStep(n);

  const selectImportMethod = (m: ImportMethod) => setMethod(m);

  // CSV/manual upload removed in Step 1 per requirements

  // importViaApi removed (not used)

  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    if (!placementMode) return;
    if (!selectedFloorId) {
      toast.error('Select a floor first');
      return;
    }

    const { lat, lng } = e.latlng;
    const y = Math.round(lat);
    const x = Math.round(lng);

    const desiredType = placementMode === 'desk' ? 0 : 1;
    const resource = resources.find(r => (r.status || 'Unassigned') !== 'Assigned' && r.type === desiredType);
    if (!resource) {
      toast.error(`No unassigned ${placementMode}s available`);
      return;
    }

    // Check if position is occupied (within tolerance)
    const tolerance = 10;
    const exists = markers.find(m => 
      m.locationId === selectedFloorId &&
      Math.abs(m.xPosition - x) < tolerance && 
      Math.abs(m.yPosition - y) < tolerance
    );
    if (exists) {
      toast.error('Position already occupied');
      return;
    }

    console.log('handleMapClick: placing', { x, y, resource, selectedFloorId });
    
    // Optimistically update UI
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
      console.log('handleMapClick: created marker', created);
      setMarkers(prev => [...prev, created]);
      toast.success(`Placed ${resource.name}`);
    } catch (e: unknown) {
      // Revert optimistic update on error
      setResources(prev => prev.map(p => p.id === resource.id ? { ...p, status: 'Unassigned' } : p));
      let errMsg = 'Failed to place resource';
      if (typeof e === 'object' && e !== null) {
        const maybe = e as { response?: { data?: { message?: string } }; message?: string };
        errMsg = maybe?.response?.data?.message || maybe?.message || errMsg;
      }
      console.error('handleMapClick: createMarker error', e);
      toast.error(errMsg);
    }
  }, [placementMode, selectedFloorId, resources, markers, createMarker, toast]);

  // Attach map click handler when placement mode changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (placementMode) {
      mapRef.current.on('click', handleMapClick);
      // Change cursor
      const container = mapRef.current.getContainer();
      container.style.cursor = 'crosshair';
    } else {
      mapRef.current.off('click', handleMapClick);
      // Reset cursor
      const container = mapRef.current.getContainer();
      container.style.cursor = '';
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
    };
  }, [placementMode, handleMapClick]);

  const handleAutoFill = async () => {
    if (!selectedFloorId) {
      toast.error('Select a floor first');
      return;
    }

    const selectedLocation = locations.find(l => l.id === selectedFloorId);
    if (!selectedLocation?.floorplanPath) {
      toast.error('No floorplan available');
      return;
    }

    const unassigned = resources.filter(r => (r.status || 'Unassigned') !== 'Assigned');
    if (unassigned.length === 0) {
      toast.error('No unassigned resources available');
      return;
    }

    toast.success(`Auto-filling ${Math.min(unassigned.length, 20)} resources...`);

    // Get image dimensions to determine placement area
    const img = new Image();
    img.onload = async () => {
      const width = img.width;
      const height = img.height;

      // Create a grid of potential positions (percent coordinates)
      const gridSpacing = 50; // pixels between markers
      const positions: { xPct: number; yPct: number }[] = [];

      for (let y = gridSpacing; y < height; y += gridSpacing) {
        for (let x = gridSpacing; x < width; x += gridSpacing) {
          // Convert to percent
          const xPct = (x / width) * 100;
          const yPct = (y / height) * 100;
          // Check if position is occupied (tolerance in percent)
          const tolerancePct = 2.5;
          const exists = markers.find(m => 
            m.locationId === selectedFloorId &&
            Math.abs(m.xPosition - xPct) < tolerancePct && 
            Math.abs(m.yPosition - yPct) < tolerancePct
          );
          if (!exists) {
            positions.push({ xPct, yPct });
          }
        }
      }

      const toPlace = Math.min(unassigned.length, positions.length, 20); // Limit to 20 at a time
      let placed = 0;

      for (let i = 0; i < toPlace; i++) {
        const pos = positions[i];
        const resource = unassigned[i];

        try {
          const created = await createMarker({
            name: resource.name,
            type: resource.type,
            xPosition: pos.xPct,
            yPosition: pos.yPct,
            locationId: selectedFloorId,
            deskCode: resource.id,
          });
          setMarkers(prev => [...prev, created]);
          setResources(prev => prev.map(p => p.id === resource.id ? { ...p, status: 'Assigned' } : p));
          placed++;
        } catch (e) {
          console.error('Auto-fill error:', e);
        }
      }

      if (placed > 0) {
        toast.success(`Auto-filled ${placed} resources`);
      }
    };
    img.src = selectedLocation.floorplanPath;
  };

  const handleClearFloor = () => {
    if (!selectedFloorId) return;
    
    if (!window.confirm('Clear all markers from this floor? This will set all resources back to Unassigned.')) {
      return;
    }

    const floorMarkers = markers.filter(m => m.locationId === selectedFloorId);
    
    Promise.all(floorMarkers.map(m => deleteMarker(m.id)))
      .then(() => {
        setMarkers(prev => prev.filter(m => m.locationId !== selectedFloorId));
        // Update all resources back to Unassigned
        const markerCodes = floorMarkers.map(m => m.deskCode).filter(Boolean);
        setResources(prev => prev.map(p => 
          markerCodes.includes(p.id) ? { ...p, status: 'Unassigned' } : p
        ));
        toast.success('Floor cleared');
      })
      .catch((e) => {
        toast.error(e?.message || 'Failed to clear floor');
      });
  };

  const allocationProgress = useMemo(() => {
    const total = resources.length || 1;
    const allocated = resources.filter(r => r.status === 'Assigned').length;
    const pct = Math.round((allocated / total) * 100);
    return { allocated, total, pct };
  }, [resources]);

  // Step 4 removed: summary statistics no longer needed

  console.log(locations);

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
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex-1 text-center relative cursor-pointer" onClick={() => goToStep(n)}>
                {n !== 1 && <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200" />}
                <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${step === n ? "bg-brand-500 text-white" : step > n ? "bg-success-500 text-white" : "bg-gray-200 text-gray-600"}`}>{n}</div>
                <div className={`text-xs font-medium ${step === n ? "text-brand-600" : "text-gray-600"}`}>
                  {n === 1 && "Import Resources"}
                  {n === 2 && "Review Data"}
                  {n === 3 && "Allocate to Floors"}
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
            <DndProvider backend={HTML5Backend}>
            <div className="grid gap-4 lg:grid-cols-[250px_1fr_300px]">
              {/* Floors */}
              <div className="rounded-lg border bg-gray-50 p-3 overflow-y-auto max-h-[600px]">
                <h4 className="mb-2 text-sm font-semibold">Buildings & Floors</h4>
                  {locations.length === 0 && (
                    <div className="text-sm text-gray-600">No floors available</div>
                  )}
                  {locations.map((loc) => (
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
                  <h3 className="text-sm font-semibold">
                    {locations.find(l => l.id === selectedFloorId)?.name || 'Floor Layout'}
                  </h3>
                </div>
                {(() => {
                  const selectedLocation = locations.find(l => l.id === selectedFloorId);
                  if (!selectedLocation?.floorplanPath) {
                    return (
                      <div className="w-full h-[500px] bg-gray-100 rounded border flex items-center justify-center text-gray-500 text-sm">
                        No floorplan image available. Showing blank map.
                      </div>
                    );
                  }
                  // Floorplan image with overlay + drop target
                  const FloorImage = () => {
                    // Drop target on image container
                    const [{ isOver }, drop] = useDrop(() => ({
                      accept: 'RESOURCE',
                      drop: async (item: { id: string; name: string; type: 0 | 1 }, monitor) => {
                        if (!selectedFloorId) {
                          toast.error('Select a floor first');
                          return;
                        }
                        if (!imgRef.current) return;
                        const rect = imgRef.current.getBoundingClientRect();
                        const client = monitor.getClientOffset();
                        if (!client) return;
                        const x = client.x - rect.left;
                        const y = client.y - rect.top;
                        const xPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
                        const yPct = Math.max(0, Math.min(100, (y / rect.height) * 100));

                        // prevent overlapping markers (tolerance in percent)
                        const tolerancePct = 2.5;
                        const exists = markers.find(m => 
                          m.locationId === selectedFloorId &&
                          Math.abs(m.xPosition - xPct) < tolerancePct &&
                          Math.abs(m.yPosition - yPct) < tolerancePct
                        );
                        if (exists) {
                          toast.error('Position already occupied');
                          return;
                        }

                        setIsPlacing(true);
                        // Optimistic assign
                        setResources(prev => prev.map(p => p.id === item.id ? { ...p, status: 'Assigned' } : p));
                        try {
                          const created = await createMarker({
                            name: item.name,
                            type: item.type,
                            xPosition: xPct,
                            yPosition: yPct,
                            locationId: selectedFloorId,
                            deskCode: item.id,
                          });
                          setMarkers(prev => [...prev, created]);
                          toast.success(`Placed ${item.name}`);
                        } catch (e: unknown) {
                          setResources(prev => prev.map(p => p.id === item.id ? { ...p, status: 'Unassigned' } : p));
                          let msg = 'Failed to place resource';
                          if (typeof e === 'object' && e !== null) {
                            const maybe = e as { response?: { data?: { message?: string } }; message?: string };
                            msg = maybe?.response?.data?.message || maybe?.message || msg;
                          }
                          toast.error(msg);
                        } finally {
                          setIsPlacing(false);
                        }
                      },
                      collect: (monitor) => ({ isOver: monitor.isOver() })
                    }), [selectedFloorId, markers, createMarker]);

                    const floorMarkers = markers.filter(m => m.locationId === selectedFloorId);

                    return (
                      <div ref={(node) => { if (node) drop(node); }} className="relative w-full h-[500px] bg-gray-100 rounded border overflow-hidden">
                        {isPlacing && (
                          <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        <img
                          ref={imgRef}
                          src={resolveImageSrc(selectedLocation.floorplanPath!)}
                          alt="Floorplan"
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                        {floorMarkers.map((marker) => {
                          const color = marker.type === 0 ? 'bg-green-500' : 'bg-yellow-500';
                          return (
                            <div
                              key={marker.id}
                              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                              style={{ left: `${marker.xPosition}%`, top: `${marker.yPosition}%` }}
                              title={`${marker.name}`}
                              onClick={async () => {
                                if (!window.confirm(`Remove ${marker.name}?`)) return;
                                try {
                                  await deleteMarker(marker.id);
                                  setMarkers(prev => prev.filter(m => m.id !== marker.id));
                                  if (marker.deskCode) {
                                    setResources(prev => prev.map(p => p.id === marker.deskCode ? { ...p, status: 'Unassigned' } : p));
                                  }
                                  toast.success(`Removed ${marker.name}`);
                                } catch (e: unknown) {
                                  const msg = typeof e === 'object' && e && 'message' in e ? (e as { message?: string }).message : undefined;
                                  toast.error(msg || 'Failed to remove marker');
                                }
                              }}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white ${color}`}>
                                {marker.type === 0 ? '🪑' : '👥'}
                              </div>
                            </div>
                          );
                        })}
                        {isOver && (
                          <div className="absolute inset-0 pointer-events-none border-2 border-brand-500/40 rounded" />
                        )}
                      </div>
                    );
                  };

                  return <FloorImage />;
                })()}
              </div>

              {/* Unassigned */}
              <div className="rounded-lg border bg-gray-50 p-3 overflow-y-auto max-h-[600px]">
                <h4 className="mb-3 text-sm font-semibold">Unassigned Resources ({unassignedResources.length})</h4>
                <div className="mb-3 text-xs text-gray-600">
                  Desks: {unassignedResources.filter(r => r.type === 0).length} • 
                  Rooms: {unassignedResources.filter(r => r.type === 1).length}
                </div>
                {unassignedResources.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-8">
                    All resources assigned! 🎉
                  </div>
                )}
                {unassignedResources.slice(0, 30).map((r) => {
                  const DraggableItem = () => {
                    const [{ isDragging }, drag] = useDrag(() => ({
                      type: 'RESOURCE',
                      item: { id: r.id, name: r.name, type: r.type },
                      collect: (monitor) => ({ isDragging: monitor.isDragging() })
                    }), [r.id, r.name, r.type]);
                    return (
                      <div ref={(node) => { if (node) drag(node); }} className={`mb-2 rounded border bg-white p-2 text-xs hover:border-brand-300 transition-colors ${isDragging ? 'opacity-50' : ''}`}>
                        <div className="font-semibold">{r.id}</div>
                        <div className="text-gray-600">{r.type === 0 ? 'Desk' : r.type === 1 ? 'Room' : 'Resource'} — {r.name}</div>
                        {r.capacity && <div className="text-gray-500">Capacity: {r.capacity}</div>}
                      </div>
                    );
                  };
                  return <DraggableItem key={r.id} />;
                })}
                {unassignedResources.length > 30 && (
                  <div className="text-xs text-gray-500 text-center mt-2">
                    + {unassignedResources.length - 30} more
                  </div>
                )}
              </div>
            </div>
            </DndProvider>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => goToStep(2)}>← Back</Button>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <span>Allocation Progress: {allocationProgress.allocated}/{allocationProgress.total} ({allocationProgress.pct}%)</span>
                <div className="h-2 w-52 rounded bg-gray-200 overflow-hidden">
                  <div className="h-2 bg-success-500 transition-all" style={{ width: `${allocationProgress.pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </ComponentCard>
            {unplottedLoading && (
              <div className="text-xs text-gray-500">Loading unassigned resources…</div>
            )}
    </div>
  );
}
