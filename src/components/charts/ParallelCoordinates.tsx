import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { ProvinceDatum } from '@/data/provinces';
import { INDICATOR_LABELS } from '@/lib/stats';

interface Props {
  data: ProvinceDatum[];
  variables: string[];
  highlighted: Set<string>;
  width?: number;
  height?: number;
}

interface TooltipData {
  x: number;
  y: number;
  provinsi: string;
  values: { key: string; label: string; value: number }[];
}

function formatAxisLabel(value: string) {
  const label = INDICATOR_LABELS[value] || value;
  const compact = label.replace(/per\s+/i, '/').replace(/\s+/g, ' ').trim();

  if (compact.length <= 11) return [{ text: compact }];

  const words = compact.split(' ');
  if (words.length > 1) {
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(' ');
    const line2 = words.slice(mid).join(' ');
    return [{ text: line1 }, { text: line2 }];
  }

  const splitAt = Math.ceil(compact.length / 2);
  return [{ text: compact.slice(0, splitAt) }, { text: compact.slice(splitAt) }];
}

export default function ParallelCoordinates({ data, variables, highlighted, width = 860, height = 460 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 44, bottom: 36, left: 52, right: 52 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const scales: d3.ScaleLinear<number, number>[] = variables.map(v => {
      const vals = data.map(d => d[v as keyof ProvinceDatum] as number);
      const ext = d3.extent(vals);
      const pad = (ext[1]! - ext[0]!) * 0.08;
      return d3.scaleLinear()
        .domain([ext[0]! - pad, ext[1]! + pad])
        .range([innerH, 0]);
    });

    const xScale = d3.scalePoint()
      .domain(variables)
      .range([0, innerW])
      .padding(0.5);

    // Gradient background band
    const banding = g.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', innerW).attr('height', innerH)
      .attr('fill', 'url(#pc-bg-grad)').attr('rx', 4).attr('opacity', 0.35);

    const defs = svg.append('defs');
    const bgGrad = defs.append('linearGradient').attr('id', 'pc-bg-grad')
      .attr('x1', '0%').attr('x2', '100%');
    bgGrad.append('stop').attr('offset', '0%').attr('stop-color', '#edf4f8');
    bgGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f4f7f4');

    // Axes for each variable
    variables.forEach((v, i) => {
      const axisG = g.append('g')
        .attr('transform', `translate(${xScale(v)},0)`)
        .call(d3.axisLeft(scales[i]).ticks(5).tickSize(4).tickPadding(4));

      axisG.selectAll('text').style('font-size', '10px').style('fill', '#6b8294');
      axisG.select('.domain').attr('stroke', '#c4cdd5').attr('stroke-width', 1.5);
      axisG.selectAll('.tick line').attr('stroke', '#c4cdd5');

      // Axis area highlight on hover
      const axisHitArea = g.append('rect')
        .attr('x', (xScale(v) ?? 0) - 20)
        .attr('y', 0)
        .attr('width', 40).attr('height', innerH)
        .attr('fill', 'transparent')
        .style('cursor', 'default');

      // Variable label
      const labelLines = formatAxisLabel(v);
      const labelG = g.append('g')
        .attr('transform', `translate(${xScale(v) ?? 0}, -10)`);

      // Label background
      const labelText = labelG.append('text')
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('font-weight', '700')
        .style('fill', '#14283b')
        .style('letter-spacing', '0.03em');

      labelLines.forEach((line, index) => {
        labelText.append('tspan')
          .attr('x', 0)
          .attr('dy', index === 0 ? 0 : 12)
          .text(line.text);
      });
    });

    const pathFor = (d: ProvinceDatum): string => {
      const pts: [number, number][] = variables.map((v, i) => [
        xScale(v) ?? 0,
        scales[i](d[v as keyof ProvinceDatum] as number),
      ]);
      return d3.line<[number, number]>().x(p => p[0]).y(p => p[1]).curve(d3.curveCatmullRom.alpha(0.5))(pts) || '';
    };

    const hasHighlight = highlighted.size > 0;

    // Non-highlighted lines
    const bgLines = g.selectAll('.pc-line-bg')
      .data(data.filter(d => !highlighted.has(d.provinsi)))
      .join('path')
      .attr('class', 'pc-line-bg')
      .attr('d', pathFor)
      .attr('fill', 'none')
      .attr('stroke', '#9ab0bd')
      .attr('stroke-width', 1)
      .attr('opacity', hasHighlight ? 0.12 : 0.4)
      .style('cursor', 'pointer');

    // Hover on non-highlighted lines
    bgLines
      .on('mouseenter', function (event, d) {
        if (highlighted.size > 0) return;
        d3.select(this).raise()
          .attr('stroke', '#1a7f8a').attr('stroke-width', 2).attr('opacity', 0.85);
        const [x, y] = d3.pointer(event, svg.node());
        const values = variables.map(v => ({
          key: v,
          label: INDICATOR_LABELS[v] || v,
          value: d[v as keyof ProvinceDatum] as number,
        }));
        setTooltip({ x: x + 14, y: y - 10, provinsi: d.provinsi, values });
      })
      .on('mousemove', function (event) {
        if (highlighted.size > 0) return;
        const [x, y] = d3.pointer(event, svg.node());
        setTooltip(prev => prev ? { ...prev, x: x + 14, y: y - 10 } : null);
      })
      .on('mouseleave', function () {
        if (highlighted.size > 0) return;
        d3.select(this).attr('stroke', '#9ab0bd').attr('stroke-width', 1).attr('opacity', hasHighlight ? 0.12 : 0.4);
        setTooltip(null);
      });

    // Highlighted lines
    const hlLines = g.selectAll('.pc-line-hl')
      .data(data.filter(d => highlighted.has(d.provinsi)))
      .join('path')
      .attr('class', 'pc-line-hl')
      .attr('d', pathFor)
      .attr('fill', 'none')
      .attr('stroke', '#1a7f8a')
      .attr('stroke-width', 2.2)
      .attr('opacity', 0.88)
      .style('cursor', 'pointer');

    // Hover on highlighted lines
    hlLines
      .on('mouseenter', function (event, d) {
        d3.select(this).raise().attr('stroke-width', 3.5).attr('opacity', 1);
        const [x, y] = d3.pointer(event, svg.node());
        const values = variables.map(v => ({
          key: v,
          label: INDICATOR_LABELS[v] || v,
          value: d[v as keyof ProvinceDatum] as number,
        }));
        setTooltip({ x: x + 14, y: y - 10, provinsi: d.provinsi, values });
      })
      .on('mousemove', function (event) {
        const [x, y] = d3.pointer(event, svg.node());
        setTooltip(prev => prev ? { ...prev, x: x + 14, y: y - 10 } : null);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke-width', 2.2).attr('opacity', 0.88);
        setTooltip(null);
      });

    // Dots at axis intersections for highlighted provinces
    if (highlighted.size > 0) {
      data.filter(d => highlighted.has(d.provinsi)).forEach(d => {
        variables.forEach((v, i) => {
          g.append('circle')
            .attr('cx', xScale(v) ?? 0)
            .attr('cy', scales[i](d[v as keyof ProvinceDatum] as number))
            .attr('r', 3.5)
            .attr('fill', '#1a7f8a')
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5)
            .style('pointer-events', 'none');
        });
      });
    }

  }, [data, variables, highlighted, width, height]);

  return (
    <div className="relative">
      <svg ref={ref} width={width} height={height} className="d3-chart w-full h-auto" style={{ maxWidth: width }} />
      {tooltip && (
        <div
          className="map-tooltip visible"
          style={{ left: Math.min(tooltip.x, width - 220), top: Math.max(tooltip.y, 8), minWidth: 190 }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 4 }}>
            {tooltip.provinsi}
          </div>
          {tooltip.values.map(({ key, label, value }) => (
            <div key={key} style={{ color: '#a8b6c0', fontSize: 11, lineHeight: 1.7 }}>
              {label}: <span style={{ color: '#fff', fontWeight: 600 }}>{value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
