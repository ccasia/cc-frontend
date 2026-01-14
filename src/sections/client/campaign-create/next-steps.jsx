import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

import {
  Box,
  Chip,
  Stack,
  Paper,
  Button,
  Avatar,
  Dialog,
  Divider,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

NextSteps.propTypes = {
  onPublish: PropTypes.func,
  onContinueAdditionalDetails: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default function NextSteps({ onPublish, onContinueAdditionalDetails, isLoading = false }) {
  const { watch } = useFormContext();
  const { user } = useAuthContext();
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleOpenPreview = () => setPreviewOpen(true);
  const handleClosePreview = () => setPreviewOpen(false);

  const handlePublish = () => {
    handleClosePreview();
    onPublish?.();
  };

  const clientBrandName =
    user?.company?.name || user?.client?.company?.name || user?.brandName || user?.name || 'Your Brand';

  // Resolve client company logo
  let clientLogoUrl = '';
  try {
    const stored = localStorage.getItem('client_company_logo');
    clientLogoUrl = stored || user?.company?.logo || user?.client?.company?.logo || '';
  } catch {
    clientLogoUrl = user?.company?.logo || user?.client?.company?.logo || '';
  }

  // Watch form values for preview
  const campaignTitle = watch('campaignTitle');
  const campaignStartDate = watch('campaignStartDate');
  const campaignEndDate = watch('campaignEndDate');
  const campaignDescription = watch('campaignDescription');
  const campaignObjectives = watch('campaignObjectives');
  const campaignIndustries = watch('campaignIndustries');
  const campaignImages = watch('campaignImages');
  const audienceGender = watch('audienceGender');
  const audienceAge = watch('audienceAge');
  const audienceLanguage = watch('audienceLanguage');
  const socialMediaPlatform = watch('socialMediaPlatform');
  const videoAngle = watch('videoAngle');
  const campaignDo = watch('campaignDo');
  const campaignDont = watch('campaignDont');

  const formatDate = (date) => {
    if (!date) return 'Not set';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
      {/* Main Content - Publish Button */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary" mb={4} sx={{ maxWidth: 500 }}>
          You may publish your campaign at this point, but completing the additional details encourages higher amounts of creator participation
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            size="large"
            onClick={handleOpenPreview}
            startIcon={<Iconify icon="mdi:rocket-launch" />}
            sx={{
              bgcolor: '#1340FF',
              px: 6,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
              '&:hover': {
                bgcolor: '#0030e0',
              },
            }}
          >
            Publish Campaign
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={onContinueAdditionalDetails}
            startIcon={<Iconify icon="mdi:arrow-right" />}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderColor: '#1340FF',
              color: '#1340FF',
              '&:hover': {
                bgcolor: 'rgba(19, 64, 255, 0.04)',
                borderColor: '#0030e0',
              },
            }}
          >
            Continue Additional Details
          </Button>
        </Stack>
      </Box>

      {/* Campaign Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6">Campaign Preview</Typography>
          <IconButton onClick={handleClosePreview} size="small">
            <Iconify icon="mdi:close" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {/* Campaign Preview Card */}
          <Paper elevation={0} sx={{ borderRadius: 0 }}>
            {/* Campaign Image Header */}
            <Box
              sx={{
                position: 'relative',
                height: 200,
                width: '100%',
                bgcolor: 'background.neutral',
              }}
            >
              {campaignImages && campaignImages.length > 0 ? (
                <Image
                  src={campaignImages[0].preview || campaignImages[0]}
                  alt="Campaign Image"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No image uploaded
                  </Typography>
                </Box>
              )}

              {/* Preview Label */}
              <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
                <Chip
                  label="CAMPAIGN PREVIEW"
                  size="small"
                  sx={{
                    bgcolor: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>

              {/* Company Avatar */}
              <Avatar
                src={clientLogoUrl}
                alt={clientBrandName}
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: 24,
                  width: 60,
                  height: 60,
                  border: '3px solid white',
                  bgcolor: 'primary.main',
                }}
              >
                {clientBrandName?.charAt(0)}
              </Avatar>
            </Box>

            {/* Campaign Details */}
            <Box sx={{ p: 3, pt: 5 }}>
              <Typography variant="h6" fontWeight={600} mb={0.5}>
                {campaignTitle || 'Untitled Campaign'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                by {clientBrandName}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Date Range */}
              <Stack direction="row" spacing={2} mb={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(campaignStartDate)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(campaignEndDate)}
                  </Typography>
                </Box>
              </Stack>

              {/* Description */}
              {campaignDescription && (
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    Campaign Info
                  </Typography>
                  <Typography variant="body2">{campaignDescription}</Typography>
                </Box>
              )}

              {/* Industries */}
              {campaignIndustries?.length > 0 && (
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Industries
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                    {campaignIndustries.map((industry) => (
                      <Chip key={industry} label={industry} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Objectives */}
              {campaignObjectives && (
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Primary Objective
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                    <Chip label={campaignObjectives} size="small" variant="outlined" />
                  </Stack>
                </Box>
              )}

              {/* Target Audience */}
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Target Audience
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                  {audienceGender?.map((g) => (
                    <Chip key={g} label={g} size="small" sx={{ bgcolor: '#E8F5E9' }} />
                  ))}
                  {audienceAge?.map((a) => (
                    <Chip key={a} label={a} size="small" sx={{ bgcolor: '#E3F2FD' }} />
                  ))}
                  {audienceLanguage?.map((l) => (
                    <Chip key={l} label={l} size="small" sx={{ bgcolor: '#FFF3E0' }} />
                  ))}
                </Stack>
              </Box>

              {/* Platform & Content */}
              {(socialMediaPlatform?.length > 0 || videoAngle?.length > 0) && (
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Platform & Content Type
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                    {socialMediaPlatform?.map((p) => (
                      <Chip key={p} label={p} size="small" variant="outlined" />
                    ))}
                    {videoAngle?.map((v) => (
                      <Chip key={v} label={v} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Do's and Don'ts */}
              <Stack direction="row" spacing={3}>
                {campaignDo?.filter((d) => d.value)?.length > 0 && (
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      <Iconify
                        icon="mdi:check-circle"
                        width={14}
                        sx={{ color: 'success.main', mr: 0.5 }}
                      />
                      Do&apos;s
                    </Typography>
                    {campaignDo
                      .filter((d) => d.value)
                      .map((item, idx) => (
                        <Typography key={idx} variant="body2" sx={{ fontSize: '0.8rem' }}>
                          • {item.value}
                        </Typography>
                      ))}
                  </Box>
                )}
                {campaignDont?.filter((d) => d.value)?.length > 0 && (
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      <Iconify
                        icon="mdi:close-circle"
                        width={14}
                        sx={{ color: 'error.main', mr: 0.5 }}
                      />
                      Don&apos;ts
                    </Typography>
                    {campaignDont
                      .filter((d) => d.value)
                      .map((item, idx) => (
                        <Typography key={idx} variant="body2" sx={{ fontSize: '0.8rem' }}>
                          • {item.value}
                        </Typography>
                      ))}
                  </Box>
                )}
              </Stack>
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={handleClosePreview} sx={{ mr: 1 }}>
            Go Back
          </Button>
          <Button
            variant="contained"
            onClick={handlePublish}
            disabled={isLoading}
            startIcon={<Iconify icon="mdi:rocket-launch" />}
            sx={{
              bgcolor: '#1340FF',
              px: 4,
              py: 1,
              fontWeight: 600,
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
              '&:hover': {
                bgcolor: '#0030e0',
              },
            }}
          >
            {isLoading ? 'Publishing...' : 'Confirm & Publish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
