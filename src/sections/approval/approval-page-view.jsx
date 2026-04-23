import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  Box,
  Stack,
  Dialog,
  Button,
  Avatar,
  Container,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  DialogContent,
  Popover,
  Link,
  Collapse,
  TextField,
  IconButton,
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';

import axiosInstance, { endpoints } from 'src/utils/axios';
import {
  formatNumber,
  extractUsernameFromProfileLink,
  createSocialProfileUrl,
} from 'src/utils/media-kit-utils';
import { useResponsive } from 'src/hooks/use-responsive';
import Iconify from 'src/components/iconify';
import CampaignDetailView from 'src/sections/campaign/discover/admin/view/campaign-detail-view';

/** Shared look: compact modal-like note blocks */
const approvalCommentSurfaceSx = {
  p: 0.75,
  borderRadius: '8px',
  bgcolor: '#FFFFFF',
  border: '1px solid #EBEBEB',
};

const approvalCommentTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    fontFamily: '"Inter Display", Inter, sans-serif',
    fontSize: '0.78rem',
    lineHeight: 1.4,
    bgcolor: '#FFFFFF',
    borderRadius: '8px',
    '& fieldset': {
      borderColor: '#E7E7E7',
    },
    '&:hover fieldset': {
      borderColor: '#D1D1D6',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#b8bcc4',
      borderWidth: 1,
    },
  },
  '& .MuiOutlinedInput-input': {
    py: 0.55,
  },
  '& .MuiOutlinedInput-input::placeholder': {
    color: '#8E8E93',
    opacity: 1,
    fontSize: '0.74rem',
  },
};

const approvalAddCommentButtonSx = {
  alignSelf: 'flex-start',
  mt: 0.125,
  color: '#1340FF',
  border: '1px solid #E7E7E7',
  boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
  bgcolor: '#fff',
  fontWeight: 700,
  textTransform: 'none',
  borderRadius: 0.75,
  px: 1.15,
  py: 0.45,
  fontSize: '0.68rem',
  minHeight: 28,
  letterSpacing: 0.02,
  gap: 0.35,
  '& .MuiButton-startIcon': { mr: 0.35 },
  '&:hover': {
    bgcolor: 'rgba(19, 64, 255, 0.06)',
    borderColor: '#E7E7E7',
    boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
  },
};

const approvalSaveCancelStackSx = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 0.75,
  pt: 0.25,
};

const approvalPrimaryButtonSx = {
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '0.68rem',
  borderRadius: 0.75,
  px: 1.35,
  py: 0.45,
  minHeight: 28,
  bgcolor: '#1340FF',
  color: '#fff',
  boxShadow: '0px -2px 0px 0px #0d2eb8 inset',
  '&:hover': {
    bgcolor: '#1036d6',
    boxShadow: '0px -2px 0px 0px #0d2eb8 inset',
  },
  '&:disabled': {
    bgcolor: '#B4B4B8',
    color: '#fff',
    boxShadow: 'none',
  },
};

const approvalSecondaryButtonSx = {
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.68rem',
  borderRadius: 0.75,
  px: 1.15,
  py: 0.45,
  minHeight: 28,
  color: '#636366',
  border: '1px solid #E7E7E7',
  bgcolor: '#fff',
  boxShadow: '0px -2px 0px 0px #EBEBEB inset',
  '&:hover': {
    bgcolor: '#fafafa',
    borderColor: '#E7E7E7',
  },
};

const approvalNoteLabelSx = {
  fontWeight: 600,
  fontSize: '0.68rem',
  letterSpacing: 0.01,
  color: '#636366',
};

