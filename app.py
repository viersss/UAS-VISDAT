"""
Dashboard Data Storytelling BPS: Provinsi -> Kabupaten/Kota -> Struktur Hierarki.

Alur cerita dashboard ini mengikuti tiga topik visualisasi sesuai ketentuan UAS:
1. Multivariat tingkat provinsi   -> PCA Scatter, Parallel Coordinates, Scatterplot Matrix
2. Geospasial tingkat kab/kota    -> Choropleth Map, Peta Simbol Proporsional
3. Struktur hierarki PDB nasional -> Treemap / Sunburst (ukuran = nilai, warna = kontribusi %)

Berkas data yang dibutuhkan pada direktori yang sama dengan app.py ini:
- data_multivariat.csv  : kolom nama provinsi + minimal 8 kolom numerik
- data_spasial.csv      : Kabupaten_Kota, Kode_BPS (kode wilayah BPS 4 digit), indikator rasio
- gadm41_IDN_2.json     : GeoJSON batas kab/kota (GADM v4.1; properti CC_2 = kode wilayah BPS)
- data_hierarki.csv     : 3 kolom jenjang (Sektor_Utama, Sub_Sektor, Rincian) + 2 kolom numerik
                          (Nilai_PDB_Miliar_Rupiah, Kontribusi_PDB_Persen)

Catatan pemrosesan data (dijelaskan pula pada bagian Metodologi makalah):
- data_spasial.csv sudah dilengkapi kolom Kode_BPS melalui pencocokan nama wilayah
  terhadap properti NAME_2/TYPE_2/CC_2 pada GeoJSON GADM v4.1 (497 dari 514 kab/kota
  berhasil dipetakan). 17 kab/kota hasil pemekaran administratif yang belum tercakup
  pada GeoJSON GADM v4.1 (mis. Mahakam Ulu, Pangandaran, Malaka, dsb.) tidak memiliki
  batas digital sehingga dikecualikan dari peta -- ini adalah keterbatasan data,
  bukan galat aplikasi, dan dilaporkan pada bagian Hasil dan Pembahasan/Keterbatasan.
- gadm41_IDN_2.json ditambal pada 5 fitur (5 kab/kota Provinsi Kalimantan Utara:
  Malinau, Bulungan, Tana Tidung, Nunukan, Kota Tarakan) yang properti CC_2-nya
  kosong ("NA") pada berkas asli GADM meski geometrinya tersedia; nilai kode diisi
  dari nomor katalog publikasi "<Wilayah> Dalam Angka" BPS (format 1102001.<kode>).
  Lihat CATATAN_PERBAIKAN_DATA.md untuk detail lengkap metodologi pencocokan data.
- data_hierarki.csv dilengkapi kolom Kontribusi_PDB_Persen = Nilai_PDB / total PDB
  nasional x 100, dihitung dari kolom Nilai_PDB_Miliar_Rupiah itu sendiri (bukan data
  baru), sehingga size (nilai absolut) dan warna (persentase kontribusi) mengkodekan
  dua variabel yang berbeda sesuai ketentuan minimal topik hierarki.
"""

import json
import re

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

st.set_page_config(page_title="Dashboard Data Storytelling BPS", layout="wide")

SUMBER = "Sumber: BPS"
PALET_KONTINU = "Viridis"
PALET_DIVERGEN = "RdBu"
PALET_DISKRET = px.colors.qualitative.Dark2


# ---------------------------------------------------------------------------
# Utilitas pencocokan nama kolom secara fleksibel
# ---------------------------------------------------------------------------

def _normalisasi(teks):
    return re.sub(r"[\s_\-]+", "", str(teks)).lower()


def cari_kolom(df, kandidat, wajib=True):
    """Mencari nama kolom pada df yang paling cocok dengan salah satu nama
    kandidat, tidak peka huruf besar/kecil, spasi, garis bawah, atau strip.
    Dipakai agar dashboard tetap berjalan meski nama kolom pada berkas BPS
    sedikit berbeda dari yang diharapkan."""
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
        raise KeyError(
            f"Tidak ditemukan kolom yang cocok untuk {kandidat}. "
            f"Kolom tersedia: {list(df.columns)}"
        )
    return None


