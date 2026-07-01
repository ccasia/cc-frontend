import { useState, useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Card,
  Stack,
  Table,
  Button,
  Switch,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  CardHeader,
  TableContainer,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { useDebounce } from 'src/hooks/use-debounce';

import { paths } from 'src/routes/paths';

import {
  featureVideo,
  removeFeaturedVideo,
  updateFeaturedVideo,
  useGetVideosOfTheMonth,
  useSearchFeaturableSubmissions,
} from 'src/api/video-of-the-month';

import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content/empty-content';

import VideoPreviewTile from '../video-preview-tile';

// ----------------------------------------------------------------------

// Derive a human label for a submission row in the picker.
const submissionLabel = (submission) => {
  const campaign = submission?.campaign?.name ?? 'Untitled Campaign';
  const creator = submission?.user?.name ?? 'Unknown creator';
  return { campaign, creator };
};

export default function VideoOfTheMonthView() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [pendingId, setPendingId] = useState(null);
  // Only one preview tile may be expanded/playing at a time across both tables.
  const [activePreviewId, setActivePreviewId] = useState(null);

  const { videos, isLoading, mutate } = useGetVideosOfTheMonth();
  const { submissions, isLoading: isSearching } =
    useSearchFeaturableSubmissions(debouncedSearch);

  // Submission ids already featured — so the picker can disable them.
  const featuredSubmissionIds = new Set(videos.map((v) => v.submission?.id));

  const handleFeature = useCallback(
    async (submission) => {
      setPendingId(submission.id);
      try {
        await featureVideo({ submissionId: submission.id, videoIndex: 0 });
        await mutate();
        enqueueSnackbar('Added to Videos of the Month');
      } catch (error) {
        enqueueSnackbar(error?.message ?? 'Failed to feature video', { variant: 'error' });
      } finally {
        setPendingId(null);
      }
    },
    [mutate]
  );

  const handleRemove = useCallback(
    async (id) => {
      setPendingId(id);
      try {
        await removeFeaturedVideo(id);
        await mutate();
        enqueueSnackbar('Removed from Videos of the Month');
      } catch (error) {
        enqueueSnackbar(error?.message ?? 'Failed to remove video', { variant: 'error' });
      } finally {
        setPendingId(null);
      }
    },
    [mutate]
  );

  const handleToggleFeatured = useCallback(
    async (video) => {
      setPendingId(video.id);
      try {
        await updateFeaturedVideo(video.id, { featured: !video.featured });
        await mutate();
      } catch (error) {
        enqueueSnackbar(error?.message ?? 'Failed to update video', { variant: 'error' });
      } finally {
        setPendingId(null);
      }
    },
    [mutate]
  );

  return (
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Videos of the Month"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Videos of the Month' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        {/* Currently featured */}
        <Card>
          <CardHeader
            title="Currently featured"
            subheader="Shown on the mobile home feed. Toggle off to hide without removing."
          />
          <Box sx={{ p: 3 }}>
            {isLoading ? (
              <Stack alignItems="center" sx={{ py: 5 }}>
                <CircularProgress />
              </Stack>
            ) : videos.length === 0 ? (
              <EmptyContent title="No videos featured yet" />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Preview</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Creator</TableCell>
                      <TableCell align="center">Featured</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {videos.map((video) => {
                      const { campaign, creator } = submissionLabel(video.submission);
                      const busy = pendingId === video.id;
                      const featuredVideos = video.submission?.video ?? [];
                      const featuredVideoUrl =
                        featuredVideos[video.videoIndex]?.url ??
                        featuredVideos[0]?.url ??
                        null;
                      return (
                        <TableRow key={video.id} hover>
                          <TableCell>
                            <VideoPreviewTile
                              url={featuredVideoUrl}
                              playing={activePreviewId === video.id}
                              onToggle={() =>
                                setActivePreviewId((cur) =>
                                  cur === video.id ? null : video.id
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>{campaign}</TableCell>
                          <TableCell>{creator}</TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={!!video.featured}
                              disabled={busy}
                              onChange={() => handleToggleFeatured(video)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="error"
                              disabled={busy}
                              onClick={() => handleRemove(video.id)}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Card>

        {/* Add from submissions */}
        <Card>
          <CardHeader
            title="Add a video"
            subheader="Search completed submissions by campaign or creator name."
          />
          <Box sx={{ p: 3 }}>
            <TextField
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaign or creator…"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {isSearching ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
              </Stack>
            ) : submissions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No submissions with a video match that search.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Preview</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Creator</TableCell>
                      <TableCell align="center">Videos</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissions.map((submission) => {
                      const { campaign, creator } = submissionLabel(submission);
                      const already =
                        !!submission.videoOfTheMonth ||
                        featuredSubmissionIds.has(submission.id);
                      const busy = pendingId === submission.id;
                      // Latest video is what gets featured (backend orders desc).
                      const latestVideoUrl = submission.video?.[0]?.url ?? null;
                      return (
                        <TableRow key={submission.id} hover>
                          <TableCell>
                            <VideoPreviewTile
                              url={latestVideoUrl}
                              playing={activePreviewId === submission.id}
                              onToggle={() =>
                                setActivePreviewId((cur) =>
                                  cur === submission.id ? null : submission.id
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>{campaign}</TableCell>
                          <TableCell>{creator}</TableCell>
                          <TableCell align="center">
                            {submission.video?.length ?? 0}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={already || busy}
                              startIcon={
                                <Iconify
                                  icon={already ? 'eva:checkmark-fill' : 'eva:plus-fill'}
                                />
                              }
                              onClick={() => handleFeature(submission)}
                            >
                              {already ? 'Featured' : 'Feature'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Card>
      </Stack>
    </Container>
  );
}
