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

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

function multiply(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < b.length; k++) sum += a[i][k] * b[k][j];
      result[i][j] = sum;
    }
  }
  return result;
}

function eigenDecomposition2x2(a: number, b: number, c: number, d: number) {
  const trace = a + d;
  const det = a * d - b * c;
  const discriminant = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
  const lambda1 = trace / 2 + discriminant;
  const lambda2 = trace / 2 - discriminant;

  let v1: [number, number], v2: [number, number];
  if (Math.abs(b) > 1e-10) {
    v1 = [lambda1 - d, c];
    v2 = [lambda2 - d, c];
  } else if (Math.abs(c) > 1e-10) {
    v1 = [b, lambda1 - a];
    v2 = [b, lambda2 - a];
  } else {
    v1 = [1, 0];
    v2 = [0, 1];
  }

  const norm1 = Math.hypot(v1[0], v1[1]) || 1;
  const norm2 = Math.hypot(v2[0], v2[1]) || 1;
  v1 = [v1[0] / norm1, v1[1] / norm1];
  v2 = [v2[0] / norm2, v2[1] / norm2];

  return { eigenvalues: [lambda1, lambda2], eigenvectors: [v1, v2] };
}

export function computePCA(
  data: ProvinceDatum[],
  variables: string[],
  highlighted: Set<string>
): { points: PcaResult[]; summary: PcaSummary } {
  const n = data.length;
  const p = variables.length;

  const standardized: number[][] = data.map(d =>
    standardize(variables.map(v => d[v as keyof ProvinceDatum] as number))
  );

  const cov: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += standardized[k][i] * standardized[k][j];
      cov[i][j] = sum / (n - 1);
    }
  }

  let eigenvalues: number[] = [];
  let eigenvectors: number[][] = [];

  if (p === 1) {
    eigenvalues = [cov[0][0]];
    eigenvectors = [[1]];
  } else {
    const { eigenvalues: ev, eigenvectors: vecs } = eigenDecomposition2x2(
      cov[0][0], cov[0][1], cov[1][0], cov[1][1]
    );
    eigenvalues = ev;
    eigenvectors = vecs.map(v => [v[0], v[1]]);

    for (let i = 2; i < p; i++) {
      const expanded: number[][] = Array.from({ length: i + 1 }, () => Array(i + 1).fill(0));
      for (let a = 0; a < i; a++) for (let b = 0; b < i; b++) expanded[a][b] = cov[a][b];
      for (let a = 0; a <= i; a++) { expanded[a][i] = cov[a][i]; expanded[i][a] = cov[i][a]; }
      const { eigenvalues: newEv, eigenvectors: newVecs } = eigenDecomposition2x2(
        expanded[0][0], expanded[0][1], expanded[1][0], expanded[1][1]
      );
      eigenvalues = newEv;
      eigenvectors = newVecs.map(v => {
        const full = Array(i + 1).fill(0);
        full[0] = v[0]; full[1] = v[1];
        return full;
      });
    }
  }

  const totalVar = eigenvalues.reduce((a, b) => a + Math.max(0, b), 0) || 1;
  const sorted = eigenvalues
    .map((val, idx) => ({ val, idx }))
    .sort((a, b) => b.val - a.val);

  const pc1Idx = sorted[0].idx;
  const pc2Idx = sorted[1]?.idx ?? 0;
  const pc1Var = (eigenvalues[pc1Idx] / totalVar) * 100;
  const pc2Var = (eigenvalues[pc2Idx] / totalVar) * 100;

  const ev1 = eigenvectors[pc1Idx] || eigenvectors[0];
  const ev2 = eigenvectors[pc2Idx] || eigenvectors[1 % eigenvectors.length];

  const points: PcaResult[] = data.map((d, k) => {
    let pc1 = 0, pc2 = 0;
    for (let i = 0; i < p; i++) {
      pc1 += standardized[k][i] * (ev1[i] || 0);
      pc2 += standardized[k][i] * (ev2[i] || 0);
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
    pc1: (ev1[i] || 0) * Math.sqrt(eigenvalues[pc1Idx] || 1),
    pc2: (ev2[i] || 0) * Math.sqrt(eigenvalues[pc2Idx] || 1),
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
