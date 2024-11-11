import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from 'src/auth/hooks';
import axiosInstance from 'src/utils/axios';
import { endpoints } from 'src/utils/axios';

import {
  Box,
  Stack,
  Typography,
  Chip,
  Divider,
  Avatar,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const ChipStyle = {
  bgcolor: '#e4e4e4',
  color: '#636366',
  borderRadius: 16,
  '& .MuiChip-label': {
    fontWeight: 700,
    px: 1.5,
    py: 0.5,
  },
  '&:hover': { bgcolor: '#e4e4e4' },
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
        return userIdsInThread.includes(user.id) && userIdsInThread.includes(admin.user.id) && !thread.isGroup;
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
    <Box sx={{ 
      maxWidth: '100%',
      px: 2,
      mx: 'auto'
    }}>
      <Stack 
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
      >
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
                  height: 20
                }}
              />
              <Typography
                variant="body2"
                sx={{ 
                  color: '#221f20', 
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                CAMPAIGN DEMOGRAPHICS
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={4}>
              {/* Left Column */}
              <Stack spacing={2} sx={{ flex: 1 }}>
                {[
                  { label: 'Gender', data: requirement?.gender },
                  { label: 'Geo Location', data: requirement?.geoLocation },
                  { label: 'Creator Persona', data: requirement?.creator_persona },
                ].map((item) => (
                  <Box key={item.label}>
                    <Typography
                      variant="body2"
                      sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                    >
                      {item.label}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.data?.map((value, idx) => (
                        <Chip
                          key={idx}
                          label={value}
                          size="small"
                          sx={ChipStyle}
                        />
                      ))}
                    </Box>
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
                    <Typography
                      variant="body2"
                      sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}
                    >
                      {item.label}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.data?.map((value, idx) => (
                        <Chip
                          key={idx}
                          label={value}
                          size="small"
                          sx={ChipStyle}
                        />
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
                  height: 20
                }}
              />
              <Typography
                variant="body2"
                sx={{ 
                  color: '#221f20', 
                  fontWeight: 600,
                  fontSize: '0.875rem'
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
                  flexShrink: 0
                }}
              />
              <Typography variant="body2">
                {campaign?.campaignBrief?.objectives}
              </Typography>
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
                  height: 20
                }}
              />
              <Typography
                variant="body2"
                sx={{ 
                  color: '#221f20', 
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                CAMPAIGN DO'S
              </Typography>
            </Box>
            
            <Stack spacing={1} sx={{ pl: 0.5 }}>
              {campaign?.campaignBrief?.campaigns_do?.map((item, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center">
                  <Iconify
                    icon="octicon:dot-fill-16"
                    sx={{ 
                      color: '#000000',
                      width: 12,
                      height: 12,
                      flexShrink: 0
                    }}
                  />
                  <Typography variant="body2">
                    {item.value}
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
                  height: 20
                }}
              />
              <Typography
                variant="body2"
                sx={{ 
                  color: '#221f20', 
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                CAMPAIGN DON'TS
              </Typography>
            </Box>
            
            <Stack spacing={1} sx={{ pl: 0.5 }}>
              {campaign?.campaignBrief?.campaigns_dont?.map((item, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center">
                  <Iconify
                    icon="octicon:dot-fill-16"
                    sx={{ 
                      color: '#000000',
                      width: 12,
                      height: 12,
                      flexShrink: 0
                    }}
                  />
                  <Typography variant="body2">
                    {item.value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>

        {/* Right Column */}
        <Stack sx={{ 
          flex: { xs: 1, md: 1 },
          width: '100%'
        }}>
          {/* General Info Box */}
          <Box sx={{ 
            ...BoxStyle,
            mr: { xs: 0, md: 0 },
            width: '100%',
            '& .header': {
              ...BoxStyle['& .header'],
              pb: 1.5,
              pt: -3,
            },
          }}>
            <Box className="header">
              <Iconify
                icon="mdi:information"
                sx={{ 
                  color: '#203ff5',
                  width: 18,
                  height: 18
                }}
              />
              <Typography
                variant="body2"
                sx={{ 
                  color: '#221f20', 
                  fontWeight: 600,
                  fontSize: '0.8rem'
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
                    src={campaign?.company?.logo}
                    alt={campaign?.company?.name}
                    sx={{
                      width: 36,
                      height: 36,
                      border: '2px solid',
                      borderColor: 'background.paper',
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    {campaign?.company?.name || 'Company Name'}
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
                    sx={{ ...ChipStyle, height: 24, '& .MuiChip-label': { fontSize: '0.8rem' } }}
                  />
                </Box>
              </Box>
            </Stack>
          </Box>

          {/* Campaign Admin Box */}
          <Box sx={{ 
            ...BoxStyle, 
            mr: { xs: 0, md: 0 },
            mt: 2,
            width: '100%'
          }}>
            <Box className="header">
              <Iconify
                icon="mdi:account-supervisor"
                sx={{ 
                  color: '#203ff5',
                  width: 18,
                  height: 18
                }}
              />
              <Typography
                variant="body2"
                sx={{ 
                  color: '#221f20', 
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              >
                CAMPAIGN ADMIN
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
                  <Avatar 
                    src={elem.admin.user.photoURL}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ flex: 1, fontSize: '0.8rem' }}
                  >
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
                        bgcolor: 'rgba(32, 63, 245, 0.04)'
                      }
                    }}
                  >
                    Message
                  </Box>
                </Stack>
              ))}
            </Stack>
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
