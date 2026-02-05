import { Helmet } from 'react-helmet-async';

import FeedbackView from 'src/sections/feedback/view/feedback-view';

export default function FeedbackPage() {
  return (
    <>
      <Helmet>
        <title>Feedback | Cult Creative</title>
      </Helmet>

      <FeedbackView />
    </>
  );
}
