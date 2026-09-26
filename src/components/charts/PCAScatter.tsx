import { useEffect, useRef } from 'react';
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

export default function PCAScatter({ points, summary, width = 760, height = 520 }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 240, bottom: 55, left: 60 };
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

    // Grid
    g.append('g').attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(6).tickSize(-innerH).tickFormat(d => `${d}`))
      .selectAll('text').style('font-size', '11px');

    g.append('g').attr('class', 'axis')
      .call(d3.axisLeft(yScale).ticks(6).tickSize(-innerW).tickFormat(d => `${d}`))
      .selectAll('text').style('font-size', '11px');

    // Zero lines
    if (xScale(0) >= 0 && xScale(0) <= innerW) {
      g.append('line').attr('x1', xScale(0)).attr('x2', xScale(0))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', '#cbd5dd').attr('stroke-dasharray', '3,3').attr('stroke-width', 1);
    }
    if (yScale(0) >= 0 && yScale(0) <= innerH) {
      g.append('line').attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(0)).attr('y2', yScale(0))
        .attr('stroke', '#cbd5dd').attr('stroke-dasharray', '3,3').attr('stroke-width', 1);
    }

    // Axis labels
    g.append('text')
      .attr('x', innerW / 2).attr('y', innerH + 42)
      .attr('text-anchor', 'middle').attr('class', 'axis-label')
      .text(`Komponen Utama 1 (${summary.pc1Variance.toFixed(1)}%)`);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2).attr('y', -42)
      .attr('text-anchor', 'middle').attr('class', 'axis-label')
      .text(`Komponen Utama 2 (${summary.pc2Variance.toFixed(1)}%)`);

    // Points
    const hasHighlight = points.some(p => p.highlighted);

    g.selectAll('.dot')
      .data(points)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.pc1))
      .attr('cy', d => yScale(d.pc2))
      .attr('r', d => d.highlighted ? 7 : 5)
      .attr('fill', d => PULAU_COLORS[d.pulau] || '#6b8294')
      .attr('opacity', d => hasHighlight ? (d.highlighted ? 0.95 : 0.2) : 0.75)
      .attr('stroke', d => d.highlighted ? '#14283b' : 'none')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .style('transition', 'opacity 0.3s ease');

    // Labels for highlighted points
    g.selectAll('.label')
      .data(points.filter(p => p.highlighted))
      .join('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.pc1) + 10)
      .attr('y', d => yScale(d.pc2) - 8)
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#14283b')
      .text(d => d.provinsi);

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 20}, ${margin.top + 10})`);

    const pulauList = ['Sumatera', 'Jawa', 'Bali-Nusa', 'Kalimantan', 'Sulawesi', 'Maluku-Papua'];
    legend.append('text')
      .attr('y', -6)
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.08em')
      .style('fill', '#6b8294')
      .text('Pulau');

    pulauList.forEach((pulau, i) => {
      const row = legend.append('g').attr('transform', `translate(0, ${i * 20 + 8})`);
      row.append('circle')
        .attr('r', 5)
        .attr('fill', PULAU_COLORS[pulau])
        .attr('opacity', 0.8);
      row.append('text')
        .attr('x', 14).attr('y', 4)
        .style('font-size', '11px')
        .style('fill', '#3b5567')
        .text(pulau);
    });

    // Variance explained
    legend.append('g').attr('transform', `translate(0, ${pulauList.length * 20 + 24})`)
      .append('text')
      .style('font-size', '11px')
      .style('fill', '#6b8294')
      .text(`Total variansi: ${summary.totalVariance.toFixed(1)}%`);
  }, [points, summary, width, height]);

  return (
    <svg ref={ref} width={width} height={height} className="d3-chart w-full h-auto" style={{ maxWidth: width }} />
  );
}
