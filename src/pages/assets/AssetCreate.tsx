import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAssetApi, { CreateLaptopInput } from '../../hooks/api/useAssetApi';
import ComponentCard from '../../components/common/ComponentCard';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import useOrganization from '@hooks/organization/useOrganization';
import useUserApi from '@hooks/user/useUser';
import getAuth from '@hooks/api/useAuthApi';

const AssetCreate: React.FC = () => {
  const { createAsset } = useAssetApi();
  const { useOrganizationList } = useOrganization();
  const { useUserList } = useUserApi();
  const { data: organizations } = useOrganizationList();
  const auth = getAuth();
  const currentCompanyId = auth.getCompanyId?.() ?? '';
  const [isSuperAdmin] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const user = JSON.parse(raw);
      const role = user?.role;
      return role === 0 || role === 'SuperAdmin';
    } catch {
      return false;
    }
  });
  const [form, setForm] = useState<CreateLaptopInput>({
    make: '',
    model: '',
    serialNumber: '',
    assetId: '',
    laptopTagNumber: '',
    assignedUserId: '',
    condition: '',
    status: 0,
    purchaseDate: '',
    warrantyExpiryDate: '',
    companyId: isSuperAdmin ? '' : currentCompanyId,
  });
  const companyForUsers = isSuperAdmin ? (form.companyId || undefined) : currentCompanyId;
  const { data: users } = useUserList({ companyId: companyForUsers });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createAsset({
        ...form,
        assignedUserId: form.assignedUserId ? form.assignedUserId : null,
      });
      navigate('/assets');
    } catch {
      setError('Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title="Create Asset">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="make">Make</Label>
          <Input
            id="make"
            name="make"
            value={form.make || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            name="model"
            value={form.model || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            value={form.serialNumber || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="laptopTagNumber"> Tag Number</Label>
          <Input
            id="laptopTagNumber"
            name="laptopTagNumber"
            value={form.laptopTagNumber || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="assignedUserId">Assigned User</Label>
          <Select
            options={users?.map((user) => ({ value: user.id, label: user.fullName || user.email })) || []}
            placeholder="Select a user"
            onChange={(value) => setForm((prev) => ({ ...prev, assignedUserId: value }))}
            className="dark:bg-dark-900"
            
          />
        </div>
     
        <div>
          <Label htmlFor="condition">Condition</Label>
          <Select
            options={[
              { value: 'New', label: 'New' },
              { value: 'Good', label: 'Good' },
              { value: 'Fair', label: 'Fair' },
              { value: 'Damaged', label: 'Damaged' },
            ]}
            placeholder="Select a condition"
            onChange={(value) => setForm((prev) => ({ ...prev, condition: value }))}
            className="dark:bg-dark-900"
            required
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            options={[
              { value: '1', label: 'Available' },
              { value: '2', label: 'Assigned' },
              { value: '3', label: 'In Repair' },
              { value: '4', label: 'Retired' },
            ]}
            placeholder="Select a status"
            onChange={(value) => setForm((prev) => ({ ...prev, status: parseInt(value, 10) }))}
            className="dark:bg-dark-900"
            required
          />
        </div>
        <div>
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            value={form.purchaseDate || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="warrantyExpiryDate">Warranty Expiry Date</Label>
          <Input
            id="warrantyExpiryDate"
            name="warrantyExpiryDate"
            type="date"
            value={form.warrantyExpiryDate || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
       
          {isSuperAdmin ? (
            <>
               <Label htmlFor="companyId">Company</Label>
            <Select
              options={organizations?.map((org) => ({ value: org.id, label: org.name })) || []}
              placeholder="Select a company"
              onChange={(value) => setForm((prev) => ({ ...prev, companyId: value }))}
              className="dark:bg-dark-900"
            />
            </>
          ) : (
            <Input id="companyId" name="companyId" value={currentCompanyId} onChange={() => {}} disabled  type='hidden'/>
          )}
        </div>

        {error && <div className="text-red-500">{error}</div>}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
            onClick={() => navigate('/assets')}
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
};

export default AssetCreate;
