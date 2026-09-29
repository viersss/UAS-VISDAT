import * as XLSX from 'xlsx';

export interface MigrationEdge {
  Tahun: number;
  Prov_Asal: string;
  Prov_Tujuan: string;
  Jumlah_Migran: number;
}

export interface MigrationDataset {
  years: number[];
  provinces: string[];
  edges: MigrationEdge[];
}

type SheetCell = string | number | null | undefined;

function normalizeProvince(value: string) {
  return value.replace(/^\s*\d+\.\s*/, '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('id-ID');
}

function displayProvince(value: string) {
  return normalizeProvince(value)
    .split(' ')
    .map(part => part === 'DI' || part === 'DKI' ? part : `${part[0]}${part.slice(1).toLocaleLowerCase('id-ID')}`)
    .join(' ');
}

function parseCount(value: SheetCell, origin: string, destination: string) {
  if (value === null || value === undefined || value === '') return 0;
  const count = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
  if (!Number.isFinite(count) || count < 0) {
    throw new Error(`Nilai migrasi tidak valid untuk ${origin} ke ${destination}: ${String(value)}`);
  }
  return count;
}

export function parseMigrationWorkbook(buffer: ArrayBuffer): MigrationDataset {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error('Sheet data migrasi tidak ditemukan.');

  const rows = XLSX.utils.sheet_to_json<SheetCell[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });
  const headerIndex = rows.findIndex(row =>
    normalizeProvince(String(row[0] ?? '')) === 'NAMA PROVINSI' &&
    row.some(cell => String(cell ?? '').trim().toLocaleUpperCase('id-ID') === 'TOTAL')
  );
  if (headerIndex < 0) throw new Error('Header matriks asal-tujuan tidak ditemukan.');

  const header = rows[headerIndex];
  const totalColumn = header.findIndex(cell => String(cell ?? '').trim().toLocaleUpperCase('id-ID') === 'TOTAL');
  const destinationColumns = header
    .map((cell, index) => ({ cell: String(cell ?? '').trim(), index }))
    .filter(({ cell, index }) => index > 0 && index < totalColumn && cell && cell.toLocaleUpperCase('id-ID') !== 'LUAR NEGERI');
  const provinces = destinationColumns.map(({ cell }) => displayProvince(cell));
  const yearText = rows.flat().find(cell => typeof cell === 'string' && /Tahun\s+\d{4}/i.test(cell));
  const yearMatch = typeof yearText === 'string' ? yearText.match(/Tahun\s+(\d{4})/i) : null;
  if (!yearMatch) throw new Error('Tahun data tidak tercantum pada workbook.');
  const year = Number(yearMatch[1]);

  const destinationKeys = new Set(destinationColumns.map(({ cell }) => normalizeProvince(cell)));
  const edges: MigrationEdge[] = [];
  const originKeys = new Set<string>();

  for (const row of rows.slice(headerIndex + 1)) {
    const rawOrigin = String(row[0] ?? '').trim();
    if (!rawOrigin || normalizeProvince(rawOrigin) === 'TOTAL') break;

    const originKey = normalizeProvince(rawOrigin);
    if (!destinationKeys.has(originKey)) continue;
    originKeys.add(originKey);
    const origin = displayProvince(rawOrigin);

    for (const { cell: rawDestination, index } of destinationColumns) {
      const destinationKey = normalizeProvince(rawDestination);
      if (originKey === destinationKey) continue;
      const destination = displayProvince(rawDestination);
      const count = parseCount(row[index], origin, destination);
      if (count > 0) {
        edges.push({
          Tahun: year,
          Prov_Asal: origin,
          Prov_Tujuan: destination,
          Jumlah_Migran: count,
        });
      }
    }
  }

  if (provinces.length !== 34 || originKeys.size !== provinces.length) {
    throw new Error(`Matriks harus memiliki 34 provinsi asal dan tujuan; ditemukan ${originKeys.size} asal dan ${provinces.length} tujuan.`);
  }

  return { years: [year], provinces, edges };
}
