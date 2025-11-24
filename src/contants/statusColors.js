// Centralized status colors for both admin and client submission components
export const STATUS_COLORS = {
  PENDING_REVIEW: '#FFC702',
  IN_PROGRESS: '#8A5AFE', 
  APPROVED: '#1ABF66',
  POSTED: '#1ABF66',
  REJECTED: '#D4321C',
  CHANGES_REQUIRED: '#D4321C',
  SENT_TO_CLIENT: '#8A5AFE',
  CLIENT_APPROVED: '#1ABF66',
  CLIENT_FEEDBACK: '#FFC702',
  SENT_TO_ADMIN: '#8A5AFE',
  NOT_STARTED: '#8E8E93'
};

// Helper function to get status color
export const getStatusColor = (status) => 
   STATUS_COLORS[status] || '#e0e0e0' // Default gray color
;