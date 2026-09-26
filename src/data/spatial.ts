import type { SpatialDatum } from './provinces';

interface SpatialTemplate {
  nama: string;
  provinsi: string;
  pulau: string;
  ipm: number;
  kemiskinan: number;
  airBersih: number;
  sanitasi: number;
  elektrifikasi: number;
}

const TEMPLATES: SpatialTemplate[] = [
  { nama: 'Kota Medan', provinsi: 'Sumatera Utara', pulau: 'Sumatera', ipm: 82.1, kemiskinan: 4.2, airBersih: 82, sanitasi: 76, elektrifikasi: 100 },
  { nama: 'Kab. Deli Serdang', provinsi: 'Sumatera Utara', pulau: 'Sumatera', ipm: 73.5, kemiskinan: 8.8, airBersih: 62, sanitasi: 55, elektrifikasi: 98 },
  { nama: 'Kota Padang', provinsi: 'Sumatera Barat', pulau: 'Sumatera', ipm: 80.8, kemiskinan: 4.5, airBersih: 85, sanitasi: 72, elektrifikasi: 100 },
  { nama: 'Kab. Agam', provinsi: 'Sumatera Barat', pulau: 'Sumatera', ipm: 71.2, kemiskinan: 7.2, airBersih: 68, sanitasi: 58, elektrifikasi: 97 },
  { nama: 'Kota Pekanbaru', provinsi: 'Riau', pulau: 'Sumatera', ipm: 83.2, kemiskinan: 3.8, airBersih: 78, sanitasi: 74, elektrifikasi: 100 },
  { nama: 'Kab. Bengkalis', provinsi: 'Riau', pulau: 'Sumatera', ipm: 74.8, kemiskinan: 7.5, airBersih: 58, sanitasi: 52, elektrifikasi: 96 },
  { nama: 'Kota Jambi', provinsi: 'Jambi', pulau: 'Sumatera', ipm: 79.5, kemiskinan: 5.1, airBersih: 75, sanitasi: 68, elektrifikasi: 99 },
  { nama: 'Kab. Muaro Jambi', provinsi: 'Jambi', pulau: 'Sumatera', ipm: 70.8, kemiskinan: 10.2, airBersih: 55, sanitasi: 45, elektrifikasi: 95 },
  { nama: 'Kota Palembang', provinsi: 'Sumatera Selatan', pulau: 'Sumatera', ipm: 78.2, kemiskinan: 6.5, airBersih: 72, sanitasi: 65, elektrifikasi: 99 },
  { nama: 'Kab. Banyuasin', provinsi: 'Sumatera Selatan', pulau: 'Sumatera', ipm: 69.8, kemiskinan: 12.8, airBersih: 52, sanitasi: 42, elektrifikasi: 94 },
  { nama: 'Kota Bandar Lampung', provinsi: 'Lampung', pulau: 'Sumatera', ipm: 77.5, kemiskinan: 7.8, airBersih: 68, sanitasi: 60, elektrifikasi: 98 },
  { nama: 'Kab. Lampung Selatan', provinsi: 'Lampung', pulau: 'Sumatera', ipm: 68.5, kemiskinan: 15.2, airBersih: 50, sanitasi: 40, elektrifikasi: 94 },
  { nama: 'Kota Pangkalpinang', provinsi: 'Kep. Bangka Belitung', pulau: 'Sumatera', ipm: 78.8, kemiskinan: 4.2, airBersih: 78, sanitasi: 70, elektrifikasi: 99 },
  { nama: 'Kota Tanjungpinang', provinsi: 'Kep. Riau', pulau: 'Sumatera', ipm: 79.2, kemiskinan: 3.5, airBersih: 75, sanitasi: 68, elektrifikasi: 99 },

  { nama: 'Kota Jakarta Pusat', provinsi: 'DKI Jakarta', pulau: 'Jawa', ipm: 85.8, kemiskinan: 3.2, airBersih: 88, sanitasi: 82, elektrifikasi: 100 },
  { nama: 'Kota Jakarta Selatan', provinsi: 'DKI Jakarta', pulau: 'Jawa', ipm: 86.2, kemiskinan: 2.8, airBersih: 85, sanitasi: 80, elektrifikasi: 100 },
  { nama: 'Kota Jakarta Timur', provinsi: 'DKI Jakarta', pulau: 'Jawa', ipm: 81.5, kemiskinan: 4.8, airBersih: 75, sanitasi: 68, elektrifikasi: 100 },
  { nama: 'Kab. Bogor', provinsi: 'Jawa Barat', pulau: 'Jawa', ipm: 73.8, kemiskinan: 8.5, airBersih: 65, sanitasi: 58, elektrifikasi: 99 },
  { nama: 'Kota Bandung', provinsi: 'Jawa Barat', pulau: 'Jawa', ipm: 82.5, kemiskinan: 4.2, airBersih: 82, sanitasi: 75, elektrifikasi: 100 },
  { nama: 'Kota Bekasi', provinsi: 'Jawa Barat', pulau: 'Jawa', ipm: 83.2, kemiskinan: 3.8, airBersih: 78, sanitasi: 72, elektrifikasi: 100 },
  { nama: 'Kab. Bandung Barat', provinsi: 'Jawa Barat', pulau: 'Jawa', ipm: 71.5, kemiskinan: 9.2, airBersih: 60, sanitasi: 52, elektrifikasi: 98 },
  { nama: 'Kota Semarang', provinsi: 'Jawa Tengah', pulau: 'Jawa', ipm: 83.8, kemiskinan: 3.5, airBersih: 85, sanitasi: 78, elektrifikasi: 100 },
  { nama: 'Kab. Semarang', provinsi: 'Jawa Tengah', pulau: 'Jawa', ipm: 74.2, kemiskinan: 8.8, airBersih: 68, sanitasi: 60, elektrifikasi: 99 },
  { nama: 'Kota Surakarta', provinsi: 'Jawa Tengah', pulau: 'Jawa', ipm: 82.8, kemiskinan: 5.2, airBersih: 80, sanitasi: 72, elektrifikasi: 100 },
  { nama: 'Kab. Wonogiri', provinsi: 'Jawa Tengah', pulau: 'Jawa', ipm: 68.8, kemiskinan: 14.5, airBersih: 55, sanitasi: 45, elektrifikasi: 97 },
  { nama: 'Kota Yogyakarta', provinsi: 'DI Yogyakarta', pulau: 'Jawa', ipm: 87.5, kemiskinan: 4.8, airBersih: 82, sanitasi: 78, elektrifikasi: 100 },
  { nama: 'Kab. Bantul', provinsi: 'DI Yogyakarta', pulau: 'Jawa', ipm: 78.5, kemiskinan: 8.2, airBersih: 72, sanitasi: 65, elektrifikasi: 99 },
  { nama: 'Kab. Gunungkidul', provinsi: 'DI Yogyakarta', pulau: 'Jawa', ipm: 72.8, kemiskinan: 12.5, airBersih: 62, sanitasi: 52, elektrifikasi: 98 },
  { nama: 'Kota Surabaya', provinsi: 'Jawa Timur', pulau: 'Jawa', ipm: 84.5, kemiskinan: 3.2, airBersih: 88, sanitasi: 82, elektrifikasi: 100 },
  { nama: 'Kab. Sidoarjo', provinsi: 'Jawa Timur', pulau: 'Jawa', ipm: 80.5, kemiskinan: 5.5, airBersih: 75, sanitasi: 68, elektrifikasi: 100 },
  { nama: 'Kab. Banyuwangi', provinsi: 'Jawa Timur', pulau: 'Jawa', ipm: 72.8, kemiskinan: 10.8, airBersih: 62, sanitasi: 52, elektrifikasi: 98 },
  { nama: 'Kota Malang', provinsi: 'Jawa Timur', pulau: 'Jawa', ipm: 82.8, kemiskinan: 4.5, airBersih: 80, sanitasi: 72, elektrifikasi: 100 },
  { nama: 'Kab. Ponorogo', provinsi: 'Jawa Timur', pulau: 'Jawa', ipm: 70.5, kemiskinan: 12.2, airBersih: 58, sanitasi: 48, elektrifikasi: 97 },
  { nama: 'Kota Serang', provinsi: 'Banten', pulau: 'Jawa', ipm: 77.8, kemiskinan: 5.8, airBersih: 70, sanitasi: 62, elektrifikasi: 99 },
  { nama: 'Kab. Lebak', provinsi: 'Banten', pulau: 'Jawa', ipm: 66.8, kemiskinan: 16.8, airBersih: 48, sanitasi: 38, elektrifikasi: 95 },

  { nama: 'Kota Denpasar', provinsi: 'Bali', pulau: 'Bali-Nusa', ipm: 83.5, kemiskinan: 2.8, airBersih: 85, sanitasi: 78, elektrifikasi: 100 },
  { nama: 'Kab. Badung', provinsi: 'Bali', pulau: 'Bali-Nusa', ipm: 80.8, kemiskinan: 3.5, airBersih: 82, sanitasi: 75, elektrifikasi: 100 },
  { nama: 'Kab. Karangasem', provinsi: 'Bali', pulau: 'Bali-Nusa', ipm: 70.5, kemiskinan: 8.8, airBersih: 65, sanitasi: 55, elektrifikasi: 98 },
  { nama: 'Kota Mataram', provinsi: 'Nusa Tenggara Barat', pulau: 'Bali-Nusa', ipm: 77.8, kemiskinan: 8.5, airBersih: 72, sanitasi: 62, elektrifikasi: 98 },
  { nama: 'Kab. Bima', provinsi: 'Nusa Tenggara Barat', pulau: 'Bali-Nusa', ipm: 66.2, kemiskinan: 18.5, airBersih: 48, sanitasi: 38, elektrifikasi: 93 },
  { nama: 'Kota Kupang', provinsi: 'Nusa Tenggara Timur', pulau: 'Bali-Nusa', ipm: 75.5, kemiskinan: 12.5, airBersih: 68, sanitasi: 58, elektrifikasi: 96 },
  { nama: 'Kab. Timor Tengah Selatan', provinsi: 'Nusa Tenggara Timur', pulau: 'Bali-Nusa', ipm: 62.8, kemiskinan: 25.8, airBersih: 42, sanitasi: 32, elektrifikasi: 88 },
  { nama: 'Kab. Manggarai', provinsi: 'Nusa Tenggara Timur', pulau: 'Bali-Nusa', ipm: 64.5, kemiskinan: 22.5, airBersih: 45, sanitasi: 35, elektrifikasi: 90 },

  { nama: 'Kota Pontianak', provinsi: 'Kalimantan Barat', pulau: 'Kalimantan', ipm: 78.5, kemiskinan: 5.8, airBersih: 75, sanitasi: 68, elektrifikasi: 98 },
  { nama: 'Kab. Sambas', provinsi: 'Kalimantan Barat', pulau: 'Kalimantan', ipm: 65.8, kemiskinan: 15.8, airBersih: 48, sanitasi: 38, elektrifikasi: 90 },
  { nama: 'Kota Palangka Raya', provinsi: 'Kalimantan Tengah', pulau: 'Kalimantan', ipm: 77.8, kemiskinan: 5.2, airBersih: 72, sanitasi: 62, elektrifikasi: 96 },
  { nama: 'Kab. Kapuas', provinsi: 'Kalimantan Tengah', pulau: 'Kalimantan', ipm: 67.5, kemiskinan: 12.8, airBersih: 50, sanitasi: 40, elektrifikasi: 90 },
  { nama: 'Kota Banjarmasin', provinsi: 'Kalimantan Selatan', pulau: 'Kalimantan', ipm: 78.2, kemiskinan: 4.8, airBersih: 75, sanitasi: 65, elektrifikasi: 98 },
  { nama: 'Kab. Banjar', provinsi: 'Kalimantan Selatan', pulau: 'Kalimantan', ipm: 70.8, kemiskinan: 8.2, airBersih: 58, sanitasi: 48, elektrifikasi: 95 },
  { nama: 'Kota Samarinda', provinsi: 'Kalimantan Timur', pulau: 'Kalimantan', ipm: 82.8, kemiskinan: 4.2, airBersih: 78, sanitasi: 72, elektrifikasi: 99 },
  { nama: 'Kota Balikpapan', provinsi: 'Kalimantan Timur', pulau: 'Kalimantan', ipm: 84.5, kemiskinan: 3.2, airBersih: 82, sanitasi: 76, elektrifikasi: 100 },
  { nama: 'Kab. Kutai Kartanegara', provinsi: 'Kalimantan Timur', pulau: 'Kalimantan', ipm: 75.8, kemiskinan: 6.8, airBersih: 62, sanitasi: 52, elektrifikasi: 96 },
  { nama: 'Kota Tarakan', provinsi: 'Kalimantan Utara', pulau: 'Kalimantan', ipm: 79.5, kemiskinan: 5.2, airBersih: 72, sanitasi: 62, elektrifikasi: 97 },

  { nama: 'Kota Manado', provinsi: 'Sulawesi Utara', pulau: 'Sulawesi', ipm: 82.5, kemiskinan: 4.2, airBersih: 82, sanitasi: 72, elektrifikasi: 99 },
  { nama: 'Kab. Minahasa', provinsi: 'Sulawesi Utara', pulau: 'Sulawesi', ipm: 73.8, kemiskinan: 8.2, airBersih: 68, sanitasi: 55, elektrifikasi: 96 },
  { nama: 'Kota Palu', provinsi: 'Sulawesi Tengah', pulau: 'Sulawesi', ipm: 77.8, kemiskinan: 7.8, airBersih: 70, sanitasi: 58, elektrifikasi: 95 },
  { nama: 'Kab. Donggala', provinsi: 'Sulawesi Tengah', pulau: 'Sulawesi', ipm: 68.5, kemiskinan: 14.2, airBersih: 52, sanitasi: 42, elektrifikasi: 90 },
  { nama: 'Kota Makassar', provinsi: 'Sulawesi Selatan', pulau: 'Sulawesi', ipm: 82.8, kemiskinan: 4.5, airBersih: 80, sanitasi: 70, elektrifikasi: 99 },
  { nama: 'Kab. Gowa', provinsi: 'Sulawesi Selatan', pulau: 'Sulawesi', ipm: 72.8, kemiskinan: 9.8, airBersih: 62, sanitasi: 52, elektrifikasi: 96 },
  { nama: 'Kab. Maros', provinsi: 'Sulawesi Selatan', pulau: 'Sulawesi', ipm: 71.2, kemiskinan: 10.5, airBersih: 58, sanitasi: 48, elektrifikasi: 95 },
  { nama: 'Kota Kendari', provinsi: 'Sulawesi Tenggara', pulau: 'Sulawesi', ipm: 79.8, kemiskinan: 6.2, airBersih: 75, sanitasi: 62, elektrifikasi: 96 },
  { nama: 'Kab. Kolaka', provinsi: 'Sulawesi Tenggara', pulau: 'Sulawesi', ipm: 70.2, kemiskinan: 11.8, airBersih: 55, sanitasi: 45, elektrifikasi: 93 },
  { nama: 'Kota Gorontalo', provinsi: 'Gorontalo', pulau: 'Sulawesi', ipm: 76.8, kemiskinan: 8.5, airBersih: 68, sanitasi: 55, elektrifikasi: 94 },
  { nama: 'Kab. Bone Bolango', provinsi: 'Gorontalo', pulau: 'Sulawesi', ipm: 66.8, kemiskinan: 16.5, airBersih: 48, sanitasi: 38, elektrifikasi: 88 },
  { nama: 'Kota Mamuju', provinsi: 'Sulawesi Barat', pulau: 'Sulawesi', ipm: 73.5, kemiskinan: 9.8, airBersih: 62, sanitasi: 48, elektrifikasi: 92 },
  { nama: 'Kab. Majene', provinsi: 'Sulawesi Barat', pulau: 'Sulawesi', ipm: 67.8, kemiskinan: 15.2, airBersih: 50, sanitasi: 38, elektrifikasi: 88 },

  { nama: 'Kota Ambon', provinsi: 'Maluku', pulau: 'Maluku-Papua', ipm: 77.5, kemiskinan: 8.2, airBersih: 72, sanitasi: 58, elektrifikasi: 92 },
  { nama: 'Kab. Maluku Tengah', provinsi: 'Maluku', pulau: 'Maluku-Papua', ipm: 66.8, kemiskinan: 18.5, airBersih: 48, sanitasi: 38, elektrifikasi: 82 },
  { nama: 'Kota Ternate', provinsi: 'Maluku Utara', pulau: 'Maluku-Papua', ipm: 76.8, kemiskinan: 7.8, airBersih: 70, sanitasi: 55, elektrifikasi: 90 },
  { nama: 'Kab. Halmahera Barat', provinsi: 'Maluku Utara', pulau: 'Maluku-Papua', ipm: 64.8, kemiskinan: 19.2, airBersih: 45, sanitasi: 35, elektrifikasi: 78 },
  { nama: 'Kota Sorong', provinsi: 'Papua Barat', pulau: 'Maluku-Papua', ipm: 74.8, kemiskinan: 10.2, airBersih: 68, sanitasi: 52, elektrifikasi: 88 },
  { nama: 'Kab. Raja Ampat', provinsi: 'Papua Barat', pulau: 'Maluku-Papua', ipm: 60.8, kemiskinan: 24.5, airBersih: 42, sanitasi: 32, elektrifikasi: 72 },
  { nama: 'Kota Jayapura', provinsi: 'Papua', pulau: 'Maluku-Papua', ipm: 75.2, kemiskinan: 11.8, airBersih: 65, sanitasi: 52, elektrifikasi: 85 },
  { nama: 'Kab. Jayawijaya', provinsi: 'Papua', pulau: 'Maluku-Papua', ipm: 55.8, kemiskinan: 32.5, airBersih: 35, sanitasi: 25, elektrifikasi: 65 },
  { nama: 'Kab. Merauke', provinsi: 'Papua', pulau: 'Maluku-Papua', ipm: 62.8, kemiskinan: 25.8, airBersih: 48, sanitasi: 35, elektrifikasi: 75 },
  { nama: 'Kab. Puncak Jaya', provinsi: 'Papua', pulau: 'Maluku-Papua', ipm: 50.2, kemiskinan: 38.2, airBersih: 28, sanitasi: 20, elektrifikasi: 55 },
];

export const SPATIAL_DATA: SpatialDatum[] = TEMPLATES.map(t => ({ ...t }));

export const SPATIAL_METRICS = [
  { key: 'ipm', label: 'IPM (Indeks Pembangunan Manusia)', unit: '', min: 50, max: 90 },
  { key: 'kemiskinan', label: 'Penduduk Miskin', unit: '%', min: 0, max: 40, invert: true },
  { key: 'airBersih', label: 'Akses Air Bersih', unit: '%', min: 20, max: 100 },
  { key: 'sanitasi', label: 'Sanitasi Layak', unit: '%', min: 15, max: 100 },
  { key: 'elektrifikasi', label: 'Rasio Elektrifikasi', unit: '%', min: 40, max: 100 },
] as const;

export type SpatialMetricKey = typeof SPATIAL_METRICS[number]['key'];
