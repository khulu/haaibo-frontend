import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useContacts from '@hooks/contacts/useContacts';
import useOrganization from '@hooks/organization/useOrganization';
import getAuth from '@hooks/api/useAuthApi';
import type { CreateContactDto } from '@hooks/api/useContactsApi';
import Label from '../../components/form/Label';

export default function ContactCreate() {
  const { createContact } = useContacts();
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

  const [form, setForm] = useState<{
    fullName: string;
    phone?: string;
    notes?: string;
    companyId?: string;
  }>({ fullName: '', phone: '', notes: '', companyId: currentCompanyId ?? undefined });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      return;
    }
    const payload: CreateContactDto = {
      fullName: form.fullName,
      phone: form.phone || null,
      companyId: (isSuperAdmin ? form.companyId : currentCompanyId) as string,
      notes: form.notes || null,
    };
    try {
      await createContact.mutateAsync(payload);
      navigate('/admin/contacts');
    } catch {
      alert('Failed to create contact');
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <h1 className="mb-4 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Add Contact</h1>
      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <div>
          <Label>Full Name</Label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            required
          />
        </div>
        <div>
          <Label>Phone (optional)</Label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
        <div>
          <Label>Notes (optional)</Label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            rows={3}
          />
        </div>
        {isSuperAdmin ? (
          <div>
            <Label>Company</Label>
            <select
              value={form.companyId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value || undefined }))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">Select a company</option>
              {organizationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ) : ''}
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          <button type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded" onClick={() => navigate('/admin/contacts')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}