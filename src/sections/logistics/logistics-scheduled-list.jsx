import PropTypes from 'prop-types';
import { format, isSameDay } from 'date-fns';

import {
  Box,
  Link,
  List,
  Stack,
  Avatar,
  Divider,
  ListItem,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';

import Scrollbar from 'src/components/scrollbar';
import Iconify from 'src/components/iconify';

const getStatusConfig = (currentStatus) => {
  switch (currentStatus) {
    case 'PENDING_ASSIGNMENT':
      return {
        label: 'unassigned',
        color: '#B0B0B0',
        bgColor: '#EFEFEF',
        hasAction: true,
      };
    case 'SCHEDULED':
      return {
        label: 'yet to ship',
        color: '#FF9A02',
        bgColor: '#FFF7DB',
        hasAction: true,
      };
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
        label: 'failed',
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

function ScheduledItem({ item }) {
  const theme = useTheme();

  const creator = item.creator || {};
  const deliveryDetails = item.deliveryDetails || {};

  let productString = '-';
  if (deliveryDetails.items) {
    if (Array.isArray(deliveryDetails.items)) {
      productString = deliveryDetails.items
        .map((i) => i.product?.productName)
        .filter(Boolean)
        .join(', ');
    } else {
      productString = deliveryDetails.items; // for mock details
    }
  }

  const statusConfig = getStatusConfig(item.status);
  const trackingLink = deliveryDetails.trackingLink;

  return (
    <ListItem
      sx={{
        px: 4,
        py: 2,
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={{
          width: '2px',
          height: 65,
          bgcolor: '#1340FF',
          mr: 2,
          // mt: 0.5,
          flexShrink: 0,
        }}
      />
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
              whiteSpace: 'nowrap',
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
            {productString}
          </Typography>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ height: 14, alignSelf: 'center', color: '#8E8E93' }}
          />
          {trackingLink ? (
            <Link
              href={trackingLink}
              target="_blank"
              rel="noopener"
              variant="body2"
              sx={{
                color: '#0062CD',
                textDecoration: 'underline',
                fontWeight: 400,
                cursor: 'pointer',
              }}
            >
              Tracking Link
            </Link>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
              No tracking info
            </Typography>
          )}
        </Stack>
      </Box>
    </ListItem>
  );
}

ScheduledItem.propTypes = {
  item: PropTypes.object,
};

export default function LogisticsScheduledList({ date, logistics }) {
  const safeLogistics = logistics || [];

  const dayLogistics = safeLogistics.filter((item) => {
    if (!item.deliveryDetails?.expectedDeliveryDate) return false;
    return isSameDay(new Date(item.deliveryDetails.expectedDeliveryDate), date);
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: '14px',
          py: '12px',
        }}
      >
        <Iconify icon="material-symbols:calendar-clock-outline" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#231F20', size: '12px' }}>
          SCHEDULED DELIVERIES
        </Typography>
      </Stack>
      <Divider />

      {/* Selected Date Title */}
      <Typography
        variant="h6"
        sx={{
          // mb: 3,
          px: '14px',
          py: '12px',
        }}
      >
        {format(date, 'EEEE, d MMMM yyyy')}
      </Typography>

      <Box
        sx={{
          flexGrow: 0,
          overflowY: 'auto',
          height: 250, //TODO adjust list height
          px: 0.5,
        }}
      >
        {/* Empty State */}
        {dayLogistics.length === 0 ? (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.disabled',
              minHeight: 200,
            }}
          >
            <Typography variant="body2">No deliveries scheduled for this day.</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {dayLogistics.map((item) => (
              <ScheduledItem key={item.id} item={item} />
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
};
