import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocations from '@hooks/locations/useLocations';
import getAuth from '@hooks/api/useAuthApi';
import useOrganization from '@hooks/organization/useOrganization';
import Label from '../../components/form/Label';
import FileInput from '../../components/form/input/FileInput';
import Switch from '../../components/form/switch/Switch';
import useLocationsApi from '../../hooks/api/useLocationsApi';

type FormState = {
  name: string;
  color?: string;
  floorplanFile?: File | null;
  floorplanPath?: string | null;
  active?: boolean;
  allowColleagueSearch?: boolean;
  autoReleaseAfterMin?: number;
  requiredSsoSecurityGroupId?: string | null;
};

type NodeState = Record<string, boolean>;

export default function LocationsPage() {
  const auth = getAuth();
  const companyId = auth.getCompanyId?.();
  const navigate = useNavigate();
  const { useLocationsTree, createLocation, updateLocation, deleteLocation } = useLocations();
  const { uploadFloorplan } = useLocationsApi();
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

  const [expanded, setExpanded] = useState<NodeState>({});
  const [addingUnder, setAddingUnder] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', color: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const startAdd = (parentId: string | null) => {
    setError(null);
    setAddingUnder(parentId ?? 'root');
    setEditingId(null);
    setForm({ name: '', color: '', floorplanFile: null, floorplanPath: null, active: true, allowColleagueSearch: false, autoReleaseAfterMin: 15, requiredSsoSecurityGroupId: null });
  };

  const startEdit = (node: { id: string; name: string; color?: string | null; floorplanPath?: string | null; active?: boolean; allowColleagueSearch?: boolean; autoReleaseAfterMin?: number; requiredSsoSecurityGroupId?: string | null }) => {
    setError(null);
    setEditingId(node.id);
    setAddingUnder(null);
    setForm({ name: node.name, color: node.color ?? '', floorplanFile: null, floorplanPath: node.floorplanPath ?? null, active: node.active ?? true, allowColleagueSearch: node.allowColleagueSearch ?? false, autoReleaseAfterMin: (typeof node.autoReleaseAfterMin === 'number' ? node.autoReleaseAfterMin : 15), requiredSsoSecurityGroupId: node.requiredSsoSecurityGroupId ?? null });
  };

  const submit = async (parentId?: string | null) => {
    if (!canManage) return; // guard
    setIsSubmitting(true);
    try {
      let floorplanPath = form.floorplanPath;
      
      if (editingId) {
        // Upload floorplan if a new file is selected
        if (form.floorplanFile) {
          try {
            const result = await uploadFloorplan(editingId, form.floorplanFile);
            floorplanPath = result.path;
          } catch {
            setError('Failed to upload floorplan');
            setIsSubmitting(false);
            return;
          }
        }
        await updateLocation.mutateAsync({ 
          id: editingId, 
          data: { 
            name: form.name, 
            color: form.color || null,
            floorplanPath: floorplanPath || null,
            active: form.active,
            allowColleagueSearch: form.allowColleagueSearch,
            autoReleaseAfterMin: typeof form.autoReleaseAfterMin === 'number' ? form.autoReleaseAfterMin : 15,
            requiredSsoSecurityGroupId: form.requiredSsoSecurityGroupId ?? null
          } 
        });
      } else {
        if (!selectedCompanyId) {
          setError('Please select a company first.');
          setIsSubmitting(false);
          return;
        }
        const payload = {
          name: form.name,
          color: form.color || null,
          parentId: parentId && parentId !== 'root' ? parentId : null,
          companyId: selectedCompanyId,
          floorplanPath: floorplanPath || null,
          active: form.active ?? true,
          allowColleagueSearch: form.allowColleagueSearch ?? false,
          autoReleaseAfterMin: typeof form.autoReleaseAfterMin === 'number' ? form.autoReleaseAfterMin : 15,
          requiredSsoSecurityGroupId: form.requiredSsoSecurityGroupId ?? null,
        };
        const created = await createLocation.mutateAsync(payload);
        
        // Upload floorplan after creation if file provided
        if (form.floorplanFile && created) {
          try {
            await uploadFloorplan(created.id, form.floorplanFile);
          } catch (err) {
            console.warn('Floorplan upload failed after location creation', err);
          }
        }
      }
      setAddingUnder(null);
      setEditingId(null);
      setForm({ name: '', color: '', floorplanFile: null, floorplanPath: null, active: true, allowColleagueSearch: false, autoReleaseAfterMin: 15, requiredSsoSecurityGroupId: null });
    } catch {
      setError('Failed to save location');
    } finally {
      setIsSubmitting(false);
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
    floorplanPath?: string | null;
    active?: boolean;
    allowColleagueSearch?: boolean;
    autoReleaseAfterMin?: number;
    requiredSsoSecurityGroupId?: string | null;
    children?: TreeNode[];
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = !!expanded[node.id];
    const isInactive = node.active === false;
    return (
      <div key={node.id} className="ml-2">
        <div className="flex items-center gap-3 py-1">
          {Array.isArray(node.children) && node.children.length > 0 && (
            <button className="text-xs text-gray-500" onClick={() => toggle(node.id)}>
              {isExpanded ? '−' : '+'}
            </button>
          )}
          <div className="flex-1">
            <span className={`font-medium ${isInactive ? 'text-gray-400 line-through dark:text-gray-600' : 'text-gray-800 dark:text-white/90'}`}>{node.name}</span>
            {node.color && <span className="ml-2 inline-block w-3 h-3 rounded" style={{ background: node.color }} />}
            {isInactive && <span className="ml-2 text-xs text-red-500">(Inactive)</span>}
            {node.floorplanPath && <span className="ml-2 text-xs text-blue-500" title="Has floorplan">📐</span>}
            {node.allowColleagueSearch && <span className="ml-2 text-xs text-green-500" title="Colleague search enabled">👥</span>}
          </div>
          <div className="flex gap-2">
            <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => navigate(`/locations/${node.id}`)}>View</button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Color (optional)</Label>
                <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="#RRGGBB or name" />
              </div>
              <div className="sm:col-span-2">
                <Label>Floorplan (JPG/PNG/SVG, max 1920x1600)</Label>
                <FileInput onChange={(e) => setForm((f) => ({ ...f, floorplanFile: e.target.files?.[0] || null }))} accept=".jpg,.jpeg,.png,.svg" className="mt-1" />
              </div>
              <div>
                <Switch label="Active" defaultChecked={form.active ?? true} onChange={(checked) => setForm((f) => ({ ...f, active: checked }))} />
              </div>
              <div>
                <Switch label="Allow Colleague Search" defaultChecked={form.allowColleagueSearch ?? false} onChange={(checked) => setForm((f) => ({ ...f, allowColleagueSearch: checked }))} />
              </div>
              <div>
                <Label>Auto Release After Minutes</Label>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  value={typeof form.autoReleaseAfterMin === 'number' ? form.autoReleaseAfterMin : 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setForm((f) => ({ ...f, autoReleaseAfterMin: isNaN(val) ? 15 : Math.max(0, val) }));
                  }}
                />
              </div>
              <div>
                <Label>Required SSO Security Group Id (optional)</Label>
                <input
                  type="text"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  value={form.requiredSsoSecurityGroupId ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, requiredSsoSecurityGroupId: e.target.value ? e.target.value : null }))}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={() => submit(node.id)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving…' : 'Save'}
              </button>
              <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded" onClick={() => { setAddingUnder(null); setForm({ name: '', color: '', floorplanFile: null, floorplanPath: null, active: true, allowColleagueSearch: false, autoReleaseAfterMin: 15, requiredSsoSecurityGroupId: null }); }}>Cancel</button>
            </div>
          </div>
        )}
        {editingId === node.id && (
          <div className="ml-6 my-2 p-3 border rounded border-gray-200 dark:border-white/[0.08]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Color (optional)</Label>
                <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="#RRGGBB or name" />
              </div>
              <div className="sm:col-span-2">
                <Label>Floorplan (JPG/PNG/SVG, max 1920x1600)</Label>
                {form.floorplanPath && (
                  <div className="mb-2 text-xs text-gray-500">Current: <a href={form.floorplanPath} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View</a></div>
                )}
                <FileInput onChange={(e) => setForm((f) => ({ ...f, floorplanFile: e.target.files?.[0] || null }))} accept=".jpg,.jpeg,.png,.svg" className="mt-1" />
              </div>
              <div>
                <Switch label="Active" defaultChecked={form.active ?? true} onChange={(checked) => setForm((f) => ({ ...f, active: checked }))} />
              </div>
              <div>
                <Switch label="Allow Colleague Search" defaultChecked={form.allowColleagueSearch ?? false} onChange={(checked) => setForm((f) => ({ ...f, allowColleagueSearch: checked }))} />
              </div>
              <div>
                <Label>Auto Release After Minutes</Label>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  value={typeof form.autoReleaseAfterMin === 'number' ? form.autoReleaseAfterMin : 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setForm((f) => ({ ...f, autoReleaseAfterMin: isNaN(val) ? 15 : Math.max(0, val) }));
                  }}
                />
              </div>
              <div>
                <Label>Required SSO Security Group Id (optional)</Label>
                <input
                  type="text"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  value={form.requiredSsoSecurityGroupId ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, requiredSsoSecurityGroupId: e.target.value ? e.target.value : null }))}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={() => submit(node.id)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating…' : 'Update'}
              </button>
              <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded" onClick={() => { setEditingId(null); setForm({ name: '', color: '', floorplanFile: null, floorplanPath: null, active: true, allowColleagueSearch: false, autoReleaseAfterMin: 15, requiredSsoSecurityGroupId: null }); }}>Cancel</button>
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
          {isSuperAdmin ? (
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
          ) :  (
            <div className="flex items-center gap-2">
     
              <input
                type="hidden"
                value={companyId ?? ''}
                readOnly
                className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Color (optional)</Label>
                  <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="#RRGGBB or name" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Floorplan (JPG/PNG/SVG, max 1920x1600)</Label>
                  <FileInput onChange={(e) => setForm((f) => ({ ...f, floorplanFile: e.target.files?.[0] || null }))} accept=".jpg,.jpeg,.png,.svg" className="mt-1" />
                </div>
                <div>
                  <Switch label="Active" defaultChecked={form.active ?? true} onChange={(checked) => setForm((f) => ({ ...f, active: checked }))} />
                </div>
                <div>
                  <Switch label="Allow Colleague Search" defaultChecked={form.allowColleagueSearch ?? false} onChange={(checked) => setForm((f) => ({ ...f, allowColleagueSearch: checked }))} />
                </div>
                <div>
                  <Label>Auto Release After Minutes</Label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    value={typeof form.autoReleaseAfterMin === 'number' ? form.autoReleaseAfterMin : 15}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setForm((f) => ({ ...f, autoReleaseAfterMin: isNaN(val) ? 15 : Math.max(0, val) }));
                    }}
                  />
                </div>
                <div>
                  <Label>Required SSO Security Group Id (optional)</Label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    value={form.requiredSsoSecurityGroupId ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, requiredSsoSecurityGroupId: e.target.value ? e.target.value : null }))}
                    placeholder="00000000-0000-0000-0000-000000000000"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={() => submit(null)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving…' : 'Save'}
                </button>
                <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded" onClick={() => { setAddingUnder(null); setForm({ name: '', color: '', floorplanFile: null, floorplanPath: null, active: true, allowColleagueSearch: false, autoReleaseAfterMin: 15, requiredSsoSecurityGroupId: null }); }}>Cancel</button>
              </div>
            </div>
          )}
          {(tree ?? []).map((node) => renderNode(node))}
        </div>
      )}
    </div>
  );
}
