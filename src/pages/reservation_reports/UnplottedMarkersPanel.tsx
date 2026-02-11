import { useEffect, useState } from "react";
import { useToast } from "../../context/useToast";
import { useResourceImportApi } from "../../hooks/api/useResourceImportApi";
import type { FloorplanMarker, UnplottedResponse } from "../../types/floorplan";

export default function UnplottedMarkersPanel({ companyId }: { companyId: string }) {
  const { getUnplottedResources } = useResourceImportApi();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FloorplanMarker[]>([]);
  const [total, setTotal] = useState(0);
  const toast = useToast();

  useEffect(() => {
    if (!companyId) return;
    let mounted = true;
    setLoading(true);
    getUnplottedResources(companyId, page, pageSize)
      .then((res: UnplottedResponse) => {
        if (!mounted) return;
        const newItems = res.items || [];
        // avoid updating state if identical to prevent extra renders
        if (newItems.length === items.length && newItems.every((v, i) => v.id === items[i]?.id)) {
          setTotal(res.total || 0);
          return;
        }
        setItems(newItems);
        setTotal(res.total || 0);
      })
      .catch((err) => {
        toast.error(err?.message || "Failed to load unplotted markers");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // Intentionally omit getUnplottedResources and toast from deps to avoid
    // re-running when their references change. Depend only on stable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Un-plotted Resources ({total})</h3>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 rounded border text-xs">Prev</button>
          <span className="text-xs">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-2 py-1 rounded border text-xs">Next</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border p-2 max-h-64 overflow-auto">
          {loading ? <div>Loading…</div> : items.length === 0 ? <div className="text-xs">No un-plotted resources</div> : (
            <ul className="text-sm space-y-1">
              {items.map(it => (
                <li key={it.id} className="p-1 border-b">
                  <div className="font-medium">{it.name || it.resourceId}</div>
                  <div className="text-xs text-gray-600">{it.type === 0 ? 'Desk' : it.type === 1 ? 'Room' : 'Resource'} • {it.email}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded border p-2 bg-white">
          <div className="relative mx-auto h-72 w-full bg-gray-50" style={{ maxWidth: 420 }}>
            {items.map((m) => {
              const left = typeof m.x === "number" ? `${Math.max(0, Math.min(100, m.x * 100))}%` : undefined;
              const top = typeof m.y === "number" ? `${Math.max(0, Math.min(100, m.y * 100))}%` : undefined;
              const label = m.type === 0 ? "D" : m.type === 1 ? "R" : "R";
              const titleType = m.type === 0 ? "Desk" : m.type === 1 ? "Room" : "Resource";
              return (
                <div
                  key={m.id}
                  title={`${m.name || m.resourceId} (${titleType})`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 text-white text-xs w-7 h-7 flex items-center justify-center"
                  style={left && top ? { left, top } : undefined}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
