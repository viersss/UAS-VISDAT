import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ProvinceDatum } from '@/data/provinces';
import { INDICATOR_LABELS, pearson } from '@/lib/stats';

interface Props {
  data: ProvinceDatum[];
  variables: string[];
  highlighted: Set<string>;
  focusPair?: [string, string] | null;
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

function formatMatrixLabel(label: string) {
  const clean = label.replace(/\s+/g, ' ').trim();
  if (clean.length <= 10) return [clean];

  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= 10 || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 2);
}

export default function ScatterMatrix({ data, variables, highlighted, focusPair = null, width = 720 }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const vars = variables.slice(0, 5);
    const n = vars.length;
    const padX = 62;
    const padY = 28;
    const maxChartWidth = Math.min(width, 620);
    const cellSize = Math.min((maxChartWidth - padX) / n, 108);
    const cellW = cellSize;
    const cellH = cellSize;
    const [focusVarA, focusVarB] = focusPair ?? ['', ''];

    const hasHighlight = highlighted.size > 0;

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const xVar = vars[col];
        const yVar = vars[row];
        const xVals = data.map(d => d[xVar as keyof ProvinceDatum] as number);
        const yVals = data.map(d => d[yVar as keyof ProvinceDatum] as number);
        const xScale = d3.scaleLinear().domain(d3.extent(xVals) as [number, number]).nice().range([8, cellW - 8]);
        const yScale = d3.scaleLinear().domain(d3.extent(yVals) as [number, number]).nice().range([cellH - 8, 8]);
        const isFocusedPair = Boolean(focusVarA && focusVarB) && (
          (xVar === focusVarA && yVar === focusVarB) ||
          (xVar === focusVarB && yVar === focusVarA)
        );

        const cellG = svg.append('g')
          .attr('transform', `translate(${padX + col * cellW}, ${padY + row * cellH})`);

        // Cell border
        cellG.append('rect')
          .attr('width', cellW).attr('height', cellH)
          .attr('fill', isFocusedPair ? '#f0fdf4' : '#fafbfc')
          .attr('stroke', isFocusedPair ? '#1a7f8a' : '#e2e8ed')
          .attr('stroke-width', isFocusedPair ? 1.5 : 0.5);

        if (row === col) {
          // Diagonal: correlation value with variable label
          const r = pearson(xVals, yVals);
          const diagonalValue = r.toFixed(2);
          cellG.append('text')
            .attr('x', cellW / 2).attr('y', cellH / 2 - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', '700')
            .style('fill', Math.abs(r) > 0.6 ? '#1a7f8a' : '#6b8294')
            .text(diagonalValue);

          cellG.append('title').text(`Korelasi ${INDICATOR_LABELS[xVar] || xVar} dengan dirinya sendiri: ${diagonalValue}. Nilai 1.00 berarti korelasi sempurna.`);

          const labelText = cellG.append('text')
            .attr('x', cellW / 2)
            .attr('y', cellH / 2 + 12)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('fill', '#6b8294')
            .style('letter-spacing', '0.04em');

          const diagLabel = formatMatrixLabel(INDICATOR_LABELS[xVar] || xVar);
          diagLabel.forEach((line, idx) => {
            labelText.append('tspan')
              .attr('x', cellW / 2)
              .attr('dy', idx === 0 ? 0 : 10)
              .text(line);
          });
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
          const bottomLabel = cellG.append('text')
            .attr('x', cellW / 2)
            .attr('y', cellH + 14)
            .attr('text-anchor', 'middle')
            .style('font-size', '8.5px')
            .style('fill', '#6b8294')
            .style('letter-spacing', '0.04em');

          const labelLines = formatMatrixLabel(INDICATOR_LABELS[xVar] || xVar);
          labelLines.forEach((line, idx) => {
            bottomLabel.append('tspan')
              .attr('x', cellW / 2)
              .attr('dy', idx === 0 ? 0 : 10)
              .text(line);
          });
        }
        if (col === 0) {
          const leftLabel = cellG.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -cellH / 2)
            .attr('y', -8)
            .attr('text-anchor', 'middle')
            .style('font-size', '8.5px')
            .style('fill', '#6b8294')
            .style('letter-spacing', '0.04em');

          const labelLines = formatMatrixLabel(INDICATOR_LABELS[yVar] || yVar);
          labelLines.forEach((line, idx) => {
            leftLabel.append('tspan')
              .attr('x', -cellH / 2)
              .attr('dy', idx === 0 ? 0 : 10)
              .text(line);
          });
        }
      }
    }
  }, [data, variables, highlighted, focusPair, width]);

  const squareSize = Math.min(Math.max(520, width * 0.72), 620);
  const matrixHeight = Math.min(420, 5 * 100 + 90);

  return (
    <div className="flex justify-center">
      <svg
        ref={ref}
        width={squareSize}
        height={matrixHeight}
        className="d3-chart block h-auto w-full"
        style={{ maxWidth: squareSize, overflow: 'visible', margin: '0 auto' }}
      />
    </div>
  );
}
