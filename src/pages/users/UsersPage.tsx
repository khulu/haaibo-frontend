import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@hooks/user/useUser";
import getCompanyId from "@hooks/api/useAuthApi";
import useOrganization from "@hooks/organization/useOrganization";
import Label from "../../components/form/Label";
import { Modal } from "../../components/ui/modal/Modal";
import { useModal } from "../../hooks/useModal";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";

export default function UsersPage() {
  const { useUserList, deleteSingleUser } = useUser();
  const authApi = getCompanyId();
  const companyId = authApi.getCompanyId();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(companyId ?? undefined);
  const [search, setSearch] = useState('');

  // Load organizations for company selection (for SuperAdmin filter)
  const { useOrganizationList } = useOrganization();
  const { data: organizations } = useOrganizationList();
  const organizationOptions = useMemo(() => {
    return (organizations ?? []).map((org) => ({ value: org.id, label: org.name }));
  }, [organizations]);


  const [isSuperAdmin] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const user = JSON.parse(raw);
      const role = user?.role;
      return role === 0 || role === '0' || role === 'SuperAdmin';
    } catch {
      return false;
    }
  });

  // Static role map matching backend role values
  const ROLE_MAP: Record<number, string> = {
    0: "Super Admin",
    1: "Company Admin",
    2: "Security",
    3: "Employee",
  };

  const dropdownRoles = useMemo(() => {
    if (isSuperAdmin) {
      return Object.entries(ROLE_MAP).map(([value, text]) => ({ value: Number(value), text }));
    } else {
      return Object.entries(ROLE_MAP)
        .filter(([value]) => Number(value) !== 0)
        .map(([value, text]) => ({ value: Number(value), text }));
    }
  }, [isSuperAdmin]);

  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { isOpen: isConfirmOpen, openModal: openConfirm, closeModal: closeConfirm } = useModal();
  const [confirmUser, setConfirmUser] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();

  const { data: dataUsers, isLoading } = useUserList({ companyId: selectedCompanyId });
  const filteredUsers = useMemo(() => {
    const list = dataUsers ?? [];
    if (!search) return list;
    const term = search.toLowerCase();
    return list.filter((u) =>
      [u.fullName, u.email, u.companyName, u.department]
        .some((f) => (f || '').toLowerCase().includes(term))
    );
  }, [dataUsers, search]);
  const columnCount = isSuperAdmin ? 5 : 4;
  if (isLoading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Users</h1>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
          {isSuperAdmin && (
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
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => navigate("/users/create")}
          >
            Create User
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
            onClick={() => navigate(`/users/create-bulk${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`)}
          >
            Upload CSV/Excel
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">User</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Department</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Role</TableCell>
              {isSuperAdmin && (
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Company</TableCell>
              )}
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                  No users found{search ? ` for "${search}"` : ''}.
                </TableCell>
              </TableRow>
            )}
            {filteredUsers.map((user) => {
              const role = dropdownRoles?.find((r) => Number(r.value) === Number(user.role));
       
              return (
                <TableRow key={user.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80" onClick={() => navigate(`/users/${user.id}`)}>
                      <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
                        {user.profilePicture ? (
                          (() => {
                            const isProd = import.meta.env.ASPNETCORE_ENVIRONMENT === "Production";
                            const baseUrl = 'https://haiibo-backend-api.azurewebsites.net';
                            const p = user.profilePicture;
                            const imgSrc = isProd
                              ? (/^https?:\/\//.test(p) ? p : `${baseUrl}${p}`)
                              : p;
                            return (
                              <img
                                width={40}
                                height={40}
                                src={imgSrc}
                                alt={user.fullName}
                              />
                            );
                          })()
                        ) : (
                          <span className="text-gray-400 text-lg font-bold">
                            {user.fullName?.[0] || "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="block font-medium text-blue-600 text-theme-sm dark:text-blue-400 hover:underline">
                          {user.fullName}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {user.department || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <Badge size="sm" color={role?.text.toString() === "SuperAdmin" ? "success" : "warning"}>
                      {role?.text.toString()}
                    </Badge>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {user.companyName || "-"}
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 bg-gray-200 text-gray-800 rounded"
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        View
                      </button>
                      <button
                        className="px-2 py-1 bg-blue-500 text-white rounded"
                        onClick={() => navigate(`/users/edit/${user.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 bg-red-500 text-white rounded"
                        disabled={deletingId === user.id}
                        onClick={() => {
                          setConfirmUser({ id: user.id, name: user.fullName });
                          openConfirm();
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {/* Confirm Delete Modal */}
      <Modal isOpen={isConfirmOpen} onClose={closeConfirm} className="max-w-[700px] p-6 lg:p-10">
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Confirm Deletion
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this user{confirmUser && confirmUser.name ? `: ${confirmUser.name}` : ''}?
            </p>
          </div>
          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button
              onClick={closeConfirm}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Close
            </button>
            <button
              type="button"
              className="flex w-full justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 sm:w-auto"
              disabled={!confirmUser || deletingId === confirmUser?.id}
              onClick={async () => {
                if (!confirmUser) return;
                setDeletingId(confirmUser.id);
                try {
                  await deleteSingleUser.mutateAsync({ userId: confirmUser.id });
                  closeConfirm();
                  setConfirmUser(null);
                } catch (err: unknown) {
                  if (err && typeof err === 'object' && 'message' in err) {
                    setError((err as { message?: string }).message || 'Failed to delete user');
                  } else {
                    setError('Failed to delete user');
                  }
                } finally {
                  setDeletingId(null);
                }
              }}
            >
              {confirmUser && deletingId === confirmUser?.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
