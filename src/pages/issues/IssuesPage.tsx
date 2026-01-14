import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useIssues from '@hooks/issues/useIssues';
import useOrganization from '@hooks/organization/useOrganization';
import useAsset from '@hooks/asset/useAsset';
import getAuth from '@hooks/api/useAuthApi';
import Label from '../../components/form/Label';

const statusName = (s: number) => ({ 0: 'Open', 1: 'In Progress', 2: 'Resolved', 3: 'Closed' }[s] || String(s));
const priorityName = (p: number) => ({ 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }[p] || String(p));

export default function IssuesPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const initialCompanyId = auth.getCompanyId?.();

  const { useIssuesList } = useIssues();
  const { useOrganizationList } = useOrganization();
  const { useAssetList } = useAsset();

  const [tab, setTab] = useState<'open' | 'resolved' | 'all'>('open');
  const [companyId, setCompanyId] = useState<string | undefined>(initialCompanyId);
  const [assetId, setAssetId] = useState<string | undefined>(undefined);

  const { data: organizations } = useOrganizationList();
  const orgOptions = useMemo(() => (organizations ?? []).map(o => ({ value: o.id, label: o.name })), [organizations]);

  const { data: assets } = useAssetList({ companyId });
  const assetOptions = useMemo(() => (assets ?? []).map(a => ({ value: a.id, label: `${a.make || ''} ${a.model || ''}`.trim() || a.assetId })), [assets]);

  const openOnly = tab === 'open' ? true : undefined;
  const { data: issues, isLoading, isError } = useIssuesList({ companyId, assetId, openOnly });

  const filtered = useMemo(() => {
    if (!issues) return [];
    if (tab === 'resolved') return issues.filter(i => i.status === 2 || i.status === 3);
    return issues;
  }, [issues, tab]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Issues</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label>Company</Label>
            <select value={companyId ?? ''} onChange={(e) => setCompanyId(e.target.value || undefined)} className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <option value="">All</option>
              {orgOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label>Asset</Label>
            <select value={assetId ?? ''} onChange={(e) => setAssetId(e.target.value || undefined)} className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <option value="">All</option>
              {assetOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => navigate('/assets')}>Go to Assets</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button className={`px-3 py-1 rounded ${tab==='open'?'bg-blue-600 text-white':'bg-gray-200 text-gray-800'}`} onClick={() => setTab('open')}>Open</button>
        <button className={`px-3 py-1 rounded ${tab==='resolved'?'bg-blue-600 text-white':'bg-gray-200 text-gray-800'}`} onClick={() => setTab('resolved')}>Resolved</button>
        <button className={`px-3 py-1 rounded ${tab==='all'?'bg-blue-600 text-white':'bg-gray-200 text-gray-800'}`} onClick={() => setTab('all')}>All</button>
      </div>

      {isLoading ? (
        <div className="text-gray-500 text-sm dark:text-gray-400">Loading…</div>
      ) : isError ? (
        <div className="text-red-500 text-sm">Failed to load issues</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2">{i.description}</td>
                  <td className="px-4 py-2">{priorityName(i.priority)}</td>
                  <td className="px-4 py-2">{statusName(i.status)}</td>
                  <td className="px-4 py-2">{new Date(i.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2"><button className="text-blue-600" onClick={() => navigate(`/assets/issues/${i.id}`)}>View</button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td className="px-4 py-3 text-gray-400" colSpan={5}>No issues</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
