import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAssetApi, { Laptop } from '../../hooks/api/useAsset';

const AssetEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getAssetById, updateAsset } = useAssetApi();
  const [form, setForm] = useState<Laptop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        if (id) {
          const data = await getAssetById(id);
          setForm(data);
        }
      } catch {
        setError('Failed to fetch asset details');
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [id, getAssetById]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form && id) {
      try {
        await updateAsset(id, form);
        navigate('/assets');
      } catch {
        alert('Failed to update asset');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <form onSubmit={handleSubmit}>
      <h1>Edit Asset</h1>
      {form && (
        <>
          <input name="make" value={form.make || ''} onChange={handleChange} placeholder="Make" />
          <input name="model" value={form.model || ''} onChange={handleChange} placeholder="Model" />
          <input name="serialNumber" value={form.serialNumber || ''} onChange={handleChange} placeholder="Serial Number" />
          <button type="submit">Save</button>
          <button type="button" onClick={() => navigate('/assets')}>Cancel</button>
        </>
      )}
    </form>
  );
};

export default AssetEdit;
