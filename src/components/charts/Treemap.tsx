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
  depth: number;
  sectorName: string;
}

export default function Treemap({ data, width = 820, height = 560 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<{ name: string; nilai: number; kontribusi: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    // Build hierarchy
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
      .size([width, height])
      .paddingOuter(2)
      .paddingTop(d => d.depth === 0 ? 22 : d.depth === 1 ? 16 : 0)
      .paddingInner(2)
      .round(true);

    const treeRoot = treemap(hierarchy);

    const g = svg.append('g');

    // Sector-level cells (depth 1)
    const sectors = treeRoot.descendants().filter(d => d.depth === 1) as d3.HierarchyRectangularNode<TreeNode>[];

    sectors.forEach(node => {
      const sectorName = node.data.sectorName;
      const color = SECTOR_COLORS[sectorName] || '#6b8294';

      // Sector background
      g.append('rect')
        .attr('x', node.x0).attr('y', node.y0)
        .attr('width', node.x1 - node.x0).attr('height', node.y1 - node.y0)
        .attr('fill', color).attr('opacity', 0.12)
        .attr('stroke', color).attr('stroke-width', 1.5)
        .attr('rx', 4);

      // Sector label
      if (node.x1 - node.x0 > 60 && node.y1 - node.y0 > 30) {
        const label = sectorName.length > 28 ? sectorName.slice(0, 26) + '…' : sectorName;
        g.append('text')
          .attr('x', node.x0 + 6).attr('y', node.y0 + 14)
          .style('font-size', '10px').style('font-weight', '700')
          .style('fill', color).style('text-transform', 'uppercase')
          .style('letter-spacing', '0.04em')
          .text(label);
      }

      // Leaf cells (rincian)
      const leaves = node.descendants().filter(d => d.depth === 3) as d3.HierarchyRectangularNode<TreeNode>[];
      leaves.forEach(leaf => {
        const w = leaf.x1 - leaf.x0;
        const h = leaf.y1 - leaf.y0;
        if (w < 3 || h < 3) return;

        const kontribusi = leaf.data.kontribusi || 0;
        const intensity = d3.scaleLinear().domain([0, 3]).range([0.3, 0.85]).clamp(true);

        g.append('rect')
          .attr('x', leaf.x0 + 1).attr('y', leaf.y0 + 1)
          .attr('width', w - 2).attr('height', h - 2)
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
              x: x + 12, y: y + 12,
            });
          })
          .on('mousemove', (event) => {
            const [x, y] = d3.pointer(event, svg.node());
            setHovered({
              name: leaf.data.name,
              nilai: leaf.data.value || 0,
              kontribusi: kontribusi,
              x: x + 12, y: y + 12,
            });
          })
          .on('mouseleave', () => setHovered(null));

        if (w > 40 && h > 24) {
          g.append('text')
            .attr('x', leaf.x0 + 5).attr('y', leaf.y0 + h / 2 + 2)
            .style('font-size', '9px').style('font-weight', '600')
            .style('fill', '#fff')
            .text(leaf.data.name.length > 18 ? leaf.data.name.slice(0, 16) + '…' : leaf.data.name);

          g.append('text')
            .attr('x', leaf.x0 + 5).attr('y', leaf.y0 + h / 2 + 14)
            .style('font-size', '9px').style('fill', '#fff').style('opacity', 0.85)
            .text(`${kontribusi.toFixed(1)}%`);
        }
      });
    });
  }, [data, width, height]);

  return (
    <div className="relative">
      <svg ref={ref} width={width} height={height} className="d3-chart w-full h-auto rounded-lg" style={{ maxWidth: width }} />
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
