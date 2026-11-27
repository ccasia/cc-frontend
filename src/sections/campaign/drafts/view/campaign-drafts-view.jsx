import { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Dialog,
  Container,
  InputBase,
  Typography,
  Pagination,
  IconButton,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';
import useGetCampaignDrafts from 'src/hooks/use-get-campaign-drafts';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import CreateCampaignFormV2 from 'src/sections/campaign/create/form-v2';
import { dialogEnterSx } from 'src/sections/campaign/create/components/motion';
import CampaignEmptyState from 'src/sections/campaign/discover/admin/components/campaign-empty-state';

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

  const clearSearch = () => {
    setQuery('');
    setPage(1);
  };

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
        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              onClick={handleBack}
              aria-label="Back"
              sx={{ color: '#636366', fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              <Iconify icon="eva:arrow-ios-back-fill" width={20} />
            </IconButton>
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
          </Stack>
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
            border: '1px solid',
            borderBottom: '3.5px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            height: 44,
            display: 'flex',
            alignItems: 'center',
            transition: 'border-color 0.2s ease',
            '&:focus-within': { borderColor: '#1340ff' },
          }}
        >
          <InputBase
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search drafts"
            inputProps={{ 'aria-label': 'Search drafts' }}
            startAdornment={
              <Iconify
                icon="eva:search-fill"
                sx={{ width: 20, height: 20, mr: 1, ml: 1.5, color: 'text.disabled', flexShrink: 0 }}
              />
            }
            endAdornment={
              isSearching && (
                <Stack direction="row" alignItems="center" sx={{ flexShrink: 0, pl: 1 }}>
                  {filtered.length > 0 && (
                    <Typography
                      component="span"
                      variant="caption"
                      aria-live="polite"
                      noWrap
                      sx={{ color: '#636366', fontSize: 13, fontWeight: 500 }}
                    >
                      {`${filtered.length} ${filtered.length === 1 ? 'result' : 'results'}`}
                    </Typography>
                  )}
                  <IconButton
                    size="small"
                    aria-label="Clear search"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={clearSearch}
                    sx={{ mr: 1, ml: 0.5 }}
                  >
                    <Iconify icon="eva:close-fill" width={18} />
                  </IconButton>
                </Stack>
              )
            }
            sx={{
              width: '100%',
              height: '100%',
              color: 'text.primary',
              '& input': { py: 0, px: 0.5 },
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

          {!isLoading &&
            !visible.length &&
            (isSearching ? (
              <CampaignEmptyState
                emoji="🕵️"
                title={`No results for “${query.trim()}”`}
                description="Check the spelling, or try a draft name."
                actionLabel="Clear search"
                onAction={clearSearch}
              />
            ) : (
              <CampaignEmptyState
                emoji="📝"
                title="No saved drafts yet"
                description="Start a campaign and it saves itself here as you go."
              />
            ))}
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
            ...dialogEnterSx,
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
