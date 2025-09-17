import { useState } from "react";
import useUser from "@hooks/user/useUser";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { useNavigate } from "react-router-dom";
import { parseBulkUserFile } from "../../utils/parseBulkUserFile";
import ComponentCard from "../../components/common/ComponentCard";
import FileInput from "../../components/form/input/FileInput";
import Label from "../../components/form/Label";
import getCompanyId from "@hooks/api/useAuthApi";

export default function UserBulkUpload() {
  const authApi = getCompanyId();
  const companyId = authApi.getCompanyId();
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
    const payload = previewRows.map(row => ({
      ...row,
      companyId,
      phone: row.phone ? String(row.phone) : undefined,
      role: typeof row.role === "string"
        ? row.role === "Admin"
          ? 1
          : row.role === "Security"
          ? 2
          : row.role === "Employee"
          ? 3
          : 0
        : row.role,
      password: generateRandomPassword()
    }));
    await bulkUploadUsers.mutateAsync(payload);
    setUploading(false);
    navigate("/users");
  };

  return (
    <ComponentCard title="Bulk Upload Users">
      <form className="space-y-6">
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
    </ComponentCard>
  );
}
