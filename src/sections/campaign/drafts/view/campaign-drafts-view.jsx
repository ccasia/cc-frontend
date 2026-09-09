import { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Button,
  Dialog,
  Container,
  InputBase,
  Typography,
  Pagination,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';
import useGetCampaignDrafts from 'src/hooks/use-get-campaign-drafts';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import CreateCampaignFormV2 from 'src/sections/campaign/create/form-v2';

import getDraftName from '../get-draft-name';
import DraftListItem from '../draft-list-item';
import DeleteDraftDialog from '../delete-draft-dialog';

// ----------------------------------------------------------------------

const PAGE_SIZE = 5;

// ----------------------------------------------------------------------

export default function CampaignDraftsView() {
  const settings = useSettingsContext();
  const router = useRouter();
  const smDown = useResponsive('down', 'sm');
  const { user } = useAuthContext();

  const {
    drafts,
    isLoading,
    mutate: mutateDrafts,
    deleteDraft,
  } = useGetCampaignDrafts(true, user?.id);

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [resumeDraftId, setResumeDraftId] = useState(null);
  const [draftToDelete, setDraftToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Newest first -- the draft you were last in is almost always the one you want.
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...drafts]
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      .filter((draft) => !needle || getDraftName(draft).toLowerCase().includes(needle));
  }, [drafts, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Deleting the last row of the last page, or typing a narrower search, can
  // strand you past the end of the list.
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isSearching = Boolean(query.trim());
  let emptyTitle = 'No saved drafts yet';
  if (isLoading) emptyTitle = 'Loading drafts…';
  else if (isSearching) emptyTitle = 'No drafts match that search';

  const handleBack = () => {
    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === 'number' && historyIndex > 0) {
      router.back();
      return;
    }
    router.push(paths.dashboard.campaign.view);
  };

  const handleConfirmDelete = async () => {
    if (!draftToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDraft(draftToDelete.id);
      setDraftToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseResume = () => {
    setResumeDraftId(null);
    mutateDrafts();
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ px: { xs: 2, sm: 4 } }}>
      <Stack spacing={2.5} sx={{ width: '100%' }}>
        <Button
          onClick={handleBack}
          startIcon={<Iconify icon="eva:chevron-left-fill" width={20} />}
          sx={{
            alignSelf: 'flex-start',
            gap: '4px',
            px: 0,
            minWidth: 0,
            color: '#636366',
            fontFamily: 'InterDisplay',
            fontWeight: 600,
            fontSize: 14,
            lineHeight: '18px',
            textTransform: 'none',
            '& .MuiButton-startIcon': { m: 0 },
            '&:hover': { bgcolor: 'transparent', color: '#231F20' },
          }}
        >
          Back
        </Button>

        <Stack spacing={0.5}>
          <Typography
            component="h1"
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontWeight: 400,
              fontSize: { xs: 32, sm: 40 },
              lineHeight: '44px',
              color: '#231F20',
            }}
          >
            Drafts 📝
          </Typography>
          <Typography
            sx={{
              fontFamily: 'InterDisplay',
              fontWeight: 400,
              fontSize: 14,
              lineHeight: '18px',
              color: '#636366',
            }}
          >
            Campaigns you started but haven&apos;t launched yet. Drafts over 30 days old will be
            auto-deleted.
          </Typography>
        </Stack>

        <Box
          sx={{
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: 40,
            padding: '6px 10px 9px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E8E8E8',
            boxShadow: 'inset 0px -3px 0px #E7E7E7',
            borderRadius: '8px',
            transition: 'border-color 140ms ease-out',
            '&:focus-within': { borderColor: '#D6D6D6' },
          }}
        >
          <Iconify icon="eva:search-outline" width={16} sx={{ color: '#8E8E93', flexShrink: 0 }} />
          <InputBase
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search"
            inputProps={{ 'aria-label': 'Search drafts' }}
            sx={{
              flex: 1,
              fontFamily: 'InterDisplay',
              fontWeight: 500,
              fontSize: 14,
              lineHeight: '18px',
              color: '#231F20',
              '& input::placeholder': { color: '#8E8E93', opacity: 1 },
            }}
          />
        </Box>

        <Stack spacing={2}>
          {visible.map((draft) => (
            <DraftListItem
              key={draft.id}
              draft={draft}
              onResume={setResumeDraftId}
              onDelete={setDraftToDelete}
            />
          ))}

          {!visible.length && (
            <Box
              sx={{
                py: 8,
                textAlign: 'center',
                bgcolor: '#FFFFFF',
                border: '1px dashed #EBEBEB',
                borderRadius: '12px',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'InterDisplay',
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#231F20',
                }}
              >
                {emptyTitle}
              </Typography>
              {!isLoading && !isSearching && (
                <Typography
                  sx={{
                    mt: 0.5,
                    fontFamily: 'InterDisplay',
                    fontSize: 14,
                    color: '#8E8E93',
                  }}
                >
                  Start a campaign and it saves itself here as you go.
                </Typography>
              )}
            </Box>
          )}
        </Stack>

        {pageCount > 1 && (
          <Stack direction="row" justifyContent="flex-end" sx={{ pt: 1 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(event, value) => setPage(value)}
              shape="rounded"
              sx={{
                '& .MuiPaginationItem-root': {
                  fontFamily: 'InterDisplay',
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#8E8E93',
                },
                '& .Mui-selected': {
                  bgcolor: 'transparent !important',
                  fontWeight: 700,
                  color: '#231F20',
                },
              }}
            />
          </Stack>
        )}
      </Stack>

      <DeleteDraftDialog
        open={Boolean(draftToDelete)}
        isDeleting={isDeleting}
        onClose={() => setDraftToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <Dialog
        fullWidth
        fullScreen
        open={Boolean(resumeDraftId)}
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 4,
            m: 2,
            height: '97vh',
            overflow: 'hidden',
            ...(smDown && { height: 1, m: 0 }),
          },
        }}
      >
        {/* Keyed so resuming a second draft never inherits the first form state. */}
        {resumeDraftId && (
          <CreateCampaignFormV2
            key={resumeDraftId}
            initialDraftId={resumeDraftId}
            onClose={handleCloseResume}
            onSuccess={() => router.push(paths.dashboard.campaign.view)}
          />
        )}
      </Dialog>
    </Container>
  );
}
