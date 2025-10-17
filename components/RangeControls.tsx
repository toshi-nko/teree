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
    <button onClick={onClick} className="range-quick-button">
      {children}
    </button>
  );

  return (
    <div className="range-controls">
      <div className="range-inputs">
        <input
          type="date"
          name="start"
          value={dateRange.start}
          min={fullDateRange.start}
          max={fullDateRange.end}
          onChange={handleDateChange}
          className="range-date-input"
          aria-label="開始日"
        />
        <span className="range-separator">-</span>
        <input
          type="date"
          name="end"
          value={dateRange.end}
          min={fullDateRange.start}
          max={fullDateRange.end}
          onChange={handleDateChange}
          className="range-date-input"
          aria-label="終了日"
        />
      </div>
      <div className="range-quick-buttons">
          <QuickButton onClick={() => setQuickRange(30)}>1ヶ月</QuickButton>
          <QuickButton onClick={() => setQuickRange(90)}>3ヶ月</QuickButton>
          <QuickButton onClick={() => setQuickRange(365)}>1年</QuickButton>
          <QuickButton onClick={resetRange}>全期間</QuickButton>
      </div>
    </div>
  );
};

export default RangeControls;