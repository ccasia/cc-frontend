import PropTypes from 'prop-types';
import { useState, useCallback, useMemo } from 'react';

import {
  Box,
  Stack,
  Avatar,
  TextField,
  Typography,
  Tooltip,
  SvgIcon,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useGetV4Submissions } from 'src/hooks/use-get-v4-submissions';
import { getStatusColor } from 'src/contants/statusColors';

import V4VideoSubmission from './submissions/v4/video-submission';
import V4PhotoSubmission from './submissions/v4/photo-submission';
import V4RawFootageSubmission from './submissions/v4/raw-footage-submission';
import { useAuthContext } from 'src/auth/hooks';
import EmptyContent from 'src/components/empty-content';

// ----------------------------------------------------------------------

function CreatorAccordionWithSubmissions({ creator, campaign }) {
  // Get V4 submissions for this creator to check if they have any
  const { 
    submissions, 
    submissionsLoading
  } = useGetV4Submissions(campaign?.id, creator?.userId);

  // Don't render if loading or if no submissions exist
  if (submissionsLoading || submissions.length === 0) {
    return null;
  }

  return (
    <CreatorAccordion 
      creator={creator} 
      campaign={campaign} 
    />
  );
}

function CreatorAccordion({ creator, campaign }) {
  const { user } = useAuthContext();
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  const campaignType = campaign.campaignType;

  // Get V4 submissions for this creator
  const { 
    submissions, 
    grouped, 
    submissionsLoading,
    submissionsMutate 
  } = useGetV4Submissions(campaign?.id, creator?.userId);

  const handleSubmissionToggle = useCallback(async (submissionType, submissionId) => {
    const key = `${submissionType}-${submissionId}`;
    const isCurrentlyExpanded = expandedSubmission === key;
    
    if (!isCurrentlyExpanded) {
      // If expanding, refresh the data first
      try {
        await submissionsMutate();
      } catch (error) {
        console.error('Error refreshing submission:', error);
      }
    }
    
    setExpandedSubmission(prev => prev === key ? null : key);
  }, [expandedSubmission, submissionsMutate]);

  const renderSubmissionPills = () => {
    const pills = [];
    let submissionCounter = 0;

    const formatStatus = (status) => {
      return status?.replace(/_/g, ' ') || 'Unknown';
    };

    // Status color
    const getClientStatusColor = (status, submissionType = null) => {
      // Admin-specific
      if (!isClient) {
        switch (status) {
          case 'CLIENT_APPROVED':
            // Only show PENDING_REVIEW color for video and photo submissions in normal campaigns
            if (campaignType === 'normal' && (submissionType === 'video' || submissionType === 'photo')) {
              return getStatusColor('PENDING_REVIEW');
            }
            return getStatusColor(status);
          default:
            return getStatusColor(status)
        }
      }
      
      // Client-specific
      switch (status) {
        case 'SENT_TO_CLIENT':
          return getStatusColor('PENDING_REVIEW');
        case 'PENDING_REVIEW':
          return getStatusColor('IN_PROGRESS');
        case 'CHANGES_REQUIRED':
        case 'CLIENT_FEEDBACK':
        case 'REJECTED':
          return getStatusColor('IN_PROGRESS');
        default:
          return getStatusColor(status); // Use default mapping for other statuses
      }
    };

    // Status labels
    const getClientStatusLabel = (status, submissionType = null) => {
      // Admin specific
      if (!isClient && campaignType === 'normal') {
        switch (status) {
          case 'CLIENT_APPROVED':
            // Only show PENDING POSTING for video and photo submissions, not raw footage
            if (submissionType === 'video' || submissionType === 'photo') {
              return 'PENDING LINK';
            }
            return formatStatus(status);
          default:
            return formatStatus(status);
        }
      } else if (!isClient) {
        return formatStatus(status)
      }

      // Client-specific
      switch (status) {
        case 'NOT_STARTED':
          return 'NOT STARTED';
        case 'IN_PROGRESS':
          return 'IN PROGRESS';
        case 'PENDING_REVIEW':
          return 'IN PROGRESS'; // Creator has submitted, admin reviewing
        case 'SENT_TO_CLIENT':
          return 'PENDING REVIEW'; // Client should see this as pending their review
        case 'CLIENT_APPROVED':
        case 'APPROVED':
          return 'APPROVED';
        case 'POSTED':
          return 'POSTED';
        case 'CLIENT_FEEDBACK':
          return 'IN PROGRESS'; 
        case 'CHANGES_REQUIRED':
        case 'REJECTED':
          return 'IN PROGRESS';
        default:
          return formatStatus(status);
      }
    };
    
    // Video submission pills
    grouped.videos?.forEach((videoSubmission, index) => {
      submissionCounter++;
      const key = `video-${videoSubmission.id}`;
      const isExpanded = expandedSubmission === key;

      pills.push(
        <Box
          key={key}
          onClick={() => handleSubmissionToggle('video', videoSubmission.id)}
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
          sx={{ 
            cursor: 'pointer',
            gap: { xs: 0.2, sm: 0.4, md: 0.5 },
            width: { xs: 140, sm: 160, md: 180, lg: 200 },
            minWidth: { xs: 120, sm: 140 },
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            '&:hover': {
              bgcolor: isExpanded ? 'background.neutral' : 'rgba(231, 231, 231, 0.8)',
            }
          }}
          bgcolor={isExpanded ? 'background.neutral' : '#E7E7E7'}
          py={{ xs: 1.2, sm: 1.5 }}
          pr={{ xs: 0.3, sm: 0.5 }}
          pl={{ xs: 0.5, sm: 0.8 }}
        >
          <Box display={'flex'} alignItems={'center'} justifyContent={'center'} gap={{ xs: 0.2, sm: 0.3 }}>
            <Tooltip 
              title="Video" 
              placement="top"
              PopperProps={{
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -7],
                    },
                  },
                ],
              }}
              componentsProps={{
                tooltip: {
                  sx: {
                    width: { xs: 80, sm: 95 },
                    height: { xs: 28, sm: 34 },
                    opacity: 1,
                    borderRadius: '10px',
                    padding: { xs: '6px', sm: '10px' },
                    bgcolor: '#FCFCFC',
                    color: '#000',
                    fontSize: { xs: '10px', sm: '12px' },
                    fontWeight: 'medium',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                }
              }}
            >
              <Box
                component="img"
                src="/assets/icons/components/ugc_vid.png"
                sx={{
                  width: { xs: 22, sm: 25, md: 27 },
                  height: { xs: 22, sm: 25, md: 27 },
                  filter: isExpanded ? 'brightness(0) saturate(100%) invert(27%) sepia(99%) saturate(6094%) hue-rotate(227deg) brightness(100%) contrast(104%)' : 'none',
                  cursor: 'pointer'
                }}
              />
            </Tooltip>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.3, sm: 0.5, md: 0.8, lg: 1 },
                px: { xs: 0.6, sm: 0.8, md: 1.0, lg: 1.3 },
                py: { xs: 0.3, sm: 0.4, md: 0.5, lg: 0.6 },
                border: '1px solid',
                borderColor: getClientStatusColor(videoSubmission.status, 'video'),
                borderRadius: 0.8,
                boxShadow: `0px -2px 0px 0px ${getClientStatusColor(videoSubmission.status, 'video')} inset`,
                bgcolor: '#fff',
                color: getClientStatusColor(videoSubmission.status, 'video'),
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              <Typography 
                fontWeight={'SemiBold'} 
                pb={0.2} 
                fontSize={{ xs: 8, sm: 9, md: 10, lg: 10.5 }} 
                color={getClientStatusColor(videoSubmission.status, 'video')}
                noWrap
                sx={{ 
                  maxWidth: { xs: 60, sm: 80, md: 100 },
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}
              >
                {getClientStatusLabel(videoSubmission.status, 'video')}
              </Typography>
            </Box>
          </Box>
          <Box
            display={'flex'}
            alignItems={'center'}
            flexShrink={0}
          >
            <Iconify 
              icon={isExpanded ? "mingcute:up-line" : "mingcute:down-line"}
              sx={{ 
                width: { xs: 20, sm: 22, md: 24, lg: 26 }, 
                height: { xs: 20, sm: 22, md: 24, lg: 26 } 
              }}
              color={isExpanded ? '#1340FF' : '#8E8E93'}
            />            
          </Box>
        </Box> 
      );
    });

    // Photo submission pills
    grouped.photos?.forEach((photoSubmission, index) => {
      submissionCounter++;
      const key = `photo-${photoSubmission.id}`;
      const isExpanded = expandedSubmission === key;
      
      pills.push(
        <Box
          key={key}
          onClick={() => handleSubmissionToggle('photo', photoSubmission.id)}
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
          sx={{ 
            cursor: 'pointer',
            gap: { xs: 0.2, sm: 0.4, md: 0.5 },
            width: { xs: 140, sm: 160, md: 180, lg: 200 },
            minWidth: { xs: 120, sm: 140 },
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            '&:hover': {
              bgcolor: isExpanded ? 'background.neutral' : 'rgba(231, 231, 231, 0.8)',
            }
          }}
          bgcolor={isExpanded ? 'background.neutral' : '#E7E7E7'}
          py={{ xs: 1.2, sm: 1.5 }}
          pl={{ xs: 0.5, sm: 0.8 }}
          pr={{ xs: 0.3, sm: 0.5 }}
        >
          <Box display={'flex'} alignItems={'center'} justifyContent={'center'} gap={{ xs: 0.2, sm: 0.3 }}>
            <Tooltip 
              title="Photo" 
              placement="top"
              PopperProps={{
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -7],
                    },
                  },
                ],
              }}
              componentsProps={{
                tooltip: {
                  sx: {
                    width: { xs: 80, sm: 95 },
                    height: { xs: 28, sm: 34 },
                    opacity: 1,
                    borderRadius: '10px',
                    padding: { xs: '6px', sm: '10px' },
                    bgcolor: '#FCFCFC',
                    color: '#000',
                    fontSize: { xs: '10px', sm: '12px' },
                    fontWeight: 'medium',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                }
              }}
            >
              <Box
                component="img"
                src="/assets/icons/components/photo.png"
                sx={{
                  width: { xs: 22, sm: 25, md: 27 },
                  height: { xs: 22, sm: 25, md: 27 },
                  filter: isExpanded ? 'brightness(0) saturate(100%) invert(27%) sepia(99%) saturate(6094%) hue-rotate(227deg) brightness(100%) contrast(104%)' : 'none',
                  cursor: 'pointer'
                }}
              />
            </Tooltip>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.3, sm: 0.5, md: 0.8, lg: 1 },
                px: { xs: 0.6, sm: 0.8, md: 1.0, lg: 1.3 },
                py: { xs: 0.3, sm: 0.4, md: 0.5, lg: 0.6 },
                border: '1px solid',
                borderColor: getClientStatusColor(photoSubmission.status, 'photo'),
                borderRadius: 0.8,
                boxShadow: `0px -2px 0px 0px ${getClientStatusColor(photoSubmission.status, 'photo')} inset`,
                bgcolor: '#fff',
                color: getClientStatusColor(photoSubmission.status, 'photo'),
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              <Typography 
                fontWeight={'SemiBold'} 
                pb={0.2} 
                fontSize={{ xs: 8, sm: 9, md: 10, lg: 10.5 }}  
                color={getClientStatusColor(photoSubmission.status, 'photo')}
                noWrap
                sx={{ 
                  maxWidth: { xs: 60, sm: 80, md: 100 },
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}
              >
                {getClientStatusLabel(photoSubmission.status, 'photo')}
              </Typography>
            </Box>
          </Box>
          <Iconify 
            icon={isExpanded ? "mingcute:up-line" : "mingcute:down-line"} 
            sx={{ 
              width: { xs: 20, sm: 22, md: 24, lg: 26 }, 
              height: { xs: 20, sm: 22, md: 24, lg: 26 } 
            }}
            color={isExpanded ? '#1340FF' : '#8E8E93'}
          />
        </Box>
      );
    });

    // Raw footage submission pills
    grouped.rawFootage?.forEach((rawFootageSubmission, index) => {
      submissionCounter++;
      const key = `rawFootage-${rawFootageSubmission.id}`;
      const isExpanded = expandedSubmission === key;
      
      pills.push(
        <Box
          key={key}
          onClick={() => handleSubmissionToggle('rawFootage', rawFootageSubmission.id)}
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
          sx={{ 
            cursor: 'pointer',
            gap: { xs: 0.2, sm: 0.4, md: 0.5 },
            width: { xs: 140, sm: 160, md: 180, lg: 200 },
            minWidth: { xs: 120, sm: 140 },
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            '&:hover': {
              bgcolor: isExpanded ? 'background.neutral' : 'rgba(231, 231, 231, 0.8)',
            }
          }}
          bgcolor={isExpanded ? 'background.neutral' : '#E7E7E7'}
          py={{ xs: 1.2, sm: 1.5 }}
          pl={{ xs: 0.5, sm: 0.8 }}
          pr={{ xs: 0.3, sm: 0.5 }}
        >
          <Box display={'flex'} alignItems={'center'} justifyContent={'center'} gap={{ xs: 0.2, sm: 0.3 }}>
            <Tooltip 
              title="Raw Footage" 
              placement="top"
              PopperProps={{
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -7],
                    },
                  },
                ],
              }}
              componentsProps={{
                tooltip: {
                  sx: {
                    width: { xs: 80, sm: 95 },
                    height: { xs: 28, sm: 34 },
                    opacity: 1,
                    borderRadius: '10px',
                    padding: { xs: '6px', sm: '10px' },
                    bgcolor: '#FCFCFC',
                    color: '#000',
                    fontSize: { xs: '10px', sm: '12px' },
                    fontWeight: 'medium',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                }
              }}
            >
              <Box
                component="img"
                src="/assets/icons/components/raw_footage.png"
                sx={{
                  width: { xs: 22, sm: 25, md: 27 },
                  height: { xs: 22, sm: 25, md: 27 },
                  filter: isExpanded ? 'brightness(0) saturate(100%) invert(27%) sepia(99%) saturate(6094%) hue-rotate(227deg) brightness(100%) contrast(104%)' : 'none',
                  cursor: 'pointer'
                }}
              />
            </Tooltip>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.3, sm: 0.5, md: 0.8, lg: 1 },
                px: { xs: 0.6, sm: 0.8, md: 1.0, lg: 1.3 },
                py: { xs: 0.3, sm: 0.4, md: 0.5, lg: 0.6 },
                border: '1px solid',
                borderColor: getClientStatusColor(rawFootageSubmission.status, 'rawFootage'),
                borderRadius: 0.8,
                boxShadow: `0px -2px 0px 0px ${getClientStatusColor(rawFootageSubmission.status, 'rawFootage')} inset`,
                bgcolor: '#fff',
                color: getClientStatusColor(rawFootageSubmission.status, 'rawFootage'),
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              <Typography 
                fontWeight={'SemiBold'} 
                pb={0.2} 
                fontSize={{ xs: 8, sm: 9, md: 10, lg: 10.5 }} 
                color={getClientStatusColor(rawFootageSubmission.status, 'rawFootage')}
                noWrap
                sx={{ 
                  maxWidth: { xs: 60, sm: 80, md: 100 },
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}
              >
                {getClientStatusLabel(rawFootageSubmission.status, 'rawFootage')}
              </Typography>
            </Box>
          </Box>
          <Iconify 
            icon={isExpanded ? "mingcute:up-line" : "mingcute:down-line"}
            sx={{ 
              width: { xs: 20, sm: 22, md: 24, lg: 26 }, 
              height: { xs: 20, sm: 22, md: 24, lg: 26 } 
            }}
            color={isExpanded ? '#1340FF' : '#8E8E93'}
          />
        </Box>
      );
    });

    return pills;
  };

  const renderExpandedSubmission = () => {
    if (!expandedSubmission) return null;

    const [type, id] = expandedSubmission.split('-');
    
    if (type === 'video') {
      const submission = grouped.videos?.find(v => v.id === id);
      if (submission) {
        return (
          <V4VideoSubmission
            key={`expanded-${submission.id}`}
            submission={submission}
            campaign={campaign}
            index={grouped.videos.findIndex(v => v.id === id) + 1}
            onUpdate={submissionsMutate}
            expanded={true}
          />
        );
      }
    }
    
    if (type === 'photo') {
      const submission = grouped.photos?.find(p => p.id === id);
      if (submission) {
        return (
          <V4PhotoSubmission
            key={`expanded-${submission.id}`}
            submission={submission}
            campaign={campaign}
            index={grouped.photos.findIndex(p => p.id === id) + 1}
            onUpdate={submissionsMutate}
            expanded={true}
          />
        );
      }
    }
    
    if (type === 'rawFootage') {
      const submission = grouped.rawFootage?.find(rf => rf.id === id);
      if (submission) {
        return (
          <V4RawFootageSubmission
            key={`expanded-${submission.id}`}
            submission={submission}
            campaign={campaign}
            index={grouped.rawFootage.findIndex(rf => rf.id === id) + 1}
            onUpdate={submissionsMutate}
            expanded={true}
          />
        );
      }
    }

    return null;
  };

  return (
    <Box sx={{ 
      mb: 1,
    }}>
      {/* Creator Info Row */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        backgroundColor: '#E7E7E7',
        boxShadow: '0px 4px 4px 0px #8E8E9340',
        borderRadius: 1,
        pl: { xs: 0.8, sm: 1 },
        pr: { xs: 0.5, sm: 0 },
        flexDirection: { xs: 'column', sm: 'row' },
        py: { xs: 1, sm: 0 },
        gap: { xs: 1, sm: 0 },
      }}>
        {/* Creator Info Section */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          pr: { xs: 0, sm: 2 },
          minWidth: 0,
          maxWidth: { xs: '100%', sm: 300 },
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-start', sm: 'flex-start' },
        }}>
          <Avatar
            src={creator.user?.photoURL}
            alt={creator.user?.name}
            sx={{ 
              width: { xs: 32, sm: 35 }, 
              height: { xs: 32, sm: 35 }, 
              mr: { xs: 1.5, sm: 2 }, 
              flexShrink: 0 
            }}
          >
            {creator.user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Tooltip title={creator.user?.name || 'Unknown Creator'} arrow>
              <Typography 
                variant="subtitle1" 
                noWrap
                sx={{ 
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                {creator.user?.name || 'Unknown Creator'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>

        {/* Submission Pills Section */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          gap: { xs: 0.8, sm: 1.2, md: 1.5 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          width: { xs: '100%', sm: 'auto' },
          overflowX: { xs: 'auto', sm: 'visible' },
          '&::-webkit-scrollbar': {
            height: 2,
            display: { xs: 'block', sm: 'none' }
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: 2,
          },
        }}>
          {submissionsLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading submissions...
            </Typography>
          ) : submissions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No content submissions found
            </Typography>
          ) : (
            renderSubmissionPills()
          )}
        </Box>
      </Box>

      {/* Expanded Submission Content */}
      {expandedSubmission && (
        <Box sx={{ p: 0 }}>
          {renderExpandedSubmission()}
        </Box>
      )}
    </Box>
  );
}

