import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import { Tooltip, IconButton } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import {
  featuredKey,
  useSetFeaturedVideo,
  useFeaturedVideoKeys,
} from 'src/sections/campaign/discover/admin/campaign-analytics/api';

const MotionIconButton = m(IconButton);

/**
 * Star that features a post on the client's campaign overview.
 * Pass { submissionId, postUrl } for a submission post or { manualEntryId } for a manual entry.
 */
export default function FeatureVideoButton({ campaignId, submissionId, postUrl, manualEntryId }) {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const target = manualEntryId ? { manualEntryId } : { submissionId, postUrl };
  const hasTarget = manualEntryId ? true : !!submissionId && !!postUrl;
  // The backend also requires the admin to manage this campaign; others get a 403.
  const canFeature = ['admin', 'superadmin'].includes(user?.role) && !!campaignId && hasTarget;

  const featuredKeys = useFeaturedVideoKeys(campaignId, { enabled: canFeature });
  const setFeatured = useSetFeaturedVideo(campaignId);

  if (!canFeature) return null;

  const featured = featuredKeys.has(featuredKey(target));

  const handleClick = () => {
    setFeatured.mutate(
      { ...target, featured: !featured },
      {
        onError: (error) =>
          enqueueSnackbar(
            error?.response?.status === 403
              ? 'Only this campaign’s managers can feature videos'
              : 'Couldn’t update the featured video',
            { variant: 'error' }
          ),
      }
    );
  };

  return (
    <Tooltip title={featured ? 'Remove from client overview' : 'Feature on client overview'}>
      <MotionIconButton
        type="button"
        aria-pressed={featured}
        aria-label={featured ? 'Unfeature video' : 'Feature video'}
        disabled={setFeatured.isPending}
        disableRipple
        whileHover={{ borderColor: '#dbb970' }}
        onClick={handleClick}
        sx={{
          border: 0.5,
          borderRadius: 1,
          p: 2,
          borderColor: featured ? '#f0d49b' : '#e8e9ee',
          backgroundColor: featured ? '#fff4d7' : '#ffffff',
        }}
      >
        {featured ? (
          <Iconify icon="andrsrxn:star-filled" width={20} color="#de9300" />
        ) : (
          <Iconify icon="andrsrxn:star" width={20} color="#b4b8c2" />
        )}
      </MotionIconButton>
    </Tooltip>
  );
}

FeatureVideoButton.propTypes = {
  campaignId: PropTypes.string,
  submissionId: PropTypes.string,
  postUrl: PropTypes.string,
  manualEntryId: PropTypes.string,
};
