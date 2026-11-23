import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import LinearProgress from '@mui/material/LinearProgress';

import { fDate } from 'src/utils/format-time';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import Lightbox, { useLightBox } from 'src/components/lightbox';

import { MAX_SCREENSHOTS } from 'src/sections/insight-ocr/constants';
import { PRIMARY_BUTTON_SX } from 'src/sections/campaign/discover/client/v3-pitches/guest-extraction/manual-metrics-dialog';

import InsightsValues from './insights-values';
import InsightsDropzone from './insights-dropzone';
import LowerMetricsDialog from './lower-metrics-dialog';
import RemoveScreenshotDialog from './remove-screenshot-dialog';
import {
  PLATFORMS,
  joinNames,
  postPlatform,
  countUnread,
  lastAddedAt,
  uploaderNames,
  toDisplayFields,
  screenshotUploader,
} from './utils';
import { useAddPostInsightScreenshots, useRemovePostInsightScreenshot } from './use-post-insights';

const BLUE = '#1340FF';

const SECONDARY_BUTTON_SX = {
  ...PRIMARY_BUTTON_SX,
  bgcolor: '#FFFFFF',
  borderColor: '#E7E7E7',
  borderBottomColor: '#E7E7E7',
  color: '#231F20',
  '&:hover': { bgcolor: '#F5F5F5', borderColor: '#221f20', borderBottomColor: '#221f20' },
};

function UploaderTag({ uploader }) {
  const isCreator = uploader?.role === 'creator';

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 4,
        bottom: 4,
        px: 0.5,
        borderRadius: 0.5,
        fontSize: 10,
        fontWeight: 700,
        lineHeight: '16px',
        color: '#FFFFFF',
        bgcolor: isCreator ? 'rgba(19, 64, 255, 0.9)' : 'rgba(35, 31, 32, 0.85)',
      }}
    >
      {isCreator ? 'Creator' : 'Admin'}
    </Box>
  );
}

UploaderTag.propTypes = { uploader: PropTypes.object };

function Screenshots({ insights, canAdd, onAdd, canRemove, onRemove }) {
  const screenshots = useMemo(() => insights?.screenshots ?? [], [insights?.screenshots]);
  const slides = useMemo(() => screenshots.map((s) => ({ src: s.url })), [screenshots]);
  const lightbox = useLightBox(slides);

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pt: 0.75, pb: 0.5 }}>
        {screenshots.map((screenshot) => {
          const uploader = screenshotUploader(screenshot, insights);
          const added = [
            uploader?.name && `Added by ${uploader.name}`,
            screenshot.uploadedAt && fDate(screenshot.uploadedAt),
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <Box key={screenshot.url} sx={{ position: 'relative', flexShrink: 0 }}>
              <Tooltip title={added} placement="top">
                <ButtonBase
                  aria-label={`Preview ${screenshot.fileName}`}
                  onClick={() => lightbox.onOpen(screenshot.url)}
                  sx={{
                    position: 'relative',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid #EBEBEB',
                    '& .zoom': { opacity: 0, transition: 'opacity 120ms ease' },
                    '&:hover .zoom, &:focus-visible .zoom': { opacity: 1 },
                  }}
                >
                  <Box
                    component="img"
                    src={screenshot.url}
                    alt=""
                    sx={{ width: 72, height: 128, objectFit: 'cover' }}
                  />
                  <Box
                    className="zoom"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'rgba(0, 0, 0, 0.35)',
                      color: '#FFFFFF',
                    }}
                  >
                    <Iconify icon="solar:magnifer-zoom-in-linear" width={22} />
                  </Box>
                  <UploaderTag uploader={uploader} />
                </ButtonBase>
              </Tooltip>

              {canRemove(uploader) && (
                <IconButton
                  size="small"
                  aria-label={`Remove ${screenshot.fileName}`}
                  onClick={() => onRemove(screenshot)}
                  sx={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    p: 0.25,
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E7E7E7',
                    color: '#636366',
                    '&:hover': { bgcolor: '#FEE2E2', color: '#EF4444', borderColor: '#EF4444' },
                  }}
                >
                  <Iconify icon="eva:close-fill" width={14} />
                </IconButton>
              )}
            </Box>
          );
        })}

        {canAdd && (
          <ButtonBase
            onClick={onAdd}
            aria-label="Add more screenshots"
            sx={{
              width: 72,
              height: 128,
              flexShrink: 0,
              flexDirection: 'column',
              gap: 0.5,
              borderRadius: 1,
              border: '1.5px dashed #D1D1D1',
              color: '#636366',
              fontSize: 12,
              fontWeight: 600,
              '&:hover': { borderColor: BLUE, color: BLUE, bgcolor: 'rgba(19, 64, 255, 0.04)' },
            }}
          >
            <Iconify icon="eva:plus-fill" width={20} />
            Add
          </ButtonBase>
        )}
      </Stack>

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
        disabledVideo
        disabledSlideshow
        disabledTotal={slides.length < 2}
        disabledThumbnails={slides.length < 2}
      />
    </>
  );
}

