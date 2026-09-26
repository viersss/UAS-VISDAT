import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ProvinceDatum } from '@/data/provinces';
import { INDICATOR_LABELS, pearson } from '@/lib/stats';

interface Props {
  data: ProvinceDatum[];
  variables: string[];
  highlighted: Set<string>;
  width?: number;
}

const PULAU_COLORS: Record<string, string> = {
  'Sumatera': '#d97742',
  'Jawa': '#1a7f8a',
  'Bali-Nusa': '#8b5cf6',
  'Kalimantan': '#e8a838',
  'Sulawesi': '#3b82f6',
  'Maluku-Papua': '#ec5f5f',
};

export default function ScatterMatrix({ data, variables, highlighted, width = 720 }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const vars = variables.slice(0, 5);
    const n = vars.length;
    const pad = 70;
    const cellW = Math.max(90, (width - pad) / n);
    const cellH = cellW;
    const height = cellH * n + pad;
    const labelH = 36;

    const hasHighlight = highlighted.size > 0;

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const xVar = vars[col];
        const yVar = vars[row];
        const xVals = data.map(d => d[xVar as keyof ProvinceDatum] as number);
        const yVals = data.map(d => d[yVar as keyof ProvinceDatum] as number);
        const xScale = d3.scaleLinear().domain(d3.extent(xVals) as [number, number]).nice().range([8, cellW - 8]);
        const yScale = d3.scaleLinear().domain(d3.extent(yVals) as [number, number]).nice().range([cellH - 8, 8]);

        const cellG = svg.append('g')
          .attr('transform', `translate(${pad + col * cellW}, ${labelH + row * cellH})`);

        // Cell border
        cellG.append('rect')
          .attr('width', cellW).attr('height', cellH)
          .attr('fill', '#fafbfc')
          .attr('stroke', '#e2e8ed').attr('stroke-width', 0.5);

        if (row === col) {
          // Diagonal: correlation value with variable label
          const r = pearson(xVals, yVals);
          cellG.append('text')
            .attr('x', cellW / 2).attr('y', cellH / 2 - 6)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', '700')
            .style('fill', Math.abs(r) > 0.6 ? '#1a7f8a' : '#6b8294')
            .text(r.toFixed(2));
          cellG.append('text')
            .attr('x', cellW / 2).attr('y', cellH / 2 + 16)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('fill', '#6b8294')
            .style('text-transform', 'uppercase')
            .style('letter-spacing', '0.06em')
            .text(INDICATOR_LABELS[xVar] || xVar);
        } else {
          // Scatter
          // Grid lines
          const ticks = 3;
          for (let t = 0; t <= ticks; t++) {
            const xv = xScale.invert(8 + (t / ticks) * (cellW - 16));
            cellG.append('line')
              .attr('x1', xScale(xv)).attr('x2', xScale(xv))
              .attr('y1', 0).attr('y2', cellH)
              .attr('stroke', '#eef2f5').attr('stroke-width', 0.5);
          }

          cellG.selectAll('.sm-dot')
            .data(data)
            .join('circle')
            .attr('class', 'sm-dot')
            .attr('cx', d => xScale(d[xVar as keyof ProvinceDatum] as number))
            .attr('cy', d => yScale(d[yVar as keyof ProvinceDatum] as number))
            .attr('r', d => highlighted.has(d.provinsi) ? 4 : 3)
            .attr('fill', d => PULAU_COLORS[d.pulau] || '#6b8294')
            .attr('opacity', d => hasHighlight ? (highlighted.has(d.provinsi) ? 0.9 : 0.15) : 0.6);
        }

        // Axis labels
        if (row === n - 1) {
          cellG.append('text')
            .attr('x', cellW / 2).attr('y', cellH + 14)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('fill', '#6b8294')
            .style('text-transform', 'uppercase')
            .style('letter-spacing', '0.04em')
            .text(INDICATOR_LABELS[xVar] || xVar);
        }
        if (col === 0) {
          cellG.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -cellH / 2).attr('y', -8)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('fill', '#6b8294')
            .style('text-transform', 'uppercase')
            .style('letter-spacing', '0.04em')
            .text(INDICATOR_LABELS[yVar] || yVar);
        }
      }
    }
  }, [data, variables, highlighted, width]);

  return (
    <svg ref={ref} width={width} className="d3-chart w-full h-auto" style={{ maxWidth: width }} />
  );
}
