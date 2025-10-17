import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  TooltipProps,
  ReferenceLine,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { DateTime } from 'luxon';
import type { ChartDataPoint } from '../types';

// グラフの色定義
const lineColors = {
    observed: { // 体脂肪量 (実測)
        hex: '#3b82f6', // tailwind: blue-500
        bg: 'bg-blue-500',
        border: 'border-blue-500',
    },
    trend: { // 体脂肪量 (傾向)
        hex: '#16a34a', // tailwind: green-600
        bg: 'bg-green-600',
        border: 'border-green-600',
    },
    trendLong: {
        hex: '#166534', // tailwind: green-800
        bg: 'bg-green-800',
        border: 'border-green-800',
    },
    interpolatedWeight: { // 体重
        hex: '#ea580c', // tailwind: orange-600
        bg: 'bg-orange-600',
        border: 'border-orange-600',
    },
    leanMass: { // 除脂肪体重
        hex: '#8b5cf6', // tailwind: violet-500
        bg: 'bg-violet-500',
        border: 'border-violet-500',
    },
    trendLeanMass: { // 除脂肪体重 (傾向)
        hex: '#0891b2', // tailwind: cyan-600
        bg: 'bg-cyan-600',
        border: 'border-cyan-600',
    },
    trendLeanMassLong: {
        hex: '#155e75', // tailwind: cyan-800
        bg: 'bg-cyan-800',
        border: 'border-cyan-800',
    },
};

// Custom interface to work around potential type issues with recharts TooltipProps
interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  payload?: Array<{
    payload: any; // The raw data point for this tooltip entry
    value?: ValueType; // The value of the data point
    name?: NameType; // The name of the data series
  }>;
}

