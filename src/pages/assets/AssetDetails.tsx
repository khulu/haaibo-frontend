import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAssetApi, { Asset } from '@hooks/api/useAssetApi';
import Button from '../../components/ui/button/Button';
import Label from '../../components/form/Label';
import PhotoModal from '../users/PhotoModal';

const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getAssetById, uploadAssetFile } = useAssetApi();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        if (id) {
          const data = await getAssetById(id);
          setAsset(data);
        }
      } catch {
        setError('Failed to fetch asset details');
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id, getAssetById]);

  const handlePhotoSelected = async (fileOrBlob: File | Blob) => {
    if (!asset || !id) return;
    try {
      await uploadAssetFile(id, fileOrBlob as File); // Use asset upload endpoint
      const updated = await getAssetById(id);
      setAsset(updated);
      setPhotoModalOpen(false);
    } catch {
      alert('Failed to upload photo');
    }
  };

  if (loading) return <div className="p-6">Loading asset...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!asset) return <div className="p-6">Asset not found.</div>;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center cursor-pointer" onClick={() => setPhotoModalOpen(true)}>
            {asset.imageUrls && asset.imageUrls.length > 0 ? (
              <img
                width={64}
                height={64}
                src={asset.imageUrls[0]}
                alt={asset.make || 'Device'}
              />
            )  : (
              <span className="text-gray-400 text-2xl font-bold">
                {asset.make?.[0] || '?'}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {asset.make} {asset.model}
            </h4>
            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
              Serial: {asset.serialNumber || '-'}
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          <Button size="sm" onClick={() => navigate(`/assets/edit/${id}`)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/assets')}>
            Back
          </Button>
        </div>
      </div>
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Asset Information
        </h4>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <Label>Make</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{asset.make}</p>
          </div>
          <div>
            <Label>Model</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{asset.model}</p>
          </div>
          <div>
            <Label>Serial Number</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{asset.serialNumber}</p>
          </div>
          <div>
            <Label>Condition</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{asset.condition}</p>
          </div>
          <div>
            <Label>Status</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{asset.statusName || asset.status}</p>
          </div>
          <div>
            <Label>Purchase Date</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{asset.purchaseDate}</p>
          </div>
          <div>
            <Label>Warranty Expiry</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{asset.warrantyExpiryDate}</p>
          </div>
          <div>
            <Label>Company</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{asset.companyName}</p>
          </div>
        </div>
      </div>
      <PhotoModal isOpen={photoModalOpen} onClose={() => setPhotoModalOpen(false)} onPhotoSelected={handlePhotoSelected} />
    </div>
  );
};

export default AssetDetails;
