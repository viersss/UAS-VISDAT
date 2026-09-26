export interface GeoFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: { Propinsi: string; [k: string]: unknown };
}

export interface GeoCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

function ringCentroid(ring: number[][]): [number, number] {
  let a = 0, cx = 0, cy = 0;
  const n = ring.length;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const cross = x0 * y1 - x1 * y0;
    a += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-12) {
    const xs = ring.map(p => p[0]);
    const ys = ring.map(p => p[1]);
    return [xs.reduce((s, v) => s + v, 0) / xs.length, ys.reduce((s, v) => s + v, 0) / ys.length];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

export function geometryCentroid(geom: GeoFeature['geometry']): [number, number] | null {
  const polys: number[][][][] = geom.type === 'Polygon'
    ? [geom.coordinates as number[][][]]
    : (geom.coordinates as number[][][][]);

  let totalA = 0, sx = 0, sy = 0;
  for (const poly of polys) {
    if (!poly.length) continue;
    const [cx, cy] = ringCentroid(poly[0]);
    const area = Math.abs(
      poly[0].reduce((acc, _, i, arr) => {
        if (i === 0) return 0;
        const [x0, y0] = arr[i - 1];
        const [x1, y1] = arr[i];
        return acc + x0 * y1 - x1 * y0;
      }, 0) * 0.5
    );
    totalA += area;
    sx += cx * area;
    sy += cy * area;
  }
  if (totalA === 0) return null;
  return [sx / totalA, sy / totalA];
}

const ALIASES: Record<string, string> = {
  'IRIAN JAYA TIMUR': 'Papua',
  'IRIAN JAYA TENGAH': 'Papua',
  'IRIAN JAYA BARAT': 'Papua Barat',
  'NUSATENGGARA BARAT': 'Nusa Tenggara Barat',
  'NUSA TENGGARA TIMUR': 'Nusa Tenggara Timur',
  'GORONTALO': 'Gorontalo',
  'SULAWESI TENGGARA': 'Sulawesi Tenggara',
  'DAERAH ISTIMEWA YOGYAKARTA': 'DI Yogyakarta',
  'JAWA TENGAH': 'Jawa Tengah',
  'PROBANTEN': 'Banten',
  'JAWA TIMUR': 'Jawa Timur',
  'MALUKU UTARA': 'Maluku Utara',
  'MALUKU': 'Maluku',
  'KALIMANTAN SELATAN': 'Kalimantan Selatan',
  'KALIMANTAN BARAT': 'Kalimantan Barat',
  'SULAWESI SELATAN': 'Sulawesi Selatan',
  'DKI JAKARTA': 'DKI Jakarta',
  'JAWA BARAT': 'Jawa Barat',
  'BALI': 'Bali',
  'RIAU': 'Riau',
  'SULAWESI TENGAH': 'Sulawesi Tengah',
  'KALIMANTAN TIMUR': 'Kalimantan Timur',
  'SULAWESI UTARA': 'Sulawesi Utara',
  'SUMATERA UTARA': 'Sumatera Utara',
  'BANGKA BELITUNG': 'Kep. Bangka Belitung',
  'SUMATERA BARAT': 'Sumatera Barat',
  'KALIMANTAN TENGAH': 'Kalimantan Tengah',
  'SUMATERA SELATAN': 'Sumatera Selatan',
  'JAMBI': 'Jambi',
  'LAMPUNG': 'Lampung',
  'BENGKULU': 'Bengkulu',
  'DI. ACEH': 'DI Aceh',
};

export function normalizeProvinceName(name: string): string {
  return ALIASES[name.toUpperCase().trim()] ?? name;
}

export function buildProvinceCentroids(geo: GeoCollection): Map<string, [number, number]> {
  const map = new Map<string, [number, number]>();
  for (const feat of geo.features) {
    const normalized = normalizeProvinceName(feat.properties.Propinsi);
    if (map.has(normalized)) continue;
    const c = geometryCentroid(feat.geometry);
    if (c) map.set(normalized, c);
  }
  return map;
}
