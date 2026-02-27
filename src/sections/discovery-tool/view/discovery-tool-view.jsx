import { useSnackbar } from 'notistack';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import {
	Box,
	Container,
	Pagination,
	Typography,
} from '@mui/material';

import useGetDiscoveryCreators from 'src/hooks/use-get-discovery-creators';

import axiosInstance, { endpoints } from 'src/utils/axios';

import InviteCreatorsDialog from './invite-creators-dialog';
import CompareCreatorsDialog from './compare-creators-dialog';
import { CreatorList, DiscoveryFilterBar } from '../components';

// ─── Component ────────────────────────────────────────────────────────────────

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

	// Track whether the current filter results should be displayed
	const [showResults, setShowResults] = useState(true);
	const isInitialMount = useRef(true);
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
		page: currentPage,
		limit: 20,
	});

	// Check if any filter is active (non-default)
	const hasActiveFilters = useMemo(
		() =>
			filters.platform !== 'all' ||
			filters.debouncedKeyword !== '' ||
			filters.debouncedHashtag !== '' ||
			filters.ageRange !== '' ||
			filters.country !== null ||
			filters.city !== null ||
			filters.gender !== '' ||
			filters.creditTier !== '' ||
			filters.languages.length > 0 ||
			filters.interests.length > 0,
		[filters]
	);

	// Show results if explicitly applied OR no filters are active (default view)
	const shouldShowResults = showResults || !hasActiveFilters;

	// Result count for the "Show X Creators" button
	const resultCount = isLoading ? null : pagination?.total ?? null;

	// Stable callback for the filter bar
	const handleFiltersChange = useCallback((newFilters) => {
		setFilters(newFilters);
	}, []);

	// When filters change (after initial mount), hide results so the user must click "Show Results"
	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}
		setShowResults(false);
		setCurrentPage(1);
	}, [filters]);

	const handleShowResults = useCallback(() => {
		setShowResults(true);
	}, []);

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
	const [compareOpen, setCompareOpen] = useState(false);
	const [inviteOpen, setInviteOpen] = useState(false);
	const [inviteCampaigns, setInviteCampaigns] = useState([]);
	const [inviteCampaignId, setInviteCampaignId] = useState('');
	const [inviteLoadingCampaigns, setInviteLoadingCampaigns] = useState(false);
	const [inviteSubmitting, setInviteSubmitting] = useState(false);

	const handleSelectCreator = useCallback((rowId) => {
		setSelectedCreatorIds((prev) =>
			prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
		);
	}, []);

	// Resolve selected creator objects for comparison dialog
	const selectedCreators = useMemo(
		() =>
			selectedCreatorIds
				.map((id) => creators.find((c) => (c.rowId || c.userId) === id))
				.filter(Boolean),
		[selectedCreatorIds, creators]
	);

	const handleCompare = useCallback(() => {
		setCompareOpen(true);
	}, []);

	const loadInviteCampaigns = useCallback(async () => {
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
					}))
			);
		} catch (error) {
			console.error('Failed to load campaigns for invite:', error);
			enqueueSnackbar('Failed to load campaigns', { variant: 'error' });
		} finally {
			setInviteLoadingCampaigns(false);
		}
	}, [enqueueSnackbar]);

	const handleInviteOpen = useCallback(async () => {
		if (!selectedCreatorIds.length) {
			enqueueSnackbar('Select at least one creator to invite', { variant: 'warning' });
			return;
		}

		if (!inviteCampaigns.length) {
			await loadInviteCampaigns();
		}

		setInviteCampaignId('');
		setInviteOpen(true);
	}, [enqueueSnackbar, inviteCampaigns.length, loadInviteCampaigns, selectedCreatorIds.length]);

	const handleInviteClose = useCallback(() => {
		if (inviteSubmitting) return;
		setInviteOpen(false);
	}, [inviteSubmitting]);

	const handleInviteCancel = useCallback(() => {
		if (inviteSubmitting) return;
		setSelectedCreatorIds([]);
		setInviteCampaignId('');
		setInviteOpen(false);
	}, [inviteSubmitting]);

	const handleRemoveInvitedCreator = useCallback((creatorIdentifier) => {
		if (!creatorIdentifier) return;
		setSelectedCreatorIds((prev) => prev.filter((id) => id !== creatorIdentifier));
	}, []);

	const handleInviteSubmit = useCallback(async () => {
		const selectedCreatorUserIds = Array.from(
			new Set(selectedCreators.map((creator) => creator?.userId).filter(Boolean))
		);

		if (!inviteCampaignId) {
			enqueueSnackbar('Select a campaign first', { variant: 'warning' });
			return;
		}

		if (!selectedCreatorUserIds.length) {
			enqueueSnackbar('No valid creators selected', { variant: 'warning' });
			return;
		}

		try {
			setInviteSubmitting(true);
			const response = await axiosInstance.post(endpoints.discovery.inviteCreators, {
				campaignId: inviteCampaignId,
				creatorIds: selectedCreatorUserIds,
			});

			const invitedCount = response?.data?.invitedCount ?? selectedCreatorUserIds.length;
			enqueueSnackbar(`${invitedCount} creator${invitedCount === 1 ? '' : 's'} invited`, {
				variant: 'success',
			});
			setSelectedCreatorIds([]);
			setInviteOpen(false);
		} catch (error) {
			console.error('Failed to invite creators:', error);
			enqueueSnackbar(error?.response?.data?.message || 'Failed to invite creators', {
				variant: 'error',
			});
		} finally {
			setInviteSubmitting(false);
		}
	}, [enqueueSnackbar, inviteCampaignId, selectedCreators]);

	// Log results only when they actually change
	useEffect(() => {
		console.log(`Discovery creators (${creators.length}${pagination ? ` of ${pagination.total}` : ''})`);
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
				resultCount={resultCount}
				isCountLoading={isLoading}
				onShowResults={handleShowResults}
				showButton={hasActiveFilters && !showResults}
			/>

			{shouldShowResults && (
				<CreatorList
					creators={creators}
					isLoading={isLoading}
					isError={isError}
					pagination={pagination}
					sortByFollowers={sortByFollowers}
					onToggleFollowersSort={handleToggleFollowersSort}
					selectedIds={selectedCreatorIds}
					onSelect={handleSelectCreator}
					onCompare={handleCompare}
					onInvite={handleInviteOpen}
				/>
			)}

			{shouldShowResults && !isLoading && totalPages > 1 && (
				<Box display="flex" justifyContent="center" mt={2}>
					<Pagination
						count={totalPages}
						page={currentPage}
						onChange={handlePageChange}
						size="medium"
						variant='contained'
					/>
				</Box>
			)}

			{/* Compare Dialog */}
			<CompareCreatorsDialog
				open={compareOpen}
				onClose={() => setCompareOpen(false)}
				creators={selectedCreators}
			/>

			<InviteCreatorsDialog
				open={inviteOpen}
				onClose={handleInviteClose}
				onCancel={handleInviteCancel}
				selectedCreatorsCount={selectedCreators.length}
				creators={selectedCreators}
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