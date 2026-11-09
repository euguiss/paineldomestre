/** UUID + timestamp helpers used when creating records. */

export function newId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

/** Base fields for a brand-new entity. */
export function newBase(): {
  id: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  notes: string;
} {
  const ts = now();
  return { id: newId(), createdAt: ts, updatedAt: ts, tags: [], notes: '' };
}