const ApprovalPageView = () => {
  const { token } = useParams();
  const smDown = useResponsive('down', 'sm');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  // Track local action state per creator: { [pitchId]: 'PENDING' | 'APPROVED' | 'REJECTED' }
  const [creatorStatuses, setCreatorStatuses] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [allActioned, setAllActioned] = useState(false);
  const [undoStates, setUndoStates] = useState({});
  const undoTimeoutsRef = useRef({});
  const undoIntervalsRef = useRef({});

  const [mobileSectionOpen, setMobileSectionOpen] = useState({
    pending: true,
    approved: true,
    rejected: true,
  });

  /** Optional note for the client — keyed by pitchId */
  const [commentDrafts, setCommentDrafts] = useState({});
  const commentDraftsRef = useRef({});
  /** Show inline editor after action when no comment saved yet */
  const [addingCommentPitchId, setAddingCommentPitchId] = useState(null);
  const [commentSaving, setCommentSaving] = useState({});
  const [commentDeleting, setCommentDeleting] = useState({});
  const [desktopNotePopover, setDesktopNotePopover] = useState({
    open: false,
    pitchId: null,
    anchorEl: null,
  });

  useEffect(() => {
    commentDraftsRef.current = commentDrafts;
  }, [commentDrafts]);

  const fetchApprovalRequest = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoints.approvalRequests.get(token));
      setData(res.data);

      const initialStatuses = {};
      const initialComments = {};
      res.data.creators.forEach((c) => {
        initialStatuses[c.pitchId] = c.status;
        initialComments[c.pitchId] = c.comment ?? '';
      });
      setCreatorStatuses(initialStatuses);
      setCommentDrafts(initialComments);
      commentDraftsRef.current = initialComments;

      const allDone = res.data.creators.every((c) => c.status !== 'PENDING');
      setAllActioned(allDone);
    } catch (err) {
      if (err?.statusCode === 410 || err?.message?.includes('expired')) {
        setError('expired');
      } else {
        setError('invalid');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchApprovalRequest();
  }, [fetchApprovalRequest]);

  const clearUndoTimers = useCallback((pitchId) => {
    if (undoTimeoutsRef.current[pitchId]) {
      clearTimeout(undoTimeoutsRef.current[pitchId]);
      delete undoTimeoutsRef.current[pitchId];
    }
    if (undoIntervalsRef.current[pitchId]) {
      clearInterval(undoIntervalsRef.current[pitchId]);
      delete undoIntervalsRef.current[pitchId];
    }
  }, []);

  useEffect(() => () => {
    Object.keys(undoTimeoutsRef.current).forEach((pitchId) => clearUndoTimers(pitchId));
  }, [clearUndoTimers]);

  const commitAction = useCallback(async (pitchId, action) => {
    setActionLoading((prev) => ({ ...prev, [pitchId]: true }));
    try {
      const trimmed = (commentDraftsRef.current[pitchId] || '').trim();
      const body = { action };
      if (trimmed) body.comment = trimmed;

      await axiosInstance.patch(endpoints.approvalRequests.action(token, pitchId), body);

      if (trimmed) {
        setData((prev) => {
          if (!prev?.creators) return prev;
          return {
            ...prev,
            creators: prev.creators.map((c) =>
              c.pitchId === pitchId ? { ...c, comment: trimmed } : c
            ),
          };
        });
      }
    } catch (err) {
      enqueueSnackbar(err?.message || 'Action failed', { variant: 'error' });
      // If API fails, roll back local optimistic status.
      setCreatorStatuses((prev) => ({ ...prev, [pitchId]: 'PENDING' }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [pitchId]: false }));
      setUndoStates((prev) => {
        const next = { ...prev };
        delete next[pitchId];
        return next;
      });
      clearUndoTimers(pitchId);
    }
  }, [token, clearUndoTimers]);

  const saveCommentAfterAction = useCallback(
    async (pitchId) => {
      const trimmed = (commentDraftsRef.current[pitchId] || '').trim();
      if (!trimmed) {
        enqueueSnackbar('Enter a comment for the client', { variant: 'warning' });
        return false;
      }
      const localStatus = creatorStatuses[pitchId];
      const action = localStatus === 'APPROVED' ? 'approve' : 'reject';
      setCommentSaving((prev) => ({ ...prev, [pitchId]: true }));
      try {
        await axiosInstance.patch(endpoints.approvalRequests.action(token, pitchId), {
          action,
          comment: trimmed,
        });
        setData((prev) => {
          if (!prev?.creators) return prev;
          return {
            ...prev,
            creators: prev.creators.map((c) =>
              c.pitchId === pitchId ? { ...c, comment: trimmed } : c
            ),
          };
        });
        setAddingCommentPitchId(null);
        enqueueSnackbar('Comment saved', { variant: 'success' });
        return true;
      } catch (err) {
        enqueueSnackbar(err?.message || 'Could not save comment', { variant: 'error' });
        return false;
      } finally {
        setCommentSaving((prev) => ({ ...prev, [pitchId]: false }));
      }
    },
    [token, creatorStatuses]
  );

  const openDesktopNotePopover = (pitchId, anchorEl) => {
    setDesktopNotePopover({ open: true, pitchId, anchorEl });
  };

  const closeDesktopNotePopover = () => {
    setDesktopNotePopover({ open: false, pitchId: null, anchorEl: null });
  };

  const saveDesktopNote = async () => {
    const pitchId = desktopNotePopover.pitchId;
    if (!pitchId) return;
    const saved = await saveCommentAfterAction(pitchId);
    if (saved) closeDesktopNotePopover();
  };

  const deleteBrandNote = useCallback(
    async (pitchId) => {
      const localStatus = creatorStatuses[pitchId];
      if (localStatus !== 'APPROVED' && localStatus !== 'REJECTED') return;
      const action = localStatus === 'APPROVED' ? 'approve' : 'reject';
      setCommentDeleting((prev) => ({ ...prev, [pitchId]: true }));
      try {
        await axiosInstance.patch(endpoints.approvalRequests.action(token, pitchId), {
          action,
          clearComment: true,
        });
        setData((prev) => {
          if (!prev?.creators) return prev;
          return {
            ...prev,
            creators: prev.creators.map((c) =>
              c.pitchId === pitchId ? { ...c, comment: null } : c
            ),
          };
        });
        setCommentDrafts((prev) => {
          const next = { ...prev, [pitchId]: '' };
          commentDraftsRef.current = next;
          return next;
        });
        setAddingCommentPitchId((prev) => (prev === pitchId ? null : prev));
        setDesktopNotePopover({ open: false, pitchId: null, anchorEl: null });
        enqueueSnackbar('Note removed', { variant: 'success' });
      } catch (err) {
        enqueueSnackbar(err?.message || 'Could not remove note', { variant: 'error' });
      } finally {
        setCommentDeleting((prev) => ({ ...prev, [pitchId]: false }));
      }
    },
    [token, creatorStatuses]
  );

  const handleAction = (pitchId, action) => {
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const undoMs = 5000;
    const startedAt = Date.now();

    // Optimistically reflect the selected action immediately.
    setCreatorStatuses((prev) => ({ ...prev, [pitchId]: newStatus }));
    clearUndoTimers(pitchId);
    setUndoStates((prev) => ({
      ...prev,
      [pitchId]: { action, progress: 100 },
    }));

    undoIntervalsRef.current[pitchId] = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.max(0, 100 - (elapsed / undoMs) * 100);
      setUndoStates((prev) => ({
        ...prev,
        [pitchId]: prev[pitchId] ? { ...prev[pitchId], progress: nextProgress } : prev[pitchId],
      }));
    }, 100);

    undoTimeoutsRef.current[pitchId] = setTimeout(() => {
      commitAction(pitchId, action);
    }, undoMs);
  };

  const handleUndo = (pitchId) => {
    clearUndoTimers(pitchId);
    setCreatorStatuses((prev) => ({ ...prev, [pitchId]: 'PENDING' }));
    setUndoStates((prev) => {
      const next = { ...prev };
      delete next[pitchId];
      return next;
    });
  };

  useEffect(() => {
    if (!data?.creators?.length) return;
    const allDone = data.creators.every(
      (c) => {
        if (undoStates[c.pitchId]) return false;
        return (creatorStatuses[c.pitchId] || c.status) !== 'PENDING';
      }
    );
    setAllActioned(allDone);
  }, [creatorStatuses, data, undoStates]);


  const formatExpiryDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error === 'expired') {
    return (
      <Container maxWidth="sm" sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          This link has expired
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The approval link is no longer valid. Please contact the campaign manager to request a new
          link.
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Invalid link
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This approval link is invalid or has already been used.
        </Typography>
      </Container>
    );
  }

  const { campaign, creators, approverName, expiresAt } = data;

  const desktopPopoverPitchId = desktopNotePopover.pitchId;
  const desktopPopoverSavedComment =
    desktopPopoverPitchId &&
    data?.creators?.find((c) => c.pitchId === desktopPopoverPitchId)?.comment?.trim();

  const getEffectiveStatus = (pitchId, status) => creatorStatuses[pitchId] || status;

  const pendingEntries = creators.filter(
    (c) => getEffectiveStatus(c.pitchId, c.status) === 'PENDING'
  );
  const approvedEntries = creators.filter(
    (c) => getEffectiveStatus(c.pitchId, c.status) === 'APPROVED'
  );
  const rejectedEntries = creators.filter(
    (c) => getEffectiveStatus(c.pitchId, c.status) === 'REJECTED'
  );
  const pendingCount = pendingEntries.length;

  const getStatusChip = (status) => {
    const map = {
      PENDING: { label: 'PENDING REVIEW', color: '#FFC702', bg: '#fffbeb' },
      APPROVED: { label: 'APPROVED', color: '#1ABF66', bg: '#f0fdf4' },
      REJECTED: { label: 'REJECTED', color: '#FF4842', bg: '#fff5f5' },
    };
    const cfg = map[status] || map.PENDING;
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 1.2,
          py: 0.5,
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: cfg.color,
          border: `1px solid ${cfg.color}`,
          borderBottom: `3px solid ${cfg.color}`,
          borderRadius: 0.8,
          bgcolor: 'white',
          whiteSpace: 'nowrap',
        }}
      >
        {cfg.label}
      </Box>
    );
  };

  const getPitchDisplayValues = (pitch) => {
    const creator = pitch?.user?.creator;
    const igStats = creator?.instagramUser;
    const tkStats = creator?.tiktokUser;

    const followerCount =
      pitch?.followerCount ??
      creator?.manualFollowerCount ??
      igStats?.followers_count ??
      tkStats?.follower_count ??
      null;

    const tierName =
      creator?.creditTier?.name ??
      pitch?.creditTier?.name ??
      pitch?.tier?.name ??
      pitch?.tierName ??
      null;

    const credits =
      creator?.creditTier?.creditsPerVideo ??
      pitch?.creditTier?.creditsPerVideo ??
      pitch?.creditsPerVideo ??
      null;

    const hasFollowerValue =
      followerCount === 0 || (followerCount !== undefined && followerCount !== null && followerCount !== '');

    return {
      followerDisplay: hasFollowerValue ? formatNumber(Number(followerCount)) : '-',
      tierDisplay: tierName || '-',
      creditsDisplay: credits ?? '-',
    };
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fb' }}>
      <Box
        sx={{
          pointerEvents: 'none',
          userSelect: 'none',
          '& *': { pointerEvents: 'none !important' },
        }}
      >
        <CampaignDetailView
          id={campaign?.id}
          publicReadonly
          forcedTab="creator-master-list"
          publicApprovalEntries={creators}
        />
      </Box>

      <Dialog
        open
        fullWidth
        maxWidth="lg"
        disableEscapeKeyDown
        onClose={(event, reason) => {
          // Modal is intentionally not closable from backdrop/escape.
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'white',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          },
        }}
        BackdropProps={{
          sx: { bgcolor: 'rgba(10, 10, 12, 0.45)' },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Container maxWidth="lg" sx={{ py: 2 }}>
            <Paper
              elevation={0}
              sx={{
                px: 1.5,
                py: 1.5,
                mb: 1.25,
                borderRadius: '24px 24px 0 0',
                bgcolor: '#FFFFFF',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={
                      (campaign?.campaignBrief?.images &&
                        Array.isArray(campaign.campaignBrief.images) &&
                        campaign.campaignBrief.images[0]) ||
                      campaign?.brand?.logo ||
                      undefined
                    }
                    alt={campaign?.brand?.name || campaign?.name}
                    sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#E5E5EA' }}
                  >
                    {(campaign?.name || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ ml: 0.25 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: 'Instrument Serif, serif',
                        fontWeight: 550,
                        fontSize: { xs: '1.15rem', sm: '2.2rem' },
                        lineHeight: { xs: 1.15, sm: 1.1 },
                        whiteSpace: { xs: 'nowrap', sm: 'normal' },
                        overflow: { xs: 'hidden', sm: 'visible' },
                        textOverflow: { xs: 'ellipsis', sm: 'clip' },
                        maxWidth: { xs: 220, sm: 'none' },
                      }}
                    >
                      {campaign?.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#636366', fontSize: '0.9rem', mt: 0.2 }}
                    >
                      {campaign?.company?.name || campaign?.brand?.name || '-'}
                    </Typography>
                  </Box>
                </Stack>
                <Box sx={{ textAlign: 'right', ml: 2, mt: { xs: -0.5, sm: 0 }, alignSelf: 'flex-start' }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 500, color: '#636366', mb: 0, display: 'block' }}
                  >
                    {'Link Valid Until: '}
                    <Box component="span" sx={{ color: '#1340FF' }}>
                      {formatExpiryDate(expiresAt)}
                    </Box>
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {allActioned && (
              <Box
                sx={{
                  bgcolor: '#DAF5E4',
                  borderRadius: 1,
                  display: 'flex',
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: { xs: 3 },
                  py: 1,
                  mb: 1.5,
                }}
              >
                <Typography
                  sx={{
                    color: '#308862',
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1.35,
                  }}
                >
                  🎉 Congratulations, you&apos;ve reviewed all the creators sent to you!
                </Typography>
              </Box>
            )}

            {smDown ? (
              <Stack spacing={1}>
                {[
                  {
                    key: 'pending',
                    label: 'PENDING REVIEW',
                    color: '#FFC702',
                    entries: pendingEntries,
                  },
                  {
                    key: 'approved',
                    label: 'APPROVED',
                    color: '#1ABF66',
                    entries: approvedEntries,
                  },
                  {
                    key: 'rejected',
                    label: 'REJECTED',
                    color: '#FF4842',
                    entries: rejectedEntries,
                  },
                ]
                  .filter((section) => section.entries.length > 0)
                  .map((section) => {
                    const isExpanded = mobileSectionOpen[section.key] !== false;

                    return (
                    <Box key={section.key}>
                      <Box
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setMobileSectionOpen((prev) => ({
                            ...prev,
                            [section.key]: !prev[section.key],
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setMobileSectionOpen((prev) => ({
                              ...prev,
                              [section.key]: !prev[section.key],
                            }));
                          }
                        }}
                        sx={{
                          mb: isExpanded ? 1.5 : 0,
                          px: 1.2,
                          py: 0.7,
                          border: `1.5px solid ${section.color}`,
                          borderBottom: `2.5px solid ${section.color}`,
                          borderRadius: 1.2,
                          bgcolor: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minHeight: 0,
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:focus-visible': {
                            outline: `2px solid ${section.color}`,
                            outlineOffset: 2,
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: section.color,
                            fontSize: '0.78rem',
                            letterSpacing: 0.08,
                          }}
                        >
                          {section.label} ({section.entries.length})
                        </Typography>
                        <Iconify
                          icon="eva:arrow-ios-downward-fill"
                          width={22}
                          sx={{
                            color: '#221F20',
                            flexShrink: 0,
                            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </Box>

                      <Collapse
                        in={isExpanded}
                        timeout="auto"
                        unmountOnExit={false}
                        sx={{ m: 0, '& .MuiCollapse-wrapper': { m: 0 }, '& .MuiCollapse-wrapperInner': { m: 0 } }}
                      >
                      <Stack spacing={1.5}>
                        {section.entries.map(({ pitchId, status, pitch }) => {
                    const localStatus = creatorStatuses[pitchId] || status;
                    const isActioned = localStatus !== 'PENDING';
                    const isLoadingAction = actionLoading[pitchId];
                    const showUndo = Boolean(undoStates[pitchId]);

                    const user = pitch?.user;
                    const creator = user?.creator;
                    const igStats = creator?.instagramUser;
                    const tkStats = creator?.tiktokUser;
                    const { followerDisplay, tierDisplay, creditsDisplay } = getPitchDisplayValues(pitch);

                    const instagramProfileLink = creator?.instagramProfileLink;
                    const tiktokProfileLink = creator?.tiktokProfileLink;
                    const igUsername =
                      igStats?.username ||
                      extractUsernameFromProfileLink(instagramProfileLink);
                    const tkUsername =
                      tkStats?.username || extractUsernameFromProfileLink(tiktokProfileLink);
                    const igProfileHref =
                      createSocialProfileUrl(igUsername, 'instagram') || instagramProfileLink;
                    const tkProfileHref =
                      createSocialProfileUrl(tkUsername, 'tiktok') || tiktokProfileLink;

                    const handleSx = {
                      fontFamily: 'Inter Display, Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: '0.7rem',
                      lineHeight: 1.25,
                      letterSpacing: '0%',
                    };

                    const serverComment = data?.creators
                      ?.find((c) => c.pitchId === pitchId)
                      ?.comment?.trim();

                    return (
                      <Paper
                        key={pitchId}
                        elevation={0}
                        sx={{
                          boxSizing: 'border-box',
                          width: 323,
                          maxWidth: '100%',
                          mx: 'auto',
                          bgcolor: '#FFFFFF',
                          border: '1px solid #EBEBEB',
                          borderRadius: '8px',
                          p: '12px',
                          boxShadow: '0px -3px 0px 0px #EBEBEB inset',
                          minHeight: 80,
                          height: 'auto',
                        }}
                      >
                        <Stack spacing={1}>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
                          <Avatar
                            src={user?.photoURL}
                            alt={user?.name}
                            sx={{ width: 34, height: 34, fontSize: 11, flexShrink: 0 }}
                          >
                            {user?.name?.charAt(0).toUpperCase()}
                          </Avatar>

                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              sx={{
                                fontWeight: 500,
                                fontSize: '0.86rem',
                                lineHeight: 1.1,
                                color: '#221F20',
                              }}
                            >
                              {user?.name}
                            </Typography>
                            {(igUsername || tkUsername) && (
                              <Stack direction="row" spacing={1.1} alignItems="center">
                                {igUsername && (
                                  <Stack direction="row" spacing={0.35} alignItems="center">
                                    <Iconify icon="mdi:instagram" width={12} sx={{ color: '#8E8E93' }} />
                                    {igProfileHref ? (
                                      <Link
                                        href={igProfileHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        underline="hover"
                                        sx={{ ...handleSx, color: 'text.secondary' }}
                                      >
                                        {igUsername}
                                      </Link>
                                    ) : (
                                      <Typography color="text.secondary" sx={handleSx}>
                                        {igUsername}
                                      </Typography>
                                    )}
                                  </Stack>
                                )}
                                {tkUsername && (
                                  <Stack direction="row" spacing={0.35} alignItems="center">
                                    <Iconify icon="ic:baseline-tiktok" width={12} sx={{ color: '#8E8E93' }} />
                                    {tkProfileHref ? (
                                      <Link
                                        href={tkProfileHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        underline="hover"
                                        sx={{ ...handleSx, color: 'text.secondary' }}
                                      >
                                        {tkUsername}
                                      </Link>
                                    ) : (
                                      <Typography color="text.secondary" sx={handleSx}>
                                        {tkUsername}
                                      </Typography>
                                    )}
                                  </Stack>
                                )}
                              </Stack>
                            )}
                            <Typography sx={{ mt: 0.28, fontSize: '0.74rem', color: '#3A3A3C' }}>
                              {followerDisplay} Followers
                              <Box component="span" sx={{ mx: 1, color: '#D1D1D6' }}>|</Box>
                              {tierDisplay} ({creditsDisplay} Credits)
                            </Typography>
                          </Box>

                          {!showUndo && !isActioned && (
                            <Stack spacing={0.55} sx={{ minWidth: 78 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={isLoadingAction}
                                onClick={() => handleAction(pitchId, 'approve')}
                                sx={{
                                  color: '#1ABF66',
                                  border: '1px solid #E7E7E7',
                                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                  bgcolor: '#fff',
                                  fontWeight: 700,
                                  textTransform: 'none',
                                  borderRadius: 0.8,
                                  minWidth: 0,
                                  minHeight: 36,
                                  px: 1.25,
                                  pt: 0.4,
                                  pb: 0.62,
                                  fontSize: '0.88rem',
                                  lineHeight: 1.35,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {isLoadingAction ? <CircularProgress size={16} /> : 'Approve'}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={isLoadingAction}
                                onClick={() => handleAction(pitchId, 'reject')}
                                sx={{
                                  color: '#FF4842',
                                  border: '1px solid #E7E7E7',
                                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                  bgcolor: '#fff',
                                  fontWeight: 700,
                                  textTransform: 'none',
                                  borderRadius: 0.8,
                                  minWidth: 0,
                                  minHeight: 36,
                                  px: 1.25,
                                  pt: 0.4,
                                  pb: 0.62,
                                  fontSize: '0.88rem',
                                  lineHeight: 1.35,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {isLoadingAction ? <CircularProgress size={16} /> : 'Reject'}
                              </Button>
                            </Stack>
                          )}
                          {showUndo && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleUndo(pitchId)}
                              sx={{
                                position: 'relative',
                                overflow: 'hidden',
                                color: '#636366',
                                border: '1px solid #E7E7E7',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                bgcolor: '#fff',
                                fontWeight: 700,
                                textTransform: 'none',
                                borderRadius: 0.8,
                                minWidth: 0,
                                px: 1.2,
                                py: 0.5,
                                fontSize: '0.72rem',
                                lineHeight: 1,
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  inset: 0,
                                  background: `linear-gradient(90deg, rgba(19, 64, 255, 0.28) ${undoStates[pitchId]?.progress || 0}%, transparent ${undoStates[pitchId]?.progress || 0}%)`,
                                  zIndex: 0,
                                },
                                '& > span, & > div': { position: 'relative', zIndex: 1 },
                              }}
                            >
                              UNDO
                            </Button>
                          )}
                        </Stack>

                        {/* Note UI only after undo window ends — same time "Add note" is available */}
                        {isActioned && !showUndo && (
                          <Stack spacing={0.75} sx={{ pt: 0.125 }}>
                            {serverComment ? (
                              <Box
                                sx={{
                                  ...approvalCommentSurfaceSx,
                                  p: 1,
                                }}
                              >
                                <Stack
                                  direction="row"
                                  alignItems="flex-start"
                                  justifyContent="space-between"
                                  spacing={0.5}
                                  sx={{ mb: 0.5 }}
                                >
                                  <Stack direction="row" alignItems="flex-start" spacing={0.5} sx={{ minWidth: 0 }}>
                                    <Iconify
                                      icon="solar:check-circle-bold"
                                      width={14}
                                      sx={{ color: '#1ABF66', mt: 0.1, flexShrink: 0 }}
                                    />
                                    <Typography sx={approvalNoteLabelSx}>
                                      Your note to the brand
                                    </Typography>
                                  </Stack>
                                  <IconButton
                                    size="small"
                                    aria-label="Delete note"
                                    disabled={commentDeleting[pitchId]}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteBrandNote(pitchId);
                                    }}
                                    sx={{
                                      color: '#8E8E93',
                                      p: 0.25,
                                      mt: -0.25,
                                      mr: -0.25,
                                      flexShrink: 0,
                                      '&:hover': { color: '#FF4842', bgcolor: 'rgba(255, 72, 66, 0.08)' },
                                    }}
                                  >
                                    {commentDeleting[pitchId] ? (
                                      <CircularProgress size={16} sx={{ color: 'inherit' }} />
                                    ) : (
                                      <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                                    )}
                                  </IconButton>
                                </Stack>
                                <Typography
                                  sx={{
                                    fontSize: '0.74rem',
                                    lineHeight: 1.4,
                                    color: '#221F20',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    pl: 0.125,
                                  }}
                                >
                                  {serverComment}
                                </Typography>
                              </Box>
                            ) : addingCommentPitchId === pitchId ? (
                              <Box sx={approvalCommentSurfaceSx}>
                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.65 }}>
                                  <Iconify icon="solar:pen-bold" width={14} sx={{ color: '#1340FF' }} />
                                  <Typography sx={approvalNoteLabelSx}>
                                    Add a note for the brand
                                  </Typography>
                                </Stack>
                                <TextField
                                  fullWidth
                                  size="small"
                                  multiline
                                  minRows={1}
                                  maxRows={5}
                                  placeholder="Short note for the brand (optional)"
                                  value={commentDrafts[pitchId] ?? ''}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setCommentDrafts((prev) => {
                                      const next = { ...prev, [pitchId]: v };
                                      commentDraftsRef.current = next;
                                      return next;
                                    });
                                  }}
                                  sx={approvalCommentTextFieldSx}
                                />
                                <Stack sx={approvalSaveCancelStackSx}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    disableElevation
                                    disabled={commentSaving[pitchId]}
                                    onClick={() => saveCommentAfterAction(pitchId)}
                                    sx={approvalPrimaryButtonSx}
                                  >
                                    {commentSaving[pitchId] ? (
                                      <CircularProgress size={14} sx={{ color: '#fff' }} />
                                    ) : (
                                      'Save'
                                    )}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    disableElevation
                                    onClick={() => setAddingCommentPitchId(null)}
                                    sx={approvalSecondaryButtonSx}
                                  >
                                    Cancel
                                  </Button>
                                </Stack>
                              </Box>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Iconify icon="solar:chat-round-line-bold" width={14} />}
                                onClick={() => setAddingCommentPitchId(pitchId)}
                                sx={approvalAddCommentButtonSx}
                              >
                                Add note for the brand
                              </Button>
                            )}
                          </Stack>
                        )}
                        </Stack>
                      </Paper>
                    );
                  })}
                      </Stack>
                      </Collapse>
                    </Box>
                    );
                  })}
              </Stack>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '0 0 24px 24px',
                  border: 'none',
                  overflow: 'hidden',
                  bgcolor: 'transparent',
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {['Creator', 'Followers', 'Tier', 'Credits', 'Status', ''].map((header) => (
                          <TableCell
                            key={header}
                            sx={{
                              py: 1,
                              px: 2,
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              color: '#221f20',
                              bgcolor: '#f5f5f5',
                              whiteSpace: 'nowrap',
                              borderBottom: 'none',
                              ...(header === 'Creator' ? { borderRadius: '10px 0 0 10px' } : {}),
                              ...(header === '' ? { borderRadius: '0 10px 10px 0' } : {}),
                            }}
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {creators.map(({ pitchId, status, pitch }) => {
                        const localStatus = creatorStatuses[pitchId] || status;
                        const isActioned = localStatus !== 'PENDING';
                        const isLoadingAction = actionLoading[pitchId];
                        const showUndo = Boolean(undoStates[pitchId]);

                        const user = pitch?.user;
                        const creator = user?.creator;
                        const igStats = creator?.instagramUser;
                        const tkStats = creator?.tiktokUser;
                        const { followerDisplay, tierDisplay, creditsDisplay } = getPitchDisplayValues(pitch);

                        const instagramProfileLink = creator?.instagramProfileLink;
                        const tiktokProfileLink = creator?.tiktokProfileLink;
                        const igUsername =
                          igStats?.username ||
                          extractUsernameFromProfileLink(instagramProfileLink);
                        const tkUsername =
                          tkStats?.username || extractUsernameFromProfileLink(tiktokProfileLink);
                        const igProfileHref =
                          createSocialProfileUrl(igUsername, 'instagram') || instagramProfileLink;
                        const tkProfileHref =
                          createSocialProfileUrl(tkUsername, 'tiktok') || tiktokProfileLink;

                        const desktopHandleSx = {
                          fontFamily: 'Inter Display, Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '18px',
                          letterSpacing: '0%',
                        };

                        const serverCommentDesktop = data?.creators
                          ?.find((c) => c.pitchId === pitchId)
                          ?.comment?.trim();
                        return (
                          <TableRow
                            key={pitchId}
                            sx={{
                              '& td': { borderBottom: '1px solid', borderColor: 'divider' },
                              bgcolor: 'transparent',
                            }}
                          >
                            <TableCell sx={{ px: 2 }}>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar
                                  src={user?.photoURL}
                                  alt={user?.name}
                                  sx={{ width: 36, height: 36, fontSize: 14 }}
                                >
                                  {user?.name?.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>
                                    {user?.name}
                                  </Typography>
                                  {(igUsername || tkUsername) && (
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      spacing={1}
                                      sx={{ mt: 0.25 }}
                                    >
                                      <Stack direction="row" spacing={1.1} alignItems="center">
                                        {igUsername && (
                                          <Stack direction="row" spacing={0.35} alignItems="center">
                                            <Iconify icon="mdi:instagram" width={14} sx={{ color: '#8E8E93' }} />
                                            {igProfileHref ? (
                                              <Link
                                                href={igProfileHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                underline="hover"
                                                sx={{ ...desktopHandleSx, color: 'text.secondary' }}
                                              >
                                                {igUsername}
                                              </Link>
                                            ) : (
                                              <Typography color="text.secondary" sx={desktopHandleSx}>
                                                {igUsername}
                                              </Typography>
                                            )}
                                          </Stack>
                                        )}
                                        {tkUsername && (
                                          <Stack direction="row" spacing={0.35} alignItems="center">
                                            <Iconify icon="ic:baseline-tiktok" width={14} sx={{ color: '#8E8E93' }} />
                                            {tkProfileHref ? (
                                              <Link
                                                href={tkProfileHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                underline="hover"
                                                sx={{ ...desktopHandleSx, color: 'text.secondary' }}
                                              >
                                                {tkUsername}
                                              </Link>
                                            ) : (
                                              <Typography color="text.secondary" sx={desktopHandleSx}>
                                                {tkUsername}
                                              </Typography>
                                            )}
                                          </Stack>
                                        )}
                                      </Stack>
                                    </Stack>
                                  )}
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ px: 2 }}>
                              <Typography sx={{ fontSize: '0.98rem' }}>
                                {followerDisplay}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ px: 2 }}>
                              <Typography sx={{ fontSize: '0.98rem' }}>{tierDisplay}</Typography>
                            </TableCell>
                            <TableCell sx={{ px: 2 }}>
                              <Typography sx={{ fontSize: '0.98rem' }}>
                                {creditsDisplay}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ px: 2 }}>{getStatusChip(localStatus)}</TableCell>
                            <TableCell sx={{ px: 2 }}>
                              {isActioned && !showUndo ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Iconify icon="solar:chat-round-line-bold" width={14} />}
                                  onClick={(e) => openDesktopNotePopover(pitchId, e.currentTarget)}
                                  sx={{ ...approvalAddCommentButtonSx, mt: 0, flexShrink: 0 }}
                                >
                                  {serverCommentDesktop ? 'View note' : 'Add note'}
                                </Button>
                              ) : !showUndo ? (
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={isLoadingAction}
                                    onClick={() => handleAction(pitchId, 'approve')}
                                    sx={{
                                      color: '#1ABF66',
                                      border: '1px solid #E7E7E7',
                                      boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                      bgcolor: '#fff',
                                      fontWeight: 700,
                                      textTransform: 'none',
                                      borderRadius: 0.8,
                                      minWidth: 0,
                                      minHeight: 36,
                                      px: 1.25,
                                      pt: 0.4,
                                      pb: 0.62,
                                      fontSize: '0.88rem',
                                      lineHeight: 1.35,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      '&:hover': {
                                        bgcolor: 'rgba(26,191,102,0.08)',
                                        border: '1px solid #E7E7E7',
                                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                      },
                                    }}
                                  >
                                    {isLoadingAction ? <CircularProgress size={16} /> : 'Approve'}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={isLoadingAction}
                                    onClick={() => handleAction(pitchId, 'reject')}
                                    sx={{
                                      color: '#FF4842',
                                      border: '1px solid #E7E7E7',
                                      boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                      bgcolor: '#fff',
                                      fontWeight: 700,
                                      textTransform: 'none',
                                      borderRadius: 0.8,
                                      minWidth: 0,
                                      minHeight: 36,
                                      px: 1.25,
                                      pt: 0.4,
                                      pb: 0.62,
                                      fontSize: '0.88rem',
                                      lineHeight: 1.35,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      '&:hover': {
                                        bgcolor: 'rgba(255,72,66,0.08)',
                                        border: '1px solid #E7E7E7',
                                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                      },
                                    }}
                                  >
                                    {isLoadingAction ? <CircularProgress size={16} /> : 'Reject'}
                                  </Button>
                                </Stack>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleUndo(pitchId)}
                                  sx={{
                                    position: 'relative',
                                    overflow: 'hidden',
                                    color: '#636366',
                                    border: '1px solid #E7E7E7',
                                    boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                    bgcolor: '#fff',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderRadius: 0.8,
                                    minWidth: 0,
                                    px: 1.2,
                                    py: 0.5,
                                    fontSize: '0.72rem',
                                    lineHeight: 1,
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      inset: 0,
                                      background: `linear-gradient(90deg, rgba(19, 64, 255, 0.28) ${undoStates[pitchId]?.progress || 0}%, transparent ${undoStates[pitchId]?.progress || 0}%)`,
                                      zIndex: 0,
                                    },
                                    '& > span, & > div': { position: 'relative', zIndex: 1 },
                                  }}
                                >
                                  UNDO
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {!smDown && (
              <Popover
                open={desktopNotePopover.open}
                anchorEl={desktopNotePopover.anchorEl}
                onClose={closeDesktopNotePopover}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                PaperProps={{
                  sx: {
                    borderRadius: 1.5,
                    p: 0.25,
                    mt: 0.75,
                    width: 360,
                    maxWidth: 'calc(100vw - 24px)',
                    boxShadow: '0 16px 32px rgba(0,0,0,0.14)',
                  },
                }}
              >
                <DialogContent sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontFamily: 'Instrument Serif, serif',
                          fontWeight: 550,
                          fontSize: '1.15rem',
                          lineHeight: 1.15,
                        }}
                      >
                        Note for the brand
                      </Typography>
                      {desktopPopoverSavedComment && desktopPopoverPitchId && (
                        <IconButton
                          size="small"
                          aria-label="Delete note"
                          disabled={commentDeleting[desktopPopoverPitchId]}
                          onClick={() => deleteBrandNote(desktopPopoverPitchId)}
                          sx={{
                            color: '#8E8E93',
                            p: 0.35,
                            mt: -0.25,
                            flexShrink: 0,
                            '&:hover': { color: '#FF4842', bgcolor: 'rgba(255, 72, 66, 0.08)' },
                          }}
                        >
                          {commentDeleting[desktopPopoverPitchId] ? (
                            <CircularProgress size={16} sx={{ color: 'inherit' }} />
                          ) : (
                            <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                          )}
                        </IconButton>
                      )}
                    </Stack>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      maxRows={6}
                      placeholder="Short note for the brand (optional)"
                      value={
                        desktopNotePopover.pitchId
                          ? (commentDrafts[desktopNotePopover.pitchId] ?? '')
                          : ''
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        const pitchId = desktopNotePopover.pitchId;
                        if (!pitchId) return;
                        setCommentDrafts((prev) => {
                          const next = { ...prev, [pitchId]: v };
                          commentDraftsRef.current = next;
                          return next;
                        });
                      }}
                      sx={approvalCommentTextFieldSx}
                    />
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={closeDesktopNotePopover}
                        sx={approvalSecondaryButtonSx}
                      >
                        Close
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        disableElevation
                        disabled={
                          !desktopNotePopover.pitchId || commentSaving[desktopNotePopover.pitchId]
                        }
                        onClick={saveDesktopNote}
                        sx={approvalPrimaryButtonSx}
                      >
                        {desktopNotePopover.pitchId && commentSaving[desktopNotePopover.pitchId] ? (
                          <CircularProgress size={14} sx={{ color: '#fff' }} />
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </Stack>
                  </Stack>
                </DialogContent>
              </Popover>
            )}

          </Container>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ApprovalPageView;
