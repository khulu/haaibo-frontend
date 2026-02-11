import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useNotificationsApi, { type NotificationItem, type Scope } from '../../hooks/api/useNotificationsApi';
import { useAuthContext } from '../../context/AuthContext';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';

export default function NotificationsPage() {
  const { user } = useAuthContext();
  const { list, markSeen, markAllSeen } = useNotificationsApi();

  const scope: Scope = useMemo(() => {
    const role = user?.role as number | string | undefined;
    if (role === 0 || role === 'SuperAdmin') return 'global';
    if (role === 1 || role === 'Admin') return 'company';
    return 'user';
  }, [user?.role]);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unseenCount, setUnseenCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [take, setTake] = useState<number>(20);
  const [skip, setSkip] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = async (newSkip: number = skip) => {
    setLoading(true);
    setError(null);
    try {
      const res = await list({ scope, take, skip: newSkip });
      setItems(res.items ?? []);
      setUnseenCount(res.unseenCount ?? (res.items ? res.items.filter((i) => !i.seenAt).length : 0));
      setTotal(res.total ?? res.items?.length ?? 0);
      setSkip(newSkip);
    } catch (e) {
      setError('Failed to load notifications');
      setItems([]);
      setUnseenCount(0);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, take]);

  const page = Math.floor(skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil(total / take));

  function formatTimeAgo(iso: string) {
    const created = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - created);
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  function relatedLink(type?: string | null, id?: string | null) {
    if (!type || !id) return undefined;
    switch (type) {
      case 'Issue':
        return `/assets/issues/${id}`;
      case 'Asset':
        return `/assets/${id}`;
      case 'Organization':
        return `/organizations/${id}`;
      case 'User':
        return `/users/${id}`;
      case 'Reservation':
        return `/reservations/${id}`;
      case 'Event':
        return `/events/${id}`;
      default:
        return undefined;
    }
  }

  const handleMarkSeen = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, seenAt: new Date().toISOString() } : n)));
    setUnseenCount((c) => Math.max(0, c - 1));
    try {
      await markSeen(id);
    } catch {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, seenAt: null } : n)));
      setUnseenCount((c) => c + 1);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllSeen();
      setItems((prev) => prev.map((n) => ({ ...n, seenAt: new Date().toISOString() })));
      setUnseenCount(0);
    } catch {}
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <PageBreadCrumb pageTitle="Notifications" />
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-300">Unseen: {unseenCount}</span>
          <button onClick={handleMarkAll} className="rounded border px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">Mark all as read</button>
        </div>
      </div>

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      <div className="rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {loading && <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
        {!loading && items.length === 0 && (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No notifications</div>
        )}
        {!loading && items.map((n) => {
          const to = relatedLink(n.relatedEntityType ?? null, n.relatedEntityId ?? null);
          const unread = !n.seenAt;
          return (
            <div key={n.id} className={`flex items-start justify-between gap-4 border-b border-gray-100 p-4 dark:border-gray-800 ${unread ? 'bg-gray-50 dark:bg-gray-800/40' : ''}`}>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{n.title ?? 'Notification'}</span>
                  {n.message && <span className="ml-2 text-gray-700 dark:text-gray-300">{n.message}</span>}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(n.createdAt)}</div>
                {to && (
                  <div className="mt-2">
                    <Link to={to} className="text-xs text-brand-600 hover:underline">View details</Link>
                  </div>
                )}
              </div>
              <button onClick={() => handleMarkSeen(n.id)} className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700">Mark read</button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {totalPages}</div>
        <div className="flex items-center gap-2">
          <button disabled={skip === 0} onClick={() => fetchPage(Math.max(0, skip - take))} className="rounded border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700">Prev</button>
          <button disabled={skip + take >= total} onClick={() => fetchPage(skip + take)} className="rounded border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700">Next</button>
          <select value={take} onChange={(e) => setTake(Number(e.target.value))} className="rounded border px-2 py-1 text-sm dark:border-gray-700">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
}
