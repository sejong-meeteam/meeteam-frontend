import { afterEach, describe, expect, it, vi } from 'vitest';

import { loginMember } from '@/components/features/auth/loginApi';

const originalFetch = global.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

describe('loginMember', () => {
  it('returns existing member state when Sejong login succeeds for an existing member', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          isNewMember: false,
          code: null,
        },
      }),
    } as Response);

    await expect(
      loginMember({
        studentId: '21013220',
        password: 'password123',
      }),
    ).resolves.toEqual({ isNewMember: false, code: null });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/auth/login/sejong',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          studentId: '21013220',
          password: 'password123',
        }),
      }),
    );
  });

  it('returns the onboarding code and school-verified profile for a new member', async () => {
    const verifiedProfile = {
      studentId: '21013220',
      name: '테스트 학생',
      department: '테스트학과',
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          newMember: true,
          code: 'temp-code',
          verifiedProfile,
        },
      }),
    } as Response);

    await expect(
      loginMember({
        studentId: '21013220',
        password: 'password123',
      }),
    ).resolves.toEqual({
      isNewMember: true,
      code: 'temp-code',
      verifiedProfile,
    });
  });
});
