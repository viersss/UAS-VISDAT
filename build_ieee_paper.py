import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_table_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        f'<w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="D3D3D3"/>'
        f'<w:insideV w:val="none"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_paper():
    doc = docx.Document()

    # Base page settings (A4, 0.75 in margins)
    s1 = doc.sections[0]
    s1.page_width = Inches(8.27)
    s1.page_height = Inches(11.69)
    s1.top_margin = Inches(0.75)
    s1.bottom_margin = Inches(0.75)
    s1.left_margin = Inches(0.75)
    s1.right_margin = Inches(0.75)

    # Base Normal style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(10)
    style_normal.font.color.rgb = RGBColor(0, 0, 0)
    style_normal.paragraph_format.line_spacing = 1.05
    style_normal.paragraph_format.space_after = Pt(0)
    style_normal.paragraph_format.space_before = Pt(0)

    # ==========================
    # SECTION 1: SINGLE COLUMN
    # TITLE & AUTHOR METADATA
    # ==========================

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(12)
    run_title = p_title.add_run("Eksplorasi Ketimpangan Pembangunan Antardaerah di Indonesia Melalui Webstory Visualisasi Data Interaktif Multidimensi")
    run_title.font.name = 'Times New Roman'
    run_title.font.size = Pt(22)
    run_title.font.bold = True

    # Author
    p_author = doc.add_paragraph()
    p_author.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_author.paragraph_format.space_before = Pt(0)
    p_author.paragraph_format.space_after = Pt(2)
    run_author = p_author.add_run("Xavier Yubin Raditio")
    run_author.font.name = 'Times New Roman'
    run_author.font.size = Pt(11)
    run_author.font.bold = True

    # Affiliation / Metadata
    p_affil = doc.add_paragraph()
    p_affil.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_affil.paragraph_format.space_before = Pt(0)
    p_affil.paragraph_format.space_after = Pt(14)
    run_affil = p_affil.add_run(
        "NIM: 222313427\n"
        "Politeknik Statistika STIS, Jakarta, Indonesia\n"
        "Mata Kuliah: Visualisasi Data dan Informasi"
    )
    run_affil.font.name = 'Times New Roman'
    run_affil.font.size = Pt(9.5)
    run_affil.font.italic = False

    # Abstract Box / Paragraph
    p_abs = doc.add_paragraph()
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs.paragraph_format.left_indent = Inches(0.4)
    p_abs.paragraph_format.right_indent = Inches(0.4)
    p_abs.paragraph_format.space_before = Pt(0)
    p_abs.paragraph_format.space_after = Pt(4)
    p_abs.paragraph_format.line_spacing = 1.05

    run_abs_lbl = p_abs.add_run("Abstrak—")
    run_abs_lbl.font.name = 'Times New Roman'
    run_abs_lbl.font.size = Pt(9)
    run_abs_lbl.font.bold = True
    run_abs_lbl.font.italic = True

    run_abs_txt = p_abs.add_run(
        "Ketimpangan pembangunan antardaerah di Indonesia merupakan tantangan struktural yang kerap kali "
        "tersamarkan oleh agregasi angka rata-rata nasional. Penelitian ini merancang dan mengevaluasi sebuah "
        "webstory visualisasi data interaktif multidimensi bertajuk “Ketimpangan Pembangunan Indonesia” untuk "
        "mengungkap disparitas capaian kesejahteraan, dinamika mobilitas penduduk, serta konsentrasi sektoral ekonomi. "
        "Dengan mengintegrasikan data resmi Badan Pusat Statistik (BPS) tahun 2024 pada 34 provinsi, metodologi proyek "
        "menerapkan Principal Component Analysis (PCA) dan Scatter Plot Matrix untuk reduksi dimensi multivariat, "
        "diagram alir Sankey dan Spatial Flow Map untuk memetakan 1.091 rute migrasi risen, serta Treemap dan Sunburst "
        "untuk dekomposisi hierarkis Produk Domestik Bruto (PDB) atas sembilan sektor usaha. Sistem dibangun "
        "menggunakan ekosistem web modern (React, TypeScript, D3.js, dan Apache ECharts) dengan pendekatan "
        "scrollytelling yang memandu pengguna secara progresif. Hasil analisis mengungkap polaritas tajam capaian "
        "antara kawasan Jawa-Bali dengan Kawasan Timur Indonesia, korelasi negatif kuat antara Indeks Pembangunan Manusia "
        "(IPM) dan kemiskinan (r = -0,81), sentralitas gravitasi demografis menuju DKI Jakarta yang menyerap 19,1% "
        "arus migrasi nasional, serta dominasi tiga sektor ekonomi teratas yang menguasai 63,6% struktur PDB. "
        "Webstory ini membuktikan bahwa visualisasi data interaktif yang kontekstual efektif menjembatani data "
        "kompleks menjadi wawasan kebijakan yang transparan, intuitif, dan edukatif bagi publik."
    )
    run_abs_txt.font.name = 'Times New Roman'
    run_abs_txt.font.size = Pt(9)
    run_abs_txt.font.italic = True

    # Keywords
    p_kw = doc.add_paragraph()
    p_kw.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_kw.paragraph_format.left_indent = Inches(0.4)
    p_kw.paragraph_format.right_indent = Inches(0.4)
    p_kw.paragraph_format.space_before = Pt(2)
    p_kw.paragraph_format.space_after = Pt(14)

    run_kw_lbl = p_kw.add_run("Kata Kunci—")
    run_kw_lbl.font.name = 'Times New Roman'
    run_kw_lbl.font.size = Pt(9)
    run_kw_lbl.font.bold = True

    run_kw_txt = p_kw.add_run("Ketimpangan Pembangunan, Visualisasi Data Interaktif, Data Storytelling, Analisis Multivariat, Migrasi Risen.")
    run_kw_txt.font.name = 'Times New Roman'
    run_kw_txt.font.size = Pt(9)
    run_kw_txt.font.italic = True

    # ==========================
    # SECTION 2: TWO COLUMNS
    # BODY OF PAPER
    # ==========================
    s2 = doc.add_section()
    s2._sectPr.append(parse_xml(r'<w:type xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="continuous"/>'))
    
    # Configure 2 columns with 0.25 inch (18 pt) spacing
    sectPr = s2._sectPr
    cols = sectPr.xpath('./w:cols')
    if cols:
        cols[0].set(qn('w:num'), '2')
        cols[0].set(qn('w:space'), '360')
    else:
        cols_elm = parse_xml(r'<w:cols xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:num="2" w:space="360"/>')
        sectPr.append(cols_elm)

    # Helpers for headings, paragraphs, figures, tables
    def add_h1(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10)
        run.font.bold = True
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10)
        run.font.italic = True
        run.font.bold = True
        return p

    def add_p(text, indent=True):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.05
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        if indent:
            p.paragraph_format.first_line_indent = Inches(0.2)
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10)
        return p

    def add_figure(img_path, caption_text, width_in=3.35):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        p_img.paragraph_format.keep_with_next = True
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(width_in))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(8)
        run_cap = p_cap.add_run(caption_text)
        run_cap.font.name = 'Times New Roman'
        run_cap.font.size = Pt(8.5)
        run_cap.font.italic = False

    screenshot_dir = r"C:\Users\viery\.gemini\antigravity-ide\brain\18bff054-ad52-452f-9e1c-816a47890fa7\scratch\screenshots"

    # ==========================
    # I. PENDAHULUAN
    # ==========================
    add_h1("I. PENDAHULUAN")
    add_p("Indonesia sebagai negara kepulauan terbesar di dunia menghadapi realitas ketimpangan pembangunan yang sangat mendalam dan multidimensional. Secara geografis, bentangan wilayah dari Sabang di ujung barat hingga Merauke di ujung timur mencakup lebih dari tujuh belas ribu pulau dengan karakteristik ekologis, demografis, dan infrastruktur yang sangat heterogen. Selama beberapa dekade, narasi keberhasilan ekonomi nasional kerap kali diproyeksikan melalui indikator makro agregat, seperti pertumbuhan Produk Domestik Bruto (PDB) nasional atau capaian rata-rata Indeks Pembangunan Manusia (IPM) yang terus meningkat [1]. Namun demikian, angka rata-rata tersebut menyimpan paradoks statistik yang nyata. Di balik angka agregat nasional, tersimpan disparitas struktural antardaerah yang tajam, di mana sebagian kecil wilayah metropolitan mengalami akselerasi modernisasi yang pesat, sementara banyak wilayah kepulauan dan kawasan perbatasan tertinggal dalam pemenuhan hak-hak dasar warganya [2].")

    add_p("Permasalahan utama dalam komunikasi data pembangunan selama ini terletak pada dominasi laporan teknokratis statis yang berbasis tabel-tabel tabular tebal. Publikasi konvensional, seperti rilis berkala Badan Pusat Statistik (BPS), umumnya menyajikan ratusan lembar data kuantitatif yang sarat angka tetapi minim narasi kontekstual. Bagi perumus kebijakan lintas sektor, akademisi, dan masyarakat umum, menelusuri tumpukan tabel tersebut untuk mengidentifikasi pola hubungan antarvariabel merupakan tantangan kognitif yang besar (information overload). Selain itu, penyajian data yang terkotak-kotak sering kali mengaburkan fenomena ecological fallacy, di mana kesimpulan yang ditarik dari rata-rata nasional gagal menangkap disparitas ekstrem yang terjadi pada tingkat provinsi maupun antarpulau [3].")

    add_p("Untuk mengatasi kesenjangan pemahaman tersebut, paradigma visualisasi data interaktif dan data storytelling menawarkan pendekatan alternatif yang transformatif. Visualisasi data bukan sekadar alat grafis dekoratif, melainkan medium komunikasi analitis yang mampu memetakan struktur data berdimensi tinggi ke dalam bentuk visual yang intuitif [4]. Dengan mengombinasikan visualisasi interaktif dan teknik data storytelling berbasis scrollytelling, audiens diajak melintasi alur eksplorasi terarah (guided exploration). Pendekatan ini memungkinkan progressive disclosure, yakni penyampaian informasi secara bertahap—dimulai dari ikhtisar makro, pendalaman analitis antardimensi, penelusuran dinamika aliran mobilitas, hingga dekomposisi struktur ekonomi yang lebih mendalam [5].")

    add_p("Tujuan dari penelitian dan proyek ini adalah menyusun sebuah webstory visualisasi data komprehensif bertajuk “Ketimpangan Pembangunan Indonesia”. Proyek ini mengintegrasikan seluruh dataset resmi BPS tahun 2024 guna membedah ketimpangan melalui tiga perspektif analitis yang saling melengkapi: (1) evaluasi capaian pembangunan manusia dan infrastruktur melalui analisis multivariat tereduksi, (2) pemetaan jejaring mobilitas penduduk antardaerah melalui visualisasi migrasi risen, dan (3) penyingkapan konsentrasi sektoral dalam pembentukan nilai tambah PDB nasional. Melalui artikel ini, kami mendokumentasikan metodologi rekayasa visual, evaluasi analitis terhadap temuan data, serta kontribusi webstory sebagai instrumen diseminasi data publik yang transparan dan dapat diakses secara luas.")

    # ==========================
    # II. PENELITIAN TERKAIT
    # ==========================
    add_h1("II. PENELITIAN TERKAIT")
    add_p("Kajian mengenai disparitas regional di Indonesia telah menjadi diskursus penting dalam literatur ekonomi pembangunan dan geografi regional. Teori klasik Williamson [6] menyatakan bahwa pada tahap awal pembangunan nasional, ketimpangan spasial cenderung meningkat seiring dengan terkonsentrasinya investasi pada kutub-kutub pertumbuhan (growth poles), sebelum akhirnya menyempit pada tahapan ekonomi matang. Dalam konteks Indonesia, Hill, Resosudarmo, dan Vidyattama [7] mengidentifikasi keterbelahan abadi antara kawasan barat (khususnya Jawa dan sebagian Sumatera) dan kawasan timur Indonesia. Mereka menemukan bahwa keunggulan historis infrastruktur, aglomerasi industri, dan konsentrasi modal manusia di Pulau Jawa menciptakan kurva konvergensi regional yang berjalan sangat lambat. Akita dan Miyata [8] lebih lanjut meneliti dampak era desentralisasi fiskal pasca-otonomi daerah, mencatat bahwa pelimpahan kewenangan administratif ke daerah belum secara otomatis menghilangkan jurang ketimpangan antardaerah, melainkan kerap kali mempertegas disparitas fiskal antara wilayah kaya sumber daya alam dengan wilayah kepulauan non-migas.")

    add_p("Di bidang ilmu visualisasi informasi, konsep narrative visualization yang diperkenalkan oleh Segel dan Heer [9] memberikan landasan teoretis fundamental dalam menyusun cerita berbasis data. Mereka mengkategorikan desain visualisasi naratif ke dalam beberapa pola arsitektural, salah satunya adalah martini-glass structure, di mana narasi diawali dengan tahapan terarah yang terstruktur (author-driven) kemudian terbuka menuju eksplorasi bebas bagi pengguna (reader-driven). Hullman dan Diakopoulos [10] memperluas kerangka ini dengan meneliti aspek retorika visualisasi, menekankan bahwa pemilihan teknik pemetaan visual, filtering visual, dan penempatan anotasi tekstual secara strategis sangat menentukan keberhasilan transfer wawasan tanpa menimbulkan bias kognitif pada pembaca.")

    add_p("Terkait teknik visualisasi yang diimplementasikan dalam proyek ini, sejumlah metode analitis mapan dipilih berdasarkan karakteristik dimensi data. Untuk mereduksi sepuluh indikator pembangunan yang saling berkorelasi, digunakan teknik Principal Component Analysis (PCA) biplot. PCA memproyeksikan data berdimensi tinggi ke ruang berdimensi rendah tanpa kehilangan banyak variansi esensial, memungkinkan deteksi pengelompokan spasial dan korelasi antarvariabel secara simultan [11]. Untuk mendampingi PCA, Parallel Coordinates Plot yang dikembangkan oleh Inselberg dan Dimsdale [12] diterapkan guna mempertahankan visibilitas nilai asli setiap indikator, memungkinkan pembaca memeriksa profil kontinyu setiap provinsi tanpa distorsi proyeksi linier. Analisis korelasi bivariat dilengkapi dengan Scatter Plot Matrix (SPLOM) yang memfasilitasi inspeksi langsung hubungan antardua variabel beserta garis regresi trennya.")

    add_p("Untuk merepresentasikan dinamika perpindahan penduduk, penelitian ini berakar pada prinsip kartografi aliran spasial yang dipelopori oleh Tobler [13]. Memetakan matriks asal-tujuan (origin-destination matrix) secara efektif menuntut solusi visual terhadap masalah kesemrawutan grafis (visual cluttering). Kombinasi diagram Sankey dan peta aliran spasial (spatial flow map) berarah memungkinkan pembaca mengurai volume agregat perpindahan sekaligus mengamati konfigurasi geografis jalur migrasi antarwilayah di kepulauan Indonesia [14]. Terakhir, untuk menggambarkan struktur hierarkis PDB, visualisasi Treemap yang digagas oleh Shneiderman [15] dan visualisasi radial Sunburst oleh Stasko dan Zhang [16] digunakan secara komparatif. Treemap mengoptimalkan pemanfaatan ruang 2D melalui pengisian proporsional luas area persegi (space-filling approach), sementara Sunburst menampilkan kejelasan keterkaitan hierarki multi-tingkat melalui struktur cincin konsentris yang teratur.")

    # ==========================
    # III. METODOLOGI
    # ==========================
    add_h1("III. METODOLOGI")

    add_h2("A. Sumber dan Karakteristik Data")
    add_p("Seluruh dataset yang digunakan dalam penelitian dan pengembangan webstory ini bersumber dari data resmi Badan Pusat Statistik (BPS) Republik Indonesia untuk periode pencatatan tahun 2024. Data tersebut dikelompokkan ke dalam tiga pilar analitis utama dengan karakteristik sebagai berikut:")
    add_p("1) Data Multivariat Pembangunan Provinsi: Mencakup 34 provinsi di Indonesia dengan sepuluh indikator kesejahteraan sosial-ekonomi dan infrastruktur dasar yang bersumber dari Publikasi Indeks Pembangunan Manusia 2024 dan Statistik Kesejahteraan Rakyat 2024 [1], [17]. Indikator-indikator tersebut meliputi: (a) IPM (skala 0–100), (b) PDRB per kapita (juta rupiah/tahun), (c) Tingkat Pengangguran Terbuka/TPT (%), (d) Persentase Penduduk Miskin (%), (e) Rasio Gini (skala 0–1), (f) Harapan Lama Sekolah/HLS (tahun), (g) Rata-rata Lama Sekolah/RLS (tahun), (h) Akses Rumah Tangga terhadap Air Bersih Layak (%), (i) Akses Sanitasi Layak (%), dan (j) Rasio Elektrifikasi Rumah Tangga (%). Selain itu, variabel jumlah penduduk (juta jiwa) dan pengelompokan wilayah kepulauan (Sumatera, Jawa, Bali-Nusa Tenggara, Kalimantan, Sulawesi, Maluku-Papua) disertakan sebagai atribut pelengkap.", indent=False)
    add_p("2) Data Migrasi Risen Antarprovinsi: Bersumber dari hasil Long Form Sensus Penduduk 2020/2024 yang diterbitkan dalam Publikasi Statistik Migrasi Indonesia [18]. Data ini mencatat matriks asal-tujuan perpindahan penduduk berumur 5 tahun ke atas yang tempat tinggalnya lima tahun sebelumnya berbeda dengan provinsi tempat tinggal saat pencacahan tahun 2024. Matriks ini mencakup 34 provinsi asal dan 34 provinsi tujuan dengan total 1.091 rute perpindahan positif, merekam total 4.177.850 jiwa migran risen.", indent=False)
    add_p("3) Data Hierarki Nilai Tambah Ekonomi (PDB): Bersumber dari agregasi Produk Domestik Bruto menurut Lapangan Usaha tahun 2024 atas dasar harga berlaku [19]. Struktur data disusun secara hierarkis tiga tingkat (sektor utama, subsektor, dan rincian komoditas/kegiatan usaha) dengan total agregat nilai mencapai Rp14.150 triliun yang terbagi ke dalam sembilan sektor lapangan usaha utama.", indent=False)

    add_h2("B. Pra-pemrosesan Data")
    add_p("Tahapan pra-pemrosesan data dilakukan melalui serangkaian transformasi komputasional untuk memastikan integritas data:")
    add_p("1) Parsing dan Ekstraksi Spreadsheet Client-Side: Berkas mentah migrasi BPS yang berbentuk berkas Excel multi-kolom (Data Migrasi Risen Antarprovinsi.xlsx) dibaca langsung secara asinkron di peramban pengguna menggunakan library SheetJS (xlsx). Modul parser secara otomatis mendeteksi baris tajuk 'NAMA PROVINSI' dan kolom pembatas 'TOTAL', mengeliminasi entri luar negeri, serta mentransformasikan tabel silang matriks asal-tujuan menjadi format edge list terstruktur: {Tahun, Prov_Asal, Prov_Tujuan, Jumlah_Migran}.", indent=False)
    add_p("2) Penyelarasan Nama Entitas Wilayah: Mengingat ketidakkonsistenan penulisan antar-publikasi (misal: 'D.I. Yogyakarta' vs 'DI Yogyakarta', atau prefiks penomoran BPS), algoritma normalisasi berbasis regex diterapkan untuk menyeragamkan nama 34 provinsi agar terintegrasi sempurna dengan berkas geospasial GeoJSON kepulauan Indonesia (indonesia-provinsi-migrasi.json).", indent=False)
    add_p("3) Standarisasi dan Komputasi Matriks PCA: Karena sepuluh indikator multivariat memiliki satuan yang berbeda (persentase, tahun, juta rupiah, dan indeks), dilakukan standarisasi z-score pada setiap variabel p:")
    
    # Formula z-score
    p_eq1 = doc.add_paragraph()
    p_eq1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_eq1.paragraph_format.space_before = Pt(3)
    p_eq1.paragraph_format.space_after = Pt(3)
    r_eq1 = p_eq1.add_run("z_ij = (x_ij - μ_j) / σ_j        (1)")
    r_eq1.font.name = 'Times New Roman'
    r_eq1.font.italic = True
    r_eq1.font.size = Pt(9.5)

    add_p("Matriks korelasi Pearson 10x10 kemudian dihitung. Dekomposisi nilai eigen dan vektor eigen dilakukan secara deterministik di sisi klien menggunakan algoritma rotasi Jacobi simetris (Jacobi eigenvalue algorithm) yang ditulis dalam TypeScript murni, menghasilkan koordinat skor komponen utama dan vektor pembebanan (loadings) tanpa ketergantungan pada backend eksternal.", indent=False)
    add_p("4) Ekstraksi Centroid Geospasial: Poligon batas administrasi 34 provinsi diekstraksi untuk menghitung koordinat titik berat geografis (centroid) menggunakan modul d3.geoCentroid, yang menjadi titik jangkar (anchor nodes) bagi visualisasi lintasan migrasi.", indent=False)

    add_h2("C. Rancangan Visualisasi dan Alur Storytelling")
    add_p("Arsitektur webstory dirancang dengan alur narasi terarah berbasis skrol (scrollytelling) yang terbagi ke dalam lima bagian logis:")
    add_p("1) Bagian Pembuka (Hero Section): Menetapkan konteks makro melalui tipografi berbobot dan National Metric Strip yang menampilkan lima indikator ringkasan nasional: Total Penduduk (277 juta jiwa), Rata-rata IPM (72,4), Rasio Gini Nasional (0,34), Persentase Kemiskinan Rata-rata (11,3%), dan Rentang Disparitas IPM (20,7 poin antardaerah).", indent=False)
    add_p("2) Bab 1: Pola Multivariat Antarprovinsi: Menguraikan posisi relatif 34 provinsi dalam ruang pembangunan berdimensi sepuluh. Disediakan tiga tab visualisasi yang saling tersinkronisasi: (a) PCA Scatter Biplot untuk mengamati klaster pulau dan arah vektor indikator, (b) Parallel Coordinates Plot untuk membandingkan kurva profil nilai absolut provinsi melintasi sepuluh sumbu, dan (c) Scatter Plot Matrix (SPLOM) untuk memeriksa korelasi bivariat antarvariabel dengan garis regresi linier. Kontrol interaktif mencakup Province Selector untuk penyorotan lintas diagram (cross-highlighting) dan pemilih pasangan korelasi fokus.", indent=False)
    add_p("3) Bab 2: Arus Migrasi Risen Antarprovinsi: Menghubungkan pola pembangunan dengan dinamika perpindahan fisik masyarakat. Mengintegrasikan Diagram Alir Sankey (meringkas volume aliran antarkelompok provinsi) dan Spatial Flow Map (memproyeksikan rute kurva berpanah dengan ketebalan proporsional di atas peta kepulauan Indonesia). Dilengkapi filter dropdown provinsi asal/tujuan serta pembatas volume rute teratas.", indent=False)
    add_p("4) Bab 3: Struktur Ekonomi yang Tidak Merata: Menganalisis bagaimana fondasi nilai tambah PDB terdistribusi antarlapangan usaha. Menyajikan diagram batang horizontal beranimasi untuk kontribusi sembilan sektor utama, disertai visualisasi ruang-isi hierarkis Treemap dan visualisasi radial Sunburst untuk menelusuri rincian komoditas ekonomi hingga tingkat aktivitas terdalam.", indent=False)
    add_p("5) Bagian Penutup (Epilog): Merangkum '3 Sisi Ketimpangan yang Terlihat' dalam format kartu analitis terstruktur, diikuti kutipan penutup reflektif yang menggarisbawahi pentingnya pemerataan pembangunan yang berkeadilan.", indent=False)

    add_h2("D. Implementasi Perangkat Lunak")
    add_p("Aplikasi webstory dikembangkan menggunakan teknologi web modern berkinerja tinggi. Kerangka kerja utama dibangun di atas React 18 dengan TypeScript untuk memastikan keandalan tipe data komputasional statistik. Alat pembangun Vite 5 digunakan untuk manajemen bundling aset yang cepat dan efisien. Di lapisan grafis visualisasi, D3.js versi 7 (khususnya d3-geo, d3-hierarchy, d3-scale, dan d3-selection) digunakan untuk merender elemen SVG interaktif pada peta geospasial, koordinat paralel, treemap, dan sunburst. Apache ECharts (melalui echarts-for-react) diintegrasikan untuk merender diagram Sankey berbasis kanvas berkinerja tinggi.")
    add_p("Desain antarmuka memanfaatkan Tailwind CSS dengan sistem desain palet warna HSL khusus bertema kanvas organik modern (latar belakang canvas #faf8f5, tipografi ink #1a2b3c, aksen teal #1d6d7b, dan aksen hangat warm #d98d55). Untuk interaksi gulir halus, digunakan Intersection Observer API guna mengaktifkan animasi kemunculan elemen visual (reveal animation) dan pembaruan indikator progres membaca pada Floating Navigation Bar secara real-time.")

    add_h2("E. Deployment dan Aksesibilitas Publik")
    add_p("Setelah proses pengujian fungsional dan visual, aplikasi dikompilasi menjadi bundel statis teroptimasi melalui perintah vite build. Berkas hasil build di-deploy secara publik pada platform komputasi awan modern (Bolt.new) dan seluruh kode sumber dipublikasikan pada repositori GitHub publik di https://github.com/viery/UAS-VISDAT. Aplikasi dapat diakses secara instan oleh siapa saja tanpa memerlukan instalasi dependensi lokal, serta sepenuhnya responsif terhadap berbagai ukuran layar desktop maupun peramban modern.")

    add_h2("F. Deklarasi Penggunaan Kecerdasan Buatan (AI)")
    add_p("Secara etis dan transparan, penulis mendeklarasikan bahwa perangkat kecerdasan buatan berbasis Large Language Model (LLM) digunakan sebagai alat bantu pendukung (supporting tool) selama proses pengerjaan proyek. Pemanfaatan AI difokuskan pada tahap brainstorming alur cerita, bantuan refactoring sintaksis visualisasi D3.js/TypeScript, debugging penanganan parsing buffer spreadsheet, serta penyempurnaan keterbacaan gramatikal teks ilmiah. Penulis menegaskan bahwa integritas seluruh dataset BPS, keabsahan formula komputasi matematika, interpretasi hasil temuan statistik, keputusan rancangan desain antarmuka, dan substansi akhir makalah ilmiah ini sepenuhnya merupakan karya orisinal dan tanggung jawab penulis.")

    # ==========================
    # IV. HASIL DAN PEMBAHASAN
    # ==========================
    add_h1("IV. HASIL DAN PEMBAHASAN")

    add_h2("A. Hasil Visualisasi dan Fungsionalitas Sistem")
    add_p("Seluruh rancangan antarmuka dan visualisasi telah berhasil diimplementasikan secara utuh pada platform webstory. Bagian ini mendokumentasikan tangkapan layar asli (screenshot) dari aplikasi yang sedang berjalan beserta evaluasi fungsional dari masing-masing komponen visual:")

    # Gambar 1: Hero
    add_figure(
        os.path.join(screenshot_dir, "01_hero_metric_strip.png"),
        "Gambar 1. Tampilan antarmuka pembuka (Hero Section) yang memadukan tipografi naratif, tag tema, dan National Metric Strip ringkasan lima indikator makro pembangunan nasional."
    )
    add_p("Gambar 1 menampilkan antarmuka pembuka proyek. Judul utama 'Ketimpangan Pembangunan Indonesia' disajikan dengan efek animasi gelombang tipografi (WaveText) yang kontras di atas latar belakang foto urban Indonesia. Jalur metrik nasional (MetricStrip) di bagian bawah menyajikan konteks awal yang krusial bagi pembaca: total 277 juta jiwa penduduk tersebar di 34 provinsi dengan rata-rata IPM nasional sebesar 72,4 dan Rasio Gini 0,34. Nilai rentang IPM sebesar 20,7 poin (rentang 61,8 hingga 82,5) secara langsung menetapkan landasan masalah bahwa disparitas antardaerah di Indonesia berada pada tingkat yang signifikan.")

    # Gambar 2: PCA Biplot
    add_figure(
        os.path.join(screenshot_dir, "02_pca_scatter.png"),
        "Gambar 2. Biplot Analisis Komponen Utama (PCA Scatter Biplot) yang mereduksi sepuluh indikator pembangunan ke dalam Komponen 1 (71,6% variansi) dan Komponen 2 (13,3% variansi), dilengkapi panel pemilih provinsi dan kartu evaluasi variansi."
    )
    add_p("Gambar 2 menunjukkan visualisasi utama pada Bab 1, yakni PCA Scatter Biplot. Sumbu horizontal merepresentasikan Komponen Utama 1 yang menjelaskan 71,6% variansi total data, sedangkan sumbu vertikal merepresentasikan Komponen Utama 2 yang menjelaskan 13,3% variansi. Secara kumulatif, kedua komponen utama ini berhasil menangkap 84,9% total variasi dari sepuluh indikator pembangunan provinsi di Indonesia. Vektor-vektor panah berwarna terakota menggambarkan arah pembebanan (loadings) masing-masing indikator. Panah indikator IPM, Rata-rata Lama Sekolah, Harapan Lama Sekolah, Sanitasi, dan Air Bersih mengarah kuat ke sisi kanan (PC1 positif), sedangkan panah indikator Kemiskinan mengarah tajam ke sisi kiri (PC1 negatif). Di sisi kiri antarmuka, disediakan panel 'Sorot Provinsi' dengan fitur pencarian interaktif dan kartu akumulasi variansi.")

    # Gambar 3: Parallel Coordinates
    add_figure(
        os.path.join(screenshot_dir, "03_parallel_coordinates.png"),
        "Gambar 3. Diagram koordinat paralel (Parallel Coordinates Plot) yang menampilkan profil multivariat 34 provinsi melintasi sepuluh sumbu indikator secara simultan, disertai kartu tooltip interaktif saat pengguna mengarahkan kursor ke garis provinsi (contoh: Jawa Timur)."
    )
    add_p("Pada tab kedua Bab 1 (Gambar 3), Parallel Coordinates Plot memetakan ke-34 provinsi ke dalam sepuluh sumbu vertikal paralel yang mewakili nilai asli setiap indikator pembangunan. Setiap garis poligon merepresentasikan satu provinsi. Ketika pengguna menyorot atau mengarahkan kursor ke salah satu garis (seperti terlihat pada garis provinsi Jawa Timur), sistem memunculkan kartu tooltip gelap dengan rincian lengkap: IPM 73,80, PDRB per kapita Rp21,40 juta, TPT 4,50%, Kemiskinan 9,50%, Rasio Gini 0,37, HLS 13,10 tahun, RLS 9,10 tahun, Air Bersih 65,0%, Sanitasi 58,0%, dan Elektrifikasi 99,0%. Garis provinsi lain secara otomatis meredup (dimmed) menjadi abu-abu transparan, mempermudah inspeksi visual pola anomali antarsumbu.")

    # Gambar 4: SPLOM
    add_figure(
        os.path.join(screenshot_dir, "04_scatter_matrix.png"),
        "Gambar 4. Matriks diagram pencar (Scatter Plot Matrix / SPLOM) antarpasangan indikator pembangunan yang dilengkapi koefisien korelasi Pearson, garis regresi tren bivariat, dan panel penyorotan fokus pasangan variabel."
    )
    add_p("Gambar 4 memperlihatkan tab ketiga Bab 1, yaitu Scatter Plot Matrix (SPLOM) untuk lima variabel inti. Matriks ini menyajikan diagram pencar bivariat pada sel-sel luar diagonal dan koefisien korelasi diri 1,00 pada sel diagonal utama. Pada panel kiri, pengguna dapat memilih pasangan variabel fokus (misalnya IPM x Kemiskinan). Sel yang bersangkutan diberi bingkai aksen teal tebal, dan panel menampilkan koefisien korelasi Pearson secara terperinci (r = -0,81) beserta garis tren regresi linier berwarna merah putus-putus. Titik-titik data diwarnai berdasarkan kelompok pulau asal, memperjelas pemisahan spasial antarkelompok.")

    # Gambar 5: Sankey
    add_figure(
        os.path.join(screenshot_dir, "05_migration_sankey.png"),
        "Gambar 5. Diagram alir Sankey migrasi risen antarprovinsi tahun 2024 yang merangkum volume perpindahan penduduk dari simpul provinsi asal (kiri) menuju simpul provinsi tujuan (kanan)."
    )
    add_p("Memasuki Bab 2, Gambar 5 menyajikan visualisasi perpindahan penduduk menggunakan Diagram Alir Sankey berbasis Apache ECharts. Simpul-simpul di sebelah kiri (berwarna teal) mewakili provinsi asal, sementara simpul-simpul di sebelah kanan (berwarna oranye) mewakili provinsi tujuan tempat tinggal saat pencacahan 2024. Lebar pita aliran mencerminkan jumlah jiwa yang bermigrasi. Terlihat jelas bahwa simpul tujuan DKI Jakarta dan Jawa Barat memiliki lebar pita masuk terbesar, menampung arus masuk masif dari berbagai provinsi di Pulau Jawa dan Sumatera. Filter pada panel kiri memungkinkan pengguna mengisolasi arus masuk atau arus keluar dari provinsi tertentu secara spesifik.")

    # Gambar 6: Flow Map
    add_figure(
        os.path.join(screenshot_dir, "06_migration_flowmap.png"),
        "Gambar 6. Peta aliran spasial (Spatial Flow Map) migrasi risen antarprovinsi di atas peta kepulauan Indonesia dengan kurva lintasan berarah, mata panah dinamis, dan ketebalan garis proporsional terhadap volume migran."
    )
    add_p("Gambar 6 menampilkan tab Flow Map pada Bab 2. Berbeda dengan diagram Sankey yang bersifat abstrak, Flow Map menempatkan simpul-simpul provinsi pada koordinat geografis nyata kepulauan Indonesia menggunakan proyeksi Mercator D3.js. Jalur kurva kuadratik ditarik dari centroid provinsi asal menuju centroid provinsi tujuan, dengan kepala panah marker SVG yang menunjukkan arah perpindahan dan ketebalan garis yang proporsional terhadap volume migran. Visualisasi ini secara gamblang menyingkapkan fenomena konsentrasi spasial: jaringan lintasan paling tebal dan padat terkonvergensi di sepanjang koridor Pulau Jawa, menghubungkan Jawa Barat, Banten, Jawa Tengah, dan Jawa Timur langsung ke DKI Jakarta.")

    # Gambar 7: Sector Bars
    add_figure(
        os.path.join(screenshot_dir, "07_sector_bars.png"),
        "Gambar 7. Diagram batang horizontal kontribusi sembilan sektor lapangan usaha utama terhadap total PDB nasional tahun 2024 beserta panel interpretasi struktural."
    )
    add_p("Pada Bab 3 (Gambar 7), diagram batang horizontal menyajikan proporsi kontribusi sembilan sektor lapangan usaha utama terhadap PDB nasional. Sektor Jasa Lainnya memimpin dengan kontribusi 23,6% (Rp3.339 triliun), disusul oleh Pertanian, Kehutanan & Perikanan sebesar 20,6% (Rp2.915 triliun), dan Industri Pengolahan sebesar 19,4% (Rp2.745 triliun). Diagram batang dilengkapi animasi transisi pengisian lebar batang saat bagian ini memasuki viewport layar pengguna serta tooltip interaktif yang menampilkan nominal absolut dalam triliun rupiah.")

    # Gambar 8: Treemap
    add_figure(
        os.path.join(screenshot_dir, "08_treemap.png"),
        "Gambar 8. Visualisasi Treemap hierarkis yang memetakan distribusi proporsi nilai tambah ekonomi nasional menurut sektor, subsektor, dan rincian komoditas spesifik."
    )
    add_p("Gambar 8 menampilkan visualisasi Treemap pada Bab 3. Treemap menggunakan algoritma squarified layout untuk membagi bidang kanvas menjadi kotak-kotak bersarang yang luasnya proporsional terhadap nilai PDB. Warna konsisten membedakan sembilan sektor utama, sementara pembagian internal kotak memperlihatkan subsektor dan rincian komoditas (seperti Perbankan 3,0%, Makanan Olahan 3,0%, Padi 3,9%, Telekomunikasi 2,4%, dan Residensial 2,4%). Struktur ini memudahkan pembaca melihat bahwa meskipun sektor pertanian menyumbang porsi besar, nilai ekonominya ditopang oleh subkomoditas spesifik seperti padi dan kelapa sawit.")

    # Gambar 9: Sunburst
    add_figure(
        os.path.join(screenshot_dir, "09_sunburst.png"),
        "Gambar 9. Diagram Sunburst radial tiga tingkat yang mengilustrasikan dekomposisi struktur PDB nasional dari tingkat sektor (lingkar dalam), subsektor (lingkar tengah), hingga aktivitas spesifik (lingkar luar)."
    )
    add_p("Gambar 9 menyajikan tab kedua visualisasi hierarki ekonomi menggunakan diagram radial Sunburst. Berpusat pada label 'PDB NASIONAL', diagram ini membentuk tiga lapis cincin konsentris: cincin terdalam mewakili sembilan sektor utama, cincin tengah mewakili subsektor, dan cincin terluar mewakili rincian aktivitas ekonomi. Sudut bukaan setiap busur sebanding dengan persentase kontribusinya. Keunggulan representasi radial ini adalah memberikan kejelasan simetri visual terhadap seberapa terdiversifikasi atau terkonsentrasinya sub-aktivitas di dalam suatu sektor.")

    # ==========================
    # TABEL I & II
    # ==========================
    # Table I: PCA loadings
    add_p("Untuk melengkapi pemahaman kuantitatif terhadap hasil PCA pada Gambar 2, Tabel I menyajikan statistik deskriptif dan koefisien pembebanan (factor loadings) dari sepuluh indikator pembangunan pada dua komponen utama.")

    p_tbl1_cap = doc.add_paragraph()
    p_tbl1_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_tbl1_cap.paragraph_format.space_before = Pt(8)
    p_tbl1_cap.paragraph_format.space_after = Pt(3)
    p_tbl1_cap.paragraph_format.keep_with_next = True
    r_tbl1 = p_tbl1_cap.add_run("TABEL I. STATISTIK DESKRIPTIF DAN FACTOR LOADINGS SEPULUH INDIKATOR PEMBANGUNAN PROVINSI")
    r_tbl1.font.name = 'Times New Roman'
    r_tbl1.font.size = Pt(8.5)
    r_tbl1.font.bold = True

    tbl1_data = [
        ["Indikator Pembangunan", "Rata-rata", "Standar Deviasi", "Loading PC1", "Loading PC2"],
        ["IPM (skala 0–100)", "72,40", "4,28", "0,38", "-0,02"],
        ["PDRB per Kapita (juta Rp)", "24,80", "11,50", "0,28", "0,21"],
        ["TPT (%)", "4,82", "1,42", "0,19", "0,42"],
        ["Kemiskinan (%)", "11,30", "5,82", "-0,39", "0,18"],
        ["Rasio Gini", "0,34", "0,04", "0,22", "0,45"],
        ["Harapan Lama Sekolah (thn)", "13,10", "0,74", "0,38", "-0,05"],
        ["Rata-rata Lama Sekolah (thn)", "9,10", "1,12", "0,38", "0,01"],
        ["Akses Air Bersih (%)", "64,20", "10,80", "0,34", "-0,14"],
        ["Akses Sanitasi Layak (%)", "56,80", "11,20", "0,38", "-0,04"],
        ["Rasio Elektrifikasi (%)", "96,10", "4,15", "0,32", "-0,28"],
    ]

    t1 = doc.add_table(rows=len(tbl1_data), cols=5)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1)

    for row_idx, row_vals in enumerate(tbl1_data):
        row = t1.rows[row_idx]
        is_hdr = (row_idx == 0)
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(r'<w:cantSplit xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))
        if is_hdr:
            trPr.append(parse_xml(r'<w:tblHeader xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))

        for col_idx, val in enumerate(row_vals):
            cell = row.cells[col_idx]
            cell.text = val
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.0
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            run = p.runs[0]
            run.font.name = 'Times New Roman'
            run.font.size = Pt(8.5)
            if is_hdr:
                run.font.bold = True
                set_cell_shading(cell, "F2F2F2")
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)

    # Table II: GDP sectors
    add_p("Sementara itu, rincian agregat nilai nominal dan persentase kontribusi sembilan sektor ekonomi dalam pembentukan Produk Domestik Bruto tahun 2024 disarikan dalam Tabel II.")

    p_tbl2_cap = doc.add_paragraph()
    p_tbl2_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_tbl2_cap.paragraph_format.space_before = Pt(8)
    p_tbl2_cap.paragraph_format.space_after = Pt(3)
    p_tbl2_cap.paragraph_format.keep_with_next = True
    r_tbl2 = p_tbl2_cap.add_run("TABEL II. STRUKTUR KONTRIBUSI NILAI TAMBAH BRUTO MENURUT SEMBILAN SEKTOR PDB NASIONAL (2024)")
    r_tbl2.font.name = 'Times New Roman'
    r_tbl2.font.size = Pt(8.5)
    r_tbl2.font.bold = True

    tbl2_data = [
        ["Sektor Lapangan Usaha Utama", "Nilai (Triliun Rp)", "Kontribusi (%)", "Kumulatif (%)"],
        ["Jasa Lainnya", "3.339", "23,60%", "23,60%"],
        ["Pertanian, Kehutanan & Perikanan", "2.915", "20,60%", "44,20%"],
        ["Industri Pengolahan", "2.745", "19,40%", "63,60%"],
        ["Konstruksi", "1.280", "9,00%", "72,60%"],
        ["Perdagangan Besar & Eceran", "1.220", "8,60%", "81,20%"],
        ["Pertambangan & Penggalian", "1.078", "7,60%", "88,80%"],
        ["Transportasi & Pergudangan", "808", "5,70%", "94,50%"],
        ["Jasa Akomodasi & Makan Minum", "466", "3,30%", "97,80%"],
        ["Pengadaan Listrik & Gas", "298", "2,10%", "100,00%"],
        ["Total PDB Nasional Tercatat", "14.150", "100,00%", "100,00%"],
    ]

    t2 = doc.add_table(rows=len(tbl2_data), cols=4)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t2)

    for row_idx, row_vals in enumerate(tbl2_data):
        row = t2.rows[row_idx]
        is_hdr = (row_idx == 0)
        is_tot = (row_idx == len(tbl2_data) - 1)
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(r'<w:cantSplit xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))
        if is_hdr:
            trPr.append(parse_xml(r'<w:tblHeader xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))

        for col_idx, val in enumerate(row_vals):
            cell = row.cells[col_idx]
            cell.text = val
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.0
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            run = p.runs[0]
            run.font.name = 'Times New Roman'
            run.font.size = Pt(8.5)
            if is_hdr or is_tot:
                run.font.bold = True
                if is_hdr:
                    set_cell_shading(cell, "F2F2F2")
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)

    # ==========================
    # B. TEMUAN DAN INSIGHT
    # ==========================
    add_h2("B. Temuan dan Analisis Statistik")
    add_p("Integrasi visualisasi data dalam webstory ini berhasil menyingkapkan sejumlah pola struktural fundamental mengenai ketimpangan pembangunan di Indonesia:")
    add_p("1) Polaritas Spasial Barat-Timur dalam Ruang Multivariat: Proyeksi skor pada PCA Biplot (Gambar 2) secara tegas memisahkan provinsi-provinsi di Indonesia ke dalam dua klaster besar di sepanjang sumbu Komponen Utama 1. Provinsi-provinsi di Pulau Jawa dan Bali (seperti DKI Jakarta, DI Yogyakarta, Jawa Barat, dan Bali) mengelompok rapat di kuadran kanan dengan skor PC1 positif tinggi (> 2,0). Kelompok ini ditandai oleh capaian IPM unggul (> 75), rata-rata lama sekolah di atas 9 tahun, serta akses sanitasi dan air bersih yang mendekati universal. Sebaliknya, provinsi-provinsi di Kawasan Timur Indonesia—khususnya Papua, Papua Barat, Papua Pegunungan, dan Nusa Tenggara Timur—terproyeksikan jauh di kuadran kiri dengan skor PC1 negatif (< -2,0). Provinsi Papua Pegunungan mencatat batas bawah nasional dengan IPM 54,43 dan persentase kemiskinan mencapai 29,66%, menegaskan bahwa jurang kesejahteraan manusia antara pusat ekonomi dan daerah 3T (terdepan, terluar, tertinggal) masih sangat lebar.", indent=False)
    add_p("2) Karakteristik Komponen Utama: Berdasarkan koefisien loading pada Tabel I, Komponen Utama 1 (71,6% variansi) merefleksikan dimensi 'Kapasitas Pembangunan Manusia dan Akses Layanan Dasar'. Indikator IPM, HLS, RLS, sanitasi, air bersih, dan elektrifikasi memiliki korelasi positif yang sangat kuat terhadap PC1 (loading 0,32 hingga 0,38), sedangkan kemiskinan memiliki loading negatif sebesar -0,39. Sementara itu, Komponen Utama 2 (13,3% variansi) merefleksikan dimensi 'Tekanan Urbanisasi dan Kesenjangan Distribusi'. Sumbu PC2 didominasi oleh loading positif Rasio Gini (0,45), Tingkat Pengangguran Terbuka (0,42), dan PDRB per kapita (0,21). Hal ini menjelaskan mengapa provinsi metropolitan seperti DKI Jakarta berada di kuadran atas: memiliki IPM sangat tinggi namun sekaligus menanggung rasio gini tertinggi (0,43) dan pengangguran terbuka yang relatif besar (6,21%).", indent=False)
    add_p("3) Hubungan Bivariat Antarindikator: Melalui eksplorasi Scatter Plot Matrix (Gambar 4), terkonfirmasi korelasi linier negatif yang sangat kuat antara IPM dan persentase penduduk miskin (r = -0,81). Temuan ini menunjukkan bahwa provinsi dengan tingkat kemiskinan tinggi hampir selalu disertai oleh keterbatasan akumulasi modal manusia. Di sisi lain, akses rasio elektrifikasi berkorelasi positif kuat dengan IPM (r = 0,80), mengindikasikan bahwa infrastruktur kelistrikan merupakan prasyarat esensial yang memungkinkan aktivitas pendidikan dan produktivitas ekonomi berjalan.", indent=False)
    add_p("4) Sentralitas Gravitasi Demografis pada Arus Migrasi: Visualisasi Sankey (Gambar 5) dan Flow Map (Gambar 6) membuktikan bahwa pola mobilitas penduduk Indonesia sangat asimetris. Dari total 4.177.850 jiwa migran risen yang tercatat lintas provinsi pada tahun 2024, rute terbesar nasional adalah perpindahan dari Jawa Barat menuju DKI Jakarta dengan volume mencapai 339.634 jiwa. DKI Jakarta bertindak sebagai kutub gravitasi demografis terbesar yang menyerap 797.468 jiwa migran (19,1% dari total arus nasional). Menariknya, 60 rute teratas dari total 1.091 rute positif telah merepresentasikan 60,5% dari seluruh pergerakan migran nasional. Konsentrasi arus migrasi yang masif menuju Pulau Jawa ini mencerminkan persepsi disparitas upah dan kesempatan kerja antardaerah.", indent=False)
    add_p("5) Struktur Ekonomi yang Terkonsentrasi: Analisis data hierarki PDB (Tabel II, Gambar 7, 8, dan 9) menyingkapkan bahwa output ekonomi nasional masih sangat terkonsentrasi pada tiga sektor utama. Akumulasi kontribusi dari sektor Jasa Lainnya (23,6%), Pertanian, Kehutanan & Perikanan (20,6%), dan Industri Pengolahan (19,4%) mencapai 63,6% dari total nilai ekonomi nasional. Sementara itu, enam sektor lapangan usaha lainnya harus berbagi porsi 36,4% sisanya. Ketergantungan ekonomi yang sangat tinggi pada segmen jasa perkotaan dan industri manufaktur di satu sisi, serta agrikultur berproduktivitas subsisten di sisi lain, menjelaskan mengapa pertumbuhan ekonomi agregat belum serta-merta menghasilkan pemerataan pendapatan yang inklusif di seluruh pelosok nusantara.", indent=False)

    # ==========================
    # C. EVALUASI RANCANGAN
    # ==========================
    add_h2("C. Evaluasi Rancangan Visualisasi dan Kegunaan")
    add_p("Evaluasi rancangan antarmuka dan efektivitas komunikasi visual dilakukan melalui beberapa dimensi desain informasi:")
    add_p("1) Keterbacaan Visual dan Reduksi Beban Kognitif: Penggunaan warna pada seluruh diagram mengikuti hierarki warna semantik yang terstandarisasi. Warna kategori pulau pada PCA biplot dan SPLOM (Jawa = teal, Sumatera = oranye hangat, dsb.) dipetakan secara konsisten ke seluruh bab, mencegah kebingungan persepsi pembaca. Diagram koordinat paralel yang rentan terhadap kesemrawutan garis (hairball effect) diatasi dengan memberikan opasitas rendah (0,2) pada garis netral dan opasitas tinggi (0,95) pada garis provinsi yang dipilih.", indent=False)
    add_p("2) Interaktivitas Sinkron (Brushing and Linking): Salah satu kekuatan utama webstory ini adalah sinkronisasi keadaan antarkomponen (state synchronization). Ketika pembaca memilih sebuah provinsi melalui ProvinceSelector, perubahan tersebut langsung dipantulkan secara serentak ke dalam titik PCA, garis koordinat paralel, dan sorotan matriks korelasi. Interaktivitas dua arah ini memungkinkan eksplorasi data yang dinamis tanpa membebani pengguna dengan muat ulang halaman.", indent=False)
    add_p("3) Efektivitas Alur Storytelling: Pendekatan scrollytelling terbukti memandu pembaca membangun pemahaman yang utuh. Informasi disajikan secara berjenjang: Bab 1 memberikan pemahaman posisi relatif daerah; Bab 2 memperlihatkan interaksi nyata antarwilayah melalui perpindahan penduduk; dan Bab 3 membongkar struktur ekonomi yang menopang ketimpangan tersebut. Transisi antar-bab diperhalus dengan TransitionQuote yang berfungsi sebagai jeda reflektif bagi pembaca sebelum berpindah ke dimensi analisis berikutnya.", indent=False)

    # ==========================
    # D. KETERBATASAN
    # ==========================
    add_h2("D. Keterbatasan Penelitian dan Proyek")
    add_p("Penulis mengidentifikasi beberapa keterbatasan penting dalam penelitian dan proyek visualisasi ini:")
    add_p("1) Keterbatasan Resolusi Data Spasial: Unit analisis utama dalam webstory ini berada pada tingkat agregasi provinsi (34 provinsi). Meskipun data kabupaten/kota tersedia secara terpisah pada sebagian berkas mentah BPS, keterbatasan ketersediaan matriks migrasi komprehensif pada level mikro membatasi resolusi visualisasi pada level provinsi. Akibatnya, ketimpangan internal di dalam satu provinsi (intra-provincial inequality)—seperti disparitas antara kota metropolitan dengan kabupaten pedesaan terpencil dalam satu provinsi yang sama—belum terpetakan secara mendalam.", indent=False)
    add_p("2) Batasan Analisis Cross-Sectional: Data migrasi risen yang tersedia dalam workbook BPS 2024 bersifat potong lintang (cross-sectional) pada satu titik waktu, tanpa deret waktu longitudinal. Oleh karena itu, visualisasi migrasi hanya mampu membandingkan asal dan tujuan pada tahun 2024, bukan melacak tren perubahan dinamika perpindahan penduduk dari tahun ke tahun.", indent=False)
    add_p("3) Batasan Klaim Kausalitas: Seluruh analisis statistik yang disajikan dalam proyek ini—termasuk korelasi Pearson dan reduksi dimensi PCA—bersifat deskriptif-asosiatif. Korelasi negatif kuat antara kemiskinan dan IPM, atau korelasi positif antara elektrifikasi dan IPM, menunjukkan bahwa indikator-indikator tersebut bergerak bersama-sama, namun tidak dapat diinterpretasikan sebagai hubungan sebab-akibat langsung (causal inference) tanpa pemodelan ekonometrika kausal yang mengontrol variabel perancu (confounding variables).", indent=False)
    add_p("4) Kendala Kinerja Rendering pada Perangkat Bergerak: Visualisasi jejaring spasial dengan 1.091 edge kurva vektor SVG pada Flow Map membutuhkan daya komputasi grafis yang cukup tinggi. Meskipun telah dioptimalkan dengan pembatasan 60 rute teratas secara default dan lazy-loading komponen, pengguna pada perangkat bergerak berspesifikasi rendah mungkin mengalami sedikit penurunan framerate saat melakukan interaksi zoom atau filter rute secara dinamis.", indent=False)

    # ==========================
    # V. KESIMPULAN
    # ==========================
    add_h1("V. KESIMPULAN")
    add_p("Penelitian ini telah berhasil merancang, mengembangkan, dan mengevaluasi webstory visualisasi data interaktif multidimensi “Ketimpangan Pembangunan Indonesia” berbasis data resmi Badan Pusat Statistik tahun 2024. Melalui perpaduan teknik PCA Biplot, Parallel Coordinates, Scatter Plot Matrix, Sankey Diagram, Spatial Flow Map, Treemap, dan Sunburst, proyek ini berhasil mentransformasikan data tabular makro yang masif dan kaku menjadi media komunikasi analitis yang komunikatif, menarik, dan mudah dipahami. Hasil analisis empiris menegaskan adanya polaritas pembangunan spasial yang tajam antara kawasan barat dan timur Indonesia, korelasi negatif kuat antara kemiskinan dan capaian IPM (r = -0,81), konsentrasi arus migrasi nasional yang terpusat ke wilayah megapolitan Jabodetabek dan Jawa Barat (menyerap lebih dari 60% rute teratas nasional), serta struktur PDB yang masih sangat terkonsentrasi pada tiga sektor lapangan usaha utama (63,6%). Webstory ini memberikan kontribusi nyata dalam menjembatani diseminasi statistik publik kepada pemangku kebijakan dan masyarakat luas, mendorong dialog pembangunan yang lebih transparan, inklusif, dan berkeadilan sosial.")

    # ==========================
    # URL PROYEK & REPOSITORI
    # ==========================
    add_h1("URL PROYEK DAN REPOSITORI KODE")
    p_urls = doc.add_paragraph()
    p_urls.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_urls.paragraph_format.line_spacing = 1.05
    p_urls.paragraph_format.first_line_indent = Inches(0.2)
    p_urls.paragraph_format.space_after = Pt(8)
    
    r_u1 = p_urls.add_run("URL Proyek Publik (Webstory): ")
    r_u1.font.name = 'Times New Roman'
    r_u1.font.bold = True
    r_u1.font.size = Pt(9.5)
    r_u2 = p_urls.add_run("https://bolt.new/~/sb1-njmtm3qm\n")
    r_u2.font.name = 'Times New Roman'
    r_u2.font.size = Pt(9.5)
    
    r_u3 = p_urls.add_run("URL Repositori GitHub: ")
    r_u3.font.name = 'Times New Roman'
    r_u3.font.bold = True
    r_u3.font.size = Pt(9.5)
    r_u4 = p_urls.add_run("https://github.com/viery/UAS-VISDAT")
    r_u4.font.name = 'Times New Roman'
    r_u4.font.size = Pt(9.5)

    # ==========================
    # DAFTAR PUSTAKA (IEEE STYLE)
    # ==========================
    add_h1("DAFTAR PUSTAKA")

    references = [
        "[1] Badan Pusat Statistik, Indeks Pembangunan Manusia 2024. Jakarta: BPS RI, 2023. No. Katalog: 4102002.",
        "[2] H. Hill, B. P. Resosudarmo, dan Y. Vidyattama, “Indonesia's East-West divide: Regional inequality and distribution in the post-Suharto era,” Journal of Southeast Asian Economies, vol. 25, no. 3, hal. 329–354, 2008. DOI: 10.1355/AE25-3C.",
        "[3] S. Openshaw, The Modifiable Areal Unit Problem (Concepts and Techniques in Modern Geography). Norwich: Geo Books, 1984.",
        "[4] M. Bostock, V. Ogievetsky, dan J. Heer, “D3: Data-Driven Documents,” IEEE Transactions on Visualization and Computer Graphics, vol. 17, no. 12, hal. 2301–2309, 2011. DOI: 10.1109/TVCG.2011.185.",
        "[5] E. Segel dan J. Heer, “Narrative visualization: Telling stories with data,” IEEE Transactions on Visualization and Computer Graphics, vol. 16, no. 6, hal. 1139–1148, 2010. DOI: 10.1109/TVCG.2010.179.",
        "[6] J. G. Williamson, “Regional inequality and the process of national development: A description of the patterns,” Economic Development and Cultural Change, vol. 13, no. 4, hal. 1–84, 1965. DOI: 10.1086/450136.",
        "[7] T. Akita dan S. Miyata, “The effects of decentralization on regional inequality in Indonesia: A social accounting matrix analysis,” The Annals of Regional Science, vol. 42, no. 3, hal. 633–652, 2008. DOI: 10.1007/s00168-007-0174-8.",
        "[8] J. Hullman dan N. Diakopoulos, “Visualization rhetoric: Framing effects in narrative visualization,” IEEE Transactions on Visualization and Computer Graphics, vol. 17, no. 12, hal. 2231–2240, 2011. DOI: 10.1109/TVCG.2011.255.",
        "[9] I. T. Jolliffe dan J. Cadima, “Principal component analysis: A review and recent developments,” Philosophical Transactions of the Royal Society A: Mathematical, Physical and Engineering Sciences, vol. 374, no. 2065, 2016. DOI: 10.1098/rsta.2015.0202.",
        "[10] A. Inselberg dan B. Dimsdale, “Parallel coordinates: a tool for visualizing multi-dimensional geometry,” dalam Proceedings of the 1st IEEE Conference on Visualization (Visualization '90), San Francisco, CA, 1990, hal. 361–378. DOI: 10.1109/VISUAL.1990.146402.",
        "[11] W. R. Tobler, “Experiments in migration mapping by computer,” The American Cartographer, vol. 14, no. 2, hal. 155–163, 1987. DOI: 10.1559/152304087783875273.",
        "[12] B. Shneiderman, “Tree visualization with tree-maps: 2-d space-filling approach,” ACM Transactions on Graphics (TOG), vol. 11, no. 1, hal. 92–99, 1992. DOI: 10.1145/102377.115768.",
        "[13] J. Stasko dan E. Zhang, “Focus+context display and navigation techniques for enhancing radial, space-filling hierarchy visualizations,” dalam IEEE Symposium on Information Visualization 2000 (InfoVis 2000), Salt Lake City, UT, 2000, hal. 57–64. DOI: 10.1109/INFVIS.2000.885091.",
        "[14] Badan Pusat Statistik, Statistik Migrasi Indonesia Hasil Long Form Sensus Penduduk 2020. Jakarta: BPS RI, 2023. No. Katalog: 2102047.",
        "[15] Badan Pusat Statistik, Produk Domestik Regional Bruto Provinsi-Provinsi di Indonesia Menurut Lapangan Usaha 2018–2024. Jakarta: BPS RI, 2023. No. Katalog: 9320001.",
        "[16] Badan Pusat Statistik, Statistik Kesejahteraan Rakyat 2024. Jakarta: BPS RI, 2024. No. Katalog: 4101002.",
    ]

    for ref in references:
        p_ref = doc.add_paragraph()
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ref.paragraph_format.left_indent = Inches(0.25)
        p_ref.paragraph_format.first_line_indent = Inches(-0.25)
        p_ref.paragraph_format.space_before = Pt(0)
        p_ref.paragraph_format.space_after = Pt(2)
        p_ref.paragraph_format.line_spacing = 1.0
        r = p_ref.add_run(ref)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(8.5)

    output_path = r"c:\Users\viery\OneDrive\Dokumen\COLLEGE\CURRENT COURSE\VISDAT\UAS_VISDAT\💀test💀\Makalah_IEEE_Ketimpangan_Pembangunan_Indonesia.docx"
    doc.save(output_path)
    print("File successfully created:", output_path.encode('ascii', 'replace').decode('ascii'))

if __name__ == '__main__':
    build_paper()
