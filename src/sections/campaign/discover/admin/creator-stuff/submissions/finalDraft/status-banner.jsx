import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Typography,
  LoadingButton,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const StatusBanner = ({ 
  submission, 
  deliverables, 
  campaign, 
  creator, 
  onStatusUpdate,
  draftVideoMethods 
}) => {
  // Handler for manual approval
  const handleForceApproveFromBanner = async () => {
    try {
      console.log('Force approving submission from banner');
      const dueDate = draftVideoMethods?.getValues('dueDate') || dayjs().add(7, 'day').format('YYYY-MM-DD');
      
      // Check if this is a V3 campaign (client-created)
      const isV3 = campaign?.origin === 'CLIENT';
      
      if (isV3) {
        // V3 flow: Admin sends to client (use V3 API)
        await axiosInstance.patch(`/api/submission/v3/${submission.id}/approve/admin`, {
          submissionId: submission.id,
          feedback: 'All sections have been approved by admin'
        });
      } else {
        // V2 flow: Direct approval (use V2 API)
        const updatePayload = {
          submissionId: submission.id,
          status: 'APPROVED',
          feedback: 'All sections have been approved.',
          dueDate
        };
        
        await axiosInstance.patch(`/api/submission/status`, updatePayload);
      }
      
      // Step 2: Update posting status (only for V2 campaigns)
      if (!isV3) {
        await updatePostingStatus(dueDate);
      }
      
      // Step 3: Refresh data
      if (onStatusUpdate) {
        await onStatusUpdate();
      }
      
      enqueueSnackbar(
        isV3 
          ? 'Submission sent to client for review!' 
          : 'Submission approved! Creator can now submit posting links.', 
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error force approving submission:', error);
      enqueueSnackbar('Error approving submission', { variant: 'error' });
    }
  };

  // Function to update posting status
  const updatePostingStatus = async (dueDate = null) => {
    try {
      // Get all submissions for this campaign/creator
      const allSubmissionsRes = await axiosInstance.get(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      
      // Find the posting submission
      const postingSubmission = allSubmissionsRes.data.find(
        sub => sub.submissionType?.type === 'POSTING'
      );
      
      if (postingSubmission) {
        console.log('Found posting submission, updating to IN_PROGRESS', postingSubmission);
        
        // Use the provided due date or default to 7 days from now
        const dueDateValue = dueDate || dayjs().add(7, 'day').format('YYYY-MM-DD');
        
        // Update the posting submission to IN_PROGRESS
        const postingUpdatePayload = {
          submissionId: postingSubmission.id,
          status: 'IN_PROGRESS',
          dueDate: dueDateValue,
          startDate: dayjs(dueDateValue).format(),
          endDate: dayjs(dueDateValue).format(),
          sectionOnly: true // Add this flag to indicate we only want to update the posting status
        };
        
        const postingRes = await axiosInstance.patch(
          `/api/submission/status`,
          postingUpdatePayload
        );
        
        console.log('Posting submission update response:', postingRes.data);
        enqueueSnackbar('Posting link has been activated!', { variant: 'success' });
        
        return true;
      } 
        console.log('No posting submission found');
        return false;
      
    } catch (error) {
      console.error('Error updating posting submission:', error);
      enqueueSnackbar('Error activating posting link', { variant: 'error' });
      return false;
    }
  };

  if (submission?.status === 'CHANGES_REQUIRED') {
    return (
      <Box
        sx={{
          mb: 3,
          p: 1.5,
          px: 3,
          bgcolor: 'warning.lighter',
          border: '1px solid',
          borderColor: 'warning.light',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 2px 8px rgba(255, 171, 0, 0.12)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: 4,
            height: '100%',
            bgcolor: 'warning.main',
          },
        }}
      >
        <Box
          sx={{
            minWidth: 40,
            height: 40,
            borderRadius: 1.2,
            bgcolor: 'warning.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify
            icon="solar:danger-triangle-bold"
            width={24}
            sx={{
              color: 'warning.contrastText',
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'warning.darker',
              fontWeight: 600,
              mb: 0.5,
            }}
          >
            Changes Required
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'warning.dark',
              opacity: 0.8,
            }}
          >
            Changes have been requested for this submission.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (submission?.status === 'APPROVED') {
    return (
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: 'success.lighter',
          border: '1px solid',
          borderColor: 'success.light',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Iconify icon="solar:check-circle-bold" color="success.main" />
        <Typography color="success.darker" sx={{ flex: 1 }}>This submission has been approved</Typography>
      </Box>
    );
  }
  
  if (submission?.status === 'PENDING_REVIEW') {
    // Check if all sections are approved
    const hasVideos = deliverables?.videos?.length > 0 || !!submission?.content;
    const hasRawFootages = campaign?.rawFootage && (deliverables?.rawFootages?.length > 0);
    const hasPhotos = campaign?.photos && (deliverables?.photos?.length > 0);
    
    const videosApproved = hasVideos && 
      (deliverables?.videos?.length > 0 
        ? deliverables.videos.every(v => v.status === 'APPROVED')
        : submission?.content?.status === 'APPROVED');
    
    const rawFootagesApproved = hasRawFootages ? 
      deliverables.rawFootages.every(f => f.status === 'APPROVED') : 
      !hasRawFootages;
    
    const photosApproved = hasPhotos ? 
      deliverables.photos.every(p => p.status === 'APPROVED') : 
      !hasPhotos;
    
    const allSectionsApproved = (hasVideos ? videosApproved : true) && 
                         (hasRawFootages ? rawFootagesApproved : true) && 
                         (hasPhotos ? photosApproved : true);
    
    return (
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: 'info.lighter',
          border: '1px solid',
          borderColor: 'info.light',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Iconify icon="material-symbols:hourglass-outline" color="info.main" />
          <Typography color="info.darker">
            This submission is pending review
          </Typography>
        </Box>
        
        {/* Show force approve button if all sections are approved */}
        {allSectionsApproved && (
          <LoadingButton
            variant="contained"
            size="small"
            color="success"
            startIcon={<Iconify icon="mdi:check-bold" />}
            onClick={handleForceApproveFromBanner}
            sx={{
              borderRadius: 1.15,
              textTransform: 'none',
              px: 2.5,
              py: 1.2,
              fontWeight: 600,
              mt: { xs: 1, sm: 0 },
            }}
          >
            {campaign?.origin === 'CLIENT' ? 'Send to Client' : 'Force Approve Now'}
          </LoadingButton>
        )}
      </Box>
    );
  }

  return null;
};

StatusBanner.propTypes = {
  submission: PropTypes.object.isRequired,
  deliverables: PropTypes.object,
  campaign: PropTypes.object.isRequired,
  creator: PropTypes.object.isRequired,
  onStatusUpdate: PropTypes.func,
  draftVideoMethods: PropTypes.object,
};

export default StatusBanner; 