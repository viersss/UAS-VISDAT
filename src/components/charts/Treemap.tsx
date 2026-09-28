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

interface TooltipData {
  x: number;
  y: number;
  name: string;
  nilai: number;
  kontribusi: number;
  sector: string;
  subsektor?: string;
}

export default function Treemap({ data, width = 820, height = 560 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<TooltipData | null>(null);
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

    // Build subsektor lookup for tooltip
    const subsektorMap = new Map<string, string>(); // rincian → subsektor
    data.forEach(d => {
      if (!sectorMap.has(d.sektor)) sectorMap.set(d.sektor, new Map());
      const subMap = sectorMap.get(d.sektor)!;
      if (!subMap.has(d.subsektor)) subMap.set(d.subsektor, []);
      subMap.get(d.subsektor)!.push(d);
      subsektorMap.set(d.rincian, d.subsektor);
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
      .paddingOuter(4)
      .paddingTop(d => d.depth === 0 ? 28 : d.depth === 1 ? 18 : 0)
      .paddingInner(2)
      .round(true);

    const treeRoot = treemap(hierarchy);
    const g = svg.append('g');
    const sectors = treeRoot.descendants().filter(d => d.depth === 1) as d3.HierarchyRectangularNode<TreeNode>[];

    sectors.forEach(node => {
      const sectorName = node.data.sectorName;
      const color = SECTOR_COLORS[sectorName] || '#6b8294';

      // Sector background
      g.append('rect')
        .attr('x', node.x0).attr('y', node.y0)
        .attr('width', node.x1 - node.x0).attr('height', node.y1 - node.y0)
        .attr('fill', color).attr('opacity', 0.08)
        .attr('stroke', color).attr('stroke-width', 1.5)
        .attr('rx', 5);

      // Sector label
      const sLabel = sectorName.length > 22 ? sectorName.slice(0, 20) + '…' : sectorName;
      if (node.x1 - node.x0 > 65 && node.y1 - node.y0 > 30) {
        g.append('text')
          .attr('x', node.x0 + 8).attr('y', node.y0 + 17)
          .style('font-size', '9.5px').style('font-weight', '800')
          .style('fill', color).style('text-transform', 'uppercase')
          .style('letter-spacing', '0.05em')
          .style('pointer-events', 'none')
          .text(sLabel);
      }

      const leaves = node.descendants().filter(d => d.depth === 3) as d3.HierarchyRectangularNode<TreeNode>[];
      leaves.forEach(leaf => {
        const w = leaf.x1 - leaf.x0;
        const h = leaf.y1 - leaf.y0;
        if (w < 4 || h < 4) return;

        const kontribusi = leaf.data.kontribusi || 0;
        const intensity = d3.scaleLinear().domain([0, 3]).range([0.28, 0.88]).clamp(true);

        const rect = g.append('rect')
          .attr('x', leaf.x0 + 1).attr('y', leaf.y0 + 1)
          .attr('width', Math.max(0, w - 2)).attr('height', Math.max(0, h - 2))
          .attr('fill', color)
          .attr('opacity', intensity(kontribusi))
          .attr('rx', 3)
          .style('cursor', 'pointer')
          .style('transition', 'opacity 0.15s ease, transform 0.15s ease');

        rect
          .on('mouseenter', function (event) {
            d3.select(this)
              .attr('opacity', Math.min(1, intensity(kontribusi) + 0.2))
              .attr('stroke', 'white')
              .attr('stroke-width', 1.5);

            const [x, y] = d3.pointer(event, svg.node());
            const safeX = x + 14 + 210 > chartSize.width ? x - 224 : x + 14;
            const safeY = y + 14 + 100 > chartSize.height ? y - 110 : y + 14;

            setHovered({
              x: safeX, y: safeY,
              name: leaf.data.name,
              nilai: leaf.data.value || 0,
              kontribusi,
              sector: sectorName,
              subsektor: subsektorMap.get(leaf.data.name),
            });
          })
          .on('mousemove', function (event) {
            const [x, y] = d3.pointer(event, svg.node());
            const safeX = x + 14 + 210 > chartSize.width ? x - 224 : x + 14;
            const safeY = y + 14 + 100 > chartSize.height ? y - 110 : y + 14;
            setHovered(prev => prev ? { ...prev, x: safeX, y: safeY } : null);
          })
          .on('mouseleave', function () {
            d3.select(this)
              .attr('opacity', intensity(kontribusi))
              .attr('stroke', null);
            setHovered(null);
          });

        if (w > 55 && h > 28) {
          const labelText = leaf.data.name.length > 16 ? leaf.data.name.slice(0, 14) + '…' : leaf.data.name;
          g.append('text')
            .attr('x', leaf.x0 + 6).attr('y', leaf.y0 + h / 2 - (h > 36 ? 6 : 2))
            .style('font-size', Math.max(8, Math.min(10, w / 7)) + 'px')
            .style('font-weight', '700')
            .style('fill', '#ffffff')
            .style('paint-order', 'stroke')
            .style('stroke', 'rgba(0,0,0,0.2)')
            .style('stroke-width', '0.5px')
            .style('pointer-events', 'none')
            .text(labelText);

          if (h > 36) {
            g.append('text')
              .attr('x', leaf.x0 + 6).attr('y', leaf.y0 + h / 2 + 10)
              .style('font-size', Math.max(7.5, Math.min(9, w / 9)) + 'px')
              .style('fill', 'rgba(255,255,255,0.88)')
              .style('pointer-events', 'none')
              .text(`${kontribusi.toFixed(1)}%`);
          }
        }
      });
    });
  }, [chartSize.height, chartSize.width, data]);

  return (
    <div ref={wrapRef} className="relative w-full overflow-visible">
      <svg ref={ref} width={chartSize.width} height={chartSize.height} viewBox={`0 0 ${chartSize.width} ${chartSize.height}`} className="d3-chart block w-full h-auto rounded-lg" preserveAspectRatio="xMidYMid meet" />
      {hovered && (
        <div
          className="map-tooltip visible"
          style={{ left: hovered.x, top: hovered.y, minWidth: 200 }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{hovered.name}</div>
          <div style={{ fontSize: 10, color: SECTOR_COLORS[hovered.sector] || '#a8b6c0', fontWeight: 600, marginBottom: 2 }}>
            ● {hovered.sector}
          </div>
          {hovered.subsektor && (
            <div style={{ fontSize: 10, color: '#a8b6c0', marginBottom: 5 }}>
              Sub-sektor: {hovered.subsektor}
            </div>
          )}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 5 }}>
            <div style={{ color: '#a8b6c0', fontSize: 11.5 }}>
              Nilai PDB: <span style={{ color: '#fff', fontWeight: 700 }}>{hovered.nilai.toLocaleString('id-ID')} T</span>
            </div>
            <div style={{ color: '#a8b6c0', fontSize: 11.5 }}>
              Kontribusi: <span style={{ color: '#4ade80', fontWeight: 700 }}>{hovered.kontribusi.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
