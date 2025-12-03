import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { useSnackbar } from 'src/components/snackbar';

import {
  Box,
  Stack,
  Drawer,
  Avatar,
  Button,
  Divider,
  Typography,
  IconButton,
  Link,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import LogisticsStepper from './logistics-stepper';
import AssignLogisticDialog from './dialogs/assign-logistic-dialog';
import ScheduleDeliveryDialog from './dialogs/schedule-delivery-dialog';
import ReviewIssueDialog from './dialogs/review-issue-dialog';

export function LogisticsDrawer({ open, onClose, logistic, onUpdate, campaignId }) {
  const [openAssign, setOpenAssign] = useState(false);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [openIssue, setOpenIssue] = useState(false);

  const status = logistic?.status;
  const creator = logistic?.creator;
  const deliveryDetails = logistic?.deliveryDetails;
  const socialMediaHandle =
    creator?.creator?.instagramUser?.username || creator?.creator?.tiktokUser?.username;
  const buttonSx = {
    width: 'fit-content',
    height: 44,
    padding: { xs: '4px 8px', sm: '6px 10px' },
    borderRadius: '8px',
    boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
    backgroundColor: '#1340FF',
    color: '#FFFFFF',
    fontSize: { xs: 12, sm: 14, md: 16 },
    fontWeight: 600,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: '#133effd3',
      boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
    },
    '&:active': {
      boxShadow: '0px 0px 0px 0px #0c2aa6 inset',
      transform: 'translateY(1px)',
    },
  };

  const actionButton = useMemo(() => {
    if (!logistic) return null;

    switch (status) {
      case 'PENDING_ASSIGNMENT':
        return (
          <Button fullWidth variant="contained" onClick={() => setOpenAssign(true)} sx={buttonSx}>
            <Iconify icon="mi:edit-alt" width={24} sx={{ mr: 1 }} />
            Assign
          </Button>
        );
      case 'SCHEDULED':
        return (
          <Button fullWidth variant="contained" onClick={() => setOpenSchedule(true)} sx={buttonSx}>
            <Iconify icon="mi:edit-alt" width={24} sx={{ mr: 1 }} />
            Schedule Delivery
          </Button>
        );
      case 'ISSUE_REPORTED':
        return (
          <Button fullWidth variant="contained" onClick={() => setOpenIssue(true)} sx={buttonSx}>
            <Iconify icon="mi:edit-alt" width={24} sx={{ mr: 1 }} />
            Review Issue
          </Button>
        );
      case 'SHIPPED':
      case 'DELIVERED':
      case 'COMPLETED':
        return null;
      default:
        return null;
    }
  }, [status, logistic]);

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
        {/* <IconButton onClick={onClose}>
        <Iconify icon="eva:close-fill" />
      </IconButton> */}
      </Stack>
    </Box>
  );

  const renderDietary = (
    <Box
      sx={{
        px: 2.5,
        py: 1,
        border: '1px solid #919EAB3D',
        bgcolor: '#F4F6F8',
        borderRadius: 2,
        mx: 3,
        mb: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Iconify icon="material-symbols:clarify-outline-rounded" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2">DIETARY RESTRICTIONS/ALLERGIES</Typography>
      </Stack>
      <Divider />
      <Typography variant="body2" sx={{ color: 'text.secondary', my: 2 }}>
        {deliveryDetails?.dietaryRestrictions || 'No dietary restrictions or allergies specified.'}
      </Typography>
    </Box>
  );

  const renderDeliveryDetails = (
    <Box
      sx={{
        px: 2.5,
        py: 1,
        border: '1px solid #919EAB3D',
        bgcolor: '#F4F6F8',
        borderRadius: 2,
        mx: 3,
        mb: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Iconify icon="material-symbols:clarify-outline-rounded" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2">DELIVERY DETAILS</Typography>
      </Stack>
      <Divider />
      <Stack spacing={2} sx={{ my: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Product
          </Typography>
          <Stack direction="row" spacing={1}>
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
          <Box sx={{ mt: 0 }}>
            {deliveryDetails?.trackingLink ? (
              <Link
                variant="body2"
                href={deliveryDetails.trackingLink}
                target="_blank"
                rel="noopener"
                sx={{ color: '#1340FF' }}
              >
                {deliveryDetails.trackingLink}
              </Link>
            ) : (
              <Typography variant="body2">-</Typography>
            )}
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Delivery Address
          </Typography>
          <Stack>
            <Iconify />
            <Typography variant="body2">
              {deliveryDetails?.address || 'No address provided'}
            </Typography>
          </Stack>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Expected Delivery
          </Typography>
          <Typography variant="body2">
            {deliveryDetails?.expectedDeliveryDate
              ? new Date(deliveryDetails.expectedDeliveryDate).toLocaleString()
              : '-'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <>
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
          <LogisticsStepper logistic={logistic} onUpdate={onUpdate} campaignId={campaignId} />
          {actionButton && (
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Box>{actionButton}</Box>
            </Stack>
          )}
        </Box>
        {renderDietary}
        {renderDeliveryDetails}
      </Drawer>
      <AssignLogisticDialog
        open={openAssign}
        onClose={() => setOpenAssign(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      />
      <ScheduleDeliveryDialog
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      />
      <ReviewIssueDialog
        open={openIssue}
        onClose={() => setOpenIssue(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      />
    </>
  );
}

LogisticsDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
  campaignId: PropTypes.string,
};

// ------------------------------------------------------------------------------------------

export function LogisticsAdminDrawer({ open, onClose, logistic, onUpdate, campaignId }) {
  const { enqueueSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openWithdrawConfirm, setOpenWithdrawConfirm] = useState(false);

  const status = logistic?.status;
  const creator = logistic?.creator;
  const deliveryDetails = logistic?.deliveryDetails;

  const handleWithdraw = async () => {
    try {
      // await axiosInstance.delete(`/api/logistics/admin/${logistic.id}/withdraw`); // TODO
      enqueueSnackbar('Creator withdrawn from logistics successfully');
      onUpdate();
      setOpenWithdrawConfirm(false);
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to withdraw creator', { variant: 'error' });
    }
  };

  const getButtonLabel = () => {
    if (status === 'PENDING_ASSIGNMENT') return 'Edit or Assign';
    if (status === 'SCHEDULED') return 'Edit or Schedule';
    return 'Edit Details';
  };

  const renderHeader = (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ py: 2, px: 2.5 }}
    >
      <IconButton onClick={onClose}>
        <Iconify icon="eva:close-fill" width={24} />
      </IconButton>
    </Stack>
  );

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        PaperProps={{
          sx: {
            width: { xs: 1, sm: 370 },
            backgroundColor: '#F4F6F8',
            borderTopLeftRadius: 12,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {renderHeader}
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Box
            sx={{
              p: 2.5,
              border: '1px solid #919EAB3D',
              bgcolor: '#fff',
              borderRadius: 2,
              mx: 3,
              mb: 3,
            }}
          >
            <Stack direction="row" alignItems="center">
              <Avatar src={creator?.photoURL} sx={{ width: 48, height: 48, mr: 2 }} />
              <Box>
                <Typography variant="subtitle1">{creator?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {creator?.creator?.instagramUser?.username
                    ? `@${creator.creator.instagramUser.username}`
                    : '-'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p: 2.5,
              border: '1px solid #919EAB3D',
              bgcolor: '#fff',
              borderRadius: 2,
              mx: 3,
              mb: 3,
            }}
          >
            <LogisticsStepper logistic={logistic} />
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => setOpenEditDialog(true)}
                sx={{
                  bgcolor: '#1340FF',
                  boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
                  '&:hover': { bgcolor: '#0B2DAD' },
                  width: '100%',
                }}
              >
                <Iconify icon="mi:edit-alt" width={20} sx={{ mr: 1 }} />
                {getButtonLabel()}
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              px: 2.5,
              py: 2,
              border: '1px solid #919EAB3D',
              bgcolor: '#fff',
              borderRadius: 2,
              mx: 3,
              mb: 3,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#1340FF' }}>
              DELIVERY DETAILS
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body2">{deliveryDetails?.address || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Tracking
                </Typography>
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
                  <Typography variant="body2">-</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Remarks
                </Typography>
                <Typography variant="body2">
                  {deliveryDetails?.dietaryRestrictions || '-'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Button
            color="error"
            onClick={() => setOpenWithdrawConfirm(true)}
            sx={{ textDecoration: 'none' }}
          >
            Withdraw From Campaign
          </Button>
        </Box>
      </Drawer>

      {/* <AdminEditLogisticDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      /> */}

      {/* <DeleteProductDialog
        open={openWithdrawConfirm}
        onClose={() => setOpenWithdrawConfirm(false)}
        productName="this creator from the logistics list"
        onConfirm={handleWithdraw}
      /> */}
    </>
  );
}

LogisticsAdminDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
  campaignId: PropTypes.string,
};
