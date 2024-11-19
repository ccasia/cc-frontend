import { alpha, styled } from '@mui/material/styles';

// ----------------------------------------------------------------------

export const StyledCalendar = styled('div')(({ theme }) => ({
  width: 'calc(100% + 2px)',
  marginLeft: -1,
  marginBottom: -1,

  '& .fc': {
    '--fc-border-color': alpha(theme.palette.grey[500], 0.16),
    '--fc-now-indicator-color': theme.palette.error.main,
    '--fc-today-bg-color': alpha(theme.palette.grey[0], 0.08),
    '--fc-page-bg-color': theme.palette.background.default,
    '--fc-neutral-bg-color': theme.palette.background.neutral,
    '--fc-list-event-hover-bg-color': theme.palette.action.hover,
    '--fc-highlight-color': theme.palette.action.hover,
  },

  '& .fc .fc-license-message': { display: 'none' },
  '& .fc a': { color: theme.palette.text.primary },

  // Table Head
  '& .fc .fc-col-header': {
    boxShadow: `inset 0 -1px 0 ${theme.palette.divider}`,
    backgroundColor: alpha(theme.palette.grey[500], 0.10),
    '& th': {
      borderColor: alpha(theme.palette.grey[500], 0.16),
      textAlign: 'right',
    },
    '& .fc-col-header-cell-cushion': {
      ...theme.typography.subtitle2,
      padding: '10px 7px',
      textAlign: 'right',
    },
  },

  // List Empty
  '& .fc .fc-list-empty': {
    ...theme.typography.h6,
    backgroundColor: 'transparent',
    color: theme.palette.text.secondary,
  },

  // Event
  '& .fc .fc-event': {
    borderColor: 'transparent !important',
    backgroundColor: 'transparent !important',
  },
  '& .fc .fc-event .fc-event-main': {
    padding: '2px 4px',
    borderRadius: 6,
    backgroundColor: theme.palette.common.white,
    '&:before': {
      top: 0,
      left: 0,
      width: '100%',
      content: "''",
      opacity: 0.24,
      height: '100%',
      borderRadius: 6,
      position: 'absolute',
      backgroundColor: 'currentColor',
      transition: theme.transitions.create(['opacity']),
      '&:hover': {
        '&:before': {
          opacity: 0.32,
        },
      },
    },
  },
  '& .fc .fc-event .fc-event-main-frame': {
    fontSize: 12,
    lineHeight: '10px',
    filter: 'brightness(0.48)',
  },
  '& .fc .fc-daygrid-event .fc-event-title': {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    color: 'currentColor',
  },
  '& .fc .fc-event .fc-event-time': {
    overflow: 'unset',
    fontWeight: theme.typography.fontWeightBold,
    color: 'currentColor',
  },

  // Popover
  '& .fc .fc-popover': {
    border: 0,
    overflow: 'hidden',
    maxWidth: '300px',
    boxShadow: theme.customShadows.dropdown,
    borderRadius: theme.shape.borderRadius * 1.5,
    backgroundColor: theme.palette.background.paper,
  },
  '& .fc .fc-popover-header': {
    ...theme.typography.subtitle2,
    padding: theme.spacing(1),
    backgroundColor: alpha(theme.palette.grey[500], 0.08),
  },
  '& .fc .fc-popover-close': {
    opacity: 0.48,
    transition: theme.transitions.create(['opacity']),
    '&:hover': { opacity: 1 },
  },
  '& .fc .fc-more-popover .fc-popover-body': {
    padding: theme.spacing(1),
  },
  '& .fc .fc-popover-body': {
    '& .fc-daygrid-event.fc-event-start, & .fc-daygrid-event.fc-event-end': {
      margin: '2px 0',
    },
  },

  // Month View
  '& .fc .fc-day-other .fc-daygrid-day-top': {
    opacity: 1,
    '& .fc-daygrid-day-number': {
      color: theme.palette.text.disabled,
    },
  },
  '& .fc .fc-daygrid-day-number': {
    ...theme.typography.body2,
    padding: theme.spacing(1, 1, 0),
  },
  '& .fc .fc-daygrid-event': {
    marginTop: 4,
  },
  '& .fc .fc-daygrid-event.fc-event-start, & .fc .fc-daygrid-event.fc-event-end': {
    marginLeft: 4,
    marginRight: 4,
  },
  '& .fc .fc-daygrid-more-link': {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    '&:hover': {
      backgroundColor: 'unset',
      textDecoration: 'underline',
      color: theme.palette.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
    },
  },

  // Highlight Today
  '& .fc .fc-day-today': {
    opacity: 1,
    '& .fc-daygrid-day-number': {
      color: theme.palette.text.disabled,
    },
  },
  '& .fc .fc-day-today .fc-daygrid-day-number': {
    width: '30px',
    height: '30px',
    display: 'flex',
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#1340FF', 
    color: '#FFFFFF', 
    borderRadius: '50%',
    fontWeight: theme.typography.fontWeightBold, 
    position: 'absolute', 
    top: '5px', 
    right: '5px',
    lineHeight: '1', 
    padding: '0', 
    boxSizing: 'border-box',
    zIndex: 2,
  },

  '& .fc .fc-daygrid-day.fc-day-today .fc-event': {
    zIndex: 1,
    top: '35px', 
    paddingLeft: '5px',
  },

  '& .fc .fc-day-today .fc-daygrid-more-link': {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    top: '35px',
    '&:hover': {
      backgroundColor: 'unset',
      textDecoration: 'underline',
      color: theme.palette.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
    },
  },

  // Week & Day View
  '& .fc .fc-timegrid-axis-cushion': {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
  },
  '& .fc .fc-timegrid-slot-label-cushion': {
    ...theme.typography.body2,
  },

// Agenda View
 '& .fc-direction-ltr .fc-list-day-text, .fc-direction-rtl .fc-list-day-side-text, .fc-direction-ltr .fc-list-day-side-text, .fc-direction-rtl .fc-list-day-text': {
  ...theme.typography.subtitle2,
},
'& .fc-direction-ltr': {
  overflow:'auto'
},
'& .fc .fc-list-event': {
  ...theme.typography.body2,
  '& .fc-list-event-time': {
    color: theme.palette.text.secondary,
  },
},
'& .fc .fc-list-table': {
  '& th, td': {
    borderColor: 'transparent',
  },
},
}));
