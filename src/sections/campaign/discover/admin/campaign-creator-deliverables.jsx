/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useMemo, useState, useEffect } from 'react';

import { Box, Stack, Avatar, Button, Accordion, Typography, AccordionSummary, AccordionDetails } from '@mui/material';

import { useGetSubmissions } from 'src/hooks/use-get-submission';
import { useGetDeliverables } from 'src/hooks/use-get-deliverables';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

import FirstDraft from './creator-stuff/submissions/firstDraft';
import FinalDraft from './creator-stuff/submissions/finalDraft';
import Posting from './creator-stuff/submissions/posting/posting';

const CampaignCreatorDeliverables = ({ campaign }) => {
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [expandedAccordion, setExpandedAccordion] = useState(null); 
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Get shortlisted creators from campaign
  const shortlistedCreators = useMemo(() => campaign?.shortlisted || [], [campaign?.shortlisted]);

  // Sort creators alphabetically
  const sortedCreators = useMemo(() => {
    if (!shortlistedCreators.length) return [];
    
    return [...shortlistedCreators].sort((a, b) => {
      const nameA = (a.user?.name || '').toLowerCase();
      const nameB = (b.user?.name || '').toLowerCase();
      
      return sortDirection === 'asc' 
        ? nameA.localeCompare(nameB) 
        : nameB.localeCompare(nameA);
    });
  }, [shortlistedCreators, sortDirection]);

  // Get submissions for selected creator
  const { data: submissions, isLoading: loadingSubmissions, mutate: submissionMutate } = useGetSubmissions(
    selectedCreator?.userId,
    campaign?.id
  );

  // Get deliverables for selected creator
  const { data: deliverablesData, isLoading: loadingDeliverables, mutate: deliverableMutate } = useGetDeliverables(
    selectedCreator?.userId,
    campaign?.id
  );

  // Find submissions by type
  const firstDraftSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'FIRST_DRAFT'),
    [submissions]
  );

  const finalDraftSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'FINAL_DRAFT'),
    [submissions]
  );

  const postingSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'POSTING'),
    [submissions]
  );

  // Toggle sort direction
  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Set first creator as selected by default
  useEffect(() => {
    if (sortedCreators?.length && !selectedCreator) {
      setSelectedCreator(sortedCreators[0]);
    }
  }, [sortedCreators, selectedCreator]);
  
  // Handle creator selection
  const handleCreatorSelect = (creator) => {
    setSelectedCreator(creator);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const renderAccordionStatus = (submission) => {
    if (!submission) return null;

    // Replace underscores with spaces in status text (used regex)
    const statusText = submission.status ? submission.status.replace(/_/g, ' ') : '';
    let statusStyles = {
      color: '#8E8E93',
      borderColor: '#8E8E93',
    };

    if (submission.status === 'APPROVED') {
      statusStyles = {
        color: '#1ABF66',
        borderColor: '#1ABF66',
      };
    } else if (submission.status === 'REJECTED') {
      statusStyles = {
        color: '#FF4842',
        borderColor: '#FF4842',
      };
    } else if (submission.status === 'PENDING_REVIEW') {
      statusStyles = {
        color: '#FFC702',
        borderColor: '#FFC702',
      };
    } else if (submission.status === 'IN_PROGRESS') {
      statusStyles = {
        color: '#8A5AFE',
        borderColor: '#8A5AFE',
      };
    } else if (submission.status === 'CHANGES_REQUIRED') {
      statusStyles = {
        color: '#D4321C',
        borderColor: '#D4321C',
      };
    }

    return (
      <Typography
        variant="body2"
        sx={{
          textTransform: 'uppercase',
          display: 'inline-block',
          px: 1.5,
          py: 0.6,
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid',
          borderBottom: '3px solid',
          borderRadius: 0.8,
          bgcolor: 'white',
          whiteSpace: 'nowrap',
          ...statusStyles,
        }}
      >
        {statusText}
      </Typography>
    );
  };

  return (
    <Stack
      direction="column"
      spacing={2}
      sx={{
        width: '100%',
        px: { xs: 1, md: 0 },
      }}
    >
      {/* Sort Button */}
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'flex-start',
        }}
      >
        <Button
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
            height: '42px',
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
        </Button>
      </Box>

      {/* Content Row */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 1.5, md: 2.5 }}
        sx={{
          width: '100%',
        }}
      >
        {/* Left Column - Creator Navigation */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            minWidth: { xs: '100%', md: '320px' },
            maxWidth: { xs: '100%', md: '600px' },
            boxShadow: 'none',
            ml: { xs: 0, md: -2 },
            mr: { xs: 0, md: -1.5 },
            mt: { xs: 0, md: -1.55 },
            mb: { xs: 2, md: 0 },
          }}
        >
          <Box
            sx={{
              py: { xs: 1, md: 2 },
              px: { xs: 0, md: 0 },
              height: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            {sortedCreators.length > 0 ? (
              sortedCreators.map((creator) => (
                <Box
                  key={creator.userId}
                  sx={{
                    mx: 2,
                    mb: 1,
                    p: 2.5,
                    cursor: 'pointer',
                    borderRadius: 2,
                    bgcolor: selectedCreator?.userId === creator.userId ? '#f5f5f5' : 'transparent',
                    '&:hover': { bgcolor: '#f5f5f5' },
                    minHeight: 75,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={() => handleCreatorSelect(creator)}
                >
                  <Stack direction="row" spacing={2} alignItems="center" width="100%">
                    <Avatar
                      src={creator.user?.photoURL || '/assets/images/avatar/avatar_default.jpg'}
                      alt={creator.user?.name}
                      sx={{
                        width: 48,
                        height: 48,
                      }}
                    />

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ mb: 0.2, fontWeight: 400, fontSize: '1rem', color: '#231F20' }}>
                        {creator.user?.name}
                      </Typography>
                      {/* <Typography variant="body2" color="text.secondary">
                        {creator.user?.email}
                      </Typography> */}
                    </Box>

                    <Iconify
                      icon="eva:arrow-ios-forward-fill"
                      sx={{
                        color: 'text.secondary',
                        width: 26,
                        height: 26,
                        ml: 1,
                      }}
                    />
                  </Stack>
                </Box>
              ))
            ) : (
              <EmptyContent title="No shortlisted creators found" />
            )}
          </Box>
        </Box>

        {/* Right Column - Content */}
        <Box
          sx={{
            width: { xs: '100%', md: '55%' },
            flexGrow: 1,
            mr: { xs: 0, md: 0 },
            mt: { xs: 0, md: 0 },
            overflow: 'auto',
          }}
        >
          {!selectedCreator && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: { xs: 2, md: 3 },
              }}
            >
              <EmptyContent title="Select a creator from the left panel to view their submissions." />
            </Box>
          )}

          {selectedCreator && loadingSubmissions && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: { xs: 2, md: 3 },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 200,
              }}
            >
              <Typography>Loading submissions...</Typography>
            </Box>
          )}

          {selectedCreator && !loadingSubmissions && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: { xs: 1.5, md: 2.5 },
                boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.05)',
              }}
            >
              <Stack spacing={1.5}>

                {/* First Draft Accordion */}
                <Accordion 
                  expanded={expandedAccordion === 'firstDraft'} 
                  onChange={handleAccordionChange('firstDraft')}
                  sx={{ 
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '16px !important',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      margin: 0,
                    },
                    '& .MuiAccordionSummary-root': {
                      borderRadius: expandedAccordion === 'firstDraft' ? '16px 16px 0 0' : 16,
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      expandedAccordion === 'firstDraft' 
                        ? <Iconify icon="eva:arrow-ios-upward-fill" width={24} height={24} color="#8E8E93" /> 
                        : <Iconify icon="eva:arrow-ios-forward-fill" width={24} height={24} color="#8E8E93" />
                    }
                    sx={{ 
                      borderBottom: expandedAccordion === 'firstDraft' ? '1px solid' : 'none',
                      borderColor: 'divider',
                      p: { xs: 1, md: 1.5 },
                      minHeight: { xs: 48, md: 54 },
                      bgcolor: expandedAccordion === 'firstDraft' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      justifyContent="flex-start"
                      spacing={1.5}
                      width="100%"
                      pr={2}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#231F20',
                            fontSize: { xs: '1rem', md: '1.125rem' },
                            ml: 1,
                            width: 110,
                          }}
                        >
                          First Draft
                        </Typography>
                        {renderAccordionStatus(firstDraftSubmission)}
                      </Box>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ 
                    p: 0,
                    '& > *': { 
                      px: { xs: 2, md: 2.5 }, 
                      py: { xs: 1.5, md: 2 } 
                    },
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                  }}>
                    {firstDraftSubmission ? (
                      <FirstDraft
                        submission={firstDraftSubmission}
                        campaign={campaign}
                        creator={selectedCreator}
                        deliverablesData={{
                          deliverables: deliverablesData,
                          deliverableMutate,
                          submissionMutate,
                        }}
                      />
                    ) : (
                      <Box sx={{ p: 3 }}>
                        <EmptyContent title="No first draft submission found" />
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Final Draft Accordion */}
                <Accordion 
                  expanded={expandedAccordion === 'finalDraft'} 
                  onChange={handleAccordionChange('finalDraft')}
                  sx={{ 
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '16px !important',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      margin: 0,
                    },
                    '& .MuiAccordionSummary-root': {
                      borderRadius: expandedAccordion === 'finalDraft' ? '16px 16px 0 0' : 16,
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      expandedAccordion === 'finalDraft' 
                        ? <Iconify icon="eva:arrow-ios-upward-fill" width={24} height={24} color="#8E8E93" /> 
                        : <Iconify icon="eva:arrow-ios-forward-fill" width={24} height={24} color="#8E8E93" />
                    }
                    sx={{ 
                      borderBottom: expandedAccordion === 'finalDraft' ? '1px solid' : 'none',
                      borderColor: 'divider',
                      p: { xs: 1, md: 1.5 },
                      minHeight: { xs: 48, md: 54 },
                      bgcolor: expandedAccordion === 'finalDraft' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      justifyContent="flex-start"
                      spacing={1.5}
                      width="100%"
                      pr={2}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#221f20',
                            fontSize: { xs: '1rem', md: '1.125rem' },
                            ml: 1,
                            width: 110,
                          }}
                        >
                          Final Draft
                        </Typography>
                        {renderAccordionStatus(finalDraftSubmission)}
                      </Box>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ 
                    p: 0,
                    '& > *': { 
                      px: { xs: 2, md: 2.5 }, 
                      py: { xs: 1.5, md: 2 } 
                    },
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                  }}>
                    {finalDraftSubmission ? (
                      <FinalDraft
                        submission={finalDraftSubmission}
                        campaign={campaign}
                        creator={selectedCreator}
                        firstDraftSubmission={firstDraftSubmission}
                        deliverablesData={{
                          deliverables: deliverablesData,
                          deliverableMutate,
                          submissionMutate,
                        }}
                      />
                    ) : (
                      <Box sx={{ p: 3 }}>
                        <EmptyContent title="No final draft submission found" />
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Posting Link Accordion */}
                <Accordion 
                  expanded={expandedAccordion === 'posting'} 
                  onChange={handleAccordionChange('posting')}
                  sx={{ 
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '16px !important',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      margin: 0,
                    },
                    '& .MuiAccordionSummary-root': {
                      borderRadius: expandedAccordion === 'posting' ? '16px 16px 0 0' : 16,
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      expandedAccordion === 'posting' 
                        ? <Iconify icon="eva:arrow-ios-upward-fill" width={24} height={24} color="#8E8E93" /> 
                        : <Iconify icon="eva:arrow-ios-forward-fill" width={24} height={24} color="#8E8E93" />
                    }
                    sx={{ 
                      borderBottom: expandedAccordion === 'posting' ? '1px solid' : 'none',
                      borderColor: 'divider',
                      p: { xs: 1, md: 1.5 },
                      minHeight: { xs: 48, md: 54 },
                      bgcolor: expandedAccordion === 'posting' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      justifyContent="flex-start"
                      spacing={1.5}
                      width="100%"
                      pr={2}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#221f20',
                            fontSize: { xs: '1rem', md: '1.125rem' },
                            ml: 1,
                            width: 110,
                          }}
                        >
                          Posting Link
                        </Typography>
                        {renderAccordionStatus(postingSubmission)}
                      </Box>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ 
                    p: 0,
                    '& > *': { 
                      px: { xs: 2, md: 2.5 }, 
                      py: { xs: 1.5, md: 2 } 
                    },
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                  }}>
                    {postingSubmission ? (
                      <Posting
                        submission={postingSubmission}
                        campaign={campaign}
                        creator={selectedCreator}
                      />
                    ) : (
                      <Box sx={{ p: 3 }}>
                        <EmptyContent title="No posting submission found" />
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Stack>
            </Box>
          )}
        </Box>
      </Stack>
    </Stack>
  );
};

export default CampaignCreatorDeliverables;

CampaignCreatorDeliverables.propTypes = {
  campaign: PropTypes.object,
};
