export const STATUS_CHIP = {
  NOT_STARTED: { label: 'Not Started', color: '#8E8E93' },
  IN_PROGRESS: { label: 'In Progress', color: '#8E8E93' },
  PENDING_REVIEW: { label: 'Pending Review', color: '#FFC702' },
  SENT_TO_ADMIN: { label: 'Sent to Admin', color: '#8A5AFE' },
  SENT_TO_CLIENT: { label: 'Sent to Client', color: '#7B5CF5' },
  CLIENT_FEEDBACK: { label: 'Client Feedback', color: '#F08A24' },
  CHANGES_REQUIRED: { label: 'Changes Required', color: '#D4321C' },
  APPROVED: { label: 'Approved', color: '#1ABF66' },
  CLIENT_APPROVED: { label: 'Client Approved', color: '#1ABF66' },
  APPROVE_LINK: { label: 'Approve Link', color: '#FF7B00' },
  POSTED: { label: 'Posted', color: '#2F6FDE' },
  REJECTED: { label: 'Rejected', color: '#FF5630' },
};

export const TYPE_LABEL = {
  VIDEO: 'Video',
  PHOTO: 'Photos',
  RAW_FOOTAGE: 'Raw Footages',
};

export const VISIBLE_COUNT = 3;

export const TYPE_ORDER = ['VIDEO', 'RAW_FOOTAGE', 'PHOTO'];

// Statuses waiting on an admin (review content, or check a posted link)
export const NEEDS_ACTION = ['PENDING_REVIEW', 'CLIENT_FEEDBACK', 'APPROVE_LINK'];

export const COLORS = {
  text: '#231F20',
  textSecondary: '#636366',
  muted: '#8E8E93',
  border: '#C9C9C9',
  hover: '#EBEBEB',
  surface: '#F5F5F5',
  link: '#1340FF',
};
