import { useMemo } from 'react';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

import { Box, Grid, Link, List, Stack, Avatar, Divider, ListItem, Typography } from '@mui/material';

import { formatReservationSlot } from 'src/utils/reservation-time';

import Iconify from 'src/components/iconify';

const getStatusConfig = (currentStatus, isReservation) => {
  switch (currentStatus) {
    case 'PENDING_ASSIGNMENT':
      return isReservation
        ? { label: 'unconfirmed', color: '#B0B0B0', bgColor: '#EFEFEF' }
        : { label: 'unassigned', color: '#B0B0B0', bgColor: '#EFEFEF', hasAction: true };
    case 'SCHEDULED':
      return isReservation
        ? { label: 'scheduled', color: '#1340FF', bgColor: '#E3F2FD' }
        : { label: 'yet to ship', color: '#FF9A02', bgColor: '#FFF7DB' };
    case 'SHIPPED':
      return {
        label: 'shipped out',
        color: '#8A5AFE',
        bgColor: '#ECE4FF',
        hasAction: false,
      };
    case 'DELIVERED':
      return {
        label: 'delivered',
        color: '#1ABF66',
        bgColor: '#DCFAE6',
        hasAction: false,
      };
    case 'RECEIVED':
    case 'COMPLETED':
      return {
        label: 'completed',
        color: '#1ABF66',
        bgColor: '#DCFAE6',
        hasAction: false,
      };
    case 'ISSUE_REPORTED':
      return {
        label: isReservation ? 'issue' : 'failed',
        color: '#FF3500',
        bgColor: '#FFD0C9',
        hasAction: true,
      };
    default:
      return {
        label: currentStatus,
        color: '#B0B0B0',
        bgColor: '#EFEFEF',
        hasAction: false,
      };
  }
};

function ScheduledItem({ item, isReservation, onClick }) {
  const creator = item.creator || {};
  const statusConfig = getStatusConfig(item.status, isReservation);

  const details = isReservation ? item.reservationDetails : item.deliveryDetails || {};

  let mainInfo = '-';
  if (isReservation) {
    mainInfo = details?.outlet || 'No Outlet Selected';
  } else if (details?.items) {
    if (Array.isArray(details.items)) {
      mainInfo = details.items
        .map((i) => i.product?.productName)
        .filter(Boolean)
        .join(', ');
    } else {
      mainInfo = details.items;
    }
  }

  // 2. Get Secondary Info (Tracking vs Time Slot)
  const renderSecondaryInfo = () => {
    if (isReservation) {
      const selectedSlot = details?.slots?.find((s) => s.status === 'SELECTED');
      if (selectedSlot) {
        return (
          <Typography variant="body2" sx={{ color: '#231F20', fontWeight: 600 }}>
            {formatReservationSlot(selectedSlot.startTime, selectedSlot.endTime)}
          </Typography>
        );
      }
      return (
        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
          Not scheduled
        </Typography>
      );
    }

    // Delivery Logic
    if (details?.trackingLink) {
      return (
        <Link
          href={details.trackingLink}
          target="_blank"
          rel="noopener"
          variant="body2"
          sx={{ color: '#0062CD', textDecoration: 'underline' }}
        >
          Tracking Link
        </Link>
      );
    }
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
        No tracking info
      </Typography>
    );
  };

  return (
    <ListItem
      sx={{
        px: 3,
        py: 1,
        alignItems: 'flex-start',
        cursor: 'pointer',
        borderRadius: '10px',
        transition: 'background-color 0.2s',
        '&:hover': {
          bgcolor: 'rgba(0, 0, 0, 0.03)',
        },
      }}
      onClick={() => onClick(item.id)}
    >
      <Box sx={{ width: '2px', height: 65, bgcolor: '#1340FF', mr: 2, flexShrink: 0 }} />
      <Avatar alt={creator?.name} src={creator?.photoURL} sx={{ width: 30, height: 30, mr: 2 }} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="body"
            noWrap
            sx={{ fontSize: '20px', fontWeight: 500, fontFamily: 'Inter', mt: -0.5 }}
          >
            {creator.name || 'Unknown Creator'}
          </Typography>
          <Box
            sx={{
              px: 0.5,
              py: 0.25,
              borderRadius: '4px',
              backgroundColor: statusConfig.bgColor,
              color: statusConfig.color,
              border: `1px solid ${statusConfig.bgColor}`,
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'capitalize',
              mt: -0.5,
            }}
          >
            {statusConfig.label}
          </Box>
        </Stack>

        <Typography
          variant="body"
          sx={{
            color: '#8E8E93',
            fontSize: '14px',
            fontWeight: 400,
            fontFamily: 'Inter',
          }}
        >
          {creator.phoneNumber || '-'}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="body2"
            textTransform={isReservation ? 'capitalize' : ''}
            sx={{
              color: '#8E8E93',
              fontSize: '14px',
              fontFamily: 'Inter',
              fontWeight: 600,
              maxWidth: '60%',
            }}
          >
            {mainInfo}
          </Typography>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ height: 14, alignSelf: 'center', color: '#8E8E93' }}
          />
          {renderSecondaryInfo()}
        </Stack>
      </Box>
    </ListItem>
  );
}

