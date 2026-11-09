import { useRef } from 'react';
import { X, Trash2, ImagePlus, FileText } from 'lucide-react';
import type { ClueEntity, ClueStatus, CocDifficulty, HandoutEntity } from '@/db/schema';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { putBlob } from '@/db/blobs';
import { useBlobUrl } from '@/db/useBlobUrl';
import { useLiveData } from '@/db/useLiveData';
import { Field, TextInput, TextArea, Select, Button, IconButton, Chip } from '@/components/ui';

const STATUSES: ClueStatus[] = ['nao-descoberta', 'descoberta', 'perdida'];
const STATUS_LABEL: Record<ClueStatus, string> = { 'nao-descoberta': 'Não descoberta', descoberta: 'Descoberta', perdida: 'Perdida' };
const DIFFICULTIES: CocDifficulty[] = ['Regular', 'Dificil', 'Extremo'];

async function patch(id: string, changes: Partial<ClueEntity>) {
  await db.clues.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

export function ClueDetail({ clue, onClose, onDeleted }: { clue: ClueEntity; onClose: () => void; onDeleted: () => void }) {
  const plots = useLiveData(() => db.plots.toArray(), []) ?? [];
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];
  const npcs = useLiveData(() => db.npcs.toArray(), []) ?? [];
  const allHandouts = useLiveData(() => db.handouts.toArray(), []) ?? [];
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedPlot = plots.find((p) => clue.plotIds.includes(p.id));
  const conclusions = selectedPlot?.conclusions ?? plots.flatMap((p) => p.conclusions);
  const linkedHandouts = allHandouts.filter((h) => clue.handoutIds.includes(h.id));

  function togglePlot(id: string) {
    const plotIds = clue.plotIds.includes(id) ? clue.plotIds.filter((x) => x !== id) : [...clue.plotIds, id];
    void patch(clue.id, { plotIds, isBridge: plotIds.length >= 2 ? clue.isBridge : false });
  }

  /** Attach a new image handout created from an uploaded file, linked to this clue. */
  async function attachImage(file: File) {
    const blobId = await putBlob(file);
    const handout: HandoutEntity = {
      ...newBase(),
      title: file.name.replace(/\.[^.]+$/, ''),
      fileBlobId: blobId,
      clueId: clue.id,
      locationId: clue.locationId,
      deliveries: [],
      playerSafeCaption: '',
    };
    await db.handouts.put(handout);
    await patch(clue.id, { handoutIds: [...clue.handoutIds, handout.id] });
  }

  async function attachTextHandout() {
    const handout: HandoutEntity = {
      ...newBase(),
      title: `Handout de "${clue.text.slice(0, 20)}"`,
      textContent: '',
      clueId: clue.id,
      locationId: clue.locationId,
      deliveries: [],
      playerSafeCaption: '',
    };
    await db.handouts.put(handout);
    await patch(clue.id, { handoutIds: [...clue.handoutIds, handout.id] });
  }

  async function detachHandout(id: string) {
    await patch(clue.id, { handoutIds: clue.handoutIds.filter((x) => x !== id) });
  }

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <h2 className="font-serif text-lg">Pista</h2>
        <IconButton label="Fechar" onClick={onClose}><X size={18} /></IconButton>
      </div>

      <div className="space-y-4 p-4">
        <Field label="Texto da pista">
          <TextArea rows={3} value={clue.text} onChange={(e) => patch(clue.id, { text: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={clue.status} onChange={(e) => patch(clue.id, { status: e.target.value as ClueStatus })}>
              {STATUSES.map((s) => (<option key={s} value={s}>{STATUS_LABEL[s]}</option>))}
            </Select>
          </Field>
          <Field label="Dificuldade do teste">
            <Select value={clue.howToObtain.difficulty ?? ''} onChange={(e) => patch(clue.id, { howToObtain: { ...clue.howToObtain, difficulty: (e.target.value || undefined) as CocDifficulty | undefined } })}>
              <option value="">— nenhuma —</option>
              {DIFFICULTIES.map((d) => (<option key={d} value={d}>{d}</option>))}
            </Select>
          </Field>
        </div>

        <Field label="Como obter (teste / ação / conversa)">
          <TextInput value={clue.howToObtain.method} onChange={(e) => patch(clue.id, { howToObtain: { ...clue.howToObtain, method: e.target.value } })} placeholder="ex.: Perceber, Biblioteca, conversar com…" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Local">
            <Select value={clue.locationId ?? ''} onChange={(e) => patch(clue.id, { locationId: e.target.value || undefined })}>
              <option value="">— nenhum —</option>
              {locations.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
            </Select>
          </Field>
          <Field label="NPC">
            <Select value={clue.npcId ?? ''} onChange={(e) => patch(clue.id, { npcId: e.target.value || undefined })}>
              <option value="">— nenhum —</option>
              {npcs.map((n) => (<option key={n.id} value={n.id}>{n.name}</option>))}
            </Select>
          </Field>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Tramas (2+ torna a pista uma ponte)</p>
          <div className="flex flex-wrap gap-1.5">
            {plots.map((p) => {
              const on = clue.plotIds.includes(p.id);
              return (
                <button key={p.id} onClick={() => togglePlot(p.id)} className={`rounded-full px-2.5 py-1 text-xs transition-colors ${on ? 'bg-accent/20 text-accent ring-1 ring-inset ring-accent/30' : 'bg-surface-2 text-muted hover:text-text'}`}>
                  {p.name}
                </button>
              );
            })}
            {plots.length === 0 && <span className="text-xs italic text-muted">Nenhuma trama cadastrada.</span>}
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clue.isBridge} disabled={clue.plotIds.length < 2} onChange={(e) => patch(clue.id, { isBridge: e.target.checked })} />
            <span className={clue.plotIds.length < 2 ? 'text-muted' : ''}>Pista-ponte entre tramas</span>
            {clue.isBridge && <Chip tone="accent">ponte</Chip>}
          </label>
        </div>

        <Field label="Revela a conclusão">
          <Select value={clue.revealsConclusionId ?? ''} onChange={(e) => patch(clue.id, { revealsConclusionId: e.target.value || undefined })}>
            <option value="">— nenhuma —</option>
            {conclusions.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
          </Select>
        </Field>

        {/* Handouts */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Handouts da pista</p>
            <div className="flex gap-1.5">
              <Button onClick={() => fileInput.current?.click()}><ImagePlus size={13} /> imagem</Button>
              <Button onClick={attachTextHandout}><FileText size={13} /> texto</Button>
              <input ref={fileInput} type="file" accept="image/*,application/pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void attachImage(f); e.target.value = ''; }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {linkedHandouts.map((h) => (<HandoutThumb key={h.id} handout={h} onDetach={() => detachHandout(h.id)} />))}
          </div>
          {linkedHandouts.length === 0 && <p className="text-sm italic text-muted">Nenhum handout anexado. Anexe uma imagem ou crie um texto.</p>}
        </div>

        <button className="flex items-center gap-1 text-xs text-muted hover:text-secret" onClick={() => { if (confirm('Apagar esta pista?')) { void db.clues.delete(clue.id); onDeleted(); } }}>
          <Trash2 size={13} /> Apagar pista
        </button>
      </div>
    </div>
  );
}

function HandoutThumb({ handout, onDetach }: { handout: HandoutEntity; onDetach: () => void }) {
  const url = useBlobUrl(handout.fileBlobId);
  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-surface-2">
      <div className="flex h-24 items-center justify-center">
        {url && handout.fileBlobId ? (
          <img src={url} alt={handout.title} className="max-h-24 max-w-full object-contain" />
        ) : (
          <span className="px-2 text-center text-[11px] text-muted line-clamp-3">{handout.textContent || handout.title}</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-1 border-t border-border px-2 py-1">
        <span className="truncate text-[11px]">{handout.title}</span>
        <IconButton label="Desanexar" tone="danger" onClick={onDetach}><Trash2 size={12} /></IconButton>
      </div>
    </div>
  );
}
