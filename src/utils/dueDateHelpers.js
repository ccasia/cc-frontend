import dayjs from 'dayjs';

/**
 * Get due date status and information for display
 * @param {string|null} dueDate - ISO date string or null
 * @returns {Object|null} Due date information object or null if no due date
 */
export const getDueDateInfo = (dueDate) => {
  if (!dueDate) return null;
  
  const now = dayjs();
  const dueDateObj = dayjs(dueDate);
  const daysUntilDue = dueDateObj.diff(now, 'days');
  const hoursUntilDue = dueDateObj.diff(now, 'hours');
  
  if (daysUntilDue < 0) {
    return { 
      status: 'overdue', 
      message: `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`,
      color: 'error',
      severity: 'error',
      formattedDate: dueDateObj.format('DD/MM/YYYY')
    };
  }
  
  if (daysUntilDue === 0) {
    if (hoursUntilDue < 0) {
      return { 
        status: 'overdue', 
        message: 'Overdue',
        color: 'error',
        severity: 'error',
        formattedDate: dueDateObj.format('DD/MM/YYYY')
      };
    }
    return { 
      status: 'due_today', 
      message: `Due today (${hoursUntilDue}h remaining)`,
      color: 'error',
      severity: 'warning',
      formattedDate: dueDateObj.format('DD/MM/YYYY')
    };
  }
  
  if (daysUntilDue === 1) {
    return { 
      status: 'due_tomorrow', 
      message: 'Due tomorrow',
      color: 'warning',
      severity: 'warning',
      formattedDate: dueDateObj.format('DD/MM/YYYY')
    };
  }
  
  if (daysUntilDue <= 3) {
    return { 
      status: 'due_soon', 
      message: `Due in ${daysUntilDue} days`,
      color: 'warning',
      severity: 'info',
      formattedDate: dueDateObj.format('DD/MM/YYYY')
    };
  }
  
  return { 
    status: 'due_later', 
    message: `Due in ${daysUntilDue} days`,
    color: 'success',
    severity: 'info',
    formattedDate: dueDateObj.format('DD/MM/YYYY')
  };
};

/**
 * Get due date status for admin view (simpler version)
 * @param {string|null} dueDate - ISO date string or null
 * @returns {Object|null} Due date status object or null if no due date
 */
export const getDueDateStatus = (dueDate) => {
  if (!dueDate) return null;
  
  const now = dayjs();
  const dueDateObj = dayjs(dueDate);
  const daysUntilDue = dueDateObj.diff(now, 'days');
  
  if (daysUntilDue < 0) {
    return { 
      color: 'error', 
      label: 'Overdue',
      formattedDate: dueDateObj.format('DD/MM/YYYY')
    };
  }
  
  if (daysUntilDue === 0) {
    return { 
      color: 'warning', 
      label: 'Due Today',
      formattedDate: dueDateObj.format('DD/MM/YYYY')
    };
  }
  
  if (daysUntilDue <= 3) {
    return { 
      color: 'warning', 
      label: `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
      formattedDate: dueDateObj.format('DD/MM/YYYY')
    };
  }
  
  return { 
    color: 'success', 
    label: `${daysUntilDue} days`,
    formattedDate: dueDateObj.format('DD/MM/YYYY')
  };
};