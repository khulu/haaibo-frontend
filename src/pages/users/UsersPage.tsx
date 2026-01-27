import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@hooks/user/useUser";
import getCompanyId from "@hooks/api/useAuthApi";
import useOrganization from "@hooks/organization/useOrganization";
import Label from "../../components/form/Label";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";

export default function UsersPage() {
  const { useUserList, deleteSingleUser, useRoles } = useUser();
  const authApi = getCompanyId();
  const companyId = authApi.getCompanyId();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(companyId ?? undefined);

  // Load organizations for company selection (for SuperAdmin filter)
  const { useOrganizationList } = useOrganization();
  const { data: organizations } = useOrganizationList();
  const organizationOptions = useMemo(() => {
    return (organizations ?? []).map((org) => ({ value: org.id, label: org.name }));
  }, [organizations]);

  const { data: dataRoles } = useRoles();

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

  // Map roles: if not superadmin, filter out SuperAdmin (index 0) and start values from 1
  const dropdownRoles = useMemo(() => {
    if (!dataRoles) return undefined;
    if (isSuperAdmin) {
      // SuperAdmin sees all roles with 0-based indexing
      return dataRoles.map((role, index) => ({ value: index, text: role }));
    } else {
      // Non-superadmin: skip SuperAdmin role (index 0), values start from 1
      return dataRoles
        .slice(1)
        .map((role, index) => ({ value: index + 1, text: role }));
    }
  }, [dataRoles, isSuperAdmin]);

  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: dataUsers, isLoading } = useUserList({ companyId: selectedCompanyId });
  if (isLoading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Users</h1>
        <div className="flex gap-4 items-center">
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
            onClick={() => navigate("/users/create-bulk")}
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
            {dataUsers?.map((user) => {
              const role = dropdownRoles?.find((r) => r.value === user.role);
       
              return (
                <TableRow key={user.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
                        {user.profilePicture ? (
                          <img
                            width={40}
                            height={40}
                            src={user.profilePicture}
                            alt={user.fullName}
                          />
                        ) : (
                          <span className="text-gray-400 text-lg font-bold">
                            {user.fullName?.[0] || "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
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
                        onClick={async () => {
                          if (!window.confirm("Are you sure you want to delete this user?")) return;
                          setDeletingId(user.id);
                          try {
                            await deleteSingleUser.mutateAsync({ userId: user.id });
                          } catch (err: unknown) {
                            if (err && typeof err === "object" && "message" in err) {
                              setError((err as { message?: string }).message || "Failed to delete user");
                            } else {
                              setError("Failed to delete user");
                            }
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                      >
                        {deletingId === user.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
