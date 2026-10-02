import { Suspense, lazy, useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChevronDown } from 'lucide-react';

import Hero from '@/components/Hero';
import ProgressBar from '@/components/ProgressBar';
import ChapterSection from '@/components/ChapterSection';
import TransitionQuote from '@/components/TransitionQuote';
import MetricStrip from '@/components/MetricStrip';
import ProvinceSelector from '@/components/ProvinceSelector';
import ChartCaption from '@/components/ChartCaption';
import TabSwitcher from '@/components/TabSwitcher';
import AnimatedNumber from '@/components/AnimatedNumber';
import WaveText from '@/components/WaveText';

import PCAScatter from '@/components/charts/PCAScatter';
import ParallelCoordinates from '@/components/charts/ParallelCoordinates';
import ScatterMatrix from '@/components/charts/ScatterMatrix';
import Treemap from '@/components/charts/Treemap';
import Sunburst from '@/components/charts/Sunburst';

import { PROVINCE_DATA, type ProvinceDatum } from '@/data/provinces';
import { HIERARCHY_DATA } from '@/data/hierarchy';
import type { MigrationDataset } from '@/data/migration';
import { INDICATOR_KEYS, INDICATOR_LABELS, computePCA, pearson } from '@/lib/stats';

const NAV_ITEMS = [
  { id: 'hero', label: 'Pembuka' },
  { id: 'bab-1', label: 'Multivariat' },
  { id: 'bab-2', label: 'Migrasi' },
  { id: 'bab-3', label: 'Ekonomi' },
  { id: 'epilog', label: 'Penutup' },
];

const ALL_PROVINCES = PROVINCE_DATA.map(d => d.provinsi).sort((a, b) => a.localeCompare(b));
const MATRIX_VARIABLES = [...INDICATOR_KEYS].slice(0, 5);
const MigrationFlowCharts = lazy(() => import('@/components/charts/MigrationFlowCharts'));

