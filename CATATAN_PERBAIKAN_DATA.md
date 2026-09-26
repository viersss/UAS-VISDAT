# Catatan Perbaikan Data & Kode — Dashboard UAS Visdat

Ringkasan seluruh perubahan yang dilakukan terhadap berkas asli, supaya bisa
diadaptasi langsung ke bagian **Metodologi** dan **Keterbatasan** pada makalah
IEEE. Semua perbaikan bersifat pemrosesan data (join, derivasi kolom) — tidak
ada angka BPS yang direkayasa/diganti.

## 1. `data_spasial.csv` — menambahkan kolom `Kode_BPS`

**Masalah:** berkas asli hanya berisi `Kabupaten_Kota` dan indikator persentase,
tanpa kode wilayah apa pun. Karena `app.py` mewajibkan kode wilayah sebagai
kunci penggabungan ke GeoJSON, dashboard gagal total (crash) sebelum sempat
menampilkan apa pun.

**Perbaikan:** setiap nama `Kabupaten_Kota` dicocokkan terhadap properti
`NAME_2` (nama wilayah), `TYPE_2` (Kabupaten/Kota), dan `CC_2` (kode wilayah
BPS 4 digit) pada `gadm41_IDN_2.json` (GADM v4.1), dengan algoritma dua tahap:

1. Cocokkan nama penuh (menangani entri GADM yang menyatukan kata "Kota" ke
   dalam `NAME_2`, mis. `KotaBogor`, `KotaMedan`, `KotaYogyakarta`).
2. Jika tidak ketemu, cocokkan nama tanpa prefiks "Kota"/"Kabupaten", lalu
   disambiguasi dengan `TYPE_2` bila nama tersebut dipakai baik oleh kabupaten
   maupun kota (mis. Malang, Bogor, Semarang → dua wilayah berbeda kode).

**Hasil:** 497 dari 514 kab/kota (96,7%) berhasil dipetakan otomatis + 9 kasus
override manual (perbedaan ejaan, mis. "Pakpak Bharat" vs GADM "PakpakBarat").
**17 kab/kota** hasil pemekaran administratif tahun 2012–2014 yang belum
tercakup pada GADM v4.1 tidak memiliki batas digital sehingga dikecualikan dari
peta (bukan galat, melainkan keterbatasan cakupan data GeoJSON):

Penukal Abab Lematang Ilir, Musi Rawas Utara, Pesisir Barat, Pangandaran,
Malaka, Mahakam Ulu, Banggai Laut, Morowali Utara, Kolaka Timur, Konawe
Kepulauan, Muna Barat, Buton Tengah, Buton Selatan, Mamuju Tengah, Pulau
Taliabu, Manokwari Selatan, Pegunungan Arfak.

> Kalimat untuk bagian Keterbatasan: *"Sebanyak 17 dari 514 kabupaten/kota
> (3,3%) tidak ditampilkan pada peta karena wilayah tersebut merupakan hasil
> pemekaran administratif 2012–2014 yang belum tercakup dalam batas digital
> GADM v4.1 yang digunakan sebagai data pendukung non-BPS."*

## 2. `gadm41_IDN_2.json` — menambal 5 properti `CC_2` yang kosong

**Masalah:** lima kabupaten/kota di Provinsi Kalimantan Utara (Malinau,
Bulungan, Tana Tidung, Nunukan, Kota Tarakan) memiliki geometri lengkap pada
GADM v4.1, tetapi atribut `CC_2`-nya kosong (`"NA"`) — kemungkinan karena
provinsi ini baru dimekarkan tahun 2012 dan datanya belum lengkap disinkronkan
pada rilis GADM tersebut.

**Perbaikan:** nilai `CC_2` diisi manual berdasarkan nomor katalog resmi
publikasi tahunan *"\<Kabupaten/Kota\> Dalam Angka"* BPS (format katalog
`1102001.<kode wilayah>`), diverifikasi langsung dari situs `bps.go.id`
masing-masing kabupaten/kota:

