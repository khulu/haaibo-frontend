import { useState } from 'react';
import useAssetApi, { type Asset } from '@hooks/api/useAssetApi';
import getAuth from '@hooks/api/useAuthApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

type ScanDirection = 'in' | 'out';

interface ScanRecord {
  asset: Asset;
  direction: ScanDirection;
  timestamp: string;
}

export default function AssetScan() {
  const { getAssetBySerial } = useAssetApi();
  const auth = getAuth();
  const companyId = auth.getCompanyId?.() ?? '';

  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null);
  const [scanLog, setScanLog] = useState<ScanRecord[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setLoading(true);
    setError(null);
    setFoundAsset(null);
    try {
      const asset = await getAssetBySerial(searchValue.trim());
      if (asset.companyId !== companyId) {
        setError('Asset does not belong to your company.');
        return;
      }
      setFoundAsset(asset);
    } catch {
      setError('Asset not found. Please check the serial number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (direction: ScanDirection) => {
    if (!foundAsset) return;
    const record: ScanRecord = {
      asset: foundAsset,
      direction,
      timestamp: new Date().toLocaleString(),
    };
    setScanLog((prev) => [record, ...prev]);
    setFoundAsset(null);
    setSearchValue('');
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <h1 className="mb-4 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
        Asset Scan In / Out
      </h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Enter serial number or scan barcode..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="flex-1 h-11 rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {foundAsset && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h2 className="font-medium text-gray-800 dark:text-white/90 mb-2">Asset Found</h2>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
            <div><span className="font-medium">Make:</span> {foundAsset.make || '-'}</div>
            <div><span className="font-medium">Model:</span> {foundAsset.model || '-'}</div>
            <div><span className="font-medium">Serial:</span> {foundAsset.serialNumber || foundAsset.assetId || '-'}</div>
            <div><span className="font-medium">Assigned to:</span> {foundAsset.assignedUserName || 'Unassigned'}</div>
            <div><span className="font-medium">Condition:</span> {foundAsset.condition || '-'}</div>
            <div><span className="font-medium">Status:</span> {foundAsset.statusName || '-'}</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleScan('in')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Scan In
            </button>
            <button
              onClick={() => handleScan('out')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg"
            >
              Scan Out
            </button>
          </div>
        </div>
      )}

      {scanLog.length > 0 && (
        <div>
          <h2 className="font-medium text-gray-800 dark:text-white/90 mb-2">Scan Log</h2>
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Time</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Direction</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Asset</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Assigned To</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {scanLog.map((record, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{record.timestamp}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${record.direction === 'in' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'}`}>
                        {record.direction === 'in' ? 'Scanned In' : 'Scanned Out'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                      {record.asset.make} {record.asset.model} ({record.asset.serialNumber || record.asset.assetId || '-'})
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{record.asset.assignedUserName || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
