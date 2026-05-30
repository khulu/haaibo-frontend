import { useRef, useState } from 'react';
import useAssetApi, { type Asset } from '@hooks/api/useAssetApi';
import useUserApi from '@hooks/api/useUserApi';
import type { User } from '@hooks/api/useUserApi';
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
  const { getAssetBySerial, scanAsset } = useAssetApi();
  const { getUserById } = useUserApi();
  const auth = getAuth();
  const companyId = auth.getCompanyId?.() ?? '';

  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [scanLog, setScanLog] = useState<ScanRecord[]>([]);

  // Camera state for capturing user photo
  const [showCamera, setShowCamera] = useState(false);
  const [pendingDirection, setPendingDirection] = useState<ScanDirection | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setLoading(true);
    setError(null);
    setFoundAsset(null);
    setAssignedUser(null);
    try {
      const asset = await getAssetBySerial(searchValue.trim());
      if (asset.companyId !== companyId) {
        setError('Asset does not belong to your company.');
        return;
      }
      setFoundAsset(asset);
      if (asset.assignedUserId) {
        try {
          const user = await getUserById(asset.assignedUserId);
          setAssignedUser(user);
        } catch {
          // non-critical, user info just won't show photo
        }
      }
    } catch {
      setError('Asset not found. Please check the serial number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (direction: ScanDirection) => {
    if (!foundAsset) return;

    completeScan(direction);
  };

  const completeScan = async (direction: ScanDirection, photo?: File) => {
    if (!foundAsset) return;
    try {
      await scanAsset(searchValue.trim() || foundAsset.serialNumber || foundAsset.assetId || '', photo);
    } catch {
      setError('Failed to record scan. Please try again.');
      return;
    }
    const record: ScanRecord = {
      asset: foundAsset,
      direction,
      timestamp: new Date().toLocaleString(),
    };
    setScanLog((prev) => [record, ...prev]);
    setFoundAsset(null);
    setAssignedUser(null);
    setSearchValue('');
    setShowCamera(false);
    setPendingDirection(null);
  };

  const startCamera = async () => {
    setCameraError(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      // Wait for next frame so the video element is mounted
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setCameraError('Unable to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setPendingDirection(null);
  };

  const captureAndUpload = async () => {
    if (!videoRef.current || !foundAsset) return;
    setUploading(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(video, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to capture'))), 'image/jpeg', 0.85);
      });
      const file = new File([blob], 'scan-photo.jpg', { type: 'image/jpeg' });
      stopCamera();
      if (pendingDirection) {
        await completeScan(pendingDirection, file);
      }
    } catch {
      setCameraError('Failed to capture photo. Please try again.');
    } finally {
      setUploading(false);
    }
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
          <div className="flex gap-4 mb-4">
            {assignedUser && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
                  {assignedUser.profilePicture ? (
                    <img
                      width={64}
                      height={64}
                      src={assignedUser.profilePicture}
                      alt={assignedUser.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-2xl font-bold">
                      {assignedUser.fullName?.[0] || '?'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">{assignedUser.fullName}</span>
              </div>
            )}
            <div className="flex-1 grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div><span className="font-medium">Make:</span> {foundAsset.make || '-'}</div>
              <div><span className="font-medium">Model:</span> {foundAsset.model || '-'}</div>
              <div><span className="font-medium">Serial:</span> {foundAsset.serialNumber || foundAsset.assetId || '-'}</div>
              <div><span className="font-medium">Assigned to:</span> {foundAsset.assignedUserName || 'Unassigned'}</div>
              <div><span className="font-medium">Condition:</span> {foundAsset.condition || '-'}</div>
              <div><span className="font-medium">Status:</span> {foundAsset.statusName || '-'}</div>
            </div>
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

          {showCamera && (
            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white/90 mb-2">
                User has no photo — please take one before scanning
              </h3>
              {cameraError && <p className="text-red-500 text-sm mb-2">{cameraError}</p>}
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current && !el.srcObject) {
                    el.srcObject = streamRef.current;
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full max-w-sm rounded-lg bg-black mb-3"
              />
              <div className="flex gap-3">
                <button
                  onClick={captureAndUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Capture Photo'}
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
