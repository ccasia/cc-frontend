import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Chip,
  List,
  Link,
  Stack,
  Avatar,
  ListItem,
  Typography,
  ListItemIcon,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { MultiFilePreview } from 'src/components/upload';

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  if (string.toLowerCase() === 'f&b') return 'F&B';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const ChipStyle = {
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
};

const BoxStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  p: 3,
  mt: -1,
  mb: 3,
  width: '100%',
  '& .header': {
    borderBottom: '1px solid #e0e0e0',
    mx: -3,
    mt: -1,
    mb: 2,
    pb: 1.5,
    pt: -3,
    px: 1.8,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
};

const CampaignInfo = ({ campaign }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const requirement = campaign?.campaignRequirement;

  const handleChatClick = async (admin) => {
    try {
      const response = await axiosInstance.get(endpoints.threads.getAll);
      const existingThread = response.data.find((thread) => {
        const userIdsInThread = thread.UserThread.map((userThread) => userThread.userId);
        return (
          userIdsInThread.includes(user.id) &&
          userIdsInThread.includes(admin.user.id) &&
          !thread.isGroup
        );
      });

      if (existingThread) {
        navigate(`/dashboard/chat/thread/${existingThread.id}`);
      } else {
        const newThreadResponse = await axiosInstance.post(endpoints.threads.create, {
          title: `Chat between ${user.name} & ${admin.user.name}`,
          description: '',
          userIds: [user.id, admin.user.id],
          isGroup: false,
        });
        navigate(`/dashboard/chat/thread/${newThreadResponse.data.id}`);
      }
    } catch (error) {
      console.error('Error creating or finding chat thread:', error);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: '100%',
        px: 2,
        mx: 'auto',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Left Column */}
        <Stack spacing={-3} sx={{ flex: { xs: 1, md: 2 } }}>
          {/* Demographics Box */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="mdi:emoticon-happy"
                sx={{
                  color: '#203ff5',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN DEMOGRAPHICS
              </Typography>
            </Box>

            <Stack direction="row" spacing={4}>
              {/* Left Column */}
              <Stack spacing={2} sx={{ flex: 1 }}>
                {[
                  { label: 'Gender', data: requirement?.gender?.map(capitalizeFirstLetter) },
                  { label: 'Geo Location', data: requirement?.geoLocation },
                  {
                    label: 'Country',
                    data: requirement?.country || '',
                  },
                  {
                    label: 'Creator Persona',
                    data: requirement?.creator_persona?.map((value) =>
                      value.toLowerCase() === 'f&b' ? 'F&B' : capitalizeFirstLetter(value)
                    ),
                  },
                ]
                  .filter((item, _, arr) => {
                    if (item.label === 'Geo Location') {
                      const hasMalaysia =
                        arr.find((i) => i.label === 'Country')?.data === 'Malaysia';
                      return hasMalaysia;
                    }
                    if (item.label === 'Country') {
                      return item.data;
                    }
                    return true;
                  })
                  .map((item) => (
                    <Box key={item.label}>
                      <Typography
                        variant="body2"
                        sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                      >
                        {item.label}
                      </Typography>
                      {Array.isArray(item.data) ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {item.data?.map((value, idx) => (
                            <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                          ))}
                        </Box>
                      ) : (
                        item.label === 'Country' && (
                          <Box
                            display="inline-flex"
                            gap={1}
                            sx={{ ...ChipStyle, p: 1, px: 1.5 }}
                            alignItems="center"
                          >
                            <Iconify
                              icon={`emojione:flag-for-${item.data.toLowerCase()}`}
                              width={20}
                            />
                            <Typography variant="subtitle2">{item.data}</Typography>
                          </Box>
                        )
                      )}
                    </Box>
                  ))}
              </Stack>

              {/* Right Column */}
              <Stack spacing={2} sx={{ flex: 1 }}>
                {[
                  { label: 'Age', data: requirement?.age },
                  { label: 'Language', data: requirement?.language },
                ].map((item) => (
                  <Box key={item.label}>
                    <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
                      {item.label}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.data?.map((value, idx) => (
                        <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Box>

          {/* Objectives Box */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="mdi:target-arrow"
                sx={{
                  color: '#835cf5',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN OBJECTIVES
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
              <Iconify
                icon="octicon:dot-fill-16"
                sx={{
                  color: '#000000',
                  width: 12,
                  height: 12,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2">{campaign?.campaignBrief?.objectives}</Typography>
            </Stack>
          </Box>

          {/* Do's Box */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="material-symbols:check-box-outline"
                sx={{
                  color: '#2e6c56',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN DO&apos;S
              </Typography>
            </Box>

            <Stack spacing={1} sx={{ pl: 0.5 }}>
              {campaign?.campaignBrief?.campaigns_do?.map((item, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center">
                  {item.value && (
                    <Iconify
                      icon="octicon:dot-fill-16"
                      sx={{
                        color: '#000000',
                        width: 12,
                        height: 12,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Typography
                    variant={item?.value ? 'body2' : 'caption'}
                    color={item?.value && 'text.secondayr'}
                  >
                    {item?.value || 'No campaign do.'}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Don'ts Box */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="material-symbols:disabled-by-default-outline"
                sx={{
                  color: '#eb4a26',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN DON&apos;TS
              </Typography>
            </Box>

            {campaign?.campaignBrief?.campaigns_dont?.length > 0 ? (
              <Stack spacing={1} sx={{ pl: 0.5 }}>
                {campaign?.campaignBrief?.campaigns_dont?.map((item, index) => (
                  <Stack key={index} direction="row" spacing={1} alignItems="center">
                    {item.value && (
                      <Iconify
                        icon="octicon:dot-fill-16"
                        sx={{
                          color: '#000000',
                          width: 12,
                          height: 12,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Typography
                      variant={item?.value ? 'body2' : 'caption'}
                      color={item?.value && 'text.secondayr'}
                    >
                      {item?.value || "No campaign don't"}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No data found.
              </Typography>
            )}
          </Box>

          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="ep:guide"
                sx={{
                  color: '#203ff5',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                REFERENCE LINKS
              </Typography>
            </Box>

            {campaign?.campaignBrief?.referencesLinks?.length > 0 ? (
              <List>
                {campaign?.campaignBrief?.referencesLinks?.map((link, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Iconify icon="ix:reference" />
                    </ListItemIcon>
                    <Link key={index} href={link} target="_blank">
                      {link}
                    </Link>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                No references found.
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Right Column */}
        <Stack
          sx={{
            flex: { xs: 1, md: 1 },
            width: '100%',
          }}
        >
          {/* General Info Box */}
          <Box
            sx={{
              ...BoxStyle,
              mr: { xs: 0, md: 0 },
              width: '100%',
              '& .header': {
                ...BoxStyle['& .header'],
                pb: 1.5,
                pt: -3,
              },
            }}
          >
            <Box className="header">
              <Iconify
                icon="mdi:information"
                sx={{
                  color: '#203ff5',
                  width: 18,
                  height: 18,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                GENERAL INFO
              </Typography>
            </Box>

            <Stack spacing={2} sx={{ mt: 1 }}>
              {/* Client Info */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650, fontSize: '0.8rem' }}
                >
                  Client
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    src={campaign?.company?.logo || campaign?.brand?.logo}
                    alt={campaign?.company?.name || campaign?.brand?.name}
                    sx={{
                      width: 36,
                      height: 36,
                      border: '2px solid',
                      borderColor: 'background.paper',
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    {campaign?.company?.name || campaign?.brand?.name || 'Company Name'}
                  </Typography>
                </Stack>
              </Box>

              {/* Duration & Industry */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650, fontSize: '0.8rem' }}
                >
                  Duration
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  {`${dayjs(campaign?.campaignBrief?.startDate).format('LL')} - ${dayjs(campaign?.campaignBrief?.endDate).format('LL')}`}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650, fontSize: '0.8rem' }}
                >
                  Industry
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    label={campaign?.campaignBrief?.industries || 'Not specified'}
                    size="small"
                    sx={ChipStyle}
                  />
                </Box>
              </Box>
            </Stack>
          </Box>

          {/* Campaign Admin Box */}
          <Box
            sx={{
              ...BoxStyle,
              mr: { xs: 0, md: 0 },
              mt: 0.5,
              width: '100%',
            }}
          >
            <Box className="header">
              <Iconify
                icon="mdi:account-supervisor"
                sx={{
                  color: '#203ff5',
                  width: 18,
                  height: 18,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                CAMPAIGN MANAGER(S)
              </Typography>
            </Box>

            <Stack spacing={1}>
              {campaign?.campaignAdmin?.map((elem) => (
                <Stack
                  key={elem.id}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ py: 0.75 }}
                >
                  <Avatar src={elem.admin.user.photoURL} sx={{ width: 32, height: 32 }} />
                  <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                    {elem.admin.user.name}
                  </Typography>
                  <Box
                    onClick={() => handleChatClick(elem.admin)}
                    sx={{
                      cursor: 'pointer',
                      px: 1.5,
                      py: 0.5,
                      border: '1px solid #e7e7e7',
                      borderBottom: '3px solid #e7e7e7',
                      borderRadius: 1,
                      color: '#203ff5',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'rgba(32, 63, 245, 0.04)',
                      },
                    }}
                  >
                    Message
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Deliverables Box */}
          <Box
            sx={{
              ...BoxStyle,
              mr: { xs: 0, md: 0 },
              mt: 0.5,
              width: '100%',
            }}
          >
            <Box className="header">
              <Iconify
                icon="mdi:cube-outline"
                sx={{
                  color: '#203ff5',
                  width: 18,
                  height: 18,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                CAMPAIGN DELIVERABLES
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {[
                { label: 'UGC Videos', value: true },
                { label: 'Raw Footage', value: campaign?.rawFootage },
                { label: 'Photos', value: campaign?.photos },
                { label: 'Ads', value: campaign?.ads },
              ].map(
                (deliverable) =>
                  deliverable.value && (
                    <Chip
                      key={deliverable.label}
                      label={deliverable.label}
                      size="small"
                      sx={ChipStyle}
                    />
                  )
              )}
            </Box>
          </Box>

          {/* Campaign attachments */}
          <Box
            sx={{
              ...BoxStyle,
              mr: { xs: 0, md: 0 },
              mt: 0.5,
              width: '100%',
            }}
          >
            <Box className="header">
              <Iconify
                icon="mdi:files"
                sx={{
                  color: '#203ff5',
                  width: 18,
                  height: 18,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                OTHER ATTACHMENTS
              </Typography>
            </Box>
            {campaign?.campaignBrief?.otherAttachments?.length > 0 ? (
              <MultiFilePreview files={campaign?.campaignBrief?.otherAttachments} thumbnail />
            ) : (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                No attachments
              </Typography>
            )}
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

CampaignInfo.propTypes = {
  campaign: PropTypes.object,
};

export default CampaignInfo;
