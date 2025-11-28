import dayjs from 'dayjs';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Grid,
  Chip,
  Stack,
  Paper,
  Dialog,
  Button,
  Avatar,
  Divider,
  Typography,
  IconButton,
  DialogContent,
} from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import { RHFUpload } from 'src/components/hook-form';

// ----------------------------------------------------------------------

CampaignUploadPhotos.propTypes = {
  isPreview: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default function CampaignUploadPhotos({ isPreview = false, isLoading = false }) {
  const { watch, setValue } = useFormContext();
  const [openPreview, setOpenPreview] = useState(false);
  const theme = useTheme();
  const { user } = useAuthContext();

  const clientBrandName =
    user?.company?.name || user?.client?.company?.name || user?.brandName || user?.name || 'Your Brand';

  // Resolve client company logo (from profile/company or local persisted value)
  let clientLogoUrl = '';
  try {
    const stored = localStorage.getItem('client_company_logo');
    clientLogoUrl = stored || user?.company?.logo || user?.client?.company?.logo || '';
  } catch {
    clientLogoUrl = user?.company?.logo || user?.client?.company?.logo || '';
  }

  // Watch all necessary form values for preview
  const campaignTitle = watch('campaignTitle');
  const campaignStartDate = watch('campaignStartDate');
  const campaignEndDate = watch('campaignEndDate');
  const campaignInfo = watch('campaignInfo');
  const campaignObjectives = watch('campaignObjectives');
  const campaignIndustries = watch('campaignIndustries');
  const campaignImages = watch('campaignImages');
  const audienceGender = watch('audienceGender');
  const audienceAge = watch('audienceAge');
  const audienceLanguage = watch('audienceLanguage');
  const audienceLocation = watch('audienceLocation');
  const audienceCreatorPersona = watch('audienceCreatorPersona');
  const userPersona = watch('userPersona');
  const socialMediaPlatform = watch('socialMediaPlatform');
  const videoAngle = watch('videoAngle');
  const campaignDo = watch('campaignDo');
  const campaignDont = watch('campaignDont');

  const handleOpenPreview = () => {
    setOpenPreview(true);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
  };

  // If in preview mode inside the confirmation modal, just render the modal content
  if (isPreview) {
    return (
      <Box sx={{ p: 0, overflow: 'hidden' }}>
        {/* Campaign image */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: 150, sm: 200 },
            width: '100%',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'visible',
            zIndex: 1,
          }}
        >
          {campaignImages && campaignImages.length > 0 ? (
            <Image
              src={campaignImages[0].preview}
              alt="Campaign Image"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                border: 'none',
                margin: 0,
                padding: 0,
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                bgcolor: 'background.neutral',
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

          {/* CAMPAIGN PREVIEW Label */}
          <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
            <Box
              sx={{
                border: '1.5px solid #e7e7e7',
                borderBottom: '4px solid #e7e7e7',
                borderRadius: 1,
                p: 0.8,
                bgcolor: 'white',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#000000',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                CAMPAIGN PREVIEW
              </Typography>
            </Box>
          </Box>

          {/* Company Avatar */}
          <Avatar
            src={clientLogoUrl}
            alt={clientBrandName}
            sx={{
              position: 'absolute',
              left: 24,
              bottom: -32,
              width: 72,
              height: 72,
              border: '4px solid',
              borderColor: 'background.paper',
              zIndex: 1000,
              bgcolor: theme.palette.primary.main,
            }}
          />
        </Box>

        {/* Campaign info */}
        <Box
          sx={{
            px: 3,
            pb: 3,
            mt: 4,
            maxWidth: '100%',
            mx: 'auto',
          }}
        >
          <Grid container rowGap={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Grid item xs={12} sm={6}>
              <Stack spacing={0.5} width={{ xs: '100%', sm: 'auto' }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: '550',
                    fontSize: { xs: '2rem', sm: '2.4rem' },
                    mb: 1,
                    mt: 0.5,
                    fontFamily: 'Instrument Serif, serif',
                  }}
                >
                  {campaignTitle || 'Campaign Title'}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '1rem' },
                    mt: -2,
                    mb: -1.5,
                    color: '#636366',
                    fontWeight: 480,
                  }}
                >
                  {clientBrandName}
                </Typography>
              </Stack>
            </Grid>

            {/* Cancel and Confirm buttons */}
            <Grid item xs={12} sm={6}>
              <Stack
                direction="row"
                spacing={2}
                justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                sx={{ mt: { xs: 2, sm: 0 } }}
              >
                <Button
                  variant="outlined"
                  onClick={() => window.dispatchEvent(new CustomEvent('cancelCampaign'))}
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid #E7E7E7',
                    color: '#3A3A3C',
                    '&:hover': {
                      bgcolor: '#F8F8F8',
                      border: '1px solid #E7E7E7',
                    },
                    fontWeight: 600,
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.05) inset',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => window.dispatchEvent(new CustomEvent('confirmCampaign'))}
                  disabled={isLoading}
                  sx={{
                    bgcolor: '#3A3A3C',
                    '&:hover': {
                      bgcolor: '#2A2A2C',
                    },
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
                    fontWeight: 600,
                  }}
                >
                  {isLoading ? 'Processing...' : 'Confirm'}
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {/* Add Divider here */}
          <Divider sx={{ my: 2, mb: 3 }} />

          {/* Campaign details grid */}
          <Grid container spacing={2}>
            {/* Left column */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  pr: { md: 2 },
                  overflow: 'visible', // Change from { xs: 'visible', md: 'auto' } to always be visible
                  pb: 3,
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        Campaign Period
                      </Typography>
                      <Typography variant="body2">
                        {campaignStartDate && campaignEndDate
                          ? `${dayjs(campaignStartDate).format('DD MMM YYYY')} - ${dayjs(campaignEndDate).format('DD MMM YYYY')}`
                          : 'No dates selected'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        Industry
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(campaignIndustries || []).map((industry, index) => (
                          <Chip
                            key={index}
                            label={
                              typeof industry === 'string' ? industry.replace(/"/g, '') : industry
                            }
                            size="small"
                            sx={{
                              bgcolor: '#FFF',
                              border: 1,
                              borderColor: '#EBEBEB',
                              borderRadius: 1,
                              color: '#636366',
                              height: '32px',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              '& .MuiChip-label': {
                                fontWeight: 700,
                                px: 1.5,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '-3px',
                              },
                              '&:hover': { bgcolor: '#FFF' },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Box>
                      {/* Campaign Details */}
                      <Box sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            border: '1.5px solid #203ff5',
                            borderBottom: '4px solid #203ff5',
                            borderRadius: 1,
                            p: 1,
                            mb: 1,
                            width: 'fit-content',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                              component="img"
                              src="/assets/icons/components/ic_bluesmiley.svg"
                              sx={{
                                width: 20,
                                height: 20,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#203ff5',
                                fontWeight: 600,
                              }}
                            >
                              CAMPAIGN DETAILS
                            </Typography>
                          </Stack>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            pl: 0.5,
                            textAlign: 'justify',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            maxWidth: '100%',
                          }}
                        >
                          {campaignInfo || 'No description provided'}
                        </Typography>
                      </Box>

                      {/* Campaign Objectives */}
                      <Box sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            border: '1.5px solid #835cf5',
                            borderBottom: '4px solid #835cf5',
                            borderRadius: 1,
                            p: 1,
                            mb: 1,
                            width: 'fit-content',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                              component="img"
                              src="/assets/icons/components/ic_objectives.svg"
                              sx={{
                                color: '#835cf5',
                                width: 20,
                                height: 20,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#835cf5',
                                fontWeight: 600,
                              }}
                            >
                              CAMPAIGN OBJECTIVES
                            </Typography>
                          </Stack>
                        </Box>
                        <Stack spacing={1} sx={{ pl: 0.5 }}>
                          {(campaignObjectives || []).map((objective, index) => (
                            <Stack key={index} direction="row" spacing={1} alignItems="center">
                              <Iconify
                                icon="octicon:dot-fill-16"
                                sx={{
                                  color: '#000000',
                                  width: 12,
                                  height: 12,
                                  flexShrink: 0,
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  maxWidth: '100%',
                                }}
                              >
                                {typeof objective === 'string'
                                  ? objective.replace(/"/g, '')
                                  : objective}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>

                      {/* Campaign Do's */}
                      {campaignDo && campaignDo.length > 0 && campaignDo[0].value && (
                        <Box sx={{ mb: 3 }}>
                          <Box
                            sx={{
                              border: '1.5px solid #2e6c56',
                              borderBottom: '4px solid #2e6c56',
                              borderRadius: 1,
                              p: 1,
                              mb: 1,
                              width: 'fit-content',
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box
                                component="img"
                                src="/assets/icons/components/ic_dos.svg"
                                sx={{
                                  color: '#2e6c56',
                                  width: 20,
                                  height: 20,
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#2e6c56',
                                  fontWeight: 600,
                                }}
                              >
                                CAMPAIGN DO&apos;S
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack spacing={1} sx={{ pl: 0.5 }}>
                            {campaignDo.map(
                              (item, index) =>
                                item.value && (
                                  <Stack
                                    key={index}
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Iconify
                                      icon="octicon:dot-fill-16"
                                      sx={{
                                        color: '#000000',
                                        width: 12,
                                        height: 12,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        whiteSpace: 'pre-wrap',
                                        maxWidth: '100%',
                                      }}
                                    >
                                      {item.value}
                                    </Typography>
                                  </Stack>
                                )
                            )}
                          </Stack>
                        </Box>
                      )}

                      {/* Campaign Don'ts */}
                      {campaignDont && campaignDont.length > 0 && campaignDont[0].value && (
                        <Box>
                          <Box
                            sx={{
                              border: '1.5px solid #eb4a26',
                              borderBottom: '4px solid #eb4a26',
                              borderRadius: 1,
                              p: 1,
                              mb: 1,
                              width: 'fit-content',
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box
                                component="img"
                                src="/assets/icons/components/ic_donts.svg"
                                sx={{
                                  color: '#eb4a26',
                                  width: 20,
                                  height: 20,
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#eb4a26',
                                  fontWeight: 600,
                                }}
                              >
                                CAMPAIGN DON&apos;TS
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack spacing={1} sx={{ pl: 0.5 }}>
                            {campaignDont.map(
                              (item, index) =>
                                item.value && (
                                  <Stack
                                    key={index}
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Iconify
                                      icon="octicon:dot-fill-16"
                                      sx={{
                                        color: '#000000',
                                        width: 12,
                                        height: 12,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        whiteSpace: 'pre-wrap',
                                        maxWidth: '100%',
                                      }}
                                    >
                                      {item.value}
                                    </Typography>
                                  </Stack>
                                )
                            )}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Vertical Divider */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: 'none', md: 'block' },
                mr: '-1px',
                mt: '-8px',
                height: 'auto',
                alignSelf: 'stretch',
              }}
            />

            {/* Right column - Audience Targeting */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  pl: { md: 2 },
                  pr: { md: 0 },
                  overflow: 'visible', // Change from { xs: 'visible', md: 'auto' } to always be visible
                  pb: 3,
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Gender */}
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        Gender
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Array.isArray(audienceGender) && audienceGender.length > 0 ? (
                          audienceGender.map((gender, index) => (
                            <Chip
                              key={index}
                              label={gender}
                              size="small"
                              sx={{
                                bgcolor: '#FFF',
                                border: 1,
                                borderColor: '#EBEBEB',
                                borderRadius: 1,
                                color: '#636366',
                                height: '32px',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                '& .MuiChip-label': {
                                  fontWeight: 700,
                                  px: 1.5,
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginTop: '-3px',
                                },
                                '&:hover': { bgcolor: '#FFF' },
                              }}
                            />
                          ))
                        ) : (
                          <Chip
                            label="Not specified"
                            size="small"
                            sx={{
                              bgcolor: '#FFF',
                              border: 1,
                              borderColor: '#EBEBEB',
                              borderRadius: 1,
                              color: '#636366',
                              height: '32px',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              '& .MuiChip-label': {
                                fontWeight: 700,
                                px: 1.5,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '-3px',
                              },
                              '&:hover': { bgcolor: '#FFF' },
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Age */}
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        Age
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Array.isArray(audienceAge) && audienceAge.length > 0 ? (
                          audienceAge.map((age, index) => (
                            <Chip
                              key={index}
                              label={age}
                              size="small"
                              sx={{
                                bgcolor: '#FFF',
                                border: 1,
                                borderColor: '#EBEBEB',
                                borderRadius: 1,
                                color: '#636366',
                                height: '32px',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                '& .MuiChip-label': {
                                  fontWeight: 700,
                                  px: 1.5,
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginTop: '-3px',
                                },
                                '&:hover': { bgcolor: '#FFF' },
                              }}
                            />
                          ))
                        ) : (
                          <Chip
                            label="Not specified"
                            size="small"
                            sx={{
                              bgcolor: '#FFF',
                              border: 1,
                              borderColor: '#EBEBEB',
                              borderRadius: 1,
                              color: '#636366',
                              height: '32px',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              '& .MuiChip-label': {
                                fontWeight: 700,
                                px: 1.5,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '-3px',
                              },
                              '&:hover': { bgcolor: '#FFF' },
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Geo Location */}
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        Geo Location
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(audienceLocation || []).map((location, index) => (
                          <Chip
                            key={index}
                            label={location}
                            size="small"
                            sx={{
                              bgcolor: '#FFF',
                              border: 1,
                              borderColor: '#EBEBEB',
                              borderRadius: 1,
                              color: '#636366',
                              height: '32px',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              '& .MuiChip-label': {
                                fontWeight: 700,
                                px: 1.5,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '-3px',
                              },
                              '&:hover': { bgcolor: '#FFF' },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Language */}
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        Language
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip
                          label={audienceLanguage || 'Not specified'}
                          size="small"
                          sx={{
                            bgcolor: '#FFF',
                            border: 1,
                            borderColor: '#EBEBEB',
                            borderRadius: 1,
                            color: '#636366',
                            height: '32px',
                            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                            '& .MuiChip-label': {
                              fontWeight: 700,
                              px: 1.5,
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginTop: '-3px',
                            },
                            '&:hover': { bgcolor: '#FFF' },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Creator Persona */}
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        Creator Persona
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Array.isArray(audienceCreatorPersona) && audienceCreatorPersona.length > 0 ? (
                          audienceCreatorPersona.map((persona, index) => (
                            <Chip
                              key={index}
                              label={persona}
                              size="small"
                              sx={{
                                bgcolor: '#FFF',
                                border: 1,
                                borderColor: '#EBEBEB',
                                borderRadius: 1,
                                color: '#636366',
                                height: '32px',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                '& .MuiChip-label': {
                                  fontWeight: 700,
                                  px: 1.5,
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginTop: '-3px',
                                },
                                '&:hover': { bgcolor: '#FFF' },
                              }}
                            />
                          ))
                        ) : (
                          <Chip
                            label="Not specified"
                            size="small"
                            sx={{
                              bgcolor: '#FFF',
                              border: 1,
                              borderColor: '#EBEBEB',
                              borderRadius: 1,
                              color: '#636366',
                              height: '32px',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              '& .MuiChip-label': {
                                fontWeight: 700,
                                px: 1.5,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '-3px',
                              },
                              '&:hover': { bgcolor: '#FFF' },
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* User Persona */}
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        User Persona
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 420,
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          maxWidth: '100%',
                        }}
                      >
                        {userPersona || 'Not specified'}
                      </Typography>
                    </Box>

                    {/* Social Media Platform */}
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        Social Media Platform
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(socialMediaPlatform || []).map((platform, index) => (
                          <Chip
                            key={index}
                            label={platform}
                            size="small"
                            sx={{
                              bgcolor: '#FFF',
                              border: 1,
                              borderColor: '#EBEBEB',
                              borderRadius: 1,
                              color: '#636366',
                              height: '32px',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              '& .MuiChip-label': {
                                fontWeight: 700,
                                px: 1.5,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '-3px',
                              },
                              '&:hover': { bgcolor: '#FFF' },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Video Angle */}
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        Video Angle
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(videoAngle || []).map((angle, index) => (
                          <Chip
                            key={index}
                            label={angle}
                            size="small"
                            sx={{
                              bgcolor: '#FFF',
                              border: 1,
                              borderColor: '#EBEBEB',
                              borderRadius: 1,
                              color: '#636366',
                              height: '32px',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              '& .MuiChip-label': {
                                fontWeight: 700,
                                px: 1.5,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '-3px',
                              },
                              '&:hover': { bgcolor: '#FFF' },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  }

  // Regular upload component with preview
  return (
    <Box sx={{ maxWidth: '650px', mx: 'auto' }}>
      <Typography variant="body1" textAlign="center" mb={3}>
        The image you select will be used on your campaign card as shown below
      </Typography>

      <RHFUpload
        name="campaignImages"
        maxSize={3145728}
        maxFiles={5}
        multiple
        accept={{ 'image/*': [] }}
        thumbnail
        type="file"
        onDrop={(acceptedFiles) => {
          const newFiles = acceptedFiles.map((file) =>
            Object.assign(file, {
              preview: URL.createObjectURL(file),
            })
          );

          const currentFiles = watch('campaignImages') || [];
          setValue('campaignImages', [...currentFiles, ...newFiles]);
        }}
        onRemove={(file) => {
          const filteredFiles = (watch('campaignImages') || []).filter((f) => f !== file);
          setValue('campaignImages', filteredFiles);
        }}
        onRemoveAll={() => {
          setValue('campaignImages', []);
        }}
        helperText="Upload up to 5 images. Acceptable files: JPG, PNG"
      />

      {campaignImages && campaignImages.length > 0 && (
        <>
          <Box
            onClick={handleOpenPreview}
            sx={{
              mt: 4,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s',
              bgcolor: 'background.default',
              borderRadius: '15px',
              border: '1.2px solid',
              borderColor: theme.palette.divider,
              position: 'relative',
              mb: 2,
              height: 345,
              width: { xs: '100%', sm: '345px', md: '345px' },
              mx: 'auto',
              // '&:hover': {
              //   borderColor: '#1340ff',
              //   transform: 'translateY(-2px)',
              // },
            }}
          >
            {/* Campaign Preview Label */}
            <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 1 }}>
              <Box
                sx={{
                  border: '1.5px solid #e7e7e7',
                  borderBottom: '4px solid #e7e7e7',
                  borderRadius: 1,
                  p: 0.8,
                  bgcolor: 'white',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify
                    icon="mdi:eye-outline"
                    width={16}
                    height={16}
                    sx={{ color: '#8E8E93' }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#000000',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  >
                    CAMPAIGN PREVIEW
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Campaign Image */}
            <Box sx={{ position: 'relative', height: 180, overflow: 'hidden' }}>
              <Image
                alt={campaignTitle || 'Campaign Preview'}
                src={campaignImages[0]?.preview || ''}
                sx={{
                  height: '100%',
                  width: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
            </Box>

            {/* Campaign Details */}
            <Box sx={{ position: 'relative', pt: 2, px: 3, pb: 2.5 }}>
              <Box sx={{ mt: 0.5 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 650,
                    mb: -0.1,
                    pb: 0.2,
                    mt: 0.8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {campaignTitle || 'Campaign Title'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    color: '#8e8e93',
                    fontSize: '0.95rem',
                    fontWeight: 550,
                  }}
                >
                  {clientBrandName}
                </Typography>
              </Box>

              <Stack spacing={0.5}>
                <Stack direction="row" alignItems="center" spacing={1.2}>
                  <Iconify icon="mdi:tag" width={20} height={20} sx={{ color: '#8e8e93' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#8e8e93',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    {campaignIndustries && campaignIndustries.length > 0
                      ? campaignIndustries[0]
                      : 'Industry'}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1.2}>
                    <Iconify icon="mdi:calendar" width={20} height={20} sx={{ color: '#8e8e93' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#8e8e93',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {campaignStartDate && campaignEndDate
                        ? `${dayjs(campaignStartDate).format('D MMM YYYY')} - ${dayjs(
                            campaignEndDate
                          ).format('D MMM YYYY')}`
                        : 'Select campaign dates'}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          </Box>

          <Typography
            variant="body2"
            sx={{
              mt: 1,
              mb: 3,
              color: 'text.secondary',
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            Click on Confirm Campaign to preview your campaign
          </Typography>
        </>
      )}

      {/* Campaign Preview Modal */}
      <Dialog
        open={openPreview}
        onClose={handleClosePreview}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '98vh',
            position: 'relative',
            width: { xs: '95vw', md: '80vh' },
            overflow: 'hidden', // Add this to ensure proper overflow handling
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            overflow: 'auto', // Change from { xs: 'auto', md: 'hidden' } to always allow scrolling
            maxHeight: 'calc(100vh - 64px)', // Add explicit max height
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            },
          }}
        >
          {/* Campaign image */}
          <Box
            sx={{
              position: 'relative',
              height: { xs: 150, sm: 200 },
              width: '100%',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              overflow: 'visible',
              zIndex: 1,
            }}
          >
            <IconButton
              onClick={handleClosePreview}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                zIndex: 1,
              }}
            >
              <Iconify icon="ic:round-close" />
            </IconButton>

            {campaignImages && campaignImages.length > 0 ? (
              <Image
                src={campaignImages[0].preview}
                alt="Campaign Image"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  border: 'none',
                  margin: 0,
                  padding: 0,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  bgcolor: 'background.neutral',
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

            {/* CAMPAIGN PREVIEW Label */}
            <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
              <Box
                sx={{
                  border: '1.5px solid #e7e7e7',
                  borderBottom: '4px solid #e7e7e7',
                  borderRadius: 1,
                  p: 0.8,
                  bgcolor: 'white',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: '#000000',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  CAMPAIGN PREVIEW
                </Typography>
              </Box>
            </Box>

            {/* Company Avatar */}
            <Avatar
              src=""
              alt={clientBrandName}
              sx={{
                position: 'absolute',
                left: 24,
                bottom: -32,
                width: 72,
                height: 72,
                border: '4px solid',
                borderColor: 'background.paper',
                zIndex: 1000,
                bgcolor: theme.palette.primary.main,
              }}
            />
          </Box>

          {/* Campaign info */}
          <Box sx={{ px: 3, pb: 3, mt: 4 }}>
            <Grid container rowGap={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={0.5} width={{ xs: '100%', sm: 'auto' }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: '550',
                      fontSize: { xs: '2rem', sm: '2.4rem' },
                      mb: 1,
                      mt: 0.5,
                      fontFamily: 'Instrument Serif, serif',
                    }}
                  >
                    {campaignTitle || 'Campaign Title'}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: { xs: '0.8rem', sm: '1rem' },
                      mt: -2,
                      mb: -1.5,
                      color: '#636366',
                      fontWeight: 480,
                    }}
                  >
                    {clientBrandName}
                  </Typography>
                </Stack>
              </Grid>

              {/* Add Cancel and Confirm buttons here */}
              {isPreview && (
                <Grid item xs={12} sm={6}>
                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                    sx={{ mt: { xs: 2, sm: 0 } }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => window.dispatchEvent(new CustomEvent('cancelCampaign'))}
                      sx={{
                        bgcolor: 'white',
                        border: '1px solid #E7E7E7',
                        color: '#3A3A3C',
                        '&:hover': {
                          bgcolor: '#F8F8F8',
                          border: '1px solid #E7E7E7',
                        },
                        fontWeight: 600,
                        boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.05) inset',
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => window.dispatchEvent(new CustomEvent('confirmCampaign'))}
                      disabled={isLoading}
                      sx={{
                        bgcolor: '#3A3A3C',
                        '&:hover': {
                          bgcolor: '#2A2A2C',
                        },
                        boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
                        fontWeight: 600,
                      }}
                    >
                      {isLoading ? 'Processing...' : 'Confirm'}
                    </Button>
                  </Stack>
                </Grid>
              )}
            </Grid>

            {/* Add Divider here */}
            <Divider sx={{ my: 2, mb: 3 }} />

            {/* Campaign details grid */}
            <Grid container spacing={2}>
              {/* Left column */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    pr: { md: 4 },
                    overflow: 'visible', // Change from { xs: 'visible', md: 'auto' } to always be visible
                    pb: 3,
                  }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                        >
                          Campaign Period
                        </Typography>
                        <Typography variant="body2">
                          {campaignStartDate && campaignEndDate
                            ? `${dayjs(campaignStartDate).format('DD MMM YYYY')} - ${dayjs(campaignEndDate).format('DD MMM YYYY')}`
                            : 'No dates selected'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                        >
                          Industry
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(campaignIndustries || []).map((industry, index) => (
                            <Chip
                              key={index}
                              label={
                                typeof industry === 'string' ? industry.replace(/"/g, '') : industry
                              }
                              size="small"
                              sx={{
                                bgcolor: '#FFF',
                                border: 1,
                                borderColor: '#EBEBEB',
                                borderRadius: 1,
                                color: '#636366',
                                height: '32px',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                '& .MuiChip-label': {
                                  fontWeight: 700,
                                  px: 1.5,
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginTop: '-3px',
                                },
                                '&:hover': { bgcolor: '#FFF' },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                      <Box>
                        {/* Campaign Details */}
                        <Box sx={{ mb: 3 }}>
                          <Box
                            sx={{
                              border: '1.5px solid #203ff5',
                              borderBottom: '4px solid #203ff5',
                              borderRadius: 1,
                              p: 1,
                              mb: 1,
                              width: 'fit-content',
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box
                                component="img"
                                src="/assets/icons/components/ic_bluesmiley.svg"
                                sx={{
                                  width: 20,
                                  height: 20,
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#203ff5',
                                  fontWeight: 600,
                                }}
                              >
                                CAMPAIGN DETAILS
                              </Typography>
                            </Stack>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              pl: 0.5,
                              textAlign: 'justify',
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              maxWidth: '100%',
                            }}
                          >
                            {campaignInfo || 'No description provided'}
                          </Typography>
                        </Box>

                        {/* Campaign Objectives */}
                        <Box sx={{ mb: 3 }}>
                          <Box
                            sx={{
                              border: '1.5px solid #835cf5',
                              borderBottom: '4px solid #835cf5',
                              borderRadius: 1,
                              p: 1,
                              mb: 1,
                              width: 'fit-content',
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box
                                component="img"
                                src="/assets/icons/components/ic_objectives.svg"
                                sx={{
                                  color: '#835cf5',
                                  width: 20,
                                  height: 20,
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#835cf5',
                                  fontWeight: 600,
                                }}
                              >
                                CAMPAIGN OBJECTIVES
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack spacing={1} sx={{ pl: 0.5 }}>
                            {(campaignObjectives || []).map((objective, index) => (
                              <Stack key={index} direction="row" spacing={1} alignItems="center">
                                <Iconify
                                  icon="octicon:dot-fill-16"
                                  sx={{
                                    color: '#000000',
                                    width: 12,
                                    height: 12,
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    maxWidth: '100%',
                                  }}
                                >
                                  {typeof objective === 'string'
                                    ? objective.replace(/"/g, '')
                                    : objective}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </Box>

                        {/* Campaign Do's */}
                        {campaignDo && campaignDo.length > 0 && campaignDo[0].value && (
                          <Box sx={{ mb: 3 }}>
                            <Box
                              sx={{
                                border: '1.5px solid #2e6c56',
                                borderBottom: '4px solid #2e6c56',
                                borderRadius: 1,
                                p: 1,
                                mb: 1,
                                width: 'fit-content',
                              }}
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Box
                                  component="img"
                                  src="/assets/icons/components/ic_dos.svg"
                                  sx={{
                                    color: '#2e6c56',
                                    width: 20,
                                    height: 20,
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: '#2e6c56',
                                    fontWeight: 600,
                                  }}
                                >
                                  CAMPAIGN DO&apos;S
                                </Typography>
                              </Stack>
                            </Box>
                            <Stack spacing={1} sx={{ pl: 0.5 }}>
                              {campaignDo.map(
                                (item, index) =>
                                  item.value && (
                                    <Stack
                                      key={index}
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                    >
                                      <Iconify
                                        icon="octicon:dot-fill-16"
                                        sx={{
                                          color: '#000000',
                                          width: 12,
                                          height: 12,
                                          flexShrink: 0,
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          wordWrap: 'break-word',
                                          overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          maxWidth: '100%',
                                        }}
                                      >
                                        {item.value}
                                      </Typography>
                                    </Stack>
                                  )
                              )}
                            </Stack>
                          </Box>
                        )}

                        {/* Campaign Don'ts */}
                        {campaignDont && campaignDont.length > 0 && campaignDont[0].value && (
                          <Box>
                            <Box
                              sx={{
                                border: '1.5px solid #eb4a26',
                                borderBottom: '4px solid #eb4a26',
                                borderRadius: 1,
                                p: 1,
                                mb: 1,
                                width: 'fit-content',
                              }}
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Box
                                  component="img"
                                  src="/assets/icons/components/ic_donts.svg"
                                  sx={{
                                    color: '#eb4a26',
                                    width: 20,
                                    height: 20,
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: '#eb4a26',
                                    fontWeight: 600,
                                  }}
                                >
                                  CAMPAIGN DON&apos;TS
                                </Typography>
                              </Stack>
                            </Box>
                            <Stack spacing={1} sx={{ pl: 0.5 }}>
                              {campaignDont.map(
                                (item, index) =>
                                  item.value && (
                                    <Stack
                                      key={index}
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                    >
                                      <Iconify
                                        icon="octicon:dot-fill-16"
                                        sx={{
                                          color: '#000000',
                                          width: 12,
                                          height: 12,
                                          flexShrink: 0,
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          wordWrap: 'break-word',
                                          overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          maxWidth: '100%',
                                        }}
                                      >
                                        {item.value}
                                      </Typography>
                                    </Stack>
                                  )
                              )}
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Vertical Divider */}
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  display: { xs: 'none', md: 'block' },
                  mr: '-1px',
                  mt: '-8px',
                  height: 'auto',
                  alignSelf: 'stretch',
                }}
              />

              {/* Right column - Audience Targeting */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    pl: { md: 2 },
                    overflow: 'visible', // Change from { xs: 'visible', md: 'auto' } to always be visible
                    pb: 3,
                  }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Gender */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                        >
                          Gender
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {Array.isArray(audienceGender) && audienceGender.length > 0 ? (
                            audienceGender.map((gender, index) => (
                              <Chip
                                key={index}
                                label={gender}
                                size="small"
                                sx={{
                                  bgcolor: '#FFF',
                                  border: 1,
                                  borderColor: '#EBEBEB',
                                  borderRadius: 1,
                                  color: '#636366',
                                  height: '32px',
                                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                  '& .MuiChip-label': {
                                    fontWeight: 700,
                                    px: 1.5,
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: '-3px',
                                  },
                                  '&:hover': { bgcolor: '#FFF' },
                                }}
                              />
                            ))
                          ) : (
                            <Chip
                              label="Not specified"
                              size="small"
                              sx={{
                                bgcolor: '#FFF',
                                border: 1,
                                borderColor: '#EBEBEB',
                                borderRadius: 1,
                                color: '#636366',
                                height: '32px',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                '& .MuiChip-label': {
                                  fontWeight: 700,
                                  px: 1.5,
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginTop: '-3px',
                                },
                                '&:hover': { bgcolor: '#FFF' },
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Age */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                        >
                          Age
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {Array.isArray(audienceAge) && audienceAge.length > 0 ? (
                            audienceAge.map((age, index) => (
                              <Chip
                                key={index}
                                label={age}
                                size="small"
                                sx={{
                                  bgcolor: '#FFF',
                                  border: 1,
                                  borderColor: '#EBEBEB',
                                  borderRadius: 1,
                                  color: '#636366',
                                  height: '32px',
                                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                  '& .MuiChip-label': {
                                    fontWeight: 700,
                                    px: 1.5,
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: '-3px',
                                  },
                                  '&:hover': { bgcolor: '#FFF' },
                                }}
                              />
                            ))
                          ) : (
                            <Chip
                              label="Not specified"
                              size="small"
                              sx={{
                                bgcolor: '#FFF',
                                border: 1,
                                borderColor: '#EBEBEB',
                                borderRadius: 1,
                                color: '#636366',
                                height: '32px',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                '& .MuiChip-label': {
                                  fontWeight: 700,
                                  px: 1.5,
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginTop: '-3px',
                                },
                                '&:hover': { bgcolor: '#FFF' },
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Geo Location */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                        >
                          Geo Location
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(audienceLocation || []).map((location, index) => (
                            <Chip
                              key={index}
                              label={location}
                              size="small"
                              sx={{
                                bgcolor: '#FFF',
                                border: 1,
                                borderColor: '#EBEBEB',
                                borderRadius: 1,
                                color: '#636366',
                                height: '32px',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                '& .MuiChip-label': {
                                  fontWeight: 700,
                                  px: 1.5,
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginTop: '-3px',
                                },
                                '&:hover': { bgcolor: '#FFF' },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>

                      {/* Language */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                        >
                          Language
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip
                            label={audienceLanguage || 'Not specified'}
                            size="small"
                            sx={{
                              bgcolor: '#FFF',
                              border: 1,
                              borderColor: '#EBEBEB',
                              borderRadius: 1,
                              color: '#636366',
                              height: '32px',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              '& .MuiChip-label': {
                                fontWeight: 700,
                                px: 1.5,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '-3px',
                              },
                              '&:hover': { bgcolor: '#FFF' },
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Creator Persona */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                        >
                          Creator Persona
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {Array.isArray(audienceCreatorPersona) && audienceCreatorPersona.length > 0 ? (
                            audienceCreatorPersona.map((persona, index) => (
                              <Chip
                                key={index}
                                label={persona}
                                size="small"
                                sx={{
                                  bgcolor: '#FFF',
                                  border: 1,
                                  borderColor: '#EBEBEB',
                                  borderRadius: 1,
                                  color: '#636366',
                                  height: '32px',
                                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                  '& .MuiChip-label': {
                                    fontWeight: 700,
                                    px: 1.5,
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: '-3px',
                                  },
                                  '&:hover': { bgcolor: '#FFF' },
                                }}
                              />
                            ))
                          ) : (
                            <Chip
                              label="Not specified"
                              size="small"
                              sx={{
                                bgcolor: '#FFF',
                                border: 1,
                                borderColor: '#EBEBEB',
                                borderRadius: 1,
                                color: '#636366',
                                height: '32px',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                '& .MuiChip-label': {
                                  fontWeight: 700,
                                  px: 1.5,
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginTop: '-3px',
                                },
                                '&:hover': { bgcolor: '#FFF' },
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* User Persona */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                        >
                          User Persona
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 420,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            maxWidth: '100%',
                          }}
                        >
                          {userPersona || 'Not specified'}
                        </Typography>
                      </Box>

                      {/* Social Media Platform */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                        >
                          Social Media Platform
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(socialMediaPlatform || []).map((platform, index) => (
                            <Chip
                              key={index}
                              label={platform}
                              size="small"
                              sx={{
                                bgcolor: '#FFF',
                                border: 1,
                                borderColor: '#EBEBEB',
                                borderRadius: 1,
                                color: '#636366',
                                height: '32px',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                '& .MuiChip-label': {
                                  fontWeight: 700,
                                  px: 1.5,
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginTop: '-3px',
                                },
                                '&:hover': { bgcolor: '#FFF' },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>

                      {/* Video Angle */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                        >
                          Video Angle
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(videoAngle || []).map((angle, index) => (
                            <Chip
                              key={index}
                              label={angle}
                              size="small"
                              sx={{
                                bgcolor: '#FFF',
                                border: 1,
                                borderColor: '#EBEBEB',
                                borderRadius: 1,
                                color: '#636366',
                                height: '32px',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                '& .MuiChip-label': {
                                  fontWeight: 700,
                                  px: 1.5,
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginTop: '-3px',
                                },
                                '&:hover': { bgcolor: '#FFF' },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
