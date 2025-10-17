import React, { useState, useCallback, useMemo } from 'react';
import { DateTime } from 'luxon';

import type { ChartDataPoint, RawDataPoint } from './types';
import { processData, parseFile } from './services/dataProcessor';
import FileUploader from './components/FileUploader';
import RangeControls from './components/RangeControls';
import ChartDisplay from './components/ChartDisplay';

const App: React.FC = () => {
  const [allChartData, setAllChartData] = useState<ChartDataPoint[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const fullDateRange = useMemo(() => {
    if (allChartData.length === 0) return null;
    return {
      start: allChartData[0].date,
      end: allChartData[allChartData.length - 1].date,
    };
  }, [allChartData]);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);
    setAllChartData([]);
    setDateRange(null);

    try {
      const rawData: RawDataPoint[] = await parseFile(file);
      if (rawData.length < 2) {
        throw new Error("データポイントが不足しています。最低2つの有効な記録が必要です。");
      }
      const processed = processData(rawData);
      setAllChartData(processed);
      
      const start = processed[0].date;
      const end = processed[processed.length - 1].date;
      setDateRange({ start, end });
      
    } catch (e: any) {
      setError(`ファイル処理エラー: ${e.message}`);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const visibleData = useMemo(() => {
    if (!allChartData.length || !dateRange) return [];
    const start = DateTime.fromISO(dateRange.start).startOf('day').toMillis();
    const end = DateTime.fromISO(dateRange.end).endOf('day').toMillis();
    return allChartData.filter(d => d.timestamp >= start && d.timestamp <= end);
  }, [allChartData, dateRange]);


  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">体脂肪トレンド可視化ツール</h1>
          <p className="app-subtitle">体組成データをアップロードして、あなたの進捗を確認しましょう。</p>
        </header>

        <main className="app-main">
          <FileUploader onFileSelect={handleFileSelect} fileName={fileName} isLoading={isLoading} />

          {error && (
             <div className="error-alert" role="alert">
                <p className="error-alert__title">エラーが発生しました</p>
                <p className="error-alert__message">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner" aria-hidden="true"></div>
              <p className="loading-message">データを処理中...</p>
            </div>
          )}

          {allChartData.length > 0 && !isLoading && !error && (
            <div className="app-card">
               {fullDateRange && dateRange && (
                <RangeControls
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  fullDateRange={fullDateRange}
                />
              )}
              <div className="chart-region">
                <ChartDisplay data={visibleData} />
              </div>
            </div>
          )}
        </main>

        <footer className="app-footer">
          <p>Powered by React, Recharts, and modern web tooling</p>
        </footer>
      </div>
    </div>
  );
};

export default App;