export interface FloorplanMarker {
  id: string;
  resourceId: string;
  // 0 = Desk, 1 = Meeting Room
  type?: 0 | 1;
  name?: string;
  email?: string;
  capacity?: number;
  features?: string;
  status?: string;
  floorId?: string;
  floorName?: string;
  x?: number; // normalized 0..1 or pixel depending on backend
  y?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnplottedResponse {
  total: number;
  items: FloorplanMarker[];
}

// no default export (types only)
