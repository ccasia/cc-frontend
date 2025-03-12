import { useState } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Button,
  ListItemText,
  Container,
  TextField,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetCreators from 'src/hooks/use-get-creators';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import EmptyContent from 'src/components/empty-content';
import UserCardList from '../user-card-list';

// ----------------------------------------------------------------------

export default function UserCardsView() {
  const settings = useSettingsContext();
  const { data: creators, isLoading } = useGetCreators();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredCreators = creators?.filter((creator) =>
    creator.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <UserCardList creators={filteredCreators} />
      )}
    </Container>
  );
}
