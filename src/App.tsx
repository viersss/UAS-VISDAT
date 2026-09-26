import { useState, useMemo, useEffect } from 'react';
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
  { id: 'bab-1', label: 'I. Multivariat' },
  { id: 'bab-2', label: 'II. Geospasial' },
  { id: 'bab-3', label: 'III. Hierarki' },
  { id: 'epilog', label: 'Epilog' },
];

const ALL_PROVINCES = PROVINCE_DATA.map(d => d.provinsi).sort((a, b) => a.localeCompare(b));

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
  const [geo, setGeo] = useState<GeoCollection | null>(null);

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

  const toggleProvince = (p: string) => {
    setHighlighted(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

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

  return (
    <div className="min-h-screen bg-canvas">
      <ProgressBar items={NAV_ITEMS} />

      {/* HERO */}
      <Hero
        eyebrow=""
        title={<>Ketimpangan Pembangunan Indonesia</>}
        subtitle={
          <>
            Dari Sabang sampai Merauke, angka-angka pembangunan tidak pernah terdistribusi merata.
            Setiap provinsi, setiap kabupaten, setiap sektor ekonomi menyimpan kisahnya sendiri,
            kisah tentang siapa yang maju, siapa yang tertinggal, dan mengapa kesenjangan itu terus bertumbuh.
          </>
        }
      >
        <div className="mt-10">
          <MetricStrip metrics={nationalMetrics} />
        </div>
      </Hero>

      {/* BAB 1: MULTIVARIAT */}
      <div id="bab-1" className="scroll-mt-16">
        <ChapterSection
          chapter=""
          title="Pola Multivariat Antarprovinsi"
          subtitle="Bayangkan 34 provinsi sebagai titik dalam ruang berdimensi banyak — setiap dimensi adalah satu indikator pembangunan."
          narration={
            <>
              Setiap provinsi Indonesia membawa sepuluh indikator pembangunan sekaligus: IPM,
              kemiskinan, pendidikan, listrik, air bersih, sanitasi, dan lainnya. Dari atas,
              semuanya tampak menyatu. Tapi ketika kita mereduksi dimensi-dimensi itu ke dalam
              dua sumbu utama, pola ketimpangan yang tersembunyi mulai terungkap.
            </>
          }
          context={
            <>
              <strong className="text-ink">Mengapa data ini penting?</strong>
              <br />
              Analisis multivariat memungkinkan kita melihat hubungan simultan antar indikator
              yang tidak terlihat jika diperiksa satu per satu. PCA mengompresi banyak variabel
              menjadi sedikit sumbu yang masih menyimpan sebagian besar informasi.
            </>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ProvinceSelector
                provinces={ALL_PROVINCES}
                selected={highlighted}
                onToggle={toggleProvince}
                onClear={() => setHighlighted(new Set())}
              />
              <div className="mt-4 bg-white border border-line rounded-xl p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">
                  Variansi Dijelaskan
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-soft">Komponen 1</span>
                    <span className="font-semibold text-ink">{pcaResult.summary.pc1Variance.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-line-soft rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${pcaResult.summary.pc1Variance}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-ink-soft">Komponen 2</span>
                    <span className="font-semibold text-ink">{pcaResult.summary.pc2Variance.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-line-soft rounded-full overflow-hidden">
                    <div className="h-full bg-warm rounded-full transition-all duration-500"
                      style={{ width: `${pcaResult.summary.pc2Variance}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-line-soft mt-2">
                    <span className="text-ink-soft font-medium">Total</span>
                    <span className="font-bold text-ink">{pcaResult.summary.totalVariance.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-ink">
                  {pcaTab === 'pca' && 'Sebaran Provinsi dalam Ruang Tereduksi'}
                  {pcaTab === 'parallel' && 'Profil Indikator Antarprovinsi'}
                  {pcaTab === 'matrix' && 'Matriks Korelasi Indikator'}
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

              <div className="bg-white border border-line rounded-xl p-4 sm:p-6 overflow-x-auto">
                {pcaTab === 'pca' && (
                  <>
                    <PCAScatter points={pcaResult.points} summary={pcaResult.summary} width={920} height={560} />
                    <ChartCaption>
                      Setiap titik adalah satu provinsi. Sumbu merupakan kombinasi linear
                      terstandardisasi dari 10 indikator pembangunan. Warna menunjukkan pulau.
                    </ChartCaption>
                  </>
                )}
                {pcaTab === 'parallel' && (
                  <>
                    <ParallelCoordinates
                      data={PROVINCE_DATA}
                      variables={[...INDICATOR_KEYS]}
                      highlighted={highlighted}
                      width={920}
                      height={460}
                    />
                    <ChartCaption>
                      Garis berwarna merepresentasikan provinsi yang disorot; garis abu-abu
                      adalah provinsi lainnya. Setiap sumbu vertikal adalah satu indikator.
                    </ChartCaption>
                  </>
                )}
                {pcaTab === 'matrix' && (
                  <>
                    <ScatterMatrix
                      data={PROVINCE_DATA}
                      variables={[...INDICATOR_KEYS]}
                      highlighted={highlighted}
                      width={920}
                    />
                    <ChartCaption>
                      Diagonal menunjukkan nilai korelasi (r) antar indikator. Selain diagonal
                      adalah sebar bivariate. Warna menunjukkan pulau asal provinsi.
                    </ChartCaption>
                  </>
                )}
              </div>

              <InsightPanel title="Apa yang terungkap?">
                <p>
                  <strong>{topIPM.provinsi}</strong> memiliki IPM tertinggi ({topIPM.ipm.toFixed(1)}),
                  sementara <strong>{bottomIPM.provinsi}</strong> berada di posisi terendah
                  ({bottomIPM.ipm.toFixed(1)}). Korelasi antara IPM dan kemiskinan sangat kuat
                  (r = {corrIPMKemiskinan.toFixed(2)}), menunjukkan bahwa keduanya saling berkelindan.
                  Akses elektrifikasi berkorelasi positif dengan IPM (r = {corrIPMElektrifikasi.toFixed(2)}),
                  menandakan infrastruktur dasar adalah fondasi pembangunan manusia.
                </p>
              </InsightPanel>
            </div>
          </div>
        </ChapterSection>
      </div>

      <TransitionQuote
        quote="Angka-angka provinsi adalah rata-rata yang menyembunyikan kisah yang lebih dalam — di baliknya, ratusan kabupaten dan kota menyimpan jurang ketimpangan yang tak terlihat dari atas."
      />

      {/* BAB 2: GEOSPASIAL */}
      <div id="bab-2" className="scroll-mt-16">
        <ChapterSection
          chapter=""
          title="Kesenjangan Spasial Antarkabupaten/Kota"
          subtitle="Dari ketinggian provinsi, kita turun ke permukaan bumi — geografi bukan sekadar latar, geografi adalah nasib."
          narration={
            <>
              Setiap kabupaten dan kota memiliki warna sendiri dalam peta ketimpangan. Sebuah
              kota besar bisa bersinar terang dengan IPM tinggi, sementara kabupaten tetangganya
              yang berbatasan langsung tertinggal jauh. Peta choropleth mengungkap konsentrasi
              geografis dan memperlihatkan pola ketimpangan yang muncul di ruang nyata.
            </>
          }
          context={
            <>
              <strong className="text-ink">Mengapa data ini penting?</strong>
              <br />
              Visualisasi spasial mengungkap di mana indikator menggerombol dan di mana terjadi
              lompatan dramatis antar wilayah bertetangga — pola yang tak terlihat dalam
              tabel angka.
            </>
          }
        >
          {/* Spatial metric summary by pulau */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {spatialByPulau.map(g => (
              <div key={g.pulau} className="bg-white border border-line rounded-lg px-3 py-3">
                <div className="text-xs font-medium text-ink-muted truncate">{g.pulau}</div>
                <div className="text-lg font-bold text-ink mt-1">{g.avgIPM.toFixed(1)}</div>
                <div className="text-[0.65rem] text-ink-muted">IPM rata-rata</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white border border-line rounded-xl p-4 mb-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-3">
                  Indikator Peta
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
              <div className="bg-white border border-line rounded-xl p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">
                  Perbandingan AntarPulau
                </h4>
                <div className="space-y-3">
                  {spatialByPulau.map(g => {
                    const maxIPM = spatialByPulau[0].avgIPM;
                    return (
                      <div key={g.pulau}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-ink-soft truncate">{g.pulau}</span>
                          <span className="font-semibold text-ink">{g.avgIPM.toFixed(1)}</span>
                        </div>
                        <div className="h-1.5 bg-line-soft rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all duration-500"
                            style={{ width: `${(g.avgIPM / maxIPM) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-ink">
                  Peta Choropleth — {mapMetricInfo.label}
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
                      Warna provinsi merepresentasikan nilai {mapMetricInfo.label.toLowerCase()}.
                      Wilayah yang disorot memiliki garis tepi lebih tebal.
                    </ChartCaption>
                  </>
                )}
                {!geo && (
                  <div className="h-[400px] flex items-center justify-center text-ink-muted text-sm">
                    Memuat peta…
                  </div>
                )}
              </div>

              <InsightPanel title="Pola yang terlihat">
                <p>
                  Wilayah Indonesia Timur — terutama Maluku dan Papua — secara konsisten
                  menunjukkan IPM lebih rendah dan kemiskinan lebih tinggi dibanding wilayah
                  barat. Namun PDRB per kapita Papua relatif tinggi berkat sektor pertambangan,
                  menunjukkan bahwa kekayaan sumber daya tidak otomatis menjamin kesejahteraan
                  manusia. Jurang antara kota dan kabupaten pedalamanan menjadi pola berulang.
                </p>
              </InsightPanel>
            </div>
          </div>
        </ChapterSection>
      </div>

      <TransitionQuote
        quote="Jika geografi adalah panggung ketimpangan, maka ekonomi adalah naskahnya — setiap sektor memegang porsi yang tidak adil dari cerita kekayaan bangsa."
      />

      {/* BAB 3: HIERARKI */}
      <div id="bab-3" className="scroll-mt-16">
        <ChapterSection
          chapter=""
          title="Struktur Hierarki Ekonomi Nasional"
          subtitle="Sembilan sektor, puluhan subsektor, ratusan rincian — masing-masing memegang porsi berbeda dari kue nasional."
          narration={
            <>
              Cerita ketimpangan tidak berakhir di wilayah. Ia berakar juga pada struktur ekonomi
              yang membentuk nilai tambah bangsa. Treemap dan sunburst memungkinkan kita melihat
              siapa yang memegang lapisan terbesar, dan siapa yang hanya mendapat remah. Ukuran
              setiap blok merepresentasikan nilai ekonomi dalam triliun rupiah, sementara warna
              mengindikasikan sektor.
            </>
          }
          context={
            <>
              <strong className="text-ink">Mengapa data ini penting?</strong>
              <br />
              Struktur hierarki PDB menunjukkan komposisi ekonomi nasional dalam tiga jenjang:
              sektor, subsektor, dan rincian. Klik pada komponen untuk drill-down dan mengamati
              dekomposisi internal.
            </>
          }
        >
          {/* Sector summary bar */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-ink mb-3">Kontribusi 9 Sektor terhadap PDB</h3>
            <div className="flex h-8 rounded-lg overflow-hidden border border-line">
              {sectorTotals.map((s, i) => {
                const colors = ['#5b9a6a','#8b6b3e','#1a7f8a','#e8a838','#9b6fa8','#3b82f6','#d97742','#ec5f5f','#6b7f94'];
                const pct = (s.nilai / totalPDB) * 100;
                return (
                  <div
                    key={s.sektor}
                    className="flex items-center justify-center text-[0.6rem] font-semibold text-white transition-all duration-300 hover:brightness-110"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: colors[i % colors.length],
                      minWidth: pct > 5 ? 'auto' : '2px',
                    }}
                    title={`${s.sektor}: ${pct.toFixed(1)}% (${s.nilai.toLocaleString('id-ID')} T)`}
                  >
                    {pct > 6 && `${pct.toFixed(1)}%`}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {sectorTotals.map((s, i) => {
                const colors = ['#5b9a6a','#8b6b3e','#1a7f8a','#e8a838','#9b6fa8','#3b82f6','#d97742','#ec5f5f','#6b7f94'];
                const pct = (s.nilai / totalPDB) * 100;
                return (
                  <div key={s.sektor} className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                    <span className="truncate max-w-[180px]">{s.sektor}</span>
                    <span className="font-semibold text-ink">{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">
              {hierarchyTab === 'treemap' ? 'Treemap — Proporsi Nilai Ekonomi' : 'Sunburst — Struktur Radial'}
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

          <div className="bg-white border border-line rounded-xl p-4 sm:p-6 overflow-hidden">
            {hierarchyTab === 'treemap' && (
              <>
                <Treemap data={HIERARCHY_DATA} width={1160} height={600} />
                <ChartCaption>
                  Ukuran blok merepresentasikan nilai (triliun rupiah). Warna menunjukkan sektor,
                  intensitas warna mengindikasikan kontribusi terhadap PDB. Hover untuk detail.
                </ChartCaption>
              </>
            )}
            {hierarchyTab === 'sunburst' && (
              <>
                <Sunburst data={HIERARCHY_DATA} width={780} height={600} />
                <ChartCaption>
                  Ring terdalam adalah sektor, ring tengah adalah subsektor, ring terluar adalah
                  rincian. Hover untuk detail nilai dan kontribusi.
                </ChartCaption>
              </>
            )}
          </div>

          <InsightPanel title="Insight Struktur Ekonomi">
            <p>
              Sektor <strong>{sectorTotals[0].sektor}</strong> menjadi penyumbang terbesar PDB
              ({((sectorTotals[0].nilai / totalPDB) * 100).toFixed(1)}%,
              {' '}{sectorTotals[0].nilai.toLocaleString('id-ID')} triliun rupiah), diikuti oleh
              <strong> {sectorTotals[1].sektor}</strong> ({((sectorTotals[1].nilai / totalPDB) * 100).toFixed(1)}%).
              Struktur ekonomi Indonesia masih bertumpu pada sektor sekunder dan tersier,
              sementara sektor primer seperti pertanian — yang menyerap jutaan tenaga kerja —
              menyumbang porsi yang lebih kecil terhadap nilai tambah nasional.
            </p>
          </InsightPanel>
        </ChapterSection>
      </div>

      {/* EPILOG */}
      <div id="epilog" className="scroll-mt-16">
        <TransitionQuote
          quote="Data tidak berbohong, tetapi juga tidak berbicara sendiri. Dalam ketimpangan yang terukur, terdapat manusia yang tidak terhitung."
        />
        <div className="max-w-3xl mx-auto px-6 sm:px-8 pb-20 text-center">
          <p className="text-sm text-ink-muted leading-relaxed">
            Dashboard Data Storytelling BPS — dirancang untuk eksplorasi analitik.
            <br />
            Setiap angka membawa cerita. Setiap cerita membawa pertanyaan.
            <br />
            Setiap pertanyaan membawa kita lebih dekat ke keadilan.
          </p>
          <p className="text-xs text-ink-muted mt-6">
            Sumber: Badan Pusat Statistik (BPS) — Visualisasi Data & Informasi
          </p>
        </div>
      </div>
    </div>
  );
}
