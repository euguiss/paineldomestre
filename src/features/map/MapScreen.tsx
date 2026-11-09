import { useEffect, useMemo, useState } from 'react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { LocationMap } from './LocationMap';
import { MapToolbar } from './MapToolbar';
import type { MapEntity } from '@/db/schema';

/** Map screen: map selector + Leaflet view. The map is the main canvas. */
export function MapScreen() {
  const maps = useLiveData(() => db.maps.toArray(), []);
  const [mapId, setMapId] = useState<string | null>(null);

  // Default to the first map once loaded.
  useEffect(() => {
    if (!mapId && maps && maps.length > 0) {
      setMapId(maps[0].id);
    }
  }, [maps, mapId]);

  const activeMap = useMemo<MapEntity | undefined>(
    () => maps?.find((m) => m.id === mapId),
    [maps, mapId],
  );

  if (!maps) {
    return <div className="p-8 text-muted">Carregando mapas…</div>;
  }

  if (maps.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted">
        <p>Nenhum mapa ainda.</p>
        <p className="text-sm">Importe uma imagem de mapa pela barra de ferramentas (em breve).</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapToolbar maps={maps} activeMapId={mapId} onSelectMap={setMapId} />
      {activeMap && <LocationMap map={activeMap} />}
    </div>
  );
}
