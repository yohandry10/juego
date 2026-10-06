import { useEffect, useState } from "react";
import type { AggregateForce } from "../domain/geopolitics-types.js";

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

export function WorldMap({ selectedId, onSelect, colorFor, forces = [] }: { selectedId: string; onSelect: (id: string) => void; colorFor: (id: string) => string; forces?: readonly AggregateForce[] }) {
  const [data, setData] = useState<MapData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { let active = true; void fetch("/data/world/world-map.json").then((response) => { if (!response.ok) throw new Error("Mapa no disponible"); return response.json() as Promise<MapData>; }).then((map) => { if (active) setData(map); }).catch(() => { if (active) setError(true); }); return () => { active = false; }; }, []);
  if (error) return <p role="status">No se pudo cargar el mapa. Puedes consultar los actores y sus fuerzas en el catálogo.</p>;
  if (!data) return <div className="world-map-loading">Cargando geometrías versionadas…</div>;
  return <div className="world-map-wrap"><svg className="world-map" viewBox="0 0 960 480" role="img" aria-label={`Mapa mundial político, geometrías fechadas ${data.snapshotDate}`}>
    <rect width="960" height="480" fill="#eef4f5" />
    {data.features.map((feature) => <path key={feature.id} d={geometryPath(feature.geometry)} fill={feature.id.toLowerCase() === selectedId.toLowerCase() ? "#ef9c56" : colorFor(feature.id.toLowerCase())} stroke="#fff" strokeWidth="0.7" tabIndex={0} role="button" aria-label={`${feature.name}, ${feature.continent}`} onClick={() => onSelect(feature.id.toLowerCase())} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(feature.id.toLowerCase()); } }}><title>{feature.name} · {feature.continent}</title></path>)}
    {forces.map((force, index) => {
      const feature = data.features.find((item) => item.id.toLowerCase() === force.locationId);
      if (!feature) return null;
      const polygon = feature.geometry.type === "Polygon" ? feature.geometry.coordinates as Position[][] : (feature.geometry.coordinates as Position[][][])[0]!;
      const ring = polygon[0]!;
      const longitude = ring.reduce((sum, point) => sum + point[0], 0) / ring.length;
      const latitude = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
      return <circle key={`${force.ownerId}-${force.kind}-${index}`} cx={(longitude + 180) / 360 * 960 + (index % 3 - 1) * 5} cy={(90 - latitude) / 180 * 480} r="3" fill="#26363d" stroke="#fff"><title>{force.kind} de {force.ownerId} en {force.locationId}; logística {force.logistics.toFixed(0)}</title></circle>;
    })}
  </svg><small>Natural Earth · foto {data.snapshotDate} · clic para seleccionar · puntos: fuerzas agregadas en su ubicación actual</small></div>;
}
