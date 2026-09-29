import type { ProvinceDatum } from '@/data/provinces';

export interface PcaResult {
  provinsi: string;
  pulau: string;
  pc1: number;
  pc2: number;
  loading: number;
  highlighted: boolean;
}

export interface PcaSummary {
  pc1Variance: number;
  pc2Variance: number;
  totalVariance: number;
  loadings: { variable: string; pc1: number; pc2: number }[];
}

export const INDICATOR_LABELS: Record<string, string> = {
  ipm: 'IPM',
  pdrbPerKapita: 'PDRB per Kapita',
  tpt: 'Pengangguran',
  kemiskinan: 'Kemiskinan',
  gini: 'Rasio Gini',
  hls: 'Harapan Sekolah',
  rls: 'Rata-rata Sekolah',
  airBersih: 'Air Bersih',
  sanitasi: 'Sanitasi',
  elektrifikasi: 'Elektrifikasi',
  penduduk: 'Penduduk',
};

export const INDICATOR_KEYS = [
  'ipm', 'pdrbPerKapita', 'tpt', 'kemiskinan', 'gini',
  'hls', 'rls', 'airBersih', 'sanitasi', 'elektrifikasi',
] as const;

export type IndicatorKey = typeof INDICATOR_KEYS[number];

export function standardize(values: number[]): number[] {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / n) || 1;
  return values.map(v => (v - mean) / std);
}

function eigenDecompositionSymmetric(matrix: number[][]) {
  const size = matrix.length;
  const values = matrix.map(row => [...row]);
  const vectors = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => Number(row === column))
  );
  const maxIterations = 100 * size * size;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let p = 0;
    let q = 1;
    let largest = 0;

    for (let row = 0; row < size; row++) {
      for (let column = row + 1; column < size; column++) {
        if (Math.abs(values[row][column]) > largest) {
          largest = Math.abs(values[row][column]);
          p = row;
          q = column;
        }
      }
    }

    if (largest < 1e-10) break;

    const angle = 0.5 * Math.atan2(2 * values[p][q], values[q][q] - values[p][p]);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const pp = values[p][p];
    const qq = values[q][q];
    const pq = values[p][q];

    for (let index = 0; index < size; index++) {
      if (index === p || index === q) continue;
      const ip = values[index][p];
      const iq = values[index][q];
      values[index][p] = values[p][index] = cosine * ip - sine * iq;
      values[index][q] = values[q][index] = sine * ip + cosine * iq;
    }

    values[p][p] = cosine ** 2 * pp - 2 * sine * cosine * pq + sine ** 2 * qq;
    values[q][q] = sine ** 2 * pp + 2 * sine * cosine * pq + cosine ** 2 * qq;
    values[p][q] = values[q][p] = 0;

    for (let row = 0; row < size; row++) {
      const vp = vectors[row][p];
      const vq = vectors[row][q];
      vectors[row][p] = cosine * vp - sine * vq;
      vectors[row][q] = sine * vp + cosine * vq;
    }
  }

  return {
    eigenvalues: values.map((row, index) => row[index]),
    eigenvectors: vectors,
  };
}

export function computePCA(
  data: ProvinceDatum[],
  variables: string[],
  highlighted: Set<string>
): { points: PcaResult[]; summary: PcaSummary } {
  const n = data.length;
  const p = variables.length;

  const columns = variables.map(variable => data.map(d => d[variable as keyof ProvinceDatum] as number));
  const means = columns.map(values => values.reduce((sum, value) => sum + value, 0) / n);
  const deviations = columns.map((values, column) => {
    const sumSquares = values.reduce((sum, value) => sum + (value - means[column]) ** 2, 0);
    return Math.sqrt(sumSquares / Math.max(1, n - 1)) || 1;
  });
  const standardized = data.map((_, row) =>
    columns.map((values, column) => (values[row] - means[column]) / deviations[column])
  );

  const covariance: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += standardized[k][i] * standardized[k][j];
      covariance[i][j] = sum / Math.max(1, n - 1);
    }
  }

  const { eigenvalues, eigenvectors } = eigenDecompositionSymmetric(covariance);
  const totalVar = eigenvalues.reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
  const sorted = eigenvalues
    .map((val, idx) => ({ val, idx }))
    .sort((a, b) => b.val - a.val);

  const pc1Idx = sorted[0]?.idx ?? 0;
  const pc2Idx = sorted[1]?.idx ?? pc1Idx;
  const pc1Var = (eigenvalues[pc1Idx] / totalVar) * 100;
  const pc2Var = (eigenvalues[pc2Idx] / totalVar) * 100;

  const orient = (component: number) => {
    const pivot = eigenvectors.reduce((best, row, index) =>
      Math.abs(row[component]) > Math.abs(eigenvectors[best][component]) ? index : best, 0);
    const sign = eigenvectors[pivot][component] < 0 ? -1 : 1;
    return eigenvectors.map(row => row[component] * sign);
  };
  const ev1 = orient(pc1Idx);
  const ev2 = orient(pc2Idx);

  const points: PcaResult[] = data.map((d, k) => {
    let pc1 = 0, pc2 = 0;
    for (let i = 0; i < p; i++) {
      pc1 += standardized[k][i] * ev1[i];
      pc2 += standardized[k][i] * ev2[i];
    }
    return {
      provinsi: d.provinsi,
      pulau: d.pulau,
      pc1, pc2,
      loading: Math.hypot(pc1, pc2),
      highlighted: highlighted.has(d.provinsi),
    };
  });

  const loadings = variables.map((v, i) => ({
    variable: v,
    pc1: ev1[i] * Math.sqrt(Math.max(0, eigenvalues[pc1Idx])),
    pc2: ev2[i] * Math.sqrt(Math.max(0, eigenvalues[pc2Idx])),
  }));

  return {
    points,
    summary: {
      pc1Variance: pc1Var,
      pc2Variance: pc2Var,
      totalVariance: pc1Var + pc2Var,
      loadings,
    },
  };
}

export function pearson(x: number[], y: number[]): number {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xv = x[i] - mx, yv = y[i] - my;
    num += xv * yv;
    dx += xv * xv;
    dy += yv * yv;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}