def kolom_numerik(df, kecuali=()):
    """Daftar kolom numerik pada df, di luar kolom yang dikecualikan."""
    num = df.select_dtypes(include=np.number).columns.tolist()
    return [c for c in num if c not in kecuali]


def pilih_kolom_prioritas(kolom_list, kata_kunci, default_index=0):
    """Memilih kolom numerik pertama yang namanya memuat salah satu kata kunci
    (mis. 'nilai'/'rupiah' untuk ukuran, 'kontribusi'/'persen' untuk warna).
    Jika tidak ada yang cocok, kembali ke pilihan berbasis posisi (default_index)."""
    for kol in kolom_list:
        norm = _normalisasi(kol)
        if any(kk in norm for kk in kata_kunci):
            return kol
    if 0 <= default_index < len(kolom_list):
        return kolom_list[default_index]
    return kolom_list[0]


def tambah_anotasi_sumber(fig):
    fig.add_annotation(
        text=SUMBER,
        xref="paper", yref="paper",
        x=1, y=-0.12, showarrow=False,
        font=dict(size=11, color="gray"),
        xanchor="right",
    )
    return fig


def gunakan_peta_mapbox():
    """True jika versi plotly terpasang masih memiliki fungsi *_mapbox (< 6),
    False jika sudah memakai fungsi pengganti berbasis MapLibre (>= 6)."""
    return hasattr(px, "choropleth_mapbox")


# ---------------------------------------------------------------------------
# Pemuatan data
# ---------------------------------------------------------------------------

@st.cache_data
def muat_data_multivariat():
    df = pd.read_csv("data_multivariat.csv")
    kol_provinsi = cari_kolom(df, ["Provinsi", "Nama Provinsi", "Province"])
    df = df.rename(columns={kol_provinsi: "Provinsi"})
    df["Provinsi"] = df["Provinsi"].astype(str).str.strip()
    return df


@st.cache_data
def muat_data_spasial():
    df = pd.read_csv("data_spasial.csv", dtype={"Kode_BPS": "string"})
    kol_kode = cari_kolom(
        df, ["Kode_BPS", "Kode Wilayah", "Kode_Wilayah", "Kode_Kabkota", "kode_bps", "id_kabkota"]
    )
    kol_nama = cari_kolom(
        df, ["Nama_Kabkota", "Kabupaten_Kota", "Nama Kabupaten/Kota", "Nama_Wilayah", "nmkab"], wajib=False
    )
    df = df.rename(columns={kol_kode: "Kode_BPS"})
    if kol_nama:
        df = df.rename(columns={kol_nama: "Nama_Kabkota"})

    # Normalisasi kode BPS jadi string 4 digit, tanpa memaksa baris yang
    # kodenya kosong (kab/kota pemekaran yang belum ada batas digitalnya)
    # menjadi string "nan" -- baris tsb tetap NA agar mudah difilter.
    ada_kode = df["Kode_BPS"].notna()
    df.loc[ada_kode, "Kode_BPS"] = (
        df.loc[ada_kode, "Kode_BPS"].str.strip().str.zfill(4)
    )
    return df


@st.cache_data
def muat_geojson():
    with open("gadm41_IDN_2.json", "r", encoding="utf-8") as f:
        return json.load(f)


@st.cache_data
def muat_data_hierarki():
    df = pd.read_csv("data_hierarki.csv")
    return df


