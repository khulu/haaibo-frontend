import { useMemo, useState } from 'react';
import useLocations from '@hooks/locations/useLocations';
import getAuth from '@hooks/api/useAuthApi';
import useOrganization from '@hooks/organization/useOrganization';
import Label from '../../components/form/Label';

type FormState = {
  name: string;
  color?: string;
};

type NodeState = Record<string, boolean>;

export default function LocationsPage() {
  const auth = getAuth();
  const companyId = auth.getCompanyId?.();
  const { useLocationsTree, createLocation, updateLocation, deleteLocation } = useLocations();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(companyId);
  const { data: tree, isLoading, isError } = useLocationsTree(selectedCompanyId);

  // Load organizations for company selection
  const { useOrganizationList } = useOrganization();
  const { data: organizations } = useOrganizationList();
  const organizationOptions = useMemo(() => {
    return (organizations ?? []).map((org) => ({ value: org.id, label: org.name }));
  }, [organizations]);

  // Determine if current user can manage locations (Admin/SuperAdmin)
  const [canManage] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const user = JSON.parse(raw);
      const role = user?.role;
      return role === 0 || role === 1 || role === 'SuperAdmin' || role === 'Admin';
    } catch {
      return false;
    }
  });

  const [expanded, setExpanded] = useState<NodeState>({});
  const [addingUnder, setAddingUnder] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', color: '' });
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const startAdd = (parentId: string | null) => {
    setError(null);
    setAddingUnder(parentId ?? 'root');
    setEditingId(null);
    setForm({ name: '', color: '' });
  };

  const startEdit = (node: { id: string; name: string; color?: string | null }) => {
    setError(null);
    setEditingId(node.id);
    setAddingUnder(null);
    setForm({ name: node.name, color: node.color ?? '' });
  };

  const submit = async (parentId?: string | null) => {
    if (!canManage) return; // guard
    try {
      if (editingId) {
        await updateLocation.mutateAsync({ id: editingId, data: { name: form.name, color: form.color || null } });
      } else {
        if (!selectedCompanyId) {
          setError('Please select a company first.');
          return;
        }
        const payload = {
          name: form.name,
          color: form.color || null,
          parentId: parentId && parentId !== 'root' ? parentId : null,
          companyId: selectedCompanyId,
        };
        await createLocation.mutateAsync(payload);
      }
      setAddingUnder(null);
      setEditingId(null);
      setForm({ name: '', color: '' });
    } catch {
      setError('Failed to save location');
    }
  };

  const remove = async (id: string) => {
    if (!canManage) return; // guard
    if (!window.confirm('Delete this location? If it has children, deletion will be blocked.')) return;
    try {
      await deleteLocation.mutateAsync(id);
    } catch {
      setError('Cannot delete a location with children.');
    }
  };

  type TreeNode = {
    id: string;
    name: string;
    color?: string | null;
    children?: TreeNode[];
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = !!expanded[node.id];
    return (
      <div key={node.id} className="ml-2">
        <div className="flex items-center gap-3 py-1">
          {Array.isArray(node.children) && node.children.length > 0 && (
            <button className="text-xs text-gray-500" onClick={() => toggle(node.id)}>
              {isExpanded ? '−' : '+'}
            </button>
          )}
          <div className="flex-1">
            <span className="font-medium text-gray-800 dark:text-white/90">{node.name}</span>
            {node.color && <span className="ml-2 inline-block w-3 h-3 rounded" style={{ background: node.color }} />}
          </div>
          <div className="flex gap-2">
            {canManage && (
              <>
                <button className="px-2 py-1 bg-gray-200 text-gray-800 rounded" onClick={() => startAdd(node.id)}>Add</button>
                <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={() => startEdit(node)}>Edit</button>
                <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => remove(node.id)}>Delete</button>
              </>
            )}
          </div>
        </div>
        {addingUnder === node.id && (
          <div className="ml-6 my-2 p-3 border rounded border-gray-200 dark:border-white/[0.08]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Name</Label>
                <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Color (optional)</Label>
                <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="#RRGGBB or name" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => submit(node.id)}>Save</button>
              <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded" onClick={() => { setAddingUnder(null); setForm({ name: '', color: '' }); }}>Cancel</button>
            </div>
          </div>
        )}
        {editingId === node.id && (
          <div className="ml-6 my-2 p-3 border rounded border-gray-200 dark:border-white/[0.08]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Name</Label>
                <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Color (optional)</Label>
                <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="#RRGGBB or name" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => submit(node.id)}>Update</button>
              <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded" onClick={() => { setEditingId(null); setForm({ name: '', color: '' }); }}>Cancel</button>
            </div>
          </div>
        )}
        {isExpanded && node.children && node.children.length > 0 && (
          <div className="ml-5 border-l border-gray-200 dark:border-white/[0.06] pl-3">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Locations</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label>Company</Label>
            <select
              value={selectedCompanyId ?? ''}
              onChange={(e) => setSelectedCompanyId(e.target.value || undefined)}
              className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">Select a company</option>
              {organizationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {canManage && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => startAdd(null)}>Add Location</button>
          )}
        </div>
      </div>
      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
      {isLoading ? (
        <div className="text-gray-500 text-sm dark:text-gray-400">Loading…</div>
      ) : isError ? (
        <div className="text-red-500 text-sm">Failed to load locations</div>
      ) : (
        <div>
          {addingUnder === 'root' && (
            <div className="my-2 p-3 border rounded border-gray-200 dark:border-white/[0.08]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Name</Label>
                  <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Color (optional)</Label>
                  <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="#RRGGBB or name" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => submit(null)}>Save</button>
                <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded" onClick={() => { setAddingUnder(null); setForm({ name: '', color: '' }); }}>Cancel</button>
              </div>
            </div>
          )}
          {(tree ?? []).map((node) => renderNode(node))}
        </div>
      )}
    </div>
  );
}
