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
    <div className="min-h-screen bg-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">体脂肪トレンド可視化ツール</h1>
          <p className="text-slate-500 mt-2 text-md">体組成データをアップロードして、あなたの進捗を確認しましょう。</p>
        </header>

        <main className="space-y-6">
          <FileUploader onFileSelect={handleFileSelect} fileName={fileName} isLoading={isLoading} />
          
          {error && (
             <div className="max-w-4xl mx-auto bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
                <p className="font-bold">エラーが発生しました</p>
                <p>{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="ml-4 text-slate-600 font-medium">データを処理中...</p>
            </div>
          )}

          {allChartData.length > 0 && !isLoading && !error && (
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
               {fullDateRange && dateRange && (
                <RangeControls 
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  fullDateRange={fullDateRange}
                />
              )}
              <div style={{ height: '55vh', minHeight: '400px' }}>
                <ChartDisplay data={visibleData} />
              </div>
            </div>
          )}
        </main>

        <footer className="text-center mt-12 text-sm text-slate-400">
          <p>Powered by React, Recharts, and Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
};

export default App;