| Kab/Kota | Kode BPS | Sumber verifikasi |
|---|---|---|
| Malinau | 6501 | malinaukab.bps.go.id, katalog 1102001.6501 |
| Bulungan | 6502 | urutan resmi berikutnya di provinsi yang sama |
| Tana Tidung | 6503 | urutan resmi berikutnya di provinsi yang sama |
| Nunukan | 6504 | nunukankab.bps.go.id, katalog 1102001.6504 |
| Kota Tarakan | 6571 | tarakankota.bps.go.id, katalog 1102001.6571 |

Satu fitur lain yang tetap `CC_2 = "NA"` (`LakeToba`) memang bukan wilayah
administratif (badan air/danau), sehingga sengaja tidak ditambal.

## 3. `data_hierarki.csv` — menambahkan kolom `Kontribusi_PDB_Persen`

**Masalah:** berkas asli hanya memiliki satu kolom numerik
(`Nilai_PDB_Miliar_Rupiah`), padahal ketentuan topik hierarki mewajibkan
ukuran dan warna bidang treemap/sunburst mengkodekan **dua variabel berbeda**.

**Perbaikan:** ditambahkan kolom `Kontribusi_PDB_Persen`, dihitung sebagai:

```
Kontribusi_PDB_Persen = Nilai_PDB_Miliar_Rupiah / (total PDB 17 sektor utama) × 100
```

Ini bukan data baru dari sumber lain, melainkan **rasio distribusi** yang
diturunkan langsung dari kolom nilai PDB itu sendiri — jenis statistik yang
juga lazim dipublikasikan BPS sebagai pendamping kolom nilai absolut pada
tabel "Distribusi PDB atas Dasar Harga Berlaku Menurut Lapangan Usaha".
Ukuran bidang tetap merepresentasikan nilai absolut (Rp miliar), sedangkan
warna merepresentasikan persentase kontribusi terhadap total PDB nasional.

## 4. `app.py` — perbaikan & penambahan

| # | Perbaikan | Alasan |
|---|---|---|
| 1 | Properti kunci GeoJSON diprioritaskan ke `CC_2` (bukan `GID_2`) | `GID_2` formatnya (`"IDN.1.2_1"`) tidak kompatibel dengan kode BPS 4 digit; sebelumnya berpotensi salah cocok akibat pencocokan substring yang longgar |
| 2 | Baris `data_spasial.csv` tanpa `Kode_BPS` difilter sebelum dipetakan, dengan keterangan jumlah yang dikecualikan | Mencegah crash dan transparan soal keterbatasan cakupan data |
| 3 | Ditambahkan **Peta Simbol Proporsional** (tab kedua) di samping Choropleth Map | Memenuhi syarat minimal "2 jenis peta berbeda" pada topik geospasial |
| 4 | Ditambahkan **Scatterplot Matrix** (tab ketiga) di bagian multivariat | Memenuhi syarat "PCA + minimal 2 teknik lain" (sebelumnya baru 1: Parallel Coordinates) |
| 5 | Pemilihan kolom ukuran/warna treemap-sunburst berbasis nama (bukan posisi kolom) | Robust terhadap urutan kolom & lebih jelas maksudnya |
| 6 | Centroid wilayah dihitung sendiri (rumus shoelace, murni Python) dari geometri GeoJSON | Tidak menambah dependency baru (shapely dsb.) untuk peta simbol proporsional |

## 5. Berkas yang tidak diubah

- `data_multivariat.csv` — sudah memenuhi syarat (38 provinsi, 8 variabel
  numerik), tidak ada masalah.
- `data_migrasi_network.csv` — tidak dipakai `app.py` (dashboard ini memenuhi
  3 dari 6 topik minimal: multivariat, geospasial, hierarki). Berkas ini tetap
  disertakan sebagai data cadangan bila ingin menambah topik ke-4 (data
  berjaring/migrasi) untuk nilai kreativitas tambahan — namun ini opsional.

## 6. Cara menjalankan

```bash
pip install streamlit plotly scikit-learn pandas numpy
streamlit run app.py
```

Pastikan kelima berkas (`app.py`, `data_multivariat.csv`, `data_spasial.csv`,
`data_hierarki.csv`, `gadm41_IDN_2.json`) berada pada direktori yang sama.
