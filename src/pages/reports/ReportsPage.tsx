import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import MultiSelect from "../../components/form/MultiSelect";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import { exportAssetReportCsv, runAssetReport, type ReportFilterDto, type ReportRowDto } from "@hooks/api/reportsApi";
import getAuth from "@hooks/api/useAuthApi";

// Available columns per API spec
const ALL_COLUMNS = [
  "Id",
  "AssetId",
  "Make",
  "Model",
  "SerialNumber",
  "LaptopTagNumber",
  "Condition",
  "Status",
  "CompanyId",
  "CompanyName",
  "AssignedUserId",
  "AssignedUserEmail",
  "AssignedUserName",
  "CollectionId",
  "CollectionName",
  "CreatedAt",
  "UpdatedAt",
];

function stringifyValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export default function ReportsPage() {
  const auth = getAuth();
  const token = auth.getToken();

  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "AssetId",
    "Make",
    "Model",
    "SerialNumber",
    "CompanyName",
    "AssignedUserEmail",
    "CreatedAt",
  ]);
  const [filters, setFilters] = useState<ReportFilterDto>({});
  const [skip, setSkip] = useState(0);
  const [take] = useState(50);
  const [rows, setRows] = useState<ReportRowDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const activeFilterCount = [
    filters.CompanyId,
    filters.CollectionId,
    filters.AssigneeUserId,
    filters.Status,
    filters.Search,
    filters.CreatedFrom,
    filters.CreatedTo,
  ].filter(Boolean).length;

  const sortedRows = useMemo(() => {
    if (!sortBy) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      const as = av === null || av === undefined ? "" : String(av);
      const bs = bv === null || bv === undefined ? "" : String(bv);
      if (as < bs) return -1 * dir;
      if (as > bs) return 1 * dir;
      return 0;
    });
  }, [rows, sortBy, sortDir]);

  const onRun = async () => {
    if (!token) {
      setError("No auth token found. Please sign in.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await runAssetReport(token, {
        Columns: selectedColumns,
        Filters: filters,
        Skip: skip,
        Take: take,
      });
      setRows(result.Rows);
      setTotal(result.Total);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const onExport = async () => {
    if (!token) {
      setError("No auth token found. Please sign in.");
      return;
    }
    try {
      await exportAssetReportCsv(token, { Columns: selectedColumns, Filters: filters, Format: "csv" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    onRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // initial load

  return (
    <>
      <PageMeta title="Asset Reports" description="Run and export asset reports." />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Asset Reports</h1>
          <div className="flex flex-1 items-center gap-2 sm:justify-end">
            <input
              className="rounded border px-3 py-2 text-sm w-full sm:w-64"
              placeholder="Search (make/model/serial/assetId/tag)"
              value={filters.Search ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, Search: e.target.value || undefined }))}
            />
            <div className="w-40">
              <Select
                options={[
                  { value: "", label: "Any Status" },
                  { value: "Available", label: "Available" },
                  { value: "Assigned", label: "Assigned" },
                  { value: "InRepair", label: "InRepair" },
                  { value: "Retired", label: "Retired" },
                ]}
                defaultValue={filters.Status ?? ""}
                onChange={(value) => setFilters((f) => ({ ...f, Status: value || undefined }))}
              />
            </div>
            <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={onRun} disabled={loading}>
              {loading ? "Running..." : "Run"}
            </button>
            <button className="px-3 py-2 bg-gray-200 text-gray-800 rounded" onClick={onExport}>Export CSV</button>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded bg-red-50 text-red-600 px-3 py-2 border border-red-200">{error}</div>
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.Search && (
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-700 dark:text-gray-300">
                Search: {filters.Search}
                <button onClick={() => setFilters((f) => ({ ...f, Search: undefined }))} aria-label="Clear Search" className="text-gray-500">×</button>
              </span>
            )}
            {filters.Status && (
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-700 dark:text-gray-300">
                Status: {filters.Status}
                <button onClick={() => setFilters((f) => ({ ...f, Status: undefined }))} aria-label="Clear Status" className="text-gray-500">×</button>
              </span>
            )}
            {filters.CompanyId && (
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-700 dark:text-gray-300">
                CompanyId: {filters.CompanyId}
                <button onClick={() => setFilters((f) => ({ ...f, CompanyId: undefined }))} aria-label="Clear CompanyId" className="text-gray-500">×</button>
              </span>
            )}
            {filters.CollectionId && (
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-700 dark:text-gray-300">
                CollectionId: {filters.CollectionId}
                <button onClick={() => setFilters((f) => ({ ...f, CollectionId: undefined }))} aria-label="Clear CollectionId" className="text-gray-500">×</button>
              </span>
            )}
            {filters.AssigneeUserId && (
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-700 dark:text-gray-300">
                Assignee: {filters.AssigneeUserId}
                <button onClick={() => setFilters((f) => ({ ...f, AssigneeUserId: undefined }))} aria-label="Clear Assignee" className="text-gray-500">×</button>
              </span>
            )}
            {(filters.CreatedFrom || filters.CreatedTo) && (
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-700 dark:text-gray-300">
                Created: {filters.CreatedFrom ? new Date(filters.CreatedFrom).toLocaleDateString() : ""} – {filters.CreatedTo ? new Date(filters.CreatedTo).toLocaleDateString() : ""}
                <button onClick={() => setFilters((f) => ({ ...f, CreatedFrom: undefined, CreatedTo: undefined }))} aria-label="Clear Created Range" className="text-gray-500">×</button>
              </span>
            )}
            <button className="text-xs text-gray-600 underline" onClick={() => setFilters({})}>Reset filters</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-4">
            <MultiSelect
              label="Columns"
              options={ALL_COLUMNS.map((c) => ({ value: c, text: c }))}
              defaultSelected={selectedColumns}
              onChange={(vals) => setSelectedColumns(vals)}
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-700 dark:text-gray-300">Advanced Filters</div>
              <button
                className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700"
                onClick={() => setFiltersOpen((o) => !o)}
              >
                {filtersOpen ? "Hide" : "Show"} ({activeFilterCount})
              </button>
            </div>
            {filtersOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="rounded border px-3 py-2 text-sm" placeholder="CompanyId (GUID)" value={filters.CompanyId ?? ""} onChange={(e) => setFilters((f) => ({ ...f, CompanyId: e.target.value || undefined }))} />
                <input className="rounded border px-3 py-2 text-sm" placeholder="CollectionId (GUID)" value={filters.CollectionId ?? ""} onChange={(e) => setFilters((f) => ({ ...f, CollectionId: e.target.value || undefined }))} />
                <input className="rounded border px-3 py-2 text-sm" placeholder="AssigneeUserId (GUID)" value={filters.AssigneeUserId ?? ""} onChange={(e) => setFilters((f) => ({ ...f, AssigneeUserId: e.target.value || undefined }))} />
                <div className="sm:col-span-2">
                  <DatePicker
                    id="created-range"
                    label="Created Date Range"
                    mode="range"
                    onChange={(selectedDates: Date[]) => {
                      if (Array.isArray(selectedDates)) {
                        const [from, to] = selectedDates;
                        setFilters((f) => ({
                          ...f,
                          CreatedFrom: from ? new Date(from).toISOString() : undefined,
                          CreatedTo: to ? new Date(to).toISOString() : undefined,
                        }));
                      }
                    }}
                    placeholder="Select date range"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-2 text-sm">Total: {total} {total > 0 && (
          <span className="text-gray-500">(showing {skip + 1}–{Math.min(total, skip + rows.length)})</span>
        )}</div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-white/[0.05] z-10">
              <TableRow>
                {selectedColumns.map((c) => {
                  const isActive = sortBy === c;
                  return (
                    <TableCell
                      key={c}
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer select-none"
                      onClick={() => {
                        setSortBy((prev) => (prev === c ? c : c));
                        setSortDir((prev) => (isActive ? (prev === "asc" ? "desc" : "asc") : "asc"));
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c}
                        {isActive && (
                          <span aria-hidden className="text-gray-400">{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading && (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {selectedColumns.map((c) => (
                      <TableCell key={c} className="px-5 py-4">
                        <div className="h-4 w-28 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
              {!loading && sortedRows.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-6 text-center text-sm text-gray-600 dark:text-gray-300" colSpan={selectedColumns.length}>
                    No results. Try adjusting filters or columns.
                  </TableCell>
                </TableRow>
              )}
              {!loading && sortedRows.map((r, i) => (
                <TableRow key={i} className="hover:bg-gray-50 dark:hover:bg-white/5">
                  {selectedColumns.map((c) => (
                    <TableCell key={c} className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                      {stringifyValue(r[c])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="px-3 py-2 bg-gray-200 text-gray-800 rounded" disabled={skip === 0} onClick={() => { setSkip((prev) => Math.max(0, prev - take)); onRun(); }}>
            Prev
          </button>
          <button className="px-3 py-2 bg-gray-200 text-gray-800 rounded" disabled={skip + take >= total} onClick={() => { setSkip((prev) => prev + take); onRun(); }}>
            Next
          </button>
        </div>
      </div>
    </>
  );
}