const ChartDisplay: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
    const [chartType, setChartType] = useState<'absolute' | 'dailyChange' | 'difference'>('absolute');
    const chartWrapperRef = useRef<HTMLDivElement>(null);

    const [absoluteVisibility, setAbsoluteVisibility] = useState({
        observed: true,
        trend: true,
        interpolatedWeight: false,
        leanMass: false,
        trendLeanMass: false,
        trendLong: false,
        trendLeanMassLong: false,
    });
    const [dailyChangeVisibility, setDailyChangeVisibility] = useState({
        fatChange: true,
        leanChange: true,
    });
    const [differenceVisibility, setDifferenceVisibility] = useState({
        fatDifference: true,
        leanDifference: true,
    });

    const handleTouchEnd = useCallback(() => {
        // This is a workaround for recharts' sticky tooltip on touch devices.
        // We find the chart's event surface and dispatch a mouseleave event
        // to tell recharts to hide the tooltip and crosshairs.
        const chartSurface = chartWrapperRef.current?.querySelector('.recharts-surface');
        if (chartSurface) {
            const mouseLeaveEvent = new MouseEvent('mouseleave', {
                view: window,
                bubbles: true,
                cancelable: true,
            });
            chartSurface.dispatchEvent(mouseLeaveEvent);
        }
    }, []);

    const dailyChangeData = useMemo(() => {
        if (data.length < 2) return [];
        return data.slice(1).map((current, i) => {
            const previous = data[i]; // i is index of sliced array, so original is i + 1
            const fatChange = current.trend - previous.trend;
            const leanChange = current.trendLeanMass - previous.trendLeanMass;
            return {
                date: current.date,
                timestamp: current.timestamp,
                fatChange: parseFloat(fatChange.toFixed(3)),
                leanChange: parseFloat(leanChange.toFixed(3)),
            };
        });
    }, [data]);

    const differenceData = useMemo(() => {
        return data.map(point => ({
            date: point.date,
            timestamp: point.timestamp,
            fatDifference: point.observed !== undefined ? point.observed - point.trend : undefined,
            leanDifference: point.observedLeanMass !== undefined ? point.observedLeanMass - point.trendLeanMass : undefined,
        }));
    }, [data]);

    const tickFormatter = (timestamp: number) => DateTime.fromMillis(timestamp).toFormat('M/d');

    const toggleAbsoluteVisibility = (dataKey: keyof typeof absoluteVisibility) => {
        setAbsoluteVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
    };

    const toggleDailyChangeVisibility = (dataKey: keyof typeof dailyChangeVisibility) => {
        setDailyChangeVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
    };

    const toggleDifferenceVisibility = (dataKey: keyof typeof differenceVisibility) => {
        setDifferenceVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
    };

    const AbsoluteCustomTooltip = useCallback(({ active, payload }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
          const data: ChartDataPoint = payload[0].payload;
          
          const tooltipItems = [
            { key: 'observed' as const, label: '脂肪量(実測)', value: data.observed },
            { key: 'trend' as const, label: '脂肪量(短期傾向)', value: data.trend },
            { key: 'trendLong' as const, label: '脂肪量(長期傾向)', value: data.trendLong },
            { key: 'interpolatedWeight' as const, label: '体重(実測)', value: data.observedWeight },
            { key: 'leanMass' as const, label: '除脂肪量(実測)', value: data.observedLeanMass },
            { key: 'trendLeanMass' as const, label: '除脂肪量(短期傾向)', value: data.trendLeanMass },
            { key: 'trendLeanMassLong' as const, label: '除脂肪量(長期傾向)', value: data.trendLeanMassLong },
          ];

          return (
            <div className="tooltip-card">
              <p className="tooltip-title">{DateTime.fromISO(data.date).toFormat('yyyy年MM月dd日')}</p>
              <div className="tooltip-list">
                {tooltipItems.map(item => {
                    if (item.value === undefined || !absoluteVisibility[item.key]) return null;
                    const unit = ' kg';
                    return (
                        <p key={item.key} style={{ color: lineColors[item.key].hex }} className="tooltip-value">
                            {item.label}: {item.value.toFixed(2)}{unit}
                        </p>
                    );
                })}
              </div>
              <p className="tooltip-note">
                体脂肪率 (推定): {data.interpolatedFatPercent.toFixed(1)} %
              </p>
            </div>
          );
        }
        return null;
      }, [absoluteVisibility]);

    const DailyChangeCustomTooltip = useCallback(({ active, payload }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <div className="tooltip-card">
                    <p className="tooltip-title">{DateTime.fromISO(point.date).toFormat('yyyy年MM月dd日')}</p>
                    <div className="tooltip-list">
                        {dailyChangeVisibility.fatChange && typeof point.fatChange === 'number' && (
                            <p style={{ color: lineColors.trend.hex }} className="tooltip-value">
                                脂肪量傾向(前日比): {point.fatChange.toFixed(3)} kg
                            </p>
                        )}
                        {dailyChangeVisibility.leanChange && typeof point.leanChange === 'number' && (
                            <p style={{ color: lineColors.trendLeanMass.hex }} className="tooltip-value">
                                除脂肪量傾向(前日比): {point.leanChange.toFixed(3)} kg
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    }, [dailyChangeVisibility]);

    const DifferenceCustomTooltip = useCallback(({ active, payload }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <div className="tooltip-card">
                    <p className="tooltip-title">{DateTime.fromISO(point.date).toFormat('yyyy年MM月dd日')}</p>
                    <div className="tooltip-list">
                        {differenceVisibility.fatDifference && typeof point.fatDifference === 'number' && (
                            <p style={{ color: lineColors.observed.hex }} className="tooltip-value">
                                脂肪量(実測 - 傾向): {point.fatDifference.toFixed(3)} kg
                            </p>
                        )}
                        {differenceVisibility.leanDifference && typeof point.leanDifference === 'number' && (
                            <p style={{ color: lineColors.leanMass.hex }} className="tooltip-value">
                                除脂肪量(実測 - 傾向): {point.leanDifference.toFixed(3)} kg
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    }, [differenceVisibility]);

    const absoluteLegendPayload = [
        { value: '脂肪量(実測)', dataKey: 'observed' as const },
        { value: '脂肪量(短期傾向)', dataKey: 'trend' as const },
        { value: '脂肪量(長期傾向)', dataKey: 'trendLong' as const },
        { value: '除脂肪量', dataKey: 'leanMass' as const },
        { value: '除脂肪量(短期傾向)', dataKey: 'trendLeanMass' as const },
        { value: '除脂肪量(長期傾向)', dataKey: 'trendLeanMassLong' as const },
        { value: '体重', dataKey: 'interpolatedWeight' as const },
    ];

     const dailyChangeLegendPayload = [
        { value: '脂肪量傾向(前日比)', dataKey: 'fatChange' as const, colorKey: 'trend' as const },
        { value: '除脂肪量傾向(前日比)', dataKey: 'leanChange' as const, colorKey: 'trendLeanMass' as const },
    ];
    
    const differenceLegendPayload = [
        { value: '脂肪量(実測-傾向)', dataKey: 'fatDifference' as const, colorKey: 'observed' as const },
        { value: '除脂肪量(実測-傾向)', dataKey: 'leanDifference' as const, colorKey: 'leanMass' as const },
    ];


    const renderLegend = () => {
        if (chartType === 'absolute') {
            return absoluteLegendPayload.map((entry) => {
                const { dataKey, value } = entry;
                const isVisible = absoluteVisibility[dataKey];
                const colors = lineColors[dataKey];
                return (
                    <button
                        key={`legend-btn-${dataKey}`}
                        onClick={() => toggleAbsoluteVisibility(dataKey)}
                        aria-pressed={isVisible}
                        className={`legend-button${isVisible ? ' is-active' : ''}`}
                        style={{
                            borderColor: colors.hex,
                            backgroundColor: isVisible ? colors.hex : undefined,
                            color: isVisible ? '#ffffff' : undefined,
                        }}
                    >
                        <div
                            className="legend-dot"
                            style={{ backgroundColor: isVisible ? '#ffffff' : colors.hex }}
                        ></div>
                        <span>{value}</span>
                    </button>
                );
            });
        }
        if (chartType === 'dailyChange') {
            return dailyChangeLegendPayload.map((entry) => {
                const { dataKey, value, colorKey } = entry;
                const isVisible = dailyChangeVisibility[dataKey];
                const colors = lineColors[colorKey];
                return (
                    <button
                        key={`legend-btn-${dataKey}`}
                        onClick={() => toggleDailyChangeVisibility(dataKey)}
                        aria-pressed={isVisible}
                        className={`legend-button${isVisible ? ' is-active' : ''}`}
                        style={{
                            borderColor: colors.hex,
                            backgroundColor: isVisible ? colors.hex : undefined,
                            color: isVisible ? '#ffffff' : undefined,
                        }}
                    >
                        <div
                            className="legend-dot"
                            style={{ backgroundColor: isVisible ? '#ffffff' : colors.hex }}
                        ></div>
                        <span>{value}</span>
                    </button>
                );
            });
        }
        if (chartType === 'difference') {
            return differenceLegendPayload.map((entry) => {
                const { dataKey, value, colorKey } = entry;
                const isVisible = differenceVisibility[dataKey];
                const colors = lineColors[colorKey];
                return (
                    <button
                        key={`legend-btn-${dataKey}`}
                        onClick={() => toggleDifferenceVisibility(dataKey)}
                        aria-pressed={isVisible}
                        className={`legend-button${isVisible ? ' is-active' : ''}`}
                        style={{
                            borderColor: colors.hex,
                            backgroundColor: isVisible ? colors.hex : undefined,
                            color: isVisible ? '#ffffff' : undefined,
                        }}
                    >
                        <div
                            className="legend-dot"
                            style={{ backgroundColor: isVisible ? '#ffffff' : colors.hex }}
                        ></div>
                        <span>{value}</span>
                    </button>
                );
            });
        }
        return null;
    }

    return (
        <div className="chart-wrapper">
            <div className="chart-mode-switch">
                <div className="chart-mode-buttons" role="group">
                    <button
                        onClick={() => setChartType('absolute')}
                        className={`chart-mode-button${chartType === 'absolute' ? ' is-active' : ''}`}
                        aria-pressed={chartType === 'absolute'}
                    >
                        絶対値
                    </button>
                    <button
                        onClick={() => setChartType('dailyChange')}
                        className={`chart-mode-button${chartType === 'dailyChange' ? ' is-active' : ''}`}
                        aria-pressed={chartType === 'dailyChange'}
                    >
                        前日比
                    </button>
                    <button
                        onClick={() => setChartType('difference')}
                        className={`chart-mode-button${chartType === 'difference' ? ' is-active' : ''}`}
                        aria-pressed={chartType === 'difference'}
                    >
                        差分
                    </button>
                </div>
            </div>
            <div className="legend-group" role="group" aria-label="グラフの表示切り替え">
               {renderLegend()}
            </div>
            <div className="chart-surface" ref={chartWrapperRef} onTouchEnd={handleTouchEnd}>
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'absolute' ? (
                        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={tickFormatter} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                            <YAxis yAxisId="fat" domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} label={{ value: '体脂肪量 (kg)', angle: -90, position: 'insideLeft', fill: '#475569', style: {textAnchor: 'middle'} }} width={70} tickFormatter={(value: number) => value.toFixed(2)} />
                            <YAxis yAxisId="mass" orientation="right" domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} label={{ value: '体重/除脂肪量 (kg)', angle: -90, position: 'insideRight', fill: '#475569', style: {textAnchor: 'middle'} }} width={80} tickFormatter={(value: number) => value.toFixed(1)} />
                            <Tooltip content={<AbsoluteCustomTooltip />} cursor={{stroke: '#94a3b8', strokeDasharray: '3 3'}}/>
                            {absoluteVisibility.observed && <Line yAxisId="fat" name="脂肪量(実測)" type="monotone" dataKey="interpolatedFatMass" stroke={lineColors.observed.hex} strokeWidth={1.5} dot={(props: any) => { const { cx, cy, payload } = props; if (payload.observed !== undefined) { return <circle cx={cx} cy={cy} r={2.5} fill={lineColors.observed.hex} />; } return null; }} activeDot={{ r: 5 }} />}
                            {absoluteVisibility.trend && <Line yAxisId="fat" name="脂肪量(短期傾向)" type="monotone" dataKey="trend" stroke={lineColors.trend.hex} strokeWidth={2.5} dot={false} activeDot={false} />}
                            {absoluteVisibility.trendLong && <Line yAxisId="fat" name="脂肪量(長期傾向)" type="monotone" dataKey="trendLong" stroke={lineColors.trendLong.hex} strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={false} />}
                            {absoluteVisibility.interpolatedWeight && <Line yAxisId="mass" name="体重" type="monotone" dataKey="interpolatedWeight" stroke={lineColors.interpolatedWeight.hex} strokeWidth={1.5} dot={(props: any) => { const { cx, cy, payload } = props; if (payload.observedWeight !== undefined) { return <circle cx={cx} cy={cy} r={2.5} fill={lineColors.interpolatedWeight.hex} />; } return null; }} activeDot={{ r: 5 }} />}
                            {absoluteVisibility.leanMass && <Line yAxisId="mass" name="除脂肪量" type="monotone" dataKey="leanMass" stroke={lineColors.leanMass.hex} strokeWidth={1.5} dot={(props: any) => { const { cx, cy, payload } = props; if (payload.observedLeanMass !== undefined) { return <circle cx={cx} cy={cy} r={2.5} fill={lineColors.leanMass.hex} />; } return null; }} activeDot={{ r: 5 }} />}
                            {absoluteVisibility.trendLeanMass && <Line yAxisId="mass" name="除脂肪量(短期傾向)" type="monotone" dataKey="trendLeanMass" stroke={lineColors.trendLeanMass.hex} strokeWidth={2} dot={false} activeDot={false} />}
                            {absoluteVisibility.trendLeanMassLong && <Line yAxisId="mass" name="除脂肪量(長期傾向)" type="monotone" dataKey="trendLeanMassLong" stroke={lineColors.trendLeanMassLong.hex} strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={false} />}
                        </LineChart>
                    ) : chartType === 'dailyChange' ? (
                        <LineChart data={dailyChangeData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={tickFormatter} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} label={{ value: '前日比 (kg)', angle: -90, position: 'insideLeft', fill: '#475569', style: {textAnchor: 'middle'} }} width={70} tickFormatter={(value: number) => value.toFixed(2)} />
                            <Tooltip content={<DailyChangeCustomTooltip />} cursor={{stroke: '#94a3b8', strokeDasharray: '3 3'}}/>
                            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" />
                            {dailyChangeVisibility.fatChange && <Line type="monotone" dataKey="fatChange" name="脂肪量傾向(前日比)" stroke={lineColors.trend.hex} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />}
                            {dailyChangeVisibility.leanChange && <Line type="monotone" dataKey="leanChange" name="除脂肪量傾向(前日比)" stroke={lineColors.trendLeanMass.hex} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />}
                        </LineChart>
                    ) : (
                        <LineChart data={differenceData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={tickFormatter} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} label={{ value: '差分 (kg)', angle: -90, position: 'insideLeft', fill: '#475569', style: {textAnchor: 'middle'} }} width={70} tickFormatter={(value: number) => value.toFixed(2)} />
                            <Tooltip content={<DifferenceCustomTooltip />} cursor={{stroke: '#94a3b8', strokeDasharray: '3 3'}}/>
                            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" />
                            {differenceVisibility.fatDifference && <Line connectNulls={true} type="monotone" dataKey="fatDifference" name="脂肪量(実測-傾向)" stroke={lineColors.observed.hex} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />}
                            {differenceVisibility.leanDifference && <Line connectNulls={true} type="monotone" dataKey="leanDifference" name="除脂肪量(実測-傾向)" stroke={lineColors.leanMass.hex} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />}
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartDisplay;