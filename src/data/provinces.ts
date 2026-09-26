export interface ProvinceDatum {
  provinsi: string;
  /** Indeks Pembangunan Manusia (0–100) */
  ipm: number;
  /** PDRB per kapita (juta rupiah) */
  pdrbPerKapita: number;
  /** Tingkat pengangguran terbuka (%) */
  tpt: number;
  /** Persentase penduduk miskin (%) */
  kemiskinan: number;
  /** Rasio Gini (0–1) */
  gini: number;
  /** Harapan lama sekolah (tahun) */
  hls: number;
  /** Rata-rata lama sekolah (tahun) */
  rls: number;
  /** Akses air bersih (%) */
  airBersih: number;
  /** Sanitasi layak (%) */
  sanitasi: number;
  /** Rasio elektrifikasi (%) */
  elektrifikasi: number;
  /** Jumlah penduduk (juta jiwa) */
  penduduk: number;
  /** Pulau utama */
  pulau: 'Sumatera' | 'Jawa' | 'Bali-Nusa' | 'Kalimantan' | 'Sulawesi' | 'Maluku-Papua';
}

export interface SpatialDatum {
  nama: string;
  provinsi: string;
  pulau: string;
  /** IPM tingkat kab/kota */
  ipm: number;
  /** Persentase penduduk miskin (%) */
  kemiskinan: number;
  /** Akses air bersih (%) */
  airBersih: number;
  /** Sanitasi layak (%) */
  sanitasi: number;
  /** Rasio elektrifikasi (%) */
  elektrifikasi: number;
}

export interface HierarchyDatum {
  sektor: string;
  subsektor: string;
  rincian: string;
  /** Nilai ekonomi (triliun rupiah) */
  nilai: number;
  /** Kontribusi terhadap total PDB (%) */
  kontribusi: number;
}

