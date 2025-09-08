/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useMemo, useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Stack,
  Avatar,
  Button,
  Tooltip,
  TextField,
  Accordion,
  Typography,
  useMediaQuery,
  InputAdornment,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';

import { useGetSubmissions } from 'src/hooks/use-get-submission';
import { useGetSubmissionsV3 } from 'src/hooks/use-get-submission-v3';
import { useGetDeliverables } from 'src/hooks/use-get-deliverables';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

import FirstDraft from './creator-stuff/submissions/firstDraft';
import FinalDraft from './creator-stuff/submissions/finalDraft';
import Posting from './creator-stuff/submissions/posting/posting';

const CampaignCreatorDeliverables = ({ campaign }) => {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));

  const [selectedCreator, setSelectedCreator] = useState(null);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [creatorStatuses, setCreatorStatuses] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'undecided', or 'approved'

  // Get shortlisted creators from campaign
  const shortlistedCreators = useMemo(() => {
    const creators = campaign?.shortlisted || [];
    
    // Debug logging to understand the data structure
    if (creators.length > 0) {
      console.log('🔍 Shortlisted creators data:', {
        total: creators.length,
        sample: creators.slice(0, 2).map(c => ({
          userId: c.userId,
          hasUser: !!c.user,
          userData: c.user ? {
            name: c.user.name,
            username: c.user.username,
            hasCreator: !!c.user.creator
          } : null
        }))
      });
    }
    
    return creators;
  }, [campaign?.shortlisted]);

  // Sort creators alphabetically
  const sortedCreators = useMemo(() => {
    if (!shortlistedCreators.length) return [];

    // Filter out creators without user data to prevent null reference errors
    const validCreators = shortlistedCreators.filter(creator => creator?.user);
    
    // Debug logging for sorted creators
    if (validCreators.length !== shortlistedCreators.length) {
      console.warn('⚠️ Some creators were filtered out due to missing user data:', {
        total: shortlistedCreators.length,
        valid: validCreators.length,
        filtered: shortlistedCreators.length - validCreators.length
      });
    }

    return validCreators.sort((a, b) => {
      const nameA = (a.user?.name || '').toLowerCase();
      const nameB = (b.user?.name || '').toLowerCase();

      return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [shortlistedCreators, sortDirection]);

  // Check if this is a V3 campaign (client-origin)
  const isV3 = campaign?.origin === 'CLIENT';

  // Get submissions for selected creator - use V3 for V3 campaigns
  const {
    data: submissionsV2,
    isLoading: loadingSubmissionsV2,
    mutate: submissionMutateV2,
  } = useGetSubmissions(selectedCreator?.userId, campaign?.id);

  const {
    data: submissionsV3,
    isLoading: loadingSubmissionsV3,
    mutate: submissionMutateV3,
  } = useGetSubmissionsV3(selectedCreator?.userId, campaign?.id);

  // Use the appropriate submissions data based on campaign type
  const submissions = isV3 ? submissionsV3 : submissionsV2;
  const loadingSubmissions = isV3 ? loadingSubmissionsV3 : loadingSubmissionsV2;
  const submissionMutate = isV3 ? submissionMutateV3 : submissionMutateV2;

  // Get deliverables for selected creator
  const {
    data: deliverablesData,
    isLoading: loadingDeliverables,
    mutate: deliverableMutate,
  } = useGetDeliverables(selectedCreator?.userId, campaign?.id);

  // Find submissions by type
  const firstDraftSubmission = useMemo(() => {
    const found = submissions?.find((item) => item.submissionType.type === 'FIRST_DRAFT');
    return found;
  }, [submissions]);

  const finalDraftSubmission = useMemo(() => {
    const found = submissions?.find((item) => item.submissionType.type === 'FINAL_DRAFT');
    return found;
  }, [submissions]);

  const postingSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'POSTING'),
    [submissions]
  );

  const filteredCreators = useMemo(() => {
    let filtered = sortedCreators;

    // First, filter out any creators without user data to prevent null reference errors
    filtered = filtered.filter((creator) => creator?.user);

    // Apply status filter
    if (selectedFilter === 'undecided') {
      filtered = filtered.filter((creator) => creator.status === 'undecided');
    } else if (selectedFilter === 'approved') {
      filtered = filtered.filter((creator) => creator.status === 'approved');
    }

    // Apply search filter
    if (search) {
      filtered = filtered.filter(
        (elem) => {
          // Add null checks for elem.user
          if (!elem?.user) return false;
          
          return (
            elem.user.name?.toLowerCase().includes(search.toLowerCase()) ||
            (elem.user.username?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (elem.user.creator?.instagram?.toLowerCase() || '').includes(search.toLowerCase())
          );
        }
      );
    }

    return [...filtered].sort((a, b) => {
      // Add null checks for sorting
      const nameA = a?.user?.name?.toLowerCase() || '';
      const nameB = b?.user?.name?.toLowerCase() || '';

      if (sortDirection === 'asc') {
        return nameA.localeCompare(nameB);
      }
      return nameB.localeCompare(nameA);
    });
  }, [sortedCreators, search, sortDirection, selectedFilter]);

  // Fetch all creator statuses using the existing hook
  useEffect(() => {
    const fetchAllCreatorStatuses = async () => {
      if (!shortlistedCreators.length || !campaign?.id) {
        setLoadingStatuses(false);
        return;
      }

      setLoadingStatuses(true);
      const statusMap = {};

      // Use the isV3 variable defined above

      try {
        // Process creators one by one to avoid too many simultaneous requests
        for (const creator of shortlistedCreators) {
          // Safety check to ensure creator has required data
          if (!creator?.userId) {
            console.warn('⚠️ Skipping creator without userId:', creator);
            continue;
          }

          try {
            let response;
            let data;

            if (isV3) {
              // Use V3 API endpoint for client-origin campaigns
              response = await fetch(
                `/api/submission/v3?campaignId=${campaign.id}&userId=${creator.userId}`
              );
            } else {
              // Use legacy API endpoint for admin-origin campaigns
              response = await fetch(
                `/api/submissions?userId=${creator.userId}&campaignId=${campaign.id}`
              );
            }

            if (!response.ok) {
              statusMap[creator.userId] = 'NOT_STARTED';
              continue;
            }

            data = await response.json();

            if (!data || data.length === 0) {
              statusMap[creator.userId] = 'NOT_STARTED';
              continue;
            }

            // Filter out agreement submissions - only consider FIRST_DRAFT, FINAL_DRAFT, and POSTING
            const relevantSubmissions = data.filter(
              (submission) =>
                submission.submissionType?.type === 'FIRST_DRAFT' ||
                submission.submissionType?.type === 'FINAL_DRAFT' ||
                submission.submissionType?.type === 'POSTING'
            );

            if (relevantSubmissions.length === 0) {
              statusMap[creator.userId] = 'NOT_STARTED';
              continue;
            }

            // Find submissions by type
            const firstDraftSubmission = relevantSubmissions.find(
              (item) => item.submissionType.type === 'FIRST_DRAFT'
            );
            const finalDraftSubmission = relevantSubmissions.find(
              (item) => item.submissionType.type === 'FINAL_DRAFT'
            );
            const postingSubmission = relevantSubmissions.find(
              (item) => item.submissionType.type === 'POSTING'
            );

            // Determine the status based on the latest stage in the workflow
            // Priority: Posting > Final Draft > First Draft
            // For V3 campaigns, use displayStatus if available
            if (postingSubmission) {
              statusMap[creator.userId] = isV3 && postingSubmission.displayStatus 
                ? postingSubmission.displayStatus 
                : postingSubmission.status;
            } else if (finalDraftSubmission) {
              statusMap[creator.userId] = isV3 && finalDraftSubmission.displayStatus 
                ? finalDraftSubmission.displayStatus 
                : finalDraftSubmission.status;
            } else if (firstDraftSubmission) {
              statusMap[creator.userId] = isV3 && firstDraftSubmission.displayStatus 
                ? firstDraftSubmission.displayStatus 
                : firstDraftSubmission.status;
            } else {
              statusMap[creator.userId] = 'NOT_STARTED';
            }
          } catch (error) {
            console.error(`Error fetching status for creator ${creator.userId}:`, error);
            statusMap[creator.userId] = 'NOT_STARTED';
          }
        }

        setCreatorStatuses(statusMap);
      } catch (error) {
        console.error('Error fetching creator statuses:', error);
      } finally {
        setLoadingStatuses(false);
      }
    };

    fetchAllCreatorStatuses();
  }, [shortlistedCreators, campaign?.id, campaign?.origin]);

  // Update creator statuses when submissions change for the selected creator
  useEffect(() => {
    if (selectedCreator?.userId && submissions) {
      setCreatorStatuses((prevStatuses) => {
        const newStatuses = { ...prevStatuses };

        // Check if this is a V3 campaign (client-origin)
        const isV3 = campaign?.origin === 'CLIENT';

        // Filter out agreement submissions - only consider FIRST_DRAFT, FINAL_DRAFT, and POSTING
        const relevantSubmissions = submissions.filter(
          (submission) =>
            submission.submissionType?.type === 'FIRST_DRAFT' ||
            submission.submissionType?.type === 'FINAL_DRAFT' ||
            submission.submissionType?.type === 'POSTING'
        );

        if (relevantSubmissions.length === 0) {
          newStatuses[selectedCreator.userId] = 'NOT_STARTED';
          return newStatuses;
        }

        // Find submissions by type
        const firstDraftSubmission = relevantSubmissions.find(
          (item) => item.submissionType.type === 'FIRST_DRAFT'
        );
        const finalDraftSubmission = relevantSubmissions.find(
          (item) => item.submissionType.type === 'FINAL_DRAFT'
        );
        const postingSubmission = relevantSubmissions.find(
          (item) => item.submissionType.type === 'POSTING'
        );

        // Determine the status based on the latest stage in the workflow
        // Priority: Posting > Final Draft > First Draft
        // For V3 campaigns, use displayStatus if available
        if (postingSubmission) {
          newStatuses[selectedCreator.userId] = isV3 && postingSubmission.displayStatus 
            ? postingSubmission.displayStatus 
            : postingSubmission.status;
        } else if (finalDraftSubmission) {
          newStatuses[selectedCreator.userId] = isV3 && finalDraftSubmission.displayStatus 
            ? finalDraftSubmission.displayStatus 
            : finalDraftSubmission.status;
        } else if (firstDraftSubmission) {
          newStatuses[selectedCreator.userId] = isV3 && firstDraftSubmission.displayStatus 
            ? firstDraftSubmission.displayStatus 
            : firstDraftSubmission.status;
        } else {
          newStatuses[selectedCreator.userId] = 'NOT_STARTED';
        }

        return newStatuses;
      });
    }
  }, [selectedCreator?.userId, submissions, campaign?.origin]);

  // Refresh creator statuses when submissions change for the selected creator
  useEffect(() => {
    if (selectedCreator?.userId && submissions && !loadingSubmissions) {
      // Trigger a refresh of all creator statuses to ensure consistency
      const refreshStatuses = async () => {
        if (!shortlistedCreators.length || !campaign?.id) return;

        const statusMap = { ...creatorStatuses };

        try {
          // Update the status for the selected creator based on current submissions
          const relevantSubmissions = submissions.filter(
            (submission) =>
              submission.submissionType?.type === 'FIRST_DRAFT' ||
              submission.submissionType?.type === 'FINAL_DRAFT' ||
              submission.submissionType?.type === 'POSTING'
          );

          if (relevantSubmissions.length > 0) {
            const firstDraftSubmission = relevantSubmissions.find(
              (item) => item.submissionType.type === 'FIRST_DRAFT'
            );
            const finalDraftSubmission = relevantSubmissions.find(
              (item) => item.submissionType.type === 'FINAL_DRAFT'
            );
            const postingSubmission = relevantSubmissions.find(
              (item) => item.submissionType.type === 'POSTING'
            );

            // Determine the status based on the latest stage in the workflow
            if (postingSubmission) {
              statusMap[selectedCreator.userId] = isV3 && postingSubmission.displayStatus 
                ? postingSubmission.displayStatus 
                : postingSubmission.status;
            } else if (finalDraftSubmission) {
              statusMap[selectedCreator.userId] = isV3 && finalDraftSubmission.displayStatus 
                ? finalDraftSubmission.displayStatus 
                : finalDraftSubmission.status;
            } else if (firstDraftSubmission) {
              statusMap[selectedCreator.userId] = isV3 && firstDraftSubmission.displayStatus 
                ? firstDraftSubmission.displayStatus 
                : firstDraftSubmission.status;
            }
          }

          setCreatorStatuses(statusMap);
        } catch (error) {
          console.error('Error refreshing creator statuses:', error);
        }
      };

      refreshStatuses();
    }
  }, [selectedCreator?.userId, submissions, loadingSubmissions, campaign?.origin, shortlistedCreators, creatorStatuses, isV3]);

  // Toggle sort direction
  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Manual refresh function for creator statuses
  const handleRefreshStatuses = async () => {
    if (!shortlistedCreators.length || !campaign?.id) return;

    setLoadingStatuses(true);
    const statusMap = {};

    try {
      // Process creators one by one to avoid too many simultaneous requests
      for (const creator of shortlistedCreators) {
        // Safety check to ensure creator has required data
        if (!creator?.userId) {
          console.warn('⚠️ Skipping creator without userId:', creator);
          continue;
        }

        try {
          let response;
          let data;

          if (isV3) {
            // Use V3 API endpoint for client-origin campaigns
            response = await fetch(
              `/api/submission/v3?campaignId=${campaign.id}&userId=${creator.userId}`
            );
          } else {
            // Use legacy API endpoint for admin-origin campaigns
            response = await fetch(
              `/api/submissions?userId=${creator.userId}&campaignId=${campaign.id}`
            );
          }

          if (!response.ok) {
            statusMap[creator.userId] = 'NOT_STARTED';
            continue;
          }

          data = await response.json();

          if (!data || data.length === 0) {
            statusMap[creator.userId] = 'NOT_STARTED';
            continue;
          }

          // Filter out agreement submissions - only consider FIRST_DRAFT, FINAL_DRAFT, and POSTING
          const relevantSubmissions = data.filter(
            (submission) =>
              submission.submissionType?.type === 'FIRST_DRAFT' ||
              submission.submissionType?.type === 'FINAL_DRAFT' ||
              submission.submissionType?.type === 'POSTING'
          );

          if (relevantSubmissions.length === 0) {
            statusMap[creator.userId] = 'NOT_STARTED';
            continue;
          }

          // Find submissions by type
          const firstDraftSubmission = relevantSubmissions.find(
            (item) => item.submissionType.type === 'FIRST_DRAFT'
          );
          const finalDraftSubmission = relevantSubmissions.find(
            (item) => item.submissionType.type === 'FINAL_DRAFT'
          );
          const postingSubmission = relevantSubmissions.find(
            (item) => item.submissionType.type === 'POSTING'
          );

          // Determine the status based on the latest stage in the workflow
          // Priority: Posting > Final Draft > First Draft
          // For V3 campaigns, use displayStatus if available
          if (postingSubmission) {
            statusMap[creator.userId] = isV3 && postingSubmission.displayStatus 
              ? postingSubmission.displayStatus 
              : postingSubmission.status;
          } else if (finalDraftSubmission) {
            statusMap[creator.userId] = isV3 && finalDraftSubmission.displayStatus 
              ? finalDraftSubmission.displayStatus 
              : finalDraftSubmission.status;
          } else if (firstDraftSubmission) {
            statusMap[creator.userId] = isV3 && firstDraftSubmission.displayStatus 
              ? firstDraftSubmission.displayStatus 
              : firstDraftSubmission.status;
          } else {
            statusMap[creator.userId] = 'NOT_STARTED';
          }
        } catch (error) {
          console.error(`Error fetching status for creator ${creator.userId}:`, error);
          statusMap[creator.userId] = 'NOT_STARTED';
        }
      }

      setCreatorStatuses(statusMap);
    } catch (error) {
      console.error('Error refreshing creator statuses:', error);
    } finally {
      setLoadingStatuses(false);
    }
  };


  // Set first creator as selected by default, or use target creator from localStorage
  useEffect(() => {
    if (sortedCreators?.length && !selectedCreator) {
      // Check if there's a target creator ID from notification
      const targetCreatorId = localStorage.getItem('targetCreatorId');

      if (targetCreatorId) {
        // Find the specific creator to select
        const targetCreator = sortedCreators.find((creator) => creator.userId === targetCreatorId);
        if (targetCreator) {
          setSelectedCreator(targetCreator);
          // Clear the target creator ID after using it
          localStorage.removeItem('targetCreatorId');
        } else {
          // Fallback to first creator if target not found
          if (sortedCreators[0]?.userId && sortedCreators[0]?.user) {
            setSelectedCreator(sortedCreators[0]);
          }
        }
      } else {
        // Default behavior - select first creator
        if (sortedCreators[0]?.userId && sortedCreators[0]?.user) {
          setSelectedCreator(sortedCreators[0]);
        }
      }
    }
  }, [filteredCreators, selectedCreator, sortedCreators]);

  // Handle creator selection
  const handleCreatorSelect = (creator) => {
    // Safety check to ensure creator has required data
    if (!creator?.userId || !creator?.user) {
      console.warn('⚠️ Attempted to select invalid creator:', creator);
      return;
    }
    setSelectedCreator(creator);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      APPROVED: {
        color: '#1ABF66',
        borderColor: '#1ABF66',
        tooltip: 'All deliverables have been approved',
      },
      CLIENT_APPROVED: {
        color: '#1ABF66',
        borderColor: '#1ABF66',
        tooltip: 'All deliverables have been approved by client',
      },
      REJECTED: {
        color: '#FF4842',
        borderColor: '#FF4842',
        tooltip: 'One or more deliverables have been rejected',
      },
      PENDING_REVIEW: {
        color: '#FFC702',
        borderColor: '#FFC702',
        tooltip: 'Waiting for admin review',
      },
      IN_PROGRESS: {
        color: '#8A5AFE',
        borderColor: '#8A5AFE',
        tooltip: 'Creator is working on deliverables',
      },
      CHANGES_REQUIRED: {
        color: '#D4321C',
        borderColor: '#D4321C',
        tooltip: 'Changes requested by admin',
      },
      SENT_TO_ADMIN: {
        color: '#F6C000',
        borderColor: '#F6C000',
        tooltip: 'Client feedback sent to admin for review',
      },
      CLIENT_FEEDBACK: {
        color: '#F6C000',
        borderColor: '#F6C000',
        tooltip: 'Client feedback sent to admin for review',
      },
      SENT_TO_CLIENT: {
        color: '#8a5afe',
        borderColor: '#8a5afe',
        tooltip: 'Sent to client for review',
      },
      SENT_TO_SUPERADMIN: {
        color: '#8a5afe',
        borderColor: '#8a5afe',
        tooltip: 'Sent to superadmin for review',
      },
      NOT_STARTED: {
        color: '#8E8E93',
        borderColor: '#8E8E93',
        tooltip: 'Creator has not started work yet',
      },
    };

    return statusMap[status] || statusMap.NOT_STARTED;
  };

  const renderCreatorStatus = (userId) => {
    // Safety check for userId
    if (!userId) {
      console.warn('⚠️ renderCreatorStatus called with invalid userId:', userId);
      return <CircularProgress size={16} />;
    }

    if (loadingStatuses) return <CircularProgress size={16} />;

    const status = creatorStatuses[userId] || 'NOT_STARTED';
    let statusText = status.replace(/_/g, ' ');

    // Handle SENT_TO_ADMIN status display for admin users
    if (status === 'SENT_TO_ADMIN') {
      statusText = 'CLIENT FEEDBACK';
    }

    const statusInfo = getStatusInfo(status);

    return (
      <Tooltip title={statusInfo.tooltip} arrow>
        <Typography
          variant="body2"
          sx={{
            textTransform: 'uppercase',
            display: 'inline-block',
            px: { xs: 0.8, md: 1.2 },
            py: { xs: 0.3, md: 0.4 },
            fontSize: { xs: '0.65rem', md: '0.7rem' },
            fontWeight: 600,
            border: '1px solid',
            borderBottom: { xs: '1.5px solid', md: '2px solid' },
            borderRadius: 0.8,
            bgcolor: 'white',
            whiteSpace: 'nowrap',
            color: statusInfo.color,
            borderColor: statusInfo.color,
          }}
        >
          {statusText}
        </Typography>
      </Tooltip>
    );
  };

  const renderAccordionStatus = (submission) => {
    if (!submission) return null;

    // Use displayStatus for V3 submissions, fallback to regular status
    const status = submission.displayStatus || submission.status;
    let statusText = status ? status.replace(/_/g, ' ') : '';

    // Handle SENT_TO_ADMIN status display for admin users
    if (status === 'SENT_TO_ADMIN') {
      statusText = 'CLIENT FEEDBACK';
    }

    const statusInfo = getStatusInfo(status);

    return (
      <Tooltip title={statusInfo.tooltip} arrow>
        <Typography
          variant="body2"
          sx={{
            textTransform: 'uppercase',
            display: 'inline-block',
            px: { xs: 1, md: 1.5 },
            py: { xs: 0.4, md: 0.6 },
            fontSize: { xs: '0.65rem', md: '0.75rem' },
            fontWeight: 600,
            border: '1px solid',
            borderBottom: { xs: '2px solid', md: '3px solid' },
            borderRadius: 0.8,
            bgcolor: 'white',
            whiteSpace: 'nowrap',
            color: statusInfo.color,
            borderColor: statusInfo.color,
            ml: { xs: 1, md: 2 },
          }}
        >
          {statusText}
        </Typography>
      </Tooltip>
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
      {/* Search and Sort Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 2 },
          justifyContent: { xs: 'stretch', sm: 'flex-start' },
          alignItems: { xs: 'stretch', sm: 'center' },
          width: '100%',
          mb: { xs: 1, sm: 2 },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <TextField
            placeholder="Search by Creator Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="material-symbols:search" />
                </InputAdornment>
              ),
              sx: {
                height: '42px',
                '& input': {
                  py: 3,
                  height: '42px',
                },
              },
            }}
            sx={{
              flexGrow: 1,
              maxWidth: { sm: 250 },
              '& .MuiOutlinedInput-root': {
                height: '42px',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1,
              },
            }}
          />
          <Button
            onClick={handleToggleSort}
            endIcon={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {sortDirection === 'asc' ? (
                  <Stack direction="column" alignItems="center" spacing={0}>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                    >
                      A
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                    >
                      Z
                    </Typography>
                  </Stack>
                ) : (
                  <Stack direction="column" alignItems="center" spacing={0}>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                    >
                      Z
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                    >
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
              backgroundColor: { xs: '#f9f9f9', sm: 'transparent' },
              border: { xs: '1px solid #e7e7e7', sm: 'none' },
              borderBottom: { xs: '3px solid #e7e7e7', sm: 'none' },
              borderRadius: 1,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              boxShadow: 'none',
              minWidth: { sm: '140px' },
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: { xs: '#f5f5f5', sm: 'transparent' },
                color: '#221f20',
              },
            }}
          >
            Alphabetical
          </Button>

          {/* Refresh Button */}
          {/* <Button
            onClick={handleRefreshStatuses}
            disabled={loadingStatuses}
            startIcon={
              loadingStatuses ? (
                <CircularProgress size={16} />
              ) : (
                <Iconify icon="eva:refresh-fill" width={16} />
              )
            }
            sx={{
              px: 1.5,
              py: 0.75,
              height: '42px',
              color: '#637381',
              fontWeight: 600,
              fontSize: '0.875rem',
              backgroundColor: { xs: '#f9f9f9', sm: 'transparent' },
              border: { xs: '1px solid #e7e7e7', sm: 'none' },
              borderBottom: { xs: '3px solid #e7e7e7', sm: 'none' },
              borderRadius: 1,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              boxShadow: 'none',
              minWidth: { sm: '100px' },
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: { xs: '#f5f5f5', sm: 'transparent' },
                color: '#221f20',
              },
              '&:disabled': {
                opacity: 0.6,
              },
            }}
          >
            {loadingStatuses ? 'Refreshing...' : 'Refresh'}
          </Button> */}
        </Stack>
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
            width: { xs: '100%', md: '35%' },
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
              maxHeight: { xs: '50vh', md: '80vh' },
              overflowY: 'auto',
              border: { xs: '1px solid #e7e7e7', md: 'none' },
              borderRadius: { xs: 2, md: 0 },
            }}
          >
            {filteredCreators.length > 0 ? (
              filteredCreators.map((creator) => (
                <Box
                  key={creator.userId}
                  sx={{
                    mx: { xs: 1, md: 2 },
                    mb: 1,
                    p: { xs: 2, md: 2.5 },
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
                        width: { xs: 40, md: 48 },
                        height: { xs: 40, md: 48 },
                      }}
                    />

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        sx={{
                          mb: 0.2,
                          fontWeight: 400,
                          fontSize: { xs: '0.9rem', md: '1rem' },
                          color: '#231F20',
                        }}
                      >
                        {creator.user?.name}
                      </Typography>
                    </Box>

                    {renderCreatorStatus(creator.userId)}

                    <Iconify
                      icon="eva:arrow-ios-forward-fill"
                      sx={{
                        color: 'text.secondary',
                        width: { xs: 20, md: 26 },
                        height: { xs: 20, md: 26 },
                        ml: 1,
                        display: { xs: 'none', sm: 'block' },
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
                      expandedAccordion === 'firstDraft' ? (
                        <Iconify
                          icon="eva:arrow-ios-upward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      ) : (
                        <Iconify
                          icon="eva:arrow-ios-forward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      )
                    }
                    sx={{
                      borderBottom: expandedAccordion === 'firstDraft' ? '1px solid' : 'none',
                      borderColor: 'divider',
                      p: { xs: 1, md: 1.5 },
                      minHeight: { xs: 48, md: 54 },
                      bgcolor:
                        expandedAccordion === 'firstDraft' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
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
                            fontSize: { xs: '0.9rem', md: '1.125rem' },
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
                  <AccordionDetails
                    sx={{
                      p: 0,
                      '& > *': {
                        px: { xs: 2, md: 2.5 },
                        py: { xs: 1.5, md: 2 },
                      },
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    }}
                  >
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
                      expandedAccordion === 'finalDraft' ? (
                        <Iconify
                          icon="eva:arrow-ios-upward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      ) : (
                        <Iconify
                          icon="eva:arrow-ios-forward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      )
                    }
                    sx={{
                      borderBottom: expandedAccordion === 'finalDraft' ? '1px solid' : 'none',
                      borderColor: 'divider',
                      p: { xs: 1, md: 1.5 },
                      minHeight: { xs: 48, md: 54 },
                      bgcolor:
                        expandedAccordion === 'finalDraft' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
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
                            fontSize: { xs: '0.9rem', md: '1.125rem' },
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
                  <AccordionDetails
                    sx={{
                      p: 0,
                      '& > *': {
                        px: { xs: 2, md: 2.5 },
                        py: { xs: 1.5, md: 2 },
                      },
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    }}
                  >
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
                      expandedAccordion === 'posting' ? (
                        <Iconify
                          icon="eva:arrow-ios-upward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      ) : (
                        <Iconify
                          icon="eva:arrow-ios-forward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      )
                    }
                    sx={{
                      borderBottom: expandedAccordion === 'posting' ? '1px solid' : 'none',
                      borderColor: 'divider',
                      p: { xs: 1, md: 1.5 },
                      minHeight: { xs: 48, md: 54 },
                      bgcolor:
                        expandedAccordion === 'posting' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
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
                            fontSize: { xs: '0.9rem', md: '1.125rem' },
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
                  <AccordionDetails
                    sx={{
                      p: 0,
                      '& > *': {
                        px: { xs: 2, md: 2.5 },
                        py: { xs: 1.5, md: 2 },
                      },
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    }}
                  >
                    {postingSubmission ? (
                      <Posting
                        submission={postingSubmission}
                        campaign={campaign}
                        creator={selectedCreator}
                        isV3={campaign?.origin === 'CLIENT'}
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
