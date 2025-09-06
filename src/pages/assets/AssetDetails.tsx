import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAssetApi, { Asset, AssetHistory } from '@hooks/api/useAssetApi';

const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getAssetById, getAssetHistory } = useAssetApi();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<AssetHistory[]>([]);
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

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (id) {
          const data = await getAssetHistory(id);
          setHistory(data);
        }
      } catch {
        setError('Failed to fetch asset history');
      }
    };

    fetchHistory();
  }, [id, getAssetHistory]);

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
      {history.length > 0 && (
        <div>
          <h2>Asset History</h2>
          <ul>
            {history.map((entry) => (
              <li key={entry.id}>
                {entry.action} by {entry.performedBy} on {entry.performedAt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AssetDetails;
