// Reports API service for asset reports

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export type ReportFilterDto = {
  CompanyId?: string;
  CollectionId?: string;
  LocationId?: string; // reserved; not applied
  AssigneeUserId?: string;
  Status?: string; // Available, Assigned, InRepair, Retired
  Search?: string; // make, model, serial, assetId, laptopTagNumber
  CreatedFrom?: string; // ISO date
  CreatedTo?: string;   // ISO date
  IncludeArchived?: boolean; // reserved; not applied
};

export type RunReportRequestDto = {
  Columns: string[];
  Filters: ReportFilterDto;
  Skip?: number;
  Take?: number;
};

export type ReportRowDto = Record<string, unknown>;

export type ReportResultDto = {
  Rows: ReportRowDto[];
  Total: number;
};

export type ExportReportRequestDto = {
  Columns: string[];
  Filters: ReportFilterDto;
  Format?: "csv";
};

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export async function runAssetReport(token: string, req: RunReportRequestDto): Promise<ReportResultDto> {
  const res = await fetch(`${baseUrl}/api/reports/assets/run`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function exportAssetReportCsv(token: string, req: ExportReportRequestDto): Promise<void> {
  const res = await fetch(`${baseUrl}/api/reports/assets/export`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ ...req, Format: "csv" }),
  });
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asset-report-${new Date().toISOString()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
