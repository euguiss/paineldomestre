import { useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import type { MapEntity } from '@/db/schema';
import { db } from '@/db/database';
import { putBlob } from '@/db/blobs';
import { newBase } from '@/db/ids';
import { wipeAll, installSeed } from '@/seed/seedData';

interface Props {
  maps: MapEntity[];
  activeMapId: string | null;
  onSelectMap: (id: string) => void;
}

/** Floating toolbar over the map: map selector + import image + seed controls. */
export function MapToolbar({ maps, activeMapId, onSelectMap }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    const blobId = await putBlob(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      const map: MapEntity = {
        ...newBase(),
        name: file.name.replace(/\.[^.]+$/, ''),
        imageBlobId: blobId,
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      await db.maps.put(map);
      URL.revokeObjectURL(url);
      onSelectMap(map.id);
    };
    img.src = url;
  }

  async function handleReset() {
    if (!confirm('Apagar tudo e começar do zero? Esta ação não pode ser desfeita.')) return;
    await wipeAll();
  }

  async function handleReseed() {
    if (!confirm('Reinstalar o conteúdo de exemplo? (Apaga o mundo atual.)')) return;
    await wipeAll();
    await installSeed();
  }

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex flex-col gap-2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-surface/95 p-2 shadow-lg backdrop-blur">
        <select
          className="rounded border border-border bg-surface-2 px-2 py-1 text-sm"
          value={activeMapId ?? ''}
          onChange={(e) => onSelectMap(e.target.value)}
          aria-label="Selecionar mapa"
        >
          {maps.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <button
          className="flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-sm hover:bg-surface"
          onClick={() => fileInput.current?.click()}
        >
          <Upload size={14} aria-hidden /> Importar imagem
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleUpload(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-surface/95 p-2 text-xs shadow-lg backdrop-blur">
        <button className="flex items-center gap-1 text-muted hover:text-accent" onClick={handleReseed}>
          Recarregar exemplo
        </button>
        <span className="text-border">|</span>
        <button className="flex items-center gap-1 text-muted hover:text-secret" onClick={handleReset}>
          <Trash2 size={13} aria-hidden /> Começar do zero
        </button>
      </div>
    </div>
  );
}
