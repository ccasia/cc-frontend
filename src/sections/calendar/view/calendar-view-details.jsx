import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Drawer, 
  Typography, 
  Divider, 
  Dialog, 
  DialogTitle, 
  DialogActions, 
  Tooltip, 
  IconButton,
  Button
} from '@mui/material';

import { useSnackbar } from 'src/components/snackbar';
import { useTheme } from '@mui/material/styles';
import Iconify from 'src/components/iconify';

import CalendarForm from '../calendar-form';
import { CALENDAR_COLOR_OPTIONS } from 'src/_mock/_calendar';
import { deleteEvent, useGetEvents } from 'src/api/calendar';

export default function EventDetails({ open, onClose, currentEvent, colorOptions }) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [openForm, setOpenForm] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false); 
  const { events } = useGetEvents(); 

  const eventDetails = events.find(event => event.id === currentEvent?.id);  

  const onEdit = useCallback(() => {
    setOpenForm(true);
  }, []);

  const onCloseForm = useCallback(() => {
    setOpenForm(false); 
  }, []);

  const onDelete = useCallback(() => {
    setOpenConfirmDelete(true);
  }, []);

  const handleConfirmDelete = async () => {
    try {
      await deleteEvent(currentEvent.id);
      enqueueSnackbar('👋 Event removed');
      onClose(); 
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Delete failed!');
    }
    setOpenConfirmDelete(false);
  };

  const handleCancelDelete = () => {
    setOpenConfirmDelete(false); 
  };

  const formatDate = (start, end) => {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };

    const startDate = new Date(start).toLocaleDateString(undefined, dateOptions);
    const startTime = new Date(start).toLocaleTimeString(undefined, timeOptions);
    const endTime = new Date(end).toLocaleTimeString(undefined, timeOptions);

    return `${startDate} : ${startTime} - ${endTime}`;
  };

  const renderDescription = (description) => {
    if (!description) return 'No description available';

    return description.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box sx={{ maxWidth: 400, padding: 2.5 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 2
            }}
          >
            <Typography 
              variant="h2"
              sx={{ 
                fontFamily: 'Instrument Serif',
                fontWeight: 400,
                display: 'flex',
              }}
            >
              Event Details
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <DialogActions>
                <Tooltip title="Quick Edit" placement="top" arrow>
                  <IconButton
                    color="default"
                    onClick={onEdit}
                    sx={{ 
                      width: '40px',
                      height: '40px',
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      boxShadow: (theme) => `0px 1px 1px 1px ${theme.palette.grey[500]}`
                    }}
                  >
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete" placement="top" arrow>
                  <IconButton
                    color="error"
                    onClick={onDelete}
                    sx={{ 
                      width: '40px',
                      height: '40px',
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      boxShadow: (theme) => `0px 1px 1px 1px ${theme.palette.grey[500]}`
                    }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              </DialogActions>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {eventDetails ? (
            <>
              <Typography 
                variant="h4"
                sx={{ maxWidth: 400, overflowWrap: 'break-word' }}
                >
                {renderDescription(eventDetails.title)}
              </Typography>

              <Typography variant="body2" color="#454F5B" paddingBottom={2}>
                {formatDate(eventDetails.start, eventDetails.end)}
              </Typography>

              <Typography 
                variant="body2" 
                sx={{ maxWidth: 400, overflowWrap: 'break-word' }}
              >
                {renderDescription(eventDetails.description)}
              </Typography>

              <Typography variant="body2" color="#454F5B" display="flex" alignItems="center" paddingTop={2}>
                <Typography variant="body2" sx={{ color: theme => theme.palette.grey[600], marginRight: '8px' }}>
                  Label:
                </Typography>
                {colorOptions.map(({ color, label, labelColor }) => {
                  return eventDetails.color === color ? (
                    <Box key={color} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                      sx={{
                        backgroundColor: color,
                        borderRadius: 1,
                        padding: '2px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '25px',
                      }}>
                      <span
                        style={{
                          color: labelColor, 
                          fontSize: '12px',
                          fontWeight: '700',
                          textAlign: 'center',
                        }}>
                          {label}
                        </span>
                      </Box>
                    </Box>
                  ) : null ;
                })}
              </Typography>
            </>
          ) : (
            <Typography variant="body2">No event selected</Typography>
          )}
        </Box>
      </Drawer>

      <Dialog
        open={openConfirmDelete}
        onClose={handleCancelDelete}
        aria-labelledby="delete-confirm-dialog"
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
          textAlign="center"
          mt={2}
          sx={{ padding: 3 }}
        >
          <Box
            style={{
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              backgroundColor: '#FF3500',
              borderRadius: '50%',
              marginBottom: '16px',
            }}
          >
            😯
          </Box>
          <Typography variant="h3" style={{ fontFamily: 'Instrument Serif', fontWeight: 550 }}>
            Delete event
          </Typography>
          <Typography variant="body1" color="#636366">
            Are you sure you want to delete this event?
          </Typography>

          <Box sx={{ marginTop: 3, display: 'flex', gap: 2, flexDirection: 'column' }}>
            <Button
              variant="contained"
              onClick={handleConfirmDelete}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px 16px 13px',
                gap: '6px',
                width: '352px',
                height: '44px',
                background: '#3A3A3C',
                boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
                borderRadius: '8px',
                flex: 'none',
                order: 1,
                alignSelf: 'stretch',
                flexGrow: 0,
              }}
            >
              Yes
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleCancelDelete}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px 16px 13px',
                gap: '6px',
                width: '352px',
                height: '44px',
                background: '#FFFFFF',
                border: '1px solid #E8E8E8',
                boxShadow: 'inset 0px -3px 0px #E7E7E7',
                borderRadius: '8px',
                flex: 'none',
                order: 2,
                alignSelf: 'stretch',
                flexGrow: 0,
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={openForm && currentEvent?.id}
        onClose={onCloseForm}
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: theme.transitions.duration.shortest - 80,
        }}
      >
        <DialogTitle sx={{ minHeight: 76 }}>
          <div style={{
            width: '200px',
            height: '40px',
            fontFamily: 'Instrument Serif',
            fontWeight: 400,
            fontSize: '36px',
            lineHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            color: '#231F20',
          }}>
            <span role="img" aria-label="calendar" style={{ marginRight: '8px' }}>📅</span>
            {'Edit Event'}
          </div>
          <Divider sx={{ my: 2 }} />
        </DialogTitle>

        {eventDetails?.id && (
          <CalendarForm
            currentEvent={eventDetails}
            colorOptions={CALENDAR_COLOR_OPTIONS}
            onClose={onCloseForm}
          />
        )}
      </Dialog>
    </>
  );
};
