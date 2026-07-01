import { Helmet } from 'react-helmet-async';

import VideoOfTheMonthView from 'src/sections/video-of-the-month/view/video-of-the-month-view';

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
