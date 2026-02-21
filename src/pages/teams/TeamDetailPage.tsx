import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import getCompanyId from '@hooks/api/useAuthApi';
import useTeamsApi, { UpdateTeamDto } from '@hooks/api/useTeamsApi';
import useUserApi from '@hooks/api/useUserApi';
import ComponentCard from '../../components/common/ComponentCard';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = getCompanyId();
  const companyId = auth.getCompanyId?.();
  const queryClient = useQueryClient();

  const { getById, update, addMembers, removeMember } = useTeamsApi();
  const { getUsers } = useUserApi();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  const { data: team, isLoading, isError } = useQuery({
    queryKey: ['team', id],
    queryFn: () => getById(id!),
    enabled: !!id,
  });

  const { data: companyUsers = [] } = useQuery({
    queryKey: ['users', companyId],
    queryFn: () => getUsers(companyId),
    enabled: !!companyId && showAddMembers,
  });

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateTeamDto) => update(id!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      setIsEditing(false);
    },
  });

  const addMembersMutation = useMutation({
    mutationFn: (userIds: string[]) => addMembers(id!, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      setShowAddMembers(false);
      setSelectedUsers([]);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      setRemoveConfirm(null);
    },
  });

  const handleEdit = () => {
    if (team) {
      setEditForm({ name: team.name, description: team.description || '' });
      setIsEditing(true);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: editForm.name || undefined,
      description: editForm.description || undefined,
    });
  };

  const handleAddMembers = () => {
    if (selectedUsers.length > 0) {
      addMembersMutation.mutate(selectedUsers);
    }
  };

  const handleRemoveMember = (userId: string) => {
    if (removeConfirm === userId) {
      removeMemberMutation.mutate(userId);
    } else {
      setRemoveConfirm(userId);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Filter out users already in the team
  const availableUsers = companyUsers.filter(
    (user) => !team?.members.some((member) => member.userId === user.id)
  );

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError || !team) return <div className="p-6 text-red-500">Failed to load team</div>;

  return (
    <div className="space-y-6">
      <ComponentCard title="Team Details">
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Name</div>
              <div className="text-base text-gray-800 dark:text-white/90">{team.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Description</div>
              <div className="text-base text-gray-800 dark:text-white/90">{team.description || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Company</div>
              <div className="text-base text-gray-800 dark:text-white/90">{team.companyName || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Created</div>
              <div className="text-base text-gray-800 dark:text-white/90">
                {team.createdAt ? new Date(team.createdAt).toLocaleString() : '-'}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleEdit}
              >
                Edit
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={() => navigate('/teams')}
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label>Team Name *</Label>
              <Input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 h-24 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </ComponentCard>

      <ComponentCard title={`Team Members (${team.members?.length || 0})`}>
        <div className="mb-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowAddMembers(true)}
          >
            Add Members
          </button>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Full Name
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Email
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Department
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Joined
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {team.members?.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                    No members in this team
                  </TableCell>
                  <TableCell><span /></TableCell>
                  <TableCell><span /></TableCell>
                  <TableCell><span /></TableCell>
                  <TableCell><span /></TableCell>
                </TableRow>
              ) : (
                team.members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="px-5 py-4 text-start text-gray-800 text-theme-sm dark:text-white/90">
                      {member.fullName}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                      {member.email}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                      {member.department || '-'}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                      <div className="flex gap-2">
                        <button
                          className={`px-2 py-1 rounded text-white ${
                            removeConfirm === member.userId
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-red-500 hover:bg-red-600'
                          }`}
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          {removeConfirm === member.userId ? 'Confirm?' : 'Remove'}
                        </button>
                        {removeConfirm === member.userId && (
                          <button
                            className="px-2 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                            onClick={() => setRemoveConfirm(null)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {/* Add Members Modal */}
      {showAddMembers && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAddMembers(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add Members</h2>

            {availableUsers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No available users to add. All company users are already members.
              </p>
            ) : (
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {availableUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-white">{user.fullName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                      {user.department && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">{user.department}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedUsers([]);
                }}
              >
                Cancel
              </button>
              <Button
                onClick={handleAddMembers}
                disabled={selectedUsers.length === 0 || addMembersMutation.isPending}
              >
                {addMembersMutation.isPending
                  ? 'Adding...'
                  : `Add ${selectedUsers.length} Member${selectedUsers.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
