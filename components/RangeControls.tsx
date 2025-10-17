import React from 'react';
import { DateTime } from 'luxon';

interface RangeControlsProps {
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  fullDateRange: { start: string; end: string };
}

const RangeControls: React.FC<RangeControlsProps> = ({ dateRange, setDateRange, fullDateRange }) => {

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const setQuickRange = (days: number) => {
    const end = DateTime.fromISO(fullDateRange.end);
    let start = end.minus({ days: days - 1 });
    if (start < DateTime.fromISO(fullDateRange.start)) {
      start = DateTime.fromISO(fullDateRange.start);
    }
    setDateRange({ start: start.toISODate() as string, end: end.toISODate() as string });
  };
  
  const resetRange = () => {
    setDateRange(fullDateRange);
  }

  const QuickButton: React.FC<{onClick: () => void; children: React.ReactNode;}> = ({ onClick, children }) => (
    <button
      onClick={onClick}
      className="flex-grow px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center p-2 rounded-lg">
      <div className="flex gap-2 items-center w-full sm:w-auto">
        <input
          type="date"
          name="start"
          value={dateRange.start}
          min={fullDateRange.start}
          max={fullDateRange.end}
          onChange={handleDateChange}
          className="w-full text-sm p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
          aria-label="開始日"
        />
        <span className="text-slate-400">-</span>
        <input
          type="date"
          name="end"
          value={dateRange.end}
          min={fullDateRange.start}
          max={fullDateRange.end}
          onChange={handleDateChange}
          className="w-full text-sm p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
          aria-label="終了日"
        />
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
          <QuickButton onClick={() => setQuickRange(30)}>1ヶ月</QuickButton>
          <QuickButton onClick={() => setQuickRange(90)}>3ヶ月</QuickButton>
          <QuickButton onClick={() => setQuickRange(365)}>1年</QuickButton>
          <QuickButton onClick={resetRange}>全期間</QuickButton>
      </div>
    </div>
  );
};

export default RangeControls;