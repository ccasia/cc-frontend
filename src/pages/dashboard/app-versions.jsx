import { Helmet } from 'react-helmet-async';

import AppVersionsView from 'src/sections/app-versions/view/app-versions-view';

export default function AppVersionsPage() {
  return (
    <>
      <Helmet>
        <title>App Versions</title>
      </Helmet>

      <AppVersionsView />
    </>
  );
}
