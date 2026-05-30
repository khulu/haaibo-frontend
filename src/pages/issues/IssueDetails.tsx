import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useIssues from '@hooks/issues/useIssues';
import Label from '../../components/form/Label';

const statusOptions = [
  { value: 0, label: 'Open' },
  { value: 1, label: 'In Progress' },
  { value: 2, label: 'Resolved' },
  { value: 3, label: 'Closed' },
];

const statusName = (s: number) => ({ 0: 'Open', 1: 'In Progress', 2: 'Resolved', 3: 'Closed' }[s] || String(s));
const priorityName = (p: number) => ({ 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }[p] || String(p));

export default function IssueDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { useFetchIssueById, updateIssueStatus } = useIssues();

  const { data: issue, isLoading, isError } = useFetchIssueById(id!);
  const [status, setStatus] = useState<number>(0);
  const [resolutionNote, setResolutionNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userModified, setUserModified] = useState(false);

  useEffect(() => {
    if (issue && !userModified) {
      setStatus(issue.status);
      setResolutionNote(issue.resolutionNote ?? '');
    }
  }, [issue, userModified]);

  const canSetResolutionNote = useMemo(() => status === 2 || status === 3, [status]);

  const handleUpdateStatus = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await updateIssueStatus.mutateAsync({ id, data: { status, resolutionNote: canSetResolutionNote ? resolutionNote : undefined } });
      setUserModified(false);
    } catch (err: unknown) {
      const msg = (err as { message?: string } | null)?.message || 'Failed to update status';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="p-6">Loading issue…</div>;
  if (isError || !issue) return <div className="p-6 text-red-500">Failed to load issue.</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Issue Details</h1>
        <button className="px-4 py-2 bg-gray-300 text-gray-800 rounded" onClick={() => navigate('/assets/issues')}>Back to Issues</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <Label>Description</Label>
          <p className="mt-1 text-sm text-gray-800 dark:text-white/90">{issue.description}</p>
        </div>
        <div>
          <Label>Priority</Label>
          <p className="mt-1 text-sm text-gray-800 dark:text-white/90">{priorityName(issue.priority)}</p>
        </div>
        <div>
          <Label>Status</Label>
          <p className="mt-1 text-sm text-gray-800 dark:text-white/90">{statusName(issue.status)}</p>
        </div>
        <div>
          <Label>Reported</Label>
          <p className="mt-1 text-sm text-gray-800 dark:text-white/90">{new Date(issue.createdAt).toLocaleString()}</p>
        </div>
      </div>

      {issue.attachmentUrls && issue.attachmentUrls.length > 0 && (
        <div className="mb-6">
          <Label>Attachments</Label>
          <ul className="list-disc list-inside text-sm">
            {issue.attachmentUrls.map((u, idx) => (
              <li key={idx}><a href={u} target="_blank" rel="noreferrer" className="text-blue-600 underline">Attachment {idx+1}</a></li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-white/[0.06] pt-4">
        <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-3">Update Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <select value={status} onChange={e=>{setStatus(Number(e.target.value)); setUserModified(true);}} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {statusOptions.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
          {canSetResolutionNote && (
            <div>
              <Label>Resolution Note (optional)</Label>
              <textarea value={resolutionNote} onChange={e=>{setResolutionNote(e.target.value); setUserModified(true);}} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" rows={3} />
            </div>
          )}
        </div>
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        <div className="mt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleUpdateStatus} disabled={saving}>{saving ? 'Saving…' : 'Update'}</button>
        </div>
      </div>
    </div>
  );
}
