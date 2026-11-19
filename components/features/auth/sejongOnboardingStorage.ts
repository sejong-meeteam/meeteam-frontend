import { z } from 'zod';
import type { VerifiedSchoolProfile } from '@/types/auth';
import { verifiedSchoolProfileSchema } from './schema';

const STORAGE_KEY = 'meeteam-sejong-onboarding';
const LEGACY_STORAGE_KEY = 'meeteam-sejong-onboarding-code';
const CODE_TTL_MS = 10 * 60 * 1000;

export const SEJONG_RELOGIN_MESSAGE =
  '학교 확인 정보가 없거나 만료되었습니다. 세종대 포털로 다시 로그인해 주세요.';

const onboardingSessionSchema = z.object({
  code: z.string().min(1),
  verifiedProfile: verifiedSchoolProfileSchema,
  expiresAt: z.number().int(),
});

export type SejongOnboarding = z.infer<typeof onboardingSessionSchema>;

export function saveSejongOnboarding(code: string, verifiedProfile: VerifiedSchoolProfile) {
  const session = { code, verifiedProfile, expiresAt: Date.now() + CODE_TTL_MS };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function readSejongOnboarding(): SejongOnboarding | null {
  window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const session = onboardingSessionSchema.safeParse(JSON.parse(stored));
    if (session.success && session.data.expiresAt > Date.now()) return session.data;
  } catch {
    // A malformed record must be replaced by a fresh school login.
  }

  clearSejongOnboarding();
  return null;
}

export function clearSejongOnboarding() {
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
}
