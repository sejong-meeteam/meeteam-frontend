const DRAFT_KEY_PREFIX = 'meeteam:project-application-draft';

export type ApplicationDraftKey = {
  projectId: string;
  jobPositionCode: string;
};

function toStorageKey({ projectId, jobPositionCode }: ApplicationDraftKey) {
  return `${DRAFT_KEY_PREFIX}:${projectId}:${jobPositionCode}`;
}

// sessionStorage throws when blocked, in private mode, or when full; losing a draft must never break the form.
function withStorage<T>(run: (storage: Storage) => T, fallback: T): T {
  try {
    return typeof sessionStorage === 'undefined' ? fallback : run(sessionStorage);
  } catch {
    return fallback;
  }
}

export function readApplicationDraft(key: ApplicationDraftKey): string {
  return withStorage((storage) => storage.getItem(toStorageKey(key)) ?? '', '');
}

export function saveApplicationDraft(key: ApplicationDraftKey, message: string) {
  withStorage((storage) => {
    if (message.trim()) {
      storage.setItem(toStorageKey(key), message);
    } else {
      storage.removeItem(toStorageKey(key));
    }
  }, undefined);
}

export function clearApplicationDraft(key: ApplicationDraftKey) {
  saveApplicationDraft(key, '');
}
