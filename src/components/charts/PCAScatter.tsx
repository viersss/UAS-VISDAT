import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { PcaResult, PcaSummary } from '@/lib/stats';
import { INDICATOR_LABELS } from '@/lib/stats';

interface Props {
  points: PcaResult[];
  summary: PcaSummary;
  width?: number;
  height?: number;
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
  pc1: number;
  pc2: number;
  highlighted: boolean;
}

export default function PCAScatter({ points, summary, width = 760, height = 520 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 216, bottom: 60, left: 68 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xExtent = d3.extent(points, d => d.pc1);
    const yExtent = d3.extent(points, d => d.pc2);
    const xPad = (xExtent[1]! - xExtent[0]!) * 0.15;
    const yPad = (yExtent[1]! - yExtent[0]!) * 0.15;

    const xScale = d3.scaleLinear()
      .domain([xExtent[0]! - xPad, xExtent[1]! + xPad])
      .range([0, innerW]);
    const yScale = d3.scaleLinear()
      .domain([yExtent[1]! + yPad, yExtent[0]! - yPad])
      .range([0, innerH]);

    // Background rect
    g.append('rect')
      .attr('width', innerW).attr('height', innerH)
      .attr('fill', '#f8fafc').attr('rx', 6)
      .attr('stroke', '#e2e8ed').attr('stroke-width', 0.5);

    // Grid lines
    const xTicks = xScale.ticks(6);
    const yTicks = yScale.ticks(6);
    xTicks.forEach(t => {
      g.append('line')
        .attr('x1', xScale(t)).attr('x2', xScale(t))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', '#e8edf2').attr('stroke-width', 0.8);
    });
    yTicks.forEach(t => {
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(t)).attr('y2', yScale(t))
        .attr('stroke', '#e8edf2').attr('stroke-width', 0.8);
    });

    // Axes
    g.append('g').attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(6).tickSize(0).tickPadding(8))
      .call(ax => ax.select('.domain').attr('stroke', '#dfe7ee'))
      .selectAll('text').style('font-size', '11px').style('fill', '#6b8294');

    g.append('g').attr('class', 'axis')
      .call(d3.axisLeft(yScale).ticks(6).tickSize(0).tickPadding(8))
      .call(ax => ax.select('.domain').attr('stroke', '#dfe7ee'))
      .selectAll('text').style('font-size', '11px').style('fill', '#6b8294');

    // Zero lines (principal axes)
    if (xScale(0) >= 0 && xScale(0) <= innerW) {
      g.append('line').attr('x1', xScale(0)).attr('x2', xScale(0))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', '#a8b6c0').attr('stroke-dasharray', '4,3').attr('stroke-width', 1.2)
        .attr('opacity', 0.7);
    }
    if (yScale(0) >= 0 && yScale(0) <= innerH) {
      g.append('line').attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(0)).attr('y2', yScale(0))
        .attr('stroke', '#a8b6c0').attr('stroke-dasharray', '4,3').attr('stroke-width', 1.2)
        .attr('opacity', 0.7);
    }

    // Quadrant labels
    const qStyle = { fontSize: '9px', fill: '#c4cdd5', fontWeight: '600', letterSpacing: '0.06em' };
    const qPad = 8;
    const midX = xScale(0);
    const midY = yScale(0);
    if (midX >= 0 && midX <= innerW && midY >= 0 && midY <= innerH) {
      [
        { x: midX + qPad, y: qPad + 12, label: 'Maju secara sosial' },
        { x: midX - qPad, y: qPad + 12, label: 'Campuran', anchor: 'end' },
        { x: midX + qPad, y: innerH - qPad, label: 'Tertinggal', anchor: 'start' },
        { x: midX - qPad, y: innerH - qPad, label: 'Ketimpangan tinggi', anchor: 'end' },
      ].forEach(({ x, y, label, anchor = 'start' }) => {
        g.append('text').attr('x', x).attr('y', y)
          .attr('text-anchor', anchor)
          .style('font-size', qStyle.fontSize).style('fill', qStyle.fill)
          .style('font-weight', qStyle.fontWeight)
          .style('letter-spacing', qStyle.letterSpacing)
          .style('pointer-events', 'none')
          .text(label);
      });
    }

    // Axis labels
    g.append('text')
      .attr('x', innerW / 2).attr('y', innerH + 48)
      .attr('text-anchor', 'middle').attr('class', 'axis-label')
      .text(`Komponen Utama 1 — ${summary.pc1Variance.toFixed(1)}% variansi`);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2).attr('y', -52)
      .attr('text-anchor', 'middle').attr('class', 'axis-label')
      .text(`Komponen Utama 2 — ${summary.pc2Variance.toFixed(1)}% variansi`);

    // Points
    const hasHighlight = points.some(p => p.highlighted);

    const circles = g.selectAll('.dot')
      .data(points)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.pc1))
      .attr('cy', d => yScale(d.pc2))
      .attr('r', 0)
      .attr('fill', d => PULAU_COLORS[d.pulau] || '#6b8294')
      .attr('opacity', d => hasHighlight ? (d.highlighted ? 0.95 : 0.2) : 0.78)
      .attr('stroke', d => d.highlighted ? '#14283b' : 'white')
      .attr('stroke-width', d => d.highlighted ? 1.8 : 0.8)
      .style('cursor', 'pointer');

    // Animate radius on mount
    circles.transition().duration(600)
      .delay((_, i) => i * 8)
      .attr('r', d => d.highlighted ? 8 : 5.5);

    // Hover interactions
    circles
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .raise()
          .transition().duration(120)
          .attr('r', d.highlighted ? 11 : 8)
          .attr('stroke-width', 2);
        const [x, y] = d3.pointer(event, svg.node());
        setTooltip({ x: x + 14, y: y - 10, provinsi: d.provinsi, pulau: d.pulau, pc1: d.pc1, pc2: d.pc2, highlighted: d.highlighted });
      })
      .on('mousemove', function (event) {
        const [x, y] = d3.pointer(event, svg.node());
        setTooltip(prev => prev ? { ...prev, x: x + 14, y: y - 10 } : null);
      })
      .on('mouseleave', function (_, d) {
        d3.select(this)
          .transition().duration(120)
          .attr('r', d.highlighted ? 8 : 5.5)
          .attr('stroke-width', d.highlighted ? 1.8 : 0.8);
        setTooltip(null);
      });

    // Labels for highlighted points
    g.selectAll('.label')
      .data(points.filter(p => p.highlighted))
      .join('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.pc1) + 12)
      .attr('y', d => yScale(d.pc2) - 10)
      .style('font-size', '11px')
      .style('font-weight', '700')
      .style('fill', '#14283b')
      .style('paint-order', 'stroke')
      .style('stroke', 'white')
      .style('stroke-width', '3px')
      .style('pointer-events', 'none')
      .text(d => d.provinsi);

    // Define drop shadow filter in svg defs
    const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
    if (defs.select('#pca-legend-shadow').empty()) {
      const filter = defs.append('filter')
        .attr('id', 'pca-legend-shadow')
        .attr('x', '-10%').attr('y', '-10%')
        .attr('width', '130%').attr('height', '130%');
      filter.append('feDropShadow')
        .attr('dx', '0')
        .attr('dy', '3')
        .attr('stdDeviation', '5')
        .attr('flood-color', '#0f172a')
        .attr('flood-opacity', '0.06');
    }

    // Legend panel
    const legendW = 180;
    const itemH = 26;
    const headerH = 34;
    const pulauList = Object.keys(PULAU_COLORS);
    const legendH = headerH + pulauList.length * itemH + 8;
    const legendX = width - legendW - 14;

    const pulauCounts = points.reduce((acc, p) => {
      acc[p.pulau] = (acc[p.pulau] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const legend = svg.append('g')
      .attr('class', 'chart-legend')
      .attr('transform', `translate(${legendX}, ${margin.top + 6})`);

    // Legend background card
    legend.append('rect')
      .attr('width', legendW)
      .attr('height', legendH)
      .attr('rx', 10)
      .attr('fill', '#ffffff')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
      .style('filter', 'url(#pca-legend-shadow)');

    // Header label
    legend.append('text')
      .attr('x', 14)
      .attr('y', 21)
      .style('font-family', 'inherit')
      .style('font-size', '9.5px')
      .style('font-weight', '700')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.08em')
      .style('fill', '#64748b')
      .text('Kelompok Pulau');

    // Header count badge
    legend.append('text')
      .attr('x', legendW - 14)
      .attr('y', 21)
      .attr('text-anchor', 'end')
      .style('font-family', 'inherit')
      .style('font-size', '9.5px')
      .style('font-weight', '600')
      .style('fill', '#94a3b8')
      .text(`${points.length} Prov`);

    // Divider line
    legend.append('line')
      .attr('x1', 12)
      .attr('x2', legendW - 12)
      .attr('y1', 31)
      .attr('y2', 31)
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1);

    // Rows
    pulauList.forEach((pulau, i) => {
      const count = pulauCounts[pulau] || 0;
      const rowY = headerH + i * itemH + 2;

      const row = legend.append('g')
        .attr('transform', `translate(8, ${rowY})`)
        .style('cursor', 'pointer');

      // Row hover target / background pill
      const rowBg = row.append('rect')
        .attr('width', legendW - 16)
        .attr('height', itemH - 2)
        .attr('rx', 6)
        .attr('fill', 'transparent')
        .style('transition', 'fill 0.15s ease');

      // Island color dot (with subtle ring)
      row.append('circle')
        .attr('cx', 12)
        .attr('cy', (itemH - 2) / 2)
        .attr('r', 5)
        .attr('fill', PULAU_COLORS[pulau])
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.2);

      // Island name
      row.append('text')
        .attr('x', 24)
        .attr('y', (itemH - 2) / 2)
        .attr('dominant-baseline', 'central')
        .style('font-family', 'inherit')
        .style('font-size', '11.5px')
        .style('font-weight', '500')
        .style('fill', '#334155')
        .text(pulau);

      // Count badge
      row.append('text')
        .attr('x', legendW - 24)
        .attr('y', (itemH - 2) / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'central')
        .style('font-family', 'inherit')
        .style('font-size', '10.5px')
        .style('font-weight', '600')
        .style('fill', '#94a3b8')
        .text(count);

      // Interactive hover
      row
        .on('mouseenter', () => {
          rowBg.attr('fill', '#f1f5f9');
          circles.transition().duration(120)
            .attr('opacity', d => d.pulau === pulau ? 1 : 0.12)
            .attr('r', d => d.pulau === pulau ? (d.highlighted ? 9 : 7) : (d.highlighted ? 6 : 4));
        })
        .on('mouseleave', () => {
          rowBg.attr('fill', 'transparent');
          circles.transition().duration(120)
            .attr('opacity', d => hasHighlight ? (d.highlighted ? 0.95 : 0.2) : 0.78)
            .attr('r', d => d.highlighted ? 8 : 5.5);
        });
    });

  }, [points, summary, width, height]);

  return (
    <div className="relative w-full">
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="d3-chart block w-full h-auto"
        style={{ maxWidth: width, overflow: 'visible' }}
      />
      {tooltip && (
        <div
          className="map-tooltip visible"
          style={{
            left: Math.min(tooltip.x, width - 200),
            top: Math.max(tooltip.y, 8),
            minWidth: 170,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{tooltip.provinsi}</div>
          <div style={{ color: '#a8b6c0', fontSize: 11.5 }}>
            Pulau: <span style={{ color: PULAU_COLORS[tooltip.pulau] || '#fff', fontWeight: 600 }}>{tooltip.pulau}</span>
          </div>
          <div style={{ color: '#a8b6c0', fontSize: 11.5 }}>
            PC1: <span style={{ color: '#fff', fontWeight: 600 }}>{tooltip.pc1.toFixed(3)}</span>
          </div>
          <div style={{ color: '#a8b6c0', fontSize: 11.5 }}>
            PC2: <span style={{ color: '#fff', fontWeight: 600 }}>{tooltip.pc2.toFixed(3)}</span>
          </div>
          {tooltip.highlighted && (
            <div style={{ marginTop: 4, fontSize: 10, color: '#4ade80', fontWeight: 600 }}>● Provinsi dipilih</div>
          )}
        </div>
      )}
    </div>
  );
}
