import { Helmet } from 'react-helmet-async';

import VideoOfTheMonthView from 'src/modules/video-of-the-month/sections/view/video-of-the-month-view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Videos of the Month</title>
      </Helmet>

      <VideoOfTheMonthView />
    </>
  );
}
