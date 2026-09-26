import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { HierarchyDatum } from '@/data/provinces';

interface Props {
  data: HierarchyDatum[];
  width?: number;
  height?: number;
}

const SECTOR_COLORS: Record<string, string> = {
  'Pertanian, Kehutanan & Perikanan': '#5b9a6a',
  'Pertambangan & Penggalian': '#8b6b3e',
  'Industri Pengolahan': '#1a7f8a',
  'Pengadaan Listrik & Gas': '#e8a838',
  'Konstruksi': '#9b6fa8',
  'Perdagangan Besar & Eceran': '#3b82f6',
  'Transportasi & Pergudangan': '#d97742',
  'Jasa Penyediaan Akomodasi': '#ec5f5f',
  'Jasa Lainnya': '#6b7f94',
};

interface TreeNode {
  name: string;
  children?: TreeNode[];
  value?: number;
  kontribusi?: number;
  sectorName: string;
}

export default function Sunburst({ data, width = 720, height = 560 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<{ name: string; nilai: number; kontribusi: number; x: number; y: number } | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const root: TreeNode = { name: 'PDB', sectorName: '' };
    const sectorMap = new Map<string, Map<string, HierarchyDatum[]>>();

    data.forEach(d => {
      if (!sectorMap.has(d.sektor)) sectorMap.set(d.sektor, new Map());
      const subMap = sectorMap.get(d.sektor)!;
      if (!subMap.has(d.subsektor)) subMap.set(d.subsektor, []);
      subMap.get(d.subsektor)!.push(d);
    });

    sectorMap.forEach((subMap, sektor) => {
      const sectorNode: TreeNode = { name: sektor, sectorName: sektor };
      subMap.forEach((items, subsektor) => {
        const subNode: TreeNode = { name: subsektor, sectorName: sektor };
        items.forEach(item => {
          subNode.children = subNode.children || [];
          subNode.children.push({ name: item.rincian, value: item.nilai, kontribusi: item.kontribusi, sectorName: sektor });
        });
        sectorNode.children = sectorNode.children || [];
        sectorNode.children.push(subNode);
      });
      root.children = root.children || [];
      root.children.push(sectorNode);
    });

    const hierarchy = d3.hierarchy(root)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const radius = Math.min(width, height) / 2 - 10;
    const innerRadius = 40;

    const partition = d3.partition<TreeNode>().size([2 * Math.PI, radius]);
    partition(hierarchy);

    const arcGen = d3.arc<d3.HierarchyRectangularNode<TreeNode>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(0.004)
      .padRadius(radius)
      .innerRadius(d => Math.max(innerRadius, d.y0))
      .outerRadius(d => Math.max(innerRadius + 2, d.y1 - 2));

    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    const allNodes = hierarchy.descendants().filter(d => d.depth > 0);

    g.selectAll('path')
      .data(allNodes)
      .join('path')
      .attr('d', arcGen as unknown as (d: unknown) => string)
      .attr('fill', d => {
        const sectorName = d.data.sectorName;
        const color = SECTOR_COLORS[sectorName] || '#6b8294';
        if (d.depth === 1) return color;
        const intensity = d3.scaleLinear().domain([0, 3]).range([0.35, 0.8]).clamp(true);
        const kontribusi = d.data.kontribusi || 1;
        return d3.color(color)!.copy({ opacity: intensity(kontribusi) }).formatRgb();
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.8)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        const [x, y] = d3.pointer(event, svg.node());
        setHovered({
          name: d.data.name,
          nilai: d.value || 0,
          kontribusi: d.data.kontribusi || 0,
          x: x + 12, y: y + 12,
        });
      })
      .on('mousemove', (event, d) => {
        const [x, y] = d3.pointer(event, svg.node());
        setHovered({
          name: d.data.name,
          nilai: d.value || 0,
          kontribusi: d.data.kontribusi || 0,
          x: x + 12, y: y + 12,
        });
      })
      .on('mouseleave', () => setHovered(null))
      .on('click', (event, d) => {
        event.stopPropagation();
        setFocus(d.depth === 1 ? d.data.name : null);
      });

    // Sector labels on outer ring
    const sectorNodes = hierarchy.descendants().filter(d => d.depth === 1) as d3.HierarchyRectangularNode<TreeNode>[];
    g.selectAll('.sector-label')
      .data(sectorNodes)
      .join('text')
      .attr('class', 'sector-label')
      .attr('transform', d => {
        const angle = (d.x0 + d.x1) / 2;
        const r = d.y1 - 8;
        const x = Math.cos(angle - Math.PI / 2) * r;
        const y = Math.sin(angle - Math.PI / 2) * r;
        const rotate = (angle * 180 / Math.PI) - 90;
        return `translate(${x},${y}) rotate(${rotate})`;
      })
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '9px')
      .style('font-weight', '700')
      .style('fill', '#fff')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.04em')
      .style('pointer-events', 'none')
      .text(d => {
        const label = d.data.name.length > 22 ? d.data.name.slice(0, 20) + '…' : d.data.name;
        return label;
      });

    // Center label
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('font-size', '14px')
      .style('font-weight', '700')
      .style('fill', '#14283b')
      .text('PDB');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('font-size', '10px')
      .style('fill', '#6b8294')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.08em')
      .text('Nasional');
  }, [data, width, height]);

  return (
    <div className="relative">
      <svg ref={ref} width={width} height={height} className="d3-chart w-full h-auto" style={{ maxWidth: width }} />
      {hovered && (
        <div className="map-tooltip visible" style={{ left: hovered.x, top: hovered.y }}>
          <div style={{ fontWeight: 600 }}>{hovered.name}</div>
          <div style={{ color: '#a8b6c0' }}>Nilai: <span style={{ color: '#fff', fontWeight: 600 }}>{hovered.nilai.toLocaleString('id-ID')} T</span></div>
          {hovered.kontribusi > 0 && (
            <div style={{ color: '#a8b6c0' }}>Kontribusi: <span style={{ color: '#fff', fontWeight: 600 }}>{hovered.kontribusi.toFixed(2)}%</span></div>
          )}
        </div>
      )}
    </div>
  );
}
