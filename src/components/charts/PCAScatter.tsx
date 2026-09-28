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

    const margin = { top: 40, right: 240, bottom: 60, left: 68 };
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

    // Legend panel
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 22}, ${margin.top + 6})`);

    // Legend background
    legend.append('rect')
      .attr('width', 175).attr('height', 200)
      .attr('rx', 8)
      .attr('fill', 'white').attr('opacity', 0.85)
      .attr('stroke', '#e2e8ed').attr('stroke-width', 0.8);

    legend.append('text')
      .attr('x', 12).attr('y', 20)
      .style('font-size', '9.5px')
      .style('font-weight', '700')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.1em')
      .style('fill', '#6b8294')
      .text('Kelompok Pulau');

    const pulauList = Object.keys(PULAU_COLORS);
    pulauList.forEach((pulau, i) => {
      const row = legend.append('g').attr('transform', `translate(12, ${i * 22 + 34})`);
      row.append('circle').attr('r', 5.5).attr('fill', PULAU_COLORS[pulau]).attr('opacity', 0.85);
      row.append('text').attr('x', 16).attr('y', 4.5)
        .style('font-size', '11.5px').style('fill', '#3b5567').text(pulau);
    });

    // Variance bar
    const varG = legend.append('g').attr('transform', `translate(12, ${pulauList.length * 22 + 44})`);
    varG.append('text').attr('y', 0).style('font-size', '9px').style('fill', '#6b8294')
      .style('text-transform', 'uppercase').style('letter-spacing', '0.08em').text('Total Variansi Dijelaskan');
    varG.append('rect').attr('y', 6).attr('width', 150).attr('height', 6)
      .attr('rx', 3).attr('fill', '#e2e8ed');
    varG.append('rect').attr('y', 6)
      .attr('width', 150 * summary.totalVariance / 100).attr('height', 6)
      .attr('rx', 3).attr('fill', '#1a7f8a').attr('opacity', 0.8);
    varG.append('text').attr('y', 22).style('font-size', '12px')
      .style('font-weight', '700').style('fill', '#1a7f8a')
      .text(`${summary.totalVariance.toFixed(1)}%`);

  }, [points, summary, width, height]);

  return (
    <div className="relative">
      <svg ref={ref} width={width} height={height} className="d3-chart w-full h-auto" style={{ maxWidth: width }} />
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
