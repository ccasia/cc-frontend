export const CHART_COLORS = {
  primary: '#1340FF',
  secondary: '#8E33FF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#00B8D9',
  grey: '#919EAB',
};

export const CHART_SX = {
  overflow: 'visible',
  // Show axis lines on left (y) and bottom (x) as solid frame borders
  '& .MuiChartsAxis-left .MuiChartsAxis-line': { stroke: '#E0E3E7', strokeWidth: 1 },
  '& .MuiChartsAxis-bottom .MuiChartsAxis-line': { stroke: '#E0E3E7', strokeWidth: 1 },
  '& .MuiChartsAxis-tick': { display: 'none' },
  '& .MuiMarkElement-root': { display: 'none' },
  '& .MuiAreaElement-root': { opacity: 0.15 },
  '& .MuiChartsGrid-line': { stroke: '#F0F2F4', strokeDasharray: '4 4' },
};

export const TICK_LABEL_STYLE = { fill: '#666', fontSize: 11, fontWeight: 500 };
export const CHART_MARGIN = { left: 8, right: 28, top: 10, bottom: 24 };
export const CHART_MARGIN_WIDE = { left: 24, right: 28, top: 10, bottom: 24 };
export const CHART_HEIGHT = 340;
export const CHART_GRID = { horizontal: true, vertical: false };

export const UI_COLORS = {
  text: '#333',
  textSecondary: '#666',
  textMuted: '#919EAB',
  border: '#E8ECEE',
  background: '#FFFFFF',
  backgroundHover: '#F9FAFB',
  barBg: '#F4F6F8',
};

// Returns trend badge styling based on whether the change is neutral, positive, or negative.
// @param {boolean} isNeutral  — true when there is no previous data or change is 0
// @param {boolean} isPositive — true when the change is in the "good" direction
export function getTrendProps(isNeutral, isPositive) {
  if (isNeutral) return { color: '#919EAB', bg: '#F4F6F8', iconSize: 14 };
  if (isPositive) return { color: CHART_COLORS.success, bg: '#ECFDF5', iconSize: 18 };
  return { color: CHART_COLORS.error, bg: '#FEF2F2', iconSize: 18 };
}

export const LEGEND_SLOT_PROPS = {
  legend: {
    direction: 'row',
    position: { vertical: 'top', horizontal: 'right' },
    labelStyle: { fill: '#666', fontSize: 12, fontWeight: 500 },
    itemMarkWidth: 12,
    itemMarkHeight: 2,
    markGap: 8,
    itemGap: 16,
  },
};
