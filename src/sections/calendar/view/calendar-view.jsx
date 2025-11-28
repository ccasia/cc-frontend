import Calendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import { useState, useEffect } from 'react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';
import interactionPlugin from '@fullcalendar/interaction';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { Divider } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';

import { useResponsive } from 'src/hooks/use-responsive';

import { updateEvent, useGetEvents } from 'src/api/calendar';
import { CALENDAR_COLOR_OPTIONS } from 'src/_mock/_calendar';

import { useSettingsContext } from 'src/components/settings';

import { StyledCalendar } from '../styles';
import CalendarForm from '../calendar-form';
import { useEvent, useCalendar } from '../hooks';
import EventDetails from './calendar-view-details';
import CalendarViewMobile from './calendar-view-mobile';

// ----------------------------------------------------------------------

export default function CalendarView() {
  const theme = useTheme();

  const settings = useSettingsContext();

  const isMobile = useResponsive('down', 'md');

  const { events } = useGetEvents();
  const {
    calendarRef,
    view,
    date,
    onDatePrev,
    onDateNext,
    onDateToday,
    onDropEvent,
    onSelectRange,
    onResizeEvent,
    onInitialView,
    openForm,
    onCloseForm,
    selectEventId,
    selectedRange,
  } = useCalendar();

  const currentEvent = useEvent(events, selectEventId, selectedRange, openForm);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    onInitialView();
  }, [onInitialView]);

  const handleEventClick = (eventInfo) => {
    console.log('Event Info:', eventInfo.event);
    setSelectedEvent(eventInfo.event);
    setDrawerOpen(true);
  };

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'xl'}>
        {/* Mobile View */}
        {isMobile ? (
          <CalendarViewMobile
            date={date}
            events={events}
            onDatePrev={onDatePrev}
            onDateNext={onDateNext}
            onDateToday={onDateToday}
            onEventClick={handleEventClick}
            selectedEvent={selectedEvent}
            drawerOpen={drawerOpen}
            onCloseDrawer={() => setDrawerOpen(false)}
          />
        ) : (
          <>
            {/* Desktop View */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                mb: { xs: 3, md: 2 },
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontFamily: theme.typography.fontSecondaryFamily,
                  fontWeight: 'normal',
                }}
              >
                {date.toLocaleString('default', { month: 'long' })} {date.getFullYear()}
              </Typography>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Button
                  onClick={onDateToday}
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
                <Button
                  onClick={onDatePrev}
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
                <Button
                  onClick={onDateNext}
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
            <Card>
              <StyledCalendar>
                <Calendar
                  weekends
                  editable={!isMobile}
                  droppable={!isMobile}
                  selectable
                  rerenderDelay={10}
                  allDayMaintainDuration
                  eventResizableFromStart={!isMobile}
                  ref={calendarRef}
                  initialDate={date}
                  initialView={view}
                  dayMaxEventRows={isMobile ? false : 3}
                  eventDisplay="block"
                  events={events}
                  headerToolbar={false}
                  select={onSelectRange}
                  eventClick={handleEventClick}
                  height="auto"
                  contentHeight="auto"
                  aspectRatio={isMobile ? 1.2 : 1.35}
                  handleWindowResize
                  stickyHeaderDates={false}
                  fixedWeekCount={false}
                  eventDrop={(arg) => {
                    onDropEvent(arg, updateEvent);
                  }}
                  eventResize={(arg) => {
                    onResizeEvent(arg, updateEvent);
                  }}
                  plugins={[
                    listPlugin,
                    dayGridPlugin,
                    timelinePlugin,
                    timeGridPlugin,
                    interactionPlugin,
                  ]}
                  dayCellContent={(dayInfo) => {
                    const datee = new Date(dayInfo.date);
                    const isFirstOfMonth = datee.getDate() === 1;

                    // Check if the date is the first of the month
                    if (isFirstOfMonth) {
                      const formattedDate = `${datee.getDate()}${datee.toLocaleString('default', {
                        month: 'short',
                      })}`;
                      return <div>{formattedDate}</div>;
                    }
                    return <div>{datee.getDate()}</div>;
                  }}
                  // Content format for different media screen
                  eventContent={(eventInfo) => {
                    const { start, end, title, backgroundColor } = eventInfo.event;
                    const isSmallScreen = window.innerWidth < 600;

                    const labelColor =
                      CALENDAR_COLOR_OPTIONS.find((option) => option.color === backgroundColor)
                        ?.labelColor || 'black';

                    const eventTitleStyle = {
                      '--label-color': labelColor,
                      color: 'var(--label-color)',
                    };

                    if (isSmallScreen) {
                      return (
                        <div
                          style={{
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                          }}
                        >
                          {title}
                        </div>
                      );
                    }

                    const startTime = start
                      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                      .replace(' ', '');
                    const endTime = end
                      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                      .replace(' ', '');

                    return (
                      <div
                        style={{
                          ...eventTitleStyle,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                        }}
                      >
                        ({startTime}-{endTime}) {title}
                      </div>
                    );
                  }}
                />
              </StyledCalendar>
            </Card>
          </>
        )}
      </Container>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={openForm}
        onClose={onCloseForm}
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: theme.transitions.duration.shortest - 80,
        }}
      >
        <DialogTitle sx={{ minHeight: 76 }}>
          {openForm && (
            <div
              style={{
                width: '200px',
                height: '40px',
                fontFamily: 'Instrument Serif',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '36px',
                lineHeight: '40px',
              }}
            >
              <span role="img" aria-label="calendar" style={{ marginRight: '8px' }}>
                📅
              </span>
              New Event
            </div>
          )}
          <Divider
            sx={{
              my: 2,
            }}
          />
        </DialogTitle>

        <CalendarForm
          currentEvent={currentEvent}
          colorOptions={CALENDAR_COLOR_OPTIONS}
          onClose={onCloseForm}
        />
      </Dialog>

      {/* Desktop Event Details - Shows in drawer */}
      <EventDetails
        open={drawerOpen && !isMobile}
        onClose={() => setDrawerOpen(false)}
        currentEvent={selectedEvent}
        colorOptions={CALENDAR_COLOR_OPTIONS}
      />
    </>
  );
}
