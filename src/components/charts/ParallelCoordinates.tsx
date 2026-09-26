import { useEffect, useRef } from 'react';
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

export default function ParallelCoordinates({ data, variables, highlighted, width = 860, height = 440 }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 35, bottom: 30, left: 50, right: 50 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const scales: d3.ScaleLinear<number, number>[] = variables.map(v => {
      const vals = data.map(d => d[v as keyof ProvinceDatum] as number);
      const ext = d3.extent(vals);
      const pad = (ext[1]! - ext[0]!) * 0.1;
      return d3.scaleLinear()
        .domain([ext[0]! - pad, ext[1]! + pad])
        .range([innerH, 0]);
    });

    const xScale = d3.scalePoint()
      .domain(variables)
      .range([0, innerW])
      .padding(0.5);

    // Axes for each variable
    variables.forEach((v, i) => {
      const axisG = g.append('g')
        .attr('transform', `translate(${xScale(v)},0)`)
        .call(d3.axisLeft(scales[i]).ticks(5).tickSize(5));

      axisG.selectAll('text').style('font-size', '10px');
      axisG.select('.domain').attr('stroke', '#e2e8ed');
      axisG.selectAll('.tick line').attr('stroke', '#e2e8ed');

      // Variable label
      g.append('text')
        .attr('x', xScale(v) ?? 0)
        .attr('y', -12)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', '600')
        .style('fill', '#14283b')
        .style('text-transform', 'uppercase')
        .style('letter-spacing', '0.04em')
        .text(INDICATOR_LABELS[v] || v);
    });

    const lineGen = d3.line<d3.NumberValue>()
      .defined((_, i) => i < variables.length * 2)
      .x((_, i) => xScale(variables[Math.floor(i / 2)]) ?? 0)
      .y((val, i) => scales[Math.floor(i / 2)](val as number));

    const pathFor = (d: ProvinceDatum) => {
      const points: d3.NumberValue[] = [];
      variables.forEach((v, i) => {
        points.push(d[v as keyof ProvinceDatum] as number);
        points.push(d[v as keyof ProvinceDatum] as number);
      });
      return lineGen(points) || '';
    };

    const hasHighlight = highlighted.size > 0;

    // Non-highlighted lines
    g.selectAll('.pc-line-bg')
      .data(data.filter(d => !highlighted.has(d.provinsi)))
      .join('path')
      .attr('class', 'pc-line-bg')
      .attr('d', pathFor)
      .attr('fill', 'none')
      .attr('stroke', '#c4cdd5')
      .attr('stroke-width', 1)
      .attr('opacity', hasHighlight ? 0.2 : 0.5);

    // Highlighted lines
    g.selectAll('.pc-line-hl')
      .data(data.filter(d => highlighted.has(d.provinsi)))
      .join('path')
      .attr('class', 'pc-line-hl')
      .attr('d', pathFor)
      .attr('fill', 'none')
      .attr('stroke', '#1a7f8a')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

  }, [data, variables, highlighted, width, height]);

  return (
    <svg ref={ref} width={width} height={height} className="d3-chart w-full h-auto" style={{ maxWidth: width }} />
  );
}
