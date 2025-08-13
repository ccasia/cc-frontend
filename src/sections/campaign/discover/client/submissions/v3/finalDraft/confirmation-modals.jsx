import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Chip,
  Stack,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

// Helper function to get section display name
const getSectionDisplayName = (sectionType) => {
  if (sectionType === 'video') return 'Draft Videos';
  if (sectionType === 'rawFootages') return 'Raw Footages';
  return 'Photos';
};

// Helper function to get section items name
const getSectionItemsName = (sectionType) => {
  if (sectionType === 'video') return 'these draft videos';
  if (sectionType === 'rawFootages') return 'these raw footages';
  return 'these photos';
};

export const ConfirmationApproveModal = ({ 
  open, 
  onClose, 
  sectionType = 'video',
  onConfirm,
  isSubmitting,
  watchData,
  isDisabled
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        width: '100%',
        maxWidth: '500px',
        borderRadius: 2,
      },
    }}
  >
    <DialogTitle
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2,
      }}
    >
      Approve {getSectionDisplayName(sectionType)}
    </DialogTitle>
    <DialogContent sx={{ mt: 2 }}>
      <Stack spacing={2}>
        <DialogContentText>
          Are you sure you want to approve {getSectionItemsName(sectionType)}?
        </DialogContentText>

        {/* Show due date if set and if approving videos */}
        {sectionType === 'video' && watchData?.dueDate && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Due Date:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                bgcolor: 'grey.100',
                p: 1.5,
                borderRadius: 1,
              }}
            >
              {dayjs(watchData.dueDate).format('MMM D, YYYY')}
            </Typography>
          </Box>
        )}

        {/* Show feedback comment based on section type */}
        {sectionType === 'video' && watchData?.feedback && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Feedback:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                bgcolor: 'grey.100',
                p: 1.5,
                borderRadius: 1,
                maxHeight: '100px',
                overflowY: 'auto',
              }}
            >
              {watchData.feedback}
            </Typography>
          </Box>
        )}
        
        {sectionType === 'rawFootages' && watchData?.footageFeedback && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Feedback:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                bgcolor: 'grey.100',
                p: 1.5,
                borderRadius: 1,
                maxHeight: '100px',
                overflowY: 'auto',
              }}
            >
              {watchData.footageFeedback}
            </Typography>
          </Box>
        )}
        
        {sectionType === 'photos' && watchData?.photoFeedback && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Feedback:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                bgcolor: 'grey.100',
                p: 1.5,
                borderRadius: 1,
                maxHeight: '100px',
                overflowY: 'auto',
              }}
            >
              {watchData.photoFeedback}
            </Typography>
          </Box>
        )}
      </Stack>
    </DialogContent>
    <DialogActions sx={{ p: 2.5, pt: 2 }}>
      <Button
        onClick={onClose}
        size="small"
        sx={{
          bgcolor: 'white',
          border: 1.5,
          borderRadius: 1.15,
          borderColor: '#e7e7e7',
          borderBottom: 3,
          borderBottomColor: '#e7e7e7',
          color: 'text.primary',
          '&:hover': {
            bgcolor: '#f5f5f5',
            borderColor: '#231F20',
          },
          textTransform: 'none',
          px: 2.5,
          py: 1.2,
          fontSize: '0.9rem',
          minWidth: '80px',
          height: '45px',
        }}
      >
        Cancel
      </Button>
      <LoadingButton
        onClick={onConfirm}
        disabled={isDisabled}
        variant="contained"
        size="small"
        loading={isSubmitting}
        sx={{
          bgcolor: '#FFFFFF',
          color: '#1ABF66',
          border: '1.5px solid',
          borderColor: '#e7e7e7',
          borderBottom: 3,
          borderBottomColor: '#e7e7e7',
          borderRadius: 1.15,
          px: 2.5,
          py: 1.2,
          fontWeight: 600,
          '&:hover': {
            bgcolor: '#f5f5f5',
            borderColor: '#1ABF66',
          },
          fontSize: '0.9rem',
          minWidth: '80px',
          height: '45px',
          textTransform: 'none',
        }}
      >
        Approve
      </LoadingButton>
    </DialogActions>
  </Dialog>
);