ScheduledItem.propTypes = {
  item: PropTypes.object,
  isReservation: PropTypes.bool,
  onClick: PropTypes.func,
};

export default function LogisticsScheduledList({
  date,
  logistics,
  isReservation,
  onClick,
  reservationConfig,
}) {
  const safeLogistics = logistics || [];
  const dateString = format(date, 'yyyy-MM-dd');

  const savedSlots = useMemo(() => {
    if (!isReservation || !reservationConfig?.availabilityRules) return [];

    const rules = reservationConfig.availabilityRules;

    return rules
      .filter((rule) =>
        rule.dates?.some((d) => {
          if (!d) return false;
          const ruleDateString =
            typeof d === 'string' ? d.split('T')[0] : format(new Date(d), 'yyyy-MM-dd');
          return ruleDateString === dateString;
        })
      )
      .flatMap((rule) => rule.slots || [])
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [isReservation, reservationConfig, dateString]);

  const dayLogistics = safeLogistics
    .filter((item) => {
      if (isReservation) {
        const selectedSlot = item.reservationDetails?.slots?.find((s) => s.status === 'SELECTED');
        if (!selectedSlot) return false;
        // return isSameDay(new Date(selectedSlot.startTime), date);
        return selectedSlot?.startTime.startsWith(dateString);
      }

      if (!item.deliveryDetails?.expectedDeliveryDate) return false;
      // return isSameDay(new Date(item.deliveryDetails.expectedDeliveryDate), date);
      return item.deliveryDetails?.expectedDeliveryDate?.startsWith(dateString);
    })
    .sort((a, b) => {
      const getCompareTime = (item) => {
        if (isReservation) {
          return (
            item.reservationDetails?.slots?.find((s) => s.status === 'SELECTED')?.startTime || ''
          );
        }
        return item.deliveryDetails?.expectedDeliveryDate || '';
      };

      return getCompareTime(a).localeCompare(getCompareTime(b));
    });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: '14px', py: '12px' }}>
        <Iconify icon="material-symbols:calendar-clock-outline" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#231F20', size: '12px' }}>
          {isReservation ? 'SCHEDULED VISITS ' : 'SCHEDULED DELIVERIES'}
        </Typography>
      </Stack>
      <Divider />
      <Typography variant="h6" sx={{ px: '14px', pt: '8px' }}>
        {format(date, 'EEEE, d MMMM yyyy')}
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: '14px' }}>
        {isReservation && (
          <Box sx={{ mt: 1, mb: 1 }}>
            {savedSlots.length > 0 && (
              <>
                <Typography variant="h7" sx={{ fontWeight: 700, mb: 1 }}>
                  Saved Timeslots
                </Typography>
                <Grid container>
                  {savedSlots.map((slot, idx) => (
                    <Grid item key={idx}>
                      <Typography sx={{ color: '#636366', display: 'inline-block', mr: 0.8 }}>
                        {slot.label || `${slot.startTime} - ${slot.endTime}`}
                        {idx < savedSlots.length - 1 ? ',' : ''}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Box>
        )}
        {isReservation && dayLogistics.length > 0 && (
          <Typography variant="h7" sx={{ fontWeight: 700 }}>
            Creators
          </Typography>
        )}

        {dayLogistics.length === 0 ? (
          <Box sx={{ flexGrow: 0, overflowY: 'hidden', height: 170, px: 0.5 }}>
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: savedSlots.length > 0 ? 'flex-start' : 'center',
                color: 'text.disabled',
                minHeight: 200,
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: '#F4F6F8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // mb: 2,
                }}
              >
                <Typography sx={{ fontSize: 40 }}>🤭</Typography>
              </Box>

              {/* Title */}
              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'instrument serif',
                  color: '#231F20',
                  fontWeight: 400,
                }}
              >
                No {isReservation ? 'visits' : 'deliveries'} scheduled.
              </Typography>

              {/* Subtitle */}
              <Typography variant="body2" sx={{ color: '#636366', fontWeight: 400 }}>
                Scheduled {isReservation ? 'visits' : 'deliveries'} will show up here.
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 0, overflowY: 'auto', height: 150, px: 0.5 }}>
            <List disablePadding>
              {dayLogistics.map((item) => (
                <ScheduledItem
                  key={item.id}
                  item={item}
                  isReservation={isReservation}
                  onClick={onClick}
                />
              ))}
            </List>
          </Box>
        )}
      </Box>
    </Box>
  );
}

LogisticsScheduledList.propTypes = {
  date: PropTypes.object,
  logistics: PropTypes.array,
  isReservation: PropTypes.bool,
  onClick: PropTypes.func,
  reservationConfig: PropTypes.object,
};
