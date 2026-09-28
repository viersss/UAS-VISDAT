import { useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';

import Hero from '@/components/Hero';
import ProgressBar from '@/components/ProgressBar';
import ChapterSection from '@/components/ChapterSection';
import TransitionQuote from '@/components/TransitionQuote';
import MetricStrip from '@/components/MetricStrip';
import ProvinceSelector from '@/components/ProvinceSelector';
import InsightPanel from '@/components/InsightPanel';
import ChartCaption from '@/components/ChartCaption';
import TabSwitcher from '@/components/TabSwitcher';
import AnimatedNumber from '@/components/AnimatedNumber';
import WaveText from '@/components/WaveText';

import PCAScatter from '@/components/charts/PCAScatter';
import ParallelCoordinates from '@/components/charts/ParallelCoordinates';
import ScatterMatrix from '@/components/charts/ScatterMatrix';
import ChoroplethMap from '@/components/charts/ChoroplethMap';
import Treemap from '@/components/charts/Treemap';
import Sunburst from '@/components/charts/Sunburst';

import { PROVINCE_DATA, type ProvinceDatum } from '@/data/provinces';
import { HIERARCHY_DATA } from '@/data/hierarchy';
import { SPATIAL_DATA, SPATIAL_METRICS, type SpatialMetricKey } from '@/data/spatial';
import { INDICATOR_KEYS, INDICATOR_LABELS, computePCA, pearson } from '@/lib/stats';
import type { GeoCollection } from '@/lib/geo';

const NAV_ITEMS = [
  { id: 'hero', label: 'Pembuka' },
  { id: 'bab-1', label: 'Multivariat' },
  { id: 'bab-2', label: 'Spasial' },
  { id: 'bab-3', label: 'Ekonomi' },
  { id: 'epilog', label: 'Penutup' },
];

const ALL_PROVINCES = PROVINCE_DATA.map(d => d.provinsi).sort((a, b) => a.localeCompare(b));
const MATRIX_VARIABLES = [...INDICATOR_KEYS].slice(0, 5);

const MAP_METRICS = [
  { key: 'ipm', label: 'IPM' },
  { key: 'kemiskinan', label: 'Penduduk Miskin (%)' },
  { key: 'pdrbPerKapita', label: 'PDRB per Kapita (jt Rp)' },
  { key: 'airBersih', label: 'Akses Air Bersih (%)' },
  { key: 'sanitasi', label: 'Sanitasi Layak (%)' },
  { key: 'elektrifikasi', label: 'Elektrifikasi (%)' },
  { key: 'gini', label: 'Rasio Gini' },
  { key: 'hls', label: 'Harapan Lama Sekolah' },
  { key: 'rls', label: 'Rata-rata Lama Sekolah' },
  { key: 'tpt', label: 'Pengangguran (%)' },
] as const;

export default function App() {
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [pcaTab, setPcaTab] = useState('pca');
  const [mapMetric, setMapMetric] = useState<string>('ipm');
  const [hierarchyTab, setHierarchyTab] = useState('treemap');
  const [focusPair, setFocusPair] = useState<[string, string]>(['ipm', 'kemiskinan']);
  const [geo, setGeo] = useState<GeoCollection | null>(null);
  const [sectorChartVisible, setSectorChartVisible] = useState(false);
  const sectorChartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/indonesia-provinces.json')
      .then(r => r.json())
      .then(d => setGeo(d as GeoCollection))
      .catch(() => {});
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
      { label: 'Total Penduduk', value: `${pendudukTotal.toFixed(0)} jt`, sub: '34 provinsi' },
      { label: 'IPM Rata-rata', value: ipmMean.toFixed(1), sub: 'Nasional' },
      { label: 'Rasio Gini', value: giniMean.toFixed(2), sub: 'Nasional' },
      { label: 'Penduduk Miskin', value: `${miskinMean.toFixed(1)}%`, sub: 'Rata-rata' },
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

  // Map metric info
  const mapMetricInfo = MAP_METRICS.find(m => m.key === mapMetric)!;

  // Spatial data grouped by pulau for narrative
  const spatialByPulau = useMemo(() => {
    const groups = d3.groups(SPATIAL_DATA, d => d.pulau);
    return groups.map(([pulau, items]) => ({
      pulau,
      avgIPM: d3.mean(items, d => d.ipm) ?? 0,
      avgKemiskinan: d3.mean(items, d => d.kemiskinan) ?? 0,
      count: items.length,
    })).sort((a, b) => b.avgIPM - a.avgIPM);
  }, []);

  // Hierarchy top sectors
  const sectorTotals = useMemo(() => {
    const map = d3.rollup(HIERARCHY_DATA, v => d3.sum(v, d => d.nilai), d => d.sektor);
    return Array.from(map.entries())
      .map(([sektor, nilai]) => ({ sektor, nilai }))
      .sort((a, b) => b.nilai - a.nilai);
  }, []);
  const totalPDB = sectorTotals.reduce((s, d) => s + d.nilai, 0);

  const chapterOneHighlights = [
    {
      label: 'IPM tertinggi',
      value: <>{topIPM.provinsi} &middot; <AnimatedNumber value={topIPM.ipm.toFixed(1)} /></>,
      note: 'Provinsi dengan kualitas hidup paling tinggi',
    },
    {
      label: 'IPM terendah',
      value: <>{bottomIPM.provinsi} &middot; <AnimatedNumber value={bottomIPM.ipm.toFixed(1)} /></>,
      note: 'Batas bawah pembangunan manusia nasional',
    },
    {
      label: 'Korelasi paling kuat',
      value: <>r = <AnimatedNumber value={corrIPMKemiskinan.toFixed(2)} /></>,
      note: 'IPM dan kemiskinan bergerak berlawanan arah',
    },
  ];

  const chapterTwoHighlights = [
    {
      label: 'Wilayah teratas',
      value: <>{spatialByPulau[0]?.pulau ?? '—'} &middot; <AnimatedNumber value={spatialByPulau[0]?.avgIPM.toFixed(1) ?? '0.0'} /></>,
      note: 'Rata-rata IPM tertinggi di pulau tersebut',
    },
    {
      label: 'Kesenjangan spatial',
      value: <><AnimatedNumber value={Math.max(...spatialByPulau.map(d => d.avgIPM)).toFixed(1)} /> &ndash; <AnimatedNumber value={Math.min(...spatialByPulau.map(d => d.avgIPM)).toFixed(1)} /></>,
      note: 'Jarak rata-rata IPM antar pulau',
    },
    {
      label: 'Pola utama',
      value: 'Timur masih tertinggal',
      note: 'Kekayaan sumber daya belum otomatis mengurangi kesenjangan',
    },
  ];

  const chapterThreeHighlights = [
    {
      label: 'Sektor terbesar',
      value: `${sectorTotals[0].sektor}`,
      note: <><AnimatedNumber value={((sectorTotals[0].nilai / totalPDB) * 100).toFixed(1)} />% dari total PDB</>,
    },
    {
      label: 'Sektor kedua',
      value: `${sectorTotals[1].sektor}`,
      note: <><AnimatedNumber value={((sectorTotals[1].nilai / totalPDB) * 100).toFixed(1)} />% dari total PDB</>,
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
                Sepuluh indikator utama menggambarkan kondisi pembangunan di setiap provinsi. Melalui PCA,
                indikator tersebut dirangkum ke dalam dua sumbu utama sehingga pola dan perbedaan karakteristik
                antarwilayah dapat terlihat lebih jelas.
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
              <div key={item.label} className="story-stat-card">
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
                    Setiap titik mewakili satu provinsi. Sumbu menggambarkan kombinasi linear dari sepuluh indikator,
                    sementara warna membedakan asal pulau.
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
            <InsightPanel title="Apa yang terungkap?">
              <p>
                <strong>{topIPM.provinsi}</strong> mencatat IPM tertinggi dengan nilai {topIPM.ipm.toFixed(1)}, sementara
                <strong> {bottomIPM.provinsi}</strong> berada di posisi terendah dengan {bottomIPM.ipm.toFixed(1)}. Korelasi
                antara IPM dan kemiskinan menunjukkan hubungan negatif yang kuat (r = {corrIPMKemiskinan.toFixed(2)}), yang
                berarti provinsi dengan tingkat kemiskinan lebih tinggi cenderung memiliki IPM yang lebih rendah. Sementara itu,
                akses listrik memiliki korelasi positif dengan IPM (r = {corrIPMElektrifikasi.toFixed(2)}), menunjukkan bahwa
                ketersediaan layanan dasar turut berkaitan dengan capaian pendidikan, kesehatan, dan produktivitas masyarakat.
              </p>
            </InsightPanel>
          </div>
        </ChapterSection>
      </div>

      <TransitionQuote
        quote="Satu angka tidak pernah menceritakan semuanya. Di balik rata-rata nasional, terdapat kesenjangan wilayah yang membentuk perbedaan peluang dan masa depan."
      />

      <div id="bab-2" className="scroll-mt-16">
        <ChapterSection
          chapter="Bab 2"
          title="Kesenjangan Spasial di Bawah Level Provinsi"
          subtitle="Ketika kita menuruni skala dari provinsi ke kabupaten dan kota, pola geografis yang lebih tajam mulai tampak."
          narration={
            <>
              Dalam pembangunan, jarak bukan hanya soal lokasi, tetapi juga akses, layanan, dan peluang. Peta choropleth membantu melihat bagaimana kondisi antarwilayah berbeda dan menunjukkan daerah yang menyimpang dari pola umum.
            </>
          }
          context={
            <>
              <strong className="text-ink">Yang perlu dibedakan:</strong>
              <br />
              Kesenjangan tidak hanya terlihat dari rata-rata provinsi, tetapi juga dari sebarannya di setiap wilayah. Daerah yang berdekatan pun bisa memiliki akses layanan yang berbeda, sehingga angka agregat belum tentu menggambarkan kondisi sebenarnya.
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
            {chapterTwoHighlights.map(item => (
              <div key={item.label} className="story-stat-card">
                <div className="story-stat-label">{item.label}</div>
                <div className="story-stat-value">{item.value}</div>
                <div className="story-stat-note">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 lg:items-stretch">
            <div className="lg:col-span-1 flex h-full flex-col gap-4">
              <ProvinceSelector
                provinces={ALL_PROVINCES}
                selected={highlighted}
                onToggle={toggleProvince}
                onClear={() => setHighlighted(new Set())}
              />

              <div className="bg-white border border-line rounded-xl p-4 shadow-sm">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-3">
                  Indikator peta
                </label>
                <select
                  value={mapMetric}
                  onChange={e => setMapMetric(e.target.value)}
                  className="w-full text-sm bg-canvas border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                >
                  {MAP_METRICS.map(m => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-ink">
                  Peta choropleth "{mapMetricInfo.label}"
                </h3>
              </div>

              <div className="bg-white border border-line rounded-xl p-4 sm:p-6 overflow-x-auto">
                {geo && (
                  <>
                    <ChoroplethMap
                      geo={geo}
                      data={PROVINCE_DATA}
                      metric={mapMetric}
                      metricLabel={mapMetricInfo.label}
                      highlighted={highlighted}
                      width={1000}
                      height={560}
                    />
                    <ChartCaption>
                      Warna wilayah merepresentasikan nilai {mapMetricInfo.label.toLowerCase()}. Wilayah yang disorot
                      memiliki garis tepi lebih tebal agar lebih mudah dibedakan.
                    </ChartCaption>
                  </>
                )}
                {!geo && (
                  <div className="h-[400px] flex items-center justify-center text-ink-muted text-sm">
                    Memuat peta…
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="mt-6">
            <InsightPanel title="Pola yang terlihat">
              <p>
Indonesia Timur, khususnya Maluku dan Papua, masih menunjukkan capaian pembangunan yang relatif lebih rendah dibandingkan wilayah barat Indonesia. Tingginya kemiskinan dan terbatasnya akses terhadap layanan dasar membuat kesenjangan antarwilayah semakin terlihat dalam kehidupan sehari-hari. Sementara itu, tingginya pendapatan di suatu wilayah belum tentu diikuti kualitas hidup yang setara, karena potensi ekonomi perlu didukung oleh pemerataan akses, infrastruktur, dan kapasitas masyarakat lokal.
              </p>
            </InsightPanel>
          </div>
        </ChapterSection>
      </div>

      <TransitionQuote
        quote="Ketimpangan tidak tersebar secara merata. Perbedaan jarak, akses, dan kondisi antarwilayah ikut membentuk kesenjangan yang ada."
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
              <div key={item.label} className="story-stat-card">
                <div className="story-stat-label">{item.label}</div>
                <div className="story-stat-value">{item.value}</div>
                <div className="story-stat-note">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="mb-28 lg:mb-32" ref={sectorChartRef}>
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
                      <div key={s.sektor} className="space-y-1.5">
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
                            title={`${s.sektor}: ${pct.toFixed(1)}%`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
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
              3 insight yang paling menentukan
            </h3>
          </div>

          <div className="grid gap-8 lg:gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Insight 01</div>
              <h4 className="text-xl font-bold text-ink">IPM dan kemiskinan bergerak seiring.</h4>
              <p className="mt-3 text-sm leading-7 text-ink-soft">
                Kualitas hidup tidak naik secara merata ketika kemiskinan tetap tinggi. Korelasi yang kuat menunjukkan
                bahwa kesejahteraan tidak hanya ditentukan oleh pendapatan semata, tetapi juga oleh kapasitas wilayah
                dalam menurunkan pengeluaran dan memperluas akses terhadap kebutuhan dasar.
              </p>
            </article>

            <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Insight 02</div>
              <h4 className="text-xl font-bold text-ink">Listrik adalah pengungkit kesejahteraan.</h4>
              <p className="mt-3 text-sm leading-7 text-ink-soft">
                Akses dasar seperti listrik menjadi fondasi penting bagi pendidikan, kesehatan, dan produktivitas rumah
                tangga. Artinya, infrastruktur dasar bukan pelengkap teknis, melainkan prasyarat agar manfaat
                pembangunan benar-benar menjangkau masyarakat.
              </p>
            </article>

            <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Insight 03</div>
              <h4 className="text-xl font-bold text-ink">Ekonomi nasional masih sangat terkonsentrasi.</h4>
              <p className="mt-3 text-sm leading-7 text-ink-soft">
                Nilai tambah ekonomi belum terdistribusi secara merata. Sektor bernilai tinggi mendominasi struktur PDB,
                sehingga pertumbuhan agregat bisa terlihat kuat, tetapi dampaknya terhadap kesejahteraan masyarakat luas
                masih terbatas dan belum sepenuhnya merata di wilayah yang tertinggal.
              </p>
            </article>
          </div>

          <div className="mt-36 mb-20">
            <blockquote className="relative mx-auto max-w-4xl pl-0 text-justify text-[1.08rem] font-medium italic leading-[1.9] text-ink sm:text-[1.5rem]">
              <span className="absolute -left-1 -top-8 text-[3.5rem] font-bold leading-none text-ink/10">“</span>
              Peningkatan kesejahteraan tidak cukup hanya dijalankan melalui pertumbuhan agregat. Untuk benar-benar
              mengurangi ketimpangan, perlu ada pemerataan akses, penguatan infrastruktur dasar, dan perluasan peluang
              ekonomi di wilayah yang tertinggal.
              <span className="ml-1 text-[3.5rem] align-middle font-bold leading-none text-ink/10">”</span>
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
