export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date("2026-08-01T00:00:00.000Z");
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

export function sortByOccurredAtDesc<T extends { occurredAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
