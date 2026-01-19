import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import { Box, Stack, Avatar, Collapse, Typography } from '@mui/material';

import { useGetV4Submissions } from 'src/hooks/use-get-v4-submissions';

import { useAuthContext } from 'src/auth/hooks';
import { getStatusColor } from 'src/contants/statusColors';

import Iconify from 'src/components/iconify';

import MobileVideoSubmission from './mobile-video-submission';
import MobilePhotoSubmission from './mobile-photo-submission';
import MobileRawFootageSubmission from './mobile-raw-footage-submission';

// ----------------------------------------------------------------------

function MobileSubmissionRow({ 
  type, 
  label, 
  icon, 
  status, 
  isExpanded, 
  onToggle, 
  submission, 
  campaign, 
  onUpdate,
  isClient,
  campaignType 
}) {
  // Status color
  const getClientStatusColor = (submissionStatus, submissionType = null) => {
    // Admin-specific
    if (!isClient) {
      switch (submissionStatus) {
        case 'CLIENT_APPROVED':
          if (campaignType === 'normal' && (submissionType === 'video' || submissionType === 'photo')) {
            return getStatusColor('PENDING_REVIEW');
          }
          return getStatusColor(submissionStatus);
        default:
          return getStatusColor(submissionStatus);
      }
    }

    // Client-specific
    switch (submissionStatus) {
      case 'SENT_TO_CLIENT':
        return getStatusColor('PENDING_REVIEW');
      case 'PENDING_REVIEW':
        return getStatusColor('IN_PROGRESS');
      case 'CHANGES_REQUIRED':
      case 'CLIENT_FEEDBACK':
      case 'REJECTED':
        return getStatusColor('IN_PROGRESS');
      default:
        return getStatusColor(submissionStatus);
    }
  };

  // Status labels
  const getClientStatusLabel = (submissionStatus, submissionType = null) => {
    const formatStatus = (s) => s?.replace(/_/g, ' ') || 'Unknown';

    // Admin specific
    if (!isClient && campaignType === 'normal') {
      switch (submissionStatus) {
        case 'CLIENT_APPROVED':
          if (submissionType === 'video' || submissionType === 'photo') {
            return 'PENDING LINK';
          }
          return formatStatus(submissionStatus);
        default:
          return formatStatus(submissionStatus);
      }
    } else if (!isClient) {
      return formatStatus(submissionStatus);
    }

    // Client-specific
    switch (submissionStatus) {
      case 'NOT_STARTED':
        return 'NOT STARTED';
      case 'IN_PROGRESS':
        return 'IN PROGRESS';
      case 'PENDING_REVIEW':
        return 'IN PROGRESS';
      case 'SENT_TO_CLIENT':
        return 'PENDING REVIEW';
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
        return formatStatus(submissionStatus);
    }
  };

  const statusColor = getClientStatusColor(status, type);
  const statusLabel = getClientStatusLabel(status, type);

  const renderSubmissionContent = () => {
    switch (type) {
      case 'video':
        return (
          <MobileVideoSubmission
            submission={submission}
            campaign={campaign}
            onUpdate={onUpdate}
          />
        );
      case 'photo':
        return (
          <MobilePhotoSubmission
            submission={submission}
            campaign={campaign}
            onUpdate={onUpdate}
          />
        );
      case 'rawFootage':
        return (
          <MobileRawFootageSubmission
            submission={submission}
            campaign={campaign}
            onUpdate={onUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2,
          bgcolor: '#F5F5F5',
          borderBottom: '1px solid #E7E7E7',
          cursor: 'pointer',
          '&:active': {
            bgcolor: '#EEEEEE',
          },
        }}
      >
        <Typography 
          variant="body1" 
          fontWeight={700}
          sx={{ color: 'text.primary' }}
        >
          {label}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 0.8,
              py: 0.8,
              border: '1px solid',
              borderColor: statusColor,
              borderRadius: 0.8,
              boxShadow: `0px -1.5px 0px 0px ${statusColor} inset`,
              bgcolor: '#fff',
            }}
          >
            <Typography
              fontSize={12}
              fontWeight="bold"
              color={statusColor}
              noWrap
            >
              {statusLabel}
            </Typography>
          </Box>

          <Iconify
            icon={isExpanded ? 'mingcute:up-line' : 'mingcute:right-line'}
            width={22}
            color={isExpanded ? '#1340FF' : '#8E8E93'}
          />
        </Box>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ bgcolor: '#FAFAFA' }}>
          {renderSubmissionContent()}
        </Box>
      </Collapse>
    </Box>
  );
}

MobileSubmissionRow.propTypes = {
  type: PropTypes.oneOf(['video', 'photo', 'rawFootage']).isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  status: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
  isClient: PropTypes.bool,
  campaignType: PropTypes.string,
};

// ----------------------------------------------------------------------

