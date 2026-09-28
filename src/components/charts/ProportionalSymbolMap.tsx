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

interface TooltipData {
  x: number;
  y: number;
  name: string;
  value: number;
  rank: number;
}

export default function ProportionalSymbolMap({ geo, data, metric, metricLabel, highlighted, width = 800, height = 460 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const centroids = buildProvinceCentroids(geo);
    const projection = d3.geoMercator().fitSize([width, height], geo as unknown as d3.GeoPermissibleObjects);

    const values = data.map(d => d[metric as keyof ProvinceDatum] as number);
    const extent = d3.extent(values);

    // Rank provinces
    const sorted = [...data].sort((a, b) =>
      (b[metric as keyof ProvinceDatum] as number) - (a[metric as keyof ProvinceDatum] as number)
    );
    const rankMap = new Map(sorted.map((d, i) => [d.provinsi, i + 1]));

    const radiusScale = d3.scaleSqrt()
      .domain([extent[0]!, extent[1]!])
      .range([4, 24]);

    // Sequential color: warm blues → deeper for larger
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([extent[0]!, extent[1]!]);

    const pathGen = d3.geoPath(projection);

    // Ocean gradient background
    const defs = svg.append('defs');
    const oceanGrad = defs.append('linearGradient').attr('id', 'ps-ocean-grad')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    oceanGrad.append('stop').attr('offset', '0%').attr('stop-color', '#dcedf5');
    oceanGrad.append('stop').attr('offset', '100%').attr('stop-color', '#e8f2f6');

    svg.append('rect')
      .attr('width', width).attr('height', height)
      .attr('fill', 'url(#ps-ocean-grad)');

    // Province outlines
    svg.selectAll('.outline')
      .data(geo.features)
      .join('path')
      .attr('class', 'outline')
      .attr('d', pathGen as unknown as (d: unknown) => string)
      .attr('fill', '#e2eaee')
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.75);

    const hasHighlight = highlighted.size > 0;

    // Symbol glows for highlighted
    data.forEach(d => {
      const c = centroids.get(d.provinsi);
      if (!c) return;
      const [px, py] = projection(c)!;
      const val = d[metric as keyof ProvinceDatum] as number;
      const isHl = highlighted.has(d.provinsi);
      if (!isHl || !hasHighlight) return;

      svg.append('circle')
        .attr('cx', px).attr('cy', py)
        .attr('r', radiusScale(val) + 6)
        .attr('fill', 'rgba(26, 127, 138, 0.18)')
        .attr('stroke', 'none')
        .style('pointer-events', 'none');
    });

    // Symbols
    data.forEach(d => {
      const c = centroids.get(d.provinsi);
      if (!c) return;
      const [px, py] = projection(c)!;
      const val = d[metric as keyof ProvinceDatum] as number;
      const isHl = highlighted.has(d.provinsi);
      const rank = rankMap.get(d.provinsi) ?? 0;

      const circle = svg.append('circle')
        .attr('cx', px).attr('cy', py)
        .attr('r', 0)
        .attr('fill', colorScale(val))
        .attr('stroke', isHl ? '#14283b' : 'rgba(255,255,255,0.85)')
        .attr('stroke-width', isHl ? 2 : 1)
        .attr('opacity', hasHighlight ? (isHl ? 0.95 : 0.18) : 0.82)
        .style('cursor', 'pointer');

      circle.transition()
        .duration(650)
        .delay(Math.random() * 180)
        .ease(d3.easeCubicOut)
        .attr('r', radiusScale(val));

      // Hover events after transition
      circle
        .on('mouseenter', function (event) {
          d3.select(this).raise()
            .transition().duration(120)
            .attr('r', radiusScale(val) * 1.35)
            .attr('stroke-width', 2.5)
            .attr('opacity', 1);
          const [x, y] = d3.pointer(event, svg.node());
          const safeX = x + 14 + 180 > width ? x - 194 : x + 14;
          const safeY = y + 14 + 80 > height ? y - 90 : y + 14;
          setTooltip({ x: safeX, y: safeY, name: d.provinsi, value: val, rank });
        })
        .on('mousemove', function (event) {
          const [x, y] = d3.pointer(event, svg.node());
          const safeX = x + 14 + 180 > width ? x - 194 : x + 14;
          const safeY = y + 14 + 80 > height ? y - 90 : y + 14;
          setTooltip(prev => prev ? { ...prev, x: safeX, y: safeY } : null);
        })
        .on('mouseleave', function () {
          d3.select(this)
            .transition().duration(120)
            .attr('r', radiusScale(val))
            .attr('stroke-width', isHl ? 2 : 1)
            .attr('opacity', hasHighlight ? (isHl ? 0.95 : 0.18) : 0.82);
          setTooltip(null);
        });
    });

    // Legend
    const legendX = width - 224;
    const legendY = height - 58;

    const gradId = 'ps-grad';
    const grad = defs.append('linearGradient').attr('id', gradId).attr('x1', '0%').attr('x2', '100%');
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      grad.append('stop').attr('offset', `${t * 100}%`)
        .attr('stop-color', colorScale(extent[0]! + t * (extent[1]! - extent[0]!)));
    }

    // Legend background panel
    svg.append('rect')
      .attr('x', legendX - 10).attr('y', legendY - 26)
      .attr('width', 214).attr('height', 58)
      .attr('rx', 6)
      .attr('fill', 'white').attr('opacity', 0.85)
      .attr('stroke', '#e2e8ed').attr('stroke-width', 0.5);

    svg.append('rect').attr('x', legendX).attr('y', legendY)
      .attr('width', 190).attr('height', 10)
      .attr('rx', 3)
      .attr('fill', `url(#${gradId})`);

    svg.append('text').attr('x', legendX).attr('y', legendY - 12)
      .style('font-size', '9.5px').style('fill', '#6b8294')
      .style('font-weight', '700')
      .style('text-transform', 'uppercase').style('letter-spacing', '0.07em').text(metricLabel);

    svg.append('text').attr('x', legendX).attr('y', legendY + 24)
      .style('font-size', '10px').style('fill', '#6b8294').text(extent[0]!.toFixed(1));

    svg.append('text').attr('x', legendX + 190).attr('y', legendY + 24)
      .attr('text-anchor', 'end').style('font-size', '10px').style('fill', '#6b8294').text(extent[1]!.toFixed(1));

    // Size legend bubbles (top, small)
    const sizeRef = [extent[0]!, (extent[0]! + extent[1]!) / 2, extent[1]!];
    const sizeLegendX = 20;
    const sizeLegendY = height - 40;
    svg.append('rect')
      .attr('x', sizeLegendX - 8).attr('y', sizeLegendY - 28)
      .attr('width', 110).attr('height', 36)
      .attr('rx', 5)
      .attr('fill', 'white').attr('opacity', 0.85)
      .attr('stroke', '#e2e8ed').attr('stroke-width', 0.5);

    let bubbleX = sizeLegendX + 10;
    sizeRef.forEach((v, idx) => {
      const r = radiusScale(v);
      svg.append('circle')
        .attr('cx', bubbleX).attr('cy', sizeLegendY - 8)
        .attr('r', r)
        .attr('fill', '#1a7f8a').attr('opacity', 0.35)
        .attr('stroke', '#1a7f8a').attr('stroke-width', 1);
      if (idx === 0 || idx === sizeRef.length - 1) {
        svg.append('text')
          .attr('x', bubbleX).attr('y', sizeLegendY + 4)
          .attr('text-anchor', 'middle')
          .style('font-size', '8.5px').style('fill', '#6b8294')
          .text(v.toFixed(0));
      }
      bubbleX += r + 10 + (idx < sizeRef.length - 1 ? sizeRef.map(radiusScale)[idx + 1] : 0);
    });

  }, [geo, data, metric, metricLabel, highlighted, width, height]);

  return (
    <div className="relative">
      <svg ref={ref} width={width} height={height} className="d3-chart w-full h-auto rounded-lg" style={{ maxWidth: width }} />
      {tooltip && (
        <div className="map-tooltip visible" style={{ left: tooltip.x, top: tooltip.y, minWidth: 168 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{tooltip.name}</div>
          <div style={{ color: '#a8b6c0', fontSize: 11.5 }}>
            {metricLabel}: <span style={{ color: '#fff', fontWeight: 700 }}>{tooltip.value.toFixed(1)}</span>
          </div>
          <div style={{ color: '#a8b6c0', fontSize: 11, marginTop: 2 }}>
            Peringkat: <span style={{ color: '#e8a838', fontWeight: 600 }}>#{tooltip.rank}</span> dari {data.length}
          </div>
        </div>
      )}
    </div>
  );
}
