import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAssetApi, { Asset } from '../../hooks/api/useAssetApi';
import ComponentCard from '../../components/common/ComponentCard';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import useOrganization from '@hooks/organization/useOrganization';
import useUserApi from '@hooks/user/useUser';
import getAuth from '@hooks/api/useAuthApi';

const AssetEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getAssetById, updateAsset } = useAssetApi();
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
  const [form, setForm] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Limit users to those in the selected company (or current company for non-superadmin)
  const companyIdForUsers = isSuperAdmin ? (form?.companyId || undefined) : (currentCompanyId || undefined);
  const { data: users } = useUserList({ companyId: companyIdForUsers });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form && id) {
      try {
        const { id: _id, createdAt, updatedAt, statusName, companyName, assignedUserName, ...payload } = form;
        await updateAsset(id, payload);
        navigate('/assets');
      } catch {
        setError('Failed to update asset');
      }
    }
  };

  if (loading) return <div className="p-6">Loading asset...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <ComponentCard title="Edit Asset">
      <form onSubmit={handleSubmit} className="space-y-6">
        {form && (
          <>
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
             
              {isSuperAdmin ? (
                <>
                 <Label htmlFor="companyId">Company</Label>
                <Select
                  options={organizations?.map((org) => ({ value: org.id, label: org.name })) || []}
                  placeholder="Select a company"
                  onChange={(value) => setForm((prev) => (prev ? { ...prev, companyId: value } : null))}
                  className="dark:bg-dark-900"
                />
                </>
              ) : (
                <Input id="companyId" name="companyId" value={currentCompanyId} onChange={() => {}} disabled  type='hidden'/>
              )}
            </div>
            <div>
              <Label htmlFor="assignedUserId">Assigned User</Label>
              <Select
                options={(users || [])
                  .map((user) => ({ value: user.id, label: user.fullName }))}
                placeholder="Select a user"
                defaultValue={form.assignedUserId || ''}
                onChange={(value) => setForm((prev) => (prev ? { ...prev, assignedUserId: value } : null))}
                className="dark:bg-dark-900"
              />
            </div>
            {error && <div className="text-red-500">{error}</div>}
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save Changes
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
                onClick={() => navigate('/assets')}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </form>
    </ComponentCard>
  );
};

export default AssetEdit;
