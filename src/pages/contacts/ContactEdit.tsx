import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useContacts from '@hooks/contacts/useContacts';
import Label from '../../components/form/Label';
import type { UpdateContactDto } from '@hooks/api/useContactsApi';

export default function ContactEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useFetchContactById, updateContact } = useContacts();

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

  const { data: contact, isLoading } = useFetchContactById(id as string);
  const [form, setForm] = useState<{ fullName: string; phone?: string; notes?: string }>({ fullName: '', phone: '', notes: '' });

  useEffect(() => {
    if (contact) {
      setForm({ fullName: contact.fullName || '', phone: contact.phone || '', notes: contact.notes || '' });
    }
  }, [contact]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(isSuperAdmin)) {
      return;
    }
    const payload: UpdateContactDto = { fullName: form.fullName, phone: form.phone || null, notes: form.notes || null };
    try {
      await updateContact.mutateAsync({ id: id as string, data: payload });
      navigate('/admin/contacts');
    } catch {
      alert('Failed to update contact');
    }
  };

  if (isLoading) return <div className="p-6">Loading contact...</div>;
  if (!contact) return <div className="p-6">Contact not found</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <h1 className="mb-4 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Edit Contact</h1>
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
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          <button type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded" onClick={() => navigate('/admin/contacts')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}