def cari_properti_kode_geojson(geojson, kandidat):
    """Menentukan nama properti pada GeoJSON yang berisi kode wilayah BPS,
    dengan mencocokkan nama properti feature pertama terhadap daftar
    kandidat secara fleksibel. Kandidat diprioritaskan sesuai urutan list,
    sehingga properti seperti CC_2 (kode BPS 4 digit) dicoba sebelum ID
    internal skema lain (mis. GID_2) yang formatnya tidak kompatibel."""
    if not geojson.get("features"):
        raise ValueError("GeoJSON tidak memiliki fitur.")
    properti = list(geojson["features"][0]["properties"].keys())
    peta = {_normalisasi(p): p for p in properti}
    for k in kandidat:
        key = _normalisasi(k)
        if key in peta:
            return peta[key]
    for k in kandidat:
        key = _normalisasi(k)
        for norm, asli in peta.items():
            if key in norm or norm in key:
                return asli
    raise KeyError(
        f"Tidak ditemukan properti kode wilayah pada GeoJSON. "
        f"Properti tersedia: {properti}"
    )


# ---------------------------------------------------------------------------
# Perhitungan centroid geometri (untuk peta simbol proporsional), murni
# Python/numpy tanpa bergantung pada pustaka geospasial tambahan (shapely dsb).
# ---------------------------------------------------------------------------

def _luas_centroid_ring(ring):
    """Rumus shoelace: (luas_signed, cx, cy) untuk satu ring poligon [x, y]."""
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
        xs = [p[0] for p in ring]
        ys = [p[1] for p in ring]
        return 0.0, sum(xs) / len(xs), sum(ys) / len(ys)
    return abs(a_sum), cx_sum / (6 * a_sum), cy_sum / (6 * a_sum)


def _centroid_geometri(geometry):
    """Centroid area-weighted untuk geometry Polygon/MultiPolygon GeoJSON.
    Mengembalikan (lon, lat) atau None bila geometri tidak valid."""
    tipe = geometry.get("type")
    if tipe == "Polygon":
        bagian = [geometry["coordinates"]]
    elif tipe == "MultiPolygon":
        bagian = geometry["coordinates"]
    else:
        return None
    total_a = sx = sy = 0.0
    for poly in bagian:
        if not poly:
            continue
        a, cx, cy = _luas_centroid_ring(poly[0])
        total_a += a
        sx += cx * a
        sy += cy * a
    if total_a == 0:
        return None
    return sx / total_a, sy / total_a


@st.cache_data
def hitung_centroid_wilayah(_geojson, properti_kode):
    """Dict {kode_wilayah: (lon, lat)} untuk seluruh fitur pada GeoJSON."""
    hasil = {}
    for feat in _geojson["features"]:
        kode = feat["properties"].get(properti_kode)
        if not kode or kode == "NA":
            continue
        c = _centroid_geometri(feat["geometry"])
        if c is not None and kode not in hasil:
            hasil[kode] = c
    return hasil


# ---------------------------------------------------------------------------
# Pemuatan berkas dengan penanganan galat
# ---------------------------------------------------------------------------

try:
    df_multivariat = muat_data_multivariat()
    df_spasial = muat_data_spasial()
    geojson_kabkota = muat_geojson()
    df_hierarki = muat_data_hierarki()
except FileNotFoundError as e:
    st.error(
        f"Berkas data tidak ditemukan: {e.filename}. "
        "Pastikan data_multivariat.csv, data_spasial.csv, gadm41_IDN_2.json, "
        "dan data_hierarki.csv berada pada direktori yang sama dengan app.py."
    )
    st.stop()
except KeyError as e:
    st.error(f"Struktur kolom tidak sesuai: {e}")
    st.stop()


# ---------------------------------------------------------------------------
# Sidebar: filter global
# ---------------------------------------------------------------------------

st.sidebar.title("Filter Dashboard")
st.sidebar.caption(
    "Filter provinsi berikut berlaku sebagai penyorot global pada visualisasi "
    "multivariat tingkat provinsi (PCA, Parallel Coordinates & Scatterplot Matrix)."
)

daftar_provinsi = sorted(df_multivariat["Provinsi"].unique())
provinsi_terpilih = st.sidebar.multiselect(
    "Sorot provinsi tertentu",
    options=daftar_provinsi,
    default=[],
    help="Provinsi yang dipilih akan ditonjolkan pada scatter plot PCA, parallel "
         "coordinates, dan scatterplot matrix.",
)

