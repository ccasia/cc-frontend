import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import Calendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { useTheme } from '@mui/material/styles';
import { Box, Card, Stack, Button, Divider, Typography } from '@mui/material';

import { CALENDAR_COLOR_OPTIONS } from 'src/_mock/_calendar';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function CalendarViewMobile({
  date,
  events,
  onEventClick,
  selectedEvent,
  drawerOpen,
  onCloseDrawer,
}) {
  const theme = useTheme();
  const calendarRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(date);

  // PropTypes are defined after the function to avoid reference errors

  const formatDate = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startDateStr = startDate.toLocaleDateString('default', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    
    const endDateStr = endDate.toLocaleDateString('default', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // If same date, show only once
    if (startDateStr === endDateStr) {
      return startDateStr;
    }

    return `${startDateStr} - ${endDateStr}`;
  };

  const renderDescription = (description) => {
    if (!description) return null;

    return description.split('\n').map((line, index) => (
      <Typography
        key={index}
        variant="body2"
        sx={{
          color: '#231F20',
          mb: index < description.split('\n').length - 1 ? 0.5 : 0,
        }}
      >
        {line}
      </Typography>
    ));
  };

  // defaultProps are defined after the function to avoid reference errors

  // Arrow handlers
  const handlePrev = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.prev();
      setCurrentDate(api.getDate());
    }
  };
  const handleNext = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.next();
      setCurrentDate(api.getDate());
    }
  };
  const handleToday = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.today();
      setCurrentDate(api.getDate());
    }
  };

  return (
    <Box>
      {/* Mobile Calendar Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            onClick={handlePrev}
            sx={{
              minWidth: 44,
              width: 44,
              height: 44,
              padding: 0,
              color: '#231F20',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E7',
              borderBottom: '3px solid #E7E7E7',
              '&:hover': {
                backgroundColor: '#f2f2f2',
                borderBottom: '3px solid #e7e7e7',
              },
            }}
          >
            <img src="/assets/icons/components/ic_chevron_left.svg" alt="Previous" />
          </Button>

          <Typography
            variant="h4"
            sx={{
              fontFamily: theme.typography.fontSecondaryFamily,
              fontWeight: 'normal',
              minWidth: 150,
              textAlign: 'center',
            }}
          >
            {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
          </Typography>

          <Button
            onClick={handleNext}
            sx={{
              minWidth: 44,
              width: 44,
              height: 44,
              padding: 0,
              color: '#231F20',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E7',
              borderBottom: '3px solid #E7E7E7',
              '&:hover': {
                backgroundColor: '#f2f2f2',
                borderBottom: '3px solid #e7e7e7',
              },
            }}
          >
            <img src="/assets/icons/components/ic_chevron_right.svg" alt="Next" />
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
        <Button
          onClick={handleToday}
          sx={{
            width: 80,
            height: 44,
            fontSize: 16,
            fontWeight: 600,
            color: '#231F20',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E7E7E7',
            borderBottom: '3px solid #E7E7E7',
            '&:hover': {
              backgroundColor: '#f2f2f2',
              borderBottom: '3px solid #e7e7e7',
            },
          }}
        >
          Today
        </Button>
      </Stack>

      {/* Mobile Calendar */}
      <Card
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          mb: 3,
        }}
      >
        <Box
          sx={{
            '& .fc': {
              '--fc-now-indicator-color': theme.palette.error.main,
              '--fc-today-bg-color': theme.palette.action.selected,
              '--fc-page-bg-color': theme.palette.background.default,
              '--fc-neutral-bg-color': theme.palette.background.neutral,
              '--fc-list-event-hover-bg-color': theme.palette.action.hover,
              '--fc-highlight-color': theme.palette.action.disabledBackground,
            },
            '& .fc .fc-col-header-cell-cushion': {
              padding: '8px 4px',
              fontSize: '0.875rem',
              fontWeight: 600,
            },
            '& .fc .fc-daygrid-day-number': {
              padding: '8px',
              fontSize: '0.875rem',
            },
            '& .fc .fc-daygrid-day.fc-day-today': {
              backgroundColor: 'var(--fc-today-bg-color)',
            },
            '& .fc .fc-event': {
              borderRadius: '4px',
              padding: '2px 4px',
              marginBottom: '2px',
              cursor: 'pointer',
              border: '1px solid transparent',
              transition: 'all 0.2s ease',
              position: 'relative',
              zIndex: 1,
            },
            '& .fc .fc-event.fc-event-selected': {
              outline: `1px solid ${
                selectedEvent
                  ? CALENDAR_COLOR_OPTIONS.find(
                      (option) => option.color === selectedEvent.backgroundColor
                    )?.labelColor || '#231F20'
                  : '#231F20'
              } !important`,
              borderRadius: '4px !important',
              transform: 'scale(1.01)',
              zIndex: 10,
              boxShadow: '#0000001A !important',
            },
            '& .fc .fc-event.fc-event-selected .fc-event-main': {
              borderRadius: '4px !important',
            },
            '& .fc .fc-event.fc-event-selected::after': {
              display: 'none !important',
            },
            '& .fc .fc-event:active, & .fc .fc-event:focus': {
              filter: 'none !important',
              opacity: '1 !important',
            },
            '& .fc .fc-event-title': {
              fontSize: '0.75rem',
              fontWeight: 500,
            },
            '& .fc .fc-scrollgrid': {
              borderStyle: 'solid',
            },
          }}
        >
          <Calendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={currentDate}
            events={events}
            height="auto"
            headerToolbar={false}
            selectable
            fixedWeekCount={false}
            dayMaxEvents={false}
            eventClick={(info) => {
              // Remove previous selection
              document.querySelectorAll('.fc-event-selected').forEach(el => {
                el.classList.remove('fc-event-selected');
              });
              // Add selected class to clicked event
              info.el.classList.add('fc-event-selected');
              // Call parent handler
              onEventClick(info);
            }}
            dayCellContent={(dayInfo) => {
              const datee = new Date(dayInfo.date);
              const isFirstOfMonth = datee.getDate() === 1;

              if (isFirstOfMonth) {
                const formattedDate = `${datee.getDate()}${datee.toLocaleString('default', {
                  month: 'short',
                })}`;
                return <div>{formattedDate}</div>;
              }
              return <div>{datee.getDate()}</div>;
            }}
            eventContent={(eventInfo) => {
              const { title, backgroundColor } = eventInfo.event;

              const labelColor =
                CALENDAR_COLOR_OPTIONS.find((option) => option.color === backgroundColor)
                  ?.labelColor || 'black';

              return (
                <div
                  style={{
                    color: labelColor,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                  }}
                >
                  {title}
                </div>
              );
            }}
          />
        </Box>
      </Card>

      {/* Mobile Event Details - Shows inline below calendar */}
      {drawerOpen && selectedEvent && (
        <Box p={1} mb={5}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Campaign Details</Typography>
              <Iconify
                icon="lets-icons:close-round"
                width={20}
                sx={{ color: '#636366' }}
                onClick={onCloseDrawer}
              />
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: theme.typography.fontFamily,
                  color: '#231F20',
                }}
              >
                {selectedEvent.title}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: '#636366',
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                {formatDate(selectedEvent.start, selectedEvent.end)}
              </Typography>

              {selectedEvent.extendedProps?.description && (
                <Box mb={3}>{renderDescription(selectedEvent.extendedProps.description)}</Box>
              )}

              <Stack direction="row" gap={1} alignItems="center">
                <Typography variant="caption" sx={{ color: '#636366' }}>Label:</Typography>
								<Box
									sx={{
										px: 1,
										py: 0.5,
										borderRadius: 1,
										lineHeight: 0,
										bgcolor: selectedEvent.backgroundColor,
									}}
								>
									<Typography 
										variant="caption"
										fontWeight={600}
										sx={{ 
											color: CALENDAR_COLOR_OPTIONS.find(
												(option) => option.color === selectedEvent.backgroundColor
											)?.labelColor || '#231F20',
										}}
									>
										{CALENDAR_COLOR_OPTIONS.find(
											(option) => option.color === selectedEvent.backgroundColor
										)?.label || 'Unknown'}
									</Typography>
								</Box>
              </Stack>
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

CalendarViewMobile.propTypes = {
  date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  events: PropTypes.arrayOf(PropTypes.object),
  onEventClick: PropTypes.func,
  selectedEvent: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    start: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    end: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    backgroundColor: PropTypes.string,
    extendedProps: PropTypes.shape({
      description: PropTypes.string,
    }),
  }),
  drawerOpen: PropTypes.bool,
  onCloseDrawer: PropTypes.func,
};

CalendarViewMobile.defaultProps = {
  date: new Date(),
  events: [],
  onEventClick: () => {},
  selectedEvent: null,
  drawerOpen: false,
  onCloseDrawer: () => {},
};
