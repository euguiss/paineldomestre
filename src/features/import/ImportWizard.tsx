import { useMemo, useRef, useState } from 'react';
import { Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { Button } from '@/components/ui';
import { parseImportPackage, type ImportPackage, type ScenarioPackage } from '@/import/packageSchema';
import { previewCityImport, applyCityImport, applyScenarioImport, type CityImportPreview, type ReconcileDecision } from '@/import/applyBatch';
import { ReconcileReview, collectRefs } from './ReconcileReview';

type Stage = 'input' | 'preview-city' | 'reconcile-scenario';

/** Import flow: paste/upload -> validate -> preview/reconcile -> apply. */
export function ImportWizard() {
  const maps = useLiveData(() => db.maps.toArray(), []) ?? [];
  const fileInput = useRef<HTMLInputElement>(null);

  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pkg, setPkg] = useState<ImportPackage | null>(null);
  const [stage, setStage] = useState<Stage>('input');
  const [cityPreview, setCityPreview] = useState<CityImportPreview | null>(null);
  const [mapId, setMapId] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const scenarioRefs = useMemo(
    () => (pkg && pkg.mode === 'cenario' ? collectRefs(pkg) : null),
    [pkg],
  );

  async function validate() {
    setError(null);
    setResult(null);
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      setError('JSON inválido: verifique o texto colado.');
      return;
    }
    const parsed = parseImportPackage(json);
    if (!parsed.ok) {
      setError(`Pacote inválido — ${parsed.error}`);
      return;
    }
    setPkg(parsed.pkg);
    if (parsed.pkg.mode === 'cidade') {
      const preview = await previewCityImport(parsed.pkg);
      setCityPreview(preview);
      setMapId(maps[0]?.id ?? '');
      setStage('preview-city');
    } else {
      setStage('reconcile-scenario');
    }
  }

  async function applyCity() {
    if (!pkg || pkg.mode !== 'cidade') return;
    if (!mapId) { setError('Escolha um mapa para os locais importados.'); return; }
    const batch = await applyCityImport(pkg, mapId);
    setResult(`Lote "${batch.label}" aplicado: ${cityPreview?.toCreate ?? 0} criados, ${cityPreview?.toUpdate ?? 0} atualizados. Locais entraram "sem pino" — arraste-os da lista para o mapa.`);
    reset();
  }

  async function applyScenario(decisions: Map<string, ReconcileDecision>) {
    if (!pkg || pkg.mode !== 'cenario') return;
    const batch = await applyScenarioImport(pkg as ScenarioPackage, decisions);
    setResult(`Cenário "${batch.label}" importado. Nada foi aplicado sem sua confirmação.`);
    reset();
  }

  function reset() {
    setPkg(null);
    setStage('input');
    setCityPreview(null);
    setRaw('');
  }

  return (
    <div className="space-y-4 p-4">
      {result && (
        <div className="flex items-start gap-2 rounded border border-accent/40 bg-accent/10 p-3 text-sm text-accent">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {result}
        </div>
      )}

      {stage === 'input' && (
        <>
          <p className="text-sm text-muted">Cole um Pacote de Importação (JSON) ou carregue um arquivo <code>.json</code>.</p>
          <textarea
            className="h-48 w-full rounded border border-border bg-surface-2 p-2 font-mono text-xs"
            placeholder='{ "schemaVersion": 1, "mode": "cidade", ... }'
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="accent" onClick={validate}>Validar e pré-visualizar</Button>
            <Button onClick={() => fileInput.current?.click()}><Upload size={14} className="mr-1 inline" /> Carregar arquivo</Button>
            <input ref={fileInput} type="file" accept="application/json,.json,.txt" className="hidden"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) setRaw(await f.text()); e.target.value = ''; }} />
          </div>
          {error && <div className="flex items-start gap-2 rounded border border-secret/40 bg-secret/10 p-2 text-sm text-secret"><AlertTriangle size={15} className="mt-0.5 shrink-0" /> {error}</div>}
        </>
      )}

      {stage === 'preview-city' && cityPreview && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg">Pré-visualização (Cidade)</h3>
          <p className="text-sm">Será criado: <strong className="text-accent">{cityPreview.toCreate}</strong> · atualizado: <strong className="text-accent">{cityPreview.toUpdate}</strong></p>
          <label className="block text-sm">
            Mapa para os locais importados:
            <select className="ml-2 rounded border border-border bg-surface-2 px-2 py-1" value={mapId} onChange={(e) => setMapId(e.target.value)}>
              {maps.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
          </label>
          <div className="max-h-64 overflow-y-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase text-muted"><tr><th className="px-3 py-1">Tipo</th><th className="px-3 py-1">Nome</th><th className="px-3 py-1">Ação</th></tr></thead>
              <tbody>
                {cityPreview.items.map((it) => (
                  <tr key={it.externalKey} className="border-t border-border">
                    <td className="px-3 py-1">{it.kind}</td>
                    <td className="px-3 py-1">{it.name}</td>
                    <td className="px-3 py-1"><span className={it.action === 'criar' ? 'text-accent' : 'text-muted'}>{it.action}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button onClick={reset}>Cancelar</Button>
            <Button variant="accent" onClick={applyCity}>Aplicar lote</Button>
          </div>
          {error && <p className="text-sm text-secret">{error}</p>}
        </div>
      )}

      {stage === 'reconcile-scenario' && pkg && pkg.mode === 'cenario' && scenarioRefs && (
        <ReconcileReview pkg={pkg} refs={scenarioRefs} onCancel={reset} onApply={applyScenario} />
      )}
    </div>
  );
}