st.sidebar.divider()
st.sidebar.caption(SUMBER)


# ---------------------------------------------------------------------------
# Judul & narasi pembuka
# ---------------------------------------------------------------------------

st.title("Dashboard Data Storytelling: Ketimpangan Pembangunan Indonesia")
st.markdown(
    "Dashboard ini menelusuri kondisi pembangunan Indonesia secara berjenjang: "
    "dimulai dari **pola multivariat antarprovinsi**, diperdalam ke **kesenjangan "
    "spasial antarkabupaten/kota**, lalu ditutup dengan **struktur hierarki "
    "ekonomi nasional**."
)
st.divider()


# ===========================================================================
# BAGIAN 1 — MULTIVARIAT TINGKAT PROVINSI
# ===========================================================================

st.header("1. Pola Multivariat Antarprovinsi")

var_numerik_provinsi = kolom_numerik(df_multivariat)
if len(var_numerik_provinsi) < 2:
    st.warning("data_multivariat.csv memerlukan minimal 2 kolom numerik untuk analisis PCA.")
else:
    col_kiri, col_kanan = st.columns([1, 3])
    with col_kiri:
        variabel_dipilih = st.multiselect(
            "Variabel untuk analisis",
            options=var_numerik_provinsi,
            default=var_numerik_provinsi,
            help="Variabel yang diikutsertakan dalam PCA, Parallel Coordinates, "
                 "dan Scatterplot Matrix.",
        )

    if len(variabel_dipilih) < 2:
        st.warning("Pilih minimal 2 variabel numerik.")
    else:
        data_pca_input = df_multivariat[["Provinsi"] + variabel_dipilih].dropna()
        skala = StandardScaler()
        matriks_standar = skala.fit_transform(data_pca_input[variabel_dipilih])

        pca = PCA(n_components=2, random_state=42)
        komponen = pca.fit_transform(matriks_standar)
        var_pc1, var_pc2 = pca.explained_variance_ratio_[:2] * 100

        df_pca = pd.DataFrame(
            {
                "Provinsi": data_pca_input["Provinsi"].values,
                "PC1": komponen[:, 0],
                "PC2": komponen[:, 1],
            }
        )
        df_pca["Status"] = np.where(
            df_pca["Provinsi"].isin(provinsi_terpilih), "Provinsi Tersorot", "Provinsi Lainnya"
        )
        df_pca["Ukuran"] = np.where(df_pca["Status"] == "Provinsi Tersorot", 16, 9)

        peta_warna_status = {
            "Provinsi Tersorot": PALET_DISKRET[1],
            "Provinsi Lainnya": PALET_DISKRET[0],
        }

        tab_pca, tab_paralel, tab_matriks = st.tabs(
            ["PCA Scatter Plot", "Parallel Coordinates", "Scatterplot Matrix"]
        )

        with tab_pca:
            fig_pca = px.scatter(
                df_pca,
                x="PC1",
                y="PC2",
                color="Status",
                size="Ukuran",
                size_max=16,
                hover_name="Provinsi",
                color_discrete_map=peta_warna_status,
                title=(
                    f"PCA Scatter Plot Provinsi "
                    f"(PC1 {var_pc1:.1f}% + PC2 {var_pc2:.1f}% varians dijelaskan)"
                ),
                labels={
                    "PC1": f"Komponen Utama 1 ({var_pc1:.1f}% varians)",
                    "PC2": f"Komponen Utama 2 ({var_pc2:.1f}% varians)",
                },
            )
            fig_pca.update_traces(marker=dict(line=dict(width=0.5, color="white")))
            fig_pca.update_layout(legend_title_text="Status")
            tambah_anotasi_sumber(fig_pca)
            st.plotly_chart(fig_pca, width="stretch")
            st.caption(
                "Sumbu PC1 dan PC2 merupakan kombinasi linear terstandardisasi dari "
                f"variabel: {', '.join(variabel_dipilih)}. Teknik reduksi dimensi: PCA."
            )

        with tab_paralel:
            data_paralel = data_pca_input.copy()
            data_paralel["Sorot"] = np.where(
                data_paralel["Provinsi"].isin(provinsi_terpilih), 1, 0
            )
            fig_paralel = px.parallel_coordinates(
                data_paralel,
                dimensions=variabel_dipilih,
                color="Sorot",
                color_continuous_scale=[[0, "lightgray"], [1, PALET_DISKRET[1]]],
                range_color=[0, 1],
                title="Parallel Coordinates Indikator Multivariat Provinsi",
            )
            fig_paralel.update_layout(coloraxis_showscale=False)
            tambah_anotasi_sumber(fig_paralel)
            st.plotly_chart(fig_paralel, width="stretch")
            st.caption(
                "Garis berwarna menandakan provinsi yang disorot melalui filter di sidebar; "
                "garis abu-abu adalah provinsi lainnya."
            )

        with tab_matriks:
            data_matriks = data_pca_input.copy()
            data_matriks["Status"] = df_pca["Status"].values
            # Batasi maksimal 6 variabel pada matriks agar tetap terbaca;
            # jika lebih, ambil 6 variabel dengan variansi terstandar tertinggi.
            variabel_matriks = variabel_dipilih
            if len(variabel_matriks) > 6:
                variansi = data_pca_input[variabel_dipilih].var().sort_values(ascending=False)
                variabel_matriks = variansi.index[:6].tolist()
                st.caption(
                    f"Menampilkan 6 dari {len(variabel_dipilih)} variabel terpilih "
                    "(variansi tertinggi) agar matriks tetap terbaca."
                )
            fig_matriks = px.scatter_matrix(
                data_matriks,
                dimensions=variabel_matriks,
                color="Status",
                color_discrete_map=peta_warna_status,
                hover_name="Provinsi",
                title="Scatterplot Matrix Indikator Multivariat Provinsi",
            )
            fig_matriks.update_traces(diagonal_visible=False, showupperhalf=False, marker=dict(size=5))
            fig_matriks.update_layout(legend_title_text="Status")
            tambah_anotasi_sumber(fig_matriks)
            st.plotly_chart(fig_matriks, width="stretch")
            st.caption(
                "Setiap sel menunjukkan hubungan pasangan dua variabel; brushing dapat "
                "dilakukan dengan menyeleksi titik pada satu sel yang akan tersorot pula "
                "pada sel-sel lain (linked highlighting bawaan Plotly)."
            )

