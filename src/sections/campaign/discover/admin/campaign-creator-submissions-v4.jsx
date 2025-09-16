import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import {
  Box,
  Stack,
  Avatar,
  TextField,
  Typography,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useGetV4Submissions } from 'src/hooks/use-get-v4-submissions';

import V4VideoSubmission from './submissions/v4/video-submission';
import V4PhotoSubmission from './submissions/v4/photo-submission';
import V4RawFootageSubmission from './submissions/v4/raw-footage-submission';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

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

  const handleSubmissionToggle = useCallback((submissionType, submissionId) => {
    const key = `${submissionType}-${submissionId}`;
    setExpandedSubmission(prev => prev === key ? null : key);
  }, []);

  const renderSubmissionPills = () => {
    const pills = [];

    const getStatusColor = (status) => {
      const statusColors = {
        PENDING_REVIEW: '#FFC702',
        IN_PROGRESS: '#8A5AFE', 
        APPROVED: '#1ABF66',
        POSTED: '#1ABF66',
        REJECTED: '#D4321C',
        CHANGES_REQUIRED: '#D4321C',
        SENT_TO_CLIENT: '#8A5AFE',
        CLIENT_APPROVED: '#1ABF66',
        CLIENT_FEEDBACK: '#FFC702',
        SENT_TO_ADMIN: '#8A5AFE',
        NOT_STARTED: '#000'
      };
      return statusColors[status] || 'default';
    };

    const formatStatus = (status) => {
      return status?.replace(/_/g, ' ') || 'Unknown';
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
      const key = `video-${videoSubmission.id}`;
      const isExpanded = expandedSubmission === key;

      pills.push(
        <Box
          key={key}
          onClick={() => handleSubmissionToggle('video', videoSubmission.id)}
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
          gap={0.5}
          sx={{ 
            cursor: 'pointer'
          }}
        >
          <Box
            sx={{ border: '2px solid', borderColor: isExpanded ? '#1340FF' : '#8E8E93', borderRadius: 20, px: 0.8, py: 0.20 }}
          >
            <Typography fontSize={8} fontWeight={'bold'} color={isExpanded ? '#1340FF' : '#8E8E93'}>1</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.6,
              border: '1px solid',
              borderColor: getStatusColor(videoSubmission.status),
              borderRadius: 0.8,
              boxShadow: `0px -2px 0px 0px ${getStatusColor(videoSubmission.status)} inset`,
              bgcolor: '#fff',
              color: getStatusColor(videoSubmission.status),
            }}
          >
            <Typography fontWeight={'SemiBold'} pb={0.2} fontSize={12} color={getStatusColor(videoSubmission.status)}>{getClientStatusLabel(videoSubmission.status)}</Typography>
          </Box>
          <Iconify 
            icon={isExpanded ? "eva:chevron-up-fill" : "eva:chevron-down-fill"} 
            width={25}
            color={isExpanded ? '#1340FF' : '#8E8E93'}
          />
        </Box> 
      );
    });

    // Photo submission pills
    grouped.photos?.forEach((photoSubmission, index) => {
      const key = `photo-${photoSubmission.id}`;
      const isExpanded = expandedSubmission === key;
      
      pills.push(
        <Box
          key={key}
          onClick={() => handleSubmissionToggle('photo', photoSubmission.id)}
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
          gap={0.5}
          sx={{ 
            cursor: 'pointer'
          }}
        >
          <Box
            sx={{ border: '2px solid', borderColor: isExpanded ? '#1340FF' : '#8E8E93', borderRadius: 20, px: 0.8, py: 0.20 }}
          >
            <Typography fontSize={10} fontWeight={'bold'} color={isExpanded ? '#1340FF' : '#8E8E93'}>1</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.6,
              border: '1px solid',
              borderColor: getStatusColor(photoSubmission.status),
              borderRadius: 0.8,
              boxShadow: `0px -2px 0px 0px ${getStatusColor(photoSubmission.status)} inset`,
              bgcolor: '#fff',
              color: getStatusColor(photoSubmission.status),
            }}
          >
            <Typography fontWeight={'SemiBold'} pb={0.2} fontSize={12} color={getStatusColor(photoSubmission.status)}>{getClientStatusLabel(photoSubmission.status)}</Typography>
          </Box>
          <Iconify 
            icon={isExpanded ? "eva:chevron-up-fill" : "eva:chevron-down-fill"} 
            width={25}
            color={isExpanded ? '#1340FF' : '#8E8E93'}
          />
        </Box>
      );
    });

    // Raw footage submission pills
    grouped.rawFootage?.forEach((rawFootageSubmission, index) => {
      const key = `rawFootage-${rawFootageSubmission.id}`;
      const isExpanded = expandedSubmission === key;
      
      pills.push(
        <Box
          key={key}
          onClick={() => handleSubmissionToggle('rawFootage', rawFootageSubmission.id)}
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
          gap={0.5}
          sx={{ 
            cursor: 'pointer'
          }}
        >
          <Box
            sx={{ border: '2px solid', borderColor: isExpanded ? '#1340FF' : '#8E8E93', borderRadius: 20, px: 0.8, py: 0.20 }}
          >
            <Typography fontSize={10} fontWeight={'bold'} color={isExpanded ? '#1340FF' : '#8E8E93'}>1</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.6,
              border: '1px solid',
              borderColor: getStatusColor(rawFootageSubmission.status),
              borderRadius: 0.8,
              boxShadow: `0px -2px 0px 0px ${getStatusColor(rawFootageSubmission.status)} inset`,
              bgcolor: '#fff',
              color: getStatusColor(rawFootageSubmission.status),
            }}
          >
            <Typography fontWeight={'SemiBold'} pb={0.2} fontSize={12} color={getStatusColor(rawFootageSubmission.status)}>{getClientStatusLabel(rawFootageSubmission.status)}</Typography>
          </Box>
          <Iconify 
            icon={isExpanded ? "eva:chevron-up-fill" : "eva:chevron-down-fill"}
            width={25}
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
      border: '1px solid', 
      borderColor: 'divider',
      borderRadius: 1,
      boxShadow: 1,
      mb: 1,
    }}>
      {/* Creator Info Row */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2,
        borderBottom: expandedSubmission ? '1px solid' : 'none',
        borderBottomColor: 'divider'
      }}>
        {/* Creator Info Section */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          minWidth: '300px',
          pr: 2
        }}>
          <Avatar
            src={creator.user?.photoURL}
            alt={creator.user?.name}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {creator.user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" noWrap>
              {creator.user?.name || 'Unknown Creator'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {creator.user?.email}
            </Typography>
          </Box>
        </Box>

        {/* Submission Pills Section */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          gap: 2,
          justifyContent: 'flex-end'
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
        <Typography variant="h6" gutterBottom>
          Creators ({filteredCreators.length})
        </Typography>
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
            <CreatorAccordion
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