import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useIssues from '@hooks/issues/useIssues';
import useOrganization from '@hooks/organization/useOrganization';
import useAsset from '@hooks/asset/useAsset';
import getAuth from '@hooks/api/useAuthApi';
import Label from '../../components/form/Label';

const priorityOptions = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
  { value: 4, label: 'Critical' },
];

export default function IssueCreate() {
  const navigate = useNavigate();
  const { assetId: routeAssetId } = useParams<{ assetId: string }>();
  const auth = getAuth();
  const initialCompanyId = auth.getCompanyId?.();

  const { createIssue, uploadIssueAttachments } = useIssues();
  const { useOrganizationList } = useOrganization();
  const { useAssetList } = useAsset();

  const [companyId, setCompanyId] = useState<string | undefined>(initialCompanyId);
  const [assetId, setAssetId] = useState<string | undefined>(routeAssetId);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<number>(2);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: organizations } = useOrganizationList();
  const orgOptions = useMemo(() => (organizations ?? []).map(o => ({ value: o.id, label: o.name })), [organizations]);

  const { data: assets } = useAssetList({ companyId });
  const assetOptions = useMemo(() => (assets ?? []).map(a => ({ value: a.id, label: `${a.make || ''} ${a.model || ''}`.trim() || a.assetId })), [assets]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!companyId) { setError('Please select a company.'); return; }
    if (!assetId) { setError('Please select an asset.'); return; }
    setSaving(true);
    try {
      const issue = await createIssue.mutateAsync({ assetId, companyId, description, priority });
      if (files.length > 0) {
        await uploadIssueAttachments.mutateAsync({ id: issue.id, files });
      }
      navigate(`/assets/issues/${issue.id}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string } | null)?.message || 'Failed to create issue';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <h1 className="mb-4 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Raise Issue</h1>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Company</Label>
            <select value={companyId ?? ''} onChange={e=>setCompanyId(e.target.value || undefined)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <option value="">Select a company</option>
              {orgOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <div>
            <Label>Asset</Label>
            <select value={assetId ?? ''} onChange={e=>setAssetId(e.target.value || undefined)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <option value="">Select an asset</option>
              {assetOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" rows={4} required />
        </div>
        <div>
          <Label>Priority</Label>
          <select value={priority} onChange={e=>setPriority(Number(e.target.value))} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {priorityOptions.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
          </select>
        </div>
        <div>
          <Label>Attachments</Label>
          <input type="file" multiple onChange={onFileChange} className="mt-1 block text-sm" />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={saving}>{saving ? 'Saving…' : 'Create Issue'}</button>
          <button type="button" className="px-4 py-2 bg-gray-300 text-gray-800 rounded" onClick={()=>navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
