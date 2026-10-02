import { useEffect, useMemo, useRef, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echartsCore from 'echarts/core';
import { SankeyChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import type { MigrationEdge } from '@/data/migration';
import TabSwitcher from '@/components/TabSwitcher';
import MigrationFlowMap from './MigrationFlowMap';

echartsCore.use([
  SankeyChart,
  TooltipComponent,
  CanvasRenderer,
]);

interface Props {
  edges: MigrationEdge[];
  provinces: string[];
}

const MAX_VISIBLE_ROUTES = 60;
const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);

export default function MigrationFlowCharts({ edges, provinces }: Props) {
  const [visualization, setVisualization] = useState('sankey');
  const [routeLimit, setRouteLimit] = useState<number | 'all'>(MAX_VISIBLE_ROUTES);
  const [chartWidth, setChartWidth] = useState(980);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      setChartWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const { sankeyOption, visibleEdges, routeCount, visibleCount, coverage } = useMemo(() => {
    const rankedEdges = [...edges].sort((a, b) => b.Jumlah_Migran - a.Jumlah_Migran);
    const visibleEdges = routeLimit === 'all' ? rankedEdges : rankedEdges.slice(0, routeLimit);
    const totalMigrants = edges.reduce((sum, edge) => sum + edge.Jumlah_Migran, 0);
    const visibleMigrants = visibleEdges.reduce((sum, edge) => sum + edge.Jumlah_Migran, 0);
    const compactLayout = chartWidth < 640;
    const labelWidth = compactLayout ? Math.max(56, Math.min(92, chartWidth * 0.28)) : 140;
    const sideMargin = compactLayout ? labelWidth + 12 : 150;

    const sankeyOption: EChartsOption = {
      animationDuration: 450,
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: raw => {
          const params = raw as unknown as {
            dataType?: string;
            name?: string;
            data?: { source?: string; target?: string; value?: number };
          };
          if (params.dataType === 'edge' && params.data) {
            const source = params.data.source?.replace(/^asal:/, '') ?? '';
            const target = params.data.target?.replace(/^tujuan:/, '') ?? '';
            return `<strong>${source} → ${target}</strong><br/>Migran: ${formatNumber(params.data.value ?? 0)} jiwa`;
          }
          return params.name?.replace(/^(asal|tujuan):/, '') ?? '';
        },
      },
      series: [{
        type: 'sankey',
        orient: 'horizontal',
        nodeAlign: 'justify',
        left: sideMargin,
        right: compactLayout ? sideMargin : 165,
        top: 24,
        bottom: 24,
        nodeWidth: compactLayout ? 8 : 12,
        nodeGap: compactLayout ? 6 : 10,
        layoutIterations: 32,
        draggable: false,
        emphasis: { focus: 'adjacency' },
        data: [
          ...provinces.map(province => ({
            name: `asal:${province}`,
            depth: 0,
            itemStyle: { color: '#1d6d7b' },
            label: { position: 'left' as const, formatter: province },
          })),
          ...provinces.map(province => ({
            name: `tujuan:${province}`,
            depth: 1,
            itemStyle: { color: '#d98d55' },
            label: { position: 'right' as const, formatter: province },
          })),
        ],
        links: visibleEdges.map(edge => ({
          source: `asal:${edge.Prov_Asal}`,
          target: `tujuan:${edge.Prov_Tujuan}`,
          value: edge.Jumlah_Migran,
        })),
        lineStyle: { color: 'source', opacity: 0.3, curveness: 0.5 },
        label: {
          color: '#425b6d',
          fontSize: compactLayout ? 8 : 9,
          distance: 5,
          overflow: 'truncate',
          width: labelWidth,
        },
      }],
    };

    return {
      sankeyOption,
      visibleEdges,
      routeCount: edges.length,
      visibleCount: visibleEdges.length,
      coverage: totalMigrants > 0 ? visibleMigrants / totalMigrants : 0,
    };
  }, [chartWidth, edges, provinces, routeLimit]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-ink">{visualization === 'sankey' ? 'Sankey · arus asal ke tujuan' : 'Flowmap · arah perpindahan antarprovinsi'}</h4>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            {visualization === 'sankey'
              ? 'Ketebalan pita mengikuti jumlah migran. Sorot pita untuk melihat asal, tujuan, dan nilainya.'
              : 'Panah menunjukkan arah asal ke tujuan; ketebalan garis mengikuti jumlah migran.'}
          </p>
        </div>
        <TabSwitcher
          options={[
            { key: 'sankey', label: 'Sankey' },
            { key: 'flowmap', label: 'Flowmap' },
          ]}
          active={visualization}
          onChange={setVisualization}
        />
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-xs">
        <p className="text-ink-soft">
          <span className="font-semibold text-ink">{formatNumber(visibleCount)} / {formatNumber(routeCount)}</span> rute positif
        </p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 font-medium text-accent-deep">
            {(coverage * 100).toFixed(1)}% volume ditampilkan
          </span>
          {routeCount > MAX_VISIBLE_ROUTES && (
            <label className="flex items-center gap-2 text-xs text-ink-soft">
              <span className="sr-only">Jumlah rute</span>
              <select
                aria-label="Jumlah rute ditampilkan"
                value={routeLimit}
                onChange={event => setRouteLimit(event.target.value === 'all' ? 'all' : Number(event.target.value))}
                className="min-w-32 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
              >
                <option value={30}>30 teratas</option>
                <option value={MAX_VISIBLE_ROUTES}>60 teratas</option>
                <option value={100}>100 teratas</option>
                <option value="all">Semua rute</option>
              </select>
            </label>
          )}
        </div>
      </div>

      {edges.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center text-sm text-ink-muted">Tidak ada arus untuk kombinasi filter ini.</div>
      ) : visualization === 'sankey' ? (
        <div ref={chartContainerRef} className="w-full min-w-0">
          <ReactEChartsCore echarts={echartsCore} option={sankeyOption} notMerge style={{ width: '100%', height: 820 }} />
        </div>
      ) : (
        <MigrationFlowMap edges={visibleEdges} />
      )}

      {routeCount > MAX_VISIBLE_ROUTES && (
        <p className="mt-2 text-xs leading-5 text-ink-muted">Kedua tampilan mengikuti jumlah rute terpilih; pilih “Semua rute” untuk melihat seluruh jaringan hasil filter.</p>
      )}
    </div>
  );
}
