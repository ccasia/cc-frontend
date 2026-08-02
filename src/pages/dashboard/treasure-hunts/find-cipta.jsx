import { Helmet } from 'react-helmet-async';

import FindCiptaView from 'src/sections/treasure-hunts/view/find-cipta-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Find Cipta</title>
      </Helmet>

      <FindCiptaView />
    </>
  );
}
