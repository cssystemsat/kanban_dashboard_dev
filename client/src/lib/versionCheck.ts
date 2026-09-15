export type VersionPromptState = {
  currentVersion: string | null;
  availableVersion: string | null;
  dismissedVersion: string | null;
  dismissedUntil: number;
  now: number;
};

export function shouldShowVersionPrompt({
  currentVersion,
  availableVersion,
  dismissedVersion,
  dismissedUntil,
  now,
}: VersionPromptState): boolean {
  if (!currentVersion || !availableVersion) return false;
  if (currentVersion === availableVersion) return false;
  if (dismissedVersion === availableVersion && dismissedUntil > now) {
    return false;
  }
  return true;
}
