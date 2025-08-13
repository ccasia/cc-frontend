import useSWR from 'swr';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Grid,
  Card,
  Chip,
  Stack,
  Button,
  Avatar,
  Tooltip,
  Typography,
  CardContent,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFMultiSelect } from 'src/components/hook-form';

import { options_changes } from './constants';
import { ConfirmationRequestModal } from './confirmation-modals';

const RawFootageCard = ({ 
  rawFootageItem, 
  index, 
  submission, 
  onRawFootageClick, 
  handleApprove, 
  handleRequestChange,
  selectedRawFootagesForChange,
  handleRawFootageSelection,
  userRole,
  deliverables,
  handleClientApprove,
  handleClientReject,
}) => {
  const [cardType, setCardType] = useState('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);

  const requestSchema = Yup.object().shape({
    feedback: Yup.string().required('This field is required'),
  });

  const approveSchema = Yup.object().shape({
    feedback: Yup.string().required('Comment is required.'),
  });

  const formMethods = useForm({
    resolver: cardType === 'request' ? yupResolver(requestSchema) : yupResolver(approveSchema),
    defaultValues: {
      feedback: cardType === 'approve' ? 'Thank you for submitting!' : '',
    },
  });

  const { formState: { isSubmitting }, reset } = formMethods;

  // Reset form when cardType changes
  useEffect(() => {
    reset({
      feedback: cardType === 'approve' ? 'Thank you for submitting!' : '',
    });
  }, [cardType, reset]);

  // Reset local status when rawFootageItem status changes (server update)
  useEffect(() => {
    setLocalStatus(null);
  }, [rawFootageItem.status]);

  // Use local status if available, otherwise use prop status
  const currentStatus = localStatus || rawFootageItem.status;
  const isRawFootageApprovedByAdmin = currentStatus === 'SENT_TO_CLIENT';
  const isRawFootageApprovedByClient = currentStatus === 'APPROVED';
  const hasRevisionRequested = currentStatus === 'REVISION_REQUESTED';
  
  // For client role, SENT_TO_CLIENT status should be treated as PENDING_REVIEW
  const isPendingReview = userRole === 'client' ? 
    // For clients: show approval buttons when media is SENT_TO_CLIENT (waiting for client review) and NOT already approved
    (currentStatus === 'SENT_TO_CLIENT' && !isRawFootageApprovedByClient && !hasRevisionRequested) :
    // For non-clients: show approval buttons when submission is PENDING_REVIEW and media not approved
    (submission?.status === 'PENDING_REVIEW' && !isRawFootageApprovedByAdmin && !hasRevisionRequested);

  // Get feedback for this specific raw footage
  const getRawFootageFeedback = () => {
    // Check for individual feedback first (from deliverables API)
    if (rawFootageItem.individualFeedback && rawFootageItem.individualFeedback.length > 0) {
      return rawFootageItem.individualFeedback;
    }
    
    // Get all feedback from submission (from deliverables API)
    const allFeedbacks = [
      ...(deliverables?.submissions?.flatMap(sub => sub.feedback) || []),
      ...(submission?.feedback || [])
    ];

    // Filter feedback for this specific raw footage
    const rawFootageSpecificFeedback = allFeedbacks
      .filter(feedback => feedback.rawFootageToUpdate?.includes(rawFootageItem.id))
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));

    return rawFootageSpecificFeedback;
  };

  const feedback = getRawFootageFeedback();

  const handleApproveClick = async (data) => {
    setIsProcessing(true);
    try {
      if (userRole === 'client') {
        await handleClientApprove(rawFootageItem.id, data.feedback);
      } else {
        await handleApprove(rawFootageItem.id, data.feedback);
      }
      setLocalStatus('APPROVED');
      enqueueSnackbar('Raw footage approved successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error approving raw footage:', error);
      enqueueSnackbar('Failed to approve raw footage', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChangeClick = async (data) => {
    setIsProcessing(true);
    try {
      if (userRole === 'client') {
        await handleClientReject(rawFootageItem.id, data.feedback, data.reasons);
      } else {
        await handleRequestChange(rawFootageItem.id, data.feedback, data.reasons);
      }
      setLocalStatus('REVISION_REQUESTED');
      enqueueSnackbar('Changes requested successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error requesting changes:', error);
      enqueueSnackbar('Failed to request changes', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = () => {
    if (isRawFootageApprovedByClient) return 'success';
    if (hasRevisionRequested) return 'error';
    if (isRawFootageApprovedByAdmin) return 'warning';
    return 'default';
  };

  const getStatusText = () => {
    if (isRawFootageApprovedByClient) return 'Approved';
    if (hasRevisionRequested) return 'Changes Requested';
    if (isRawFootageApprovedByAdmin) return 'Sent to Client';
    return 'Pending Review';
  };

  return (
    <Card
      sx={{
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        border: '1px solid',
        borderColor: getBorderColor(),
        maxWidth: 480,
        width: '100%',
        mx: 'auto',
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Raw Footage {index + 1}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {isRawFootageApprovedByClient && (
              <Chip 
                icon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                label="Approved" 
                color="success" 
                size="small"
                variant="filled"
              />
            )}
            <Chip 
              label={getStatusText()} 
              color={getStatusColor()} 
              size="small" 
            />
          </Stack>
        </Stack>

        <Box sx={{ mb: 2 }}>
          <video 
            src={rawFootageItem.url} 
            controls
            style={{ 
              width: '100%', 
              height: 'auto', 
              maxHeight: '300px',
              cursor: 'pointer'
            }}
            onClick={() => onRawFootageClick(index)}
          />
        </Box>

        {feedback.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              Feedback:
            </Typography>
            {feedback.map((fb, idx) => (
              <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2">{fb.content}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(fb.createdAt).format('MMM DD, YYYY HH:mm')}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {isPendingReview && (
          <FormProvider methods={formMethods}>
            <Stack spacing={2}>
              <RHFTextField
                name="feedback"
                label="Feedback"
                multiline
                rows={3}
              />
              
              {cardType === 'request' && (
                <RHFMultiSelect
                  name="reasons"
                  label="Reasons for Changes"
                  options={options_changes}
                />
              )}

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => setCardType(cardType === 'approve' ? 'request' : 'approve')}
                  disabled={isProcessing}
                >
                  {cardType === 'approve' ? 'Request Changes' : 'Approve'}
                </Button>
                
                <LoadingButton
                  variant="contained"
                  onClick={cardType === 'approve' ? handleApproveClick : handleRequestChangeClick}
                  loading={isProcessing}
                  disabled={isSubmitting}
                >
                  {cardType === 'approve' ? 'Approve' : 'Request Changes'}
                </LoadingButton>
              </Stack>
            </Stack>
          </FormProvider>
        )}
      </CardContent>
    </Card>
  );
};

RawFootageCard.propTypes = {
  rawFootageItem: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  submission: PropTypes.object.isRequired,
  onRawFootageClick: PropTypes.func.isRequired,
  handleApprove: PropTypes.func.isRequired,
  handleRequestChange: PropTypes.func.isRequired,
  selectedRawFootagesForChange: PropTypes.array,
  handleRawFootageSelection: PropTypes.func,
  userRole: PropTypes.string.isRequired,
  deliverables: PropTypes.object,
  handleClientApprove: PropTypes.func,
  handleClientReject: PropTypes.func,
};

export default RawFootageCard; 