Screenshots.propTypes = {
  insights: PropTypes.object,
  canAdd: PropTypes.bool,
  onAdd: PropTypes.func,
  canRemove: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default function PostInsightsDialog({
  open,
  onClose,
  campaignId,
  submissionId,
  postUrl,
  insights,
  canEdit,
  canManage,
}) {
  const { user } = useAuthContext();
  const [files, setFiles] = useState([]);
  const [adding, setAdding] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  const [review, setReview] = useState(null);

  const save = useAddPostInsightScreenshots(campaignId);
  const remove = useRemovePostInsightScreenshot(campaignId);
  const busy = save.isPending || remove.isPending;

  useEffect(() => {
    if (open) return;
    setFiles([]);
    setAdding(false);
  }, [open]);

  const platform = postPlatform(postUrl);
  const count = insights?.screenshots?.length ?? 0;
  const room = MAX_SCREENSHOTS - count;
  const isUploading = canEdit && (!insights || adding);
  const fields = toDisplayFields(insights);
  const unread = countUnread(insights);
  const names = uploaderNames(insights);
  const saveVerb = count ? 'Add' : 'Save';
  const saveLabel = files.length
    ? `${saveVerb} ${files.length} Screenshot${files.length === 1 ? '' : 's'}`
    : saveVerb;

  // Managers can remove any screenshot. Others only the ones they added.
  const canRemove = (uploader) =>
    canEdit && (canManage || (!!uploader?.id && uploader.id === user?.id));

  const handleSave = () =>
    save.mutate(
      { submissionId, postUrl, files },
      {
        onSuccess: (data) => {
          setFiles([]);
          setAdding(false);
          enqueueSnackbar(count ? 'Screenshots added' : 'Insight screenshots saved');
          if (canManage && data?.metricsReview?.pending) {
            setReview({ id: data.id, pending: data.metricsReview.pending });
          }

          const skipped = data?.skipped ?? [];
          if (skipped.length) {
            const other = PLATFORMS[skipped[0].platform]?.name ?? 'another app';
            enqueueSnackbar(
              `${skipped.length} screenshot${skipped.length === 1 ? ' was' : 's were'} from ${other}, so we did not add ${
                skipped.length === 1 ? 'it' : 'them'
              }. Add ${other} insights to the ${other} post.`,
              { variant: 'warning', autoHideDuration: 8000 }
            );
          }
        },
        onError: (error) =>
          enqueueSnackbar(error?.message || 'Could not save the screenshots', { variant: 'error' }),
      }
    );

  const handleRemove = () =>
    remove.mutate(
      { id: insights.id, url: toRemove.url },
      {
        onSuccess: () => {
          if (count === 1) onClose();
          setToRemove(null);
          enqueueSnackbar('Screenshot removed');
        },
        onError: (error) =>
          enqueueSnackbar(error?.message || 'Could not remove the screenshot', {
            variant: 'error',
          }),
      }
    );

  return (
    <>
      <Dialog
        open={open}
        onClose={busy ? undefined : onClose}
        maxWidth={false}
        disableEnforceFocus
        aria-labelledby="post-insights-title"
        PaperProps={{
          sx: {
            width: 600,
            maxWidth: 'calc(100% - 32px)',
            bgcolor: '#F4F4F4 !important',
            backgroundImage: 'none',
            borderRadius: '20px',
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                id="post-insights-title"
                component="h2"
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontSize: { xs: 28, sm: 36 },
                  lineHeight: '40px',
                }}
              >
                Post insights
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                {platform && (
                  <>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      sx={{ color: '#231F20' }}
                    >
                      <Iconify icon={platform.icon} width={16} />
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                        {platform.name} post
                      </Typography>
                    </Stack>
                    <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#8E8E93' }} />
                  </>
                )}
                <Typography sx={{ fontSize: 14, color: '#636366' }}>Optional</Typography>
                <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#8E8E93' }} />
                <Link
                  href={postUrl}
                  target="_blank"
                  rel="noopener"
                  underline="hover"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1340FF',
                  }}
                >
                  Open post
                  <Iconify icon="eva:external-link-fill" width={14} />
                </Link>
              </Stack>
            </Box>
            <IconButton onClick={onClose} disabled={busy} aria-label="Close" sx={{ mt: -0.5 }}>
              <Iconify icon="eva:close-fill" width={24} />
            </IconButton>
          </Stack>

          <Box sx={{ mt: 2.5 }}>
            {isUploading ? (
              <Stack spacing={1.5}>
                <Typography sx={{ fontSize: 14, color: '#636366' }}>
                  {count
                    ? `These are added to the ${count} current screenshot${count === 1 ? '' : 's'}. We read the numbers from all of them again.`
                    : `Add screenshots of this post's ${platform ? `${platform.name} ` : ''}insights. We read the numbers from them.`}
                </Typography>
                <InsightsDropzone
                  files={files}
                  onChange={setFiles}
                  disabled={save.isPending}
                  max={room}
                  tabs={platform?.tabs}
                />
                {save.isPending && (
                  <Box>
                    <LinearProgress sx={{ borderRadius: 1 }} />
                    <Typography sx={{ mt: 1, fontSize: 12, color: '#8E8E93' }}>
                      Reading the screenshots. This takes about 10 seconds.
                    </Typography>
                  </Box>
                )}
              </Stack>
            ) : (
              <Stack spacing={2}>
                {!!insights?.conflicts && (
                  <Alert severity="warning">
                    {insights.conflicts} value{insights.conflicts > 1 ? 's are' : ' is'} different
                    across screenshots. We show the first one.
                  </Alert>
                )}
                {!!unread && (
                  <Alert severity="info">
                    We could not read {unread} screenshot{unread > 1 ? 's' : ''}. The image is still
                    saved.
                  </Alert>
                )}
                {fields.length ? (
                  <InsightsValues fields={fields} platform={platform} />
                ) : (
                  <Typography sx={{ fontSize: 14, color: '#636366' }}>
                    No values found on these screenshots.
                  </Typography>
                )}
                <Screenshots
                  insights={insights}
                  canAdd={canEdit && room > 0}
                  onAdd={() => setAdding(true)}
                  canRemove={canRemove}
                  onRemove={setToRemove}
                />
                <Typography sx={{ fontSize: 12, color: '#8E8E93' }}>
                  {[names.length && `Added by ${joinNames(names)}`, fDate(lastAddedAt(insights))]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              </Stack>
            )}
          </Box>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
            {isUploading ? (
              <>
                <Button
                  onClick={insights ? () => setAdding(false) : onClose}
                  disabled={save.isPending}
                  sx={SECONDARY_BUTTON_SX}
                >
                  Cancel
                </Button>
                <LoadingButton
                  onClick={handleSave}
                  loading={save.isPending}
                  disabled={!files.length}
                  sx={PRIMARY_BUTTON_SX}
                >
                  {saveLabel}
                </LoadingButton>
              </>
            ) : (
              <>
                {canEdit && room > 0 && (
                  <Button
                    onClick={() => setAdding(true)}
                    startIcon={<Iconify icon="eva:plus-fill" width={18} />}
                    sx={SECONDARY_BUTTON_SX}
                  >
                    Add screenshots
                  </Button>
                )}
                <Button onClick={onClose} sx={PRIMARY_BUTTON_SX}>
                  Done
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Dialog>

      <RemoveScreenshotDialog
        open={!!toRemove}
        isLast={count === 1}
        isRemoving={remove.isPending}
        onClose={() => setToRemove(null)}
        onConfirm={handleRemove}
      />

      <LowerMetricsDialog
        open={!!review}
        campaignId={campaignId}
        insightId={review?.id}
        pending={review?.pending}
        onClose={() => setReview(null)}
      />
    </>
  );
}

PostInsightsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  campaignId: PropTypes.string.isRequired,
  submissionId: PropTypes.string.isRequired,
  postUrl: PropTypes.string.isRequired,
  insights: PropTypes.object,
  canEdit: PropTypes.bool,
  canManage: PropTypes.bool,
};
