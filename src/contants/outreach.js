// Outreach status options for internal admin tracking
export const OUTREACH_STATUS_OPTIONS = [
  { value: 'OUTREACHED', label: 'Outreached', color: '#FFC702' },
  { value: 'DISCUSSING', label: 'Discussing', color: '#8A5AFE' },
  { value: 'CONFIRMED', label: 'Confirmed', color: '#1ABF66' },
  { value: 'REJECTED', label: 'Rejected', color: '#D4321C' },
  { value: 'INTERESTED', label: 'Interested', color: '#026D54' },
  { value: 'FOLLOWED_UP', label: 'Followed Up', color: '#1340FF' },
  { value: 'UNRESPONSIVE', label: 'Unresponsive', color: '#FF3500' },
];

//Get outreach status configuration by status value
export const getOutreachStatusConfig = (status) =>
  OUTREACH_STATUS_OPTIONS.find((opt) => opt.value === status) || null;
