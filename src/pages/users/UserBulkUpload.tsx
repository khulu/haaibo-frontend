import { useState } from "react";
import useUser from "@hooks/user/useUser";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { useLocation, useNavigate } from "react-router-dom";
import { parseBulkUserFile } from "../../utils/parseBulkUserFile";
import ComponentCard from "../../components/common/ComponentCard";
import FileInput from "../../components/form/input/FileInput";
import Label from "../../components/form/Label";
import getCompanyId from "@hooks/api/useAuthApi";
import useOrganization from "@hooks/organization/useOrganization";

export default function UserBulkUpload() {
  const authApi = getCompanyId();
  const companyId = authApi.getCompanyId();
  const location = useLocation();
  const queryCompanyId = new URLSearchParams(location.search).get("companyId") || undefined;
  const effectiveCompanyId = (companyId as string | null) ?? queryCompanyId;

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

  const { useOrganizationList } = useOrganization();
  const { data: organizations } = useOrganizationList();
  const targetOrgName = (organizations ?? []).find((o: { id: string }) => o.id === effectiveCompanyId)?.name as string | undefined;
  const { bulkUploadUsers } = useUser();
  const [file, setFile] = useState<File | null>(null);
  interface BulkUserRow {
    fullName: string;
    email: string;
    phone?: string;
    department?: string;
    role: string;
    profilePicture?: string;
  }

  const [previewRows, setPreviewRows] = useState<BulkUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  type UploadError<T = unknown> = { data: T; error: string };
  type UploadResult<T = unknown> = { success: T[]; errors: Array<UploadError<T>> };
  const [result, setResult] = useState<UploadResult | null>(null);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    if (selectedFile) {
      try {
        const rows = await parseBulkUserFile(selectedFile);
        setPreviewRows(
          rows.map((row) => ({
            fullName: String(row.fullName ?? ""),
            email: String(row.email ?? ""),
            phone: row.phone ? String(row.phone) : undefined,
            department: row.department ? String(row.department) : undefined,
            role: String(row.role ?? ""),
            profilePicture: row.profilePicture ? String(row.profilePicture) : undefined,
          }))
        );
      } catch (err) {
        console.error(err);
        setError("Failed to parse file. Please check the format.");
        setPreviewRows([]);
      }
    } else {
      setPreviewRows([]);
    }
  };

  const generateRandomPassword = (length = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleUpload = async () => {
    if (!file || previewRows.length === 0) return;
    setUploading(true);
    setError(null);
    // Prepare payload
    const payload = previewRows
      .map(row => {
        const roleNum = (() => {
          if (typeof row.role === 'number') return row.role;
          const r = String(row.role || '').trim().toLowerCase();
          if (r === 'superadmin' || r === 'super admin') return 0;
          if (r === 'admin') return 1;
          if (r === 'security') return 2;
          if (r === 'employee') return 3;
          return 0; // default
        })();
        const department = String(row.department || '').trim();
        return {
          fullName: String(row.fullName || '').trim(),
          email: String(row.email || '').trim(),
          phone: row.phone ? String(row.phone).trim() : null,
          department: department || 'General',
          role: roleNum,
          companyId: effectiveCompanyId ?? null,
          password: generateRandomPassword(),
        };
      })
      .filter(u => u.fullName && u.email);
    try {
      const res = await bulkUploadUsers.mutateAsync(payload);
      const candidate = res as unknown;
      if (candidate && typeof candidate === 'object' && candidate !== null && 'errors' in (candidate as Record<string, unknown>) && 'success' in (candidate as Record<string, unknown>)) {
        setResult(candidate as UploadResult);
      } else {
        navigate("/users");
      }
    } catch (err) {
      console.error(err);
      setError('Bulk upload failed');
    }
    setUploading(false);
  };

  return (
    <ComponentCard title="Bulk Upload Users">
      <form className="space-y-6">
        {isSuperAdmin && effectiveCompanyId && (
          <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Target Company</div>
            <div className="mt-1 text-theme-sm font-medium text-gray-800 dark:text-white/90">
              {targetOrgName ? `${targetOrgName} — ${effectiveCompanyId}` : effectiveCompanyId}
            </div>
          </div>
        )}
        <div>
          <div className="mb-6 text-gray-700 dark:text-gray-300">
            <strong>Instructions:</strong>
            <ul className="list-disc ml-6 mt-2">
              <li>Upload a CSV or Excel file with the following columns: <br /><code>fullName, email, phone, department, role "Admin, Security, Employee"</code></li>
              <li>Ensure all required fields are filled in for each user.</li>
              <li>After upload, you will see a preview of the users to be created. Confirm to proceed or cancel.</li>
            </ul>
          </div>
          <Label>Upload file</Label>
          <FileInput
            onChange={handleFileChange}
  
          />
        </div>
        {previewRows.length > 0 && (
          <div className="text-gray-700 dark:text-gray-300">
             
            <h2 className="font-semibold mb-2">Preview Users</h2>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Full Name</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Phone</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Department</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Role</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {previewRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
                          {row.profilePicture ? (
                            <img
                              width={40}
                              height={40}
                              src={row.profilePicture}
                              alt={row.fullName}
                            />
                          ) : (
                            <span className="text-gray-400 text-lg font-bold">
                              {row.fullName?.[0] || "?"}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {row.fullName}
                          </span>
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            {row.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {row.email || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {row.phone || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {row.department || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <span className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs">
                        {row.role}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {error && <div className="text-red-500">{error}</div>}
        <div className="flex gap-4">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={!file || uploading}
            onClick={handleUpload}
          >
            {uploading ? "Uploading..." : "Proceed with Upload"}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
            onClick={() => navigate("/users")}
          >
            Cancel
          </button>
        </div>
      </form>
      {result && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2 text-gray-800 dark:text-white/90">Upload Results</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <h3 className="font-medium mb-2 text-gray-800 dark:text-white/90">Success ({result.success.length})</h3>
              <ul className="list-disc ml-6 text-sm text-gray-600 dark:text-gray-300">
                {result.success.map((row: unknown, idx: number) => {
                  const r = row as Record<string, unknown>;
                  return (
                    <li key={idx}>{String(r.fullName ?? '')} - {String(r.email ?? '')}</li>
                  );
                })}
              </ul>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <h3 className="font-medium mb-2 text-gray-800 dark:text-white/90">Errors ({result.errors.length})</h3>
              <ul className="list-disc ml-6 text-sm text-red-600 dark:text-red-400">
                {result.errors.map((err, idx) => {
                  const d = err.data as Record<string, unknown>;
                  return (
                    <li key={idx}>{String(d.fullName ?? '')} - {String(d.email ?? '')}: {err.error}</li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </ComponentCard>
  );
}
