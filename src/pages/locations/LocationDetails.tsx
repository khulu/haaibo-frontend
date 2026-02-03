import { useEffect, useState, useRef } from 'react';
import { resolveImageSrc } from '../../utils/resolveImageSrc';
import { useParams, useNavigate } from 'react-router-dom';
import useLocationsApi, { LocationDto, FloorplanMarker } from '../../hooks/api/useLocationsApi';
import ComponentCard from '../../components/common/ComponentCard';
import Label from '../../components/form/Label';
import Badge from '../../components/ui/badge/Badge';
import Input from '../../components/form/input/InputField';
import Switch from '../../components/form/switch/Switch';

type MarkerFormData = {
  name: string;
  type: 0 | 1;
  description: string;
  active: boolean;
};

export default function LocationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSingle, getMarkers, createMarker, updateMarker, deleteMarker } = useLocationsApi();
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [markers, setMarkers] = useState<FloorplanMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showMarkerModal, setShowMarkerModal] = useState(false);
  const [editingMarker, setEditingMarker] = useState<FloorplanMarker | null>(null);
  const [markerFormData, setMarkerFormData] = useState<MarkerFormData>({
    name: '',
    type: 0,
    description: '',
    active: true,
  });
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggedMarker, setDraggedMarker] = useState<FloorplanMarker | null>(null);
  const floorplanRef = useRef<HTMLDivElement>(null);

  const extractErrorMessage = (err: unknown, fallback: string) => {
    let message = fallback;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const e = err as { message?: string; response?: { data?: unknown } };
      if (e.message) message = e.message;
      const data = e.response?.data;
      if (typeof data === 'string') {
        message = data;
      } else if (data && typeof data === 'object') {
        const d = data as { title?: string; detail?: string; message?: string };
        message = d.title || d.detail || d.message || message;
      }
    }
    return message;
  };

  // Using shared resolver for image URLs

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [locationData, markersData] = await Promise.all([
          getSingle(id),
          getMarkers(id),
        ]);
        setLocation(locationData);
        setMarkers(markersData);
      } catch (err) {
        setError('Failed to load location details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFloorplanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!floorplanRef.current || !location?.floorplanPath) return;
    const rect = floorplanRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPosition({ x, y });
    setEditingMarker(null);
    setMarkerFormData({ name: '', type: 0, description: '', active: true });
    setShowMarkerModal(true);
  };

  const handleMarkerClick = (marker: FloorplanMarker, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMarker(marker);
    setMarkerFormData({
      name: marker.name,
      type: marker.type,
      description: marker.description || '',
      active: marker.active,
    });
    setPendingPosition(null);
    setShowMarkerModal(true);
  };

  const handleMarkerDragStart = (marker: FloorplanMarker, e: React.DragEvent) => {
    setDraggedMarker(marker);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMarkerDragEnd = async (e: React.DragEvent) => {
    if (!draggedMarker || !floorplanRef.current) return;
    const rect = floorplanRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    try {
      const updated = await updateMarker(draggedMarker.id, { xPosition: x, yPosition: y });
      setMarkers(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch (err) {
      console.error('Failed to update marker position:', err);
      alert('Failed to update marker position');
    } finally {
      setDraggedMarker(null);
    }
  };

  const handleSaveMarker = async () => {
    if (!id) return;
    try {
      if (editingMarker) {
        const updated = await updateMarker(editingMarker.id, {
          name: markerFormData.name,
          type: markerFormData.type,
          description: markerFormData.description || null,
          active: markerFormData.active,
        });
        setMarkers(prev => prev.map(m => m.id === updated.id ? updated : m));
      } else if (pendingPosition) {
        const created = await createMarker({
          name: markerFormData.name,
          type: markerFormData.type,
          xPosition: pendingPosition.x,
          yPosition: pendingPosition.y,
          description: markerFormData.description || null,
          active: markerFormData.active,
          locationId: id,
        });
        setMarkers(prev => [...prev, created]);
      }
      setShowMarkerModal(false);
      setSaveError(null);
    } catch (err) {
      console.error('Failed to save marker:', err);
      setSaveError(extractErrorMessage(err, 'Failed to save marker'));
    }
  };

  const handleDeleteMarker = async () => {
    if (!editingMarker) return;
    if (!confirm('Are you sure you want to delete this marker?')) return;
    try {
      await deleteMarker(editingMarker.id);
      setMarkers(prev => prev.filter(m => m.id !== editingMarker.id));
      setShowMarkerModal(false);
      setSaveError(null);
    } catch (err) {
      console.error('Failed to delete marker:', err);
      setSaveError(extractErrorMessage(err, 'Failed to delete marker'));
    }
  };

  if (loading) return <div className="p-6">Loading location...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!location) return <div className="p-6">Location not found</div>;

  return (
    <div className="space-y-6">
      <ComponentCard title="Location Details">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{location.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              {location.active !== false ? (
                <Badge color="success" size="sm">Active</Badge>
              ) : (
                <Badge color="warning" size="sm">Inactive</Badge>
              )}
              {location.allowColleagueSearch && (
                <Badge color="info" size="sm">Colleague Search Enabled</Badge>
              )}
            </div>
          </div>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={() => navigate('/locations')}
          >
            Back to Locations
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Name</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
              {location.name}
            </p>
          </div>

          {location.color && (
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block w-6 h-6 rounded border border-gray-200" style={{ background: location.color }} />
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">{location.color}</span>
              </div>
            </div>
          )}

          <div>
            <Label>Status</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
              {location.active !== false ? 'Active' : 'Inactive'}
            </p>
          </div>

          <div>
            <Label>Colleague Search</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
              {location.allowColleagueSearch ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          <div>
            <Label>Created At</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
              {new Date(location.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <Label>Updated At</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
              {new Date(location.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {location.floorplanPath && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <Label>Floorplan (Click to add markers)</Label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {markers.length} marker{markers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="mt-2 mb-2 flex gap-4 items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">🪑</span>
                Desk
              </span>
              <span className="flex items-center gap-1">
                <span className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">👥</span>
                Meeting Room
              </span>
            </div>
            <div 
              ref={floorplanRef}
              className="relative border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50 cursor-crosshair"
              style={{ minHeight: '600px' }}
              onClick={handleFloorplanClick}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleMarkerDragEnd}
            >
              <img 
                src={resolveImageSrc(location.floorplanPath)} 
                alt="Floorplan"
                className="w-full h-auto select-none"
                draggable={false}
              />
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  draggable
                  onDragStart={(e) => handleMarkerDragStart(marker, e)}
                  onClick={(e) => handleMarkerClick(marker, e)}
                  className={`absolute cursor-move transform -translate-x-1/2 -translate-y-1/2 ${
                    marker.active ? 'opacity-100' : 'opacity-40'
                  }`}
                  style={{
                    left: `${marker.xPosition}%`,
                    top: `${marker.yPosition}%`,
                  }}
                  title={marker.name}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${
                    marker.type === 0 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}>
                    {marker.type === 0 ? '🪑' : '👥'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {location.children && location.children.length > 0 && (
          <div className="mt-8">
            <Label>Child Locations ({location.children.length})</Label>
            <div className="mt-3 space-y-2">
              {location.children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-white/90">{child.name}</span>
                    {child.color && (
                      <span className="inline-block w-3 h-3 rounded" style={{ background: child.color }} />
                    )}
                    {child.active === false && (
                      <span className="text-xs text-red-500">(Inactive)</span>
                    )}
                  </div>
                  <button
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => navigate(`/locations/${child.id}`)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </ComponentCard>

      {showMarkerModal && (
        <div className="modal fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto p-5">
          <div className="modal-close-btn fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] dark:bg-gray-900/70" onClick={() => setShowMarkerModal(false)}></div>
          <div className="relative w-full max-w-[600px] rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900">
            {/* close btn */}
            <button
              onClick={() => setShowMarkerModal(false)}
              className="absolute top-3 right-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 sm:top-6 sm:right-6 sm:h-11 sm:w-11 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z" fill=""></path>
              </svg>
            </button>

            <div>
              <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
                {editingMarker ? 'Edit Marker' : 'Add Marker'}
              </h4>
              <p className="mb-7 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {editingMarker 
                  ? 'Update marker details or drag the marker on the floorplan to reposition it.'
                  : 'Add a new marker to the floorplan. Click on the floorplan to place it at the desired location.'}
              </p>
              {saveError && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/10 dark:text-red-300">
                  {saveError}
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handleSaveMarker(); }} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Name *
                  </label>
                  <Input
                    value={markerFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarkerFormData({ ...markerFormData, name: e.target.value })}
                    placeholder="Enter marker name"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Type
                  </label>
                  <select
                    value={markerFormData.type}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMarkerFormData({ ...markerFormData, type: Number(e.target.value) as 0 | 1 })}
                    className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  >
                    <option value={0}>🪑 Desk</option>
                    <option value={1}>👥 Meeting Room</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Description
                  </label>
                  <textarea
                    value={markerFormData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMarkerFormData({ ...markerFormData, description: e.target.value })}
                    placeholder="Additional details..."
                    className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    rows={3}
                  />
                </div>

                <Switch
                  label="Active"
                  defaultChecked={markerFormData.active}
                  onChange={(checked: boolean) => setMarkerFormData({ ...markerFormData, active: checked })}
                />

                <div className="flex w-full items-center justify-between gap-3 mt-8">
                  {editingMarker && (
                    <button
                      type="button"
                      onClick={handleDeleteMarker}
                      className="shadow-theme-xs flex w-full justify-center rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/10 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMarkerModal(false)}
                    className="shadow-theme-xs flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!markerFormData.name.trim()}
                    className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 flex w-full justify-center rounded-lg px-4 py-3 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingMarker ? 'Update Marker' : 'Add Marker'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
