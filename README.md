# Ketimpangan Pembangunan Indonesia

Webstory interaktif satu halaman untuk membaca perbedaan indikator pembangunan antarprovinsi, pola migrasi risen, dan komposisi nilai ekonomi. Narasi, statistik ringkas, dan visualisasi disusun berurutan agar pembaca dapat menjelajahi tiga dimensi tersebut dari pembuka hingga epilog.

| Informasi | Detail |
| --- | --- |
| Repository | [Source Code Webstory](https://s.stis.ac.id/Code_UasVisdat) |
| URL Live  | [Webstory](https://s.stis.ac.id/Webstory_UASVisdat) |

## Latar belakang dan tujuan

Angka rata-rata nasional dapat menutupi perbedaan kondisi antarwilayah. Project ini mengajak pembaca membandingkan indikator provinsi, melihat hubungan arus migrasi asal–tujuan, dan memahami pembagian nilai ekonomi menurut sektor serta rincian aktivitasnya.

Tujuannya adalah menyampaikan konteks dan interpretasi melalui cerita visual yang dapat dijelajahi, bukan hanya menampilkan tabel angka. Korelasi yang ditampilkan adalah hubungan statistik dan tidak membuktikan sebab-akibat; volume migrasi juga tidak menerangkan alasan seseorang berpindah.

## Fitur dan alur webstory

Halaman tidak menggunakan router aplikasi. Navigasi berupa tombol yang menggulir ke bagian pada halaman yang sama. Bar navigasi menandai bagian aktif dan menunjukkan progres gulir.

| Urutan | Bagian | Isi |
| --- | --- | --- |
| Pembuka | Hero dan ringkasan nasional | Judul, pengantar, label ringkas, dan kartu metrik yang dihitung dari data provinsi |
| Bab 1 "Multivariat" | Pola indikator pembangunan | PCA scatter, parallel coordinates, scatter matrix, sorotan provinsi, dan korelasi |
| Bab 2 "Migrasi" | Arus migrasi antarprovinsi | Filter asal/tujuan, ringkasan rute setelah filter, serta Sankey atau Flowmap |
| Bab 3 "Ekonomi" | Struktur nilai ekonomi | Bar kontribusi sektor dan pilihan tampilan Treemap atau Sunburst |
| Penutup | Epilog | Ringkasan naratif tentang indikator, migrasi, dan konsentrasi nilai dalam data |

Komponen bab menampilkan judul, subtitle, narasi, konteks, dan isi visual. Bagian bab menggunakan efek reveal saat masuk ke viewport; gerak parallax dan beberapa animasi menghormati preferensi `prefers-reduced-motion`.

### Alur data ke visualisasi

```text
src/data/provinces.ts ──> metrik nasional + PCA / parallel coordinates / scatter matrix
src/data/hierarchy.ts ──> agregasi per sektor ──> bar sektor + Treemap / Sunburst
Workbook Excel ──> parser SheetJS di src/data/migration.ts
                 └──> edge asal–tujuan ──> filter provinsi ──> Sankey / Flowmap
GeoJSON migrasi ──> geometri provinsi ──> posisi peta dan label pada Flowmap
```

Interaksi pengguna memperbarui state filter atau pilihan visualisasi di React. Komponen chart kemudian merender ulang sesuai data yang telah diproses; tidak ada server API yang diperlukan untuk menyajikan data utama aplikasi.

## Visualisasi dan cara membacanya

### Pembuka: kartu metrik

Kartu pembuka dihitung dari `PROVINCE_DATA`: total penduduk (penjumlahan nilai populasi dalam data), rata-rata IPM, rata-rata rasio Gini, rata-rata kemiskinan, dan rentang IPM minimum–maksimum. Angka ditampilkan dengan animasi saat terlihat.

### Bab 1: indikator antarprovinsi

Pemilih provinsi menyediakan pencarian, pilihan multi-provinsi, chip untuk menghapus pilihan, dan tombol hapus semua. Sorotan diterapkan pada visualisasi Bab 1. Data indikatornya berada pada skala yang berbeda, sehingga baca sumbu dan label chart masing-masing sebelum membandingkan nilai.

| Tampilan | Tujuan dan pembacaan | Interaksi |
| --- | --- | --- |
| **PCA Scatter** | Setiap titik adalah provinsi pada dua komponen utama hasil reduksi sepuluh indikator. Sumbu merangkum variasi; panah menunjukkan loading indikator, dan warna mengelompokkan provinsi menurut wilayah pulau. Panel terpisah menampilkan variansi yang dijelaskan PC1, PC2, dan total keduanya. | Arahkan kursor pada titik untuk melihat detail provinsi. Sorotan provinsi dipakai untuk menekankan pilihan pada chart. |
| **Parallel Coordinates** | Setiap sumbu vertikal mewakili indikator; garis membantu membandingkan profil provinsi melintasi indikator. | Gunakan pemilih provinsi untuk menonjolkan garis yang dipilih; provinsi lain tetap tampak sebagai konteks. |
| **Scatter Matrix** | Matriks memperlihatkan sebaran pasangan indikator. Diagonal berisi korelasi indikator dengan dirinya sendiri (1,00); sel di luar diagonal memperlihatkan hubungan bivariat. Warna membedakan kelompok pulau. | Dua dropdown memilih pasangan variabel dan memperlihatkan koefisien Pearson `r`; tombol Reset mengembalikan pasangan awal IPM–kemiskinan. Sorotan provinsi juga diterapkan pada titik. |

Scatter matrix memakai lima indikator pertama dalam daftar PCA: IPM, PDRB per kapita, pengangguran (TPT), kemiskinan, dan rasio Gini. Nilai `r` mendekati `1` atau `-1` menunjukkan hubungan linear yang lebih kuat; tanda menunjukkan arah hubungan.

### Bab 2: migrasi risen

Workbook Excel dibaca di browser dengan SheetJS. Parser menggunakan sheet pertama, mencari tabel matriks asal–tujuan, tahun yang tercantum, dan kolom provinsi. Entri luar negeri, perpindahan dalam provinsi yang sama, dan nilai nol tidak menjadi rute yang digambar.

Filter provinsi asal dan tujuan dapat dipakai sendiri-sendiri atau bersamaan. Kartu ringkasan dan paragraf interpretasi dihitung dari rute yang tersisa: volume total, rute terbesar, tujuan dengan arus masuk terbesar, serta bagiannya dari volume yang ditampilkan.

| Tampilan | Tujuan dan interaksi |
| --- | --- |
| **Sankey** | Node kiri menunjukkan asal, node kanan menunjukkan tujuan, dan lebar pita mengikuti jumlah migran. Arahkan kursor pada node atau pita untuk melihat label/rincian. |
| **Flowmap** | Panah menunjukkan arah asal ke tujuan pada peta; ketebalan garis mengikuti jumlah migran. Arahkan kursor pada rute untuk melihat asal, tujuan, dan jumlah. |

Gunakan tombol **Sankey / Flowmap** untuk beralih tampilan. Jika hasil filter memiliki lebih dari 60 rute positif, dropdown menyediakan 30, 60, 100, atau semua rute teratas berdasarkan volume. Indikator cakupan menunjukkan persentase volume yang terwakili oleh rute yang sedang ditampilkan. Kedua chart menggunakan filter dan batas rute yang sama.

**Catatan validasi tahun:** file Excel yang disertakan mencantumkan `Tahun 2022` pada sheet-nya. Namun, sejumlah teks UI saat ini menyebut tahun 2024. Tahun di workbook dan label UI tersebut tidak konsisten; periksa tahun di workbook sebelum menafsirkan atau mengutip visualisasi. Repository tidak menyertakan metadata sumber independen yang dapat menjelaskan perbedaan itu.

**Catatan nama provinsi:** workbook menghasilkan label `Aceh`, sedangkan GeoJSON Flowmap menggunakan `DI Aceh`. Flowmap mencocokkan label secara langsung, sehingga rute yang melibatkan Aceh dapat muncul di Sankey tetapi tidak memiliki garis pada peta. Perbedaan label ini tidak mengubah filter atau angka ringkasan.

### Bab 3: struktur ekonomi

Bar menunjukkan persentase kontribusi sektor terhadap jumlah nilai pada tabel hierarki. Arahkan kursor atau fokus keyboard pada bar untuk melihat nama sektor, nilai PDB, dan persentase kontribusi. Bar dianimasikan saat section masuk ke viewport.

| Tampilan | Tujuan dan interaksi |
| --- | --- |
| **Treemap** | Luas blok mewakili nilai ekonomi relatif pada hierarki sektor → subsektor → rincian aktivitas. Warna membedakan sektor. Klik blok untuk memperbesar/drill ke dalam hierarki; breadcrumb atau tombol kembali mengubah tingkat atau mengembalikan tampilan. |
| **Sunburst** | Cincin menyusun sektor di bagian dalam, subsektor di tengah, dan rincian aktivitas di bagian luar. Sudut/area membantu membandingkan nilai pada tingkat hierarki. Klik sektor atau bagian hierarki untuk drill; gunakan breadcrumb, tombol kembali, atau reset untuk berpindah tingkat. |

Tooltip chart hierarki memperlihatkan rincian nilai dan kontribusi. Gunakan tab **Treemap / Sunburst** untuk berganti representasi tanpa mengubah dataset.

## Dataset, variabel, dan aset

| File/data | Isi dan peran |
| --- | --- |
| `src/data/provinces.ts` | Array TypeScript untuk 34 provinsi. Sepuluh indikator yang dipakai PCA: IPM, PDRB per kapita, TPT, kemiskinan, rasio Gini, harapan lama sekolah (HLS), rata-rata lama sekolah (RLS), akses air bersih, sanitasi layak, dan elektrifikasi. Data juga berisi penduduk (juta jiwa) dan kelompok pulau untuk ringkasan/warna. |
| `public/Data Migrasi Risen Antarprovinsi.xlsx` | Workbook matriks migrasi yang diambil oleh browser. Parser mengubah nilai positif antarprovinsi menjadi edge `tahun`, `provinsi asal`, `provinsi tujuan`, dan `jumlah migran`. Sheet pertama menandai tahun 2022. |
| `public/indonesia-provinsi-migrasi.json` | FeatureCollection geometri provinsi yang dimuat Flowmap. Komponen memeriksa bahwa GeoJSON berisi 34 fitur. |
| `src/data/hierarchy.ts` | Data nilai ekonomi dalam bentuk sektor, subsektor, rincian, nilai (triliun rupiah), dan kontribusi (%). Digunakan oleh bar sektor, Treemap, dan Sunburst. |
| `src/data/spatial.ts` | Data/templat spasial tambahan dan definisi metrik. File ini tidak diimpor oleh alur aplikasi saat ini. |
| `data_spasial.csv` | CSV tambahan berkolom kabupaten/kota, kode BPS, dan persentase penduduk miskin. Tidak dimuat oleh aplikasi saat ini. |
| `data_multivariat.csv` | CSV tambahan dengan kolom seperti provinsi, IPM, TPT, RLS, UHH, kemiskinan, Gini, TPAK, dan kepadatan penduduk. Tidak dimuat oleh aplikasi saat ini. |
| `data_hierarki.csv` | CSV tambahan dengan sektor, subsektor, rincian, nilai PDB dalam miliar rupiah, dan kontribusi. Tidak dimuat oleh aplikasi saat ini. |
| `data_migrasi_network.csv`, `public/data_migrasi_network.csv` | CSV tambahan berbentuk provinsi asal, provinsi tujuan, dan jumlah migran. Aplikasi saat ini memuat workbook Excel, bukan CSV tersebut. |
| `public/hero.jpg` | Foto latar pada hero. |
| `public/indonesia-provinces.json`, `gadm41_IDN_2.json` | File geospasial lain yang disertakan repository. Tidak ditemukan pemanggilan langsungnya pada alur aplikasi saat ini; dipertahankan sebagai data pendukung. |

Nama kolom, definisi satuan, nilai, dan label di atas mengikuti source code atau header file yang disertakan. Tidak ada rujukan penerbit, URL unduhan, metodologi, atau sitasi dataset yang dapat diverifikasi secara menyeluruh dari repository ini. Karena itu README ini tidak mengatribusikan dataset kepada instansi tertentu. Angka pada data TypeScript dan workbook sebaiknya tidak dianggap sebagai statistik resmi atau data terkini tanpa verifikasi sumber independen.

## Teknologi

### Runtime aplikasi

- **React 18** dan **TypeScript** untuk antarmuka dan komponen.
- **Vite 5** sebagai development server dan bundler.
- **D3.js** untuk chart SVG, skala, hierarki, serta proyeksi/garis pada Flowmap.
- **Apache ECharts** dengan `echarts-for-react` untuk Sankey.
- **SheetJS (`xlsx`)** untuk membaca workbook Excel di browser.
- **Tailwind CSS 3**, stylesheet khusus, **PostCSS**, dan **Autoprefixer** untuk styling.
- **Lucide React** untuk ikon.
- **Google Fonts** (Inter, Lora, Rubik, dan Days One) dimuat dari `index.html`; koneksi jaringan diperlukan agar font web tersebut tersedia.

Dependency Plotly dan Supabase yang ada pada setup sebelumnya telah dibuang setelah audit kode karena tidak ditemukan import atau penggunaan aplikasi untuk dependency tersebut.

### Konfigurasi penting

- `vite.config.ts` mengaktifkan plugin React dan alias `@` ke folder `src`.
- `tsconfig.app.json` mengatur TypeScript strict dan alias `@/*`.
- `tailwind.config.js` mengatur file sumber Tailwind, font, warna, dan shadow tema.
- `postcss.config.js` mengaktifkan Tailwind dan Autoprefixer.
- `eslint.config.js` menggabungkan ESLint, TypeScript ESLint, React Hooks, dan React Refresh.
- `index.html` menyediakan elemen `#root`, metadata halaman, font, dan entry point `/src/main.tsx`.

## Struktur repository

```text
.
├── .bolt/                              # Konfigurasi/tooling repository
├── public/
│   ├── Data Migrasi Risen Antarprovinsi.xlsx  # Workbook migrasi aktif
│   ├── data_migrasi_network.csv        # Dataset tambahan; tidak dimuat aplikasi
│   ├── hero.jpg                        # Gambar hero
│   ├── indonesia-provinsi-migrasi.json # Geometri Flowmap aktif
│   └── indonesia-provinces.json        # GeoJSON tambahan; tidak direferensikan runtime
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── MigrationFlowCharts.tsx # Sankey, Flowmap, dan batas rute
│   │   │   ├── MigrationFlowMap.tsx    # Peta arus migrasi
│   │   │   ├── PCAScatter.tsx          # Plot PCA
│   │   │   ├── ParallelCoordinates.tsx # Profil indikator
│   │   │   ├── ScatterMatrix.tsx       # Matriks sebaran/korelasi
│   │   │   ├── Sunburst.tsx            # Hierarki radial
│   │   │   └── Treemap.tsx             # Hierarki berbasis area
│   │   ├── AnimatedNumber.tsx          # Animasi angka
│   │   ├── ChapterSection.tsx          # Kerangka narasi bab
│   │   ├── ChartCaption.tsx            # Keterangan chart
│   │   ├── Hero.tsx                    # Bagian pembuka
│   │   ├── MetricStrip.tsx             # Kartu metrik hero
│   │   ├── ProgressBar.tsx             # Navigasi dan progres gulir
│   │   ├── ProvinceSelector.tsx        # Cari/sorot provinsi
│   │   ├── TabSwitcher.tsx             # Tombol pilihan chart
│   │   ├── TransitionQuote.tsx         # Kutipan antarbagian
│   │   └── WaveText.tsx                # Animasi judul hero
│   ├── data/
│   │   ├── hierarchy.ts                # Data struktur ekonomi
│   │   ├── migration.ts                # Tipe dan parser workbook
│   │   ├── provinces.ts                # Data dan tipe provinsi
│   │   └── spatial.ts                  # Data spasial tambahan; belum dipakai runtime
│   ├── lib/
│   │   └── stats.ts                    # PCA, standardisasi, korelasi Pearson
│   ├── App.tsx                         # Narasi, state, filter, agregasi, komposisi halaman
│   ├── index.css                       # Styling global, chart, animasi, breakpoint responsif
│   ├── main.tsx                        # Mount React ke #root
│   └── vite-env.d.ts                   # Tipe lingkungan Vite
├── data_hierarki.csv                   # Dataset tambahan
├── data_migrasi_network.csv            # Dataset tambahan
├── data_multivariat.csv                # Dataset tambahan
├── data_spasial.csv                    # Dataset tambahan
├── gadm41_IDN_2.json                   # Data geospasial tambahan
├── build_ieee_paper.py                 # Utilitas dokumen pendamping
├── capture_sankey_epilog.py            # Utilitas screenshot browser
├── capture_screenshots.py              # Utilitas screenshot browser
├── check_pages.py                      # Utilitas pemeriksaan dokumen Word
├── get_stats.ps1                       # Utilitas statistik dokumen Word
├── test_col.docx, test_cont.docx       # Dokumen Word yang disertakan
├── test_cont.py, test_docx_col.py      # Utilitas dokumen Word
├── index.html                          # HTML entry
├── package.json, package-lock.json     # Dependency dan scripts npm
├── eslint.config.js                    # Konfigurasi lint
├── postcss.config.js                   # Konfigurasi PostCSS
├── tailwind.config.js                  # Konfigurasi Tailwind
├── tsconfig.json                       # TypeScript project references
├── tsconfig.app.json                   # Konfigurasi source aplikasi
├── tsconfig.node.json                  # Konfigurasi Vite
└── vite.config.ts                      # Konfigurasi Vite
```

`node_modules/`, `dist/`, dan `.venv/` merupakan folder lokal/hasil build yang diabaikan oleh `.gitignore`, bukan source yang dikelola repository. File helper Python/PowerShell dan dokumen Word bukan bagian dari npm scripts aplikasi; README tidak mengasumsikan dependensi atau workflow khusus untuk menjalankannya.

## Prasyarat

- Git untuk clone repository.
- Node.js dan npm terpasang. Repository tidak mendeklarasikan rentang versi Node melalui field `engines`.
- Akses jaringan diperlukan saat instalasi dependency dan untuk memuat Google Fonts dari Google Fonts.

## Instalasi dan development

Clone repository dan masuk ke folder project:

```bash
git clone https://github.com/viersss/UAS-VISDAT.git
cd UAS-VISDAT
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan Vite di terminal. Port default Vite adalah `5173`; bila port tersebut sedang terpakai, perhatikan alamat yang benar-benar dicetak server. Aplikasi mengambil workbook dan geometri melalui path root (`/Data%20Migrasi%20Risen%20Antarprovinsi.xlsx` dan `/indonesia-provinsi-migrasi.json`), sehingga hosting pada subpath memerlukan penyesuaian path.

## Scripts npm

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan Vite development server. |
| `npm run build` | Membuat build produksi ke `dist/`. |
| `npm run preview` | Menyajikan hasil build lokal untuk pemeriksaan. Jalankan setelah `npm run build`. |
| `npm run lint` | Menjalankan ESLint pada repository. |
| `npm run typecheck` | Memeriksa tipe source aplikasi dengan `tsc --noEmit -p tsconfig.app.json`. |

Repository tidak mendefinisikan script test otomatis pada `package.json`.

## Build dan deployment

Buat dan periksa build lokal:

```bash
npm run build
npm run preview
```

Untuk deployment statis, terbitkan isi folder `dist/` ke hosting yang dapat menyajikan file statis. Pastikan workbook, gambar hero, dan GeoJSON berada pada path publik yang diharapkan aplikasi. Tidak ditemukan konfigurasi deployment, pipeline CI/CD, atau instruksi provider hosting spesifik di repository; karena itu langkah provisioning, domain, dan URL deployment bergantung pada layanan yang dipilih.

## Desain responsif

Layout menggunakan utility breakpoint Tailwind serta media query CSS. Kartu hero berubah menjadi dua kolom pada layar sempit dan tiga kolom pada ukuran menengah; bagian visualisasi berubah dari satu kolom menjadi grid saat ruang cukup. Navigasi dapat digulir horizontal, beberapa chart mempertahankan ukuran internal dengan wadah responsif atau scroll horizontal, dan kontrol mobile diberi tinggi target sentuh minimum. Flowmap, Sankey, Treemap, dan Sunburst menyesuaikan ukuran atau layout chart berdasarkan lebar wadah. Tidak ada klaim hasil pengujian lintas-browser/perangkat pada repository.

## Keterbatasan dan catatan interpretasi

- Metadata asal, tanggal publikasi, dan metodologi untuk data indikator provinsi dan hierarki ekonomi tidak dicantumkan secara lengkap. Verifikasi sumber sebelum mengutip atau menggunakan ulang angka.
- Workbook migrasi menandai 2022, tetapi sejumlah narasi UI menyebut 2024; jangan menyamakan label tersebut tanpa memeriksa sumber data.
- Label `Aceh` di workbook tidak cocok dengan `DI Aceh` di GeoJSON; rute terkait tidak tergambar pada Flowmap.
- Workbook menyediakan satu tahun, sehingga tidak dapat menunjukkan tren migrasi antarwaktu.
- Volume rute tidak menjelaskan motif perpindahan.
- Korelasi bukan bukti kausalitas. PCA adalah reduksi dimensi dan interpretasinya bergantung pada variabel yang masuk serta loading.
- CSV tambahan dan file GeoJSON lain tersedia, tetapi tidak dimuat oleh alur runtime webstory saat ini.
- Aplikasi memerlukan browser dengan dukungan API web yang digunakan source, termasuk `fetch`, `IntersectionObserver`, dan `ResizeObserver`.
- Tidak tersedia live demo, konfigurasi deployment, license file, atau sitasi dataset yang dapat diverifikasi di repository.

## Lisensi, credits, dan referensi

Repository ini tidak memuat `LICENSE`/`COPYING`; hak penggunaan dan distribusi kode maupun data tidak dapat ditentukan dari file yang tersedia. Minta konfirmasi pemilik repository dan periksa lisensi sumber dataset sebelum redistribusi.

Dependency utama, font, repository, dan file data yang digunakan dicantumkan di atas sebagai credits teknis. Tidak ditemukan daftar referensi eksternal atau URL sumber data yang cukup untuk mengatribusikan dataset secara bertanggung jawab.
