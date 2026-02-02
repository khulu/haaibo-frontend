import Papa from "papaparse";
import * as XLSX from "xlsx";

export async function parseBulkUserFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return reject("No file data");
      if (ext === "csv") {
        const parsed = Papa.parse(data as string, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => (h ?? '').trim().replace(/^\uFEFF/, ''),
          transform: (value) => (typeof value === 'string' ? value.trim() : value),
        });
        resolve(parsed.data as Record<string, unknown>[]);
      } else if (ext === "xlsx") {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        resolve(rows as Record<string, unknown>[]);
      } else {
        reject("Unsupported file type");
      }
    };

    if (ext === "csv") {
      reader.readAsText(file);
    } else if (ext === "xlsx") {
      reader.readAsBinaryString(file);
    } else {
      reject("Unsupported file type");
    }
  });
}
