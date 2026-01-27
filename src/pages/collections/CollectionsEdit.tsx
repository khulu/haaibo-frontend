import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useCollections from '@hooks/collections/useCollections';
import useOrganization from '@hooks/organization/useOrganization';
import ComponentCard from '../../components/common/ComponentCard';
import Label from '../../components/form/Label';

export default function CollectionsEdit() {
  const { id } = useParams<{ id: string }>();
  const { useFetchCollectionById, updateExistingCollection } = useCollections();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useFetchCollectionById(id || '');
  const { useOrganizationList } = useOrganization();
  const { data: organizations } = useOrganizationList();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (data) {
      setName(data.name ?? '');
      setDescription(data.description ?? '');
      setSelectedCompanyId(data.companyId ?? undefined);
    }
  }, [data]);

  const organizationOptions = useMemo(() => {
    return (organizations ?? []).map((org) => ({ value: org.id, label: org.name }));
  }, [organizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await updateExistingCollection.mutateAsync({ id, data: { name, description: description || null, companyId: selectedCompanyId ?? null } });
      navigate('/collections');
    } catch {
      setError('Failed to update collection');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6 text-red-500">Failed to load collection</div>;

  return (
    <ComponentCard title="Edit Collection">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {isSuperAdmin && (
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
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className="px-4 py-2 bg-gray-300 text-gray-800 rounded" onClick={() => navigate('/collections')}>
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
