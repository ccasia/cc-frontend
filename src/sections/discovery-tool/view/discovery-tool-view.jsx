import { useSnackbar } from 'notistack';
import { useRef, useMemo, useState, useCallback } from 'react';

import { Container, Typography } from '@mui/material';

import useGetDiscoveryCreators from 'src/hooks/use-get-discovery-creators';
import useGetDiscoveryListCreators from 'src/hooks/use-get-discovery-list-creators';
import useGetDiscoveryBookmarkLists from 'src/hooks/use-get-discovery-bookmark-lists';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import LinkCreatorDialog from './link-creator-dialog';
import InviteCreatorsDialog from './invite-creators-dialog';
import { canInviteCreator } from '../components/creator-helpers';
import { CreatorList, DiscoveryFilterBar, CreatorDetailsDrawer } from '../components';

const ADDED_SORT_QUERY = {
  recent: { sortBy: 'createdAt', sortDirection: 'desc' },
  oldest: { sortBy: 'createdAt', sortDirection: 'asc' },
  name: { sortBy: 'name', sortDirection: 'asc' },
};

// ─── Component ────────────────────────────────────────────────────────────────

const getCreatorRowKey = (creator, index) =>
  creator.rowId || `${creator.userId}-${creator.platform || index}`;

const DiscoveryToolView = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const isClientDemo = user?.role === 'client_demo';
  // Same rule as the backend isSuperAdmin guard on /api/campaign/linkGuestCreator.
  const canLinkCreators = ['god', 'advanced', 'normal'].includes(user?.admin?.mode);
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

  // null = off, 'desc' = highest first, 'asc' = lowest first.
  const [followersSortDirection, setFollowersSortDirection] = useState(null);
  const [addedSort, setAddedSort] = useState('name');

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
      ...(followersSortDirection
        ? { sortBy: 'followers', sortDirection: followersSortDirection }
        : ADDED_SORT_QUERY[addedSort]),
      hydrateMissing: true,
      limit: 20,
    }),
    [filters, followersSortDirection, addedSort]
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
    mutate: mutateCreators,
  } = useGetDiscoveryCreators(discoveryQuery);

  // Stable callback for the filter bar
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // First click sorts highest first; later clicks flip between highest and lowest.
  const handleToggleFollowersSort = useCallback(() => {
    setFollowersSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  }, []);

  // Picking a date or name sort turns the followers sort off.
  const handleAddedSortChange = useCallback((value) => {
    setAddedSort(value);
    setFollowersSortDirection(null);
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

  // Per-account bookmark lists (with counts) + membership lookup
  const {
    lists,
    membershipsByRowKey,
    isLoading: isLoadingLists,
    mutate: mutateLists,
  } = useGetDiscoveryBookmarkLists();

  // Lists currently selected to filter the grid
  const [selectedListIds, setSelectedListIds] = useState([]);

  // Drop any selected list ids that no longer exist (e.g. after deletion)
  const validSelectedListIds = useMemo(() => {
    const listIdSet = new Set(lists.map((list) => list.id));
    return selectedListIds.filter((id) => listIdSet.has(id));
  }, [lists, selectedListIds]);

  const {
    listCreators,
    isLoading: isLoadingListCreators,
    mutate: mutateListCreators,
  } = useGetDiscoveryListCreators(validSelectedListIds);

  const refreshBookmarkData = useCallback(() => {
    mutateLists();
    mutateListCreators();
  }, [mutateLists, mutateListCreators]);

  const handleCreateList = useCallback(
    async (name) => {
      try {
        await axiosInstance.post(endpoints.discovery.bookmarkLists, { name });
        await mutateLists();
        enqueueSnackbar(`List "${name}" created.`, { variant: 'success' });
      } catch (error) {
        console.error('Failed to create list:', error);
        enqueueSnackbar(error?.response?.data?.message || 'Failed to create list', {
          variant: 'error',
        });
      }
    },
    [enqueueSnackbar, mutateLists]
  );

  const handleDeleteList = useCallback(
    async (listId) => {
      try {
        await axiosInstance.delete(`${endpoints.discovery.bookmarkLists}/${listId}`);
        setSelectedListIds((prev) => prev.filter((id) => id !== listId));
        refreshBookmarkData();
        enqueueSnackbar('List deleted.', { variant: 'success' });
      } catch (error) {
        console.error('Failed to delete list:', error);
        enqueueSnackbar(error?.response?.data?.message || 'Failed to delete list', {
          variant: 'error',
        });
      }
    },
    [enqueueSnackbar, refreshBookmarkData]
  );

  const handleToggleCreatorInList = useCallback(
    async (listId, creator, isInList) => {
      if (!creator?.userId || !creator?.platform || !listId) return;

      const creatorUserId = creator.userId;
      const { platform } = creator;
      const url = `${endpoints.discovery.bookmarkLists}/${listId}/creators`;

      try {
        if (isInList) {
          await axiosInstance.delete(url, { params: { creatorUserId, platform } });
        } else {
          await axiosInstance.post(url, { creatorUserId, platform });
        }
        refreshBookmarkData();
      } catch (error) {
        console.error('Failed to update list membership:', error);
        enqueueSnackbar(error?.response?.data?.message || 'Failed to update list', {
          variant: 'error',
        });
      }
    },
    [enqueueSnackbar, refreshBookmarkData]
  );

  // Imperative handle to open the "Select List" dropdown (e.g. from a card's
  // empty-state link). The dropdown itself is rendered inside CreatorList.
  const listDropdownRef = useRef(null);
  const handleOpenListManager = useCallback(() => {
    listDropdownRef.current?.open();
  }, []);

  // Creator details sidebar
  const [detailsCreatorId, setDetailsCreatorId] = useState(null);

  const handleOpenDetails = useCallback((rowId) => {
    setDetailsCreatorId(rowId);
  }, []);

  // List-filtered creators may not be part of the loaded pages, so search both lists
  const findCreatorByRowKey = useCallback(
    (rowKey) =>
      creators.find((creator, index) => getCreatorRowKey(creator, index) === rowKey) ||
      listCreators.find((creator, index) => getCreatorRowKey(creator, index) === rowKey) ||
      null,
    [creators, listCreators]
  );

  const detailsCreator = useMemo(
    () => (detailsCreatorId ? findCreatorByRowKey(detailsCreatorId) : null),
    [detailsCreatorId, findCreatorByRowKey]
  );

  const inviteCreators = useMemo(
    () => inviteCreatorIds.map(findCreatorByRowKey).filter(canInviteCreator),
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

  const [linkCreatorRowKey, setLinkCreatorRowKey] = useState(null);
  const linkCreator = linkCreatorRowKey ? findCreatorByRowKey(linkCreatorRowKey) : null;
  const handleLinked = useCallback(() => {
    mutateCreators();
    mutateListCreators();
  }, [mutateCreators, mutateListCreators]);

  const handleInviteOne = useCallback(
    async (rowId) => {
      if (!rowId || !canInviteCreator(findCreatorByRowKey(rowId))) return;

      setInviteCreatorIds([rowId]);
      setInviteCampaignId('');
      setInviteOpen(true);

      if (!inviteCampaignsLoadedRef.current && !inviteCampaignsRequestRef.current) {
        await loadInviteCampaigns();
      }
    },
    [loadInviteCampaigns, findCreatorByRowKey]
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
          fontFamily: 'Instrument Serif',
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
        followersSortDirection={followersSortDirection}
        onToggleFollowersSort={handleToggleFollowersSort}
        addedSort={addedSort}
        onAddedSortChange={handleAddedSortChange}
        onLoadMore={handleLoadMore}
        lists={lists}
        membershipsByRowKey={membershipsByRowKey}
        listCreators={listCreators}
        isLoadingListCreators={isLoadingListCreators || isLoadingLists}
        selectedListIds={validSelectedListIds}
        onSelectedListIdsChange={setSelectedListIds}
        onCreateList={handleCreateList}
        onDeleteList={handleDeleteList}
        onToggleCreatorInList={handleToggleCreatorInList}
        onOpenListManager={handleOpenListManager}
        listDropdownRef={listDropdownRef}
        onInviteOne={isClientDemo ? undefined : handleInviteOne}
        onLinkCreator={canLinkCreators ? setLinkCreatorRowKey : undefined}
        onOpenDetails={handleOpenDetails}
      />

      {/* Creator details sidebar */}
      <CreatorDetailsDrawer
        open={!!detailsCreatorId}
        creator={detailsCreator}
        rowKey={detailsCreatorId}
        lists={lists}
        creatorListIds={membershipsByRowKey?.get(detailsCreatorId)}
        onClose={() => setDetailsCreatorId(null)}
        onToggleList={handleToggleCreatorInList}
        onOpenListManager={handleOpenListManager}
        onInvite={isClientDemo ? undefined : handleInviteOne}
      />

      {/* Mounted only while open: the dialog fetches every platform creator. */}
      {linkCreator && (
        <LinkCreatorDialog
          open
          creator={linkCreator}
          onClose={() => setLinkCreatorRowKey(null)}
          onLinked={handleLinked}
        />
      )}

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
