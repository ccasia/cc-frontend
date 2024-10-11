import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from 'src/auth/hooks';
import axiosInstance from 'src/utils/axios';
import { endpoints } from 'src/utils/axios';

import { 
  Box, 
  Card, 
  Stack, 
  Avatar, 
  Tooltip, 
  IconButton, 
  Typography, 
  Divider,
  useTheme
} from '@mui/material';

import Iconify from 'src/components/iconify';

const CampaignAdmin = ({ campaign }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const theme = useTheme();

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

  const handleEmailClick = (adminEmail) => {
    window.location.href = `mailto:${adminEmail}`;
  };

  return (
    <Box display="flex" flexWrap="wrap" gap={3} justifyContent="center">
      {campaign?.campaignAdmin.map((elem) => (
        <Card 
          key={elem.id} 
          sx={{ 
            width: 280, 
            transition: 'all 0.3s',
            '&:hover': { 
              boxShadow: theme.shadows[10],
              transform: 'translateY(-5px)'
            }
          }}
        >
          <Box p={3} textAlign="center">
            <Avatar 
              src={elem.admin.user.photoURL} 
              sx={{ width: 80, height: 80, margin: 'auto', mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              {elem.admin.user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {elem.admin.role?.name}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={2} justifyContent="center">
              <Tooltip title="Chat with Account Manager">
                <IconButton 
                  onClick={() => handleChatClick(elem.admin)}
                  sx={{ 
                    bgcolor: theme.palette.primary.lighter,
                    '&:hover': { bgcolor: theme.palette.primary.light }
                  }}
                >
                  <Iconify icon="fluent:chat-12-regular" color={theme.palette.primary.main} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Email Account Manager">
                <IconButton 
                  onClick={() => handleEmailClick(elem.admin.user.email)}
                  sx={{ 
                    bgcolor: theme.palette.success.lighter,
                    '&:hover': { bgcolor: theme.palette.success.light }
                  }}
                >
                  <Iconify icon="ic:outline-email" color={theme.palette.success.main} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Card>
      ))}
    </Box>
  );
};

export default CampaignAdmin;

CampaignAdmin.propTypes = {
  campaign: PropTypes.object,
};