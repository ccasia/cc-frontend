import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import useGetCreators from 'src/hooks/use-get-creators';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

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
          { name: 'Cards' },
        ]}
        // action={
        //   <Button
        //     component={RouterLink}
        //     href={paths.dashboard.user.new}
        //     variant="contained"
        //     startIcon={<Iconify icon="mingcute:add-line" />}
        //   >
        //     New User
        //   </Button>
        // }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UserCardList creators={creators} />
    </Container>
  );
}
