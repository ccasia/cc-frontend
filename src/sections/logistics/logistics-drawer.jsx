import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'src/components/snackbar';

import {
  Box,
  Badge,
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
import AssignLogisticDialog, { AdminAssignLogisticDialog } from './dialogs/assign-logistic-dialog';
import AdminEditLogisticDialog from './dialogs/admin-edit-logistic-dialog';
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
  const buttonSx = useMemo(
    () => ({
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
    }),
    []
  );

  const actionButton = useMemo(() => {
    if (!logistic) return null;

    switch (status) {
      case 'PENDING_ASSIGNMENT':
        return (
          <Badge color="error" variant="dot">
            <Button fullWidth variant="contained" onClick={() => setOpenAssign(true)} sx={buttonSx}>
              <Iconify icon="mi:edit-alt" width={24} sx={{ mr: 1 }} />
              Assign
            </Button>
          </Badge>
        );
      case 'SCHEDULED':
        return (
          <Badge color="error" variant="dot">
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenSchedule(true)}
              sx={buttonSx}
            >
              <Iconify icon="mi:edit-alt" width={24} sx={{ mr: 1 }} />
              Schedule Delivery
            </Button>
          </Badge>
        );
      case 'ISSUE_REPORTED':
        return (
          <Badge color="error" variant="dot">
            <Button fullWidth variant="contained" onClick={() => setOpenIssue(true)} sx={buttonSx}>
              <Iconify icon="mi:edit-alt" width={24} sx={{ mr: 1 }} />
              Review Issue
            </Button>
          </Badge>
        );
      case 'SHIPPED':
      case 'DELIVERED':
      case 'COMPLETED':
        return null;
      default:
        return null;
    }
  }, [status, logistic, buttonSx]);

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
                  color: '#8E8E93',
                  bgcolor: '#F4F6F8',
                  borderRadius: '6px',
                  border: '1px solid #919EAB3D',
                  boxShadow: '0px -3px 0px 0px #919EAB3D inset',
                  typography: 'caption',
                  fontWeight: 600,
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
// admin version

