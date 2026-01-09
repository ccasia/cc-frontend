import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import { Box, Badge, Stack, Button, Divider, Typography, Link } from '@mui/material';

import Iconify from 'src/components/iconify';

import LogisticsStepper from '../logistics-stepper';
import ReviewIssueDialog from '../dialogs/review-issue-dialog';
import AssignLogisticDialog from '../dialogs/assign-logistic-dialog';
import ScheduleDeliveryDialog from '../dialogs/schedule-delivery-dialog';

export default function ProductDeliveryDrawer({
  onClose,
  logistic,
  onUpdate,
  campaignId,
  isAdmin,
}) {
  const [openAssign, setOpenAssign] = useState(false);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [openIssue, setOpenIssue] = useState(false);
  const [openAdminEdit, setOpenAdminEdit] = useState(false);
  const [openAdminAssign, setOpenAdminAssign] = useState(false);
  const [openWithdrawConfirm, setOpenWithdrawConfirm] = useState(false);

  const status = logistic?.status;
  const creator = logistic?.creator;
  const deliveryDetails = logistic?.deliveryDetails;

  const renderStepperAction = () => {
    if (isAdmin) {
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
              onClick={() => setOpenIssue(true)}
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
    }
    if (status === 'PENDING_ASSIGNMENT') {
      return (
        <Badge color="error" variant="dot">
          <Button
            fullWidth
            variant="contained"
            onClick={() => setOpenAssign(true)}
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
            Assign
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
            onClick={() => setOpenIssue(true)}
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
    return null;
  };

  // 2. Bottom Action Button (Fixed at bottom of drawer content)
  const renderFooterActions = () => {
    // Step 2 Extra Button
    if (status === 'SCHEDULED') {
      return (
        <Button
          variant="outlined"
          onClick={() => setOpenAdminAssign(true)}
          sx={{
            height: 44,
            padding: { xs: '4px 8px', sm: '6px 10px' },
            borderRadius: '8px',
            boxShadow: '0px -4px 0px 0px #00000073 inset',
            color: '#FFFFFF',
            fontSize: { xs: 12, sm: 14, md: 16 },
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
              ? new Date(deliveryDetails.expectedDeliveryDate).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                })
              : '-'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <>
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
        <Stack alignItems="center" sx={{ mt: 3 }}>
          {renderStepperAction()}
        </Stack>
      </Box>
      {renderDietary}
      {renderDeliveryDetails}
      <Stack alignItems="center" sx={{ mb: 3 }}>
        {renderFooterActions()}
      </Stack>

      <AssignLogisticDialog
        open={openAssign}
        onClose={() => setOpenAssign(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      />
      <AdminAssignLogisticDialog
        open={openAdminAssign}
        onClose={() => setOpenAdminAssign(false)}
        logistic={logistic}
        campaignId={campaignId}
        onUpdate={onUpdate}
      />
      <AdminEditLogisticDialog
        open={openAdminEdit}
        onClose={() => setOpenAdminEdit(false)}
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

ProductDeliveryDrawer.propTypes = {
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
  campaignId: PropTypes.string,
  isAdmin: PropTypes.bool,
};
