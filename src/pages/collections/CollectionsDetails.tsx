import { useNavigate, useParams } from 'react-router-dom';
import useCollections from '@hooks/collections/useCollections';
import ComponentCard from '../../components/common/ComponentCard';

export default function CollectionsDetails() {
  const { id } = useParams<{ id: string }>();
  const { useFetchCollectionById } = useCollections();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useFetchCollectionById(id || '');

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError || !data) return <div className="p-6 text-red-500">Failed to load collection</div>;

  return (
    <ComponentCard title="Collection Details">
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500">Name</div>
          <div className="text-base">{data.name}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Description</div>
          <div className="text-base">{data.description || '-'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Created</div>
          <div className="text-base">{data.createdAt ? new Date(data.createdAt).toLocaleString() : '-'}</div>
        </div>
        <div className="flex gap-3 pt-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => navigate(`/collections/edit/${data.id}`)}>Edit</button>
          <button className="px-4 py-2 bg-gray-300 text-gray-800 rounded" onClick={() => navigate('/collections')}>Back</button>
        </div>
      </div>
    </ComponentCard>
  );
}