CreatorAccordionWithSubmissions.propTypes = {
  creator: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
};

CreatorAccordion.propTypes = {
  creator: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
};

export default function CampaignCreatorSubmissionsV4({ campaign }) {
  const [searchTerm, setSearchTerm] = useState('');


  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);



  // Filter creators based on search term
  const filteredCreators = campaign?.shortlisted?.filter(creator => {
    const name = creator.user?.name?.toLowerCase() || '';
    const email = creator.user?.email?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  }) || [];

  // Only show V4 campaigns
  if (campaign?.submissionVersion !== 'v4') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          V4 Creator Submissions
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          This tab is only available for V4 campaigns with content-type based submissions.
        </Typography>
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block" sx={{ mt: 1 }}>
          Current campaign version: {campaign?.submissionVersion || 'Not set'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 0 } }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search creators..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ 
            maxWidth: { xs: '100%', sm: 400 },
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
            }
          }}
          InputProps={{
            startAdornment: <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', mr: 1 }} />,
          }}
        />
      </Box>

      {filteredCreators.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <EmptyContent sx={{ py: 10 }}  title="No creators found" filled />
        </Box>
      ) : (
        <Stack spacing={{ xs: 0.5, sm: 1 }}>
          {filteredCreators.map((creator, index) => (
            <CreatorAccordionWithSubmissions
              key={creator.userId || index}
              creator={creator}
              campaign={campaign}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

CampaignCreatorSubmissionsV4.propTypes = {
  campaign: PropTypes.object,
};