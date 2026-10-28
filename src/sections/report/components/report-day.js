import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Snapshots are stored per Malaysia day, so every viewer reads the same calendar
const REPORT_TZ = 'Asia/Kuala_Lumpur';

export const reportDay = (date) => dayjs(date).tz(REPORT_TZ).startOf('day');

export const reportDayKey = (date) => reportDay(date).format('YYYY-MM-DD');

// The last day with data, or today while the post is still being read
export const reportAnchorDay = (rows) => {
  const today = reportDay(new Date());
  const last = rows.length ? reportDay(rows[rows.length - 1].snapshotDate) : today;
  return last.isBefore(today) ? last : today;
};

export const mondayOf = (day) => day.subtract(day.day() === 0 ? 6 : day.day() - 1, 'day');
