import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { MigrationEdge } from '@/data/migration';

interface ProvinceFeature {
  type: 'Feature';
  properties: { Propinsi: string };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface ProvinceCollection {
  type: 'FeatureCollection';
  features: ProvinceFeature[];
}

interface FlowTooltip {
  x: number;
  y: number;
  origin: string;
  destination: string;
  count: number;
}

interface FlowMapLabel {
  name: string;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  width: number;
}

interface Props {
  edges: MigrationEdge[];
}

const WIDTH = 920;
const HEIGHT = 570;
const numberFormat = new Intl.NumberFormat('id-ID');

export default function MigrationFlowMap({ edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<ProvinceCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<FlowTooltip | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/indonesia-provinsi-migrasi.json')
      .then(response => {
        if (!response.ok) throw new Error(`Peta provinsi tidak dapat dimuat (${response.status}).`);
        return response.json() as Promise<ProvinceCollection>;
      })
      .then(collection => {
        if (collection.features.length !== 34) throw new Error('Peta harus memuat 34 geometri provinsi.');
        if (!cancelled) setGeo(collection);
      })
      .catch(error => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Peta provinsi gagal dibaca.');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!geo || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const projection = d3.geoMercator().fitExtent(
      [[22, 20], [WIDTH - 22, HEIGHT - 24]],
      geo as unknown as d3.GeoPermissibleObjects
    );
    const pathGenerator = d3.geoPath(projection);
    const centroidByProvince = new Map(geo.features.map(feature => [
      feature.properties.Propinsi,
      d3.geoCentroid(feature as unknown as d3.GeoPermissibleObjects),
    ]));
    const totals = new Map<string, number>();
    edges.forEach(edge => {
      totals.set(edge.Prov_Asal, (totals.get(edge.Prov_Asal) ?? 0) + edge.Jumlah_Migran);
      totals.set(edge.Prov_Tujuan, (totals.get(edge.Prov_Tujuan) ?? 0) + edge.Jumlah_Migran);
    });
    const topLabels = new Set([...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([province]) => province));

    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'migration-flow-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 7)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#c97543');

    const mapLayer = svg.append('g').attr('class', 'flowmap-regions');
    mapLayer.selectAll('path')
      .data(geo.features)
      .join('path')
      .attr('d', feature => pathGenerator(feature as unknown as d3.GeoPermissibleObjects) ?? '')
      .attr('fill', '#e6eeeb')
      .attr('stroke', '#b9c9c9')
      .attr('stroke-width', 0.8)
      .append('title')
      .text(feature => feature.properties.Propinsi);

    const maxFlow = d3.max(edges, edge => edge.Jumlah_Migran) ?? 1;
    const strokeWidth = d3.scaleSqrt().domain([0, maxFlow]).range([0.8, 6.5]).clamp(true);
    const flowLayer = svg.append('g').attr('class', 'flowmap-flows').style('fill', 'none');
    const flowPaths = flowLayer.selectAll('path')
      .data(edges)
      .join('path')
      .attr('d', edge => {
        const source = centroidByProvince.get(edge.Prov_Asal);
        const target = centroidByProvince.get(edge.Prov_Tujuan);
        if (!source || !target) return '';
        const interpolate = d3.geoInterpolate(source, target);
        const coordinates = d3.range(33).map(index => interpolate(index / 32));
        return pathGenerator({ type: 'LineString', coordinates }) ?? '';
      })
      .attr('stroke', '#c97543')
      .attr('stroke-width', edge => strokeWidth(edge.Jumlah_Migran))
      .attr('stroke-opacity', 0.34)
      .attr('stroke-linecap', 'round')
      .attr('marker-end', 'url(#migration-flow-arrow)')
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, edge) {
        d3.select(this).attr('stroke-opacity', 0.9).attr('stroke-width', strokeWidth(edge.Jumlah_Migran) + 1.4);
        const [x, y] = d3.pointer(event, wrapRef.current);
        setTooltip({ x, y, origin: edge.Prov_Asal, destination: edge.Prov_Tujuan, count: edge.Jumlah_Migran });
      })
      .on('mousemove', event => {
        const [x, y] = d3.pointer(event, wrapRef.current);
        setTooltip(previous => previous ? { ...previous, x, y } : null);
      })
      .on('mouseleave', function (_, edge) {
        d3.select(this).attr('stroke-opacity', 0.34).attr('stroke-width', strokeWidth(edge.Jumlah_Migran));
        setTooltip(null);
      });

    flowPaths.append('title')
      .text(edge => `${edge.Prov_Asal} → ${edge.Prov_Tujuan}: ${numberFormat.format(edge.Jumlah_Migran)} jiwa`);

    const provinceLayer = svg.append('g').attr('class', 'flowmap-provinces').style('pointer-events', 'none');
    const provincePoints = geo.features.map(feature => ({
      name: feature.properties.Propinsi,
      point: centroidByProvince.get(feature.properties.Propinsi),
    })).filter((item): item is { name: string; point: [number, number] } => Boolean(item.point));

    provinceLayer.selectAll('circle')
      .data(provincePoints)
      .join('circle')
      .attr('cx', item => projection(item.point)?.[0] ?? 0)
      .attr('cy', item => projection(item.point)?.[1] ?? 0)
      .attr('r', 2.8)
      .attr('fill', '#155b67')
      .attr('stroke', '#fffdfb')
      .attr('stroke-width', 1);

    provinceLayer.selectAll('text')
    const labels: FlowMapLabel[] = provincePoints
      .filter(item => topLabels.has(item.name))
      .map(item => {
        const [anchorX, anchorY] = projection(item.point) ?? [0, 0];
        return {
          name: item.name,
          x: anchorX + 22,
          y: anchorY - 12,
          anchorX,
          anchorY,
          width: item.name.length * 5.4,
        };
      });

    const labelSimulation = d3.forceSimulation(labels)
      .force('x', d3.forceX<FlowMapLabel>(label => label.anchorX + 22).strength(0.45))
      .force('y', d3.forceY<FlowMapLabel>(label => label.anchorY - 12).strength(0.75))
      .force('collide', d3.forceCollide<FlowMapLabel>(label => label.width / 2 + 7).strength(0.95).iterations(3))
      .stop();

    for (let iteration = 0; iteration < 180; iteration++) {
      labelSimulation.tick();
      labels.forEach(label => {
        label.x = Math.max(48, Math.min(WIDTH - 48, label.x));
        label.y = Math.max(20, Math.min(HEIGHT - 20, label.y));
      });
    }

    provinceLayer.append('g')
      .attr('class', 'flowmap-label-leaders')
      .selectAll('line')
      .data(labels)
      .join('line')
      .attr('x1', label => label.anchorX)
      .attr('y1', label => label.anchorY)
      .attr('x2', label => label.x)
      .attr('y2', label => label.y)
      .attr('stroke', '#829394')
      .attr('stroke-width', 0.65)
      .attr('stroke-opacity', 0.7);

    provinceLayer.selectAll('.flowmap-province-label')
      .data(labels)
      .join('text')
      .attr('class', 'flowmap-province-label')
      .attr('x', label => label.x)
      .attr('y', label => label.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', '9px')
      .style('font-weight', '700')
      .style('fill', '#23394e')
      .style('paint-order', 'stroke')
      .style('stroke', '#fffdfb')
      .style('stroke-width', '3px')
      .style('stroke-linejoin', 'round')
      .text(label => label.name);
  }, [geo, edges]);

  if (loadError) {
    return <div role="alert" className="flex min-h-[420px] items-center justify-center text-sm text-warm-deep">{loadError}</div>;
  }

  if (!geo) {
    return <div className="flex min-h-[420px] items-center justify-center text-sm text-ink-muted">Memuat geometri 34 provinsi…</div>;
  }

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
        <span>Arah panah: asal → tujuan</span>
        <span className="inline-flex items-center gap-2"><i className="h-[3px] w-7 rounded-full bg-warm" />Lebar garis mengikuti jumlah migran</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Flowmap arus migrasi antarprovinsi Indonesia"
        className="d3-chart block h-auto w-full"
      />
      {tooltip && (
        <div
          className="map-tooltip visible"
          style={{
            left: Math.max(8, Math.min(tooltip.x + 14, (wrapRef.current?.clientWidth ?? WIDTH) - 230)),
            top: Math.max(8, Math.min(tooltip.y + 14, HEIGHT - 92)),
          }}
        >
          <div style={{ fontWeight: 700 }}>{tooltip.origin} → {tooltip.destination}</div>
          <div style={{ color: '#a8b6c0' }}>Jumlah migran: <span style={{ color: '#fff', fontWeight: 600 }}>{numberFormat.format(tooltip.count)} jiwa</span></div>
        </div>
      )}
    </div>
  );
}
