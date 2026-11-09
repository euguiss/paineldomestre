import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import type { ConditionOptions } from '@/components/forms/ConditionEditor';

/** Live entity lists used to populate the activation-condition editor selects. */
export function useConditionOptions(): ConditionOptions {
  const plots = useLiveData(() => db.plots.toArray(), []) ?? [];
  const clues = useLiveData(() => db.clues.toArray(), []) ?? [];
  const npcs = useLiveData(() => db.npcs.toArray(), []) ?? [];
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];
  return { plots, clues, npcs, locations };
}
