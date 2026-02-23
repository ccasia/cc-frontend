import { useState, useEffect, useCallback } from 'react';

import { Container, Typography } from '@mui/material';

import useGetDiscoveryCreators from 'src/hooks/use-get-discovery-creators';

import { DiscoveryFilterBar } from '../components';

// ─── Component ────────────────────────────────────────────────────────────────

const DiscoveryToolView = () => {
	const [filters, setFilters] = useState({
		platform: 'all',
		debouncedKeyword: '',
		ageRange: '',
		country: null,
		city: null,
		gender: '',
		creditTier: '',
		interests: [],
	});

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
	});

	// Stable callback for the filter bar
	const handleFiltersChange = useCallback((newFilters) => {
		setFilters(newFilters);
	}, []);

	// Log results only when they actually change
	useEffect(() => {
		console.log(`Discovery creators (${creators.length}${pagination ? ` of ${pagination.total}` : ''}):`, creators);
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

			<DiscoveryFilterBar onFiltersChange={handleFiltersChange} availableLocations={availableLocations} />

			{isLoading && <Typography sx={{ mt: 3 }}>Loading creators...</Typography>}
			{isError && (
				<Typography sx={{ mt: 3, color: 'error.main' }}>
					Failed to fetch creators
				</Typography>
			)}

			{!isLoading && !isError && (
				<Typography sx={{ mt: 3, color: 'text.secondary' }}>
					{creators.length} creator{creators.length !== 1 ? 's' : ''} found
					{pagination ? ` (${pagination.total} total)` : ''}
					{' — check console for detailed results'}
				</Typography>
			)}
		</Container>
	);
};

export default DiscoveryToolView;