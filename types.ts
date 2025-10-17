
export interface RawDataPoint {
  date: string; // YYYY-MM-DD
  weight: number;
  fatPercent: number;
  fatMass: number;
}

// Data prepared for the chart
export interface ChartDataPoint {
  date: string; // YYYY-MM-DD
  timestamp: number; // for recharts x-axis
  observed?: number; // a.k.a fatMass. Undefined for days without measurement.
  interpolatedFatMass: number;
  observedWeight?: number; // The measured weight, if available.
  observedLeanMass?: number; // The calculated lean mass from measured values, if available.
  trend: number;
  trendLong: number;
  interpolatedWeight: number;
  leanMass: number;
  trendLeanMass: number;
  trendLeanMassLong: number;
  interpolatedFatPercent: number;
}