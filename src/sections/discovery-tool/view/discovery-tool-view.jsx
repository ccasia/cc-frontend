import { useSnackbar } from 'notistack';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Container, Pagination, Typography } from '@mui/material';

import useGetDiscoveryCreators from 'src/hooks/use-get-discovery-creators';

import axiosInstance, { endpoints } from 'src/utils/axios';

import InviteCreatorsDialog from './invite-creators-dialog';
import { CreatorList, DiscoveryFilterBar, CreatorDetailsDrawer } from '../components';

// ─── Component ────────────────────────────────────────────────────────────────

const getCreatorRowKey = (creator, index) =>
  creator.rowId || `${creator.userId}-${creator.platform || index}`;

const DiscoveryToolView = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [filters, setFilters] = useState({
    platform: 'all',
    debouncedKeyword: '',
    debouncedHashtag: '',
    ageRange: '',
    country: null,
    city: null,
    gender: '',
    creditTier: '',
    languages: [],
    interests: [],
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [sortByFollowers, setSortByFollowers] = useState(false);

  // All filters are now server-side — pass them all to the SWR hook
  const { creators, pagination, availableLocations, isLoading, isError } = useGetDiscoveryCreators({
    platform: filters.platform,
    gender: filters.gender || undefined,
    ageRange: filters.ageRange || undefined,
    country: filters.country || undefined,
    city: filters.city || undefined,
    creditTier: filters.creditTier || undefined,
    languages: filters.languages?.length ? filters.languages : undefined,
    interests: filters.interests?.length ? filters.interests : undefined,
    keyword: filters.debouncedKeyword || undefined,
    hashtag: filters.debouncedHashtag || undefined,
    sortBy: sortByFollowers ? 'followers' : 'name',
    sortDirection: sortByFollowers ? 'desc' : 'asc',
    hydrateMissing: true,
    page: currentPage,
    limit: 20,
  });

  // Stable callback for the filter bar
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = useMemo(() => {
    if (!pagination?.total || !pagination?.limit) return 1;
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination]);

  const handlePageChange = useCallback((_event, nextPage) => {
    setCurrentPage(nextPage);
  }, []);

  const handleToggleFollowersSort = useCallback(() => {
    setSortByFollowers((prev) => !prev);
    setCurrentPage(1);
  }, []);

  // Creator selection & comparison
  const [selectedCreatorIds, setSelectedCreatorIds] = useState([]);
  const [inviteCreatorIds, setInviteCreatorIds] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCampaigns, setInviteCampaigns] = useState([]);
  const [inviteCampaignId, setInviteCampaignId] = useState('');
  const [inviteLoadingCampaigns, setInviteLoadingCampaigns] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const inviteCampaignsLoadedRef = useRef(false);
  const inviteCampaignsRequestRef = useRef(null);

  const handleSelectCreator = useCallback((rowId) => {
    setSelectedCreatorIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  }, []);

  // Creator details sidebar
  const [detailsCreatorId, setDetailsCreatorId] = useState(null);

  const handleOpenDetails = useCallback((rowId) => {
    setDetailsCreatorId(rowId);
  }, []);

  const detailsCreator = useMemo(
    () =>
      detailsCreatorId
        ? creators.find(
            (creator, index) => getCreatorRowKey(creator, index) === detailsCreatorId
          ) || null
        : null,
    [detailsCreatorId, creators]
  );

  const inviteCreators = useMemo(
    () =>
      inviteCreatorIds
        .map((id) => creators.find((creator, index) => getCreatorRowKey(creator, index) === id))
        .filter(Boolean),
    [inviteCreatorIds, creators]
  );

  const selectedCampaignExistingCreatorIds = useMemo(() => {
    if (!inviteCampaignId) return [];
    const selectedCampaign = inviteCampaigns.find((campaign) => campaign.id === inviteCampaignId);
    return selectedCampaign?.existingCreatorIds || [];
  }, [inviteCampaignId, inviteCampaigns]);

  const loadInviteCampaigns = useCallback(
    async (force = false) => {
      if (!force && inviteCampaignsLoadedRef.current) {
        return;
      }

      if (inviteCampaignsRequestRef.current) {
        await inviteCampaignsRequestRef.current;
        return;
      }

      const request = (async () => {
        try {
          setInviteLoadingCampaigns(true);
          const response = await axiosInstance.get(endpoints.campaign.getAllActiveCampaign, {
            params: {
              status: 'ACTIVE',
              limit: 100,
            },
          });

          const payload = response?.data;
          let campaignRows = [];
          if (Array.isArray(payload)) {
            campaignRows = payload;
          } else if (Array.isArray(payload?.campaigns)) {
            campaignRows = payload.campaigns;
          } else if (Array.isArray(payload?.data)) {
            campaignRows = payload.data;
          }

          setInviteCampaigns(
            campaignRows
              .filter((campaign) => campaign?.id && campaign?.name)
              .map((campaign) => ({
                id: campaign.id,
                name: campaign.name,
                submissionVersion: campaign.submissionVersion,
                existingCreatorIds: Array.from(
                  new Set((campaign?.pitch || []).map((pitch) => pitch?.userId).filter(Boolean))
                ),
              }))
          );
          inviteCampaignsLoadedRef.current = true;
        } catch (error) {
          console.error('Failed to load campaigns for invite:', error);
          enqueueSnackbar('Failed to load campaigns', { variant: 'error' });
        } finally {
          setInviteLoadingCampaigns(false);
        }
      })();

      inviteCampaignsRequestRef.current = request;
      try {
        await request;
      } finally {
        inviteCampaignsRequestRef.current = null;
      }
    },
    [enqueueSnackbar]
  );

  const handleInviteOne = useCallback(
    async (rowId) => {
      if (!rowId) return;

      setInviteCreatorIds([rowId]);
      setInviteCampaignId('');
      setInviteOpen(true);

      if (!inviteCampaignsLoadedRef.current && !inviteCampaignsRequestRef.current) {
        await loadInviteCampaigns();
      }
    },
    [loadInviteCampaigns]
  );

  const handleInviteClose = useCallback(() => {
    if (inviteSubmitting) return;
    setInviteOpen(false);
  }, [inviteSubmitting]);

  const handleInviteCancel = useCallback(() => {
    if (inviteSubmitting) return;
    setInviteCreatorIds([]);
    setInviteCampaignId('');
    setInviteOpen(false);
  }, [inviteSubmitting]);

  const handleRemoveInvitedCreator = useCallback((creatorIdentifier) => {
    if (!creatorIdentifier) return;
    setInviteCreatorIds((prev) => prev.filter((id) => id !== creatorIdentifier));
  }, []);

  const handleInviteSubmit = useCallback(async () => {
    const selectedCreatorUserIds = Array.from(
      new Set(inviteCreators.map((creator) => creator?.userId).filter(Boolean))
    );
    const invitableCreatorUserIds = selectedCreatorUserIds.filter(
      (userId) => !selectedCampaignExistingCreatorIds.includes(userId)
    );

    if (!inviteCampaignId) {
      enqueueSnackbar('Select a campaign first', { variant: 'warning' });
      return;
    }

    if (!selectedCreatorUserIds.length) {
      enqueueSnackbar('No valid creators selected', { variant: 'warning' });
      return;
    }

    if (!invitableCreatorUserIds.length) {
      enqueueSnackbar('Selected creators are already in this campaign', { variant: 'warning' });
      return;
    }

    try {
      setInviteSubmitting(true);
      const response = await axiosInstance.post(endpoints.discovery.inviteCreators, {
        campaignId: inviteCampaignId,
        creatorIds: invitableCreatorUserIds,
      });

      const invitedCount = response?.data?.invitedCount ?? invitableCreatorUserIds.length;
      enqueueSnackbar(`${invitedCount} creator${invitedCount === 1 ? '' : 's'} invited`, {
        variant: 'success',
      });
      setInviteCreatorIds([]);
      setInviteOpen(false);
    } catch (error) {
      console.error('Failed to invite creators:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to invite creators', {
        variant: 'error',
      });
    } finally {
      setInviteSubmitting(false);
    }
  }, [enqueueSnackbar, inviteCampaignId, inviteCreators, selectedCampaignExistingCreatorIds]);

  // Log results only when they actually change
  useEffect(() => {
    console.log(
      `Discovery creators (${creators.length}${pagination ? ` of ${pagination.total}` : ''})`
    );
    console.log('Creators array: ', creators);
  }, [creators, pagination]);

  return (
    <Container maxWidth="xl">
      <Typography
        sx={{
          fontFamily: 'Aileron',
          fontSize: { xs: 24, md: 48 },
          fontWeight: 400,
        }}
      >
        Creator Discovery Tool
      </Typography>

      <DiscoveryFilterBar
        onFiltersChange={handleFiltersChange}
        availableLocations={availableLocations}
      />

      <CreatorList
        creators={creators}
        isLoading={isLoading}
        isError={isError}
        pagination={pagination}
        sortByFollowers={sortByFollowers}
        onToggleFollowersSort={handleToggleFollowersSort}
        selectedIds={selectedCreatorIds}
        onSelect={handleSelectCreator}
        onInviteOne={handleInviteOne}
        onOpenDetails={handleOpenDetails}
      />

      {!isLoading && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            size="medium"
            variant="contained"
          />
        </Box>
      )}

      {/* Creator details sidebar */}
      <CreatorDetailsDrawer
        open={!!detailsCreatorId}
        creator={detailsCreator}
        rowKey={detailsCreatorId}
        selected={selectedCreatorIds.includes(detailsCreatorId)}
        onClose={() => setDetailsCreatorId(null)}
        onToggleBookmark={handleSelectCreator}
        onInvite={handleInviteOne}
      />

      <InviteCreatorsDialog
        open={inviteOpen}
        onClose={handleInviteClose}
        onCancel={handleInviteCancel}
        selectedCreatorsCount={inviteCreators.length}
        creators={inviteCreators}
        existingCreatorIds={selectedCampaignExistingCreatorIds}
        onRemoveCreator={handleRemoveInvitedCreator}
        campaigns={inviteCampaigns}
        campaignId={inviteCampaignId}
        onCampaignChange={setInviteCampaignId}
        isLoadingCampaigns={inviteLoadingCampaigns}
        isSubmitting={inviteSubmitting}
        onSubmit={handleInviteSubmit}
      />
    </Container>
  );
};

export default DiscoveryToolView;
