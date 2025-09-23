import PropTypes from 'prop-types';
import { useState, useCallback, useMemo } from 'react';

import {
  Box,
  Stack,
  Avatar,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useGetV4Submissions } from 'src/hooks/use-get-v4-submissions';
import { getStatusColor } from 'src/contants/statusColors';

import V4VideoSubmission from './submissions/v4/video-submission';
import V4PhotoSubmission from './submissions/v4/photo-submission';
import V4RawFootageSubmission from './submissions/v4/raw-footage-submission';
import { useAuthContext } from 'src/auth/hooks';

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

    const getClientStatusColor = (status) => {
      if (!isClient) {
        // Admin sees the actual status colors
        return getStatusColor(status);
      }
      
      // Client-specific color mapping
      switch (status) {
        case 'SENT_TO_CLIENT':
          return getStatusColor('PENDING_REVIEW');
        case 'PENDING_REVIEW':
          return getStatusColor('IN_PROGRESS');
        case 'CLIENT_FEEDBACK':
          return getStatusColor('IN_PROGRESS');
        default:
          return getStatusColor(status); // Use default mapping for other statuses
      }
    };

    const getClientStatusLabel = (status) => {
      if (!isClient) {
        // Admin-specific status labels
        switch (status) {
          case 'CLIENT_FEEDBACK':
            return 'CLIENT FEEDBACK';
          default:
            return formatStatus(status);
        }
      }

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
          return 'IN PROGRESS'; // For clients - they've submitted feedback, now admin processing it
        case 'CHANGES_REQUIRED':
        case 'REJECTED':
          return 'CHANGES REQUIRED';
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
            gap: { xs: 0.3, sm: 0.4, md: 0.5 },
            width: { xs: 160, sm: 180, md: 200 },
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10
          }}
          bgcolor={isExpanded ? '#F5F5F5' : '#E7E7E7'}
          py={1.5}
          pl={1.5}
          pr={0.5}
        >
          <Box display={'flex'} alignItems={'center'} justifyContent={'center'} gap={1}>
            <Box
              sx={{ 
                border: '2px solid', 
                borderColor: isExpanded ? '#1340FF' : '#8E8E93', 
                borderRadius: 20, 
                px: submissionCounter === 1 ? 0.9 : 0.8,
                py: 0.3
              }}
            >
              <Typography 
                fontSize={{ xs: 7, sm: 7.5, md: 8 }} 
                fontWeight={'bold'} 
                color={isExpanded ? '#1340FF' : '#8E8E93'}
              >
                {submissionCounter}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 0.8, md: 1 },
                px: { xs: 1, sm: 1.3, md: 1 },
                py: { xs: 0.4, sm: 0.5, md: 0.6 },
                border: '1px solid',
                borderColor: getClientStatusColor(videoSubmission.status),
                borderRadius: 0.8,
                boxShadow: `0px -2px 0px 0px ${getClientStatusColor(videoSubmission.status)} inset`,
                bgcolor: '#fff',
                color: getClientStatusColor(videoSubmission.status),
              }}
            >
              <Typography 
                fontWeight={'SemiBold'} 
                pb={0.2} 
                fontSize={{ xs: 9, sm: 10, md: 10.5 }} 
                color={getClientStatusColor(videoSubmission.status)}
              >
                {getClientStatusLabel(videoSubmission.status)}
              </Typography>
            </Box>
          </Box>
          <Box
            display={'flex'}
            alignItems={'center'}
          >
            <Iconify 
              icon={isExpanded ? "mingcute:up-line" : "mingcute:down-line"} 
              sx={{ width: { xs: 24, sm: 26, md: 28 }, height: { xs: 24, sm: 26, md: 28 } }}
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
            gap: { xs: 0.3, sm: 0.4, md: 0.5 },
            width: { xs: 160, sm: 180, md: 200 },
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10
          }}
          bgcolor={isExpanded ? '#F5F5F5' : '#E7E7E7'}
          py={1.5}
          pl={1.5}
          pr={0.5}
        >
          <Box display={'flex'} alignItems={'center'} justifyContent={'center'} gap={1}>
            <Box
              sx={{ 
                border: '2px solid', 
                borderColor: isExpanded ? '#1340FF' : '#8E8E93', 
                borderRadius: 20,
                px: 0.8,
                py: 0.3
              }}
            >
              <Typography 
                fontSize={{ xs: 7, sm: 7.5, md: 8 }} 
                fontWeight={'bold'} 
                color={isExpanded ? '#1340FF' : '#8E8E93'}
              >
                {submissionCounter}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 0.8, md: 1 },
                px: { xs: 1, sm: 1.3, md: 1 },
                py: { xs: 0.4, sm: 0.5, md: 0.6 },
                border: '1px solid',
                borderColor: getClientStatusColor(photoSubmission.status),
                borderRadius: 0.8,
                boxShadow: `0px -2px 0px 0px ${getClientStatusColor(photoSubmission.status)} inset`,
                bgcolor: '#fff',
                color: getClientStatusColor(photoSubmission.status),
              }}
            >
              <Typography 
                fontWeight={'SemiBold'} 
                pb={0.2} 
                fontSize={{ xs: 9, sm: 10, md: 10.5 }}  
                color={getClientStatusColor(photoSubmission.status)}
              >
                {getClientStatusLabel(photoSubmission.status)}
              </Typography>
            </Box>
          </Box>
          <Iconify 
            icon={isExpanded ? "mingcute:up-line" : "mingcute:down-line"} 
            sx={{ width: { xs: 24, sm: 26, md: 28 }, height: { xs: 24, sm: 26, md: 28 } }}
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
            gap: { xs: 0.3, sm: 0.4, md: 0.5 },
            width: { xs: 160, sm: 180, md: 200 },
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10
          }}
          bgcolor={isExpanded ? '#F5F5F5' : '#E7E7E7'}
          py={1.5}
          pl={1.5}
          pr={0.5}
        >
          <Box display={'flex'} alignItems={'center'} justifyContent={'center'} gap={1}>
            <Box
              sx={{ 
                border: '2px solid', 
                borderColor: isExpanded ? '#1340FF' : '#8E8E93', 
                borderRadius: 20, 
                px: 0.8,
                py: 0.3
              }}
            >
              <Typography 
                fontSize={{ xs: 7, sm: 7.5, md: 8 }} 
                fontWeight={'bold'} 
                color={isExpanded ? '#1340FF' : '#8E8E93'}
              >
                {submissionCounter}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 0.8, md: 1 },
                px: { xs: 1, sm: 1.3, md: 1 },
                py: { xs: 0.4, sm: 0.5, md: 0.6 },
                border: '1px solid',
                borderColor: getClientStatusColor(rawFootageSubmission.status),
                borderRadius: 0.8,
                boxShadow: `0px -2px 0px 0px ${getClientStatusColor(rawFootageSubmission.status)} inset`,
                bgcolor: '#fff',
                color: getClientStatusColor(rawFootageSubmission.status),
              }}
            >
              <Typography 
                fontWeight={'SemiBold'} 
                pb={0.2} 
                fontSize={{ xs: 9, sm: 10, md: 10.5 }} 
                color={getClientStatusColor(rawFootageSubmission.status)}
              >
                {getClientStatusLabel(rawFootageSubmission.status)}
              </Typography>
            </Box>
          </Box>
          <Iconify 
            icon={isExpanded ? "mingcute:up-line" : "mingcute:down-line"}
            sx={{ width: { xs: 24, sm: 26, md: 28 }, height: { xs: 24, sm: 26, md: 28 } }}
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
        pl: 1,
      }}>
        {/* Creator Info Section */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          pr: 2,
          minWidth: 0,
          maxWidth: 200,
        }}>
          <Avatar
            src={creator.user?.photoURL}
            alt={creator.user?.name}
            sx={{ width: 35, height: 35, mr: 2, flexShrink: 0 }}
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
                  overflow: 'hidden'
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
          justifyContent: 'flex-end',
          gap: 1.5,
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
          Current campaign version: {campaign?.submissionVersion || 'v3'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search creators..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ maxWidth: 400 }}
          InputProps={{
            startAdornment: <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', mr: 1 }} />,
          }}
        />
      </Box>

      {filteredCreators.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No creators found
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
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