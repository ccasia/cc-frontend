import PropTypes from 'prop-types';

import { Stack } from '@mui/material';

import { postInsightsKey, usePostInsights, PostInsightsButton } from 'src/components/post-insights';

// Optional insight screenshots, one row per approved posting link.
const SubmissionPostInsights = ({ campaignId, submissionId, postingLinks }) => {
  const { byPost } = usePostInsights(campaignId, { submissionId });
  const links = postingLinks.filter(Boolean);

  if (!links.length) return null;

  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      {links.map((link) => (
        <PostInsightsButton
          key={link}
          variant="row"
          canEdit
          campaignId={campaignId}
          submissionId={submissionId}
          postUrl={link}
          insights={byPost.get(postInsightsKey(submissionId, link))}
        />
      ))}
    </Stack>
  );
};

SubmissionPostInsights.propTypes = {
  campaignId: PropTypes.string.isRequired,
  submissionId: PropTypes.string.isRequired,
  postingLinks: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default SubmissionPostInsights;
