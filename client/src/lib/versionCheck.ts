export type VersionPromptState = {
  currentVersion: string | null;
  availableVersion: string | null;
  dismissedVersion: string | null;
  dismissedUntil: number;
  now: number;
};

function parseVersion(value: string): number[] | null {
  const match = value.trim().replace(/^v/i, "").match(/^\d+(?:\.\d+){0,2}$/);
  if (!match) return null;
  return match[0].split(".").map(Number);
}

export function compareSemanticVersions(left: string, right: string): number {
  const parsedLeft = parseVersion(left);
  const parsedRight = parseVersion(right);
  if (!parsedLeft || !parsedRight) return 0;
  for (let index = 0; index < 3; index += 1) {
    const leftPart = parsedLeft[index] ?? 0;
    const rightPart = parsedRight[index] ?? 0;
    if (leftPart !== rightPart) return leftPart > rightPart ? 1 : -1;
  }
  return 0;
}

export function shouldShowVersionPrompt({
  currentVersion,
  availableVersion,
  dismissedVersion,
  dismissedUntil,
  now,
}: VersionPromptState): boolean {
  if (!currentVersion || !availableVersion) return false;
  if (compareSemanticVersions(availableVersion, currentVersion) <= 0) return false;
  if (dismissedVersion === availableVersion && dismissedUntil > now) {
    return false;
  }
  return true;
}
