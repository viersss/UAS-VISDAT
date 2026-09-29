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

const SECTOR_LABELS_MAP: Record<string, string[]> = {
  'Pertanian, Kehutanan & Perikanan': ['Pertanian &', 'Perikanan'],
  'Pertambangan & Penggalian': ['Pertambangan', '& Penggalian'],
  'Industri Pengolahan': ['Industri', 'Pengolahan'],
  'Pengadaan Listrik & Gas': ['Listrik &', 'Gas'],
  'Konstruksi': ['Konstruksi'],
  'Perdagangan Besar & Eceran': ['Perdagangan', 'Besar/Eceran'],
  'Transportasi & Pergudangan': ['Transportasi &', 'Pergudangan'],
  'Jasa Penyediaan Akomodasi': ['Akomodasi &', 'Makan Minum'],
  'Jasa Lainnya': ['Jasa', 'Lainnya'],
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
  const [activePath, setActivePath] = useState<string[]>([]);

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

    // Handle Active Path Drill Down
    let targetNodeObj = root;
    for (const p of activePath) {
      const child = targetNodeObj.children?.find(c => c.name === p);
      if (child) targetNodeObj = child;
    }

    const hierarchy = d3.hierarchy(targetNodeObj)
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

    const slicesGroup = g.append('g').attr('class', 'slices-layer');
    const labelsGroup = g.append('g').attr('class', 'labels-layer').style('pointer-events', 'none');
    const centerGroup = g.append('g').attr('class', 'center-layer').style('pointer-events', 'none');

    const allNodes = hierarchy.descendants().filter(d => d.depth > 0);

    const paths = slicesGroup.selectAll('path')
      .data(allNodes)
      .join('path')
      .attr('d', arcGen as unknown as (d: unknown) => string)
      .attr('fill', d => {
        const sectorName = d.data.sectorName || d.data.name;
        const color = SECTOR_COLORS[sectorName] || '#6b8294';
        if (d.depth === 1 && activePath.length === 0) return color;
        const intensity = d3.scaleLinear().domain([0, 3]).range([0.3, 0.85]).clamp(true);
        const kontribusi = d3.sum(d.leaves(), leaf => leaf.data.kontribusi || 0);
        return d3.color(color)!.copy({ opacity: intensity(kontribusi) }).formatRgb();
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', d => (d.depth === 1 && activePath.length === 0) ? 1.2 : 0.6)
      .style('cursor', d => d.children ? 'pointer' : 'default');

    paths
      .on('click', (event, d) => {
        if (d.children) {
          setActivePath([...activePath, d.data.name]);
          setHovered(null);
        }
      })
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .raise()
          .transition().duration(120)
          .attr('d', arcGenExpanded as unknown as (node: unknown) => string)
          .attr('opacity', 1);

        const [x, y] = d3.pointer(event, wrapRef.current);
        setHovered({
          x: x + 14, y: y + 14,
          name: d.data.name,
          nilai: d.value || 0,
          kontribusi: d3.sum(d.leaves(), leaf => leaf.data.kontribusi || 0),
          sector: d.data.sectorName || d.data.name,
          depth: d.depth + activePath.length,
        });

        // Add title for drilldown
        if (d.children) {
           d3.select(this).append('title').text(`Klik untuk drill-down ke ${d.data.name}`);
        }
      })
      .on('mousemove', (event) => {
        const [x, y] = d3.pointer(event, wrapRef.current);
        setHovered(prev => prev ? { ...prev, x: x + 14, y: y + 14 } : null);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition().duration(120)
          .attr('d', arcGen as unknown as (node: unknown) => string)
          .attr('opacity', null);
        d3.select(this).select('title').remove();
        setHovered(null);
      });

    // Sector labels (only show at top level or if arc is wide enough)
    const labelNodes = hierarchy.descendants().filter(d => d.depth === 1) as d3.HierarchyRectangularNode<TreeNode>[];
    labelsGroup.selectAll('.sector-label')
      .data(labelNodes)
      .join('text')
      .attr('class', 'sector-label')
      .filter(d => (d.x1 - d.x0) > 0.08)
      .attr('transform', d => {
        const angle = (d.x0 + d.x1) / 2;
        const textRadius = (d.y0 + d.y1) / 2;
        const x = Math.cos(angle - Math.PI / 2) * textRadius;
        const y = Math.sin(angle - Math.PI / 2) * textRadius;
        let rotate = (angle * 180 / Math.PI) - 90;
        if (angle > Math.PI) {
          rotate += 180;
        }
        return `translate(${x},${y}) rotate(${rotate})`;
      })
      .attr('text-anchor', 'middle')
      .style('font-family', 'inherit')
      .style('font-size', '8.5px')
      .style('font-weight', '700')
      .style('fill', '#ffffff')
      .style('letter-spacing', '0.02em')
      .style('paint-order', 'stroke')
      .style('stroke', 'rgba(0,0,0,0.45)')
      .style('stroke-width', '2px')
      .style('pointer-events', 'none')
      .each(function (d) {
        const textEl = d3.select(this);
        const textLines = SECTOR_LABELS_MAP[d.data.name];
        const lines = activePath.length === 0 && textLines ? textLines : [d.data.name.slice(0, 15) + (d.data.name.length > 15 ? '…' : '')];

        if (lines.length === 1) {
          textEl.append('tspan')
            .attr('x', 0)
            .attr('dy', '0.35em')
            .text(lines[0]);
        } else {
          textEl.append('tspan')
            .attr('x', 0)
            .attr('dy', '-0.5em')
            .text(lines[0]);
          textEl.append('tspan')
            .attr('x', 0)
            .attr('dy', '1.15em')
            .text(lines[1]);
        }
      });

    // Center hole
    centerGroup.append('circle')
      .attr('r', innerRadius - 6)
      .attr('fill', '#fff')
      .attr('opacity', 0.95)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
      .style('cursor', activePath.length > 0 ? 'pointer' : 'default')
      .on('click', () => {
        if (activePath.length > 0) {
          setActivePath(activePath.slice(0, -1)); // zoom out one level
          setHovered(null);
        }
      });

    if (activePath.length > 0) {
      centerGroup.append('title').text('Klik untuk Zoom Out');
    }

    centerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', activePath.length > 0 ? '0em' : '-0.15em')
      .style('font-family', 'inherit')
      .style('font-size', activePath.length > 0 ? '11px' : '14px')
      .style('font-weight', '800')
      .style('fill', '#14283b')
      .style('pointer-events', 'none')
      .text(activePath.length > 0 ? (activePath[activePath.length-1].length > 10 ? activePath[activePath.length-1].slice(0, 8) + '…' : activePath[activePath.length-1]) : 'PDB');

    if (activePath.length === 0) {
      centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.1em')
        .style('font-family', 'inherit')
        .style('font-size', '8.5px')
        .style('fill', '#6b8294')
        .style('text-transform', 'uppercase')
        .style('letter-spacing', '0.1em')
        .style('pointer-events', 'none')
        .text('Nasional');
    }

  }, [chartSize.height, chartSize.width, data, activePath]);

  return (
    <div ref={wrapRef} className="relative w-full overflow-visible flex flex-col">
      <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-[#0f1923] rounded-lg border border-[#1f2d3d] text-sm text-slate-300 overflow-x-auto whitespace-nowrap hide-scrollbar shadow-sm">
        <button
          className="hover:text-white font-semibold transition-colors"
          onClick={() => setActivePath([])}
        >
          PDB Nasional
        </button>
        {activePath.map((path, i) => (
          <span key={path} className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">›</span>
            <button
              className="hover:text-white font-semibold transition-colors"
              onClick={() => setActivePath(activePath.slice(0, i + 1))}
            >
              {path}
            </button>
          </span>
        ))}
        {activePath.length > 0 && (
          <div className="ml-auto">
            <button
              onClick={() => setActivePath(activePath.slice(0, -1))}
              className="text-xs px-2 py-0.5 bg-[#1f2d3d] hover:bg-[#2a3c50] text-slate-300 rounded transition-colors"
            >
              Zoom Out
            </button>
          </div>
        )}
      </div>

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
