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

export default function ChoroplethMap({ geo, data, metric, metricLabel, highlighted, width = 800, height = 460 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; value: number } | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const dataMap = new Map(data.map(d => [d.provinsi, d]));
    const values = data.map(d => d[metric as keyof ProvinceDatum] as number);
    const extent = d3.extent(values);
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([extent[0]!, extent[1]!]);

    const projection = d3.geoMercator().fitSize([width, height], geo as unknown as d3.GeoPermissibleObjects);
    const pathGen = d3.geoPath(projection);

    // Ocean background
    svg.append('rect')
      .attr('width', width).attr('height', height)
      .attr('fill', '#f0f4f6');

    // Province paths
    geo.features.forEach(feat => {
      const provinsi = normalizeProvinceName(feat.properties.Propinsi);
      const datum = dataMap.get(provinsi);
      const isHighlight = highlighted.has(provinsi);
      const fill = datum ? colorScale(datum[metric as keyof ProvinceDatum] as number) : '#e8edf0';

      svg.append('path')
        .datum(feat)
        .attr('d', pathGen as unknown as (d: unknown) => string)
        .attr('fill', fill)
        .attr('stroke', isHighlight ? '#14283b' : '#ffffff')
        .attr('stroke-width', isHighlight ? 1.5 : 0.5)
        .attr('opacity', highlighted.size > 0 ? (isHighlight ? 1 : 0.35) : 0.9)
        .style('cursor', 'pointer')
        .on('mouseenter', (event) => {
          if (datum) {
            const [x, y] = d3.pointer(event, svg.node());
            setTooltip({ x: x + 12, y: y + 12, name: provinsi, value: datum[metric as keyof ProvinceDatum] as number });
          }
        })
        .on('mousemove', (event) => {
          if (datum) {
            const [x, y] = d3.pointer(event, svg.node());
            setTooltip({ x: x + 12, y: y + 12, name: provinsi, value: datum[metric as keyof ProvinceDatum] as number });
          }
        })
        .on('mouseleave', () => setTooltip(null));
    });

    // Color legend
    const legendW = 200;
    const legendH = 10;
    const legendX = width - legendW - 24;
    const legendY = height - 42;

    const defs = svg.append('defs');
    const gradId = 'map-grad';
    const grad = defs.append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%').attr('x2', '100%');
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      grad.append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', colorScale(extent[0]! + t * (extent[1]! - extent[0]!)));
    }

    svg.append('rect')
      .attr('x', legendX).attr('y', legendY)
      .attr('width', legendW).attr('height', legendH)
      .attr('fill', `url(#${gradId})`)
      .attr('stroke', '#e2e8ed').attr('stroke-width', 0.5);

    svg.append('text')
      .attr('x', legendX).attr('y', legendY - 6)
      .style('font-size', '10px').style('fill', '#6b8294')
      .style('text-transform', 'uppercase').style('letter-spacing', '0.06em')
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
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div style={{ fontWeight: 600 }}>{tooltip.name}</div>
          <div style={{ color: '#a8b6c0' }}>{metricLabel}: <span style={{ color: '#fff', fontWeight: 600 }}>{tooltip.value.toFixed(1)}</span></div>
        </div>
      )}
    </div>
  );
}
