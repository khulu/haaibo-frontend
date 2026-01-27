import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, ImageOverlay, useMap } from 'react-leaflet';
import { CRS, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useLocationsApi, { LocationDto } from '../../hooks/api/useLocationsApi';
import ComponentCard from '../../components/common/ComponentCard';
import Label from '../../components/form/Label';
import Badge from '../../components/ui/badge/Badge';

// Helper component to fit bounds after map loads
function FitBounds({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);
  return null;
}

export default function LocationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSingle } = useLocationsApi();
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getSingle(id);
        setLocation(data);
      } catch (err) {
        setError('Failed to load location details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, getSingle]);

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
            <Label>Floorplan</Label>
            <div className="mt-3 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50">
              <MapContainer
                center={[0, 0]}
                zoom={1}
                crs={CRS.Simple}
                style={{ height: '600px', width: '100%', background: '#f9fafb' }}
                className="dark:bg-gray-900"
              >
                <ImageOverlay
                  url={location.floorplanPath}
                  bounds={[
                    [0, 0],
                    [1000, 1000],
                  ]}
                />
                <FitBounds
                  bounds={new LatLngBounds([0, 0], [1000, 1000])}
                />
              </MapContainer>
            </div>
            <div className="mt-2 flex gap-2">
              <a
                href={location.floorplanPath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                Open in new tab
              </a>
              <a
                href={location.floorplanPath}
                download
                className="text-sm text-blue-500 hover:underline"
              >
                Download
              </a>
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
    </div>
  );
}
