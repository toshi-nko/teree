import { DateTime } from 'luxon';
import type { RawDataPoint, ChartDataPoint } from '../types';
import {
  SIGMA_OBS,
  SIGMA_PROC,
  HAMPEL_WINDOW,
  HAMPEL_THRESHOLD,
  MAX_DAILY_CHANGE,
  EMA_SPAN_SHORT,
  EMA_SPAN_LONG,
} from '../constants';

const getXLSX = () => {
    if (typeof window !== 'undefined' && (window as unknown as { XLSX?: unknown }).XLSX) {
        return (window as unknown as { XLSX: any }).XLSX;
    }
    throw new Error('Excelファイルを処理するためのXLSXライブラリが読み込まれていません。ネットワーク接続を確認するか、CSV形式でアップロードしてください。');
};

// --- FILE PARSING ---

const parseCSV = (text: string): RawDataPoint[] => {
  const rows = text.trim().split(/\r?\n/);
  if (rows.length < 2) return [];
  const header = rows[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  
  const dateIdx = header.findIndex(h => h.includes('date') || h.includes('日時'));
  const weightIdx = header.findIndex(h => h.includes('weight'));
  const fatPercentIdx = header.findIndex(h => h.includes('fat'));

  if (dateIdx === -1 || weightIdx === -1 || fatPercentIdx === -1) {
    throw new Error('CSVには "date", "weight", "fat" を含むヘッダーが必要です。');
  }

  return rows.slice(1).map(row => {
    const cols = row.split(',');
    const weight = parseFloat(cols[weightIdx]);
    const fatPercent = parseFloat(cols[fatPercentIdx]);
    return {
      date: DateTime.fromISO(cols[dateIdx]).toISODate() as string,
      weight,
      fatPercent,
      fatMass: (weight * fatPercent) / 100,
    };
  }).filter(p => p.date && !isNaN(p.fatMass));
};

const parseExcel = (buffer: ArrayBuffer): RawDataPoint[] => {
    const XLSX = getXLSX();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    return json.map(row => {
        const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('日時'));
        const weightKey = Object.keys(row).find(k => k.toLowerCase().includes('weight'));
        const fatPercentKey = Object.keys(row).find(k => k.toLowerCase().includes('fat'));
        
        if (!dateKey || !weightKey || !fatPercentKey) return null;

        let date;
        try {
            // Handles Excel's numeric date format
            if(typeof row[dateKey] === 'number') {
                const excelEpoch = new Date(1899, 11, 30);
                const jsDate = new Date(excelEpoch.getTime() + row[dateKey] * 86400000);
                date = DateTime.fromJSDate(jsDate).toISODate();
            } else {
                 date = DateTime.fromISO(row[dateKey]).toISODate();
                 if (!date) {
                     date = DateTime.fromJSDate(new Date(row[dateKey])).toISODate();
                 }
            }
        } catch(e){
            return null;
        }
        
        const weight = parseFloat(row[weightKey]);
        const fatPercent = parseFloat(row[fatPercentKey]);

        return {
            date,
            weight,
            fatPercent,
            fatMass: (weight * fatPercent) / 100,
        };
    }).filter((p): p is RawDataPoint => p !== null && p.date !== null && !isNaN(p.fatMass));
};

export const parseFile = (file: File): Promise<RawDataPoint[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const lowerName = file.name.toLowerCase();
                if (lowerName.endsWith('.csv')) {
                    resolve(parseCSV(event.target?.result as string));
                } else {
                    resolve(parseExcel(event.target?.result as ArrayBuffer));
                }
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = (error) => reject(error);

        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith('.csv')) {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
};

// --- DATA PROCESSING ALGORITHMS ---

const median = (arr: number[]): number => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const createPchipSpline = (xs: number[], ys: number[]): ((t: number) => number) => {
    const n = xs.length;
    const h = Array(n - 1);
    const delta = Array(n - 1);
    for (let i = 0; i < n - 1; i++) {
        h[i] = xs[i + 1] - xs[i];
        delta[i] = (ys[i + 1] - ys[i]) / h[i];
    }

    const m = Array(n).fill(0);
    for (let i = 1; i < n - 1; i++) {
        if (delta[i - 1] * delta[i] > 0) {
            const w1 = 2 * h[i] + h[i - 1];
            const w2 = h[i] + 2 * h[i - 1];
            m[i] = (w1 + w2) / (w1 / delta[i - 1] + w2 / delta[i]);
        }
    }
    m[0] = delta[0];
    m[n - 1] = delta[n - 2];

    return (t: number) => {
        if (t <= xs[0]) return ys[0];
        if (t >= xs[n - 1]) return ys[n - 1];

        let k = 0;
        while (xs[k + 1] < t) {
            k++;
        }

        const H = xs[k + 1] - xs[k];
        const S = (t - xs[k]) / H;
        const S2 = S * S;
        const S3 = S * S2;

        const h00 = 2 * S3 - 3 * S2 + 1;
        const h10 = S3 - 2 * S2 + S;
        const h01 = -2 * S3 + 3 * S2;
        const h11 = S3 - S2;

        return h00 * ys[k] + h10 * H * m[k] + h01 * ys[k + 1] + h11 * H * m[k + 1];
    };
};

