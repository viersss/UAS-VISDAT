import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { ProvinceDatum } from '@/data/provinces';
import type { GeoCollection } from '@/lib/geo';
import { buildProvinceCentroids, normalizeProvinceName } from '@/lib/geo';

interface Props {
  geo: GeoCollection;
  data: ProvinceDatum[];
  metric: string;
  metricLabel: string;
  highlighted: Set<string>;
  width?: number;
  height?: number;
}

export default function ProportionalSymbolMap({ geo, data, metric, metricLabel, highlighted, width = 800, height = 460 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; value: number } | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const centroids = buildProvinceCentroids(geo);
    const projection = d3.geoMercator().fitSize([width, height], geo as unknown as d3.GeoPermissibleObjects);

    const values = data.map(d => d[metric as keyof ProvinceDatum] as number);
    const extent = d3.extent(values);
    const radiusScale = d3.scaleSqrt()
      .domain([extent[0]!, extent[1]!])
      .range([4, 22]);
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([extent[0]!, extent[1]!]);

    const pathGen = d3.geoPath(projection);

    // Background map outlines
    svg.append('rect')
      .attr('width', width).attr('height', height)
      .attr('fill', '#f0f4f6');

    svg.selectAll('.outline')
      .data(geo.features)
      .join('path')
      .attr('class', 'outline')
      .attr('d', pathGen as unknown as (d: unknown) => string)
      .attr('fill', '#e8edf0')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.6);

    const hasHighlight = highlighted.size > 0;

    // Symbols
    data.forEach(d => {
      const c = centroids.get(d.provinsi);
      if (!c) return;
      const [px, py] = projection(c)!;
      const val = d[metric as keyof ProvinceDatum] as number;
      const isHl = highlighted.has(d.provinsi);

      svg.append('circle')
        .attr('cx', px).attr('cy', py)
        .attr('r', 0)
        .attr('fill', colorScale(val))
        .attr('stroke', isHl ? '#14283b' : '#ffffff')
        .attr('stroke-width', isHl ? 2 : 1)
        .attr('opacity', hasHighlight ? (isHl ? 0.9 : 0.15) : 0.8)
        .style('cursor', 'pointer')
        .transition()
        .duration(600)
        .delay(Math.random() * 200)
        .attr('r', radiusScale(val));

      // Store for tooltip
      svg.select('circle:last-child')
        .on('mouseenter', (event) => {
          const [x, y] = d3.pointer(event, svg.node());
          setTooltip({ x: x + 12, y: y + 12, name: d.provinsi, value: val });
        })
        .on('mousemove', (event) => {
          const [x, y] = d3.pointer(event, svg.node());
          setTooltip({ x: x + 12, y: y + 12, name: d.provinsi, value: val });
        })
        .on('mouseleave', () => setTooltip(null));
    });

    // Legend
    const legendW = 200;
    const legendX = width - legendW - 24;
    const legendY = height - 42;
    const defs = svg.append('defs');
    const gradId = 'ps-grad';
    const grad = defs.append('linearGradient').attr('id', gradId).attr('x1', '0%').attr('x2', '100%');
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      grad.append('stop').attr('offset', `${t * 100}%`)
        .attr('stop-color', colorScale(extent[0]! + t * (extent[1]! - extent[0]!)));
    }
    svg.append('rect').attr('x', legendX).attr('y', legendY).attr('width', legendW).attr('height', 10)
      .attr('fill', `url(#${gradId})`).attr('stroke', '#e2e8ed').attr('stroke-width', 0.5);
    svg.append('text').attr('x', legendX).attr('y', legendY - 6)
      .style('font-size', '10px').style('fill', '#6b8294')
      .style('text-transform', 'uppercase').style('letter-spacing', '0.06em').text(metricLabel);
    svg.append('text').attr('x', legendX).attr('y', legendY + 24)
      .style('font-size', '10px').style('fill', '#6b8294').text(extent[0]!.toFixed(1));
    svg.append('text').attr('x', legendX + legendW).attr('y', legendY + 24)
      .attr('text-anchor', 'end').style('font-size', '10px').style('fill', '#6b8294').text(extent[1]!.toFixed(1));
  }, [geo, data, metric, metricLabel, highlighted, width, height]);

  return (
    <div className="relative">
      <svg ref={ref} width={width} height={height} className="d3-chart w-full h-auto rounded-lg" style={{ maxWidth: width }} />
      {tooltip && (
        <div className="map-tooltip visible" style={{ left: tooltip.x, top: tooltip.y }}>
          <div style={{ fontWeight: 600 }}>{tooltip.name}</div>
          <div style={{ color: '#a8b6c0' }}>{metricLabel}: <span style={{ color: '#fff', fontWeight: 600 }}>{tooltip.value.toFixed(1)}</span></div>
        </div>
      )}
    </div>
  );
}
