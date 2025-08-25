import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import {
  Box,
  Stack,
  Avatar,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useGetV4Submissions } from 'src/hooks/use-get-v4-submissions';

import V4VideoSubmission from './submissions/v4/video-submission';
import V4PhotoSubmission from './submissions/v4/photo-submission';
import V4RawFootageSubmission from './submissions/v4/raw-footage-submission';

// ----------------------------------------------------------------------

function CreatorAccordion({ creator, campaign, expanded, onToggle }) {
  // Get V4 submissions for this creator
  const { 
    submissions, 
    grouped, 
    submissionsLoading,
    submissionsMutate 
  } = useGetV4Submissions(campaign?.id, creator?.userId);

  return (
    <Accordion 
      expanded={expanded} 
      onChange={onToggle}
      sx={{
        '&:before': { display: 'none' },
        boxShadow: 1,
      }}
    >
      <AccordionSummary
        expandIcon={<Iconify icon="eva:chevron-down-fill" />}
        sx={{
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
          <Avatar
            src={creator.user?.photoURL}
            alt={creator.user?.name}
            sx={{ width: 40, height: 40 }}
          >
            {creator.user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" noWrap>
              {creator.user?.name || 'Unknown Creator'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {creator.user?.email}
            </Typography>
          </Box>
        </Stack>
      </AccordionSummary>
      
      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
          {submissionsLoading && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Loading submissions...</Typography>
            </Box>
          )}

          {!submissionsLoading && (
            <>
              {submissions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No content submissions found for this creator
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Content submissions are created automatically when the creator's agreement is approved
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {/* Video Submissions */}
                  {grouped.videos?.map((videoSubmission, index) => (
                    <V4VideoSubmission
                      key={videoSubmission.id}
                      submission={videoSubmission}
                      campaign={campaign}
                      index={index + 1}
                      onUpdate={submissionsMutate}
                    />
                  ))}

                  {/* Photo Submissions */}
                  {grouped.photos?.map((photoSubmission, index) => (
                    <V4PhotoSubmission
                      key={photoSubmission.id}
                      submission={photoSubmission}
                      campaign={campaign}
                      index={index + 1}
                      onUpdate={submissionsMutate}
                    />
                  ))}

                  {/* Raw Footage Submissions */}
                  {grouped.rawFootage?.map((rawFootageSubmission, index) => (
                    <V4RawFootageSubmission
                      key={rawFootageSubmission.id}
                      submission={rawFootageSubmission}
                      campaign={campaign}
                      index={index + 1}
                      onUpdate={submissionsMutate}
                    />
                  ))}
                </Stack>
              )}
            </>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

CreatorAccordion.propTypes = {
  creator: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default function CampaignCreatorSubmissionsV4({ campaign }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCreators, setExpandedCreators] = useState({});

  const handleToggleCreator = useCallback((creatorId) => {
    setExpandedCreators(prev => ({
      ...prev,
      [creatorId]: !prev[creatorId]
    }));
  }, []);


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
    <Box sx={{ p: 2 }}>
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
              expanded={expandedCreators[creator.userId] || false}
              onToggle={() => handleToggleCreator(creator.userId)}
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