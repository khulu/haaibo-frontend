import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAsset from '@hooks/asset/useAsset';
import type { Asset } from '@hooks/api/useAssetApi';
import getCompanyId from "@hooks/api/useAuthApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

export default function AssetsPage() {
  const authApi = getCompanyId();
  const companyId = authApi.getCompanyId();
  const { useAssetList, deleteSingleAsset } = useAsset();

  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: dataAssets, isLoading } = useAssetList({companyId: companyId});

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        setDeletingId(id);
        await deleteSingleAsset.mutateAsync(id);
      } catch {
        setError('Failed to delete asset');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (isLoading) return <div>Loading assets...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Assets</h1>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => navigate('/assets/create')}
          >
            Create Asset
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
            onClick={() => navigate('/assets/create-bulk')}
          >
            Upload CSV/Excel
          </button>
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded"
            onClick={() => navigate('/assets/bookings')}
          >
            Book Assets
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Device</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Make</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Model</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {dataAssets?.map((asset: Asset) => (
              <TableRow key={asset.id}>
                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                  <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
                    {asset.imageUrls && asset.imageUrls.length > 0 ? (
                      <img
                        width={40}
                        height={40}
                        src={asset.imageUrls[0]}
                        alt={asset.make || "Device"}
                      />
                    )  : (
                      <span className="text-gray-400 text-lg font-bold">
                        {asset.make?.[0] || "?"}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                  {asset.make}
                </TableCell>
                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                  {asset.model}
                </TableCell>
                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                  <div className="flex gap-2">
                    <button className="px-2 py-1 bg-gray-200 text-gray-800 rounded" onClick={() => navigate(`/assets/${asset.id}`)}>View</button>
                    <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={() => navigate(`/assets/edit/${asset.id}`)}>Edit</button>
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded"
                      disabled={deletingId === asset.id}
                      onClick={() => handleDelete(asset.id)}
                    >
                      {deletingId === asset.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
