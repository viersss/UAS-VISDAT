"""
Dashboard Data Storytelling BPS: Provinsi -> Kabupaten/Kota -> Struktur Hierarki.

Alur cerita dashboard ini mengikuti tiga topik visualisasi sesuai ketentuan UAS:
1. Multivariat tingkat provinsi   -> PCA Scatter, Parallel Coordinates, Scatterplot Matrix
2. Geospasial tingkat kab/kota    -> Choropleth Map, Peta Simbol Proporsional
3. Struktur hierarki PDB nasional -> Treemap / Sunburst (ukuran = nilai, warna = kontribusi %)

REDESIGN: Antarmuka dirombak menjadi pengalaman data storytelling vertikal (scrollytelling)
dengan kartu konten, narasi transisi emosional, teks dinamis berbasis pilihan sidebar,
metrik utama di atas, dan catatan teknis tersembunyi dalam expander.
Logika pemrosesan data (PCA, GeoJSON, agregasi hierarki) dan konfigurasi Plotly TIDAK diubah.
"""

import json
import re

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# ===========================================================================
# KONFIGURASI HALAMAN & CSS
# ===========================================================================
st.set_page_config(
    page_title="Ketimpangan Pembangunan Indonesia — Data Storytelling",
    page_icon="\U0001F4CA",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# CSS Kustom: scrollytelling estetik, kartu, tipografi, transisi
# ---------------------------------------------------------------------------
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
        background: linear-gradient(180deg, #F7F2EA 0%, #EEF6F3 100%);
        color: #17324D;
    }

    /* ===== Tipografi Naratif ===== */
    h1 {
        font-weight: 700;
        letter-spacing: -0.03em;
        margin-bottom: 0.3rem;
        font-size: 2.8rem;
        line-height: 1.15;
        color: #13314A;
    }

    h2 {
        font-weight: 600;
        font-size: 1.55rem;
        letter-spacing: -0.02em;
        margin-top: 0;
        margin-bottom: 0.6rem;
        color: #153C59;
    }

    h3 {
        font-weight: 600;
        font-size: 1.15rem;
        letter-spacing: -0.01em;
        margin-bottom: 0.4rem;
        color: #224B6E;
    }

    .subtitle-main {
        font-family: 'Lora', serif;
        font-size: 1.12rem;
        color: #425A6E;
        margin-bottom: 1rem;
        font-weight: 400;
        line-height: 1.7;
        font-style: italic;
    }

    /* ===== Kartu Konten (Card-like Containers) ===== */
    .story-card {
        background: linear-gradient(145deg, #FFFFFF 0%, #F8F4EE 100%);
        border: 1px solid rgba(21, 60, 89, 0.09);
        border-radius: 18px;
        padding: 2rem 2.2rem;
        margin-bottom: 2.5rem;
        box-shadow: 0 12px 30px rgba(15, 50, 80, 0.08);
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .story-card:hover {
        border-color: rgba(32, 125, 136, 0.35);
        box-shadow: 0 14px 36px rgba(15, 50, 80, 0.12);
    }

    /* Kartu metrik terpisah */
    .metric-strip {
        background: linear-gradient(135deg, #183D59 0%, #2C6478 100%);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 14px;
        padding: 1.2rem 1rem;
        margin-bottom: 2.2rem;
        box-shadow: 0 10px 25px rgba(22, 50, 70, 0.18);
    }

    /* ===== Teks Narasi & Transisi ===== */
    .narration {
        font-family: 'Lora', serif;
        font-size: 1.03rem;
        color: #294B63;
        line-height: 1.75;
        margin-bottom: 1.2rem;
    }

    .narration-context {
        font-family: 'Lora', serif;
        font-size: 0.98rem;
        color: #4D6476;
        line-height: 1.7;
        margin-bottom: 1rem;
        padding-left: 1rem;
        border-left: 3px solid #E67E49;
    }

    .interpretation-prompt {
        font-family: 'Lora', serif;
        font-style: italic;
        font-size: 0.95rem;
        color: #4F6475;
        line-height: 1.65;
        margin-top: 0.8rem;
        padding: 0.9rem 1rem;
        background: rgba(230, 126, 73, 0.06);
        border-radius: 10px;
        border: 1px dashed rgba(230, 126, 73, 0.4);
    }

    .insight-panel {
        background: linear-gradient(135deg, rgba(27, 96, 114, 0.08), rgba(230, 126, 73, 0.10));
        border: 1px solid rgba(27, 96, 114, 0.12);
        border-radius: 14px;
        padding: 1.2rem 1.3rem;
        margin: 1rem 0 2rem 0;
        box-shadow: 0 8px 18px rgba(17, 48, 69, 0.08);
    }

    .insight-panel strong {
        color: #123C57;
    }

    /* Blockquote besar untuk transisi antar bab */
    .transition-quote {
        font-family: 'Lora', serif;
        font-style: italic;
        font-size: 1.35rem;
        color: #1B6072;
        text-align: center;
        line-height: 1.6;
        margin: 3rem auto 3.5rem auto;
        max-width: 720px;
        padding: 1.5rem 0;
        border-top: 1px solid rgba(19, 49, 74, 0.18);
        border-bottom: 1px solid rgba(19, 49, 74, 0.18);
    }

    /* Label bab / section number */
    .chapter-label {
        font-family: 'Inter', sans-serif;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #58A6FF;
        margin-bottom: 0.5rem;
    }

    /* Caption grafik */
    .chart-caption {
        font-size: 0.82rem;
        color: #6E7681;
        text-align: center;
        margin-top: 0.8rem;
        font-style: italic;
    }

    /* ===== Sidebar ===== */
    section[data-testid="stSidebar"] {
        background: linear-gradient(180deg, #F5F1EA 0%, #EDF4F1 100%);
        border-right: 1px solid rgba(19, 49, 74, 0.12);
    }

    section[data-testid="stSidebar"] .stMarkdown h3 {
        color: #163B55;
        font-size: 1.1rem;
    }

    /* ===== Expander styling ===== */
    .streamlit-expanderContainer {
        border: 1px solid #30363D !important;
        border-radius: 10px !important;
        background: #0D1117 !important;
    }

    /* ===== Tombol tab Streamlit ===== */
    .stTabs [data-baseweb="tab-list"] {
        gap: 0;
    }
    .stTabs [data-baseweb="tab"] {
        padding: 0.6rem 1.2rem;
        font-size: 0.88rem;
    }

    /* ===== Hero section ===== */
    .hero-wrap {
        text-align: center;
        padding: 3rem 1rem 2rem 1rem;
    }

    .hero-eyebrow {
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #58A6FF;
        margin-bottom: 1rem;
    }

    .hero-divider {
        width: 60px;
        height: 3px;
        background: #58A6FF;
        border-radius: 2px;
        margin: 1.5rem auto 2rem auto;
    }

    /* ===== StMetric卡片 ===== */
    div[data-testid="stMetric"] {
        background: rgba(255,255,255,0.72);
        border: 1px solid rgba(19, 49, 74, 0.08);
        border-radius: 12px;
        padding: 0.8rem 1rem;
        box-shadow: 0 6px 14px rgba(19, 49, 74, 0.05);
    }

    div[data-testid="stMetric"] label {
        font-size: 0.78rem;
        color: #4D6476;
    }

    div[data-testid="stMetric"] div[data-testid="stMetricValue"] {
        font-size: 1.5rem;
        font-weight: 700;
        color: #153C59;
    }

    /* ===== Footer ===== */
    .footer-note {
        text-align: center;
        color: #484F58;
        font-size: 0.82rem;
        padding: 2rem 0 1rem 0;
        border-top: 1px solid #21262D;
        margin-top: 3rem;
    }

    /* Divider tipis */
    hr {
        margin: 2.5rem 0;
        border-color: #21262D;
    }

    /* Smooth scroll */
    html { scroll-behavior: smooth; }

    /* Teks sapaan dinamis */
    .dynamic-greeting {
        font-family: 'Lora', serif;
        font-size: 1.05rem;
        color: #58A6FF;
        font-style: italic;
        margin-bottom: 1rem;
    }
</style>
""", unsafe_allow_html=True)


SUMBER = "Sumber: BPS"
PALET_KONTINU = "Blues"
PALET_DIVERGEN = "RdBu"
COLOR_HIGHLIGHT = "#58A6FF"
COLOR_MUTED = "#484F58"


# ===========================================================================
# UTILITAS DAN PEMROSESAN DATA (TIDAK DIUBAH)
# ===========================================================================

def _normalisasi(teks):
    return re.sub(r"[\s_\-]+", "", str(teks)).lower()

def cari_kolom(df, kandidat, wajib=True):
    peta = {_normalisasi(c): c for c in df.columns}
    for k in kandidat:
        key = _normalisasi(k)
        if key in peta:
            return peta[key]
    for k in kandidat:
        key = _normalisasi(k)
        for norm, asli in peta.items():
            if key in norm or norm in key:
                return asli
    if wajib:
        raise KeyError(f"Tidak ditemukan kolom yang cocok untuk {kandidat}.")
    return None

def kolom_numerik(df, kecuali=()):
    num = df.select_dtypes(include=np.number).columns.tolist()
    return [c for c in num if c not in kecuali]

def pilih_kolom_prioritas(kolom_list, kata_kunci, default_index=0):
    for kol in kolom_list:
        norm = _normalisasi(kol)
        if any(kk in norm for kk in kata_kunci):
            return kol
    if 0 <= default_index < len(kolom_list):
        return kolom_list[default_index]
    return kolom_list[0]

def tambah_anotasi_sumber(fig):
    fig.add_annotation(
        text=SUMBER, xref="paper", yref="paper",
        x=1, y=-0.12, showarrow=False,
        font=dict(size=10, color="#8B949E"),
        xanchor="right",
    )
    fig.update_layout(
        font_family="Inter, sans-serif",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        title_font_family="Inter, sans-serif",
        title_font_size=16,
        title_font_color="#E6EDF3",
        legend_font_color="#C9D1D9",
    )
    fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='#30363D', zeroline=False, color="#8B949E")
    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='#30363D', zeroline=False, color="#8B949E")
    return fig

def gunakan_peta_mapbox():
    return hasattr(px, "choropleth_mapbox")

def gunakan_peta_map():
    return hasattr(px, "choropleth_map")


@st.cache_data
def muat_data_multivariat():
    df = pd.read_csv("data_multivariat.csv")
    kol_provinsi = cari_kolom(df, ["Provinsi", "Nama Provinsi", "Province"])
    df = df.rename(columns={kol_provinsi: "Provinsi"})

    kol_gini = cari_kolom(df, ["Rasio_Gini", "Gini_Ratio", "Gini", "Gini Ratio"], wajib=False)
    if kol_gini and kol_gini != "Rasio_Gini":
        df = df.rename(columns={kol_gini: "Rasio_Gini"})

    if "Jumlah_Penduduk" not in df.columns:
        kol_pop = cari_kolom(df, ["Jumlah_Penduduk", "Penduduk", "Populasi", "Kepadatan_Penduduk"], wajib=False)
        if kol_pop and kol_pop != "Jumlah_Penduduk":
            df["Jumlah_Penduduk"] = df[kol_pop]

    df["Provinsi"] = df["Provinsi"].astype(str).str.strip()
    return df

@st.cache_data
def muat_data_spasial():
    df = pd.read_csv("data_spasial.csv", dtype={"Kode_BPS": "string"})
    kol_kode = cari_kolom(df, ["Kode_BPS", "Kode Wilayah", "Kode_Wilayah", "Kode_Kabkota", "kode_bps", "id_kabkota"])
    kol_nama = cari_kolom(df, ["Nama_Kabkota", "Kabupaten_Kota", "Nama Kabupaten/Kota", "Nama_Wilayah", "nmkab"], wajib=False)

    df = df.rename(columns={kol_kode: "Kode_BPS"})
    if kol_nama:
        df = df.rename(columns={kol_nama: "Nama_Kabkota"})

    ada_kode = df["Kode_BPS"].notna()
    df.loc[ada_kode, "Kode_BPS"] = df.loc[ada_kode, "Kode_BPS"].str.strip().str.zfill(4)
    return df

@st.cache_data
def muat_geojson():
    with open("gadm41_IDN_2.json", "r", encoding="utf-8") as f:
        return json.load(f)

@st.cache_data
def muat_data_hierarki():
    return pd.read_csv("data_hierarki.csv")

def cari_properti_kode_geojson(geojson, kandidat):
    if not geojson.get("features"):
        raise ValueError("GeoJSON tidak memiliki fitur.")
    properti = list(geojson["features"][0]["properties"].keys())
    peta = {_normalisasi(p): p for p in properti}
    for k in kandidat:
        if _normalisasi(k) in peta: return peta[_normalisasi(k)]
    for k in kandidat:
        for norm, asli in peta.items():
            if _normalisasi(k) in norm or norm in _normalisasi(k): return asli
    raise KeyError("Tidak ditemukan properti kode wilayah pada GeoJSON.")

def _luas_centroid_ring(ring):
    a_sum = cx_sum = cy_sum = 0.0
    n = len(ring)
    for i in range(n - 1):
        x0, y0 = ring[i][0], ring[i][1]
        x1, y1 = ring[i + 1][0], ring[i + 1][1]
        cross = x0 * y1 - x1 * y0
        a_sum += cross
        cx_sum += (x0 + x1) * cross
        cy_sum += (y0 + y1) * cross
    a_sum *= 0.5
    if abs(a_sum) < 1e-12:
        xs, ys = [p[0] for p in ring], [p[1] for p in ring]
        return 0.0, sum(xs)/len(xs), sum(ys)/len(ys)
    return abs(a_sum), cx_sum/(6*a_sum), cy_sum/(6*a_sum)

def _centroid_geometri(geometry):
    tipe = geometry.get("type")
    if tipe == "Polygon": bagian = [geometry["coordinates"]]
    elif tipe == "MultiPolygon": bagian = geometry["coordinates"]
    else: return None

    total_a = sx = sy = 0.0
    for poly in bagian:
        if not poly: continue
        a, cx, cy = _luas_centroid_ring(poly[0])
        total_a += a
        sx += cx * a
        sy += cy * a
    if total_a == 0: return None
    return sx/total_a, sy/total_a

@st.cache_data
def hitung_centroid_wilayah(_geojson, properti_kode):
    hasil = {}
    for feat in _geojson["features"]:
        kode = feat["properties"].get(properti_kode)
        if not kode or kode == "NA": continue
        c = _centroid_geometri(feat["geometry"])
        if c is not None and kode not in hasil:
            hasil[kode] = c
    return hasil

# Pemuatan Berkas
try:
    df_multivariat = muat_data_multivariat()
    df_spasial = muat_data_spasial()
    geojson_kabkota = muat_geojson()
    df_hierarki = muat_data_hierarki()
except FileNotFoundError as e:
    st.error(f"Berkas data tidak ditemukan: {e.filename}. Pastikan dataset tersedia.")
    st.stop()
except KeyError as e:
    st.error(f"Struktur kolom tidak sesuai: {e}")
    st.stop()


# ===========================================================================
# UI: SIDEBAR — Navigasi Naratif
# ===========================================================================
with st.sidebar:
    st.markdown("### \U0001F4CA Navigasi Cerita")
    st.markdown(
        "<p style='font-size: 0.85rem; color: #8B949E; line-height: 1.6;'>"
        "Anda akan melalui tiga babak cerita ketimpangan pembangunan, "
        "dari skala makro antarprovinsi hingga struktur ekonomi nasional."
        "</p>",
        unsafe_allow_html=True,
    )
    st.markdown("<br>", unsafe_allow_html=True)

    daftar_provinsi = sorted(df_multivariat["Provinsi"].unique())
    provinsi_terpilih = st.multiselect(
        "Sorot Provinsi",
        options=daftar_provinsi,
        default=[],
        help="Provinsi yang dipilih akan ditonjolkan pada seluruh visualisasi dan teks narasi akan menyesuaikan.",
    )

    st.markdown("<br><hr>", unsafe_allow_html=True)
    st.markdown(
        f"<p style='text-align: center; font-size: 0.78rem; color: #484F58; line-height: 1.5;'>"
        f"{SUMBER}<br>Visualisasi Data & Informasi — UAS"
        f"</p>",
        unsafe_allow_html=True,
    )


# ===========================================================================
# LOGIKA TEKS DINAMIS berbasis pilihan sidebar
# ===========================================================================
def teks_sapaan_dinamis():
    """Menghasilkan teks sapaan yang menyesuaikan pilihan provinsi di sidebar."""
    if not provinsi_terpilih:
        return ""
    if len(provinsi_terpilih) == 1:
        return (
            f"Saat ini Anda menyorot <b>{provinsi_terpilih[0]}</b> — "
            f"setiap grafik di bawah akan menonjolkan provinsi ini di tengah lanskap nasional."
        )
    nama = ", ".join(provinsi_terpilih)
    return (
        f"Anda menyorot <b>{len(provinsi_terpilih)} provinsi</b>: {nama}. "
        f"Amati bagaimana kumpulan wilayah ini mengelompok dalam ruang indikator multidimensi."
    )


# ===========================================================================
# UI: HERO / PEMBUKA NARATIF
# ===========================================================================
st.markdown("""
<div class="hero-wrap">
    <div class="hero-eyebrow">Data Storytelling BPS &mdash; 2024</div>
    <h1>Ketimpangan Pembangunan Indonesia</h1>
    <div class="hero-divider"></div>
    <div class='subtitle-main'>
        Dari Sabang sampai Merauke, angka-angka pembangunan tidak pernah terdistribusi merata.<br>
        Setiap provinsi, setiap kabupaten, setiap sektor ekonomi menyimpan kisahnya sendiri &mdash;<br>
        kisah tentang siapa yang maju, siapa yang tertinggal, dan mengapa kesenjangan itu terus bertumbuh.
    </div>
</div>
""", unsafe_allow_html=True)

# Metrik utama di puncak halaman
ipm_nasional = df_multivariat["IPM"].mean()
if "Jumlah_Penduduk" in df_multivariat.columns:
    penduduk_total = df_multivariat["Jumlah_Penduduk"].sum()
    label_penduduk = "Total Penduduk"
    nilai_penduduk = f"{penduduk_total:.0f} jt"
else:
    penduduk_total = df_multivariat["Kepadatan_Penduduk"].mean()
    label_penduduk = "Kepadatan Penduduk"
    nilai_penduduk = f"{penduduk_total:.0f} jiwa/km²"

gini_nasional = df_multivariat["Rasio_Gini"].mean() if "Rasio_Gini" in df_multivariat.columns else df_multivariat["Gini_Ratio"].mean()
miskin_nasional = df_multivariat["Persentase_Penduduk_Miskin"].mean()
ipm_min = df_multivariat["IPM"].min()
ipm_max = df_multivariat["IPM"].max()
rentang_ipm = ipm_max - ipm_min

st.markdown("<div class='metric-strip'>", unsafe_allow_html=True)
mcol1, mcol2, mcol3, mcol4, mcol5 = st.columns(5)
with mcol1:
    st.metric(label=label_penduduk, value=nilai_penduduk)
with mcol2:
    st.metric(label="IPM Rata-rata", value=f"{ipm_nasional:.1f}")
with mcol3:
    st.metric(label="Rasio Gini Nasional", value=f"{gini_nasional:.2f}")
with mcol4:
    st.metric(label="Penduduk Miskin", value=f"{miskin_nasional:.1f}%")
with mcol5:
    st.metric(label="Rentang IPM (Max−Min)", value=f"{rentang_ipm:.1f}")
st.markdown("</div>", unsafe_allow_html=True)

# Teks sapaan dinamis
sapaan = teks_sapaan_dinamis()
if sapaan:
    st.markdown(f"<div class='dynamic-greeting'>{sapaan}</div>", unsafe_allow_html=True)

st.markdown(
    """
    <div class='insight-panel'>
        <strong>Kenapa ini penting?</strong><br>
        Kesenjangan pembangunan bukan sekadar angka yang berbeda; ia adalah cerita tentang akses pendidikan,
        kesehatan, infrastruktur, dan peluang ekonomi yang tidak sama. Di balik rata-rata nasional, ada provinsi
        yang bergerak cepat dan ada wilayah yang masih berjuang menutup celah yang lama.
    </div>
    """,
    unsafe_allow_html=True,
)

# Catatan teknis awal
with st.expander("Catatan Teknis: Tentang Data & Metodologi BPS"):
    st.markdown(
        """
        Data dalam dashboard ini menggunakan indikator pembangunan tingkat provinsi yang bersumber dari
        Badan Pusat Statistik (BPS), mencakup Indeks Pembangunan Manusia (IPM), PDRB per kapita,
        tingkat pengangguran terbuka, persentase penduduk miskin, rasio Gini, harapan lama sekolah,
        rata-rata lama sekolah, akses air bersih, sanitasi layak, dan rasio elektrifikasi.

        Untuk pemetaan geospasial, digunakan batas wilayah administratif dari GADM v4.1 (kabupaten/kota).
        Struktur hierarki ekonomi mengikuti klasifikasi 9 sektor PDB nasional BPS dengan tiga jenjang:
        sektor, subsektor, dan sub-subsektor.
        """
    )


# ===========================================================================
# BAB 1: MULTIVARIAT TINGKAT PROVINSI
# ===========================================================================
st.markdown("""
<div class='story-card'>
    <div class='chapter-label'>Babak I &mdash; Skala Makro</div>
    <h2>Pola Multivariat Antarprovinsi</h2>
    <div class='narration'>
        Bayangkan 34 provinsi Indonesia sebagai titik-titik dalam ruang berdimensi banyak &mdash;
        setiap dimensi adalah satu indikator pembangunan: IPM, kemiskinan, pendidikan, listrik, air bersih.
        Dari atas, semuanya tampak menyatu. Tapi ketika kita mereduksi dimensi-dimensi itu ke dalam
        dua sumbu utama, pola ketimpangan yang tersembunyi mulai terungkap.
    </div>
    <div class='narration-context'>
        <b>Mengapa data ini penting untuk dilihat?</b><br>
        Analisis multivariat memungkinkan kita melihat hubungan simultan antar indikator yang tidak
        terlihat jika diperiksa satu per satu. PCA (Principal Component Analysis) mengompresi banyak
        variabel menjadi sedikit sumbu yang masih menyimpan sebagian besar informasi &mdash; sehingga
        kita dapat memetakan posisi relatif setiap provinsi dalam lanskap pembangunan nasional.
    </div>
</div>
""", unsafe_allow_html=True)

with st.container():
    var_numerik_provinsi = kolom_numerik(df_multivariat)
    if len(var_numerik_provinsi) < 2:
        st.warning("Data memerlukan minimal 2 kolom numerik untuk analisis PCA.")
    else:
        col1, col2 = st.columns([1, 2])
        with col1:
            variabel_dipilih = st.multiselect(
                "Indikator yang dianalisis:",
                options=var_numerik_provinsi,
                default=var_numerik_provinsi,
            )

        if len(variabel_dipilih) < 2:
            st.info("Pilih minimal 2 variabel untuk melihat visualisasi.")
        else:
            # Data preparation
            data_pca_input = df_multivariat[["Provinsi"] + variabel_dipilih].dropna()
            skala = StandardScaler()
            matriks_standar = skala.fit_transform(data_pca_input[variabel_dipilih])

            pca = PCA(n_components=2, random_state=42)
            komponen = pca.fit_transform(matriks_standar)
            var_pc1, var_pc2 = pca.explained_variance_ratio_[:2] * 100

            df_pca = pd.DataFrame({
                "Provinsi": data_pca_input["Provinsi"].values,
                "PC1": komponen[:, 0],
                "PC2": komponen[:, 1],
            })

            # Styling states
            df_pca["Status"] = np.where(df_pca["Provinsi"].isin(provinsi_terpilih), "Provinsi Tersorot", "Lainnya")
            df_pca["Ukuran"] = np.where(df_pca["Status"] == "Provinsi Tersorot", 18, 10)
            df_pca["Opacity"] = np.where((len(provinsi_terpilih) > 0) & (df_pca["Status"] == "Lainnya"), 0.3, 0.8)

            peta_warna_status = {
                "Provinsi Tersorot": COLOR_HIGHLIGHT,
                "Lainnya": COLOR_MUTED,
            }

            tab_pca, tab_paralel, tab_matriks = st.tabs(["PCA Scatter", "Parallel Coordinates", "Scatterplot Matrix"])

            with tab_pca:
                fig_pca = px.scatter(
                    df_pca, x="PC1", y="PC2", color="Status", size="Ukuran", size_max=18,
                    hover_name="Provinsi", color_discrete_map=peta_warna_status,
                    labels={"PC1": f"Komponen Utama 1 ({var_pc1:.1f}%)", "PC2": f"Komponen Utama 2 ({var_pc2:.1f}%)"}
                )

                for i, trace in enumerate(fig_pca.data):
                    mask = df_pca["Status"] == trace.name
                    trace.marker.opacity = df_pca[mask]["Opacity"].values

                fig_pca.update_traces(marker=dict(line=dict(width=1, color="#0E1117")))
                fig_pca.update_layout(legend_title_text=None, title=None)
                tambah_anotasi_sumber(fig_pca)

                st.plotly_chart(fig_pca, width="stretch")
                st.markdown(
                    f"<div class='chart-caption'>Visualisasi reduksi dimensi PCA. "
                    f"Sumbu merupakan kombinasi linear terstandardisasi dari indikator terpilih.</div>",
                    unsafe_allow_html=True,
                )

            with tab_paralel:
                data_paralel = data_pca_input.copy()
                data_paralel["Sorot"] = np.where(data_paralel["Provinsi"].isin(provinsi_terpilih), 1, 0)

                colorscale_paralel = [[0, COLOR_MUTED], [1, COLOR_HIGHLIGHT]]

                fig_paralel = px.parallel_coordinates(
                    data_paralel, dimensions=variabel_dipilih, color="Sorot",
                    color_continuous_scale=colorscale_paralel, range_color=[0, 1]
                )
                fig_paralel.update_layout(coloraxis_showscale=False, title=None)
                tambah_anotasi_sumber(fig_paralel)

                st.plotly_chart(fig_paralel, width="stretch")
                st.markdown(
                    "<div class='chart-caption'>Garis biru merepresentasikan provinsi yang disorot; "
                    "garis abu-abu adalah provinsi lainnya.</div>",
                    unsafe_allow_html=True,
                )

            with tab_matriks:
                data_matriks = data_pca_input.copy()
                data_matriks["Status"] = df_pca["Status"].values

                variabel_matriks = variabel_dipilih
                if len(variabel_matriks) > 6:
                    variansi = data_pca_input[variabel_dipilih].var().sort_values(ascending=False)
                    variabel_matriks = variansi.index[:6].tolist()
                    st.info("Menampilkan 6 indikator dengan variansi tertinggi agar visualisasi matriks tetap optimal dan rapi.")

                fig_matriks = px.scatter_matrix(
                    data_matriks, dimensions=variabel_matriks, color="Status",
                    color_discrete_map=peta_warna_status, hover_name="Provinsi"
                )
                fig_matriks.update_traces(diagonal_visible=False, showupperhalf=False, marker=dict(size=6, line=dict(width=0)))
                fig_matriks.update_layout(legend_title_text=None, title=None)

                for i, trace in enumerate(fig_matriks.data):
                    mask = data_matriks["Status"] == trace.name
                    trace.marker.opacity = np.where((len(provinsi_terpilih) > 0) & (mask), 1.0, 0.4 if len(provinsi_terpilih)>0 else 0.8)

                tambah_anotasi_sumber(fig_matriks)
                st.plotly_chart(fig_matriks, width="stretch", height=700)
                st.markdown(
                    "<div class='chart-caption'>Setiap sel menunjukkan distribusi bivariate antar indikator. "
                    "Gunakan seleksi (brushing) untuk observasi.</div>",
                    unsafe_allow_html=True,
                )

# Tafsir kosong untuk diisi pengguna
st.markdown(
    "<div class='interpretation-prompt'>"
    "<b>Apa cerita di balik pola ini?</b><br>"
    "<i>(Tempat untuk menuliskan insight: provinsi mana yang terkelompok di kutub tertentu? "
    "Apakah kesenjangan geografis Timur–Barat terlihat di sini? "
    "Apa indikator yang paling memisahkan provinsi tersorot dari yang lain?)</i>"
    "</div>",
    unsafe_allow_html=True,
)

# Expander catatan teknis PCA
with st.expander("Catatan Teknis: Cara Kerja PCA"):
    st.markdown(
        """
        **Principal Component Analysis (PCA)** adalah teknik reduksi dimensi yang mentransformasi
        data berdimensi tinggi ke dalam ruang berdimensi lebih rendah dengan mempertahankan
        variansi maksimum.

        **Langkah-langkah:**
        1. **Standardisasi** — setiap variabel dinormalisasi (mean=0, std=1) agar skala tidak bias.
        2. **Matriks kovarians** — dihitung untuk menangkap hubungan antar variabel.
        3. **Eigen dekomposisi** — eigenvector menjadi komponen utama (arah variansi terbesar).
        4. **Proyeksi** — data diproyeksikan ke komponen utama 1 dan 2.

        Persentase variansi yang dijelaskan oleh PC1 dan PC2 menunjukkan seberapa baik
        dua sumbu ini mewakili keseluruhan data multidimensi.
        """
    )


# ===========================================================================
# TRANSISI NARATIF I → II
# ===========================================================================
st.markdown(
    "<div class='transition-quote'>"
    "&ldquo;Angka-angka provinsi adalah rata-rata yang menyembunyikan kisah yang lebih dalam &mdash; "
    "di baliknya, ratusan kabupaten dan kota menyimpan jurang ketimpangan yang tak terlihat dari atas.&rdquo;"
    "</div>",
    unsafe_allow_html=True,
)


# ===========================================================================
# BAB 2: GEOSPASIAL TINGKAT KAB/KOTA
# ===========================================================================
# Judul dinamis berdasarkan pilihan provinsi
if provinsi_terpilih:
    judul_bab2 = f"Kesenjangan Spasial Antarkabupaten/Kota &mdash; Sorotan: {', '.join(provinsi_terpilih)}"
else:
    judul_bab2 = "Kesenjangan Spasial Antarkabupaten/Kota"

st.markdown(f"""
<div class='story-card'>
    <div class='chapter-label'>Babak II &mdash; Skala Meso</div>
    <h2>{judul_bab2}</h2>
    <div class='narration'>
        Dari ketinggian provinsi, kita turun ke permukaan bumi. Di sini, setiap kabupaten dan kota
        memiliki warna sendiri dalam peta ketimpangan. Sebuah kota besar bisa bersinar terang dengan
        IPM tinggi, sementara kabupaten tetangganya yang berbatasan langsung tertinggal jauh.
        Geografi bukan sekadar latar &mdash; geografi adalah nasib.
    </div>
    <div class='narration-context'>
        <b>Mengapa data ini penting untuk dilihat?</b><br>
        Peta choropleth mengungkap konsentrasi geografis pembangunan: di mana indikator tertentu
        menggerombol, di mana terjadi lompatan dramatis antar wilayah bertetangga, dan di mana
        keterbelakangan justru memusat pada area yang dekat secara administratif tetapi jauh secara akses.
    </div>
</div>
""", unsafe_allow_html=True)

with st.container():
    var_rasio_spasial = kolom_numerik(df_spasial)
    var_rasio_diutamakan = [
        c for c in var_rasio_spasial
        if any(kw in _normalisasi(c) for kw in ["rasio", "ratio", "persen", "persentase", "kepadatan", "indeks"])
        and "jumlah" not in _normalisasi(c)
    ]
    opsi_metrik = var_rasio_diutamakan or var_rasio_spasial

    if not opsi_metrik:
        st.warning("Data memerlukan minimal 1 kolom numerik untuk dipetakan.")
    else:
        col1, col2 = st.columns([1, 2])
        with col1:
            metrik_terpilih = st.selectbox(
                "Pilih Indikator Peta:",
                options=opsi_metrik,
                help="Daftar ini difilter untuk mengutamakan indikator rasio/persentase.",
            )

        properti_kode_geojson = cari_properti_kode_geojson(geojson_kabkota, ["CC_2", "Kode_BPS", "kode_bps", "KODE_BPS", "kode_wilayah"])
        kol_nama_hover = "Nama_Kabkota" if "Nama_Kabkota" in df_spasial.columns else "Kabupaten_Kota"

        df_peta = df_spasial[df_spasial["Kode_BPS"].notna()].copy()
        n_dikecualikan = len(df_spasial) - len(df_peta)

        kwargs_dasar = dict(
            data_frame=df_peta, geojson=geojson_kabkota, locations="Kode_BPS",
            featureidkey=f"properties.{properti_kode_geojson}", center={"lat": -2.0, "lon": 117},
            zoom=3.9, hover_name=kol_nama_hover, hover_data={metrik_terpilih: True, "Kode_BPS": False},
            labels={metrik_terpilih: metrik_terpilih.replace("_", " ")},
        )

        kwargs_peta = dict(
            **kwargs_dasar, color=metrik_terpilih, color_continuous_scale=PALET_KONTINU, opacity=0.85
        )

        if gunakan_peta_mapbox():
            fig_peta = px.choropleth_mapbox(**kwargs_peta, mapbox_style="carto-positron")
        elif gunakan_peta_map():
            fig_peta = px.choropleth_map(**kwargs_peta, map_style="carto-positron")
        else:
            fig_peta = px.choropleth(**kwargs_peta)

        fig_peta.update_layout(margin=dict(l=0, r=0, t=10, b=0), height=550)
        fig_peta.update_layout(coloraxis_colorbar=dict(title=None, thickness=15, len=0.7))
        tambah_anotasi_sumber(fig_peta)

        st.plotly_chart(fig_peta, width="stretch")
        st.markdown(
            f"<div class='chart-caption'>Terdapat {n_dikecualikan} kabupaten/kota wilayah administratif baru "
            f"yang tidak dirender akibat ketiadaan poligon batas digital pada GADM v4.1.</div>",
            unsafe_allow_html=True,
        )

# Tafsir kosong
st.markdown(
    "<div class='interpretation-prompt'>"
    "<b>Apa cerita di balik pola ini?</b><br>"
    "<i>(Tempat untuk menuliskan insight: Di wilayah mana indikator terpilih menggerombol tinggi/rendah? "
    "Apakah ada kabupaten yang menonjol sebagai outlier positif atau negatif? "
    "Bagaimana pola spasial ini berkorelasi dengan kondisi geografis?)</i>"
    "</div>",
    unsafe_allow_html=True,
)

# Expander catatan teknis GADM
with st.expander("Catatan Teknis: Sumber Batas Wilayah GADM v4.1"):
    st.markdown(
        """
        Batas wilayah administratif yang digunakan bersumber dari **GADM v4.1** (Database of Global
        Administrative Areas). GADM menyediakan poligon batas untuk seluruh kabupaten/kota di Indonesia.

        Beberapa wilayah administratif baru hasil pemekaran mungkin belum memiliki poligon batas
        digital pada versi ini, sehingga tidak dirender pada peta. Jumlah wilayah yang tidak
        dirender ditampilkan pada caption di bawah setiap peta.

        Untuk peta simbol proporsional, titik koordinat dihitung dari **centroid geometri**
        (pusat massa poligon), bukan ibu kota kabupaten, sehingga posisi simbol merepresentasikan
        pusat wilayah administratif.
        """
    )


# ===========================================================================
# TRANSISI NARATIF II → III
# ===========================================================================
st.markdown(
    "<div class='transition-quote'>"
    "&ldquo;Jika geografi adalah panggung ketimpangan, maka ekonomi adalah naskahnya &mdash; "
    "setiap sektor, setiap subsektor, memegang porsi yang tidak adil dari cerita kekayaan bangsa.&rdquo;"
    "</div>",
    unsafe_allow_html=True,
)


# ===========================================================================
# BAB 3: STRUKTUR HIERARKI EKONOMI
# ===========================================================================
st.markdown("""
<div class='story-card'>
    <div class='chapter-label'>Babak III &mdash; Struktur Ekonomi</div>
    <h2>Struktur Hierarki Ekonomi Nasional</h2>
    <div class='narration'>
        Cerita ketimpangan tidak berakhir di wilayah. Ia berakar juga pada struktur ekonomi yang
        membentuk nilai tambah bangsa. Sembilan sektor, puluhan subsektor, ratusan sub-subsektor &mdash;
        masing-masing memegang porsi berbeda dari kue nasional. Treemap dan sunburst memungkinkan kita
        melihat siapa yang memegang lapisan terbesar, dan siapa yang hanya mendapat remah.
    </div>
    <div class='narration-context'>
        <b>Mengapa data ini penting untuk dilihat?</b><br>
        Struktur hierarki PDB menunjukkan komposisi ekonomi nasional dalam tiga jenjang: sektor,
        subsektor, dan sub-subsektor. Ukuran setiap blok merepresentasikan nilai ekonomi (dalam
        triliun rupiah), sementara warna mengindikasikan kontribusi terhadap total PDB. Klik pada
        setiap komponen untuk melakukan drill-down dan mengamati dekomposisi internal.
    </div>
</div>
""", unsafe_allow_html=True)

with st.container():
    kol_kategorikal_hierarki = df_hierarki.select_dtypes(exclude=np.number).columns.tolist()
    kol_numerik_hierarki = kolom_numerik(df_hierarki)

    if len(kol_kategorikal_hierarki) < 2 or not kol_numerik_hierarki:
        st.warning("Data hierarki memerlukan minimal 2 kolom jenjang dan 1 kolom numerik.")
    else:
        jenjang = kol_kategorikal_hierarki[:3]
        kol_ukuran = pilih_kolom_prioritas(kol_numerik_hierarki, ["nilai", "rupiah", "total"], default_index=0)
        sisa_numerik = [c for c in kol_numerik_hierarki if c != kol_ukuran] or kol_numerik_hierarki
        kol_warna = pilih_kolom_prioritas(sisa_numerik, ["kontribusi", "persen", "andil", "share"], default_index=0)

        col_opt1, col_opt2, col_opt3 = st.columns([1.5, 1, 1])
        with col_opt1:
            jenis_chart = st.radio("Metode Partisi Spasial:", ["Treemap", "Sunburst"], horizontal=True)
        with col_opt2:
            st.metric(label="Variabel Ukuran", value=kol_ukuran.replace("_", " "))
        with col_opt3:
            st.metric(label="Variabel Warna", value=kol_warna.replace("_", " "))

        data_hierarki_bersih = df_hierarki.dropna(subset=[kol_ukuran]).copy()
        data_hierarki_bersih = data_hierarki_bersih[data_hierarki_bersih[kol_ukuran] > 0].copy()

        def _filter_leaf(df_in, kolom_jenjang):
            df_tmp = df_in.copy()
            for kol in kolom_jenjang: df_tmp[kol] = df_tmp[kol].fillna("")
            df_tmp["_depth"] = df_tmp[kolom_jenjang].apply(lambda row: sum(1 for v in row if v != ""), axis=1)

            non_leaf_idx = set()
            for idx, row in df_tmp.iterrows():
                depth = row["_depth"]
                if depth < len(kolom_jenjang):
                    mask = pd.Series(True, index=df_tmp.index)
                    for i in range(depth): mask &= df_tmp[kolom_jenjang[i]] == row[kolom_jenjang[i]]
                    mask &= df_tmp["_depth"] > depth
                    if mask.any(): non_leaf_idx.add(idx)

            return df_tmp.drop(index=non_leaf_idx).drop(columns=["_depth"])

        data_hierarki_bersih = _filter_leaf(data_hierarki_bersih, jenjang)

        kwargs_hierarki = dict(
            data_frame=data_hierarki_bersih,
            path=jenjang,
            values=kol_ukuran,
            color=kol_warna,
            color_continuous_scale=PALET_DIVERGEN,
            hover_data={kol_ukuran: ":,.2f", kol_warna: ":,.2f"},
        )

        if jenis_chart == "Treemap":
            fig_hierarki = px.treemap(**kwargs_hierarki)
            fig_hierarki.update_traces(marker=dict(line=dict(width=1, color="#0E1117")), textinfo="label+percent entry")
        else:
            fig_hierarki = px.sunburst(**kwargs_hierarki)
            fig_hierarki.update_traces(marker=dict(line=dict(width=1, color="#0E1117")), textinfo="label+percent entry")

        fig_hierarki.update_layout(margin=dict(l=0, r=0, t=20, b=0), height=650)
        fig_hierarki.update_layout(coloraxis_colorbar=dict(title=kol_warna.replace("_", " "), thickness=15, len=0.7))
        tambah_anotasi_sumber(fig_hierarki)

        st.plotly_chart(fig_hierarki, width="stretch")
        st.markdown(
            "<div class='chart-caption'>Klik pada komponen (node) untuk drill-down dan melihat dekomposisi spesifik secara interaktif.</div>",
            unsafe_allow_html=True,
        )

# Tafsir kosong
st.markdown(
    "<div class='interpretation-prompt'>"
    "<b>Apa cerita di balik pola ini?</b><br>"
    "<i>(Tempat untuk menuliskan insight: Sektor mana yang dominan dan apa implikasinya? "
    "Apakah struktur ekonomi ini terlalu bertumpu pada satu sektor? "
    "Subsektor apa yang kontribusinya mengejutkan kecil atau besar?)</i>"
    "</div>",
    unsafe_allow_html=True,
)

# Expander catatan teknis BPS
with st.expander("Catatan Teknis: Klasifikasi Sektor PDB BPS"):
    st.markdown(
        """
        Data hierarki PDB mengikuti klasifikasi 9 sektor utama BPS:

        1. Pertanian, Kehutanan & Perikanan
        2. Pertambangan & Penggalian
        3. Industri Pengolahan
        4. Pengadaan Listrik & Gas
        5. Konstruksi
        6. Perdagangan Besar & Eceran
        7. Transportasi & Pergudangan
        8. Jasa Penyediaan Akomodasi
        9. Jasa Informasi & Komunikasi, Keuangan, Perusahaan, Pemerintahan, Pendidikan, Kesehatan, Lainnya

        Setiap sektor dipecah menjadi subsektor dan sub-subsektor. Visualisasi Treemap menampilkan
        proporsi area berdasarkan nilai (triliun rupiah), sementara warna menunjukkan kontribusi
        persentase terhadap total PDB nasional. Sunburst memberikan representasi radial yang
        menekankan hubungan jenjang dari pusat ke tepi.
        """
    )


# ===========================================================================
# EPILOG
# ===========================================================================
st.markdown(
    "<div class='transition-quote'>"
    "&ldquo;Data tidak berbohong, tetapi juga tidak berbicara sendiri. "
    "Dalam ketimpangan yang terukur, terdapat manusia yang tidak terhitung.&rdquo;"
    "</div>",
    unsafe_allow_html=True,
)

st.markdown(
    "<div class='footer-note'>"
    "Dashboard Data Storytelling BPS &mdash; dirancang untuk eksplorasi analitik UAS Visualisasi Data & Informasi.<br>"
    "Setiap angka membawa cerita. Setiap cerita membawa pertanyaan. Setiap pertanyaan membawa kita lebih dekat ke keadilan."
    "</div>",
    unsafe_allow_html=True,
)