st.divider()


# ===========================================================================
# BAGIAN 2 — GEOSPASIAL TINGKAT KABUPATEN/KOTA
# ===========================================================================

st.header("2. Kesenjangan Spasial Antarkabupaten/Kota")

var_rasio_spasial = kolom_numerik(df_spasial)
# Utamakan kolom yang bersifat rasio/kepadatan/persentase, bukan angka absolut.
var_rasio_diutamakan = [
    c for c in var_rasio_spasial
    if any(kw in _normalisasi(c) for kw in ["rasio", "ratio", "persen", "persentase", "kepadatan", "indeks"])
    and "jumlah" not in _normalisasi(c)
]
opsi_metrik = var_rasio_diutamakan or var_rasio_spasial

if not opsi_metrik:
    st.warning("data_spasial.csv memerlukan minimal 1 kolom numerik untuk peta.")
else:
    metrik_terpilih = st.selectbox(
        "Pilih indikator rasio/kepadatan yang ditampilkan pada peta",
        options=opsi_metrik,
        help="Daftar ini mengutamakan kolom rasio/persentase/kepadatan, bukan angka absolut.",
    )

    properti_kode_geojson = cari_properti_kode_geojson(
        geojson_kabkota, ["CC_2", "Kode_BPS", "kode_bps", "KODE_BPS", "kode_wilayah"]
    )
    kol_nama_hover = "Nama_Kabkota" if "Nama_Kabkota" in df_spasial.columns else "Kabupaten_Kota"

    # Hanya kab/kota dengan kode BPS yang berhasil dipetakan ke batas digital
    # (GeoJSON) yang bisa ditampilkan pada peta; sisanya adalah keterbatasan data.
    df_peta = df_spasial[df_spasial["Kode_BPS"].notna()].copy()
    n_dikecualikan = len(df_spasial) - len(df_peta)

    tab_choropleth, tab_simbol = st.tabs(["Choropleth Map", "Peta Simbol Proporsional"])

    kwargs_dasar = dict(
        data_frame=df_peta,
        geojson=geojson_kabkota,
        locations="Kode_BPS",
        featureidkey=f"properties.{properti_kode_geojson}",
        center={"lat": -2.5, "lon": 118},
        zoom=3.8,
        hover_name=kol_nama_hover,
        hover_data={metrik_terpilih: True, "Kode_BPS": True},
        labels={metrik_terpilih: metrik_terpilih.replace("_", " ")},
    )

    with tab_choropleth:
        kwargs_peta = dict(
            **kwargs_dasar,
            color=metrik_terpilih,
            color_continuous_scale=PALET_KONTINU,
            opacity=0.75,
            title=f"Peta Choropleth {metrik_terpilih.replace('_', ' ')} Antarkabupaten/Kota",
        )
        # plotly.express.choropleth_mapbox dipertahankan sesuai ketentuan soal;
        # pada plotly >= 6, fungsi ini dihapus dan digantikan choropleth_map
        # (basis MapLibre, tanpa token, parameter setara) sehingga kode tetap
        # berjalan di kedua versi.
        if gunakan_peta_mapbox():
            fig_peta = px.choropleth_mapbox(**kwargs_peta, mapbox_style="carto-positron")
        else:
            fig_peta = px.choropleth_map(**kwargs_peta, map_style="carto-positron")
        fig_peta.update_layout(
            margin=dict(l=0, r=0, t=50, b=0),
            height=600,
            coloraxis_colorbar_title=metrik_terpilih.replace("_", " "),
        )
        tambah_anotasi_sumber(fig_peta)
        st.plotly_chart(fig_peta, width="stretch")
        st.caption(
            "Peta dapat digeser (pan) dan diperbesar (zoom) secara interaktif. "
            "Arahkan kursor ke suatu wilayah untuk melihat nama daerah dan nilai indikatornya. "
            f"{n_dikecualikan} dari {len(df_spasial)} kab/kota tidak ditampilkan karena belum "
            "tersedia batas wilayah digital yang sesuai pada GeoJSON referensi (keterbatasan data)."
        )

    with tab_simbol:
        centroid_dict = hitung_centroid_wilayah(geojson_kabkota, properti_kode_geojson)
        df_simbol = df_peta.copy()
        df_simbol["lon"] = df_simbol["Kode_BPS"].map(lambda k: centroid_dict.get(k, (None, None))[0])
        df_simbol["lat"] = df_simbol["Kode_BPS"].map(lambda k: centroid_dict.get(k, (None, None))[1])
        df_simbol = df_simbol.dropna(subset=["lon", "lat"])

        kwargs_simbol = dict(
            data_frame=df_simbol,
            lat="lat",
            lon="lon",
            size=metrik_terpilih,
            color=metrik_terpilih,
            color_continuous_scale=PALET_KONTINU,
            size_max=28,
            center={"lat": -2.5, "lon": 118},
            zoom=3.8,
            hover_name=kol_nama_hover,
            hover_data={metrik_terpilih: True, "Kode_BPS": True, "lon": False, "lat": False},
            labels={metrik_terpilih: metrik_terpilih.replace("_", " ")},
            title=f"Peta Simbol Proporsional {metrik_terpilih.replace('_', ' ')} Antarkabupaten/Kota",
        )
        if gunakan_peta_mapbox():
            fig_simbol = px.scatter_mapbox(**kwargs_simbol, mapbox_style="carto-positron")
        else:
            fig_simbol = px.scatter_map(**kwargs_simbol, map_style="carto-positron")
        fig_simbol.update_layout(
            margin=dict(l=0, r=0, t=50, b=0),
            height=600,
            coloraxis_colorbar_title=metrik_terpilih.replace("_", " "),
        )
        tambah_anotasi_sumber(fig_simbol)
        st.plotly_chart(fig_simbol, width="stretch")
        st.caption(
            "Ukuran dan warna titik sama-sama merepresentasikan nilai indikator terpilih "
            "(titik ditempatkan pada centroid wilayah) -- sebagai pembanding pola choropleth."
        )

