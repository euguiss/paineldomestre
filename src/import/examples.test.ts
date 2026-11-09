import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseImportPackage } from './packageSchema';

function load(name: string): unknown {
  // vitest runs with cwd at the project root.
  const path = join(process.cwd(), 'exemplos', name);
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('example packages validate against the schema', () => {
  it('pacote-cidade.json is a valid city package', () => {
    const r = parseImportPackage(load('pacote-cidade.json'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.pkg.mode).toBe('cidade');
  });

  it('pacote-cenario.json is a valid scenario package', () => {
    const r = parseImportPackage(load('pacote-cenario.json'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.pkg.mode).toBe('cenario');
  });
});
