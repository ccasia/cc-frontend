import { useState } from 'react';

import Container from '@mui/material/Container';
import { Box, TextField, InputAdornment } from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetCreators from 'src/hooks/use-get-creators';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content/empty-content';

import UserCardList from '../user-card-list';

// ----------------------------------------------------------------------

export default function UserCardsView() {
  const settings = useSettingsContext();
  const { data: creators, isLoading } = useGetCreators();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCreators = creators?.filter((creator) =>
    creator.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Creators Media Kits"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Creator', href: paths.dashboard.creator.root },
          { name: 'Media Kits' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <TextField
          label="Search creators"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '50%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {/* <SearchIcon /> */}
                <Iconify icon="material-symbols:search" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {isLoading && (
        <LoadingScreen />
        // <Box>
        //   <CircularProgress />
        // </Box>
      )}

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
        <UserCardList creators={filteredCreators} />
      )}
      {/* {filteredCreators?.length < 1 ? (
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
        <UserCardList creators={filteredCreators} />
      )} */}
    </Container>
  );
}
