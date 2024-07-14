import { Box } from '@mui/material';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import useGetCreators from 'src/hooks/use-get-creators';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content/empty-content';

import UserCardList from '../user-card-list';

// ----------------------------------------------------------------------

export default function UserCardsView() {
  const settings = useSettingsContext();

  const { creators } = useGetCreators();

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

      {creators.length < 1 ? (
        <Box>
          <EmptyContent
            filled
            title="No Data"
            sx={{
              py: 10,
            }}
          />
        </Box>
      ) : (
        <UserCardList creators={creators} />
      )}
    </Container>
  );
}
