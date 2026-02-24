import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Container, Pagination, Typography } from '@mui/material';

import useGetDiscoveryCreators from 'src/hooks/use-get-discovery-creators';

import { CreatorList, DiscoveryFilterBar } from '../components';

// ─── Component ────────────────────────────────────────────────────────────────

const DiscoveryToolView = () => {
	const [filters, setFilters] = useState({
		platform: 'all',
		debouncedKeyword: '',
		debouncedHashtag: '',
		ageRange: '',
		country: null,
		city: null,
		gender: '',
		creditTier: '',
		interests: [],
	});

	// Track whether the current filter results should be displayed
	const [showResults, setShowResults] = useState(true);
	const isInitialMount = useRef(true);
	const [currentPage, setCurrentPage] = useState(1);

	// All filters are now server-side — pass them all to the SWR hook
	const { creators, pagination, availableLocations, isLoading, isError, pageSize } = useGetDiscoveryCreators({
		platform: filters.platform,
		gender: filters.gender || undefined,
		ageRange: filters.ageRange || undefined,
		country: filters.country || undefined,
		city: filters.city || undefined,
		creditTier: filters.creditTier || undefined,
		interests: filters.interests?.length ? filters.interests : undefined,
		keyword: filters.debouncedKeyword || undefined,
		hashtag: filters.debouncedHashtag || undefined,
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

	const viewedCount = useMemo(() => {
		const total = pagination?.total ?? creators.length;
		if (!total) return 0;
		return Math.min(currentPage * pageSize, total);
	}, [pagination?.total, creators.length, currentPage, pageSize]);

	const handlePageChange = useCallback((_event, nextPage) => {
		setCurrentPage(nextPage);
	}, []);

	// Creator selection for comparison
	const [selectedCreatorIds, setSelectedCreatorIds] = useState([]);

	const handleSelectCreator = useCallback((rowId) => {
		setSelectedCreatorIds((prev) =>
			prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
		);
	}, []);

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
				<Box
					sx={{
						mt: 3,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 2,
						flexWrap: 'wrap',
					}}
				>
					<Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
						{isLoading
							? 'Loading creators…'
							: `Showing ${viewedCount} of ${pagination?.total ?? creators.length} creator${(pagination?.total ?? creators.length) === 1 ? '' : 's'}`}
					</Typography>

					{!isLoading && totalPages > 1 && (
						<Pagination
							count={totalPages}
							page={currentPage}
							onChange={handlePageChange}
							size="small"
							variant='outlined'
						/>
					)}
				</Box>
			)}

			{shouldShowResults && (
				<CreatorList
					creators={creators}
					isLoading={isLoading}
					isError={isError}
					pagination={pagination}
					selectedIds={selectedCreatorIds}
					onSelect={handleSelectCreator}
				/>
			)}
		</Container>
	);
};

export default DiscoveryToolView;