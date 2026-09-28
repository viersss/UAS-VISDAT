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

interface TooltipData {
  x: number;
  y: number;
  name: string;
  nilai: number;
  kontribusi: number;
  sector: string;
  depth: number;
}

export default function Sunburst({ data, width = 720, height = 560 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<TooltipData | null>(null);
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

    const radius = Math.min(chartSize.width, chartSize.height) / 2 - 20;
    const innerRadius = 48;

    const partition = d3.partition<TreeNode>().size([2 * Math.PI, radius]);
    partition(hierarchy);

    const arcGen = d3.arc<d3.HierarchyRectangularNode<TreeNode>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(0.005)
      .padRadius(radius)
      .innerRadius(d => Math.max(innerRadius, d.y0))
      .outerRadius(d => Math.max(innerRadius + 1, d.y1 - 2));

    const arcGenExpanded = d3.arc<d3.HierarchyRectangularNode<TreeNode>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(0.005)
      .padRadius(radius)
      .innerRadius(d => Math.max(innerRadius, d.y0))
      .outerRadius(d => Math.max(innerRadius + 1, d.y1 + 4));

    const g = svg.append('g').attr('transform', `translate(${chartSize.width / 2},${chartSize.height / 2})`);

    const allNodes = hierarchy.descendants().filter(d => d.depth > 0);

    const paths = g.selectAll('path')
      .data(allNodes)
      .join('path')
      .attr('d', arcGen as unknown as (d: unknown) => string)
      .attr('fill', d => {
        const sectorName = d.data.sectorName;
        const color = SECTOR_COLORS[sectorName] || '#6b8294';
        if (d.depth === 1) return color;
        const intensity = d3.scaleLinear().domain([0, 3]).range([0.3, 0.85]).clamp(true);
        const kontribusi = d.data.kontribusi || 1;
        return d3.color(color)!.copy({ opacity: intensity(kontribusi) }).formatRgb();
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', d => d.depth === 1 ? 1.2 : 0.6)
      .style('cursor', 'pointer');

    paths
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .raise()
          .transition().duration(120)
          .attr('d', arcGenExpanded as unknown as (node: unknown) => string)
          .attr('opacity', 1);

        const [x, y] = d3.pointer(event, svg.node());
        setHovered({
          x: x + 14, y: y + 14,
          name: d.data.name,
          nilai: d.value || 0,
          kontribusi: d.data.kontribusi || 0,
          sector: d.data.sectorName,
          depth: d.depth,
        });
      })
      .on('mousemove', (event) => {
        const [x, y] = d3.pointer(event, svg.node());
        setHovered(prev => prev ? { ...prev, x: x + 14, y: y + 14 } : null);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition().duration(120)
          .attr('d', arcGen as unknown as (node: unknown) => string)
          .attr('opacity', null);
        setHovered(null);
      });

    // Sector labels
    const sectorNodes = hierarchy.descendants().filter(d => d.depth === 1) as d3.HierarchyRectangularNode<TreeNode>[];
    g.selectAll('.sector-label')
      .data(sectorNodes)
      .join('text')
      .attr('class', 'sector-label')
      .filter(d => (d.x1 - d.x0) * radius > 0.18)
      .attr('transform', d => {
        const angle = (d.x0 + d.x1) / 2;
        const textRadius = (d.y0 + d.y1) / 2;
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
      .style('stroke', 'rgba(0,0,0,0.22)')
      .style('stroke-width', '0.5px')
      .style('pointer-events', 'none')
      .text(d => {
        const label = d.data.name.length > 18 ? d.data.name.slice(0, 16) + '…' : d.data.name;
        return label;
      });

    // Center hole
    g.append('circle')
      .attr('r', innerRadius - 6)
      .attr('fill', '#fff')
      .attr('opacity', 0.9);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.15em')
      .style('font-size', '14px')
      .style('font-weight', '800')
      .style('fill', '#14283b')
      .text('PDB');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.1em')
      .style('font-size', '8.5px')
      .style('fill', '#6b8294')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.1em')
      .text('Nasional');

    // Color legend
    const legendData = Object.entries(SECTOR_COLORS).slice(0, 6);
    const legendG = svg.append('g').attr('transform', `translate(12, 12)`);
    legendG.append('rect')
      .attr('width', 200).attr('height', legendData.length * 18 + 14)
      .attr('rx', 6).attr('fill', 'white').attr('opacity', 0.82)
      .attr('stroke', '#e2e8ed').attr('stroke-width', 0.5);

    legendG.append('text').attr('x', 10).attr('y', 14)
      .style('font-size', '8.5px').style('font-weight', '700')
      .style('text-transform', 'uppercase').style('letter-spacing', '0.08em')
      .style('fill', '#6b8294').text('Sektor');

    legendData.forEach(([name, color], i) => {
      const row = legendG.append('g').attr('transform', `translate(10, ${i * 18 + 22})`);
      row.append('circle').attr('r', 5).attr('cy', 0).attr('fill', color).attr('opacity', 0.85);
      row.append('text').attr('x', 13).attr('y', 4)
        .style('font-size', '9px').style('fill', '#3b5567')
        .text(name.length > 26 ? name.slice(0, 24) + '…' : name);
    });

  }, [chartSize.height, chartSize.width, data]);

  return (
    <div ref={wrapRef} className="relative w-full overflow-visible">
      <svg ref={ref} width={chartSize.width} height={chartSize.height} viewBox={`0 0 ${chartSize.width} ${chartSize.height}`} className="d3-chart block w-full h-auto" preserveAspectRatio="xMidYMid meet" />
      {hovered && (
        <div
          className="map-tooltip visible"
          style={{ left: Math.min(hovered.x, chartSize.width - 210), top: Math.min(hovered.y, chartSize.height - 100), minWidth: 190 }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{hovered.name}</div>
          {hovered.depth > 1 && (
            <div style={{ fontSize: 10, color: SECTOR_COLORS[hovered.sector] || '#a8b6c0', fontWeight: 600, marginBottom: 4 }}>
              ● {hovered.sector}
            </div>
          )}
          <div style={{ color: '#a8b6c0', fontSize: 11.5 }}>
            Nilai PDB: <span style={{ color: '#fff', fontWeight: 700 }}>{hovered.nilai.toLocaleString('id-ID')} T</span>
          </div>
          {hovered.kontribusi > 0 && (
            <div style={{ color: '#a8b6c0', fontSize: 11.5 }}>
              Kontribusi: <span style={{ color: '#4ade80', fontWeight: 700 }}>{hovered.kontribusi.toFixed(2)}%</span>
            </div>
          )}
          <div style={{ color: '#a8b6c0', fontSize: 10, marginTop: 3 }}>
            Level: <span style={{ color: '#e8a838' }}>{hovered.depth === 1 ? 'Sektor' : hovered.depth === 2 ? 'Sub-sektor' : 'Rincian'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
