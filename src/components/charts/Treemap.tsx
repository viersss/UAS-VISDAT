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

const COMPACT_SECTOR_LABELS: Record<string, string> = {
  'Jasa Penyediaan Akomodasi': 'Akomodasi',
  'Pengadaan Listrik & Gas': 'Listrik & Gas',
};

interface TreeNode {
  name: string;
  children?: TreeNode[];
  value?: number;
  kontribusi?: number;
  depth: number;
  sectorName: string;
  subsectorName?: string;
}

interface TooltipData {
  x: number;
  y: number;
  name: string;
  nilai: number;
  kontribusi: number;
  sector: string;
  subsektor?: string;
  depth: number;
}

function wrapHierarchyLabel(label: string, maxChars: number) {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  if (lines.length <= 2) return lines;
  const second = lines[1];
  return [lines[0], `${second.slice(0, Math.max(1, maxChars - 1))}…`];
}

export default function Treemap({ data, width = 820, height = 560 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<TooltipData | null>(null);
  const [chartSize, setChartSize] = useState({ width, height });
  const [activePath, setActivePath] = useState<string[]>([]);

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
            subsectorName: subsektor,
          });
        });
        sectorNode.children = sectorNode.children || [];
        sectorNode.children.push(subNode);
      });
      root.children = root.children || [];
      root.children.push(sectorNode);
    });

    let targetNodeObj = root;
    for (const p of activePath) {
      const child = targetNodeObj.children?.find(c => c.name === p);
      if (child) targetNodeObj = child;
    }

    const hierarchy = d3.hierarchy(targetNodeObj)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemap = d3.treemap<TreeNode>()
      .size([chartSize.width, chartSize.height])
      .paddingOuter(4)
      .paddingTop(d => (d.depth === 1 && d.children) ? 28 : 0)
      .paddingInner(2)
      .round(true);

    const treeRoot = treemap(hierarchy);
    const g = svg.append('g');

    const groups = treeRoot.children?.filter(d => d.children) || [];
    const leaves = treeRoot.leaves();

    groups.forEach(node => {
      const sectorName = node.data.sectorName || node.data.name;
      const color = SECTOR_COLORS[sectorName] || '#6b8294';
      const groupDepth = node.depth + activePath.length;
      const groupLevel = groupDepth === 1 ? 'sektor' : 'subsektor';

      const rect = g.append('rect')
        .attr('x', node.x0).attr('y', node.y0)
        .attr('width', node.x1 - node.x0).attr('height', node.y1 - node.y0)
        .attr('fill', color).attr('opacity', 0.08)
        .attr('stroke', color).attr('stroke-width', 1.5)
        .attr('rx', 5)
          .attr('role', 'button')
          .attr('tabindex', 0)
          .attr('aria-label', `Buka ${groupLevel} ${node.data.name}`)
        .style('cursor', 'pointer')
        .style('transition', 'opacity 0.15s ease, stroke-width 0.15s ease');

      rect
        .on('click', () => setActivePath([...activePath, node.data.name]))
        .on('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setActivePath([...activePath, node.data.name]);
          }
        })
        .on('focus', function () {
          d3.select(this).attr('opacity', 0.18).attr('stroke-width', 2.6);
        })
        .on('blur', function () {
          d3.select(this).attr('opacity', 0.08).attr('stroke-width', 1.5);
        })
        .on('mouseenter', function (event) {
          d3.select(this).attr('opacity', 0.18).attr('stroke-width', 2.6);
          const [x, y] = d3.pointer(event, wrapRef.current);
          const depth = node.depth + activePath.length;
          setHovered({
            x: Math.min(x + 14, chartSize.width - 220),
            y: Math.min(y + 14, chartSize.height - 120),
            name: node.data.name,
            nilai: node.value || 0,
            kontribusi: d3.sum(node.leaves(), leaf => leaf.data.kontribusi || 0),
            sector: node.data.sectorName || node.data.name,
            subsektor: depth === 2 ? node.data.name : undefined,
            depth,
          });
        })
        .on('mousemove', event => {
          const [x, y] = d3.pointer(event, wrapRef.current);
          setHovered(prev => prev ? {
            ...prev,
            x: Math.min(x + 14, chartSize.width - 220),
            y: Math.min(y + 14, chartSize.height - 120),
          } : null);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', 0.08).attr('stroke-width', 1.5);
          setHovered(null);
        });

      rect.append('title').text(`Klik untuk membuka ${groupLevel} ${node.data.name}`);

      const groupWidth = node.x1 - node.x0;
      const groupHeight = node.y1 - node.y0;
      if (groupWidth > 48 && groupHeight > 30) {
        const fontSize = Math.max(7, Math.min(8.5, groupWidth / 16));
        const labelLimit = Math.max(5, Math.floor((groupWidth - 30) / (fontSize * 0.58)));
        const groupLabel = wrapHierarchyLabel(
          COMPACT_SECTOR_LABELS[node.data.name] || node.data.name,
          labelLimit
        );
        const label = g.append('text')
          .attr('x', node.x0 + 8)
          .attr('y', node.y0 + (groupLabel.length > 1 ? 11 : 18))
          .style('font-size', `${fontSize}px`)
          .style('font-weight', '800')
          .style('fill', '#203744')
          .style('paint-order', 'stroke')
          .style('stroke', '#f5f3ee')
          .style('stroke-width', '2.6px')
          .style('stroke-linejoin', 'round')
          .style('pointer-events', 'none');

        groupLabel.forEach((line, index) => {
          label.append('tspan')
            .attr('x', node.x0 + 8)
            .attr('dy', index === 0 ? 0 : 10)
            .text(line.toLocaleUpperCase('id-ID'));
        });

        g.append('text')
          .attr('x', node.x1 - 11).attr('y', node.y0 + 15)
          .attr('text-anchor', 'middle')
          .style('font-size', '14px')
          .style('font-weight', '700')
          .style('fill', '#203744')
          .style('paint-order', 'stroke')
          .style('stroke', '#f5f3ee')
          .style('stroke-width', '2.6px')
          .style('stroke-linejoin', 'round')
          .style('opacity', 0.8)
          .style('pointer-events', 'none')
          .text('›');
      }
    });

    leaves.forEach(leaf => {
      const w = leaf.x1 - leaf.x0;
      const h = leaf.y1 - leaf.y0;
      if (w < 4 || h < 4) return;

      const sectorName = leaf.data.sectorName;
      const color = SECTOR_COLORS[sectorName] || '#6b8294';
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

      const drillTarget = leaf.ancestors().find(ancestor => ancestor.depth === 1 && ancestor.children);
      if (drillTarget) {
        const drillLevel = drillTarget.depth + activePath.length === 1 ? 'sektor' : 'subsektor';
        rect
          .attr('role', 'button')
          .attr('tabindex', 0)
          .attr('aria-label', `Buka ${drillLevel} ${drillTarget.data.name} dari rincian ${leaf.data.name}`)
          .on('click', () => setActivePath([...activePath, drillTarget.data.name]))
          .on('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setActivePath([...activePath, drillTarget.data.name]);
            }
          });
      }

      rect
        .on('mouseenter', function (event) {
          d3.select(this)
            .attr('opacity', Math.min(1, intensity(kontribusi) + 0.2))
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5);

          const [x, y] = d3.pointer(event, wrapRef.current);
          const safeX = x + 14 + 210 > chartSize.width ? x - 224 : x + 14;
          const safeY = y + 14 + 120 > chartSize.height ? y - 130 : y + 14;

          setHovered({
            x: safeX, y: safeY,
            name: leaf.data.name,
            nilai: leaf.data.value || 0,
            kontribusi,
            sector: sectorName,
            subsektor: leaf.data.subsectorName,
            depth: leaf.depth + activePath.length,
          });
        })
        .on('mousemove', function (event) {
          const [x, y] = d3.pointer(event, wrapRef.current);
          const safeX = x + 14 + 210 > chartSize.width ? x - 224 : x + 14;
          const safeY = y + 14 + 120 > chartSize.height ? y - 130 : y + 14;
          setHovered(prev => prev ? { ...prev, x: safeX, y: safeY } : null);
        })
        .on('mouseleave', function () {
          d3.select(this)
            .attr('opacity', intensity(kontribusi))
            .attr('stroke', null);
          setHovered(null);
        });

      if (w > 40 && h > 19) {
        const fontSize = Math.max(7, Math.min(9, Math.min(w / 7, h / 2.5)));
        const labelLimit = Math.max(5, Math.floor((w - 12) / (fontSize * 0.58)));
        const labelText = leaf.data.name.length > labelLimit
          ? `${leaf.data.name.slice(0, Math.max(3, labelLimit - 1))}…`
          : leaf.data.name;
        g.append('text')
          .attr('x', leaf.x0 + 6).attr('y', leaf.y0 + h / 2 - (h > 31 ? 5 : -3))
          .style('font-size', `${fontSize}px`)
          .style('font-weight', '700')
          .style('fill', '#ffffff')
          .style('paint-order', 'stroke')
          .style('stroke', 'rgba(0,0,0,0.2)')
          .style('stroke-width', '0.5px')
          .style('pointer-events', 'none')
          .text(labelText);

        if (h > 31 && w > 52) {
          g.append('text')
            .attr('x', leaf.x0 + 6).attr('y', leaf.y0 + h / 2 + 10)
            .style('font-size', Math.max(7.5, Math.min(9, w / 9)) + 'px')
            .style('fill', 'rgba(255,255,255,0.88)')
            .style('pointer-events', 'none')
            .text(`${kontribusi.toFixed(1)}%`);
        }
      }
    });
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
          <div style={{ color: '#a8b6c0', fontSize: 10, marginBottom: 4 }}>
            Level: <span style={{ color: '#e8a838' }}>{hovered.depth === 1 ? 'Sektor' : hovered.depth === 2 ? 'Sub-sektor' : 'Rincian'}</span>
          </div>
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
