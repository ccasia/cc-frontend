import PropTypes from 'prop-types';

import { Box, Stack, Drawer, Avatar, Divider, Typography, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';

import ReservationDrawer from './drawer-contents/reservation-drawer';
import ProductDeliveryDrawer from './drawer-contents/product-delivery-drawer';

export default function LogisticsDrawer({
  open,
  onClose,
  logistic,
  onUpdate,
  campaignId,
  isAdmin = false,
  isReservation,
}) {
  const creator = logistic?.creator;
  const socialMediaHandle =
    creator?.creator?.instagramUser?.username || creator?.creator?.tiktokUser?.username;

  const renderHeader = (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ py: 2, px: 2.5 }}
    >
      <IconButton onClick={onClose}>
        <Iconify icon="eva:close-fill" sx={{ height: '24px', width: '24px' }} />
      </IconButton>
    </Stack>
  );

  const renderCreator = (
    <Box
      sx={{
        p: 2.5,
        border: '1px solid #919EAB3D',
        bgcolor: '#F4F6F8',
        borderRadius: 2,
        mx: 3,
        mb: 3,
      }}
    >
      <Stack
        direction="row"
        alignContent="center"
        justifyContent="space-between"
        // sx={{ py: 2, px: 2.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            alt={creator?.name}
            src={creator?.photoURL}
            sx={{ width: 48, height: 48, mr: 2 }}
          />
          <Box>
            <Typography variant="subtitle1">{creator?.name}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {socialMediaHandle ? `@${socialMediaHandle}` : '-'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.primary', display: 'block' }}>
              {creator?.phoneNumber || '-'}
            </Typography>
          </Box>
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
        sx: {
          width: { xs: 1, sm: 370 },
          backgroundColor: '#F4F6F8 !important',
          borderTopLeftRadius: 12,
        },
      }}
    >
      {renderHeader}
      <Divider
        sx={{
          mb: 3,
        }}
      />
      {renderCreator}

      {isReservation ? (
        <ReservationDrawer
          logistic={logistic}
          onUpdate={onUpdate}
          campaignId={campaignId}
          isAdmin={isAdmin}
          onClose={onClose}
        />
      ) : (
        <ProductDeliveryDrawer
          logistic={logistic}
          onUpdate={onUpdate}
          campaignId={campaignId}
          isAdmin={isAdmin}
          onClose={onClose}
        />
      )}
    </Drawer>
  );
}

LogisticsDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
  campaignId: PropTypes.string,
  isAdmin: PropTypes.bool,
  isReservation: PropTypes.bool,
};
