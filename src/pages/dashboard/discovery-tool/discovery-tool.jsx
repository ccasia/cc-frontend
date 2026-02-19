import { Helmet } from 'react-helmet-async';
import DiscoveryToolView from 'src/sections/discovery-tool/view/discovery-tool-view'

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Creator Discovery Tool</title>
      </Helmet>

      <DiscoveryToolView />
    </>
  );
}
