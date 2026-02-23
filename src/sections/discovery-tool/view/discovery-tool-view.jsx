import { useRef, useState, useMemo, useEffect, useCallback } from 'react';

import { Container, Typography } from '@mui/material';

import useGetDiscoveryCreators from 'src/hooks/use-get-discovery-creators';

import { DiscoveryFilterBar, CreatorList } from '../components';

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

	// All filters are now server-side — pass them all to the SWR hook
	const { creators, pagination, availableLocations, isLoading, isError } = useGetDiscoveryCreators({
		platform: filters.platform,
		gender: filters.gender || undefined,
		ageRange: filters.ageRange || undefined,
		country: filters.country || undefined,
		city: filters.city || undefined,
		creditTier: filters.creditTier || undefined,
		interests: filters.interests?.length ? filters.interests : undefined,
		keyword: filters.debouncedKeyword || undefined,
		hashtag: filters.debouncedHashtag || undefined,
		page: 1,
		limit: 50,
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
	}, [filters]);

	const handleShowResults = useCallback(() => {
		setShowResults(true);
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