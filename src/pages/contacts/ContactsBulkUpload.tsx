import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useContacts from '@hooks/contacts/useContacts';
import useOrganization from '@hooks/organization/useOrganization';
import getAuth from '@hooks/api/useAuthApi';
import Label from '../../components/form/Label';
import type { CreateContactDto } from '@hooks/api/useContactsApi';

export default function ContactsBulkUpload() {
  const { bulkUpload } = useContacts();
  const { useOrganizationList } = useOrganization();
  const auth = getAuth();
  const navigate = useNavigate();

  const currentCompanyId = auth.getCompanyId() as string | null;
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
  const organizationOptions = useMemo(() => {
    return (organizations ?? []).map((org) => ({ value: org.id, label: org.name }));
  }, [organizations]);

  const [companyId, setCompanyId] = useState<string | undefined>(currentCompanyId ?? undefined);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ success: CreateContactDto[]; errors: Array<{ data: CreateContactDto; error: string }> } | null>(null);

  const parseRows = (): CreateContactDto[] => {
    // Accept simple CSV: Full Name, Phone, Notes
    return input
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        const fullName = parts[0] || '';
        const phone = parts[1] || '';
        const notes = parts[2] || '';
        return {
          fullName,
          phone: phone || null,
          notes: notes || null,
          companyId: (isSuperAdmin ? companyId : currentCompanyId) as string,
        } as CreateContactDto;
      })
      .filter((row) => row.fullName);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(isSuperAdmin || currentCompanyId)) {
      return;
    }
    const rows = parseRows();
    if (rows.length === 0) {
      alert('No valid rows to upload');
      return;
    }
    try {
      const res = await bulkUpload.mutateAsync({ companyId: (isSuperAdmin ? (companyId as string) : (currentCompanyId as string)), data: rows });
      setResult(res);
    } catch {
      alert('Bulk upload failed');
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <h1 className="mb-4 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Bulk Upload Contacts</h1>
      <form onSubmit={onSubmit} className="space-y-4 max-w-3xl">
        {isSuperAdmin ? (
          <div className="max-w-xl">
            <Label>Company</Label>
            <select
              value={companyId ?? ''}
              onChange={(e) => setCompanyId(e.target.value || undefined)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">Select a company</option>
              {organizationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="max-w-xl">
            <input
              type="hidden"
              value={currentCompanyId ?? ''}
              readOnly
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        )}
        <div>
          <Label>Paste rows (Full Name, Phone, Notes) one per line</Label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            placeholder="Jane Doe, +27 82 000 0000, VIP\nJohn Smith, , Follow up later"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Upload</button>
          <button type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded" onClick={() => navigate('/admin/contacts')}>Back</button>
        </div>
      </form>

      {result && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2 text-gray-800 dark:text-white/90">Results</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <h3 className="font-medium mb-2 text-gray-800 dark:text-white/90">Success ({result.success.length})</h3>
              <ul className="list-disc ml-6 text-sm text-gray-600 dark:text-gray-300">
                {result.success.map((row, idx) => (
                  <li key={idx}>{row.fullName} - {row.phone || '-'} - {row.notes || '-'}</li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <h3 className="font-medium mb-2 text-gray-800 dark:text-white/90">Errors ({result.errors.length})</h3>
              <ul className="list-disc ml-6 text-sm text-red-600 dark:text-red-400">
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err.data.fullName} - {err.data.phone || '-'} - {err.data.notes || '-'}: {err.error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}