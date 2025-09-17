import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@hooks/user/useUser";
import getCompanyId from "@hooks/api/useAuthApi";

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

  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: dataUsers, isLoading } = useUserList({companyId: companyId});
  const { data: dataRoles } = useRoles();
  const dropdownRoles = dataRoles?.map((role, index) => ({ value: index, text: role }));

  if (isLoading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Users</h1>
        <div className="flex gap-4">
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
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Company</TableCell>
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
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {user.companyName || "-"}
                  </TableCell>
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
