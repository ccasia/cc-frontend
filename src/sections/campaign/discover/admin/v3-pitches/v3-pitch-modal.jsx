import PropTypes from 'prop-types';
import React from 'react';

import {
  Box,
  Stack,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent,
} from '@mui/material';

import dayjs from 'dayjs';

import Iconify from 'src/components/iconify';

const V3PitchModal = ({ open, onClose, pitch, campaign, onUpdate }) => {
  const displayStatus = pitch?.displayStatus || pitch?.status;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'warning';
      case 'SENT_TO_CLIENT':
        return 'info';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'AGREEMENT_PENDING':
        return 'primary';
      case 'AGREEMENT_SUBMITTED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Pending Review';
      case 'SENT_TO_CLIENT':
        return 'Sent to Client';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'AGREEMENT_PENDING':
        return 'Agreement Pending';
      case 'AGREEMENT_SUBMITTED':
        return 'Agreement Submitted';
      default:
        return status;
    }
  };

  if (!pitch) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Pitch Details</Typography>
          <Chip
            label={getStatusLabel(displayStatus)}
            color={getStatusColor(displayStatus)}
            size="small"
          />
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Creator Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Creator Information
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={pitch.user?.avatar} alt={pitch.user?.name} sx={{ width: 60, height: 60 }}>
                  {pitch.user?.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {pitch.user?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pitch.user?.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    @{pitch.user?.username}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Campaign Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Campaign Information
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Campaign:</strong> {campaign?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Campaign ID:</strong> {campaign?.campaignId}
                </Typography>
                <Typography variant="body2">
                  <strong>Origin:</strong> {campaign?.origin}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* Pitch Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Pitch Information
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <Typography variant="body2">
                    <strong>Pitch Type:</strong>
                  </Typography>
                  <Chip
                    label={pitch.type === 'video' ? 'Video' : 'Text'}
                    color={pitch.type === 'video' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </Stack>
                
                <Typography variant="body2">
                  <strong>Submitted:</strong> {dayjs(pitch.createdAt).format('MMM DD, YYYY HH:mm')}
                </Typography>

                {pitch.updatedAt && (
                  <Typography variant="body2">
                    <strong>Last Updated:</strong> {dayjs(pitch.updatedAt).format('MMM DD, YYYY HH:mm')}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Pitch Content */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Pitch Content
              </Typography>
              
              {pitch.type === 'video' ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Video pitch submitted
                  </Typography>
                  {pitch.content && (
                    <Box
                      component="video"
                      controls
                      sx={{
                        width: '100%',
                        maxHeight: 300,
                        borderRadius: 1,
                      }}
                    >
                      <source src={pitch.content} type="video/mp4" />
                      Your browser does not support the video tag.
                    </Box>
                  )}
                </Box>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={pitch.content || 'No content available'}
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Pitch Status History */}
          {(pitch.approvedByAdminId || pitch.approvedByClientId || pitch.rejectedByAdminId || pitch.rejectedByClientId) && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Status History
                </Typography>
                <Stack spacing={1}>
                  {pitch.approvedByAdminId && (
                    <Typography variant="body2" color="success.main">
                      ✓ Approved by Admin
                    </Typography>
                  )}
                  {pitch.approvedByClientId && (
                    <Typography variant="body2" color="success.main">
                      ✓ Approved by Client
                    </Typography>
                  )}
                  {pitch.rejectedByAdminId && (
                    <Typography variant="body2" color="error.main">
                      ✗ Rejected by Admin
                    </Typography>
                  )}
                  {pitch.rejectedByClientId && (
                    <Typography variant="body2" color="error.main">
                      ✗ Rejected by Client
                    </Typography>
                  )}
                  {pitch.rejectionReason && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Reason:</strong> {pitch.rejectionReason}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Agreement Information */}
          {(pitch.amount || pitch.agreementTemplateId) && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Agreement Information
                </Typography>
                <Stack spacing={1}>
                  {pitch.amount && (
                    <Typography variant="body2">
                      <strong>Amount:</strong> ${pitch.amount}
                    </Typography>
                  )}
                  {pitch.agreementTemplateId && (
                    <Typography variant="body2">
                      <strong>Agreement Template:</strong> {pitch.agreementTemplateId}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default V3PitchModal;

V3PitchModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pitch: PropTypes.object,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
}; 