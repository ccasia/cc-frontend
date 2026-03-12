import { Helmet } from 'react-helmet-async';

import DiscoveryToolNpcView from 'src/sections/discovery-tool/view/discovery-tool-npc-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Creator Discovery Tool</title>
      </Helmet>

      <DiscoveryToolNpcView />
    </>
  );
}
