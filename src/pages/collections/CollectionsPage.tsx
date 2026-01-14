import { useNavigate } from 'react-router-dom';
import getCompanyId from '@hooks/api/useAuthApi';
import useCollections from '@hooks/collections/useCollections';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';

export default function CollectionsPage() {
  const auth = getCompanyId();
  const companyId = auth.getCompanyId?.();
  const { useCollectionsList } = useCollections();
  const { data, isLoading, isError } = useCollectionsList(companyId);
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Collections</h1>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => navigate('/collections/create')}>
            Create Collection
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Description</TableCell>
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
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-red-500">Failed to load collections</TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
              </TableRow>
            ) : (data ?? []).length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">No collections found</TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
                <TableCell><span /></TableCell>
              </TableRow>
            ) : (
              (data ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start font-medium text-gray-800 text-theme-sm dark:text-white/90">{c.name}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">{c.description || '-'}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={() => navigate(`/collections/edit/${c.id}`)}>Edit</button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
