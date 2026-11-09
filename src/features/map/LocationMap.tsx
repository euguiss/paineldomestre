import { useMemo } from 'react';
import { MapContainer, ImageOverlay, Marker, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import type { LocationEntity, MapEntity } from '@/db/schema';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { useBlobUrl } from '@/db/useBlobUrl';
import { useUiStore } from '@/state/uiStore';
import { glyphFor } from './iconKeys';

/**
 * Convert image pixel coordinates to Leaflet CRS.Simple LatLng.
 * Leaflet's y grows upward, image y grows downward, so we flip.
 */
function toLatLng(x: number, y: number, height: number): L.LatLngExpression {
  return [height - y, x];
}

function makeDivIcon(glyph: string, badge: number): L.DivIcon {
  const badgeHtml =
    badge > 0
      ? `<span style="position:absolute;top:-6px;right:-6px;background:rgb(200,70,70);color:#fff;border-radius:9999px;min-width:16px;height:16px;font-size:10px;line-height:16px;text-align:center;padding:0 3px;">${badge}</span>`
      : '';
  return L.divIcon({
    className: 'pdm-marker',
    html: `<div style="position:relative;font-size:22px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6));">${glyph}${badgeHtml}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/** Fit the view to the image bounds whenever the map changes. */
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds);
    map.setMaxBounds(L.latLngBounds(bounds as L.LatLngBoundsLiteral).pad(0.5));
  }, [map, bounds]);
  return null;
}

interface Props {
  map: MapEntity;
}

export function LocationMap({ map }: Props) {
  const imageUrl = useBlobUrl(map.imageBlobId);
  const selectLocation = useUiStore((s) => s.selectLocation);
  const selectedId = useUiStore((s) => s.selectedLocationId);

  const locations = useLiveData(
    () => db.locations.where('mapId').equals(map.id).toArray(),
    [map.id],
  );
  // Count undiscovered clues per location for marker badges.
  const clues = useLiveData(() => db.clues.toArray(), []);

  const bounds = useMemo<L.LatLngBoundsExpression>(
    () => [
      [0, 0],
      [map.height, map.width],
    ],
    [map.height, map.width],
  );

  const badgeByLocation = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of clues ?? []) {
      if (c.locationId && c.status === 'nao-descoberta') {
        m.set(c.locationId, (m.get(c.locationId) ?? 0) + 1);
      }
    }
    return m;
  }, [clues]);

  const points = (locations ?? []).filter(
    (l): l is LocationEntity & { geometry: { type: 'point'; x: number; y: number } } =>
      l.geometry.type === 'point',
  );
  const polygons = (locations ?? []).filter(
    (l): l is LocationEntity & { geometry: { type: 'polygon'; points: { x: number; y: number }[] } } =>
      l.geometry.type === 'polygon',
  );

  if (!imageUrl) {
    return <div className="flex h-full items-center justify-center text-muted">Carregando imagem do mapa…</div>;
  }

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      minZoom={-4}
      maxZoom={3}
      zoomSnap={0.25}
      className="h-full w-full"
      attributionControl={false}
    >
      <FitBounds bounds={bounds} />
      <ImageOverlay url={imageUrl} bounds={bounds} />

      {polygons.map((loc) => (
        <Polygon
          key={loc.id}
          positions={loc.geometry.points.map((p) => toLatLng(p.x, p.y, map.height))}
          pathOptions={{
            color: selectedId === loc.id ? 'rgb(180,120,70)' : 'rgb(120,120,140)',
            weight: 2,
            fillOpacity: 0.12,
          }}
          eventHandlers={{ click: () => selectLocation(loc.id) }}
        >
          <Tooltip>{loc.name}</Tooltip>
        </Polygon>
      ))}

      {points.map((loc) => (
        <Marker
          key={loc.id}
          position={toLatLng(loc.geometry.x, loc.geometry.y, map.height)}
          icon={makeDivIcon(glyphFor(loc.iconKey, loc.kind), badgeByLocation.get(loc.id) ?? 0)}
          eventHandlers={{ click: () => selectLocation(loc.id) }}
          keyboard
        >
          <Tooltip direction="top" offset={[0, -12]}>
            {loc.name}
            {!loc.discovered && <span className="ml-1 text-muted">(oculto)</span>}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
