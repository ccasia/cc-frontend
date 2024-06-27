import dayjs from 'dayjs';

export const timelineHelper = (date, days) => dayjs(date).add(days, 'day').format('LL');