function MobileCreatorRow({ creator, campaign, isExpanded, onToggle }) {
  const { user } = useAuthContext();
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';
  const { campaignType } = campaign;

  const [expandedSubmission, setExpandedSubmission] = useState(null);

  const {
    grouped,
    submissionsLoading,
    submissionsMutate,
  } = useGetV4Submissions(campaign?.id, creator?.userId);

  const handleSubmissionToggle = useCallback(
    async (submissionType, submissionId) => {
      const key = `${submissionType}-${submissionId}`;
      const isCurrentlyExpanded = expandedSubmission === key;

      if (!isCurrentlyExpanded) {
        try {
          await submissionsMutate();
        } catch (error) {
          console.error('Error refreshing submission:', error);
        }
      }

      setExpandedSubmission((prev) => (prev === key ? null : key));
    },
    [expandedSubmission, submissionsMutate]
  );

  const hasSubmissions =
    (grouped.videos?.length || 0) +
    (grouped.photos?.length || 0) +
    (grouped.rawFootage?.length || 0) > 0;

  return (
    <Box>
      {/* Creator Header */}
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2,
          bgcolor: '#F5F5F5',
          borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
          cursor: 'pointer',
          '&:active': {
            bgcolor: '#EEEEEE',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={creator.user?.photoURL}
            alt={creator.user?.name}
            sx={{ width: 40, height: 40 }}
          >
            {creator.user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="subtitle1" fontWeight={500}>
            {creator.user?.name || 'Unknown Creator'}
          </Typography>
        </Box>

        <Iconify
          icon={isExpanded ? 'mingcute:up-line' : 'mingcute:right-line'}
          width={24}
          color={isExpanded ? '#1340FF' : '#8E8E93'}
        />
      </Box>

      {/* Expanded Content - Submissions List */}
      <Collapse in={isExpanded}>
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '0 0 12px 12px',
            overflow: 'hidden',
            borderTop: 'none',
          }}
        >
          {(() => {
            if (submissionsLoading) {
              return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading submissions...
                  </Typography>
                </Box>
              );
            }
            if (!hasSubmissions) {
              return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No content submissions found
                  </Typography>
                </Box>
              );
            }
            return (
              <Stack spacing={0} sx={{ border: '1px solid #E7E7E7' }}>
              {/* Video Submissions */}
              {grouped.videos?.map((videoSubmission) => {
                const key = `video-${videoSubmission.id}`;
                return (
                  <MobileSubmissionRow
                    key={key}
                    type="video"
                    label="Video"
                    icon="/assets/icons/components/ugc_vid.png"
                    status={videoSubmission.status}
                    isExpanded={expandedSubmission === key}
                    onToggle={() => handleSubmissionToggle('video', videoSubmission.id)}
                    submission={videoSubmission}
                    campaign={campaign}
                    onUpdate={submissionsMutate}
                    isClient={isClient}
                    campaignType={campaignType}
                  />
                );
              })}

              {/* Photo Submissions */}
              {grouped.photos?.map((photoSubmission) => {
                const key = `photo-${photoSubmission.id}`;
                return (
                  <MobileSubmissionRow
                    key={key}
                    type="photo"
                    label="Photos"
                    icon="/assets/icons/components/photo.png"
                    status={photoSubmission.status}
                    isExpanded={expandedSubmission === key}
                    onToggle={() => handleSubmissionToggle('photo', photoSubmission.id)}
                    submission={photoSubmission}
                    campaign={campaign}
                    onUpdate={submissionsMutate}
                    isClient={isClient}
                    campaignType={campaignType}
                  />
                );
              })}

              {/* Raw Footage Submissions */}
              {grouped.rawFootage?.map((rawFootageSubmission) => {
                const key = `rawFootage-${rawFootageSubmission.id}`;
                return (
                  <MobileSubmissionRow
                    key={key}
                    type="rawFootage"
                    label="Raw Footages"
                    icon="/assets/icons/components/raw_footage.png"
                    status={rawFootageSubmission.status}
                    isExpanded={expandedSubmission === key}
                    onToggle={() => handleSubmissionToggle('rawFootage', rawFootageSubmission.id)}
                    submission={rawFootageSubmission}
                    campaign={campaign}
                    onUpdate={submissionsMutate}
                    isClient={isClient}
                    campaignType={campaignType}
                  />
                );
              })}
            </Stack>
          );
          })()}
        </Box>
      </Collapse>
    </Box>
  );
}

MobileCreatorRow.propTypes = {
  creator: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function MobileCreatorRowWithSubmissions({ creator, campaign, isExpanded, onToggle }) {
  const { submissions, submissionsLoading } = useGetV4Submissions(campaign?.id, creator?.userId);

  // Don't render if loading or if no submissions exist
  if (submissionsLoading || submissions.length === 0) {
    return null;
  }

  // Check if the creator has an approved agreement submission
  // Only show creators whose agreement has been approved by CSM admin
  const agreementSubmission = submissions.find(
    (s) => s.submissionType?.type === 'AGREEMENT_FORM'
  );
  const isAgreementApproved = agreementSubmission?.status === 'APPROVED';

  // Don't render if agreement doesn't exist or isn't approved
  if (!agreementSubmission || !isAgreementApproved) {
    return null;
  }

  return (
    <MobileCreatorRow
      creator={creator}
      campaign={campaign}
      isExpanded={isExpanded}
      onToggle={onToggle}
    />
  );
}

MobileCreatorRowWithSubmissions.propTypes = {
  creator: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

export default function MobileCreatorSubmissions({ campaign, creators, searchTerm }) {
  const [expandedCreator, setExpandedCreator] = useState(null);

  const handleCreatorToggle = useCallback((creatorId) => {
    setExpandedCreator((prev) => (prev === creatorId ? null : creatorId));
  }, []);

  // Filter creators based on search term
  const filteredCreators =
    creators?.filter((creator) => {
      const name = creator.user?.name?.toLowerCase() || '';
      const email = creator.user?.email?.toLowerCase() || '';
      const searchLower = searchTerm?.toLowerCase() || '';
      return name.includes(searchLower) || email.includes(searchLower);
    }) || [];

  if (filteredCreators.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No creators found
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1} sx={{ py: 1 }}>
      {filteredCreators.map((creator) => (
        <MobileCreatorRowWithSubmissions
          key={creator.userId}
          creator={creator}
          campaign={campaign}
          isExpanded={expandedCreator === creator.userId}
          onToggle={() => handleCreatorToggle(creator.userId)}
        />
      ))}
    </Stack>
  );
}

MobileCreatorSubmissions.propTypes = {
  campaign: PropTypes.object.isRequired,
  creators: PropTypes.array,
  searchTerm: PropTypes.string,
};
