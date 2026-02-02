import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useIssues from '@hooks/issues/useIssues';
import useOrganization from '@hooks/organization/useOrganization';
import useAsset from '@hooks/asset/useAsset';
import getAuth from '@hooks/api/useAuthApi';
import Label from '../../components/form/Label';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';

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
  const [isEmployee] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const user = JSON.parse(raw);
      const role = user?.role;
      return role === 'Employee' || role === 2;
    } catch {
      return false;
    }
  });
  const [currentUserId] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user?.id ?? null;
    } catch {
      return null;
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

  const { data: organizations } = useOrganizationList();
  const orgOptions = useMemo(() => (organizations ?? []).map(o => ({ value: o.id, label: o.name })), [organizations]);

  const { data: assets } = useAssetList({ companyId });
  const employeeScopedAssets = useMemo(() => {
    const list = assets ?? [];
    if (isEmployee && currentUserId) {
      return list.filter(a => a.assignedUserId === currentUserId);
    }
    return list;
  }, [assets, isEmployee, currentUserId]);
  const assetOptions = useMemo(() => (employeeScopedAssets ?? []).map(a => ({ value: a.id, label: `${a.make || ''} ${a.model || ''}`.trim() || a.assetId })), [employeeScopedAssets]);

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
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Label>Company</Label>
              <select value={companyId ?? ''} onChange={(e) => setCompanyId(e.target.value || undefined)} className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                <option value="">All</option>
                {orgOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label>Asset</Label>
            <select value={assetId ?? ''} onChange={(e) => setAssetId(e.target.value || undefined)} className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <option value="">All</option>
              {assetOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          {/* Allow employees to raise an issue for their assigned asset */}
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50"
            disabled={!assetId}
            onClick={() => assetId && navigate(`/assets/${assetId}/issues/new`)}
          >
            Raise Issue
          </button>
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
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Description</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Priority</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400" colSpan={5}>No issues</TableCell>
                </TableRow>
              ) : (
                filtered.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{i.description}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{priorityName(i.priority)}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{statusName(i.status)}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{new Date(i.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                      <button className="text-blue-600" onClick={() => navigate(`/assets/issues/${i.id}`)}>View</button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