export default function App() {
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [pcaTab, setPcaTab] = useState('pca');
  const [hierarchyTab, setHierarchyTab] = useState('treemap');
  const [focusPair, setFocusPair] = useState<[string, string]>(['ipm', 'kemiskinan']);
  const [migrationDataset, setMigrationDataset] = useState<MigrationDataset | null>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [migrationOrigin, setMigrationOrigin] = useState('all');
  const [migrationDestination, setMigrationDestination] = useState('all');
  const [migrationChartsVisible] = useState(true);
  const [sectorChartVisible, setSectorChartVisible] = useState(false);
  const [sectorTooltip, setSectorTooltip] = useState<{
    sektor: string;
    nilai: number;
    kontribusi: number;
    x: number;
    y: number;
  } | null>(null);
  const sectorChartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/Data%20Migrasi%20Risen%20Antarprovinsi.xlsx').then(response => {
        if (!response.ok) throw new Error(`Workbook tidak dapat dimuat (${response.status}).`);
        return response.arrayBuffer();
      }),
      import('@/data/migration'),
    ])
      .then(([buffer, { parseMigrationWorkbook }]) => {
        if (!cancelled) setMigrationDataset(parseMigrationWorkbook(buffer));
      })
      .catch(error => {
        if (!cancelled) setMigrationError(error instanceof Error ? error.message : 'Workbook migrasi gagal dibaca.');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const revealNodes = document.querySelectorAll('[data-reveal]');
    if (!revealNodes.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealNodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = sectorChartRef.current;
    if (!node || sectorChartVisible) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setSectorChartVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setSectorChartVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.18 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [sectorChartVisible]);

  useEffect(() => {
    const parallaxNodes = document.querySelectorAll<HTMLElement>('[data-parallax]');
    if (!parallaxNodes.length) return;

    let ticking = false;

    const updateParallax = () => {
      const viewportHeight = window.innerHeight;

      parallaxNodes.forEach(node => {
        const rect = node.getBoundingClientRect();
        const distanceFromCenter = (viewportHeight / 2 - rect.top) / viewportHeight;
        const drift = distanceFromCenter * 18;
        node.style.transform = `translate3d(0, ${drift}px, 0)`;
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleProvince = (p: string) => {
    setHighlighted(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  const updateFocusPair = (index: 0 | 1, value: string) => {
    setFocusPair(prev => {
      const next = [...prev] as [string, string];
      next[index] = value;
      return next;
    });
  };

  const focusCorrelation = useMemo(() => {
    const [xKey, yKey] = focusPair;
    return pearson(
      PROVINCE_DATA.map(d => d[xKey as keyof ProvinceDatum] as number),
      PROVINCE_DATA.map(d => d[yKey as keyof ProvinceDatum] as number)
    );
  }, [focusPair]);

  // National metrics
  const nationalMetrics = useMemo(() => {
    const ipmMean = d3.mean(PROVINCE_DATA, d => d.ipm) ?? 0;
    const ipmMax = d3.max(PROVINCE_DATA, d => d.ipm) ?? 0;
    const ipmMin = d3.min(PROVINCE_DATA, d => d.ipm) ?? 0;
    const giniMean = d3.mean(PROVINCE_DATA, d => d.gini) ?? 0;
    const miskinMean = d3.mean(PROVINCE_DATA, d => d.kemiskinan) ?? 0;
    const pendudukTotal = d3.sum(PROVINCE_DATA, d => d.penduduk) ?? 0;
    return [
      { label: 'Total Penduduk', value: `${pendudukTotal.toFixed(0)} jt`, sub: 'Tahun 2024' },
      { label: 'IPM Rata-rata', value: ipmMean.toFixed(1), sub: 'Rata-rata antarprovinsi' },
      { label: 'Rasio Gini', value: giniMean.toFixed(2), sub: 'Rata-rata antarprovinsi' },
      { label: 'Kemiskinan Rata-rata', value: `${miskinMean.toFixed(1)}%`, sub: 'Rata-rata persentase tiap provinsi' },
      { label: 'Rentang IPM', value: `${(ipmMax - ipmMin).toFixed(1)}`, sub: `${ipmMin.toFixed(1)} – ${ipmMax.toFixed(1)}` },
    ];
  }, []);

  // PCA computation
  const pcaResult = useMemo(
    () => computePCA(PROVINCE_DATA, [...INDICATOR_KEYS], highlighted),
    [highlighted]
  );

  // Top/bottom provinces for narrative
  const ipmRanked = useMemo(() =>
    [...PROVINCE_DATA].sort((a, b) => b.ipm - a.ipm),
    []);
  const topIPM = ipmRanked[0];
  const bottomIPM = ipmRanked[ipmRanked.length - 1];

  // Correlation insights
  const corrIPMKemiskinan = useMemo(() =>
    pearson(PROVINCE_DATA.map(d => d.ipm), PROVINCE_DATA.map(d => d.kemiskinan)),
    []);
  const corrIPMElektrifikasi = useMemo(() =>
    pearson(PROVINCE_DATA.map(d => d.ipm), PROVINCE_DATA.map(d => d.elektrifikasi)),
    []);

  // Hierarchy top sectors
  const sectorTotals = useMemo(() => {
    const map = d3.rollup(HIERARCHY_DATA, v => d3.sum(v, d => d.nilai), d => d.sektor);
    return Array.from(map.entries())
      .map(([sektor, nilai]) => ({ sektor, nilai }))
      .sort((a, b) => b.nilai - a.nilai);
  }, []);
  const totalPDB = sectorTotals.reduce((s, d) => s + d.nilai, 0);

  const updateSectorTooltip = (
    clientX: number,
    clientY: number,
    sektor: string,
    nilai: number,
    kontribusi: number
  ) => {
    const bounds = sectorChartRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const tooltipWidth = 250;
    const tooltipHeight = 82;
    const pointerX = clientX - bounds.left;
    const pointerY = clientY - bounds.top;
    setSectorTooltip({
      sektor,
      nilai,
      kontribusi,
      x: pointerX + tooltipWidth + 18 > bounds.width ? pointerX - tooltipWidth - 14 : pointerX + 14,
      y: pointerY + tooltipHeight + 14 > bounds.height ? pointerY - tooltipHeight - 12 : pointerY + 14,
    });
  };

  const filteredMigrationEdges = useMemo(() => {
    if (!migrationDataset) return [];
    return migrationDataset.edges.filter(edge =>
      (migrationOrigin === 'all' || edge.Prov_Asal === migrationOrigin) &&
      (migrationDestination === 'all' || edge.Prov_Tujuan === migrationDestination)
    );
  }, [migrationDataset, migrationOrigin, migrationDestination]);

  const migrationStats = useMemo(() => {
    const total = d3.sum(filteredMigrationEdges, edge => edge.Jumlah_Migran);
    const topRoute = d3.greatest(filteredMigrationEdges, edge => edge.Jumlah_Migran);
    const inflows = Array.from(
      d3.rollup(filteredMigrationEdges, values => d3.sum(values, edge => edge.Jumlah_Migran), edge => edge.Prov_Tujuan),
      ([province, value]) => ({ province, value })
    ).sort((a, b) => b.value - a.value);
    const outflows = Array.from(
      d3.rollup(filteredMigrationEdges, values => d3.sum(values, edge => edge.Jumlah_Migran), edge => edge.Prov_Asal),
      ([province, value]) => ({ province, value })
    ).sort((a, b) => b.value - a.value);

    return {
      total,
      topRoute,
      topDestination: inflows[0],
      topOrigin: outflows[0],
      topDestinationShare: total > 0 ? (inflows[0]?.value ?? 0) / total : 0,
    };
  }, [filteredMigrationEdges]);

  const chapterOneHighlights = [
    {
      label: 'IPM tertinggi',
      value: <AnimatedNumber value={topIPM.ipm.toFixed(1)} />,
      note: <><span className="story-stat-note-primary">{topIPM.provinsi}</span><span className="story-stat-note-detail">Provinsi dengan kualitas hidup paling tinggi</span></>,
    },
    {
      label: 'IPM terendah',
      value: <AnimatedNumber value={bottomIPM.ipm.toFixed(1)} />,
      note: <><span className="story-stat-note-primary">{bottomIPM.provinsi}</span><span className="story-stat-note-detail">Batas bawah pembangunan manusia nasional</span></>,
    },
    {
      label: 'Korelasi paling kuat',
      value: <>r = <AnimatedNumber value={corrIPMKemiskinan.toFixed(2)} /></>,
      note: 'IPM dan kemiskinan bergerak berlawanan arah',
    },
  ];

  const chapterTwoHighlights = [
    {
      label: 'Arus lintas provinsi',
      value: `${migrationStats.total.toLocaleString('id-ID')} jiwa`,
      note: `${filteredMigrationEdges.length.toLocaleString('id-ID')} rute pada filter aktif`,
    },
    {
      label: 'Rute terbesar',
      value: migrationStats.topRoute
        ? `${migrationStats.topRoute.Jumlah_Migran.toLocaleString('id-ID')} jiwa`
        : 'Belum ada arus',
      note: migrationStats.topRoute
        ? `${migrationStats.topRoute.Prov_Asal} → ${migrationStats.topRoute.Prov_Tujuan}`
        : 'Ubah filter untuk melihat rute',
    },
    {
      label: 'Tujuan arus terbesar',
      value: migrationStats.topDestination
        ? `${migrationStats.topDestination.value.toLocaleString('id-ID')} jiwa`
        : 'Belum ada arus',
      note: migrationStats.topDestination
        ? `${migrationStats.topDestination.province} · ${(migrationStats.topDestinationShare * 100).toFixed(1)}% dari arus terpilih`
        : 'Ubah filter untuk melihat tujuan',
    },
  ];

  const chapterThreeHighlights = [
    {
      label: 'Sektor terbesar',
      value: <><AnimatedNumber value={((sectorTotals[0].nilai / totalPDB) * 100).toFixed(1)} />%</>,
      note: `${sectorTotals[0].sektor} · dari total PDB`,
    },
    {
      label: 'Sektor kedua',
      value: <><AnimatedNumber value={((sectorTotals[1].nilai / totalPDB) * 100).toFixed(1)} />%</>,
      note: `${sectorTotals[1].sektor} · dari total PDB`,
    },
    {
      label: 'Pola ekonomi',
      value: 'Konsentrasi tinggi',
      note: 'Nilai tambah tumbuh di sektor yang lebih padat modal',
    },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <ProgressBar items={NAV_ITEMS} />

      <Hero
        title={<WaveText text="Ketimpangan Pembangunan Indonesia" />}
        subtitle={
          <>
            Dari Aceh hingga Papua, pembangunan Indonesia menunjukkan capaian yang berbeda antarwilayah. Di balik rata-rata nasional, terdapat daerah yang berkembang lebih cepat, tertinggal, serta sektor ekonomi dengan kontribusi nilai tambah yang berbeda.
          </>
        }
      >
        <div className="hero-tags">
          <span className="story-tag">34 provinsi</span>
          <span className="story-tag">10 indikator</span>
          <span className="story-tag">3 dimensi ketimpangan</span>
        </div>
        <MetricStrip metrics={nationalMetrics} />
      </Hero>

      <div id="bab-1" className="scroll-mt-16">
        <ChapterSection
          chapter="Bab 1"
          title="Pola Multivariat Antarprovinsi"
          subtitle="Dalam ruang dengan puluhan indikator, setiap provinsi tidak hanya menampilkan satu angka, tetapi posisi relatifnya di dalam sistem pembangunan nasional."
          narration={
            <>
              Sepuluh indikator utama menggambarkan kondisi pembangunan di setiap provinsi. Melalui PCA, indikator tersebut dirangkum ke dalam dua sumbu utama sehingga pola dan perbedaan karakteristik antarwilayah dapat terlihat lebih jelas.
            </>
          }
          context={
            <>
              <strong className="text-ink">Yang paling mencolok:</strong>
              <br />
PCA menunjukkan bahwa kondisi pembangunan antarprovinsi memiliki pola yang berbeda. Wilayah dengan capaian lebih rendah cenderung memiliki akses layanan dasar yang juga lebih terbatas.
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
            {chapterOneHighlights.map(item => (
              <div key={item.label} className="story-stat-card story-stat-card--development">
                <div className="story-stat-label">{item.label}</div>
                <div className="story-stat-value">{item.value}</div>
                <div className="story-stat-note">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-5 lg:items-stretch">
            <div className="lg:col-span-1 flex h-full flex-col gap-4">
              <ProvinceSelector
                provinces={ALL_PROVINCES}
                selected={highlighted}
                onToggle={toggleProvince}
                onClear={() => setHighlighted(new Set())}
              />

              {pcaTab === 'matrix' && (
                <div className="w-full rounded-xl border border-line bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                      Filter korelasi
                    </h4>
                    <button
                      type="button"
                      className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent hover:text-accent/80"
                      onClick={() => setFocusPair(['ipm', 'kemiskinan'])}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                        Variabel 1
                      </label>
                      <select
                        value={focusPair[0]}
                        onChange={e => updateFocusPair(0, e.target.value)}
                        className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                      >
                        {MATRIX_VARIABLES.map(key => (
                          <option key={key} value={key}>{INDICATOR_LABELS[key]}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                        Variabel 2
                      </label>
                      <select
                        value={focusPair[1]}
                        onChange={e => updateFocusPair(1, e.target.value)}
                        className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                      >
                        {MATRIX_VARIABLES.map(key => (
                          <option key={key} value={key}>{INDICATOR_LABELS[key]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Pasangan yang disorot</div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {INDICATOR_LABELS[focusPair[0]]} × {INDICATOR_LABELS[focusPair[1]]}
                      </span>
                      <span className="text-sm font-bold text-accent">r = {focusCorrelation.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full h-full rounded-xl border border-line bg-white p-4 shadow-sm">
                <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  Variansi dijelaskan
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-soft">Komponen 1</span>
                    <span className="font-semibold text-ink">{pcaResult.summary.pc1Variance.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-line-soft">
                    <div className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${pcaResult.summary.pc1Variance}%` }} />
                  </div>
                  <div className="flex items-center justify-between pt-1 text-sm">
                    <span className="text-ink-soft">Komponen 2</span>
                    <span className="font-semibold text-ink">{pcaResult.summary.pc2Variance.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-line-soft">
                    <div className="h-full rounded-full bg-warm transition-all duration-500"
                      style={{ width: `${pcaResult.summary.pc2Variance}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2 text-sm">
                    <span className="text-ink-soft font-medium">Total</span>
                    <span className="font-bold text-ink">{pcaResult.summary.totalVariance.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 min-w-0 flex h-full flex-col">
              <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-base font-semibold text-ink">
                  {pcaTab === 'pca' && 'Sebaran provinsi dalam ruang tereduksi'}
                  {pcaTab === 'parallel' && 'Profil indikator antarprovinsi'}
                  {pcaTab === 'matrix' && 'Matriks korelasi indikator (diagonal = 1.00, korelasi diri)'}
                </h3>
                <TabSwitcher
                  options={[
                    { key: 'pca', label: 'PCA Scatter' },
                    { key: 'parallel', label: 'Parallel' },
                    { key: 'matrix', label: 'Matriks' },
                  ]}
                  active={pcaTab}
                  onChange={setPcaTab}
                />
              </div>

              <div className="flex h-full flex-col rounded-xl border border-line bg-white p-4 sm:p-6 shadow-sm">
                <div className="overflow-x-auto min-h-[420px] flex-1">
                  {pcaTab === 'pca' && (
                    <PCAScatter points={pcaResult.points} summary={pcaResult.summary} width={920} height={560} />
                  )}
                  {pcaTab === 'parallel' && (
                    <ParallelCoordinates
                      data={PROVINCE_DATA}
                      variables={[...INDICATOR_KEYS]}
                      highlighted={highlighted}
                      width={920}
                      height={460}
                    />
                  )}
                  {pcaTab === 'matrix' && (
                    <ScatterMatrix
                      data={PROVINCE_DATA}
                      variables={MATRIX_VARIABLES}
                      highlighted={highlighted}
                      focusPair={focusPair}
                      width={920}
                    />
                  )}
                </div>

                {pcaTab === 'pca' && (
                  <ChartCaption>
                    Setiap titik mewakili satu provinsi. Sumbu merangkum variasi dari sepuluh indikator; panah menunjukkan arah loading indikator dan diskalakan untuk keterbacaan. Warna membedakan asal pulau.
                  </ChartCaption>
                )}
                {pcaTab === 'parallel' && (
                  <ChartCaption>
                    Garis berwarna menunjukkan provinsi yang disorot; garis abu-abu adalah provinsi lain. Setiap
                    sumbu mewakili satu indikator pembangunan.
                  </ChartCaption>
                )}
                {pcaTab === 'matrix' && (
                  <ChartCaption>
                    Diagonal menampilkan korelasi sebuah indikator dengan dirinya sendiri, sehingga nilainya selalu 1.00.
                    Sel di luar diagonal menunjukkan hubungan bivariat antar indikator; semakin mendekati 1 atau -1,
                    semakin kuat hubungan liniernya. Warna mencerminkan kelompok pulau.
                  </ChartCaption>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="rounded-2xl border border-line bg-canvas p-4 text-sm leading-6 text-ink-soft shadow-sm">
              <p className="font-semibold uppercase tracking-[0.12em] text-[10px] text-ink-muted">Interpretasi</p>
              <p className="mt-3 font-medium text-ink">Capaian pembangunan berbeda antarprovinsi.</p>
              <p className="mt-2">
                <strong>{topIPM.provinsi}</strong> mencatat IPM tertinggi dengan nilai {topIPM.ipm.toFixed(1)}, sementara
                <strong> {bottomIPM.provinsi}</strong> berada di posisi terendah dengan {bottomIPM.ipm.toFixed(1)}. Korelasi
                antara IPM dan kemiskinan menunjukkan hubungan negatif yang kuat (r = {corrIPMKemiskinan.toFixed(2)}), yang
                berarti provinsi dengan tingkat kemiskinan lebih tinggi cenderung memiliki IPM yang lebih rendah. Sementara itu,
                akses listrik memiliki korelasi positif dengan IPM (r = {corrIPMElektrifikasi.toFixed(2)}), menunjukkan bahwa
                ketersediaan layanan dasar turut berkaitan dengan capaian pendidikan, kesehatan, dan produktivitas masyarakat.
              </p>
            </div>
          </div>
        </ChapterSection>
      </div>

      <TransitionQuote
        quote="Pola pembangunan memberi konteks; arus migrasi memperlihatkan hubungan nyata antarwilayah melalui perpindahan penduduk."
      />

      <div id="bab-2" className="scroll-mt-16">
        <ChapterSection
          chapter="Bab 2"
          title="Arus Migrasi Risen Antarprovinsi"
          subtitle={`Data migrasi risen ${migrationDataset?.years.join(', ') ?? '2022'} mencatat provinsi tempat tinggal lima tahun sebelumnya dan provinsi tempat tinggal saat pencacahan.`}
          narration={
            <>
              Setiap arus menghubungkan provinsi asal dengan tujuan. Sankey merangkum volume antar pasangan, sementara Flowmap menempatkan rute pada geografi Indonesia dengan arah panah dan ketebalan garis yang mengikuti jumlah migran.
            </>
          }
          context={
            <>
              <strong className="text-ink">Batas pembacaan:</strong>
              <br />
              Workbook hanya menyediakan tahun 2022. Karena itu, visualisasi membandingkan tujuan dan asal pada tahun tersebut, bukan perubahan tren dari tahun ke tahun. Jumlah migran menunjukkan volume perpindahan, bukan alasan seseorang pindah.
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
            {chapterTwoHighlights.map(item => (
              <div key={item.label} className="story-stat-card story-stat-card--mobility">
                <div className="story-stat-label">{item.label}</div>
                <div className="story-stat-value">{item.value}</div>
                <div className="story-stat-note">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 lg:items-stretch">
            <div className="lg:col-span-1 flex h-full flex-col gap-4">
              <div className="story-soft-panel space-y-4 p-4">
                <h3 className="text-sm font-semibold text-ink">Filter arus</h3>
                <div>
                  <label htmlFor="migration-origin" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Provinsi asal</label>
                  <div className="relative">
                    <select
                      id="migration-origin"
                      value={migrationOrigin}
                      onChange={event => setMigrationOrigin(event.target.value)}
                      className="w-full appearance-none rounded-xl border border-line bg-white/75 px-3.5 py-3 pr-10 text-sm font-medium text-ink shadow-sm transition-colors hover:border-accent/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                    >
                      <option value="all">Semua provinsi</option>
                      {(migrationDataset?.provinces ?? []).map(province => <option key={province} value={province}>{province}</option>)}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  </div>
                </div>
                <div>
                  <label htmlFor="migration-destination" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Provinsi tujuan</label>
                  <div className="relative">
                    <select
                      id="migration-destination"
                      value={migrationDestination}
                      onChange={event => setMigrationDestination(event.target.value)}
                      className="w-full appearance-none rounded-xl border border-line bg-white/75 px-3.5 py-3 pr-10 text-sm font-medium text-ink shadow-sm transition-colors hover:border-accent/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                    >
                      <option value="all">Semua provinsi</option>
                      {(migrationDataset?.provinces ?? []).map(province => <option key={province} value={province}>{province}</option>)}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-ink">Asal → tujuan · {migrationDataset?.years.join(', ') ?? '2022'}</h3>
              </div>

              <div className="story-soft-panel p-4 sm:p-6">
                {migrationError ? (
                  <div role="alert" className="flex min-h-40 items-center justify-center text-sm text-warm-deep">Data migrasi gagal dimuat: {migrationError}</div>
                ) : migrationDataset ? (
                  migrationChartsVisible ? (
                    <Suspense fallback={<div className="flex min-h-[1680px] items-start justify-center pt-12 text-sm text-ink-muted">Memuat visualisasi migrasi…</div>}>
                      <MigrationFlowCharts edges={filteredMigrationEdges} provinces={migrationDataset.provinces} />
                    </Suspense>
                  ) : (
                    <div className="flex min-h-[1680px] items-start justify-center pt-12 text-sm text-ink-muted">Visualisasi migrasi akan dimuat saat section mendekati layar.</div>
                  )
                ) : (
                  <div className="flex min-h-40 items-center justify-center text-sm text-ink-muted">Membaca workbook migrasi…</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="rounded-2xl border border-line bg-canvas p-4 text-sm leading-6 text-ink-soft shadow-sm">
              <p className="font-semibold uppercase tracking-[0.12em] text-[10px] text-ink-muted">Interpretasi</p>
              <p className="mt-3 font-medium text-ink">
                {migrationStats.topRoute && migrationStats.topDestination
                  ? `Rute terbesar mengarah ke ${migrationStats.topRoute.Prov_Tujuan}.`
                  : 'Belum ada arus yang cocok dengan filter.'}
              </p>
              <p className="mt-2">
                {migrationStats.topRoute && migrationStats.topDestination ? (
                  <>Pada kombinasi filter saat ini, rute terbesar adalah <strong>{migrationStats.topRoute.Prov_Asal} → {migrationStats.topRoute.Prov_Tujuan}</strong> dengan {migrationStats.topRoute.Jumlah_Migran.toLocaleString('id-ID')} jiwa. <strong>{migrationStats.topDestination.province}</strong> menerima arus masuk terbesar, sebanyak {migrationStats.topDestination.value.toLocaleString('id-ID')} jiwa atau {(migrationStats.topDestinationShare * 100).toFixed(1)}% dari seluruh arus yang ditampilkan setelah filter. Angka ini menggambarkan konsentrasi tujuan, tetapi tidak menjelaskan motif perpindahan.</>
                ) : 'Tidak ada arus lintas provinsi yang sesuai dengan kombinasi filter saat ini.'}
              </p>
            </div>
          </div>
        </ChapterSection>
      </div>

      <TransitionQuote
        quote="Arus menunjukkan hubungan asal dan tujuan; untuk memahami alasan perpindahan, diperlukan data lain di luar matriks ini."
      />

      <div id="bab-3" className="scroll-mt-16">
        <ChapterSection
          chapter="Bab 3"
          title="Struktur Ekonomi yang Tidak Merata"
          subtitle="PDB nasional bukan hanya sekadar angka besar; ia adalah peta distribusi nilai tambah dan kekuatan ekonomi antar sektor."
          narration={
            <>
              Ketimpangan pembangunan juga tercermin dari bagaimana nilai ekonomi tersebar antar sektor. Treemap dan sunburst menunjukkan struktur PDB dari tingkat sektor hingga rincian, sehingga terlihat sektor yang menjadi penggerak utama sekaligus sektor yang kontribusinya masih relatif kecil.
            </>
          }
          context={
            <>
              <strong className="text-ink">Yang paling berpengaruh:</strong>
              <br />
              Struktur ekonomi tidak hanya dilihat dari besarnya output, tetapi juga dari bagaimana nilai tambah tersebar. Ketika ekonomi didominasi oleh beberapa sektor, pertumbuhan nasional belum tentu dirasakan secara merata oleh masyarakat.
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-14 lg:mb-20">
            {chapterThreeHighlights.map(item => (
              <div key={item.label} className="story-stat-card story-stat-card--economy">
                <div className="story-stat-label">{item.label}</div>
                <div className="story-stat-value">{item.value}</div>
                <div className="story-stat-note">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="relative mb-28 lg:mb-32" ref={sectorChartRef} onMouseLeave={() => setSectorTooltip(null)}>
            <div className="grid gap-8 lg:gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
              <div className="rounded-2xl border border-line bg-canvas p-4 text-sm leading-6 text-ink-soft shadow-sm">
                <p className="font-semibold uppercase tracking-[0.12em] text-[10px] text-ink-muted">Interpretasi</p>
                <p className="mt-3 font-medium text-ink">Struktur ekonomi masih sangat terkonsentrasi.</p>
                <p className="mt-2">
                  Sektor <strong>{sectorTotals[0].sektor}</strong> menjadi penyumbang terbesar PDB, dengan kontribusi sekitar
                  {((sectorTotals[0].nilai / totalPDB) * 100).toFixed(1)}% ({sectorTotals[0].nilai.toLocaleString('id-ID')} triliun rupiah),
                  disusul oleh <strong>{sectorTotals[1].sektor}</strong> sebesar {((sectorTotals[1].nilai / totalPDB) * 100).toFixed(1)}%.
                  Artinya, output ekonomi nasional masih sangat bergantung pada beberapa sektor inti, sehingga pertumbuhan belum
                  serta merta mencerminkan pemerataan nilai tambah di seluruh kegiatan ekonomi.
                </p>
              </div>

              <div className="rounded-2xl p-0">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">Kontribusi 9 sektor terhadap PDB</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Persentase total</span>
                </div>

                <div className="space-y-4">
                  {sectorTotals.map((s, i) => {
                    const pct = (s.nilai / totalPDB) * 100;
                    const width = sectorChartVisible ? `${pct}%` : '0%';
                    const barColor = ['#1d6d7b', '#3d8c93', '#6b7f94', '#d98d55', '#7d8a63', '#4b7aa6', '#c66a5d', '#9a7ba1', '#4a6a5e'][i % 9];

                    return (
                      <div
                        key={s.sektor}
                        className="space-y-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                        tabIndex={0}
                        onMouseEnter={event => updateSectorTooltip(event.clientX, event.clientY, s.sektor, s.nilai, pct)}
                        onMouseMove={event => updateSectorTooltip(event.clientX, event.clientY, s.sektor, s.nilai, pct)}
                        onFocus={event => {
                          const bounds = event.currentTarget.getBoundingClientRect();
                          updateSectorTooltip(bounds.right, bounds.top + bounds.height / 2, s.sektor, s.nilai, pct);
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 text-[11px] sm:text-[12px]">
                          <span className="min-w-0 flex-1 truncate pr-4 text-ink-soft">{s.sektor}</span>
                          <span
                            className="font-semibold text-ink transition-all duration-500"
                            style={{
                              opacity: sectorChartVisible ? 1 : 0,
                              transform: sectorChartVisible ? 'translateX(0)' : 'translateX(8px)',
                              transitionDelay: `${i * 180 + 550}ms`,
                            }}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-line-soft">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width,
                              backgroundColor: barColor,
                              transitionDelay: `${i * 180 + 500}ms`,
                              boxShadow: sectorChartVisible ? '0 8px 16px rgba(29, 109, 123, 0.14)' : 'none',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {sectorTooltip && (
              <div
                role="tooltip"
                className="map-tooltip visible"
                style={{ left: sectorTooltip.x, top: sectorTooltip.y, minWidth: 230, whiteSpace: 'normal' }}
              >
                <div style={{ fontWeight: 700, marginBottom: 3 }}>{sectorTooltip.sektor}</div>
                <div style={{ color: '#a8b6c0' }}>
                  Nilai PDB: <span style={{ color: '#fff', fontWeight: 600 }}>{sectorTooltip.nilai.toLocaleString('id-ID')} T</span>
                </div>
                <div style={{ color: '#a8b6c0' }}>
                  Kontribusi: <span style={{ color: '#fff', fontWeight: 600 }}>{sectorTooltip.kontribusi.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-28 mb-4 flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-base font-semibold text-ink">
              {hierarchyTab === 'treemap' ? 'Treemap "Proporsi Nilai Ekonomi"' : 'Sunburst "Struktur Radial"'}
            </h3>
            <TabSwitcher
              options={[
                { key: 'treemap', label: 'Treemap' },
                { key: 'sunburst', label: 'Sunburst' },
              ]}
              active={hierarchyTab}
              onChange={setHierarchyTab}
            />
          </div>

          <div className="mb-12 lg:mb-16">
            {hierarchyTab === 'treemap' && (
              <div className="grid gap-4 lg:gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
                <div className="min-w-0 overflow-visible rounded-2xl p-0">
                  <Treemap data={HIERARCHY_DATA} width={920} height={560} />
                </div>
                <div className="rounded-2xl border border-line bg-canvas p-4 text-sm leading-6 text-ink-soft shadow-sm">
                  <p className="font-semibold uppercase tracking-[0.12em] text-[10px] text-ink-muted">Interpretasi</p>
                  <p className="mt-3 font-medium text-ink">Insight struktur ekonomi</p>
                  <p className="mt-2">
                    Blok yang lebih besar menunjukkan kontribusi nilai tambah yang lebih tinggi. Warna yang konsisten membantu
                    membedakan sektor utama dan memberi gambaran seberapa terkonsentrasinya struktur ekonomi nasional.
                  </p>
                  <p className="mt-3">
                    Sektor <strong>{sectorTotals[0].sektor}</strong> menjadi penyumbang terbesar PDB, dengan kontribusi sekitar
                    {((sectorTotals[0].nilai / totalPDB) * 100).toFixed(1)}% ({sectorTotals[0].nilai.toLocaleString('id-ID')} triliun rupiah),
                    disusul oleh <strong>{sectorTotals[1].sektor}</strong> sebesar {((sectorTotals[1].nilai / totalPDB) * 100).toFixed(1)}%.
                    Besarnya kontribusi kedua sektor ini menunjukkan bahwa struktur ekonomi nasional masih cukup terkonsentrasi pada
                    sektor tertentu.
                  </p>
                </div>
              </div>
            )}
            {hierarchyTab === 'sunburst' && (
              <div className="grid gap-4 lg:gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
                <div className="min-w-0 overflow-visible rounded-2xl p-0">
                  <Sunburst data={HIERARCHY_DATA} width={760} height={560} />
                </div>
                <div className="rounded-2xl border border-line bg-canvas p-4 text-sm leading-6 text-ink-soft shadow-sm">
                  <p className="font-semibold uppercase tracking-[0.12em] text-[10px] text-ink-muted">Interpretasi</p>
                  <p className="mt-3 font-medium text-ink">Insight struktur ekonomi</p>
                  <p className="mt-2">
                    Ring terdalam mewakili sektor, ring tengah subsektor, dan ring terluar rincian aktivitas. Pola ini membantu
                    melihat bagaimana nilai tambah bergantung pada kumpulan aktivitas yang membentuk sektor utama.
                  </p>
                  <p className="mt-3">
                    Sektor <strong>{sectorTotals[0].sektor}</strong> menjadi penyumbang terbesar PDB, dengan kontribusi sekitar
                    {((sectorTotals[0].nilai / totalPDB) * 100).toFixed(1)}% ({sectorTotals[0].nilai.toLocaleString('id-ID')} triliun rupiah),
                    disusul oleh <strong>{sectorTotals[1].sektor}</strong> sebesar {((sectorTotals[1].nilai / totalPDB) * 100).toFixed(1)}%.
                    Sementara itu, kontribusi sektor lainnya masih lebih kecil, sehingga pertumbuhan ekonomi belum tentu mencerminkan
                    pemerataan nilai tambah di seluruh kegiatan ekonomi.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ChapterSection>
      </div>

      <div id="epilog" className="scroll-mt-16">
        <div className="mb-14 lg:mb-20">
          <TransitionQuote
            quote="Ketimpangan bukan sekadar angka. Di dalamnya terdapat perbedaan akses, peluang, dan kesempatan untuk membangun masa futur."
          />
        </div>

        <div className="max-w-5xl mx-auto px-6 sm:px-8 pb-20">
          <div className="mb-14 text-center">
            <h3 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl">
              3 Sisi Ketimpangan yang Terlihat
            </h3>
          </div>

          <div className="grid gap-8 lg:gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">01</div>
              <h4 className="text-xl font-bold text-ink">IPM lebih tinggi berkaitan dengan kemiskinan lebih rendah.</h4>
              <p className="mt-3 text-sm leading-7 text-ink-soft">
                Pada 34 provinsi dalam data yang digunakan, IPM dan kemiskinan memiliki korelasi negatif kuat (r = {corrIPMKemiskinan.toFixed(2)}). Artinya, provinsi dengan kemiskinan lebih tinggi cenderung memiliki IPM lebih rendah. Hubungan ini bersifat korelasional dan tidak menunjukkan sebab-akibat.
              </p>
            </article>

            <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">02</div>
              <h4 className="text-xl font-bold text-ink">Elektrifikasi berkaitan dengan IPM lebih tinggi.</h4>
              <p className="mt-3 text-sm leading-7 text-ink-soft">
                Akses elektrifikasi dan IPM menunjukkan korelasi positif (r = {corrIPMElektrifikasi.toFixed(2)}) pada data provinsi ini. Angka tersebut menunjukkan keduanya cenderung meningkat bersama, tetapi belum membuktikan bahwa elektrifikasi sendiri menyebabkan kenaikan IPM.
              </p>
            </article>

            <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">03</div>
              <h4 className="text-xl font-bold text-ink">Tiga sektor terbesar mencakup 63,6% nilai pada tabel.</h4>
              <p className="mt-3 text-sm leading-7 text-ink-soft">
                Jasa Lainnya menyumbang 23,6% (Rp3.339 triliun), Pertanian, Kehutanan &amp; Perikanan 20,6%, dan Industri Pengolahan 19,4%. Gabungannya menunjukkan porsi besar pada tiga kelompok teratas dalam tabel; angka ini sendiri tidak mengukur pemerataan pendapatan, dampak kesejahteraan, atau konsentrasi kepemilikan.
              </p>
            </article>
          </div>

          <div className="mt-36 mb-20">
            <blockquote className="closing-quote mx-auto max-w-3xl border-y border-accent/20 py-12 text-center font-serif text-xl italic leading-relaxed text-accent-deep sm:text-2xl">
              <span aria-hidden="true" className="closing-quote-mark closing-quote-mark--open">“</span>
              Di balik angka rata-rata nasional, pembangunan Indonesia bergerak dengan ritme yang berbeda di setiap wilayah. Arus migrasi memperlihatkan keterhubungan antardaerah, sementara perbedaan IPM, kemiskinan, elektrifikasi, dan struktur ekonomi menunjukkan bahwa kemajuan tidak hadir dalam satu wajah. Pada akhirnya, pertumbuhan baru benar-benar menjadi kemajuan bersama ketika manfaat dan kesempatan dapat dirasakan oleh lebih banyak wilayah.
              <span aria-hidden="true" className="closing-quote-mark closing-quote-mark--close">”</span>
            </blockquote>
          </div>

          <div className="mt-20 sm:mt-24 pb-16">
            <div className="mx-auto flex max-w-[300px] items-center justify-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-ink/20 to-transparent" />
              <div className="inline-flex items-center rounded-full border border-line bg-white/90 px-4 py-2 shadow-[0_10px_30px_rgba(21,50,37,0.06)] backdrop-blur-sm">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.46em] text-ink">THE END</span>
              </div>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-ink/20 to-transparent" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
