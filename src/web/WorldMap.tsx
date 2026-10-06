import { useEffect, useState } from "react";

type Position = [number, number, ...number[]];
type Geometry = { type: "Polygon" | "MultiPolygon"; coordinates: Position[][] | Position[][][] };
type Feature = { id: string; name: string; continent: string; geometry: Geometry };
type MapData = { snapshotDate: string; features: Feature[] };

function ringPath(ring: Position[]): string {
  return ring.map(([longitude, latitude], index) => `${index ? "L" : "M"}${((longitude + 180) / 360 * 960).toFixed(1)},${((90 - latitude) / 180 * 480).toFixed(1)}`).join(" ") + "Z";
}

function geometryPath(geometry: Geometry): string {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates as Position[][]] : geometry.coordinates as Position[][][];
  return polygons.flatMap((polygon) => polygon.map(ringPath)).join(" ");
}

export function WorldMap({ selectedId, onSelect, colorFor }: { selectedId: string; onSelect: (id: string) => void; colorFor: (id: string) => string }) {
  const [data, setData] = useState<MapData | null>(null);
  useEffect(() => { let active = true; void fetch("/data/world/world-map.json").then((response) => { if (!response.ok) throw new Error("Mapa no disponible"); return response.json() as Promise<MapData>; }).then((map) => { if (active) setData(map); }); return () => { active = false; }; }, []);
  if (!data) return <div className="world-map-loading">Cargando geometrías versionadas…</div>;
  return <div className="world-map-wrap"><svg className="world-map" viewBox="0 0 960 480" role="img" aria-label={`Mapa mundial político, geometrías fechadas ${data.snapshotDate}`}>
    <rect width="960" height="480" fill="#eef4f5" />
    {data.features.map((feature) => <path key={feature.id} d={geometryPath(feature.geometry)} fill={feature.id.toLowerCase() === selectedId.toLowerCase() ? "#ef9c56" : colorFor(feature.id.toLowerCase())} stroke="#fff" strokeWidth="0.7" tabIndex={0} role="button" aria-label={`${feature.name}, ${feature.continent}`} onClick={() => onSelect(feature.id.toLowerCase())} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(feature.id.toLowerCase()); }}><title>{feature.name} · {feature.continent}</title></path>)}
  </svg><small>Natural Earth · foto {data.snapshotDate} · clic para seleccionar</small></div>;
}
