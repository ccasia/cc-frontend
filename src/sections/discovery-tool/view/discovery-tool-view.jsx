import { useSnackbar } from 'notistack';
import { useRef, useMemo, useState, useCallback } from 'react';

import { Container, Typography } from '@mui/material';

import useGetDiscoveryCreators from 'src/hooks/use-get-discovery-creators';
import useGetDiscoveryBookmarks from 'src/hooks/use-get-discovery-bookmarks';

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

  const [sortByFollowers, setSortByFollowers] = useState(false);

  // All filters are now server-side — pass them all to the SWR hook
  const discoveryQuery = useMemo(
    () => ({
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
      limit: 20,
    }),
    [filters, sortByFollowers]
  );

  const {
    creators,
    pagination,
    availableLocations,
    isLoading,
    isLoadingMore,
    isValidating,
    isReachingEnd,
    size,
    setSize,
    isError,
  } = useGetDiscoveryCreators(discoveryQuery);

  // Stable callback for the filter bar
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleToggleFollowersSort = useCallback(() => {
    setSortByFollowers((prev) => !prev);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isValidating || isReachingEnd) return;
    setSize(size + 1);
  }, [isReachingEnd, isValidating, setSize, size]);

  // Creator selection & comparison
  const [inviteCreatorIds, setInviteCreatorIds] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCampaigns, setInviteCampaigns] = useState([]);
  const [inviteCampaignId, setInviteCampaignId] = useState('');
  const [inviteLoadingCampaigns, setInviteLoadingCampaigns] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const inviteCampaignsLoadedRef = useRef(false);
  const inviteCampaignsRequestRef = useRef(null);

  // Per-account persisted bookmarks
  const {
    bookmarkedCreators,
    bookmarkedRowKeys,
    isLoading: isLoadingBookmarks,
    mutate: mutateBookmarks,
  } = useGetDiscoveryBookmarks();

  const handleSelectCreator = useCallback(
    async (rowKey, creator) => {
      if (!creator?.userId || !creator?.platform) return;

      const creatorUserId = creator.userId;
      const { platform } = creator;
      const isBookmarked = bookmarkedRowKeys.includes(rowKey);

      const applyToggle = (current) => {
        const safe = current || { data: [], bookmarks: [], total: 0 };

        if (isBookmarked) {
          return {
            ...safe,
            data: (safe.data || []).filter((row) => row.rowId !== rowKey),
            bookmarks: (safe.bookmarks || []).filter(
              (bookmark) =>
                !(bookmark.creatorUserId === creatorUserId && bookmark.platform === platform)
            ),
            total: Math.max(0, (safe.total || 0) - 1),
          };
        }

        return {
          ...safe,
          data: [{ ...creator, rowId: rowKey }, ...(safe.data || [])],
          bookmarks: [
            { creatorUserId, platform, createdAt: new Date().toISOString() },
            ...(safe.bookmarks || []),
          ],
          total: (safe.total || 0) + 1,
        };
      };

      try {
        await mutateBookmarks(
          async (current) => {
            if (isBookmarked) {
              await axiosInstance.delete(endpoints.discovery.bookmarks, {
                params: { creatorUserId, platform },
              });
            } else {
              await axiosInstance.post(endpoints.discovery.bookmarks, { creatorUserId, platform });
            }
            return applyToggle(current);
          },
          { optimisticData: applyToggle, rollbackOnError: true, revalidate: false }
        );
      } catch (error) {
        console.error('Failed to update bookmark:', error);
        enqueueSnackbar(error?.message || 'Failed to update bookmark', {
          variant: 'error',
        });
      }
    },
    [bookmarkedRowKeys, enqueueSnackbar, mutateBookmarks]
  );

  // Creator details sidebar
  const [detailsCreatorId, setDetailsCreatorId] = useState(null);

  const handleOpenDetails = useCallback((rowId) => {
    setDetailsCreatorId(rowId);
  }, []);

  // Bookmarked creators may not be part of the loaded pages, so search both lists
  const findCreatorByRowKey = useCallback(
    (rowKey) =>
      creators.find((creator, index) => getCreatorRowKey(creator, index) === rowKey) ||
      bookmarkedCreators.find((creator, index) => getCreatorRowKey(creator, index) === rowKey) ||
      null,
    [creators, bookmarkedCreators]
  );

  const detailsCreator = useMemo(
    () => (detailsCreatorId ? findCreatorByRowKey(detailsCreatorId) : null),
    [detailsCreatorId, findCreatorByRowKey]
  );

  const inviteCreators = useMemo(
    () => inviteCreatorIds.map(findCreatorByRowKey).filter(Boolean),
    [inviteCreatorIds, findCreatorByRowKey]
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
        isLoadingMore={isLoadingMore}
        isError={isError}
        isReachingEnd={isReachingEnd}
        pagination={pagination}
        sortByFollowers={sortByFollowers}
        onToggleFollowersSort={handleToggleFollowersSort}
        onLoadMore={handleLoadMore}
        selectedIds={bookmarkedRowKeys}
        bookmarkedCreators={bookmarkedCreators}
        isLoadingBookmarks={isLoadingBookmarks}
        onSelect={handleSelectCreator}
        onInviteOne={handleInviteOne}
        onOpenDetails={handleOpenDetails}
      />

      {/* Creator details sidebar */}
      <CreatorDetailsDrawer
        open={!!detailsCreatorId}
        creator={detailsCreator}
        rowKey={detailsCreatorId}
        selected={bookmarkedRowKeys.includes(detailsCreatorId)}
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
