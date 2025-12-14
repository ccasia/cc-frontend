import PropTypes from 'prop-types';
import { format, isSameDay } from 'date-fns';

import { Box, Link, List, Stack, Avatar, Divider, ListItem, Typography } from '@mui/material';

import Scrollbar from 'src/components/scrollbar';
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

function ScheduledItem({ item, isReservation }) {
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

  // const statusConfig = getStatusConfig(item.status);
  // const trackingLink = deliveryDetails.trackingLink;

  //   return (
  //     <ListItem
  //       sx={{
  //         px: 4,
  //         py: 2,
  //         alignItems: 'flex-start',
  //       }}
  //     >
  //       <Box
  //         sx={{
  //           width: '2px',
  //           height: 65,
  //           bgcolor: '#1340FF',
  //           mr: 2,
  //           // mt: 0.5,
  //           flexShrink: 0,
  //         }}
  //       />
  //       <Avatar alt={creator?.name} src={creator?.photoURL} sx={{ width: 30, height: 30, mr: 2 }} />
  //       <Box sx={{ flexGrow: 1, minWidth: 0 }}>
  //         <Stack direction="row" alignItems="center" spacing={1}>
  //           <Typography variant="subtitle1" noWrap>
  //             {creator.name || 'Unknown Creator'}
  //           </Typography>
  //           <Box
  //             sx={{
  //               px: 0.5,
  //               py: 0.25,
  //               borderRadius: '4px',
  //               backgroundColor: statusConfig.bgColor,
  //               color: statusConfig.color,
  //               border: `1px solid ${statusConfig.bgColor}`,
  //               fontSize: '10px',
  //               fontWeight: 600,
  //               textTransform: 'capitalize',
  //               whiteSpace: 'nowrap',
  //             }}
  //           >
  //             {statusConfig.label}
  //           </Box>
  //         </Stack>

  //         <Typography variant="body2" sx={{ color: 'text.primary' }}>
  //           {creator.phoneNumber || '-'}
  //         </Typography>

  //         <Stack direction="row" alignItems="center" spacing={1}>
  //           <Typography
  //             variant="body2"
  //             sx={{ color: 'text.secondary', maxWidth: '60%', fontWeight: 600 }}
  //           >
  //             {productString}
  //           </Typography>
  //           <Divider
  //             orientation="vertical"
  //             flexItem
  //             sx={{ height: 14, alignSelf: 'center', color: '#8E8E93' }}
  //           />
  //           {trackingLink ? (
  //             <Link
  //               href={trackingLink}
  //               target="_blank"
  //               rel="noopener"
  //               variant="body2"
  //               sx={{
  //                 color: '#0062CD',
  //                 textDecoration: 'underline',
  //                 fontWeight: 400,
  //                 cursor: 'pointer',
  //               }}
  //             >
  //               Tracking Link
  //             </Link>
  //           ) : (
  //             <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
  //               No tracking info
  //             </Typography>
  //           )}
  //         </Stack>
  //       </Box>
  //     </ListItem>
  //   );
  // }
  // 2. Get Secondary Info (Tracking vs Time Slot)
  const renderSecondaryInfo = () => {
    if (isReservation) {
      const selectedSlot = details?.slots?.find((s) => s.status === 'SELECTED');
      if (selectedSlot) {
        return (
          <Typography variant="body2" sx={{ color: '#1340FF', fontWeight: 600 }}>
            {format(new Date(selectedSlot.startTime), 'h:mm a')} -{' '}
            {format(new Date(selectedSlot.endTime), 'h:mm a')}
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
    <ListItem sx={{ px: 4, py: 2, alignItems: 'flex-start' }}>
      <Box sx={{ width: '2px', height: 65, bgcolor: '#1340FF', mr: 2, flexShrink: 0 }} />
      <Avatar alt={creator?.name} src={creator?.photoURL} sx={{ width: 30, height: 30, mr: 2 }} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle1" noWrap>
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
            }}
          >
            {statusConfig.label}
          </Box>
        </Stack>

        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {creator.phoneNumber || '-'}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', maxWidth: '60%', fontWeight: 600 }}
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
};

export default function LogisticsScheduledList({ date, logistics, isReservation }) {
  const safeLogistics = logistics || [];

  const dayLogistics = safeLogistics.filter((item) => {
    if (isReservation) {
      const selectedSlot = item.reservationDetails?.slots?.find((s) => s.status === 'SELECTED');
      if (!selectedSlot) return false;
      return isSameDay(new Date(selectedSlot.startTime), date);
    }

    if (!item.deliveryDetails?.expectedDeliveryDate) return false;
    return isSameDay(new Date(item.deliveryDetails.expectedDeliveryDate), date);
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
      <Typography variant="h6" sx={{ px: '14px', py: '12px' }}>
        {format(date, 'EEEE, d MMMM yyyy')}
      </Typography>

      <Box sx={{ flexGrow: 0, overflowY: 'auto', height: 250, px: 0.5 }}>
        {dayLogistics.length === 0 ? (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
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
                // mb: 1,
              }}
            >
              No {isReservation ? 'visits' : 'deliveries'} scheduled.
            </Typography>

            {/* Subtitle */}
            <Typography variant="body2" sx={{ color: '#636366', fontWeight: 400 }}>
              Scheduled {isReservation ? 'visits' : 'deliveries'} will show up here.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {dayLogistics.map((item) => (
              <ScheduledItem key={item.id} item={item} isReservation={isReservation} />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}

LogisticsScheduledList.propTypes = {
  date: PropTypes.object,
  logistics: PropTypes.array,
  isReservation: PropTypes.bool,
};
