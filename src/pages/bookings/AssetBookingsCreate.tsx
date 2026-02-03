import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import getAuth from '@hooks/api/useAuthApi';
import useAsset from '@hooks/asset/useAsset';
import useUser from '@hooks/user/useUser';
import useBookings from '@hooks/bookings/useBookings';
import type { CreateBookingsPayload } from '@hooks/api/useBookingsApi';
import Label from '../../components/form/Label';
import useContacts from '@hooks/contacts/useContacts';
import DatePicker from '../../components/form/date-picker';

type Mode = 'myself' | 'existing' | 'external';

function decodeJwtUserId(token: string | null | undefined): string | undefined {
  try {
    if (!token) return undefined;
    const [, payload] = token.split('.');
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return json.sub || json.userId || json.nameid || json.uid || undefined;
  } catch {
    return undefined;
  }
}

export default function AssetBookingsCreate() {
  const navigate = useNavigate();
  const auth = getAuth();
  const token = auth.getToken();
  const companyId = auth.getCompanyId?.();
  const currentUserId = decodeJwtUserId(token);

  const { useAssetList } = useAsset();
  const { data: assets } = useAssetList({ companyId });
  const { useUserList } = useUser();
  const { data: users } = useUserList({ companyId });
  const { createBookings } = useBookings();
  const { useContactsList } = useContacts();
  const { data: contacts } = useContactsList(companyId);

  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [mode, setMode] = useState<Mode>('myself');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [extName, setExtName] = useState<string>('');
  const [extEmail, setExtEmail] = useState<string>('');
  const [extPhone, setExtPhone] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const assetOptions = useMemo(() => (assets ?? []).map((a) => ({ value: a.id, label: `${a.make ?? ''} ${a.model ?? ''} ${a.serialNumber ?? a.assetId ?? a.laptopTagNumber ?? ''}`.trim() })), [assets]);
  const userOptions = useMemo(() => (users ?? []).map((u) => ({ value: u.id, label: u.fullName || u.email })), [users]);
  const contactOptions = useMemo(() => (contacts ?? []).map((c) => ({ value: c.id, label: c.fullName + (c.phone ? ` (${c.phone})` : '') })), [contacts]);

  const validate = (): string | null => {
    if (selectedAssetIds.length === 0) return 'Please select at least one asset';
    if (!start || !end) return 'Please select a start and end date/time';
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Invalid date selection';
    if (s > e) return 'Start date must be before or equal to end date';
    if (mode === 'myself' && !currentUserId) return 'Unable to determine your user ID from the session';
    if (mode === 'existing' && !selectedUserId) return 'Please select a user';
    if (mode === 'external' && !extName.trim()) return 'Please provide the external contact name';
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErrors([]);
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    const body: CreateBookingsPayload = {
      assetIds: selectedAssetIds,
      startDate: new Date(start).toISOString(),
      endDate: new Date(end).toISOString(),
      notes: notes || undefined,
      // companyId: typically omitted, inferred on server; uncomment if needed
      // companyId: companyId ?? undefined,
    };
    if (mode === 'myself') body.assigneeUserId = currentUserId;
    if (mode === 'existing') body.assigneeUserId = selectedUserId;
    if (mode === 'external') {
      body.externalContactName = extName;
      body.externalContactEmail = extEmail || undefined;
      body.externalContactPhone = extPhone || undefined;
    }

    const result = await createBookings.mutateAsync(body);
    if (result.errors?.length) {
      setServerErrors(result.errors.map((e) => (e?.error ? String(e.error) : 'Unknown error')));
      return;
    }
    // success: show simple message then navigate back

    navigate('/assets');
  };

  const toggleAsset = (id: string, checked: boolean) => {
    setSelectedAssetIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Book Assets</h1>
      </div>
      <form className="space-y-6" onSubmit={onSubmit}>
        {/* Assets multi-select: as list of checkboxes for clarity */}
        <div>
          <Label>Assets</Label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border border-gray-200 dark:border-white/[0.08] rounded p-3">
            {assetOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                <input
                  type="checkbox"
                  checked={selectedAssetIds.includes(opt.value)}
                  onChange={(e) => toggleAsset(opt.value, e.target.checked)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
            {assetOptions.length === 0 && (
              <div className="text-gray-500 text-sm dark:text-gray-400 flex items-center justify-between">
                <span>No assets available.</span>
                <Link
                  to="/assets/create"
                  className="inline-flex items-center px-3 py-1.5 rounded bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600"
                >
                  Add Asset
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <DatePicker
              id="start-date"
              label="Start"
              placeholder="Select a date"
              defaultDate={start || undefined}
              onChange={(_dates, dateStr) => {
                setStart(dateStr);
              }}
            />
          </div>
          <div>
            <DatePicker
              id="end-date"
              label="End"
              placeholder="Select a date"
              defaultDate={end || undefined}
              onChange={(_dates, dateStr) => {
                setEnd(dateStr);
              }}
            />
          </div>
        </div>

        {/* Assignee mode */}
        <div>
          <Label>Assign to</Label>
          <div className="mt-2 flex gap-4 text-sm text-gray-700 dark:text-gray-300">
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode === 'myself'} onChange={() => setMode('myself')} />
              Myself
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode === 'existing'} onChange={() => setMode('existing')} />
              Existing user
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode === 'external'} onChange={() => setMode('external')} />
              External contact
            </label>
          </div>
        </div>

        {mode === 'existing' && (
          <div>
            <Label>Select user</Label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">Select a user</option>
              {userOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {mode === 'external' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <Label>Select from company contacts (optional)</Label>
              <select
                value={selectedContactId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedContactId(id);
                  const found = (contacts ?? []).find((c) => c.id === id);
                  if (found) {
                    setExtName(found.fullName || '');
                    setExtPhone(found.phone || '');
                  }
                }}
                className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">Select a contact</option>
                {contactOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>External name</Label>
              <input
                type="text"
                value={extName}
                onChange={(e) => setExtName(e.target.value)}
                className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                required
              />
            </div>
            <div>
              <Label>External email (optional)</Label>
              <input
                type="email"
                value={extEmail}
                onChange={(e) => setExtEmail(e.target.value)}
                className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <Label>External phone (optional)</Label>
              <input
                type="tel"
                value={extPhone}
                onChange={(e) => setExtPhone(e.target.value)}
                className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        )}

        <div>
          <Label>Notes (optional)</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            rows={3}
          />
        </div>

        {formError && <div className="text-red-500 text-sm">{formError}</div>}
        {serverErrors.length > 0 && (
          <div className="text-red-500 text-sm space-y-1">
            {serverErrors.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={createBookings.isPending}>
            {createBookings.isPending ? 'Booking…' : 'Book'}
          </button>
          <button type="button" className="px-4 py-2 bg-gray-300 text-gray-800 rounded" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
