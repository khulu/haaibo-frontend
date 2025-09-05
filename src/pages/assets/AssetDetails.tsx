import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAssetApi, { Laptop } from '../../hooks/api/useAsset';

const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getAssetById } = useAssetApi();
  const [asset, setAsset] = useState<Laptop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Asset Details</h1>
      {asset && (
        <div>
          <p>Make: {asset.make}</p>
          <p>Model: {asset.model}</p>
          <p>Serial Number: {asset.serialNumber}</p>
          <button onClick={() => navigate(`/assets/edit/${asset.id}`)}>Edit</button>
          <button onClick={() => navigate('/assets')}>Back</button>
        </div>
      )}
    </div>
  );
};

export default AssetDetails;
