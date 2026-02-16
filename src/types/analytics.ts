export interface HeatmapBucket {
  day: number; // 0=Sun..6=Sat
  hour: number; // 0..23
  count: number;
}

export interface HeatmapResponse {
  from: string; // ISO date (YYYY-MM-DD or ISO string)
  to: string;   // ISO date
  totalReservations: number;
  matrix: number[][]; // 7 arrays, each length 24
  buckets: HeatmapBucket[];
  peak: HeatmapBucket;
}
