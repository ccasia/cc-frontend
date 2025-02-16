/* eslint-disable perfectionist/sort-imports */
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

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

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const handleCardClick = () => {
    if (campaignId && creator?.id) {
      router.push(paths.public.manageCreator(campaignId, creator.id));
    }
  };

  return (
    <Box
      key={key}
      component="div"
      sx={{
        position: 'relative',
        cursor: 'pointer',
        width: '100%',
        '&:hover': {
          '& .MuiCard-root': {
            transform: 'translateY(-5px)',
            transition: 'transform 0.3s ease',
          },
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
            <Stack direction="row" spacing={1}>
              {creator?.creator?.instagram && (
                <IconButton
                  component="a"
                  href={`https://instagram.com/${creator?.creator?.instagram}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    color: '#636366',
                    border: '1px solid #e7e7e7',
                    borderBottom: '3px solid #e7e7e7',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha('#636366', 0.08),
                    },
                  }}
                >
                  <Iconify icon="mdi:instagram" width={24} />
                </IconButton>
              )}
              {creator?.creator?.tiktok && (
                <IconButton
                  component="a"
                  href={`https://tiktok.com/@${creator?.creator?.tiktok}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    color: '#636366',
                    border: '1px solid #e7e7e7',
                    borderBottom: '3px solid #e7e7e7',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha('#636366', 0.08),
                    },
                  }}
                >
                  <Iconify icon="ic:baseline-tiktok" width={24} />
                </IconButton>
              )}
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
          display="grid"
          gridTemplateColumns="repeat(3, 1fr)"
          gap={3}
          sx={{
            mb: 3,
            mt: -1,
            minWidth: 0,
          }}
        >
          <Stack spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
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

          <Stack
            spacing={1}
            alignItems="flex-start"
            sx={{
              borderLeft: '1px solid #ebebeb',
              borderRight: '1px solid #ebebeb',
              px: 2,
              minWidth: 0,
            }}
          >
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

          <Stack spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
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
            sx={{
              mx: 'auto',
              width: '100%',
              //  display: isSent || !isDisabled ? 'block' : 'none', // Hide when isSent=false and isDisabled=true
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
            View Profile
            {/* {isSent ? 'View Profile' : 'Complete Agreement'} */}
          </Button>
        </Stack>
      </Card>
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
