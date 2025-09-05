import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAssetApi, { CreateLaptopInput } from '../../hooks/api/useAsset';

const AssetCreate: React.FC = () => {
  const { createAsset } = useAssetApi();
  const [form, setForm] = useState<CreateLaptopInput>({
    make: '',
    model: '',
    serialNumber: '',
    assetId: '',
    laptopTagNumber: '',
    assignedUserId: '',
    condition: '',
    status: 1,
    purchaseDate: '',
    warrantyExpiryDate: '',
    companyId: 'company-id', // Replace with actual company ID
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAsset(form);
      navigate('/assets');
    } catch {
      alert('Failed to create asset');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create Asset</h1>
      <input name="make" value={form.make || ''} onChange={handleChange} placeholder="Make" />
      <input name="model" value={form.model || ''} onChange={handleChange} placeholder="Model" />
      <input name="serialNumber" value={form.serialNumber || ''} onChange={handleChange} placeholder="Serial Number" />
      <button type="submit">Create</button>
      <button type="button" onClick={() => navigate('/assets')}>Cancel</button>
    </form>
  );
};

export default AssetCreate;
