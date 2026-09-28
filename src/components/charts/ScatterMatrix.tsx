import { useEffect, useRef, useState } from 'react';
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

interface TooltipData {
  x: number;
  y: number;
  provinsi: string;
  pulau: string;
  xLabel: string;
  yLabel: string;
  xValue: number;
  yValue: number;
}

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
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const vars = variables.slice(0, 5);
    const n = vars.length;
    const padX = 64;
    const padY = 30;
    const maxChartWidth = Math.min(width, 620);
    const cellSize = Math.min((maxChartWidth - padX) / n, 108);
    const cellW = cellSize;
    const cellH = cellSize;
    const [focusVarA, focusVarB] = focusPair ?? ['', ''];

    const hasHighlight = highlighted.size > 0;

    // Pre-compute correlation matrix for color coding diagonal
    const corrMatrix: number[][] = vars.map(xv =>
      vars.map(yv => pearson(
        data.map(d => d[xv as keyof ProvinceDatum] as number),
        data.map(d => d[yv as keyof ProvinceDatum] as number)
      ))
    );

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
          .attr('fill', isFocusedPair ? '#edf8f7' : (row === col ? '#f4f8fb' : '#fafbfc'))
          .attr('stroke', isFocusedPair ? '#1a7f8a' : '#dde5ec')
          .attr('stroke-width', isFocusedPair ? 1.8 : 0.6);

        if (row === col) {
          // Diagonal: variable name + self-correlation = 1
          const r = corrMatrix[row][col];
          
          // Color fill based on how strongly this var correlates with others
          const avgCorr = corrMatrix[row].reduce((s, v, c) => c !== row ? s + Math.abs(v) : s, 0) / (n - 1);
          
          cellG.append('text')
            .attr('x', cellW / 2).attr('y', cellH / 2 - 8)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', '700')
            .style('fill', avgCorr > 0.6 ? '#1a7f8a' : avgCorr > 0.4 ? '#e8a838' : '#6b8294')
            .text(avgCorr.toFixed(2));

          const diagLabelSmall = cellG.append('text')
            .attr('x', cellW / 2)
            .attr('y', cellH / 2 + 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '8.5px')
            .style('fill', '#9aabb7')
            .style('letter-spacing', '0.03em');

          const diagLabel = formatMatrixLabel(INDICATOR_LABELS[xVar] || xVar);
          diagLabel.forEach((line, idx) => {
            diagLabelSmall.append('tspan')
              .attr('x', cellW / 2)
              .attr('dy', idx === 0 ? 0 : 10)
              .text(line);
          });

          cellG.append('title').text(`Rata-rata korelasi ${INDICATOR_LABELS[xVar] || xVar} dengan variabel lain: ${avgCorr.toFixed(2)}`);

        } else {
          // Scatter
          const r = corrMatrix[row][col];

          // Subtle regression line
          const [xMin, xMax] = d3.extent(xVals) as [number, number];
          const meanX = d3.mean(xVals)!;
          const meanY = d3.mean(yVals)!;
          const slope = r * (d3.deviation(yVals)! / d3.deviation(xVals)!);
          const intercept = meanY - slope * meanX;
          const y0 = slope * xMin + intercept;
          const y1 = slope * xMax + intercept;

          if (Math.abs(r) > 0.3) {
            cellG.append('line')
              .attr('x1', xScale(xMin)).attr('x2', xScale(xMax))
              .attr('y1', yScale(y0)).attr('y2', yScale(y1))
              .attr('stroke', r > 0 ? '#1a7f8a' : '#e25d5d')
              .attr('stroke-width', 1.2)
              .attr('opacity', 0.35 + Math.abs(r) * 0.3)
              .attr('stroke-dasharray', '3,2')
              .style('pointer-events', 'none');
          }

          // Correlation badge
          if (cellW > 60) {
            const rColor = Math.abs(r) > 0.6 ? (r > 0 ? '#1a7f8a' : '#e25d5d') :
              Math.abs(r) > 0.3 ? '#e8a838' : '#c4cdd5';
            cellG.append('text')
              .attr('x', cellW - 4).attr('y', 10)
              .attr('text-anchor', 'end')
              .style('font-size', '8px')
              .style('font-weight', '700')
              .style('fill', rColor)
              .style('pointer-events', 'none')
              .text(`r=${r.toFixed(2)}`);
          }

          // Dots
          const dots = cellG.selectAll('.sm-dot')
            .data(data)
            .join('circle')
            .attr('class', 'sm-dot')
            .attr('cx', d => xScale(d[xVar as keyof ProvinceDatum] as number))
            .attr('cy', d => yScale(d[yVar as keyof ProvinceDatum] as number))
            .attr('r', d => highlighted.has(d.provinsi) ? 4.5 : 3)
            .attr('fill', d => PULAU_COLORS[d.pulau] || '#6b8294')
            .attr('opacity', d => hasHighlight ? (highlighted.has(d.provinsi) ? 0.92 : 0.12) : 0.65)
            .attr('stroke', d => highlighted.has(d.provinsi) ? 'white' : 'none')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer');

          // Hover interaction on dots
          dots
            .on('mouseenter', function (event, d) {
              d3.select(this).raise()
                .transition().duration(100)
                .attr('r', 6.5).attr('opacity', 1).attr('stroke-width', 1.5);
              const [ex, ey] = d3.pointer(event, svg.node());
              setTooltip({
                x: ex + 14, y: ey - 10,
                provinsi: d.provinsi,
                pulau: d.pulau,
                xLabel: INDICATOR_LABELS[xVar] || xVar,
                yLabel: INDICATOR_LABELS[yVar] || yVar,
                xValue: d[xVar as keyof ProvinceDatum] as number,
                yValue: d[yVar as keyof ProvinceDatum] as number,
              });
            })
            .on('mousemove', function (event) {
              const [ex, ey] = d3.pointer(event, svg.node());
              setTooltip(prev => prev ? { ...prev, x: ex + 14, y: ey - 10 } : null);
            })
            .on('mouseleave', function (_, d) {
              d3.select(this).transition().duration(100)
                .attr('r', highlighted.has(d.provinsi) ? 4.5 : 3)
                .attr('opacity', hasHighlight ? (highlighted.has(d.provinsi) ? 0.92 : 0.12) : 0.65)
                .attr('stroke-width', highlighted.has(d.provinsi) ? 1 : 0);
              setTooltip(null);
            });
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
    <div className="flex justify-center relative">
      <svg
        ref={ref}
        width={squareSize}
        height={matrixHeight}
        className="d3-chart block h-auto w-full"
        style={{ maxWidth: squareSize, overflow: 'visible', margin: '0 auto' }}
      />
      {tooltip && (
        <div
          className="map-tooltip visible"
          style={{ left: Math.min(tooltip.x, squareSize - 200), top: Math.max(tooltip.y, 8), minWidth: 190 }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{tooltip.provinsi}</div>
          <div style={{ color: '#a8b6c0', fontSize: 11 }}>
            Pulau: <span style={{ color: PULAU_COLORS[tooltip.pulau] || '#fff', fontWeight: 600 }}>{tooltip.pulau}</span>
          </div>
          <div style={{ marginTop: 5, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 5 }}>
            <div style={{ color: '#a8b6c0', fontSize: 11 }}>
              {tooltip.xLabel}: <span style={{ color: '#fff', fontWeight: 600 }}>{tooltip.xValue.toFixed(2)}</span>
            </div>
            <div style={{ color: '#a8b6c0', fontSize: 11 }}>
              {tooltip.yLabel}: <span style={{ color: '#fff', fontWeight: 600 }}>{tooltip.yValue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