export const ConfirmationRequestModal = ({ 
  open, 
  onClose, 
  sectionType = 'video',
  onConfirm,
  watchData,
  selectedItemsCount = 0
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        width: '100%',
        maxWidth: '500px',
        borderRadius: 2,
      },
    }}
  >
    <DialogTitle
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2,
      }}
    >
      Confirm Change Request for {getSectionDisplayName(sectionType)}
    </DialogTitle>
    <DialogContent sx={{ mt: 2 }}>
      <Stack spacing={2}>
        <DialogContentText>
          Are you sure you want to submit this change request?
        </DialogContentText>

        {/* Show feedback and reasons based on section type */}
        {sectionType === 'video' && (
          <>
            {watchData?.reasons?.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Reasons for changes:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {watchData.reasons.map((reason, idx) => (
                    <Chip
                      key={idx}
                      label={reason}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
            {watchData?.feedback && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Feedback:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    bgcolor: 'grey.100',
                    p: 1.5,
                    borderRadius: 1,
                    maxHeight: '100px',
                    overflowY: 'auto',
                  }}
                >
                  {watchData.feedback}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Show feedback for raw footage */}
        {sectionType === 'rawFootages' && watchData?.footageFeedback && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Feedback:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                bgcolor: 'grey.100',
                p: 1.5,
                borderRadius: 1,
                maxHeight: '100px',
                overflowY: 'auto',
              }}
            >
              {watchData.footageFeedback}
            </Typography>
          </Box>
        )}
        
        {/* Show feedback for photos */}
        {sectionType === 'photos' && watchData?.photoFeedback && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Feedback:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                bgcolor: 'grey.100',
                p: 1.5,
                borderRadius: 1,
                maxHeight: '100px',
                overflowY: 'auto',
              }}
            >
              {watchData.photoFeedback}
            </Typography>
          </Box>
        )}
      </Stack>
    </DialogContent>

    <DialogActions sx={{ p: 2.5, pt: 2 }}>
      <Button
        onClick={onClose}
        size="small"
        sx={{
          bgcolor: 'white',
          border: 1.5,
          borderRadius: 1.15,
          borderColor: '#e7e7e7',
          borderBottom: 3,
          borderBottomColor: '#e7e7e7',
          color: 'text.primary',
          '&:hover': {
            bgcolor: '#f5f5f5',
            borderColor: '#231F20',
          },
          textTransform: 'none',
          px: 2.5,
          py: 1.2,
          fontSize: '0.9rem',
          minWidth: '80px',
          height: '45px',
        }}
      >
        Cancel
      </Button>
      <LoadingButton
        variant="contained"
        size="small"
        onClick={onConfirm}
        disabled={selectedItemsCount === 0}
        sx={{
          bgcolor: '#FFFFFF',
          color: '#1ABF66',
          border: '1.5px solid',
          borderColor: '#e7e7e7',
          borderBottom: 3,
          borderBottomColor: '#e7e7e7',
          borderRadius: 1.15,
          px: 2.5,
          py: 1.2,
          fontWeight: 600,
          '&:hover': {
            bgcolor: '#f5f5f5',
            borderColor: '#1ABF66',
          },
          fontSize: '0.9rem',
          minWidth: '80px',
          height: '45px',
          textTransform: 'none',
        }}
      >
        Submit
      </LoadingButton>
    </DialogActions>
  </Dialog>
);

ConfirmationApproveModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sectionType: PropTypes.oneOf(['video', 'rawFootages', 'photos']),
  onConfirm: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  watchData: PropTypes.object,
  isDisabled: PropTypes.bool,
};

ConfirmationRequestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sectionType: PropTypes.oneOf(['video', 'rawFootages', 'photos']),
  onConfirm: PropTypes.func.isRequired,
  watchData: PropTypes.object,
  selectedItemsCount: PropTypes.number,
};

export default {
  ConfirmationApproveModal,
  ConfirmationRequestModal,
}; 