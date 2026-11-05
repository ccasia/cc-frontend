import PropTypes from 'prop-types';

import { useSubmissionComments } from 'src/hooks/use-submission-comments';

import { VideoToolbar } from 'src/components/video-toolbar';

// Same as the comment list: a client comment an admin sent on shows that admin's name
export const displayNameOf = (comment) => comment.forwardedBy?.name || comment.user?.name;

/**
 * The admin viewer's video toolbar for this modal's player, with the shown video's
 * feedback as dots. A dot with a drawing shows the drawing; any other dot jumps there.
 */
export default function ModalVideoToolbar({
  submissionId,
  videoId,
  onSeek,
  onShowAnnotation,
  ...props
}) {
  const { comments } = useSubmissionComments(submissionId, videoId);

  const handleMarkerClick = (seconds, items) => {
    const drawing = items.find((comment) => comment.annotation)?.annotation;
    if (drawing) onShowAnnotation(drawing);
    else onSeek(seconds);
  };

  return (
    <VideoToolbar
      {...props}
      comments={comments}
      onSeek={onSeek}
      onMarkerClick={handleMarkerClick}
      getAuthorName={displayNameOf}
    />
  );
}

ModalVideoToolbar.propTypes = {
  submissionId: PropTypes.string,
  videoId: PropTypes.string,
  onSeek: PropTypes.func.isRequired,
  onShowAnnotation: PropTypes.func.isRequired,
};
