import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

export default function UserCard({
  key,
  creator,
  campaign,
  campaignId,
  isSent,
  onEditAgreement,
  campaignMutate,
}) {
  const theme = useTheme();
  const router = useRouter();
  const loading = useBoolean();
  const confirmationDialog = useBoolean();
  const { user } = useAuthContext();
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const handleCardClick = () => {
    if (isSent) {
      router.push(paths.dashboard.campaign.manageCreator(campaignId, creator?.id));
    } else {
      onEditAgreement();
    }
  };

  // Toggle sort direction
  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const removeCreatorFromCampaign = async (userId, id) => {
    try {
      loading.onTrue();
      const res = await axiosInstance.post(endpoints.campaign.removeCreator, {
        creatorId: userId,
        campaignId: id,
      });

      campaignMutate();
      confirmationDialog.onFalse();
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  };

  return (
    <Box
      key={key}
      component="div"
      // onClick={handleCardClick}
      sx={{
        position: 'relative',
        // cursor: 'pointer',
        width: '100%',
        '&:hover': {
          // '& .MuiCard-root': {
          //   transform: 'translateY(-5px)',
          //   transition: 'transform 0.3s ease',
          // },
          // '& .MuiCard-root': {
          //   border: '1px solid #1340FF',
          // },
        },
      }}
    >
      <Card
        sx={{
          p: 3,
          border: '1px solid #ebebeb',
          borderRadius: 2,
          height: '100%',
          width: '100%',
        }}
      >
        {/* Top Section */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ minWidth: 0 }}
        >
          {/* Left Side - Profile Picture & Name */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Avatar
              alt={creator?.name}
              src={creator?.photoURL}
              sx={{
                width: 64,
                height: 64,
                border: '2px solid',
                borderColor: 'background.paper',
                mb: 2,
              }}
            >
              {creator?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                ml: 0.5,
                mb: -1.4,
                fontSize: '1.1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {`${creator?.name?.charAt(0).toUpperCase()}${creator?.name?.slice(1)}`}
            </Typography>
          </Box>

          {/* Right Side - Social Links and Label */}
          <Stack alignItems="flex-end" spacing={1} sx={{ ml: 1 }}>
            {/* Alphabetical Sort Button */}
            {/* <Button
              onClick={handleToggleSort}
              endIcon={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {sortDirection === 'asc' ? (
                    <Stack direction="column" alignItems="center" spacing={0}>
                      <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}>
                        A
                      </Typography>
                      <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}>
                        Z
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack direction="column" alignItems="center" spacing={0}>
                      <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}>
                        Z
                      </Typography>
                      <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}>
                        A
                      </Typography>
                    </Stack>
                  )}
                  <Iconify 
                    icon={sortDirection === 'asc' ? 'eva:arrow-downward-fill' : 'eva:arrow-upward-fill'} 
                    width={12}
                  />
                </Stack>
              }
              sx={{
                px: 1.5,
                py: 0.75,
                height: '32px',
                color: '#637381',
                fontWeight: 600,
                fontSize: '0.875rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: 1,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#221f20',
                },
              }}
            >
              Alphabetical
            </Button> */}

            <Stack direction="row" spacing={1}>
              <Tooltip title={creator?.creator?.instagram ? "Instagram account connected" : "Instagram account not connected"}>
                <span>
                  <IconButton
                    component={creator?.creator?.instagram ? "a" : "button"}
                    href={creator?.creator?.instagram ? `https://instagram.com/${creator?.creator?.instagram}` : undefined}
                    target="_blank"
                    disabled={!creator?.creator?.instagram}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      color: creator?.creator?.instagram ? '#636366' : '#a3a3a6',
                      border: '1px solid #e7e7e7',
                      borderBottom: '3px solid #e7e7e7',
                      borderRadius: 1,
                      cursor: creator?.creator?.instagram ? 'pointer' : 'not-allowed',
                      '&:hover': {
                        bgcolor: creator?.creator?.instagram ? alpha('#636366', 0.08) : 'transparent',
                      },
                      '&.Mui-disabled': {
                        color: '#a3a3a6',
                        border: '1px solid #e7e7e7',
                        borderBottom: '3px solid #e7e7e7',
                        opacity: 0.6,
                      },
                    }}
                  >
                    <Iconify icon="mdi:instagram" width={24} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={creator?.creator?.tiktok ? "TikTok account connected" : "TikTok account not connected"}>
                <span>
                  <IconButton
                    component={creator?.creator?.tiktok ? "a" : "button"}
                    href={creator?.creator?.tiktok ? `https://tiktok.com/@${creator?.creator?.tiktok}` : undefined}
                    target="_blank"
                    disabled={!creator?.creator?.tiktok}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      color: creator?.creator?.tiktok ? '#636366' : '#a3a3a6',
                      border: '1px solid #e7e7e7',
                      borderBottom: '3px solid #e7e7e7',
                      borderRadius: 1,
                      cursor: creator?.creator?.tiktok ? 'pointer' : 'not-allowed',
                      '&:hover': {
                        bgcolor: creator?.creator?.tiktok ? alpha('#636366', 0.08) : 'transparent',
                      },
                      '&.Mui-disabled': {
                        color: '#a3a3a6',
                        border: '1px solid #e7e7e7',
                        borderBottom: '3px solid #e7e7e7',
                        opacity: 0.6,
                      },
                    }}
                  >
                    <Iconify icon="ic:baseline-tiktok" width={24} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            {!isSent && (
              <Typography
                variant="caption"
                sx={{
                  backgroundColor: theme.palette.warning.main,
                  color: 'white',
                  padding: '3.5px 8px',
                  fontWeight: 600,
                  borderRadius: 1,
                }}
              >
                PENDING AGREEMENT
              </Typography>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Stats Section */}
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            mb: 3,
            mt: -1,
          }}
        >
          <Stack spacing={1} alignItems="flex-start" sx={{ minWidth: 0, flex: 0.8 }}>
            <Box
              component="img"
              src="/assets/icons/overview/purpleGroup.svg"
              sx={{ width: 24, height: 24, mb: -0.5 }}
            />
            <Typography variant="h6">N/A</Typography>
            <Typography
              variant="subtitle2"
              color="#8e8e93"
              sx={{
                whiteSpace: 'nowrap',
                fontWeight: 500,
                mt: -1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}
            >
              Followers
            </Typography>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ ml: 1, mr: 2 }} />

          <Stack spacing={1} alignItems="flex-start" sx={{ minWidth: 0, flex: 1.2 }}>
            <Box
              component="img"
              src="/assets/icons/overview/greenChart.svg"
              sx={{ width: 24, height: 24, mb: -0.5 }}
            />
            <Typography variant="h6">N/A</Typography>
            <Typography
              variant="subtitle2"
              color="#8e8e93"
              sx={{
                whiteSpace: 'nowrap',
                fontWeight: 500,
                mt: -1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}
            >
              Engagement Rate
            </Typography>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ ml: 2, mr: 1 }} />

          <Stack spacing={1} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
            <Box
              component="img"
              src="/assets/icons/overview/bubbleHeart.svg"
              sx={{ width: 24, height: 24, mb: -0.5 }}
            />
            <Typography variant="h6">N/A</Typography>
            <Typography
              variant="subtitle2"
              color="#8e8e93"
              sx={{
                whiteSpace: 'nowrap',
                fontWeight: 500,
                mt: -1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}
            >
              Average Likes
            </Typography>
          </Stack>
        </Box>

        {/* Updated View Profile Button */}
        <Stack spacing={2} zIndex={10000000}>
          <Button
            fullWidth
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            disabled={!isSent && isDisabled}
            sx={{
              mx: 'auto',
              width: '100%',
              display: isSent || !isDisabled ? 'block' : 'none', // Hide when isSent=false and isDisabled=true
              bgcolor: isSent ? '#3a3a3c' : '#ffffff',
              border: isSent ? 'none' : '1px solid #e7e7e7',
              borderBottom: isSent ? '3px solid #202021' : '3px solid #e7e7e7',
              height: 48,
              color: isSent ? '#ffffff' : '#203ff5',
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                bgcolor: isSent ? '#3a3a3c' : alpha('#636366', 0.08),
                opacity: 0.9,
              },
              flexBasis: '1/2',
            }}
          >
            {isSent ? 'View Profile' : 'Complete Agreement'}
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={(e) => {
              confirmationDialog.onTrue();
            }}
            disabled={isDisabled}
            sx={{
              mx: 'auto',
              display: 'block',
              bgcolor: theme.palette.error.main,
              border: theme.palette.error.main,
              borderBottom: `3px solid ${theme.palette.error.main}`,
              height: 48,
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                bgcolor: theme.palette.error.main,
                opacity: 0.9,
                cursor: 'pointer',
              },
              '&:disabled': {
                display: 'none',
              },
            }}
          >
            Withdraw Creator
          </Button>
        </Stack>
      </Card>

      <ConfirmDialog
        open={confirmationDialog.value}
        onClose={confirmationDialog.onFalse}
        title="Withdraw from Campaign?"
        content={
          <>
            <Typography variant="body2" gutterBottom>
              Are you sure you want to remove this creator? This action cannot be undone
            </Typography>
          </>
        }
        action={
          <LoadingButton
            variant="outlined"
            color="error"
            loading={loading.value}
            onClick={() => removeCreatorFromCampaign(creator.id, campaignId)}
            disabled={isDisabled}
          >
            Confirm
          </LoadingButton>
        }
      />
    </Box>
  );
}

UserCard.propTypes = {
  creator: PropTypes.object,
  campaignId: PropTypes.string,
  isSent: PropTypes.bool,
  onEditAgreement: PropTypes.func,
  key: PropTypes.string,
  campaignMutate: PropTypes.func,
  campaign: PropTypes.object,
};
