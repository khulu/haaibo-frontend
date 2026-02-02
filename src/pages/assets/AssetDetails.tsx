import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import useAssetApi, { Asset } from '@hooks/api/useAssetApi';
import Button from '../../components/ui/button/Button';
import Label from '../../components/form/Label';
import PhotoModal from '../users/PhotoModal';
import Select from '../../components/form/Select';
import useCollections from '@hooks/collections/useCollections';
import getAuth from '@hooks/api/useAuthApi';
import { useToast } from '../../context/useToast';

const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getAssetById } = useAssetApi();
  const { useCollectionsList } = useCollections();
  const auth = getAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const navigate = useNavigate();

  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const apiOrigin = useMemo(() => {
    const base = (apiBase || '').replace(/\/+$/, '');
    // Strip trailing /api for origin-only usage (e.g., serving /uploads)
    return base.replace(/\/?api$/, '');
  }, [apiBase]);

  useEffect(() => {
    let active = true;
    const fetchAsset = async () => {
      try {
        if (id) {
          const data = await getAssetById(id);
          if (active) setAsset(data);
        }
      } catch {
        if (active) setError('Failed to fetch asset details');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAsset();
    return () => {
      active = false;
    };
    // Intentionally exclude getAssetById to avoid effect re-triggering
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const role = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.role ?? null;
    } catch {
      return null;
    }
  }, []);
  const isAdminOrSuperAdmin = role === 1 || role === 'Admin' || role === 0 || role === 'SuperAdmin';

  const companyIdForCollections = asset?.companyId || (auth.getCompanyId?.() as string | undefined);
  const { data: collections } = useCollectionsList(companyIdForCollections);
  const collectionOptions = useMemo(() => (collections ?? []).map((c) => ({ value: c.id, label: c.name })), [collections]);
  const currentCollectionName = (asset && (asset as unknown as { collectionName?: string }).collectionName) || null;
  const currentCollectionId = (asset && (asset as unknown as { collectionId?: string }).collectionId) || null;

  const normalizeImageUrl = (url: string) => {
    if (!url) return url;
    // Use origin (without /api) for static uploads
    return url.startsWith('/uploads') && apiOrigin ? `${apiOrigin}${url}` : url;
  };

  const handlePhotoSelected = async (fileOrBlob: File | Blob) => {
    if (!asset || !id) return;
    try {
      const form = new FormData();
      // Backend expects each file under the key 'files'
      // Ensure a filename is present even if we received a Blob
      const file = fileOrBlob instanceof File
        ? fileOrBlob
        : new File([fileOrBlob], 'asset-photo.jpg', { type: (fileOrBlob as Blob).type || 'application/octet-stream' });
      form.append('files', file);

      const token = auth.getToken?.();
      // Build URL avoiding double /api if apiBase already includes it
      const trimmed = (apiBase || '').replace(/\/+$/, '');
      const uploadUrl = trimmed.endsWith('/api')
        ? `${trimmed}/assets/${id}/upload`
        : `${trimmed}/api/assets/${id}/upload`;

      if (!(role === 1 || role === 'Admin' || role === 0 || role === 'SuperAdmin')) {
        toast.error('Only Admin or SuperAdmin can upload photos');
        return;
      }

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // Do not set Content-Type for multipart; browser will set the boundary
        } as HeadersInit,
        body: form,
      });

      if (!res.ok) throw new Error('Upload failed');
      const uploadedUrls: string[] = await res.json();
      const normalized = uploadedUrls.map(normalizeImageUrl);

      setAsset((prev) => (prev ? { ...prev, imageUrls: normalized } : prev));
      setPhotoModalOpen(false);
      toast.success('Photo uploaded');
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
                src={normalizeImageUrl(asset.imageUrls[0])}
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
          <Button size="sm" variant="outline" onClick={() => navigate(`/assets/${id}/issues/new`)}>
            Raise Issue
          </Button>
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
          {isAdminOrSuperAdmin && (
            <div className="lg:col-span-2">
              <Label>Assign to Collection</Label>
              {currentCollectionName ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Current: {currentCollectionName}</p>
              ) : currentCollectionId ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Current: {currentCollectionId}</p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">No collection linked</p>
              )}
              <div className="max-w-sm">
                <Select
                  options={collectionOptions}
                  placeholder="Select a collection"
                  onChange={async (value) => {
                    if (!id) return;
                    setAssignError(null);
                    setAssigning(true);
                    try {
                      // Use direct API since hook doesn't expose assign
                      const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
                      await fetch(`${base || ''}/Collections/${value}/assign/${id}`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {}),
                        },
                      });
                      // Invalidate cached asset lists so other views reflect collection changes
                      queryClient.invalidateQueries({ queryKey: ['assets'] });
                      const updated = await getAssetById(id);
                      setAsset(updated);
                      toast.success('Asset assigned to collection');
                    } catch {
                      setAssignError('Failed to assign collection. Please try again.');
                    } finally {
                      setAssigning(false);
                    }
                  }}
                  className="dark:bg-dark-900"
                />
              </div>
              {assignError && (
                <div className="text-error-500 text-sm mt-2">{assignError}</div>
              )}
              {assigning && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Assigning…</div>
              )}
            </div>
          )}
        </div>
      </div>
      <PhotoModal isOpen={photoModalOpen} onClose={() => setPhotoModalOpen(false)} onPhotoSelected={handlePhotoSelected} />
    </div>
  );
};

export default AssetDetails;
