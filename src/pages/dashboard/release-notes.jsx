import { Helmet } from 'react-helmet-async';

import ReleaseNotesAdminView from 'src/sections/release-notes/view/release-notes-admin-view';

export default function ReleaseNotesPage() {
  return (
    <>
      <Helmet>
        <title>Release Notes</title>
      </Helmet>

      <ReleaseNotesAdminView />
    </>
  );
}
