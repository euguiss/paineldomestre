import { useRef, useState } from 'react';
import { Upload, Trash2, Eye, Send, X } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { putBlob } from '@/db/blobs';
import { useBlobUrl } from '@/db/useBlobUrl';
import { ScreenHeader, Button, Field, TextInput, TextArea, Chip } from '@/components/ui';
import { recordEvent } from '@/domain/effects';
import { useSessionContext } from '@/features/shared/useSessionContext';
import { KeeperMarkdown } from '@/markdown/KeeperMarkdown';
import type { HandoutEntity } from '@/db/schema';

async function patch(id: string, changes: Partial<HandoutEntity>) {
  await db.handouts.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

/** Biblioteca de Handouts: grid, drag/upload, link, deliver, player preview (6.7). */
export function HandoutsScreen() {
  const handouts = useLiveData(() => db.handouts.toArray(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<HandoutEntity | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const selected = handouts?.find((h) => h.id === selectedId);

  async function addFromFile(file: File) {
    const blobId = await putBlob(file);
    const h: HandoutEntity = {
      ...newBase(),
      title: file.name.replace(/\.[^.]+$/, ''),
      fileBlobId: blobId,
      deliveries: [],
      playerSafeCaption: '',
    };
    await db.handouts.put(h);
    setSelectedId(h.id);
  }

  async function addTextHandout() {
    const h: HandoutEntity = {
      ...newBase(),
      title: 'Novo handout de texto',
      textContent: '',
      deliveries: [],
      playerSafeCaption: '',
    };
    await db.handouts.put(h);
    setSelectedId(h.id);
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <ScreenHeader title="Biblioteca de Handouts">
          <Button onClick={addTextHandout}>+ Texto</Button>
          <Button variant="accent" onClick={() => fileInput.current?.click()}>
            <Upload size={14} className="mr-1 inline" /> Imagem/PDF
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void addFromFile(f);
              e.target.value = '';
            }}
          />
        </ScreenHeader>

        <div
          className={`grid flex-1 content-start gap-3 overflow-y-auto p-4 sm:grid-cols-2 xl:grid-cols-3 ${dragOver ? 'ring-2 ring-accent' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void addFromFile(f);
          }}
        >
          {handouts?.map((h) => (
            <HandoutCard key={h.id} handout={h} selected={selectedId === h.id} onSelect={() => setSelectedId(h.id)} onPreview={() => setPreview(h)} />
          ))}
          {handouts?.length === 0 && <p className="text-muted">Arraste uma imagem/PDF aqui ou use os botões acima.</p>}
        </div>
      </div>

      {selected && <HandoutEditor key={selected.id} handout={selected} onClose={() => setSelectedId(null)} onPreview={() => setPreview(selected)} />}
      {preview && <PlayerPreview handout={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function HandoutCard({ handout, selected, onSelect, onPreview }: { handout: HandoutEntity; selected: boolean; onSelect: () => void; onPreview: () => void }) {
  const url = useBlobUrl(handout.fileBlobId);
  return (
    <div className={`overflow-hidden rounded-lg border ${selected ? 'border-accent' : 'border-border'} bg-surface`}>
      <button onClick={onSelect} className="block w-full text-left">
        <div className="flex h-32 items-center justify-center bg-surface-2">
          {url && handout.fileBlobId ? (
            <img src={url} alt="" className="max-h-32 max-w-full object-contain" />
          ) : (
            <span className="px-3 text-center text-xs text-muted line-clamp-4">{handout.textContent || 'Sem prévia'}</span>
          )}
        </div>
        <div className="p-2">
          <p className="truncate font-medium">{handout.title}</p>
          <Chip>{handout.deliveries.length} entrega(s)</Chip>
        </div>
      </button>
      <button className="flex w-full items-center justify-center gap-1 border-t border-border py-1 text-xs text-muted hover:text-accent" onClick={onPreview}>
        <Eye size={12} /> como o jogador vê
      </button>
    </div>
  );
}

function HandoutEditor({ handout, onClose, onPreview }: { handout: HandoutEntity; onClose: () => void; onPreview: () => void }) {
  const tables = useLiveData(() => db.gameTables.toArray(), []) ?? [];
  const clues = useLiveData(() => db.clues.toArray(), []) ?? [];
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];
  const ctx = useSessionContext();

  async function deliver(tableId: string) {
    const table = tables.find((t) => t.id === tableId);
    await recordEvent({
      type: 'entrega-de-handout',
      text: `Handout "${handout.title}" entregue à ${table?.name ?? 'mesa'}.`,
      inGameDate: table?.inGameDate ?? ctx.inGameDate,
      tableId,
      linkedEntityIds: [handout.id],
      effects: [{ type: 'markHandoutDelivered', handoutId: handout.id, tableId }],
    });
  }

  return (
    <aside className="w-[380px] shrink-0 overflow-y-auto border-l border-border bg-surface">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <h2 className="truncate font-serif text-lg">{handout.title}</h2>
        <button className="text-muted hover:text-text" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
      </div>
      <div className="space-y-3 p-4">
        <Field label="Título"><TextInput value={handout.title} onChange={(e) => patch(handout.id, { title: e.target.value })} /></Field>
        {handout.textContent !== undefined && !handout.fileBlobId && (
          <Field label="Conteúdo (markdown)"><TextArea rows={5} value={handout.textContent} onChange={(e) => patch(handout.id, { textContent: e.target.value })} /></Field>
        )}
        <Field label="Legenda segura para o jogador">
          <TextArea rows={2} value={handout.playerSafeCaption} onChange={(e) => patch(handout.id, { playerSafeCaption: e.target.value })} />
        </Field>
        <Field label="Vincular à pista">
          <select className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-sm" value={handout.clueId ?? ''} onChange={(e) => patch(handout.id, { clueId: e.target.value || undefined })}>
            <option value="">— nenhuma —</option>
            {clues.map((c) => (<option key={c.id} value={c.id}>{c.text.slice(0, 40)}</option>))}
          </select>
        </Field>
        <Field label="Vincular ao local">
          <select className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-sm" value={handout.locationId ?? ''} onChange={(e) => patch(handout.id, { locationId: e.target.value || undefined })}>
            <option value="">— nenhum —</option>
            {locations.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
          </select>
        </Field>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Entregar à mesa</p>
          <div className="flex flex-wrap gap-1">
            {tables.map((t) => {
              const delivered = handout.deliveries.some((d) => d.tableId === t.id);
              return (
                <button key={t.id} onClick={() => deliver(t.id)} disabled={delivered}
                  className={`flex items-center gap-1 rounded border border-border px-2 py-1 text-xs ${delivered ? 'bg-accent/10 text-accent' : 'bg-surface-2 hover:bg-surface'}`}>
                  <Send size={11} /> {t.name}{delivered ? ' ✓' : ''}
                </button>
              );
            })}
            {tables.length === 0 && <span className="text-xs italic text-muted">Nenhuma mesa cadastrada.</span>}
          </div>
        </div>

        <Button onClick={onPreview}><Eye size={14} className="mr-1 inline" /> Pré-visualizar (jogador)</Button>
        <button className="flex items-center gap-1 text-xs text-muted hover:text-secret" onClick={() => { if (confirm('Apagar handout?')) { void db.handouts.delete(handout.id); onClose(); } }}>
          <Trash2 size={13} /> Apagar
        </button>
      </div>
    </aside>
  );
}

/** How the player sees the handout: only the safe image/text + caption, never Keeper notes. */
function PlayerPreview({ handout, onClose }: { handout: HandoutEntity; onClose: () => void }) {
  const url = useBlobUrl(handout.fileBlobId);
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-10" onClick={onClose}>
      <div className="max-w-2xl rounded-lg bg-surface p-6 text-center" onClick={(e) => e.stopPropagation()}>
        {url && handout.fileBlobId ? (
          <img src={url} alt={handout.playerSafeCaption} className="mx-auto max-h-[70vh]" />
        ) : (
          <div className="read-aloud text-left"><KeeperMarkdown hideSecrets>{handout.textContent ?? ''}</KeeperMarkdown></div>
        )}
        {handout.playerSafeCaption && <p className="mt-3 text-sm text-muted">{handout.playerSafeCaption}</p>}
        <button className="mt-4 rounded border border-border bg-surface-2 px-3 py-1 text-sm" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}