export const PROVINCE_DATA: ProvinceDatum[] = [
  { provinsi: 'DI Aceh', ipm: 72.8, pdrbPerKapita: 18.5, tpt: 5.2, kemiskinan: 15.1, gini: 0.34, hls: 12.8, rls: 9.1, airBersih: 68, sanitasi: 55, elektrifikasi: 95, penduduk: 5.3, pulau: 'Sumatera' },
  { provinsi: 'Sumatera Utara', ipm: 73.1, pdrbPerKapita: 22.8, tpt: 5.8, kemiskinan: 9.5, gini: 0.35, hls: 13.0, rls: 9.3, airBersih: 65, sanitasi: 58, elektrifikasi: 98, penduduk: 15.4, pulau: 'Sumatera' },
  { provinsi: 'Sumatera Barat', ipm: 73.2, pdrbPerKapita: 17.2, tpt: 4.9, kemiskinan: 6.8, gini: 0.32, hls: 13.2, rls: 9.5, airBersih: 72, sanitasi: 62, elektrifikasi: 97, penduduk: 5.7, pulau: 'Sumatera' },
  { provinsi: 'Riau', ipm: 74.2, pdrbPerKapita: 35.6, tpt: 4.3, kemiskinan: 8.2, gini: 0.36, hls: 12.9, rls: 9.2, airBersih: 60, sanitasi: 54, elektrifikasi: 96, penduduk: 6.8, pulau: 'Sumatera' },
  { provinsi: 'Jambi', ipm: 72.4, pdrbPerKapita: 24.1, tpt: 4.1, kemiskinan: 9.1, gini: 0.33, hls: 12.7, rls: 9.0, airBersih: 63, sanitasi: 50, elektrifikasi: 96, penduduk: 3.7, pulau: 'Sumatera' },
  { provinsi: 'Sumatera Selatan', ipm: 71.3, pdrbPerKapita: 19.8, tpt: 5.0, kemiskinan: 12.3, gini: 0.34, hls: 12.5, rls: 8.8, airBersih: 58, sanitasi: 47, elektrifikasi: 95, penduduk: 8.7, pulau: 'Sumatera' },
  { provinsi: 'Bengkulu', ipm: 72.0, pdrbPerKapita: 16.4, tpt: 3.8, kemiskinan: 13.2, gini: 0.31, hls: 12.6, rls: 8.9, airBersih: 61, sanitasi: 48, elektrifikasi: 94, penduduk: 2.0, pulau: 'Sumatera' },
  { provinsi: 'Lampung', ipm: 71.2, pdrbPerKapita: 15.1, tpt: 5.5, kemiskinan: 13.5, gini: 0.33, hls: 12.4, rls: 8.7, airBersih: 57, sanitasi: 46, elektrifikasi: 95, penduduk: 9.2, pulau: 'Sumatera' },
  { provinsi: 'Kep. Bangka Belitung', ipm: 73.8, pdrbPerKapita: 26.3, tpt: 4.6, kemiskinan: 5.8, gini: 0.30, hls: 12.9, rls: 9.4, airBersih: 70, sanitasi: 60, elektrifikasi: 97, penduduk: 1.5, pulau: 'Sumatera' },
  { provinsi: 'Kep. Riau', ipm: 76.5, pdrbPerKapita: 42.8, tpt: 3.9, kemiskinan: 4.2, gini: 0.35, hls: 13.5, rls: 10.0, airBersih: 68, sanitasi: 63, elektrifikasi: 98, penduduk: 2.1, pulau: 'Sumatera' },
  { provinsi: 'DKI Jakarta', ipm: 82.5, pdrbPerKapita: 78.2, tpt: 7.1, kemiskinan: 4.1, gini: 0.42, hls: 14.2, rls: 11.2, airBersih: 78, sanitasi: 72, elektrifikasi: 100, penduduk: 10.6, pulau: 'Jawa' },
  { provinsi: 'Jawa Barat', ipm: 73.5, pdrbPerKapita: 20.5, tpt: 8.2, kemiskinan: 7.9, gini: 0.38, hls: 13.1, rls: 9.2, airBersih: 66, sanitasi: 60, elektrifikasi: 99, penduduk: 49.6, pulau: 'Jawa' },
  { provinsi: 'Jawa Tengah', ipm: 73.4, pdrbPerKapita: 18.9, tpt: 4.8, kemiskinan: 10.2, gini: 0.37, hls: 13.0, rls: 9.0, airBersih: 64, sanitasi: 57, elektrifikasi: 99, penduduk: 37.5, pulau: 'Jawa' },
  { provinsi: 'DI Yogyakarta', ipm: 80.1, pdrbPerKapita: 25.6, tpt: 5.5, kemiskinan: 11.2, gini: 0.40, hls: 14.0, rls: 10.8, airBersih: 70, sanitasi: 65, elektrifikasi: 99, penduduk: 3.7, pulau: 'Jawa' },
  { provinsi: 'Jawa Timur', ipm: 73.8, pdrbPerKapita: 21.4, tpt: 4.5, kemiskinan: 9.5, gini: 0.37, hls: 13.1, rls: 9.1, airBersih: 65, sanitasi: 58, elektrifikasi: 99, penduduk: 41.1, pulau: 'Jawa' },
  { provinsi: 'Banten', ipm: 73.2, pdrbPerKapita: 22.7, tpt: 7.3, kemiskinan: 6.8, gini: 0.38, hls: 13.0, rls: 9.2, airBersih: 62, sanitasi: 55, elektrifikasi: 98, penduduk: 12.3, pulau: 'Jawa' },
  { provinsi: 'Bali', ipm: 76.4, pdrbPerKapita: 24.8, tpt: 3.2, kemiskinan: 4.1, gini: 0.36, hls: 13.4, rls: 9.8, airBersih: 74, sanitasi: 66, elektrifikasi: 99, penduduk: 4.4, pulau: 'Bali-Nusa' },
  { provinsi: 'Nusa Tenggara Barat', ipm: 70.8, pdrbPerKapita: 14.2, tpt: 3.1, kemiskinan: 14.8, gini: 0.32, hls: 12.3, rls: 8.6, airBersih: 55, sanitasi: 44, elektrifikasi: 95, penduduk: 5.5, pulau: 'Bali-Nusa' },
  { provinsi: 'Nusa Tenggara Timur', ipm: 67.2, pdrbPerKapita: 12.1, tpt: 2.8, kemiskinan: 21.5, gini: 0.31, hls: 12.0, rls: 8.2, airBersih: 48, sanitasi: 38, elektrifikasi: 92, penduduk: 5.5, pulau: 'Bali-Nusa' },
  { provinsi: 'Kalimantan Barat', ipm: 68.9, pdrbPerKapita: 19.5, tpt: 3.9, kemiskinan: 12.2, gini: 0.33, hls: 12.2, rls: 8.4, airBersih: 56, sanitasi: 45, elektrifikasi: 93, penduduk: 5.6, pulau: 'Kalimantan' },
  { provinsi: 'Kalimantan Tengah', ipm: 71.2, pdrbPerKapita: 27.8, tpt: 3.5, kemiskinan: 8.5, gini: 0.33, hls: 12.5, rls: 8.9, airBersih: 58, sanitasi: 47, elektrifikasi: 94, penduduk: 2.8, pulau: 'Kalimantan' },
  { provinsi: 'Kalimantan Selatan', ipm: 71.8, pdrbPerKapita: 22.3, tpt: 4.2, kemiskinan: 6.8, gini: 0.33, hls: 12.6, rls: 8.9, airBersih: 60, sanitasi: 50, elektrifikasi: 96, penduduk: 4.2, pulau: 'Kalimantan' },
  { provinsi: 'Kalimantan Timur', ipm: 77.4, pdrbPerKapita: 58.6, tpt: 4.8, kemiskinan: 5.2, gini: 0.36, hls: 13.6, rls: 10.2, airBersih: 62, sanitasi: 56, elektrifikasi: 97, penduduk: 3.9, pulau: 'Kalimantan' },
  { provinsi: 'Kalimantan Utara', ipm: 72.5, pdrbPerKapita: 36.2, tpt: 4.1, kemiskinan: 6.5, gini: 0.34, hls: 12.7, rls: 9.0, airBersih: 59, sanitasi: 48, elektrifikasi: 94, penduduk: 0.7, pulau: 'Kalimantan' },
  { provinsi: 'Sulawesi Utara', ipm: 74.5, pdrbPerKapita: 21.8, tpt: 3.6, kemiskinan: 7.2, gini: 0.33, hls: 13.3, rls: 9.6, airBersih: 67, sanitasi: 55, elektrifikasi: 96, penduduk: 2.7, pulau: 'Sulawesi' },
  { provinsi: 'Sulawesi Tengah', ipm: 70.3, pdrbPerKapita: 18.4, tpt: 3.2, kemiskinan: 13.8, gini: 0.32, hls: 12.4, rls: 8.7, airBersih: 54, sanitasi: 43, elektrifikasi: 93, penduduk: 3.1, pulau: 'Sulawesi' },
  { provinsi: 'Sulawesi Selatan', ipm: 73.1, pdrbPerKapita: 19.6, tpt: 3.8, kemiskinan: 9.2, gini: 0.34, hls: 12.9, rls: 9.1, airBersih: 62, sanitasi: 52, elektrifikasi: 96, penduduk: 9.1, pulau: 'Sulawesi' },
  { provinsi: 'Sulawesi Tenggara', ipm: 72.3, pdrbPerKapita: 18.8, tpt: 2.9, kemiskinan: 11.5, gini: 0.31, hls: 12.6, rls: 8.8, airBersih: 57, sanitasi: 46, elektrifikasi: 94, penduduk: 2.8, pulau: 'Sulawesi' },
  { provinsi: 'Gorontalo', ipm: 70.5, pdrbPerKapita: 15.6, tpt: 3.4, kemiskinan: 15.8, gini: 0.30, hls: 12.3, rls: 8.5, airBersih: 53, sanitasi: 42, elektrifikasi: 92, penduduk: 1.2, pulau: 'Sulawesi' },
  { provinsi: 'Sulawesi Barat', ipm: 69.8, pdrbPerKapita: 15.2, tpt: 2.5, kemiskinan: 14.2, gini: 0.30, hls: 12.2, rls: 8.4, airBersih: 52, sanitasi: 41, elektrifikasi: 92, penduduk: 1.5, pulau: 'Sulawesi' },
  { provinsi: 'Maluku', ipm: 70.1, pdrbPerKapita: 14.8, tpt: 2.7, kemiskinan: 16.8, gini: 0.31, hls: 12.3, rls: 8.5, airBersih: 51, sanitasi: 40, elektrifikasi: 88, penduduk: 1.9, pulau: 'Maluku-Papua' },
  { provinsi: 'Maluku Utara', ipm: 69.4, pdrbPerKapita: 17.2, tpt: 3.0, kemiskinan: 17.5, gini: 0.30, hls: 12.2, rls: 8.4, airBersih: 50, sanitasi: 39, elektrifikasi: 85, penduduk: 1.3, pulau: 'Maluku-Papua' },
  { provinsi: 'Papua Barat', ipm: 66.5, pdrbPerKapita: 28.5, tpt: 4.2, kemiskinan: 24.2, gini: 0.35, hls: 11.8, rls: 8.0, airBersih: 45, sanitasi: 35, elektrifikasi: 78, penduduk: 1.2, pulau: 'Maluku-Papua' },
  { provinsi: 'Papua', ipm: 61.8, pdrbPerKapita: 22.4, tpt: 4.5, kemiskinan: 27.5, gini: 0.36, hls: 11.5, rls: 7.5, airBersih: 42, sanitasi: 32, elektrifikasi: 72, penduduk: 4.4, pulau: 'Maluku-Papua' },
];