const interpolateData = (allDates: string[], rawData: (number | undefined)[]): number[] => {
    const knownIndices = rawData.map((v, i) => v !== undefined && !isNaN(v) ? i : -1).filter(i => i !== -1);
    if (knownIndices.length < 2) {
        const avg = knownIndices.length === 1 ? rawData[knownIndices[0]]! : 0;
        return Array(allDates.length).fill(avg);
    }
    const knownValues = knownIndices.map(i => rawData[i]!);
    const spline = createPchipSpline(knownIndices, knownValues);
    return allDates.map((_, i) => spline(i));
}

const isOutlier = (index: number, series: (number | undefined)[]): boolean => {
    const window = series.slice(Math.max(0, index - HAMPEL_WINDOW), index + 1).filter((v): v is number => v !== undefined && !isNaN(v));
    if(window.length < 3) return false;
    const med = median(window);
    const mad = median(window.map(v => Math.abs(v - med))); // Median Absolute Deviation
    if (mad === 0) return false;
    return Math.abs(series[index]! - med) > HAMPEL_THRESHOLD * mad;
};

const kalmanFilter = (values: number[]): number[] => {
    if (!values.length) return [];
    const trend = Array(values.length);
    let x = values[0];
    let P = SIGMA_OBS ** 2;
    trend[0] = x;
    const rawValuesWithNaN = values.map((v,i) => isOutlier(i, values) ? undefined : v);

    for (let i = 1; i < values.length; i++) {
        const xp = x;
        const Pp = P + SIGMA_PROC ** 2;
        const y = rawValuesWithNaN[i];
        
        if (y !== undefined) {
            const K = Pp / (Pp + SIGMA_OBS ** 2);
            x = xp + K * (y - xp);
            P = (1 - K) * Pp;
        } else {
            x = xp;
            P = Pp;
        }
        
        const change = x - trend[i-1];
        if (Math.abs(change) > MAX_DAILY_CHANGE) {
            x = trend[i-1] + Math.sign(change) * MAX_DAILY_CHANGE;
        }
        trend[i] = x;
    }
    return trend;
};

const exponentialMovingAverage = (series: number[], span: number): number[] => {
    const alpha = 2 / (span + 1);
    const ema: number[] = [series[0]];
    for (let i = 1; i < series.length; i++) {
        ema.push(alpha * series[i] + (1 - alpha) * ema[i - 1]);
    }
    return ema;
};

// --- MAIN PROCESSING PIPELINE ---

export const processData = (rawDataPoints: RawDataPoint[]): ChartDataPoint[] => {
    const sortedPoints = [...rawDataPoints].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = DateTime.fromISO(sortedPoints[0].date);
    const lastDate = DateTime.fromISO(sortedPoints[sortedPoints.length - 1].date);

    const allDates: string[] = [];
    let currentDate = firstDate;
    while (currentDate <= lastDate) {
        allDates.push(currentDate.toISODate() as string);
        currentDate = currentDate.plus({ days: 1 });
    }

    const dataMap = new Map(sortedPoints.map(p => [p.date, p]));
    const rawFatMass = allDates.map(date => dataMap.get(date)?.fatMass);
    const rawWeight = allDates.map(date => dataMap.get(date)?.weight);
    const rawFatPercent = allDates.map(date => dataMap.get(date)?.fatPercent);
    const rawLeanMass = allDates.map(date => {
        const point = dataMap.get(date);
        return point ? point.weight - point.fatMass : undefined;
    });

    // Process Fat Mass
    const filledFatMass = interpolateData(allDates, rawFatMass);
    const kalmanTrendFat = kalmanFilter(filledFatMass);
    const smoothedTrendFat = exponentialMovingAverage(kalmanTrendFat, EMA_SPAN_SHORT);
    const smoothedTrendFatLong = exponentialMovingAverage(kalmanTrendFat, EMA_SPAN_LONG);
    
    // Process Lean Mass
    const filledLeanMass = interpolateData(allDates, rawLeanMass);
    const kalmanTrendLean = kalmanFilter(filledLeanMass);
    const smoothedTrendLean = exponentialMovingAverage(kalmanTrendLean, EMA_SPAN_SHORT);
    const smoothedTrendLeanLong = exponentialMovingAverage(kalmanTrendLean, EMA_SPAN_LONG);

    // Process other values
    const filledWeight = interpolateData(allDates, rawWeight);
    const filledFatPercent = interpolateData(allDates, rawFatPercent);

    return allDates.map((date, i) => {
        const weight = parseFloat(filledWeight[i].toFixed(2));
        const trendFatMass = parseFloat(smoothedTrendFat[i].toFixed(3));
        const trendFatMassLong = parseFloat(smoothedTrendFatLong[i].toFixed(3));
        const leanMass = parseFloat(filledLeanMass[i].toFixed(2));
        const trendLeanMass = parseFloat(smoothedTrendLean[i].toFixed(3));
        const trendLeanMassLong = parseFloat(smoothedTrendLeanLong[i].toFixed(3));
        const measuredLeanMass = rawLeanMass[i];

        return {
            date: date,
            timestamp: DateTime.fromISO(date).toMillis(),
            observed: rawFatMass[i],
            interpolatedFatMass: parseFloat(filledFatMass[i].toFixed(3)),
            observedWeight: rawWeight[i],
            observedLeanMass: measuredLeanMass !== undefined ? parseFloat(measuredLeanMass.toFixed(2)) : undefined,
            trend: trendFatMass,
            trendLong: trendFatMassLong,
            interpolatedWeight: weight,
            leanMass: leanMass,
            trendLeanMass: trendLeanMass,
            trendLeanMassLong: trendLeanMassLong,
            interpolatedFatPercent: parseFloat(filledFatPercent[i].toFixed(1)),
        };
    });
};