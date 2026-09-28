import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { ProvinceDatum } from '@/data/provinces';
import type { GeoCollection } from '@/lib/geo';
import { normalizeProvinceName } from '@/lib/geo';

interface Props {
  geo: GeoCollection;
  data: ProvinceDatum[];
  metric: string;
  metricLabel: string;
  highlighted: Set<string>;
  width?: number;
  height?: number;
}

interface TooltipData {
  x: number;
  y: number;
  name: string;
  value: number;
  rank: number;
  isHighlighted: boolean;
}

export default function ChoroplethMap({ geo, data, metric, metricLabel, highlighted, width = 800, height = 460 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const dataMap = new Map(data.map(d => [d.provinsi, d]));
    const values = data.map(d => d[metric as keyof ProvinceDatum] as number);
    const extent = d3.extent(values);

    // Rank provinces by metric value
    const sorted = [...data].sort((a, b) =>
      (b[metric as keyof ProvinceDatum] as number) - (a[metric as keyof ProvinceDatum] as number)
    );
    const rankMap = new Map(sorted.map((d, i) => [d.provinsi, i + 1]));

    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([extent[0]!, extent[1]!]);

    const projection = d3.geoMercator().fitSize([width, height], geo as unknown as d3.GeoPermissibleObjects);
    const pathGen = d3.geoPath(projection);

    // Ocean background gradient
    const defs = svg.append('defs');
    const oceanGrad = defs.append('linearGradient').attr('id', 'ocean-grad')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    oceanGrad.append('stop').attr('offset', '0%').attr('stop-color', '#dcedf5');
    oceanGrad.append('stop').attr('offset', '100%').attr('stop-color', '#e8f2f6');

    svg.append('rect')
      .attr('width', width).attr('height', height)
      .attr('fill', 'url(#ocean-grad)');

    // Province paths
    geo.features.forEach(feat => {
      const provinsi = normalizeProvinceName(feat.properties.Propinsi);
      const datum = dataMap.get(provinsi);
      const isHighlight = highlighted.has(provinsi);
      const hasHighlight = highlighted.size > 0;
      const fill = datum ? colorScale(datum[metric as keyof ProvinceDatum] as number) : '#dde5ea';
      const rank = datum ? rankMap.get(provinsi) ?? 0 : 0;

      const path = svg.append('path')
        .datum(feat)
        .attr('d', pathGen as unknown as (d: unknown) => string)
        .attr('fill', fill)
        .attr('stroke', isHighlight ? '#14283b' : 'rgba(255,255,255,0.7)')
        .attr('stroke-width', isHighlight ? 2 : 0.5)
        .attr('opacity', hasHighlight ? (isHighlight ? 1 : 0.3) : 0.9)
        .style('cursor', datum ? 'pointer' : 'default')
        .style('transition', 'opacity 0.2s ease, stroke-width 0.15s ease');

      if (datum) {
        path
          .on('mouseenter', function (event) {
            d3.select(this)
              .raise()
              .attr('stroke', '#14283b')
              .attr('stroke-width', isHighlight ? 2.5 : 1.5)
              .attr('opacity', 1);
            const [x, y] = d3.pointer(event, svg.node());
            const safeX = x + 14 + 180 > width ? x - 194 : x + 14;
            const safeY = y + 14 + 80 > height ? y - 90 : y + 14;
            setTooltip({ x: safeX, y: safeY, name: provinsi, value: datum[metric as keyof ProvinceDatum] as number, rank, isHighlighted: isHighlight });
          })
          .on('mousemove', function (event) {
            const [x, y] = d3.pointer(event, svg.node());
            const safeX = x + 14 + 180 > width ? x - 194 : x + 14;
            const safeY = y + 14 + 80 > height ? y - 90 : y + 14;
            setTooltip(prev => prev ? { ...prev, x: safeX, y: safeY } : null);
          })
          .on('mouseleave', function () {
            d3.select(this)
              .attr('stroke', isHighlight ? '#14283b' : 'rgba(255,255,255,0.7)')
              .attr('stroke-width', isHighlight ? 2 : 0.5)
              .attr('opacity', hasHighlight ? (isHighlight ? 1 : 0.3) : 0.9);
            setTooltip(null);
          });
      }
    });

    // Color legend
    const legendW = 200;
    const legendH = 10;
    const legendX = width - legendW - 22;
    const legendY = height - 48;

    const gradId = 'map-grad';
    const grad = defs.append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%').attr('x2', '100%');
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      grad.append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', colorScale(extent[0]! + t * (extent[1]! - extent[0]!)));
    }

    // Legend background
    svg.append('rect')
      .attr('x', legendX - 10).attr('y', legendY - 24)
      .attr('width', legendW + 20).attr('height', 52)
      .attr('rx', 6)
      .attr('fill', 'white').attr('opacity', 0.85)
      .attr('stroke', '#e2e8ed').attr('stroke-width', 0.5);

    svg.append('rect')
      .attr('x', legendX).attr('y', legendY)
      .attr('width', legendW).attr('height', legendH)
      .attr('rx', 3)
      .attr('fill', `url(#${gradId})`);

    svg.append('text')
      .attr('x', legendX).attr('y', legendY - 10)
      .style('font-size', '9.5px').style('fill', '#6b8294')
      .style('font-weight', '700')
      .style('text-transform', 'uppercase').style('letter-spacing', '0.07em')
      .text(metricLabel);

    svg.append('text')
      .attr('x', legendX).attr('y', legendY + legendH + 14)
      .style('font-size', '10px').style('fill', '#6b8294')
      .text(extent[0]!.toFixed(1));

    svg.append('text')
      .attr('x', legendX + legendW).attr('y', legendY + legendH + 14)
      .attr('text-anchor', 'end')
      .style('font-size', '10px').style('fill', '#6b8294')
      .text(extent[1]!.toFixed(1));

  }, [geo, data, metric, metricLabel, highlighted, width, height]);

  return (
    <div className="relative">
      <svg ref={ref} width={width} height={height} className="d3-chart w-full h-auto rounded-lg" style={{ maxWidth: width }} />
      {tooltip && (
        <div
          className="map-tooltip visible"
          style={{ left: tooltip.x, top: tooltip.y, minWidth: 168 }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
            {tooltip.name}
          </div>
          {tooltip.isHighlighted && (
            <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 600, marginBottom: 3 }}>● Dipilih</div>
          )}
          <div style={{ color: '#a8b6c0', fontSize: 11.5 }}>
            {metricLabel}: <span style={{ color: '#fff', fontWeight: 700 }}>{tooltip.value.toFixed(1)}</span>
          </div>
          <div style={{ color: '#a8b6c0', fontSize: 11, marginTop: 2 }}>
            Peringkat: <span style={{ color: '#e8a838', fontWeight: 600 }}>#{tooltip.rank}</span> dari {tooltip.rank > 0 ? data.length : '—'}
          </div>
        </div>
      )}
    </div>
  );
}
