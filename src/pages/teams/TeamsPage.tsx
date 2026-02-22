import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import getCompanyId from '@hooks/api/useAuthApi';
import useTeamsApi, { CreateTeamDto } from '@hooks/api/useTeamsApi';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';

export default function TeamsPage() {
  const auth = getCompanyId();
  const companyId = auth.getCompanyId?.();
  const { getAll, create, deleteTeam } = useTeamsApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const { data: teams, isLoading, isError } = useQuery({
    queryKey: ['teams', companyId],
    queryFn: () => getAll(companyId),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateTeamDto) => create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowModal(false);
      setFormData({ name: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setDeleteConfirm(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !formData.name.trim()) return;
    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      companyId,
    });
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteMutation.mutate(id);
    } else {
      setDeleteConfirm(id);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Teams</h1>
        <div className="flex gap-4">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowModal(true)}
          >
            New Team
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Description</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Members</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {isLoading ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">Loading...</TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-red-500">Failed to load teams</TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
              </TableRow>
            ) : (teams ?? []).length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">No teams found</TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
              </TableRow>
            ) : (
              (teams ?? []).map((team) => (
                <TableRow 
                  key={team.id}
                >
                  <TableCell className="px-5 py-4 sm:px-6 text-start font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {team.name}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                    {team.description || '-'}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                    {team.memberCount || 0}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                    {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex gap-2">
                      <button 
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => navigate(`/teams/${team.id}`)}
                      >
                        View
                      </button>
                      <button 
                        className={`px-2 py-1 rounded text-white ${
                          deleteConfirm === team.id 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                        onClick={() => handleDelete(team.id)}
                      >
                        {deleteConfirm === team.id ? 'Confirm?' : 'Delete'}
                      </button>
                      {deleteConfirm === team.id && (
                        <button
                          className="px-2 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                          onClick={() => setDeleteConfirm(null)}
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

      {/* Create Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">New Team</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Team Name *</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 h-24 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter team description"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
