import { z } from 'zod';

/**
 * Import Package schema (section 6.1), validated with zod.
 *
 * References between entities go BY NAME/KEY, never by internal id, so
 * re-importing updates (idempotent via `externalKey`) instead of duplicating.
 * Documented in docs/import-schema.md.
 */

export const IMPORT_SCHEMA_VERSION = 1;

const sourceSchema = z
  .object({
    label: z.string(),
    pageRef: z.string().optional(),
  })
  .optional();

const readAloudSchema = z
  .object({
    primeiraVisita: z.string().optional(),
    retorno: z.string().optional(),
    dia: z.string().optional(),
    noite: z.string().optional(),
    chuva: z.string().optional(),
    generico: z.string().optional(),
  })
  .optional();

/** City mode entities. */
export const cityLocationSchema = z.object({
  externalKey: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  kind: z.string().optional(),
  district: z.string().optional(),
  baseDescription: z.string().optional(),
  readAloud: readAloudSchema,
  sensoryDetails: z.array(z.string()).optional(),
  /** Marks AI-generated texts, e.g. ['readAloud']. */
  geradoPorIA: z.array(z.string()).optional(),
  /** Pending items not provided by the source. */
  pending: z.array(z.string()).optional(),
  source: sourceSchema,
});

export const cityNpcSchema = z.object({
  externalKey: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  appearance: z.string().optional(),
  voiceAndMannerisms: z.string().optional(),
  statBlockMarkdown: z.string().optional(),
  geradoPorIA: z.array(z.string()).optional(),
  pending: z.array(z.string()).optional(),
  source: sourceSchema,
});

export const cityFactionSchema = z.object({
  externalKey: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  goals: z.string().optional(),
  resources: z.string().optional(),
  source: sourceSchema,
});

export const cityPackageSchema = z.object({
  schemaVersion: z.literal(IMPORT_SCHEMA_VERSION),
  mode: z.literal('cidade'),
  label: z.string().min(1),
  locations: z.array(cityLocationSchema).default([]),
  npcs: z.array(cityNpcSchema).default([]),
  factions: z.array(cityFactionSchema).default([]),
});

/** Scenario mode entities. References to city entities go by name/key. */
export const scenarioClueSchema = z.object({
  externalKey: z.string().min(1),
  text: z.string().min(1),
  /** Reference to a location by name or externalKey. */
  locationRef: z.string().optional(),
  npcRef: z.string().optional(),
  howToObtain: z.string().optional(),
  difficulty: z.enum(['Regular', 'Dificil', 'Extremo']).optional(),
  isBridge: z.boolean().optional(),
  revealsConclusion: z.string().optional(),
  inferido: z.boolean().optional(),
});

export const scenarioSceneSchema = z.object({
  externalKey: z.string().min(1),
  title: z.string().min(1),
  locationRef: z.string().optional(),
  trigger: z.string().optional(),
  openingText: z.string().optional(),
  whatHappens: z.string().optional(),
});

export const scenarioLayerSchema = z.object({
  locationRef: z.string().min(1),
  whatChanges: z.string(),
  readAloudAppend: z.string().optional(),
  readAloudOverride: z.string().optional(),
});

export const scenarioNpcLayerSchema = z.object({
  npcRef: z.string().min(1),
  knows: z.string().optional(),
  hides: z.string().optional(),
  revealsIfPressed: z.string().optional(),
});

export const scenarioPackageSchema = z.object({
  schemaVersion: z.literal(IMPORT_SCHEMA_VERSION),
  mode: z.literal('cenario'),
  label: z.string().min(1),
  plot: z.object({
    externalKey: z.string().min(1),
    name: z.string().min(1),
    sourceModule: z.string().optional(),
    hiddenTruth: z.string().optional(),
    antagonists: z.string().optional(),
    threatLevel: z.number().optional(),
    clockSegments: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(12)]).optional(),
    conclusions: z.array(z.object({ externalKey: z.string(), title: z.string(), description: z.string().optional() })).optional(),
  }),
  clues: z.array(scenarioClueSchema).default([]),
  scenes: z.array(scenarioSceneSchema).default([]),
  locationLayers: z.array(scenarioLayerSchema).default([]),
  npcLayers: z.array(scenarioNpcLayerSchema).default([]),
});

export const importPackageSchema = z.discriminatedUnion('mode', [cityPackageSchema, scenarioPackageSchema]);

export type CityPackage = z.infer<typeof cityPackageSchema>;
export type ScenarioPackage = z.infer<typeof scenarioPackageSchema>;
export type ImportPackage = z.infer<typeof importPackageSchema>;

/** Parse + validate unknown JSON, returning either data or a readable error. */
export function parseImportPackage(input: unknown): { ok: true; pkg: ImportPackage } | { ok: false; error: string } {
  const result = importPackageSchema.safeParse(input);
  if (result.success) return { ok: true, pkg: result.data };
  const first = result.error.issues[0];
  return { ok: false, error: `${first.path.join('.') || '(raiz)'}: ${first.message}` };
}
