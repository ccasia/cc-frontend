import { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Paper,
  Stack,
  Container,
  InputBase,
  IconButton,
  Pagination,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetCreators from 'src/hooks/use-get-creators';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import UserCardList from '../user-card-list';

// ----------------------------------------------------------------------

export default function UserCardsView() {
  const settings = useSettingsContext();
  const { data: creators, isLoading } = useGetCreators();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const router = useRouter();

  const filteredCreators = useMemo(
    () =>
      creators?.filter((creator) =>
        creator.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [],
    [creators, searchTerm]
  );

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const paginatedCreators = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredCreators.slice(startIndex, endIndex);
  }, [filteredCreators, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredCreators.length / rowsPerPage);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // return (
  //   <Box position="absolute" top="50%" left="50%" sx={{ transform: 'translate(-50%, -50%)' }}>
  //     <Stack alignItems="center" width={300}>
  //       <Avatar sx={{ bgcolor: '#8A5AFE', width: 60, height: 60, fontSize: 35 }}>⚒️</Avatar>
  //       <ListItemText
  //         primary="Check back later"
  //         secondary="Nothing to see here, just upgrading some things"
  //         primaryTypographyProps={{
  //           variant: 'body1',
  //           fontSize: 35,
  //           fontFamily: (theme) => theme.typography.fontSecondaryFamily,
  //         }}
  //         secondaryTypographyProps={{
  //           variant: 'body2',
  //           fontSize: 15,
  //         }}
  //         sx={{ textAlign: 'center' }}
  //       />
  //       <Button
  //         variant="contained"
  //         fullWidth
  //         sx={{ mt: 3 }}
  //         onClick={() => router.push(paths.dashboard.root)}
  //       >
  //         Okay
  //       </Button>
  //     </Stack>
  //   </Box>
  // );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Creator Media Kits"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Creator', href: paths.dashboard.creator.root },
          { name: 'Media Kits' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 4,
          width: '100%' 
        }}
      >
        <Paper
          elevation={2}
          sx={{
            px: 2,
            py: 0.5,
            display: 'flex',
            width: { xs: '100%', md: '500px' },
            border: '1px solid #E0E0E0',
            borderRadius: 2,
          }}
        >
          <InputBase
            fullWidth
            placeholder="Search creators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <Iconify icon="material-symbols:search" width={20} sx={{ color: 'text.disabled', mr: 1 }} />
              </InputAdornment>
            }
            endAdornment={
              searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch} edge="end" aria-label="clear search">
                    <Iconify icon="material-symbols:close" width={18} />
                  </IconButton>
                </InputAdornment>
              )
            }
            sx={{ 
              height: 44,
              typography: 'body1',
            }}
          />
        </Paper>
      </Box>

      {isLoading && <LoadingScreen />}

      {!isLoading && filteredCreators?.length < 1 ? (
        <Box>
          <EmptyContent
            filled
            title="No Creators Found"
            sx={{
              py: 10,
            }}
          />
        </Box>
      ) : (
        <>
          <UserCardList creators={paginatedCreators} />
          
          {filteredCreators.length > rowsPerPage && (
            <Stack alignItems="center" sx={{ mt: 5, mb: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPagination-ul': {
                    justifyContent: 'center',
                  },
                }}
              />
            </Stack>
          )}
        </>
      )}
    </Container>
  );
}
