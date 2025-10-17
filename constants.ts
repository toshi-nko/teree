
// Parameters for data processing algorithms, based on the original script

// Kalman Filter: Observation noise standard deviation
export const SIGMA_OBS = 0.3;

// Kalman Filter: Process noise standard deviation
export const SIGMA_PROC = 0.25;

// Hampel Filter: Window size (one-sided) for outlier detection
export const HAMPEL_WINDOW = 6;

// Hampel Filter: Threshold in standard deviations for outlier detection
export const HAMPEL_THRESHOLD = 2.5;

// Kalman Filter: Maximum daily change allowed in the trend line (kg)
export const MAX_DAILY_CHANGE = 0.19;

// Exponential Moving Average: Span for final smoothing
export const EMA_SPAN_SHORT = 5;
export const EMA_SPAN_LONG = 28; // For long-term trend