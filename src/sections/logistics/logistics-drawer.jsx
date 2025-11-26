import PropTypes from 'prop-types';

import { Box, Stack, Drawer, Avatar, Divider, Typography, IconButton, Link } from '@mui/material';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import LogisticsStepper from './logistics-stepper';

export default function LogisticsDrawer({ open, onClose, logistic, onUpdate, campaignId }) {
  if (!logistic) return null;

  const { creator, deliveryDetails } = logistic;

  const renderCreator = (
    <Stack
      direction="row"
      alignContent="center"
      justifyContent="space-between"
      sx={{ py: 2, px: 2.5 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar alt={creator?.name} src={creator?.photoURL} sx={{ width: 48, height: 48, mr: 2 }} />
        <Box>
          <Typography variant="subtitle1">{creator?.name}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {creator?.creator?.instagramUser?.username
              ? `@${creator.creator.instagramUser.username}`
              : '-'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.primary', display: 'block' }}>
            {creator?.phoneNumber || '-'}
          </Typography>
        </Box>
      </Box>
      {/* <IconButton onClick={onClose}>
        <Iconify icon="eva:close-fill" />
      </IconButton> */}
    </Stack>
  );

  const renderDietary = (
    <Box sx={{ p: 2.5, bgcolor: '#F4F6F8', borderRadius: 2, mx: 2.5, mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Iconify icon="material-symbols:clarify-outline-rounded" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2">DIETARY RESTRICTIONS/ALLERGIES</Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {deliveryDetails?.dietaryRestrictions || 'No dietary restrictions or allergies specified.'}
      </Typography>
    </Box>
  );

  const renderDeliveryDetails = (
    <Box sx={{ p: 2.5, border: '1px solid #919EAB3D', borderRadius: 2, mx: 2.5, mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Iconify icon="material-symbols:clarify-outline-rounded" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2">DELIVERY DETAILS</Typography>
      </Stack>
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Product
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            {deliveryDetails?.items?.map((item, index) => (
              <Box
                key={index}
                sx={{
                  px: 1,
                  py: 0.5,
                  bgcolor: '#F4F6F8',
                  borderRadius: 1,
                  border: '1px solid #919EAB3D',
                  typography: 'caption',
                }}
              >
                {item.product?.productName} ({item.quantity})
              </Box>
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Tracking Link
          </Typography>
          <Box>
            {deliveryDetails?.trackingLink ? (
              <Link
                href={deliveryDetails.trackingLink}
                target="_blank"
                rel="noopener"
                sx={{ color: '#1340FF' }}
              >
                {deliveryDetails.trackingLink}
              </Link>
            ) : (
              <Typography variant="body2"></Typography>
            )}
          </Box>
        </Box>
        <Box>
          <Typography>Delivery Address</Typography>
          <Stack>
            <Iconify />
            <Typography>{deliveryDetails?.address || 'No address provided'}</Typography>
          </Stack>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Expected Delivery
          </Typography>
          <Typography>
            {deliveryDetails?.expectedDeliveryDate
              ? new Date(deliveryDetails.expectedDeliveryDate).toLocaleString()
              : '-'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{
        sx: { width: { xs: 1, sm: 370 } },
      }}
    >
      <Scrollbar>
        <Divider />
        {renderCreator}
        <Box>
          <LogisticsStepper logistic={logistic} onUpdate={onUpdate} campaignId={campaignId} />
        </Box>
        <Divider />
        {renderDietary}
        {renderDeliveryDetails}
      </Scrollbar>
    </Drawer>
  );
}

LogisticsDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
  campaignId: PropTypes.string,
};
