import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import getCompanyId from '@hooks/api/useAuthApi';
import useCollections from '@hooks/collections/useCollections';
import useOrganization from '@hooks/organization/useOrganization';
import ComponentCard from '../../components/common/ComponentCard';
import Label from '../../components/form/Label';

export default function CollectionsCreate() {
  const auth = getCompanyId();
  const companyId = auth.getCompanyId?.();
  const { createNewCollection } = useCollections();
  const navigate = useNavigate();
  const { useOrganizationList } = useOrganization();
  const { data: organizations } = useOrganizationList();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(companyId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const organizationOptions = useMemo(() => {
    return (organizations ?? []).map((org) => ({ value: org.id, label: org.name }));
  }, [organizations]);

  // Only SuperAdmin can change company filter
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
  await createNewCollection.mutateAsync({ name, description, companyId: selectedCompanyId });
      navigate('/collections');
    } catch {
      setError('Failed to create collection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ComponentCard title="Create Collection">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {isSuperAdmin ? (
          <div>
            <Label>Company</Label>
            <select
              value={selectedCompanyId ?? ''}
              onChange={(e) => setSelectedCompanyId(e.target.value || undefined)}
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">Select a company</option>
              {organizationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <input
              type="hidden"
              value={companyId ?? ''}
              readOnly
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        )}
        <div>
          <Label>Name</Label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            required
          />
        </div>
        <div>
          <Label>Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            rows={4}
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={saving}>
            {saving ? 'Saving...' : 'Create'}
          </button>
          <button type="button" className="px-4 py-2 bg-gray-300 text-gray-800 rounded" onClick={() => navigate('/collections')}>
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