export function LogisticsAdminDrawer({ open, onClose, logistic, onUpdate, campaignId }) {
  const { enqueueSnackbar } = useSnackbar();

  // Dialog States
  const [openAdminAssign, setOpenAdminAssign] = useState(false); // For Step 1 & 2 Bottom
  const [openSchedule, setOpenSchedule] = useState(false); // For Step 2 Stepper
  const [openAdminEdit, setOpenAdminEdit] = useState(false); // For Step 3 & 4
  const [openReviewIssue, setOpenReviewIssue] = useState(false); // For Issue Stepper
  const [openWithdrawConfirm, setOpenWithdrawConfirm] = useState(false);

  const status = logistic?.status;
  const creator = logistic?.creator;
  const deliveryDetails = logistic?.deliveryDetails;

  const handleWithdraw = async () => {
    try {
      // await axiosInstance.delete(`/api/logistics/admin/${logistic.id}/withdraw`);
      enqueueSnackbar('Creator withdrawn from logistics successfully');
      onUpdate();
      setOpenWithdrawConfirm(false);
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to withdraw creator', { variant: 'error' });
    }
  };

  // --- Logic for Buttons ---

  // 1. Stepper Button (Inside the white box with stepper)
  const renderStepperButton = () => {
    if (status === 'PENDING_ASSIGNMENT') {
      return (
        <Badge color="error" variant="dot">
          <Button
            fullWidth
            variant="contained"
            onClick={() => setOpenAdminAssign(true)}
            sx={{
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
            }}
          >
            <Iconify icon="mi:edit-alt" width={20} sx={{ mr: 1 }} />
            Edit or Assign
          </Button>
        </Badge>
      );
    }
    if (status === 'SCHEDULED') {
      return (
        <Badge color="error" variant="dot">
          <Button
            fullWidth
            variant="contained"
            onClick={() => setOpenSchedule(true)}
            sx={{
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
            }}
          >
            <Iconify icon="mi:edit-alt" width={20} sx={{ mr: 1 }} />
            Schedule Delivery
          </Button>
        </Badge>
      );
    }
    if (status === 'ISSUE_REPORTED') {
      return (
        <Badge color="error" variant="dot">
          <Button
            fullWidth
            variant="contained"
            onClick={() => setOpenReviewIssue(true)}
            sx={{
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
            }}
          >
            <Iconify icon="mi:edit-alt" width={24} sx={{ mr: 1 }} />
            Review Issue
          </Button>
        </Badge>
      );
    }
    return null; // No button in stepper for Shipped/Delivered
  };

  // 2. Bottom Action Button (Fixed at bottom of drawer content)
  const renderBottomButton = () => {
    // Step 2 Extra Button
    if (status === 'SCHEDULED') {
      return (
        <Button
          variant="outlined"
          onClick={() => setOpenAdminAssign(true)}
          sx={{
            borderRadius: '8px',
            boxShadow: '0px -4px 0px 0px #00000073 inset',
            color: '#FFFFFF',
            bgcolor: '#3A3A3C',
            '&:hover': { bgcolor: '#3a3a3cd1', boxShadow: '0px -4px 0px 0px #000000 inset' },
            '&:active': {
              boxShadow: '0px 0px 0px 0px #000000 inset',
              transform: 'translateY(1px)',
            },
          }}
        >
          Edit or Assign
        </Button>
      );
    }
    // Step 3 & 4 & Issue -> Edit Details
    if (['SHIPPED', 'DELIVERED', 'COMPLETED', 'RECEIVED', 'ISSUE_REPORTED'].includes(status)) {
      return (
        <Button
          variant="contained"
          onClick={() => setOpenAdminEdit(true)}
          sx={{
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
          }}
        >
          <Iconify icon="mi:edit-alt" width={20} sx={{ mr: 1 }} />
          Edit
        </Button>
      );
    }
    return null;
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
            backgroundColor: '#fff !important',
            borderTopLeftRadius: 12,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {renderHeader}
        <Divider />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3 }}>
          {/* User Info */}
          <Box
            sx={{
              p: 2.5,
              mt: 3,
              border: '1px solid #919EAB3D',
              bgcolor: '#fff',
              borderRadius: 2,
              // mx: 3,
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
                <Typography variant="caption" sx={{ color: 'text.primary', display: 'block' }}>
                  {creator?.phoneNumber || '-'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Stepper Box */}
          <Box
            sx={{
              p: 2.5,
              border: '1px solid #919EAB3D',
              bgcolor: '#fff',
              borderRadius: 2,
              mb: 3,
            }}
          >
            <LogisticsStepper logistic={logistic} />
            <Stack alignItems="center" sx={{ mt: 3 }}>
              {renderStepperButton()}
            </Stack>
          </Box>
          <Box
            sx={{
              px: 2.5,
              py: 1,
              border: '1px solid #919EAB3D',
              bgcolor: '#fff',
              borderRadius: 2,
              mb: 3,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Iconify icon="material-symbols:clarify-outline-rounded" sx={{ color: '#1340FF' }} />
              <Typography variant="subtitle2">DIETARY RESTRICTIONS/ALLERGIES</Typography>
            </Stack>
            <Divider />
            <Typography variant="body2" sx={{ color: 'text.secondary', my: 2 }}>
              {deliveryDetails?.dietaryRestrictions ||
                'No dietary restrictions or allergies specified.'}
            </Typography>
          </Box>
          {/* Delivery Details (Read-only view) */}
          <Box
            sx={{
              px: 2.5,
              py: 1,
              border: '1px solid #919EAB3D',
              bgcolor: '#fff',
              borderRadius: 2,
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
                        color: '#8E8E93',
                        bgcolor: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #919EAB3D',
                        boxShadow: '0px -3px 0px 0px #919EAB3D inset',
                        typography: 'caption',
                        fontWeight: 600,
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
        </Box>

        {/* Footer Actions */}
        <Box
          sx={{
            p: 3,
            pt: 3,
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'center',
            alignItems: 'center',
          }}
        >
          {renderBottomButton()}

          <Button
            color="error"
            onClick={() => setOpenWithdrawConfirm(true)}
            sx={{ textDecoration: 'none', mt: 1 }}
          >
            Withdraw From Campaign
          </Button>
        </Box>
      </Drawer>

      {/* 1. Admin Assign Dialog (For Step 1 & 2) */}
      {/* Ensure you have AdminAssignLogisticDialog. If not, use AssignLogisticDialog but it might lack address fields */}
      <AdminAssignLogisticDialog
        open={openAdminAssign}
        onClose={() => setOpenAdminAssign(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      />

      {/* 2. Schedule Dialog (For Step 2) */}
      <ScheduleDeliveryDialog
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      />

      {/* 3. Admin Edit Dialog (For Step 3, 4, Issue) */}
      <AdminEditLogisticDialog
        open={openAdminEdit}
        onClose={() => setOpenAdminEdit(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      />

      {/* 4. Review Issue Dialog */}
      <ReviewIssueDialog
        open={openReviewIssue}
        onClose={() => setOpenReviewIssue(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      />

      {/* 5. Withdraw Confirmation */}
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
