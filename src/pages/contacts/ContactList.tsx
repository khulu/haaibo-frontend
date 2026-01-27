import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useContacts from '@hooks/contacts/useContacts';
import useOrganization from '@hooks/organization/useOrganization';
import getAuth from '@hooks/api/useAuthApi';
import Label from '../../components/form/Label';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';

export default function ContactList() {
  const { useContactsList, deleteContact, useContactsTotal } = useContacts();
  const auth = getAuth();
  const companyId = auth.getCompanyId();
  const navigate = useNavigate();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(companyId ?? undefined);
  const [search, setSearch] = useState('');

  // role check
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

  const { data: contacts, isLoading } = useContactsList(selectedCompanyId);
  const { data: totals } = useContactsTotal(selectedCompanyId);

  // Load organizations for company selection (for SuperAdmin filter)
  const { useOrganizationList } = useOrganization();
  const { data: organizations } = useOrganizationList();
  const organizationOptions = useMemo(() => {
    return (organizations ?? []).map((org) => ({ value: org.id, label: org.name }));
  }, [organizations]);

  const filtered = useMemo(() => {
    const list = contacts ?? [];
    if (!search) return list;
    return list.filter((c) =>
      [c.fullName, c.phone, c.companyName, c.notes].some((f) => (f || '').toLowerCase().includes(search.toLowerCase()))
    );
  }, [contacts, search]);

  if (isLoading) return <div className="p-6">Loading contacts...</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Contacts</h1>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
          {(isSuperAdmin) && (
            <div className="flex items-center gap-2 mr-2">
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
          )}
          {(isSuperAdmin) && (
            <>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => navigate('/admin/contacts/new')}
              >
                Add Contact
              </button>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
                onClick={() => navigate('/admin/contacts/bulk')}
              >
                Bulk Upload
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-300">Total: {totals?.total ?? filtered.length}</span>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Phone</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Company</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Notes</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{c.fullName}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{c.phone || '-'}</TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{c.companyName || '-'}</TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{c.notes || '-'}</TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <div className="flex gap-2">
                    <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={() => navigate(`/admin/contacts/${c.id}/edit`)}>Edit</button>
                    {(isSuperAdmin) && (
                      <button
                        className="px-2 py-1 bg-red-500 text-white rounded"
                        onClick={async () => {
                          if (!window.confirm('Delete this contact?')) return;
                          try {
                            await deleteContact.mutateAsync({ id: c.id });
                            alert('Contact deleted');
                          } catch {
                            alert('Failed to delete contact');
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}