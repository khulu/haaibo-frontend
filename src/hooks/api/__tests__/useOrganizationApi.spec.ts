import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as axiosModule from 'axios';

import useOrganizationsApi, { CreateOrganizationInput } from '../useOrganizationApi';

// Mock axios.create to intercept requests
const mockRequest = vi.fn();
vi.spyOn(axiosModule, 'default', 'get').mockReturnValue({} as any);
vi.spyOn(axiosModule, 'default', 'create').mockImplementation(() => mockRequest as any);

const originalEnv = { ...import.meta.env } as any;

describe('useOrganizationsApi', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    (import.meta as any).env = { ...originalEnv, VITE_API_BASE_URL: 'https://example.com' };
  });

  it('createOrganization sends reservation fields in POST /api/companies', async () => {
    const { createOrganization } = useOrganizationsApi();
    const payload: CreateOrganizationInput = {
      name: 'Acme Co',
      adminUserId: 'admin-123',
      enableOfficeReservations: true,
      reservationMenuLabel: 'Office Reservations',
      hotDeskLicences: 10,
    };

    mockRequest.mockResolvedValueOnce({ data: { id: 'c1', ...payload } });

    const result = await createOrganization(payload);

    expect(mockRequest).toHaveBeenCalledTimes(1);
    const arg = mockRequest.mock.calls[0][0];
    expect(arg.baseURL).toBe('https://example.com');
    expect(arg.url).toBe('/api/companies');
    expect(arg.method).toBe('POST');
    expect(arg.data).toEqual(payload);
    expect(result).toEqual({ id: 'c1', ...payload });
  });

  it('updateSettings PUTs partial payload to /api/companies/{id}/settings', async () => {
    const { updateSettings } = useOrganizationsApi();
    const id = 'c1';
    const partial = { enableOfficeReservations: false, hotDeskLicences: 0 };

    mockRequest.mockResolvedValueOnce({ data: { id, ...partial } });

    const result = await updateSettings(id, partial);

    expect(mockRequest).toHaveBeenCalledTimes(1);
    const arg = mockRequest.mock.calls[0][0];
    expect(arg.url).toBe(`/api/companies/${id}/settings`);
    expect(arg.method).toBe('PUT');
    expect(arg.data).toEqual(partial);
    expect(result).toEqual({ id, ...partial });
  });
});