st.divider()


# ===========================================================================
# BAGIAN 3 — STRUKTUR HIERARKI PDB/PENGELUARAN
# ===========================================================================

st.header("3. Struktur Hierarki Ekonomi Nasional")

kol_kategorikal_hierarki = df_hierarki.select_dtypes(exclude=np.number).columns.tolist()
kol_numerik_hierarki = kolom_numerik(df_hierarki)

if len(kol_kategorikal_hierarki) < 2 or not kol_numerik_hierarki:
    st.warning(
        "data_hierarki.csv memerlukan minimal 2-3 kolom jenjang kategorikal "
        "dan minimal 1 kolom numerik."
    )
else:
    jenjang = kol_kategorikal_hierarki[:3]
    kol_ukuran = pilih_kolom_prioritas(kol_numerik_hierarki, ["nilai", "rupiah", "total"], default_index=0)
    sisa_numerik = [c for c in kol_numerik_hierarki if c != kol_ukuran] or kol_numerik_hierarki
    kol_warna = pilih_kolom_prioritas(sisa_numerik, ["kontribusi", "persen", "andil", "share"], default_index=0)

    col_kiri, col_kanan = st.columns([1, 3])
    with col_kiri:
        jenis_chart = st.radio("Jenis visualisasi", ["Treemap", "Sunburst"])
        st.caption(f"Jenjang: {' -> '.join(jenjang)}")
        st.caption(f"Ukuran bidang: **{kol_ukuran}**")
        st.caption(f"Warna bidang: **{kol_warna}**")

    data_hierarki_bersih = df_hierarki.dropna(subset=[kol_ukuran])
    data_hierarki_bersih = data_hierarki_bersih[data_hierarki_bersih[kol_ukuran] > 0]

    kwargs_hierarki = dict(
        data_frame=data_hierarki_bersih,
        path=jenjang,
        values=kol_ukuran,
        color=kol_warna,
        color_continuous_scale=PALET_DIVERGEN,
        hover_data={kol_ukuran: ":,.2f", kol_warna: ":,.2f"},
        title=f"{jenis_chart} Struktur PDB/Pengeluaran: Ukuran = {kol_ukuran}, Warna = {kol_warna}",
    )

    if jenis_chart == "Treemap":
        fig_hierarki = px.treemap(**kwargs_hierarki)
    else:
        fig_hierarki = px.sunburst(**kwargs_hierarki)

    fig_hierarki.update_layout(
        margin=dict(l=0, r=0, t=50, b=20),
        height=650,
        coloraxis_colorbar_title=kol_warna,
    )
    tambah_anotasi_sumber(fig_hierarki)
    st.plotly_chart(fig_hierarki, width="stretch")
    st.caption(
        "Klik pada suatu bidang untuk melakukan drill-down ke jenjang di bawahnya; "
        "klik bidang pusat/atas untuk kembali ke tampilan sebelumnya (zoom out). "
        f"Warna ({kol_warna}) dihitung sebagai persentase kontribusi tiap segmen "
        "terhadap total PDB nasional, diturunkan dari kolom nilai itu sendiri."
    )

st.divider()
st.caption(f"Dashboard disusun untuk keperluan UAS Visualisasi Data dan Informasi. {SUMBER}.")
