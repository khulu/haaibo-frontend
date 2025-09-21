import { useState } from "react";
import useAsset from "@hooks/asset/useAsset";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { useNavigate } from "react-router-dom";
import { parseBulkUserFile } from "../../utils/parseBulkUserFile";
import ComponentCard from "../../components/common/ComponentCard";
import FileInput from "../../components/form/input/FileInput";
import Label from "../../components/form/Label";
import getCompanyId from "@hooks/api/useAuthApi";

export default function AssetBulkUpload() {
  const authApi = getCompanyId();
  const companyId = authApi.getCompanyId();
  const { uploadAsset } = useAsset();
  const [file, setFile] = useState<File | null>(null);
  interface BulkAssetRow {
    make: string;
    model: string;
    serialNumber: string;
    laptopTagNumber: string;
    assignedUserId: string | null;
    condition: string;
    status: string;
    purchaseDate: string;
    warrantyExpiryDate: string;
  }

  const [previewRows, setPreviewRows] = useState<BulkAssetRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Helper to convert Excel serial date or string to YYYY-MM-DD
  const formatExcelDate = (value: unknown): string => {
    if (typeof value === "number") {
      // Excel serial date to JS Date
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      return date.toISOString().slice(0, 10);
    }
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }
    // Try parsing as date string
    const date = new Date(value as string);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
    return "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    if (selectedFile) {
      try {
        const rows = await parseBulkUserFile(selectedFile);
        setPreviewRows(
          rows.map((row) => ({
            make: String(row.make ?? ""),
            model: String(row.model ?? ""),
            serialNumber: String(row.serialNumber ?? ""),
            laptopTagNumber: String(row.laptopTagNumber ?? ""),
            assignedUserId: '',
            condition: String(row.condition ?? ""),
            status: String(row.status ?? ""),
            purchaseDate: formatExcelDate(row.purchaseDate),
            warrantyExpiryDate: formatExcelDate(row.warrantyExpiryDate),
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

  const handleUpload = async () => {
    if (!file || previewRows.length === 0) return;
    setUploading(true);
    setError(null);
    const payload = previewRows.map(row => ({
      assetId: "", // Provide a default value for assetId
      ...row,
      companyId,
      purchaseDate: row.purchaseDate ? row.purchaseDate : null,
      warrantyExpiryDate: row.warrantyExpiryDate ? row.warrantyExpiryDate : null,
      assignedUserId: null,
      status: String(row.status ?? ''),
    }));
    await uploadAsset.mutate(payload);
    setUploading(false);
    navigate("/assets");
  };

  return (
    <ComponentCard title="Bulk Upload Assets">
      <form className="space-y-6">
        <div>
          <div className="mb-6 text-gray-700 dark:text-gray-300">
            <strong>Instructions:</strong>
            <ul className="list-disc ml-6 mt-2">
              <li>Upload a CSV or Excel file with the following columns: <br /><code>make, model, serialNumber, laptopTagNumber, condition, status (like "Available", "Assigned", "InRepair", "Retired"), purchaseDate, warrantyExpiryDate</code></li>
              <li>Ensure all required fields are filled in for each asset.</li>
              <li>After upload, you will see a preview of the assets to be created. Confirm to proceed or cancel.</li>
            </ul>
          </div>
          <Label>Upload file</Label>
          <FileInput
            onChange={handleFileChange}
          />
        </div>
        {previewRows.length > 0 && (
          <div className="text-gray-700 dark:text-gray-300">
            <h2 className="font-semibold mb-2">Preview Assets</h2>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Make</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Model</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Serial Number</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Laptop Tag</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Condition</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Purchase Date</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Warranty Expiry</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {previewRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="px-5 py-4 text-start">{row.make}</TableCell>
                    <TableCell className="px-5 py-4 text-start">{row.model}</TableCell>
                    <TableCell className="px-5 py-4 text-start">{row.serialNumber}</TableCell>
                    <TableCell className="px-5 py-4 text-start">{row.laptopTagNumber}</TableCell>
                    <TableCell className="px-5 py-4 text-start">{row.condition}</TableCell>
                    <TableCell className="px-5 py-4 text-start">{row.status}</TableCell>
                    <TableCell className="px-5 py-4 text-start">{row.purchaseDate}</TableCell>
                    <TableCell className="px-5 py-4 text-start">{row.warrantyExpiryDate}</TableCell>
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
            onClick={() => navigate("/assets")}
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
