import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { HierarchyDatum } from '@/data/provinces';

interface Props {
  data: HierarchyDatum[];
  width?: number;
  height?: number;
}

const SECTOR_COLORS: Record<string, string> = {
  'Pertanian, Kehutanan & Perikanan': '#3f7d5c',
  'Pertambangan & Penggalian': '#a87335',
  'Industri Pengolahan': '#1a7f8a',
  'Pengadaan Listrik & Gas': '#d79a2b',
  'Konstruksi': '#7a5aa6',
  'Perdagangan Besar & Eceran': '#3c7ae6',
  'Transportasi & Pergudangan': '#d96f3b',
  'Jasa Penyediaan Akomodasi': '#e25d5d',
  'Jasa Lainnya': '#5a7389',
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{ name: string; nilai: number; kontribusi: number; x: number; y: number } | null>(null);
  const [chartSize, setChartSize] = useState({ width, height });

  useEffect(() => {
    const updateSize = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nextWidth = Math.max(340, Math.min(rect.width || width, width));
      const nextHeight = Math.min(560, Math.max(420, nextWidth * 0.8));
      setChartSize({ width: nextWidth, height: nextHeight });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [width]);

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

    const radius = Math.min(chartSize.width, chartSize.height) / 2 - 18;
    const innerRadius = 42;

    const partition = d3.partition<TreeNode>().size([2 * Math.PI, radius]);
    partition(hierarchy);

    const arcGen = d3.arc<d3.HierarchyRectangularNode<TreeNode>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(0.006)
      .padRadius(radius)
      .innerRadius(d => Math.max(innerRadius, d.y0))
      .outerRadius(d => Math.max(innerRadius + 1, d.y1 - 2));

    const g = svg.append('g').attr('transform', `translate(${chartSize.width / 2},${chartSize.height / 2})`);

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
          x: x + 14, y: y + 14,
        });
      })
      .on('mousemove', (event, d) => {
        const [x, y] = d3.pointer(event, svg.node());
        setHovered({
          name: d.data.name,
          nilai: d.value || 0,
          kontribusi: d.data.kontribusi || 0,
          x: x + 14, y: y + 14,
        });
      })
      .on('mouseleave', () => setHovered(null));

    const sectorNodes = hierarchy.descendants().filter(d => d.depth === 1) as d3.HierarchyRectangularNode<TreeNode>[];
    g.selectAll('.sector-label')
      .data(sectorNodes)
      .join('text')
      .attr('class', 'sector-label')
      .filter(d => (d.x1 - d.x0) * radius > 0.18)
      .attr('transform', d => {
        const angle = (d.x0 + d.x1) / 2;
        const textRadius = d.y1 - 12;
        const x = Math.cos(angle - Math.PI / 2) * textRadius;
        const y = Math.sin(angle - Math.PI / 2) * textRadius;
        const rotate = (angle * 180 / Math.PI) - 90;
        return `translate(${x},${y}) rotate(${rotate})`;
      })
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '8.5px')
      .style('font-weight', '700')
      .style('fill', '#ffffff')
      .style('letter-spacing', '0.04em')
      .style('paint-order', 'stroke')
      .style('stroke', 'rgba(0,0,0,0.18)')
      .style('stroke-width', '0.4px')
      .style('pointer-events', 'none')
      .text(d => {
        const label = d.data.name.length > 18 ? d.data.name.slice(0, 16) + '…' : d.data.name;
        return label;
      });

    g.append('circle')
      .attr('r', innerRadius - 8)
      .attr('fill', '#fff')
      .attr('opacity', 0.82);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.1em')
      .style('font-size', '13px')
      .style('font-weight', '700')
      .style('fill', '#14283b')
      .text('PDB');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.25em')
      .style('font-size', '9px')
      .style('fill', '#6b8294')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.08em')
      .text('Nasional');
  }, [chartSize.height, chartSize.width, data]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg ref={ref} width={chartSize.width} height={chartSize.height} viewBox={`0 0 ${chartSize.width} ${chartSize.height}`} className="d3-chart block w-full h-auto" preserveAspectRatio="xMidYMid meet" />
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
