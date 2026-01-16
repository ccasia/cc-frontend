import { format } from 'date-fns';

export const getLiteralTime = (isoStr) => {
  if (!isoStr) return '';
  const timePart = isoStr.split('T')[1]; // Grabs "02:00:00Z"
  const [hours, minutes] = timePart.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

export const getLiteralDate = (isoStr) => {
  if (!isoStr) return '';
  const datePartString = isoStr.split('T')[0]; // Grabs "2026-01-02"
  const [year, month, day] = datePartString.split('-').map(Number);

  // Creates local date at midnight to use format() safely
  const literalDate = new Date(year, month - 1, day);
  return format(literalDate, 'd MMMM yyyy');
};

export const formatReservationSlot = (startTime, endTime, includeDate = false) => {
  if (!startTime) return '-';

  const isFullDay = startTime.includes('T00:00') && endTime?.includes('T23:59');

  const timeLabel = isFullDay
    ? 'Full day'
    : `${getLiteralTime(startTime)} - ${getLiteralTime(endTime)}`;

  if (includeDate) {
    return `${getLiteralDate(startTime)} (${timeLabel})`;
  }

  return timeLabel;
};
