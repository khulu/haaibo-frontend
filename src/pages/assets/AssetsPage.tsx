import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAssetApi, { Laptop } from '../../hooks/api/useAsset';

const AssetsPage: React.FC = () => {
  const { getAssetsByCompany, deleteAsset } = useAssetApi();
  const [assets, setAssets] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const data = await getAssetsByCompany('company-id'); // Replace with actual company ID
        setAssets(data);
      } catch {
        setError('Failed to fetch assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [getAssetsByCompany]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(id);
        setAssets((prev) => prev.filter((asset) => asset.id !== id));
      } catch {
        alert('Failed to delete asset');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Assets</h1>
      <button onClick={() => navigate('/assets/create')}>Create Asset</button>
      <ul>
        {assets.map((asset) => (
          <li key={asset.id}>
            {asset.make} {asset.model}
            <button onClick={() => navigate(`/assets/${asset.id}`)}>View</button>
            <button onClick={() => navigate(`/assets/edit/${asset.id}`)}>Edit</button>
            <button onClick={() => handleDelete(asset.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AssetsPage;
