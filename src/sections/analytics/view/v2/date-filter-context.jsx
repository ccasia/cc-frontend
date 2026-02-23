import { useMemo, useContext, createContext } from 'react';
import PropTypes from 'prop-types';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const DateFilterContext = createContext({
  dateFilter: 'all',
  startDate: null,
  endDate: null,
});

export function DateFilterProvider({ dateFilter, startDate, endDate, children }) {
  const value = useMemo(
    () => ({ dateFilter, startDate, endDate }),
    [dateFilter, startDate, endDate]
  );
  return <DateFilterContext.Provider value={value}>{children}</DateFilterContext.Provider>;
}

DateFilterProvider.propTypes = {
  dateFilter: PropTypes.string.isRequired,
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  children: PropTypes.node.isRequired,
};

export function useDateFilter() {
  return useContext(DateFilterContext);
}

// ---------------------------------------------------------------------------
// Hook: returns true when the active filter implies daily granularity.
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86400000;
const DAILY_THRESHOLD_DAYS = 62; // custom ranges up to ~2 months use daily

export function useIsDaily() {
  const { dateFilter, startDate, endDate } = useDateFilter();
  if (dateFilter === 'week' || dateFilter === 'month') return true;
  if (dateFilter === 'custom' && startDate && endDate) {
    const spanDays = Math.round((endDate - startDate) / MS_PER_DAY);
    return spanDays <= DAILY_THRESHOLD_DAYS;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Hook: returns the comparison label for KPI trend based on active date filter.
// "week" → "vs last week", "month" → "vs last month", "year" → "vs last year"
// ---------------------------------------------------------------------------

export function useTrendLabel() {
  const { dateFilter } = useDateFilter();
  const isDaily = useIsDaily();
  const labels = { week: 'vs last week', month: 'vs last month', year: 'vs last year' };
  if (dateFilter === 'custom' && isDaily) return 'vs prev period';
  return labels[dateFilter] || 'vs last month';
}

// ---------------------------------------------------------------------------
// Utility — parse "Feb 25" → Date(2025, 1, 1)
// ---------------------------------------------------------------------------

const MONTH_MAP = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

export function parseMonthStr(str) {
  const [abbr, yr] = str.split(' ');
  return new Date(2000 + parseInt(yr, 10), MONTH_MAP[abbr], 1);
}

// ---------------------------------------------------------------------------
// Filter an array of objects with a `.month` string property by date range.
// Returns the full array when preset is "all" or both dates are null.
// Comparison is at month granularity (year*12 + month).
// ---------------------------------------------------------------------------

export function filterByDateRange(data, startDate, endDate) {
  if (!startDate && !endDate) return data;

  return data.filter((item) => {
    // Daily data (has isoDate or date but no month) is already server-filtered — include all
    if (!item.month) return true;

    const d = parseMonthStr(item.month);
    const dm = d.getFullYear() * 12 + d.getMonth();

    if (startDate) {
      const sm = startDate.getFullYear() * 12 + startDate.getMonth();
      if (dm < sm) return false;
    }
    if (endDate) {
      const em = endDate.getFullYear() * 12 + endDate.getMonth();
      if (dm > em) return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Hook: convenience wrapper — filters data using current context values.
// Usage:  const filtered = useFilteredData(dataArray);
// ---------------------------------------------------------------------------

export function useFilteredData(data) {
  const { startDate, endDate } = useDateFilter();
  return useMemo(() => filterByDateRange(data, startDate, endDate), [data, startDate, endDate]);
}

// ---------------------------------------------------------------------------
// Hook: returns a human-readable chip label based on the active date filter.
// "all"    → defaultLabel (e.g. "Last 12 months")
// "month"  → "February 2026"
// "week"   → "Feb 17 — Feb 23, 2026"
// "year"   → "2026"
// "custom" → "Feb 2025 — Jul 2025"
// ---------------------------------------------------------------------------

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function useFilterLabel(defaultLabel = 'All time') {
  const { dateFilter, startDate, endDate } = useDateFilter();

  return useMemo(() => {
    if (dateFilter === 'all' || (!startDate && !endDate)) return defaultLabel;

    if (dateFilter === 'month' && startDate) {
      return `${FULL_MONTHS[startDate.getMonth()]} ${startDate.getFullYear()}`;
    }

    if (dateFilter === 'year' && startDate) {
      return `${startDate.getFullYear()}`;
    }

    if (dateFilter === 'week' && startDate && endDate) {
      const sm = SHORT_MONTHS[startDate.getMonth()];
      const em = SHORT_MONTHS[endDate.getMonth()];
      const sd = startDate.getDate();
      const ed = endDate.getDate();
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${sm} ${sd} — ${ed}, ${startDate.getFullYear()}`;
      }
      return `${sm} ${sd} — ${em} ${ed}, ${endDate.getFullYear()}`;
    }

    if (dateFilter === 'custom' && startDate && endDate) {
      const sm = SHORT_MONTHS[startDate.getMonth()];
      const em = SHORT_MONTHS[endDate.getMonth()];
      const sameYear = startDate.getFullYear() === endDate.getFullYear();
      if (sameYear) {
        return `${sm} ${startDate.getFullYear()} — ${em} ${endDate.getFullYear()}`;
      }
      return `${sm} ${startDate.getFullYear()} — ${em} ${endDate.getFullYear()}`;
    }

    return defaultLabel;
  }, [dateFilter, startDate, endDate, defaultLabel]);
}
