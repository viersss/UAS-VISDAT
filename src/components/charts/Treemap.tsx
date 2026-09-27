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
  depth: number;
  sectorName: string;
}

export default function Treemap({ data, width = 820, height = 560 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{ name: string; nilai: number; kontribusi: number; x: number; y: number } | null>(null);
  const [chartSize, setChartSize] = useState({ width, height });

  useEffect(() => {
    const updateSize = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nextWidth = Math.max(360, Math.min(rect.width || width, width));
      const nextHeight = Math.min(560, Math.max(420, nextWidth * 0.72));
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

    const root: TreeNode = { name: 'PDB Nasional', depth: -1, sectorName: '' };
    const sectorMap = new Map<string, Map<string, HierarchyDatum[]>>();

    data.forEach(d => {
      if (!sectorMap.has(d.sektor)) sectorMap.set(d.sektor, new Map());
      const subMap = sectorMap.get(d.sektor)!;
      if (!subMap.has(d.subsektor)) subMap.set(d.subsektor, []);
      subMap.get(d.subsektor)!.push(d);
    });

    sectorMap.forEach((subMap, sektor) => {
      const sectorNode: TreeNode = { name: sektor, depth: 0, sectorName: sektor };
      subMap.forEach((items, subsektor) => {
        const subNode: TreeNode = { name: subsektor, depth: 1, sectorName: sektor };
        items.forEach(item => {
          subNode.children = subNode.children || [];
          subNode.children.push({
            name: item.rincian,
            value: item.nilai,
            kontribusi: item.kontribusi,
            depth: 2,
            sectorName: sektor,
          });
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

    const treemap = d3.treemap<TreeNode>()
      .size([chartSize.width, chartSize.height])
      .paddingOuter(3)
      .paddingTop(d => d.depth === 0 ? 26 : d.depth === 1 ? 18 : 0)
      .paddingInner(2)
      .round(true);

    const treeRoot = treemap(hierarchy);
    const g = svg.append('g');
    const sectors = treeRoot.descendants().filter(d => d.depth === 1) as d3.HierarchyRectangularNode<TreeNode>[];

    sectors.forEach(node => {
      const sectorName = node.data.sectorName;
      const color = SECTOR_COLORS[sectorName] || '#6b8294';

      g.append('rect')
        .attr('x', node.x0).attr('y', node.y0)
        .attr('width', node.x1 - node.x0).attr('height', node.y1 - node.y0)
        .attr('fill', color).attr('opacity', 0.12)
        .attr('stroke', color).attr('stroke-width', 1.5)
        .attr('rx', 4);

      const label = sectorName.length > 22 ? sectorName.slice(0, 20) + '…' : sectorName;
      if (node.x1 - node.x0 > 60 && node.y1 - node.y0 > 28) {
        g.append('text')
          .attr('x', node.x0 + 7).attr('y', node.y0 + 16)
          .style('font-size', '9px').style('font-weight', '700')
          .style('fill', color).style('text-transform', 'uppercase')
          .style('letter-spacing', '0.04em')
          .text(label);
      }

      const leaves = node.descendants().filter(d => d.depth === 3) as d3.HierarchyRectangularNode<TreeNode>[];
      leaves.forEach(leaf => {
        const w = leaf.x1 - leaf.x0;
        const h = leaf.y1 - leaf.y0;
        if (w < 4 || h < 4) return;

        const kontribusi = leaf.data.kontribusi || 0;
        const intensity = d3.scaleLinear().domain([0, 3]).range([0.28, 0.85]).clamp(true);

        g.append('rect')
          .attr('x', leaf.x0 + 1).attr('y', leaf.y0 + 1)
          .attr('width', Math.max(0, w - 2)).attr('height', Math.max(0, h - 2))
          .attr('fill', color)
          .attr('opacity', intensity(kontribusi))
          .attr('rx', 2)
          .style('cursor', 'pointer')
          .on('mouseenter', (event) => {
            const [x, y] = d3.pointer(event, svg.node());
            setHovered({
              name: leaf.data.name,
              nilai: leaf.data.value || 0,
              kontribusi: kontribusi,
              x: x + 14, y: y + 14,
            });
          })
          .on('mousemove', (event) => {
            const [x, y] = d3.pointer(event, svg.node());
            setHovered({
              name: leaf.data.name,
              nilai: leaf.data.value || 0,
              kontribusi: kontribusi,
              x: x + 14, y: y + 14,
            });
          })
          .on('mouseleave', () => setHovered(null));

        if (w > 52 && h > 25) {
          const labelText = leaf.data.name.length > 16 ? leaf.data.name.slice(0, 14) + '…' : leaf.data.name;
          g.append('text')
            .attr('x', leaf.x0 + 6).attr('y', leaf.y0 + h / 2 + 2)
            .style('font-size', Math.max(8, Math.min(10, w / 7)) + 'px')
            .style('font-weight', '700')
            .style('fill', '#ffffff')
            .style('paint-order', 'stroke')
            .style('stroke', 'rgba(0,0,0,0.18)')
            .style('stroke-width', '0.3px')
            .text(labelText);

          g.append('text')
            .attr('x', leaf.x0 + 6).attr('y', leaf.y0 + h / 2 + 14)
            .style('font-size', Math.max(7, Math.min(8, w / 9)) + 'px')
            .style('fill', '#ffffff').style('opacity', 0.95)
            .text(`${kontribusi.toFixed(1)}%`);
        }
      });
    });
  }, [chartSize.height, chartSize.width, data]);

  return (
    <div ref={wrapRef} className="relative w-full overflow-visible">
      <svg ref={ref} width={chartSize.width} height={chartSize.height} viewBox={`0 0 ${chartSize.width} ${chartSize.height}`} className="d3-chart block w-full h-auto rounded-lg" preserveAspectRatio="xMidYMid meet" />
      {hovered && (
        <div className="map-tooltip visible" style={{ left: hovered.x, top: hovered.y }}>
          <div style={{ fontWeight: 600 }}>{hovered.name}</div>
          <div style={{ color: '#a8b6c0' }}>Nilai: <span style={{ color: '#fff', fontWeight: 600 }}>{hovered.nilai.toLocaleString('id-ID')} T</span></div>
          <div style={{ color: '#a8b6c0' }}>Kontribusi PDB: <span style={{ color: '#fff', fontWeight: 600 }}>{hovered.kontribusi.toFixed(2)}%</span></div>
        </div>
      )}
    </div>
  );
}
