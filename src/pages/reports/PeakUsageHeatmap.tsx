import { useEffect, useMemo, useState, useCallback } from 'react';
import ComponentCard from '../../components/common/ComponentCard';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import useAnalyticsApi from '../../hooks/api/useAnalyticsApi';
import getAuth from '../../hooks/api/useAuthApi';
import type { HeatmapResponse } from '../../types/analytics';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PeakUsageHeatmap() {
  const auth = getAuth();
  const defaultCompanyId = auth.getCompanyId() || '';
  const [companyId, setCompanyId] = useState<string>(defaultCompanyId);
  const [allCompanies, setAllCompanies] = useState<boolean>(!defaultCompanyId);

  const defaultTo = new Date();
  const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [from, setFrom] = useState<string>(defaultFrom.toISOString().slice(0, 10));
  const [to, setTo] = useState<string>(defaultTo.toISOString().slice(0, 10));
  const [normalize, setNormalize] = useState<boolean>(false);

  const { getHeatmap } = useAnalyticsApi();
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getHeatmap({
        companyId: allCompanies ? undefined : (companyId || undefined),
        from,
        to,
        normalize,
      });
      setData(res);
    } catch (e: unknown) {
      const msg = typeof e === 'object' && e && 'message' in e ? (e as { message?: string }).message : undefined;
      setError(msg || 'Failed to load heatmap');
    } finally {
      setLoading(false);
    }
  }, [getHeatmap, allCompanies, companyId, from, to, normalize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const peakCount = useMemo(() => {
    if (!data) return 0;
    if (normalize) return 1; // normalized is 0..1
    return data.peak?.count ?? 0;
  }, [data, normalize]);

  const scaleColor = (value: number) => {
    // value in 0..1 if normalized, otherwise 0..peakCount
    const intensity = normalize
      ? value
      : (peakCount > 0 ? value / peakCount : 0);
    // Map to a blue scale
    const alpha = Math.min(1, Math.max(0.08, intensity));
    return `rgba(37, 99, 235, ${alpha})`; // Tailwind brand-ish blue
  };

  return (
    <div className="space-y-6">
      <ComponentCard title="Peak Usage Heatmap">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label>Company</Label>
            <div className="flex items-center gap-2">
              <Input
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={allCompanies}
                placeholder="CompanyId (GUID)"
              />
              <label className="text-xs flex items-center gap-1">
                <input type="checkbox" checked={allCompanies} onChange={(e) => setAllCompanies(e.target.checked)} />
                All companies
              </label>
            </div>
          </div>
          <div>
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <Label>Options</Label>
            <div className="flex items-center gap-2">
              <label className="text-xs flex items-center gap-1">
                <input type="checkbox" checked={normalize} onChange={(e) => setNormalize(e.target.checked)} />
                Normalize 0..1
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <Button onClick={fetchData} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</Button>
        </div>

        {error && (
          <div className="mb-3 p-3 border rounded text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[80px_1fr] gap-3">
              {/* Row labels */}
              <div className="flex flex-col gap-2">
                {dayLabels.map((d) => (
                  <div key={d} className="h-8 flex items-center text-xs text-gray-600">{d}</div>
                ))}
              </div>
              {/* Heatmap grid */}
              <div className="flex flex-col gap-2">
                {/* Column headers */}
                <div className="grid grid-cols-24 gap-1">
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="text-[10px] text-gray-500 text-center">{h}</div>
                  ))}
                </div>
                {/* Rows */}
                {Array.from({ length: 7 }).map((_, day) => (
                  <div key={day} className="grid grid-cols-24 gap-1">
                    {Array.from({ length: 24 }).map((_, hour) => {
                      const value = data?.matrix?.[day]?.[hour] ?? 0;
                      const color = scaleColor(value);
                      const percent = normalize
                        ? Math.round((value) * 100)
                        : (peakCount > 0 ? Math.round((value / peakCount) * 100) : 0);
                      const title = `${dayLabels[day]} ${hour}:00\nCount: ${value}\nIntensity: ${percent}%`;
                      return (
                        <div
                          key={hour}
                          title={title}
                          className="h-8 rounded"
                          style={{ backgroundColor: color }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
}
